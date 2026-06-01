import { builtinResMgr, Button, Color, Label, Layers, Node, Sprite, SpriteFrame, UIOpacity, UITransform, Vec3 } from 'cc';
import { UIColors } from './UITheme';

type TextAlign = 'left' | 'center' | 'right';
type VerticalAlign = 'top' | 'center' | 'bottom';

interface BaseNodeOptions {
  name: string;
  width: number;
  height: number;
  x?: number;
  y?: number;
}

interface SolidOptions extends BaseNodeOptions {
  color: Color;
  opacity?: number;
}

interface PanelOptions extends BaseNodeOptions {
  fill: Color;
  stroke?: Color;
  shadow?: Color;
  border?: number;
  opacity?: number;
  highlight?: boolean;
}

interface LabelOptions extends BaseNodeOptions {
  text: string;
  fontSize: number;
  color?: Color;
  align?: TextAlign;
  verticalAlign?: VerticalAlign;
  outlineColor?: Color;
  outlineWidth?: number;
  bold?: boolean;
  wrap?: boolean;
  shrink?: boolean;
}

interface ButtonOptions extends PanelOptions {
  text: string;
  fontSize?: number;
  textColor?: Color;
  onClick?: () => void;
  disabled?: boolean;
}

interface ProgressBarOptions extends BaseNodeOptions {
  value: number;
  max: number;
  fill: Color;
  background?: Color;
  label?: string;
}

interface IconBadgeOptions extends BaseNodeOptions {
  text: string;
  fill: Color;
  textColor?: Color;
  fontSize?: number;
  stroke?: Color;
}

export class UIShapeFactory {
  public static createNode(parent: Node, options: BaseNodeOptions): Node {
    const node = new Node(options.name);
    node.layer = Layers.Enum.UI_2D;
    node.parent = parent;
    node.setPosition(options.x ?? 0, options.y ?? 0, 0);
    const transform = node.addComponent(UITransform);
    transform.setContentSize(options.width, options.height);
    return node;
  }

  public static addSolid(parent: Node, options: SolidOptions): Node {
    const node = this.createNode(parent, options);
    const sprite = node.addComponent(Sprite);
    const frame = this.getBuiltinSpriteFrame();
    if (frame) {
      sprite.spriteFrame = frame;
    }
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    sprite.color = options.color;
    this.setOpacity(node, options.opacity ?? 255);
    return node;
  }

  public static addPanel(parent: Node, options: PanelOptions): Node {
    const node = this.createNode(parent, options);
    const border = options.border ?? 6;
    const stroke = options.stroke ?? UIColors.woodStroke;
    const shadow = options.shadow ?? new Color(0, 0, 0, 255);

    this.addSolid(node, {
      name: `${options.name}_Shadow`,
      width: options.width,
      height: options.height,
      x: 0,
      y: -7,
      color: shadow,
      opacity: 105,
    });
    this.addSolid(node, {
      name: `${options.name}_Stroke`,
      width: options.width,
      height: options.height,
      color: stroke,
    });
    this.addSolid(node, {
      name: `${options.name}_Fill`,
      width: Math.max(4, options.width - border * 2),
      height: Math.max(4, options.height - border * 2),
      color: options.fill,
      opacity: options.opacity ?? 255,
    });

    if (options.highlight !== false) {
      this.addSolid(node, {
        name: `${options.name}_TopHighlight`,
        width: Math.max(8, options.width - border * 5),
        height: Math.max(3, Math.min(10, options.height * 0.08)),
        y: options.height * 0.5 - border * 2,
        color: UIColors.parchmentLight,
        opacity: 65,
      });
    }

    return node;
  }

  public static addText(parent: Node, options: LabelOptions): Label {
    const node = this.createNode(parent, options);
    const label = node.addComponent(Label);
    label.string = options.text;
    label.fontSize = options.fontSize;
    label.lineHeight = Math.floor(options.fontSize * 1.16);
    label.color = options.color ?? UIColors.whiteText;
    label.useSystemFont = true;
    label.fontFamily = 'sans-serif';
    label.isBold = options.bold ?? true;
    label.enableWrapText = options.wrap ?? false;
    label.overflow = options.shrink === false ? Label.Overflow.CLAMP : Label.Overflow.SHRINK;
    label.horizontalAlign = this.toHorizontalAlign(options.align ?? 'center');
    label.verticalAlign = this.toVerticalAlign(options.verticalAlign ?? 'center');
    if (options.outlineWidth && options.outlineWidth > 0) {
      label.enableOutline = true;
      label.outlineColor = options.outlineColor ?? UIColors.woodStroke;
      label.outlineWidth = options.outlineWidth;
    }
    return label;
  }

  public static addButton(parent: Node, options: ButtonOptions): Node {
    const buttonNode = this.addPanel(parent, {
      ...options,
      fill: options.disabled ? UIColors.disabled : options.fill,
      opacity: options.disabled ? 175 : options.opacity,
      highlight: options.highlight,
    });
    const button = buttonNode.addComponent(Button);
    button.target = buttonNode;
    button.transition = Button.Transition.SCALE;
    button.duration = 0.08;
    button.zoomScale = 0.96;
    button.interactable = !options.disabled;
    if (options.onClick && !options.disabled) {
      buttonNode.on(Button.EventType.CLICK, options.onClick);
    }
    this.addText(buttonNode, {
      name: `Label_${options.name}`,
      text: options.text,
      width: Math.max(10, options.width - 28),
      height: Math.max(10, options.height - 16),
      fontSize: options.fontSize ?? 38,
      color: options.textColor ?? UIColors.whiteText,
      outlineColor: UIColors.woodStroke,
      outlineWidth: 4,
      wrap: true,
    });
    return buttonNode;
  }

