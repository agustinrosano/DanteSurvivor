# Downloads every frame of a finished PixelLab animate_image job into a sprite folder.
# Usage: powershell -File scripts/fetch_pixellab_frames.ps1 <jobId> <outDir> <frameCount>
param(
  [Parameter(Mandatory = $true)][string]$JobId,
  [Parameter(Mandatory = $true)][string]$OutDir,
  [Parameter(Mandatory = $true)][int]$Count
)
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
for ($i = 0; $i -lt $Count; $i++) {
  $url = "https://api.pixellab.ai/mcp/images/$JobId/download?index=$i"
  $dest = Join-Path $OutDir "$i.png"
  curl.exe -sS -L -o $dest $url
  if ((Get-Item $dest).Length -lt 100) { Write-Warning "frame $i looks empty ($dest)" }
}
Write-Output "saved $Count frames -> $OutDir"
