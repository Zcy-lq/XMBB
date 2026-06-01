Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$outDir = Join-Path $root "assets\textures\runtime"
$sourceDir = Join-Path $root "tmp\battle_asset_sources\individual"
New-Item -ItemType Directory -Force -Path $sourceDir | Out-Null

$generatedDir = "C:\Users\Administrator\.codex\generated_images\019e6901-c96c-7a73-b862-88fff6b9543d"
$generated = Get-ChildItem -Path $generatedDir -File -Filter "*.png" | Sort-Object LastWriteTime -Descending | Select-Object -First 9
if ($generated.Count -lt 9) {
  throw "Expected nine independently generated battle asset images in $generatedDir"
}

$imports = @(
  @{ id = "rt_monster_ghost"; width = 256; height = 256 },
  @{ id = "rt_monster_skeleton"; width = 256; height = 256 },
  @{ id = "rt_monster_goblin"; width = 256; height = 256 },
  @{ id = "rt_fx_bullet"; width = 256; height = 128 },
  @{ id = "rt_fx_slash"; width = 256; height = 256 },
  @{ id = "rt_fx_pierce"; width = 320; height = 96 },
  @{ id = "rt_fx_magic_orb"; width = 256; height = 192 },
  @{ id = "rt_fx_hit"; width = 256; height = 256 },
  @{ id = "rt_fx_fire"; width = 256; height = 256 }
)

$orderedSources = @($generated | Sort-Object LastWriteTime)

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
      $greenDominant = $c.G -gt 150 -and $c.R -lt 135 -and $c.B -lt 135 -and $c.G -gt ($c.R + 55) -and $c.G -gt ($c.B + 55)
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

function Save-ContainedAsset($sourcePath, $targetPath, $width, $height) {
  $source = Load-ArgbBitmap $sourcePath
  Convert-GreenToAlpha $source
  $bounds = Find-OpaqueBounds $source
  $padding = 0.86
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
  $target = Join-Path $outDir "$($entry.id).png"
  Copy-Item -LiteralPath $source -Destination (Join-Path $sourceDir "$($entry.id)_source.png") -Force
  Save-ContainedAsset $source $target $entry.width $entry.height
  Sync-LibraryPreviewCache $target
  Write-Host "[battle-assets] Imported independent $($entry.id) from $([System.IO.Path]::GetFileName($source))"
}