  public static addIconBadge(parent: Node, options: IconBadgeOptions): Node {
    const node = this.addPanel(parent, {
      name: options.name,
      width: options.width,
      height: options.height,
      x: options.x,
      y: options.y,
      fill: options.fill,
      stroke: options.stroke ?? UIColors.woodStroke,
      border: 4,
      highlight: true,
    });
    this.addText(node, {
      name: `Label_${options.name}`,
      text: options.text,
      width: options.width - 8,
      height: options.height - 8,
      fontSize: options.fontSize ?? Math.floor(options.height * 0.45),
      color: options.textColor ?? UIColors.whiteText,
      outlineColor: UIColors.woodStroke,
      outlineWidth: 2,
    });
    return node;
  }

  public static addProgressBar(parent: Node, options: ProgressBarOptions): Node {
    const node = this.createNode(parent, options);
    this.addPanel(node, {
      name: `${options.name}_Track`,
      width: options.width,
      height: options.height,
      fill: options.background ?? UIColors.darkPanel,
      stroke: UIColors.woodStroke,
      border: 4,
      highlight: false,
    });
    const ratio = options.max <= 0 ? 0 : Math.max(0, Math.min(1, options.value / options.max));
    const fillWidth = Math.max(0, (options.width - 10) * ratio);
    this.addSolid(node, {
      name: `${options.name}_Fill`,
      width: fillWidth,
      height: Math.max(2, options.height - 10),
      x: -options.width * 0.5 + 5 + fillWidth * 0.5,
      color: options.fill,
    });
    if (options.label) {
      this.addText(node, {
        name: `Label_${options.name}`,
        text: options.label,
        width: options.width,
        height: options.height,
        fontSize: Math.max(16, Math.floor(options.height * 0.58)),
        color: UIColors.whiteText,
        outlineColor: UIColors.woodStroke,
        outlineWidth: 2,
      });
    }
    return node;
  }

  public static addRedDot(parent: Node, x: number, y: number, text = '!'): Node {
    const node = this.addPanel(parent, {
      name: 'icon_red_dot',
      width: 34,
      height: 34,
      x,
      y,
      fill: UIColors.warningRed,
      stroke: UIColors.woodStroke,
      border: 3,
      highlight: false,
    });
    this.addText(node, {
      name: 'Label_icon_red_dot',
      text,
      width: 30,
      height: 30,
      fontSize: text.length > 1 ? 18 : 24,
      color: UIColors.whiteText,
      outlineWidth: 0,
    });
    return node;
  }

  public static addResourcePill(parent: Node, name: string, x: number, y: number, icon: string, value: string, color: Color, onPlus?: () => void): Node {
    const node = this.addPanel(parent, {
      name,
      width: 176,
      height: 56,
      x,
      y,
      fill: UIColors.darkPanel,
      stroke: UIColors.woodStroke,
      border: 5,
    });
    this.addIconBadge(node, {
      name: `${name}_Icon`,
      width: 50,
      height: 50,
      x: -63,
      text: icon,
      fill: color,
      fontSize: 22,
    });
    this.addText(node, {
      name: `Label_${name}`,
      text: value,
      width: 94,
      height: 46,
      x: 12,
      fontSize: 28,
      color: UIColors.whiteText,
      outlineColor: UIColors.woodStroke,
      outlineWidth: 3,
    });
    if (onPlus) {
      this.addButton(node, {
        name: `${name}_Plus`,
        width: 34,
        height: 34,
        x: 71,
        text: '+',
        fontSize: 24,
        fill: UIColors.woodLight,
        stroke: UIColors.woodStroke,
        border: 3,
        onClick: onPlus,
      });
    }
    return node;
  }

  public static addThinLine(parent: Node, name: string, width: number, x: number, y: number, color = UIColors.highlightGold, opacity = 170): Node {
    return this.addSolid(parent, { name, width, height: 3, x, y, color, opacity });
  }

  public static setOpacity(node: Node, opacity: number): void {
    const uiOpacity = node.getComponent(UIOpacity) ?? node.addComponent(UIOpacity);
    uiOpacity.opacity = Math.max(0, Math.min(255, opacity));
  }

  public static setAngle(node: Node, angle: number): void {
    node.angle = angle;
  }

  private static getBuiltinSpriteFrame(): SpriteFrame | null {
    return builtinResMgr.get<SpriteFrame>('builtin-2d-sprite') ?? null;
  }

  private static toHorizontalAlign(align: TextAlign): number {
    if (align === 'left') {
      return Label.HorizontalAlign.LEFT;
    }
    if (align === 'right') {
      return Label.HorizontalAlign.RIGHT;
    }
    return Label.HorizontalAlign.CENTER;
  }

  private static toVerticalAlign(align: VerticalAlign): number {
    if (align === 'top') {
      return Label.VerticalAlign.TOP;
    }
    if (align === 'bottom') {
      return Label.VerticalAlign.BOTTOM;
    }
    return Label.VerticalAlign.CENTER;
  }
}

