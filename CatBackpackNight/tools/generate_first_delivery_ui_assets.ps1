Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = "Stop"
$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$RuntimeRoot = Join-Path $ProjectRoot "assets\textures\runtime"

function New-Canvas {
  param([int]$Width, [int]$Height)
  $bitmap = [System.Drawing.Bitmap]::new($Width, $Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.Clear([System.Drawing.Color]::Transparent)
  return @{ Bitmap = $bitmap; Graphics = $graphics }
}

function Save-Canvas {
  param($Canvas, [string]$FileName)
  $path = Join-Path $RuntimeRoot $FileName
  $Canvas.Bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $Canvas.Graphics.Dispose()
  $Canvas.Bitmap.Dispose()
  Write-Output "generated assets/textures/runtime/$FileName"
}

function New-RoundPath {
  param([float]$X, [float]$Y, [float]$Width, [float]$Height, [float]$Radius)
  $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $diameter = $Radius * 2
  $path.AddArc($X, $Y, $diameter, $diameter, 180, 90)
  $path.AddArc($X + $Width - $diameter, $Y, $diameter, $diameter, 270, 90)
  $path.AddArc($X + $Width - $diameter, $Y + $Height - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($X, $Y + $Height - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()
  return $path
}

function Draw-RoundedGradient {
  param(
    [System.Drawing.Graphics]$Graphics,
    [float]$X,
    [float]$Y,
    [float]$Width,
    [float]$Height,
    [float]$Radius,
    [System.Drawing.Color]$Top,
    [System.Drawing.Color]$Bottom,
    [System.Drawing.Color]$Border,
    [float]$BorderWidth
  )
  $rect = [System.Drawing.RectangleF]::new($X, $Y, $Width, $Height)
  $path = New-RoundPath $X $Y $Width $Height $Radius
  $brush = [System.Drawing.Drawing2D.LinearGradientBrush]::new($rect, $Top, $Bottom, [System.Drawing.Drawing2D.LinearGradientMode]::Vertical)
  $Graphics.FillPath($brush, $path)
  $brush.Dispose()
  if ($BorderWidth -gt 0) {
    $pen = [System.Drawing.Pen]::new($Border, $BorderWidth)
    $Graphics.DrawPath($pen, $path)
    $pen.Dispose()
  }
  $path.Dispose()
}

function Draw-Star {
  param([System.Drawing.Graphics]$Graphics, [int]$X, [int]$Y, [int]$Size, [int]$Alpha)
  $color = [System.Drawing.Color]::FromArgb($Alpha, 255, 229, 151)
  $brush = [System.Drawing.SolidBrush]::new($color)
  $Graphics.FillEllipse($brush, $X, $Y, $Size, $Size)
  if ($Size -gt 3) {
    $pen = [System.Drawing.Pen]::new($color, 1)
    $cx = $X + [int]($Size / 2)
    $cy = $Y + [int]($Size / 2)
    $Graphics.DrawLine($pen, $cx - $Size, $cy, $cx + $Size, $cy)
    $Graphics.DrawLine($pen, $cx, $cy - $Size, $cx, $cy + $Size)
    $pen.Dispose()
  }
  $brush.Dispose()
}

function Draw-Trees {
  param([System.Drawing.Graphics]$Graphics, [System.Random]$Random, [int]$BaseY, [int]$MinHeight, [int]$MaxHeight, [System.Drawing.Color]$Color)
  $brush = [System.Drawing.SolidBrush]::new($Color)
  for ($x = -28; $x -lt 760; $x += $Random.Next(22, 42)) {
    $height = $Random.Next($MinHeight, $MaxHeight)
    $width = $Random.Next(34, 78)
    $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
    $path.AddPolygon(@(
      [System.Drawing.PointF]::new($x + $width / 2, $BaseY - $height),
      [System.Drawing.PointF]::new($x, $BaseY),
      [System.Drawing.PointF]::new($x + $width, $BaseY)
    ))
    $Graphics.FillPath($brush, $path)
    $path.Dispose()
  }
  $brush.Dispose()
}

function Draw-Moon {
  param([System.Drawing.Graphics]$Graphics, [int]$X, [int]$Y, [int]$Size)
  $glowBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(28, 255, 215, 125))
  $Graphics.FillEllipse($glowBrush, $X - 30, $Y - 30, $Size + 60, $Size + 60)
  $glowBrush.Dispose()
  $moonBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(245, 255, 211, 118))
  $Graphics.FillEllipse($moonBrush, $X, $Y, $Size, $Size)
  $moonBrush.Dispose()
  $cutBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 6, 21, 42))
  $Graphics.FillEllipse($cutBrush, $X + [int]($Size * 0.34), $Y - 2, $Size, $Size + 4)
  $cutBrush.Dispose()
}

