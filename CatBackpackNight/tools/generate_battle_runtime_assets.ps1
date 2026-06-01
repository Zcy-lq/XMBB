Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$outDir = Join-Path $root "assets\textures\runtime"

function New-Bitmap($width, $height) {
  $bitmap = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  return @($bitmap, $graphics)
}

function Brush($a, $r, $g, $b) {
  return New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb($a, $r, $g, $b))
}

function Pen($a, $r, $g, $b, $w) {
  return New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb($a, $r, $g, $b), $w)
}

function Fill-Ellipse($g, $brush, $x, $y, $w, $h) {
  $g.FillEllipse($brush, [single]$x, [single]$y, [single]$w, [single]$h)
}

function Fill-Rect($g, $brush, $x, $y, $w, $h) {
  $g.FillRectangle($brush, [single]$x, [single]$y, [single]$w, [single]$h)
}

function Draw-Line($g, $pen, $x1, $y1, $x2, $y2) {
  $g.DrawLine($pen, [single]$x1, [single]$y1, [single]$x2, [single]$y2)
}

function Save-Png($bitmap, $path) {
  $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bitmap.Dispose()
}

function Ensure-Meta($id) {
  $metaPath = Join-Path $outDir "$id.png.meta"
  if (Test-Path $metaPath) {
    return
  }
  $uuid = [guid]::NewGuid().ToString()
  $meta = @{
    ver = "1.0.27"
    importer = "image"
    imported = $true
    uuid = $uuid
    files = @(".json", ".png")
    subMetas = @{
      "6c48a" = @{
        id = "6c48a"
        imported = $true
        importer = "texture"
        name = "texture"
        files = @(".json")
        ver = "1.0.22"
        userData = @{
          magfilter = "linear"
          imageUuidOrDatabaseUri = $uuid
          anisotropy = 0
          minfilter = "linear"
          isUuid = $true
          mipfilter = "none"
          visible = $false
          wrapModeS = "clamp-to-edge"
          wrapModeT = "clamp-to-edge"
        }
        uuid = "$uuid@6c48a"
        subMetas = @{}
        displayName = $id
      }
    }
    userData = @{
      hasAlpha = $true
      fixAlphaTransparencyArtifacts = $true
      redirect = "$uuid@6c48a"
      type = "texture"
    }
  }
  ($meta | ConvertTo-Json -Depth 8) + "`n" | Set-Content -Path $metaPath -Encoding UTF8
}

function Draw-BattleForest($id, $prepare) {
  $pair = New-Bitmap 720 1280
  $bitmap = $pair[0]
  $g = $pair[1]
  $bg = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    [System.Drawing.RectangleF]::new(0, 0, 720, 1280),
    [System.Drawing.Color]::FromArgb(255, 20, 28, 52),
    [System.Drawing.Color]::FromArgb(255, 58, 48, 64),
    [System.Drawing.Drawing2D.LinearGradientMode]::Vertical
  )
  Fill-Rect $g $bg 0 0 720 1280
  for ($i = 0; $i -lt 9; $i++) {
    $x = 24 + $i * 82
    $trunk = Brush 210 37 28 36
    Fill-Rect $g $trunk ($x + 12) 180 22 760
    $leaf = Brush 150 26 70 74
    Fill-Ellipse $g $leaf ($x - 62) 72 142 250
    Fill-Ellipse $g (Brush 125 20 50 64) ($x - 36) 10 126 230
  }
  Fill-Ellipse $g (Brush 185 35 60 64) -90 720 900 360
  Fill-Ellipse $g (Brush 155 62 88 78) -110 850 940 330
  Fill-Ellipse $g (Brush 120 255 194 86) 286 690 148 72
  Fill-Ellipse $g (Brush 190 255 132 36) 314 666 88 96
  Fill-Ellipse $g (Brush 210 255 214 82) 334 628 48 102
  if ($prepare) {
    Fill-Ellipse $g (Brush 80 255 231 152) 82 330 556 360
    Fill-Rect $g (Brush 64 32 24 28) 74 860 572 178
  } else {
    Fill-Rect $g (Brush 82 24 24 30) 0 1010 720 270
  }
  $g.Dispose()
  Save-Png $bitmap (Join-Path $outDir "$id.png")
  Ensure-Meta $id
}

function Draw-CatHero() {
  $pair = New-Bitmap 256 256
  $bitmap = $pair[0]
  $g = $pair[1]
  Fill-Ellipse $g (Brush 95 0 0 0) 42 210 172 30
  Fill-Ellipse $g (Brush 255 246 174 96) 62 74 128 136
  Fill-Ellipse $g (Brush 255 255 222 150) 84 122 86 78
  $ear = Brush 255 231 136 78
  $points = [System.Drawing.PointF[]]@([System.Drawing.PointF]::new(82,88),[System.Drawing.PointF]::new(104,34),[System.Drawing.PointF]::new(124,94))
  $g.FillPolygon($ear, $points)
  $points = [System.Drawing.PointF[]]@([System.Drawing.PointF]::new(146,92),[System.Drawing.PointF]::new(170,36),[System.Drawing.PointF]::new(182,104))
  $g.FillPolygon($ear, $points)
  Fill-Ellipse $g (Brush 255 36 30 35) 96 120 15 18
  Fill-Ellipse $g (Brush 255 36 30 35) 150 120 15 18
  Draw-Line $g (Pen 255 68 42 24 8) 152 156 232 132
  Draw-Line $g (Pen 255 255 207 74 5) 156 154 236 130
  Fill-Ellipse $g (Brush 230 88 56 36) 222 124 22 14
  Fill-Rect $g (Brush 230 72 44 26) 82 188 96 28
  $g.Dispose()
  Save-Png $bitmap (Join-Path $outDir "rt_cat_hero_battle.png")
  Ensure-Meta "rt_cat_hero_battle"
}

