Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$outDir = Join-Path $root "assets\textures\runtime"
$sourceDir = Join-Path $root "tmp\battle_asset_sources"
New-Item -ItemType Directory -Force -Path $sourceDir | Out-Null

$generatedDir = "C:\Users\Administrator\.codex\generated_images\019e6901-c96c-7a73-b862-88fff6b9543d"
$generated = Get-ChildItem -Path $generatedDir -File -Filter "*.png" | Sort-Object LastWriteTime
if ($generated.Count -lt 3) {
  throw "Expected at least three generated battle source images in $generatedDir"
}

$backgroundSource = $generated[0].FullName
$characterSheet = $generated[1].FullName
$vfxSheet = $generated[2].FullName
Copy-Item $backgroundSource (Join-Path $sourceDir "battle_background_source.png") -Force
Copy-Item $characterSheet (Join-Path $sourceDir "battle_characters_source.png") -Force
Copy-Item $vfxSheet (Join-Path $sourceDir "battle_vfx_source.png") -Force

function New-Canvas($width, $height) {
  $bitmap = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  return @($bitmap, $graphics)
}

function Save-ResizedCover($sourcePath, $targetPath, $width, $height) {
  $source = [System.Drawing.Image]::FromFile($sourcePath)
  $scale = [Math]::Max($width / $source.Width, $height / $source.Height)
  $drawW = [int][Math]::Ceiling($source.Width * $scale)
  $drawH = [int][Math]::Ceiling($source.Height * $scale)
  $drawX = [int](($width - $drawW) / 2)
  $drawY = [int](($height - $drawH) / 2)
  $pair = New-Canvas $width $height
  $bitmap = $pair[0]
  $graphics = $pair[1]
  $graphics.DrawImage($source, $drawX, $drawY, $drawW, $drawH)
  $graphics.Dispose()
  $source.Dispose()
  $bitmap.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $bitmap.Dispose()
}

function Save-CropTransparent($sourcePath, $targetPath, $cropX, $cropY, $cropW, $cropH, $outW, $outH) {
  $source = [System.Drawing.Bitmap]::FromFile($sourcePath)
  $pair = New-Canvas $outW $outH
  $bitmap = $pair[0]
  $graphics = $pair[1]
  $sourceRect = [System.Drawing.Rectangle]::new($cropX, $cropY, $cropW, $cropH)
  $destRect = [System.Drawing.Rectangle]::new(0, 0, $outW, $outH)
  $graphics.DrawImage($source, $destRect, $sourceRect, [System.Drawing.GraphicsUnit]::Pixel)
  $graphics.Dispose()
  $source.Dispose()

  for ($y = 0; $y -lt $bitmap.Height; $y++) {
    for ($x = 0; $x -lt $bitmap.Width; $x++) {
      $c = $bitmap.GetPixel($x, $y)
      $greenDominant = $c.G -gt 145 -and $c.G -gt ($c.R * 1.45) -and $c.G -gt ($c.B * 1.45)
      if ($greenDominant) {
        $bitmap.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, $c.R, $c.G, $c.B))
      }
    }
  }

  $bitmap.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $bitmap.Dispose()
}

function Ensure-Meta($id) {
  $metaPath = Join-Path $outDir "$id.png.meta"
  if (Test-Path $metaPath) {
    return
  }
  $uuid = [guid]::NewGuid().ToString()
  $meta = @{
    ver = "1.0.27"; importer = "image"; imported = $true; uuid = $uuid; files = @(".json", ".png")
    subMetas = @{
      "6c48a" = @{
        id = "6c48a"; imported = $true; importer = "texture"; name = "texture"; files = @(".json"); ver = "1.0.22"
        userData = @{
          magfilter = "linear"; imageUuidOrDatabaseUri = $uuid; anisotropy = 0; minfilter = "linear"; isUuid = $true
          mipfilter = "none"; visible = $false; wrapModeS = "clamp-to-edge"; wrapModeT = "clamp-to-edge"
        }
        uuid = "$uuid@6c48a"; subMetas = @{}; displayName = $id
      }
    }
    userData = @{ hasAlpha = $true; fixAlphaTransparencyArtifacts = $true; redirect = "$uuid@6c48a"; type = "texture" }
  }
  ($meta | ConvertTo-Json -Depth 8) + "`n" | Set-Content -Path $metaPath -Encoding UTF8
}

Save-ResizedCover $backgroundSource (Join-Path $outDir "rt_bg_battle_forest_safe.png") 720 1280
Save-ResizedCover $backgroundSource (Join-Path $outDir "rt_bg_battle_prepare_safe.png") 720 1280

$char = [System.Drawing.Image]::FromFile($characterSheet)
$cw = [int]($char.Width / 2)
$ch = [int]($char.Height / 2)
$char.Dispose()
Save-CropTransparent $characterSheet (Join-Path $outDir "rt_cat_hero_battle.png") 0 0 $cw $ch 256 256
Save-CropTransparent $characterSheet (Join-Path $outDir "rt_monster_ghost.png") $cw 0 $cw $ch 256 256
Save-CropTransparent $characterSheet (Join-Path $outDir "rt_monster_skeleton.png") 0 $ch $cw $ch 256 256
Save-CropTransparent $characterSheet (Join-Path $outDir "rt_monster_goblin.png") $cw $ch $cw $ch 256 256

$vfx = [System.Drawing.Image]::FromFile($vfxSheet)
$vw = [int]($vfx.Width / 3)
$vh = [int]($vfx.Height / 2)
$vfx.Dispose()
Save-CropTransparent $vfxSheet (Join-Path $outDir "rt_fx_bullet.png") 0 0 $vw $vh 256 128
Save-CropTransparent $vfxSheet (Join-Path $outDir "rt_fx_slash.png") $vw 0 $vw $vh 256 256
Save-CropTransparent $vfxSheet (Join-Path $outDir "rt_fx_pierce.png") ($vw * 2) 0 $vw $vh 320 96
Save-CropTransparent $vfxSheet (Join-Path $outDir "rt_fx_magic_orb.png") 0 $vh $vw $vh 256 192
Save-CropTransparent $vfxSheet (Join-Path $outDir "rt_fx_hit.png") $vw $vh $vw $vh 256 256
Save-CropTransparent $vfxSheet (Join-Path $outDir "rt_fx_fire.png") ($vw * 2) $vh $vw $vh 256 256

@(
  "rt_bg_battle_forest_safe",
  "rt_bg_battle_prepare_safe",
  "rt_cat_hero_battle",
  "rt_monster_ghost",
  "rt_monster_skeleton",
  "rt_monster_goblin",
  "rt_fx_bullet",
  "rt_fx_slash",
  "rt_fx_pierce",
  "rt_fx_magic_orb",
  "rt_fx_hit",
  "rt_fx_fire"
) | ForEach-Object { Ensure-Meta $_ }

Write-Host "[battle-assets] Imported generated commercial battle assets into $outDir"
