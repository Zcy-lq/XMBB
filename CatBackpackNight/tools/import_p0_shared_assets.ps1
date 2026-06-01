param(
  [switch]$Force,
  [string]$GeneratedDir = "C:\Users\Administrator\.codex\generated_images\019e739c-c97b-79f1-b746-de1f8dab0c51"
)

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$outDir = Join-Path $root "assets\textures\runtime"
$batchDir = Join-Path $root "tmp\asset_candidates\assetagent_p0_runtime_gap_20260524"
$sourceDir = Join-Path $batchDir "_sources"
New-Item -ItemType Directory -Force -Path $sourceDir | Out-Null

$generated = Get-ChildItem -Path $generatedDir -File -Filter "*.png" | Sort-Object LastWriteTime -Descending | Select-Object -First 5
if ($generated.Count -lt 5) {
  throw "Expected five freshly generated P0 shared asset images in $generatedDir"
}

$orderedSources = @($generated | Sort-Object LastWriteTime)
$imports = @(
  @{ id = "rt_btn_icon_round"; width = 160; height = 160; padding = 0.92 },
  @{ id = "rt_btn_red"; width = 320; height = 112; padding = 0.94 },
  @{ id = "rt_icon_paw"; width = 256; height = 256; padding = 0.88 },
  @{ id = "rt_icon_nav_backpack"; width = 256; height = 256; padding = 0.88 },
  @{ id = "rt_item_weapon_fishbone_bow"; width = 256; height = 256; padding = 0.92 }
)

function New-Canvas($width, $height) {
  $bitmap = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.Clear([System.Drawing.Color]::FromArgb(0, 0, 0, 0))
  return @($bitmap, $graphics)
}

function Load-ArgbBitmap($sourcePath) {
  $loaded = [System.Drawing.Bitmap]::FromFile($sourcePath)
  $bitmap = New-Object System.Drawing.Bitmap($loaded.Width, $loaded.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.Clear([System.Drawing.Color]::FromArgb(0, 0, 0, 0))
  $graphics.DrawImage($loaded, 0, 0, $loaded.Width, $loaded.Height)
  $graphics.Dispose()
  $loaded.Dispose()
  return $bitmap
}

function Convert-GreenToAlpha($bitmap) {
  for ($y = 0; $y -lt $bitmap.Height; $y++) {
    for ($x = 0; $x -lt $bitmap.Width; $x++) {
      $c = $bitmap.GetPixel($x, $y)
      $greenDominant = $c.G -gt 145 -and $c.R -lt 150 -and $c.B -lt 150 -and $c.G -gt ($c.R + 45) -and $c.G -gt ($c.B + 45)
      if ($greenDominant) {
        $bitmap.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
      }
    }
  }
}

function Find-OpaqueBounds($bitmap) {
  $minX = $bitmap.Width
  $minY = $bitmap.Height
  $maxX = -1
  $maxY = -1

  for ($y = 0; $y -lt $bitmap.Height; $y++) {
    for ($x = 0; $x -lt $bitmap.Width; $x++) {
      if ($bitmap.GetPixel($x, $y).A -gt 12) {
        if ($x -lt $minX) { $minX = $x }
        if ($y -lt $minY) { $minY = $y }
        if ($x -gt $maxX) { $maxX = $x }
        if ($y -gt $maxY) { $maxY = $y }
      }
    }
  }

  if ($maxX -lt $minX -or $maxY -lt $minY) {
    return [System.Drawing.Rectangle]::new(0, 0, $bitmap.Width, $bitmap.Height)
  }

  return [System.Drawing.Rectangle]::new($minX, $minY, $maxX - $minX + 1, $maxY - $minY + 1)
}

function Save-AlphaFull($sourcePath, $targetPath) {
  $bitmap = Load-ArgbBitmap $sourcePath
  Convert-GreenToAlpha $bitmap
  $bitmap.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $bitmap.Dispose()
}

function Save-ContainedAsset($sourcePath, $targetPath, $width, $height, $padding) {
  if ((Test-Path $targetPath) -and -not $Force) {
    throw "Target already exists: $targetPath. Re-run with -Force only if replacement is intended."
  }

  $source = Load-ArgbBitmap $sourcePath
  Convert-GreenToAlpha $source
  $bounds = Find-OpaqueBounds $source
  $scale = [Math]::Min(($width * $padding) / $bounds.Width, ($height * $padding) / $bounds.Height)
  $drawW = [int][Math]::Max(1, [Math]::Round($bounds.Width * $scale))
  $drawH = [int][Math]::Max(1, [Math]::Round($bounds.Height * $scale))
  $drawX = [int](($width - $drawW) / 2)
  $drawY = [int](($height - $drawH) / 2)

  $pair = New-Canvas $width $height
  $bitmap = $pair[0]
  $graphics = $pair[1]
  $graphics.DrawImage($source, [System.Drawing.Rectangle]::new($drawX, $drawY, $drawW, $drawH), $bounds, [System.Drawing.GraphicsUnit]::Pixel)
  Convert-GreenToAlpha $bitmap
  $graphics.Dispose()
  $source.Dispose()
  $bitmap.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $bitmap.Dispose()
}

function Sync-LibraryPreviewCache($targetPath) {
  $metaPath = "$targetPath.meta"
  if (-not (Test-Path $metaPath)) {
    return
  }

  $meta = Get-Content -LiteralPath $metaPath -Raw | ConvertFrom-Json
  $uuid = $meta.uuid
  if (-not $uuid) {
    return
  }

  $libraryDir = Join-Path $root ("library\" + $uuid.Substring(0, 2))
  New-Item -ItemType Directory -Force -Path $libraryDir | Out-Null
  Copy-Item -LiteralPath $targetPath -Destination (Join-Path $libraryDir "$uuid.png") -Force
}

for ($i = 0; $i -lt $imports.Count; $i++) {
  $entry = $imports[$i]
  $source = $orderedSources[$i].FullName
  $sourceCopy = Join-Path $sourceDir "$($entry.id).source.png"
  $alphaWork = Join-Path $sourceDir "$($entry.id).alpha_full.png"
  $candidate = Join-Path $batchDir "$($entry.id).png"
  $target = Join-Path $outDir "$($entry.id).png"

  if (((Test-Path $candidate) -or (Test-Path $target)) -and -not $Force) {
    throw "Candidate or runtime target already exists for $($entry.id). Re-run with -Force only if replacement is intended."
  }

  Copy-Item -LiteralPath $source -Destination $sourceCopy -Force
  Save-AlphaFull $source $alphaWork
  Save-ContainedAsset $source $candidate $entry.width $entry.height $entry.padding
  Copy-Item -LiteralPath $candidate -Destination $target -Force
  Sync-LibraryPreviewCache $target
  Write-Host "[p0-shared-assets] Imported $($entry.id) from $([System.IO.Path]::GetFileName($source))"
}
