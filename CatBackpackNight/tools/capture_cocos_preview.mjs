import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import zlib from 'node:zlib';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultEdgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const args = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const [key, ...rest] = arg.replace(/^--/, '').split('=');
  return [key, rest.join('=') || 'true'];
}));

const url = args.url ?? 'http://localhost:7456';
const outputPath = path.resolve(projectRoot, args.out ?? 'tmp/qa_cocos_preview_cdp.png');
const width = Number(args.width ?? 750);
const height = Number(args.height ?? 1334);
const waitMs = Number(args['wait-ms'] ?? 12000);
const phoneCanvas = String(args['phone-canvas'] ?? 'false') === 'true';
const edgePath = process.env.EDGE_PATH ?? defaultEdgePath;
const clicks = String(args.clicks ?? '')
  .split(';')
  .map((entry) => entry.trim())
  .filter(Boolean)
  .map((entry) => {
    const [x, y, delayMs = 1000] = entry.split(',').map(Number);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      throw new Error(`Invalid click entry: ${entry}`);
    }
    return { x, y, delayMs };
  });
const probeNodes = String(args['probe-nodes'] ?? '')
  .split(',')
  .map((name) => name.trim())
  .filter(Boolean);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      server.close(() => resolve(address.port));
    });
  });
}

async function waitForJson(port, endpoint, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  let lastError = null;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}${endpoint}`);
      if (response.ok) {
        return await response.json();
      }
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await sleep(250);
  }
  throw lastError ?? new Error(`Timed out waiting for ${endpoint}`);
}

function connectCdp(webSocketUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(webSocketUrl);
    let id = 0;
    const pending = new Map();
    const eventWaiters = new Map();

    ws.addEventListener('open', () => {
      resolve({
        send(method, params = {}) {
          id += 1;
          ws.send(JSON.stringify({ id, method, params }));
          return new Promise((sendResolve, sendReject) => {
            pending.set(id, { resolve: sendResolve, reject: sendReject });
          });
        },
        waitForEvent(method, timeoutMs) {
          return new Promise((eventResolve, eventReject) => {
            const timer = setTimeout(() => {
              eventReject(new Error(`Timed out waiting for ${method}`));
            }, timeoutMs);
            eventWaiters.set(method, { resolve: eventResolve, timer });
          });
        },
        close() {
          ws.close();
        },
      });
    });

    ws.addEventListener('error', reject);
    ws.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.id && pending.has(message.id)) {
        const promise = pending.get(message.id);
        pending.delete(message.id);
        if (message.error) {
          promise.reject(new Error(message.error.message));
        } else {
          promise.resolve(message.result);
        }
        return;
      }

      const waiter = eventWaiters.get(message.method);
      if (waiter) {
        clearTimeout(waiter.timer);
        eventWaiters.delete(message.method);
        waiter.resolve(message.params);
      }
    });
  });
}

function readPngRgb(filePath) {
  const bytes = fs.readFileSync(filePath);
  if (bytes.length < 24 || bytes.toString('ascii', 1, 4) !== 'PNG') {
    throw new Error(`Invalid PNG: ${filePath}`);
  }

  const pngWidth = bytes.readUInt32BE(16);
  const pngHeight = bytes.readUInt32BE(20);
  let bitDepth = 0;
  let colorType = 0;
  const idatChunks = [];
  let offset = 8;

  while (offset + 12 <= bytes.length) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.toString('ascii', offset + 4, offset + 8);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    if (type === 'IHDR') {
      bitDepth = bytes[dataStart + 8];
      colorType = bytes[dataStart + 9];
    } else if (type === 'IDAT') {
      idatChunks.push(bytes.subarray(dataStart, dataEnd));
    } else if (type === 'IEND') {
      break;
    }
    offset = dataEnd + 4;
  }

  if (bitDepth !== 8 || ![2, 6].includes(colorType)) {
    throw new Error(`Unsupported screenshot PNG format: bitDepth=${bitDepth} colorType=${colorType}`);
  }

  const bytesPerPixel = colorType === 6 ? 4 : 3;
  const stride = pngWidth * bytesPerPixel;
  const inflated = zlib.inflateSync(Buffer.concat(idatChunks));
  const rgb = Buffer.alloc(pngHeight * stride);
  let sourceOffset = 0;

  for (let y = 0; y < pngHeight; y += 1) {
    const filter = inflated[sourceOffset];
    sourceOffset += 1;
    const rowOffset = y * stride;
    const previousRowOffset = rowOffset - stride;
    for (let x = 0; x < stride; x += 1) {
      const raw = inflated[sourceOffset + x];
      const left = x >= bytesPerPixel ? rgb[rowOffset + x - bytesPerPixel] : 0;
      const up = y > 0 ? rgb[previousRowOffset + x] : 0;
      const upLeft = y > 0 && x >= bytesPerPixel ? rgb[previousRowOffset + x - bytesPerPixel] : 0;
      let value = raw;
      if (filter === 1) {
        value = raw + left;
      } else if (filter === 2) {
        value = raw + up;
      } else if (filter === 3) {
        value = raw + Math.floor((left + up) / 2);
      } else if (filter === 4) {
        const p = left + up - upLeft;
        const pa = Math.abs(p - left);
        const pb = Math.abs(p - up);
        const pc = Math.abs(p - upLeft);
        value = raw + (pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft);
      } else if (filter !== 0) {
        throw new Error(`Unsupported PNG filter: ${filter}`);
      }
      rgb[rowOffset + x] = value & 0xff;
    }
    sourceOffset += stride;
  }

  return { width: pngWidth, height: pngHeight, bytesPerPixel, rgb };
}

function measureNonBlackContent(filePath) {
  const image = readPngRgb(filePath);
  let sampled = 0;
  let nonBlack = 0;
  const startY = Math.min(image.height - 1, 72);

  for (let y = startY; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const index = (y * image.width + x) * image.bytesPerPixel;
      const r = image.rgb[index];
      const g = image.rgb[index + 1];
      const b = image.rgb[index + 2];
      sampled += 1;
      if (r > 28 || g > 28 || b > 28) {
        nonBlack += 1;
      }
    }
  }

  return {
    width: image.width,
    height: image.height,
    nonBlackRatio: sampled === 0 ? 0 : Number((nonBlack / sampled).toFixed(4)),
  };
}

async function hidePreviewChrome(cdp) {
  await cdp.send('Runtime.evaluate', {
    awaitPromise: true,
    returnByValue: true,
    expression: `(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return { hidden: false, reason: 'canvas missing' };

      const style = document.createElement('style');
      style.id = 'xmbb-phone-canvas-capture-style';
      style.textContent = [
        'body { margin: 0 !important; background: #000 !important; overflow: hidden !important; }',
        'select, button, input, label { visibility: hidden !important; }',
        '[id*=fps], [class*=fps], [id*=FPS], [class*=FPS],',
        '[id*=stats], [class*=stats], [id*=Stats], [class*=Stats],',
        '[id*=debug], [class*=debug], [id*=Debug], [class*=Debug] { display: none !important; visibility: hidden !important; }'
      ].join('\\n');
      document.head.appendChild(style);

      for (const child of [...document.body.children]) {
        if (child !== canvas && !child.contains(canvas)) {
          child.style.visibility = 'hidden';
        }
      }

      return { hidden: true };
    })()`,
  });
}

async function disablePreviewFps(cdp) {
  await cdp.send('Runtime.evaluate', {
    awaitPromise: true,
    returnByValue: true,
    expression: `(() => {
      const canvas = document.querySelector('canvas');
      globalThis.cc?.profiler?.hideStats?.();
      globalThis.cc?.debug?.setDisplayStats?.(false);
      for (const element of [...document.querySelectorAll('*')]) {
        if (element === document.documentElement || element === document.body || element === canvas || element.contains(canvas)) {
          continue;
        }
        const label = String(element.textContent || element.id || element.className || '').toLowerCase();
        if (label.includes('framerate') || label.includes('fps:') || label.includes('draw call') || label.includes('batches')) {
          element.style.display = 'none';
          element.style.visibility = 'hidden';
          element.style.pointerEvents = 'none';
        }
      }
      return { hideStats: !!globalThis.cc?.profiler?.hideStats };
    })()`,
  });
}


async function ensurePortraitCanvas(cdp) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const state = await cdp.send('Runtime.evaluate', {
      returnByValue: true,
      expression: `(() => {
        const canvas = document.querySelector('canvas');
        return { width: canvas?.width ?? 0, height: canvas?.height ?? 0 };
      })()`,
    });
    const canvas = state.result.value;
    if (canvas.height >= canvas.width && canvas.height > 0) {
      return canvas;
    }

    await cdp.send('Runtime.evaluate', {
      awaitPromise: true,
      returnByValue: true,
      expression: `(() => {
        const controls = [...document.querySelectorAll('button, input, a')];
        const rotate = controls.find((element) => {
          const label = String(element.textContent || element.value || element.title || '').trim().toLowerCase();
          return label === 'rotate' || label.includes('rotate');
        });
        rotate?.click?.();
        return { clicked: !!rotate };
      })()`,
    });
    await sleep(1800);
  }

  const finalState = await cdp.send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const canvas = document.querySelector('canvas');
      return { width: canvas?.width ?? 0, height: canvas?.height ?? 0 };
    })()`,
  });
  return finalState.result.value;
}

