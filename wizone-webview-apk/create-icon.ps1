# Simple PowerShell script to create a basic app icon
Add-Type -AssemblyName System.Drawing

# Create a 48x48 bitmap (hdpi)
$bitmap = New-Object System.Drawing.Bitmap(48, 48)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)

# Set blue background
$blueBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(44, 90, 160))
$graphics.FillRectangle($blueBrush, 0, 0, 48, 48)

# Draw white text "W"
$font = New-Object System.Drawing.Font("Arial", 28, [System.Drawing.FontStyle]::Bold)
$whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$graphics.DrawString("W", $font, $whiteBrush, 8, 5)

# Save the image
$bitmap.Save("D:\Sachin Garg Profile\New folder\ppll11\TaskScoreTracker\wizone-webview-apk\app\src\main\res\mipmap-hdpi\ic_launcher.png", [System.Drawing.Imaging.ImageFormat]::Png)

# Cleanup
$graphics.Dispose()
$bitmap.Dispose()
$blueBrush.Dispose()
$whiteBrush.Dispose()
$font.Dispose()

Write-Host "Icon created successfully!"