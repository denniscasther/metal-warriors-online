$ErrorActionPreference = 'Stop'
$arenaProject = $PSScriptRoot
$arenaLocalUrl = 'http://127.0.0.1:4178'
try {
    $arenaConfig = Invoke-RestMethod -Uri "$arenaLocalUrl/api/config" -TimeoutSec 2
    if ($arenaConfig.roms.'7179556197d57fce35968f1fc1f303c825ec0a376bfda6ad3e8d8c36207ea2f3') {
        Start-Process $arenaLocalUrl
        Write-Output "Arena abierta. Enlace para invitados: $($arenaConfig.publicUrl)"
        exit 0
    }
    throw 'El puerto 4178 lo utiliza otro servicio.'
} catch {
    if ($_.Exception.Message -eq 'El puerto 4178 lo utiliza otro servicio.') { throw }
}
$arenaNode = (Get-Command node -ErrorAction Stop).Source
$arenaTunnel = (Get-Command cloudflared -ErrorAction SilentlyContinue).Source
$env:PUBLIC_URL = ''
if ($arenaTunnel) {
    $arenaTunnelProcess = Start-Process -FilePath $arenaTunnel -ArgumentList 'tunnel','--url',$arenaLocalUrl,'--no-autoupdate' -WorkingDirectory $arenaProject -WindowStyle Hidden -RedirectStandardOutput "$arenaProject/tunnel.log" -RedirectStandardError "$arenaProject/tunnel-error.log" -PassThru
    for ($arenaTry=0; $arenaTry -lt 40; $arenaTry++) {
        Start-Sleep -Milliseconds 500
        $arenaLog = Get-Content -Raw "$arenaProject/tunnel-error.log" -ErrorAction SilentlyContinue
        $arenaMatch = [regex]::Match([string]$arenaLog,'https://[a-z0-9-]+\.trycloudflare\.com')
        if ($arenaMatch.Success) { $env:PUBLIC_URL = $arenaMatch.Value; break }
        if ($arenaTunnelProcess.HasExited) { break }
    }
    if (-not $env:PUBLIC_URL) { Write-Warning 'No se obtuvo un enlace público. Se abrirá la versión local.' }
}
$arenaServerProcess = Start-Process -FilePath $arenaNode -ArgumentList 'server.mjs' -WorkingDirectory $arenaProject -WindowStyle Hidden -RedirectStandardOutput "$arenaProject/server.log" -RedirectStandardError "$arenaProject/server-error.log" -PassThru
for ($arenaTry=0; $arenaTry -lt 20; $arenaTry++) {
    Start-Sleep -Milliseconds 300
    try {
        $arenaHealth = Invoke-RestMethod -Uri "$arenaLocalUrl/api/health" -TimeoutSec 1
        if ($arenaHealth.ok) { Start-Process $arenaLocalUrl; Write-Output "Servidor: $($arenaServerProcess.Id). Invitados: $env:PUBLIC_URL"; exit 0 }
    } catch {}
    if ($arenaServerProcess.HasExited) { throw 'El servidor no inició. Revisa server-error.log.' }
}
throw 'No se pudo verificar el inicio. Revisa server-error.log.'
