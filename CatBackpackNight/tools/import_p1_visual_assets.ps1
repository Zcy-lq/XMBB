param(
  [switch]$Force,
  [string]$GeneratedDir = "C:\Users\Administrator\.codex\generated_images\019e739c-c97b-79f1-b746-de1f8dab0c51"
)

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$outDir = Join-Path $root "assets\textures\runtime"
$batchDir = Join-Path $root "tmp\asset_candidates\assetagent_p1_runtime_gap_20260529"
$sourceDir = Join-Path $batchDir "_sources"

New-Item -ItemType Directory -Force -Path $sourceDir | Out-Null

$generated = Get-ChildItem -Path $GeneratedDir -File -Filter "*.png" |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 3

if ($generated.Count -lt 3) {
  throw "Expected three freshly generated P1 visual asset images in $GeneratedDir"
}

$orderedSources = @($generated | Sort-Object LastWriteTime)
$imports = @(
  @{ id = "rt_bg_shop_village_safe"; width = 720; height = 1280; transparent = $false; padding = 1.0 },
  @{ id = "rt_cat_hero_idle"; width = 256; height = 256; transparent = $true; padding = 0.92 },
  @{ id = "rt_cat_shop_hood"; width = 256; height = 256; transparent = $true; padding = 0.92 }
)

function New-Canvas($width, $height, $transparent) {
  $bitmap = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  if ($transparent) {
    $graphics.Clear([System.Drawing.Color]::FromArgb(0, 0, 0, 0))
  } else {
    $graphics.Clear([System.Drawing.Color]::FromArgb(255, 8, 14, 25))
  }
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

function Save-ContainedAsset($sourcePath, $targetPath, $width, $height, $padding, $transparent) {
  if ((Test-Path $targetPath) -and -not $Force) {
    throw "Target already exists: $targetPath. Re-run with -Force only if replacement is intended."
  }

  $source = Load-ArgbBitmap $sourcePath
  if ($transparent) {
    Convert-GreenToAlpha $source
    $bounds = Find-OpaqueBounds $source
  } else {
    $bounds = [System.Drawing.Rectangle]::new(0, 0, $source.Width, $source.Height)
  }

  $scale = [Math]::Max($width / $bounds.Width, $height / $bounds.Height)
  if ($transparent) {
    $scale = [Math]::Min(($width * $padding) / $bounds.Width, ($height * $padding) / $bounds.Height)
  }

  $drawW = [int][Math]::Max(1, [Math]::Round($bounds.Width * $scale))
  $drawH = [int][Math]::Max(1, [Math]::Round($bounds.Height * $scale))
  $drawX = [int](($width - $drawW) / 2)
  $drawY = [int](($height - $drawH) / 2)

  $pair = New-Canvas $width $height $transparent
  $bitmap = $pair[0]
  $graphics = $pair[1]
  $graphics.DrawImage($source, [System.Drawing.Rectangle]::new($drawX, $drawY, $drawW, $drawH), $bounds, [System.Drawing.GraphicsUnit]::Pixel)
  if ($transparent) {
    Convert-GreenToAlpha $bitmap
  }
  $graphics.Dispose()
  $source.Dispose()
  $bitmap.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $bitmap.Dispose()
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
  if ($entry.transparent) {
    Save-AlphaFull $source $alphaWork
  }
  Save-ContainedAsset $source $candidate $entry.width $entry.height $entry.padding $entry.transparent
  Copy-Item -LiteralPath $candidate -Destination $target -Force
  Write-Host "[p1-visual-assets] Imported $($entry.id) from $([System.IO.Path]::GetFileName($source))"
}