function Draw-NightBackground {
  param([string]$FileName, [string]$Mode)
  $canvas = New-Canvas 720 1280
  $g = $canvas.Graphics
  $rand = [System.Random]::new($(if ($Mode -eq "home") { 77 } else { 41 }))

  $skyRect = [System.Drawing.Rectangle]::new(0, 0, 720, 760)
  $skyBrush = [System.Drawing.Drawing2D.LinearGradientBrush]::new($skyRect, [System.Drawing.Color]::FromArgb(255, 4, 17, 43), [System.Drawing.Color]::FromArgb(255, 13, 71, 112), [System.Drawing.Drawing2D.LinearGradientMode]::Vertical)
  $g.FillRectangle($skyBrush, $skyRect)
  $skyBrush.Dispose()

  Draw-Moon $g $(if ($Mode -eq "home") { 560 } else { 540 }) $(if ($Mode -eq "home") { 140 } else { 84 }) $(if ($Mode -eq "home") { 118 } else { 140 })

  for ($i = 0; $i -lt 115; $i += 1) {
    Draw-Star $g $rand.Next(18, 700) $rand.Next(18, 470) $rand.Next(2, 7) $rand.Next(120, 235)
  }

  Draw-Trees $g $rand 560 220 410 ([System.Drawing.Color]::FromArgb(210, 5, 23, 30))
  Draw-Trees $g $rand 640 150 310 ([System.Drawing.Color]::FromArgb(230, 7, 42, 39))

  $groundRect = [System.Drawing.Rectangle]::new(0, 548, 720, 732)
  $groundBrush = [System.Drawing.Drawing2D.LinearGradientBrush]::new($groundRect, [System.Drawing.Color]::FromArgb(255, 18, 72, 55), [System.Drawing.Color]::FromArgb(255, 5, 28, 24), [System.Drawing.Drawing2D.LinearGradientMode]::Vertical)
  $g.FillRectangle($groundBrush, $groundRect)
  $groundBrush.Dispose()

  $pathBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(44, 245, 184, 90))
  $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
  if ($Mode -eq "home") {
    $path.AddPolygon(@(
      [System.Drawing.PointF]::new(438, 560),
      [System.Drawing.PointF]::new(536, 560),
      [System.Drawing.PointF]::new(426, 1280),
      [System.Drawing.PointF]::new(170, 1280)
    ))
  } else {
    $path.AddPolygon(@(
      [System.Drawing.PointF]::new(300, 560),
      [System.Drawing.PointF]::new(430, 560),
      [System.Drawing.PointF]::new(612, 1280),
      [System.Drawing.PointF]::new(108, 1280)
    ))
  }
  $g.FillPath($pathBrush, $path)
  $path.Dispose()
  $pathBrush.Dispose()

  $warmGlow = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(34, 255, 151, 48))
  if ($Mode -eq "home") {
    $g.FillEllipse($warmGlow, 310, 676, 330, 190)
  } else {
    $g.FillEllipse($warmGlow, 196, 632, 360, 210)
  }
  $warmGlow.Dispose()

  $vignette = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $vignette.AddRectangle([System.Drawing.Rectangle]::new(0, 0, 720, 1280))
  $shade = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(48, 0, 0, 0))
  $g.FillPath($shade, $vignette)
  $shade.Dispose()
  $vignette.Dispose()

  for ($i = 0; $i -lt 24; $i += 1) {
    $flower = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb($rand.Next(80, 150), 255, $rand.Next(135, 205), $rand.Next(90, 180)))
    $g.FillEllipse($flower, $rand.Next(8, 700), $rand.Next(790, 1240), $rand.Next(3, 8), $rand.Next(3, 8))
    $flower.Dispose()
  }

  Save-Canvas $canvas $FileName
}

function Draw-Button {
  param([string]$FileName, [System.Drawing.Color]$Top, [System.Drawing.Color]$Bottom, [System.Drawing.Color]$Border)
  $canvas = New-Canvas 320 112
  $g = $canvas.Graphics
  Draw-RoundedGradient $g 4 4 312 104 28 $Top $Bottom $Border 7
  Draw-RoundedGradient $g 18 14 284 18 9 ([System.Drawing.Color]::FromArgb(112, 255, 255, 255)) ([System.Drawing.Color]::FromArgb(20, 255, 255, 255)) ([System.Drawing.Color]::FromArgb(0, 255, 255, 255)) 0
  $shadow = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(35, 91, 47, 18))
  $g.FillEllipse($shadow, 24, 78, 26, 18)
  $g.FillEllipse($shadow, 270, 78, 26, 18)
  $shadow.Dispose()
  Save-Canvas $canvas $FileName
}

function Draw-NavButton {
  param([string]$FileName, [bool]$Active)
  $canvas = New-Canvas 320 112
  $g = $canvas.Graphics
  if ($Active) {
    Draw-RoundedGradient $g 5 5 310 102 22 ([System.Drawing.Color]::FromArgb(245, 57, 44, 28)) ([System.Drawing.Color]::FromArgb(245, 18, 18, 16)) ([System.Drawing.Color]::FromArgb(255, 255, 204, 86)) 7
  } else {
    Draw-RoundedGradient $g 5 5 310 102 22 ([System.Drawing.Color]::FromArgb(235, 34, 34, 30)) ([System.Drawing.Color]::FromArgb(245, 12, 14, 14)) ([System.Drawing.Color]::FromArgb(170, 94, 68, 42)) 5
  }
  Save-Canvas $canvas $FileName
}