function Draw-Monster($id, $kind) {
  $pair = New-Bitmap 220 220
  $bitmap = $pair[0]
  $g = $pair[1]
  Fill-Ellipse $g (Brush 85 0 0 0) 40 186 140 24
  if ($kind -eq "ghost") {
    Fill-Ellipse $g (Brush 230 112 206 240) 46 34 128 142
    Fill-Rect $g (Brush 230 112 206 240) 46 102 128 58
    for ($i = 0; $i -lt 4; $i++) { Fill-Ellipse $g (Brush 220 112 206 240) (46 + $i * 32) 140 36 48 }
    Fill-Ellipse $g (Brush 255 24 38 56) 82 86 18 26
    Fill-Ellipse $g (Brush 255 24 38 56) 126 86 18 26
  } elseif ($kind -eq "skeleton") {
    Fill-Ellipse $g (Brush 255 224 214 184) 54 34 112 102
    Fill-Rect $g (Brush 255 216 202 170) 80 126 62 62
    Fill-Ellipse $g (Brush 255 30 28 32) 78 78 24 28
    Fill-Ellipse $g (Brush 255 30 28 32) 120 78 24 28
    Draw-Line $g (Pen 255 108 96 84 7) 86 150 134 150
    Draw-Line $g (Pen 255 108 96 84 7) 84 170 136 170
  } else {
    Fill-Ellipse $g (Brush 255 76 164 110) 46 56 128 128
    Fill-Ellipse $g (Brush 255 104 198 126) 72 86 78 76
    Fill-Ellipse $g (Brush 255 246 215 76) 82 102 20 24
    Fill-Ellipse $g (Brush 255 246 215 76) 124 102 20 24
    Draw-Line $g (Pen 255 58 92 62 9) 82 144 146 144
  }
  $g.Dispose()
  Save-Png $bitmap (Join-Path $outDir "$id.png")
  Ensure-Meta $id
}

function Draw-Bullet() {
  $pair = New-Bitmap 128 48
  $bitmap = $pair[0]
  $g = $pair[1]
  Fill-Ellipse $g (Brush 110 255 114 26) 4 12 104 22
  Fill-Ellipse $g (Brush 255 255 193 52) 48 8 72 30
  Fill-Ellipse $g (Brush 255 255 245 144) 82 13 32 18
  $g.Dispose()
  Save-Png $bitmap (Join-Path $outDir "rt_fx_bullet.png")
  Ensure-Meta "rt_fx_bullet"
}

function Draw-Hit() {
  $pair = New-Bitmap 160 160
  $bitmap = $pair[0]
  $g = $pair[1]
  for ($i = 0; $i -lt 12; $i++) {
    $a = $i * [Math]::PI / 6
    Draw-Line $g (Pen 235 255 187 54 8) 80 80 (80 + [Math]::Cos($a) * 66) (80 + [Math]::Sin($a) * 66)
  }
  Fill-Ellipse $g (Brush 230 255 246 140) 48 48 64 64
  Fill-Ellipse $g (Brush 210 255 92 38) 64 64 32 32
  $g.Dispose()
  Save-Png $bitmap (Join-Path $outDir "rt_fx_hit.png")
  Ensure-Meta "rt_fx_hit"
}

function Draw-Fire() {
  $pair = New-Bitmap 160 190
  $bitmap = $pair[0]
  $g = $pair[1]
  Fill-Ellipse $g (Brush 90 255 164 44) 20 142 120 34
  Fill-Ellipse $g (Brush 235 255 96 28) 40 52 80 108
  Fill-Ellipse $g (Brush 245 255 184 54) 56 28 52 132
  Fill-Ellipse $g (Brush 255 255 240 118) 68 70 30 72
  Fill-Rect $g (Brush 255 102 62 34) 26 154 108 16
  $g.Dispose()
  Save-Png $bitmap (Join-Path $outDir "rt_fx_fire.png")
  Ensure-Meta "rt_fx_fire"
}

Draw-BattleForest "rt_bg_battle_forest_safe" $false
Draw-BattleForest "rt_bg_battle_prepare_safe" $true
Draw-CatHero
Draw-Monster "rt_monster_ghost" "ghost"
Draw-Monster "rt_monster_skeleton" "skeleton"
Draw-Monster "rt_monster_goblin" "goblin"
Draw-Bullet
Draw-Hit
Draw-Fire

Write-Host "[battle-assets] Generated battle runtime PNGs in $outDir"