async function captureCanvasOnly(cdp) {
  const box = await cdp.send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      return {
        x: Math.max(0, rect.left),
        y: Math.max(0, rect.top),
        width: Math.max(1, rect.width),
        height: Math.max(1, rect.height),
        scale: 1,
      };
    })()`,
  });

  const clip = box.result.value;
  if (!clip) {
    throw new Error('Cannot capture phone canvas because no canvas element was found.');
  }

  const screenshot = await cdp.send('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: false,
    clip,
  });
  return Buffer.from(screenshot.data, 'base64');
}

const port = await getFreePort();
const userDataDir = path.join(projectRoot, 'tmp', `.edge-cdp-${port}`);
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.mkdirSync(userDataDir, { recursive: true });

const browser = spawn(edgePath, [
  '--headless=new',
  '--disable-gpu',
  '--disable-dev-shm-usage',
  '--disable-background-networking',
  '--no-first-run',
  '--no-default-browser-check',
  '--hide-scrollbars',
  '--run-all-compositor-stages-before-draw',
  '--enable-unsafe-swiftshader',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${userDataDir}`,
  `--window-size=${width},${height}`,
  url,
], { stdio: 'ignore' });

try {
  const pages = await waitForJson(port, '/json/list');
  const page = pages.find((entry) => entry.type === 'page') ?? pages[0];
  if (!page?.webSocketDebuggerUrl) {
    throw new Error('No debuggable Edge page found.');
  }

  const cdp = await connectCdp(page.webSocketDebuggerUrl);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: true,
  });

  const load = cdp.waitForEvent('Page.loadEventFired', 15000).catch(() => null);
  await cdp.send('Page.navigate', { url });
  await load;
  await sleep(waitMs);

  if (phoneCanvas) {
    await ensurePortraitCanvas(cdp);
    await disablePreviewFps(cdp);
    await sleep(500);
    await hidePreviewChrome(cdp);
    await sleep(500);
  }

  for (const click of clicks) {
    await cdp.send('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: click.x,
      y: click.y,
      button: 'none',
    });
    await cdp.send('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      x: click.x,
      y: click.y,
      button: 'left',
      clickCount: 1,
    });
    await cdp.send('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      x: click.x,
      y: click.y,
      button: 'left',
      clickCount: 1,
    });
    await sleep(click.delayMs);
  }

  const runtimeState = await cdp.send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const canvas = document.querySelector('canvas');
      return {
        readyState: document.readyState,
        canvas: !!canvas,
        canvasWidth: canvas ? canvas.width : 0,
        canvasHeight: canvas ? canvas.height : 0,
        bodyText: document.body.innerText.slice(0, 300),
      };
    })()`,
  });

  let cocosProbe = null;
  if (probeNodes.length > 0) {
    const probeResult = await cdp.send('Runtime.evaluate', {
      returnByValue: true,
      expression: `(() => {
        const names = ${JSON.stringify(probeNodes)};
        const cc = globalThis.cc;
        const scene = cc?.director?.getScene?.();
        if (!cc || !scene) return { error: 'Cocos director scene is unavailable' };
        const matches = [];
        const visit = (node) => {
          if (names.includes(node.name)) {
            const ui = node.getComponent?.(cc.UITransform);
            const pos = node.position;
            matches.push({
              name: node.name,
              x: pos.x,
              y: pos.y,
              width: ui?.width ?? null,
              height: ui?.height ?? null,
              active: node.active,
              parent: node.parent?.name ?? null,
            });
          }
          for (const child of node.children ?? []) visit(child);
        };
        visit(scene);
        return { matches };
      })()`,
    });
    cocosProbe = probeResult.result.value;
  }

  if (phoneCanvas) {
    await disablePreviewFps(cdp);
    await hidePreviewChrome(cdp);
    await sleep(100);
    fs.writeFileSync(outputPath, await captureCanvasOnly(cdp));
  } else {
    const screenshot = await cdp.send('Page.captureScreenshot', {
      format: 'png',
      fromSurface: true,
      captureBeyondViewport: false,
    });
    fs.writeFileSync(outputPath, Buffer.from(screenshot.data, 'base64'));
  }

  const metrics = measureNonBlackContent(outputPath);
  const result = {
    output: path.relative(projectRoot, outputPath),
    url,
    runtimeState: runtimeState.result.value,
    cocosProbe,
    metrics,
  };
  console.log(JSON.stringify(result, null, 2));

  cdp.send('Browser.close').catch(() => null);
  cdp.close();

  if (metrics.nonBlackRatio < 0.01) {
    process.exitCode = 2;
  }
} finally {
  browser.kill();
}