function Draw-BottomNav {
  $canvas = New-Canvas 720 160
  $g = $canvas.Graphics
  Draw-RoundedGradient $g 4 8 712 144 18 ([System.Drawing.Color]::FromArgb(246, 31, 34, 31)) ([System.Drawing.Color]::FromArgb(252, 10, 14, 14)) ([System.Drawing.Color]::FromArgb(180, 132, 94, 55)) 6
  $pen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(55, 255, 218, 143), 2)
  for ($x = 144; $x -lt 710; $x += 144) {
    $g.DrawLine($pen, $x, 24, $x, 136)
  }
  $pen.Dispose()
  Save-Canvas $canvas "rt_panel_bottom_nav.png"
}

function Draw-ResourcePill {
  $canvas = New-Canvas 256 72
  $g = $canvas.Graphics
  Draw-RoundedGradient $g 4 6 248 60 28 ([System.Drawing.Color]::FromArgb(238, 38, 37, 31)) ([System.Drawing.Color]::FromArgb(246, 15, 18, 17)) ([System.Drawing.Color]::FromArgb(190, 124, 87, 48)) 5
  $shine = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(35, 255, 239, 180))
  $g.FillEllipse($shine, 22, 13, 54, 20)
  $shine.Dispose()
  Save-Canvas $canvas "rt_panel_resource_pill.png"
}

function Draw-WoodHeader {
  $canvas = New-Canvas 640 128
  $g = $canvas.Graphics
  Draw-RoundedGradient $g 4 6 632 116 28 ([System.Drawing.Color]::FromArgb(255, 142, 82, 35)) ([System.Drawing.Color]::FromArgb(255, 80, 42, 20)) ([System.Drawing.Color]::FromArgb(255, 61, 30, 16)) 8
  $pen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(52, 255, 230, 160), 3)
  for ($y = 32; $y -lt 112; $y += 22) {
    $g.DrawBezier($pen, 28, $y, 190, $y - 18, 420, $y + 18, 612, $y)
  }
  $pen.Dispose()
  Save-Canvas $canvas "rt_panel_wood_header.png"
}

function Draw-EnergyIcon {
  $canvas = New-Canvas 96 96
  $g = $canvas.Graphics
  $coinBrush = [System.Drawing.Drawing2D.LinearGradientBrush]::new([System.Drawing.Rectangle]::new(6, 6, 84, 84), [System.Drawing.Color]::FromArgb(255, 255, 219, 94), [System.Drawing.Color]::FromArgb(255, 230, 120, 22), [System.Drawing.Drawing2D.LinearGradientMode]::Vertical)
  $g.FillEllipse($coinBrush, 6, 6, 84, 84)
  $coinBrush.Dispose()
  $border = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(255, 96, 50, 18), 5)
  $g.DrawEllipse($border, 7, 7, 82, 82)
  $border.Dispose()
  $bolt = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $bolt.AddPolygon(@(
    [System.Drawing.PointF]::new(54, 18),
    [System.Drawing.PointF]::new(30, 52),
    [System.Drawing.PointF]::new(48, 52),
    [System.Drawing.PointF]::new(39, 78),
    [System.Drawing.PointF]::new(68, 41),
    [System.Drawing.PointF]::new(50, 42)
  ))
  $boltBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 255, 255, 224))
  $g.FillPath($boltBrush, $bolt)
  $boltBrush.Dispose()
  $bolt.Dispose()
  Save-Canvas $canvas "rt_icon_energy.png"
}

# Login/home backgrounds are image assets generated from the project design sheets.
# Do not code-generate those backgrounds here; this script only refreshes reusable UI chrome.
Draw-Button "rt_btn_yellow.png" ([System.Drawing.Color]::FromArgb(255, 255, 212, 90)) ([System.Drawing.Color]::FromArgb(255, 242, 148, 31)) ([System.Drawing.Color]::FromArgb(255, 102, 54, 18))
Draw-Button "rt_btn_green.png" ([System.Drawing.Color]::FromArgb(255, 115, 218, 116)) ([System.Drawing.Color]::FromArgb(255, 48, 145, 74)) ([System.Drawing.Color]::FromArgb(255, 36, 82, 46))
Draw-Button "rt_btn_blue.png" ([System.Drawing.Color]::FromArgb(255, 92, 178, 229)) ([System.Drawing.Color]::FromArgb(255, 37, 92, 162)) ([System.Drawing.Color]::FromArgb(255, 25, 45, 86))
Draw-Button "rt_btn_brown.png" ([System.Drawing.Color]::FromArgb(255, 148, 93, 48)) ([System.Drawing.Color]::FromArgb(255, 91, 53, 27)) ([System.Drawing.Color]::FromArgb(255, 55, 31, 17))
Draw-NavButton "rt_btn_nav_active.png" $true
Draw-NavButton "rt_btn_nav_inactive.png" $false
Draw-BottomNav
Draw-ResourcePill
Draw-WoodHeader
Draw-EnergyIcon
