# Generates a fictional TTS fixture; no human microphone or voice is recorded.
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
New-Item -ItemType Directory -Force evidence | Out-Null
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
try {
    $synth.SelectVoice('Microsoft Hanhan Desktop')
    $synth.SetOutputToWaveFile((Join-Path (Get-Location) 'evidence/synthetic-fever.wav'))
    $synth.Speak('從昨天開始發燒，咳嗽，沒有旅遊史。')
} finally { $synth.Dispose() }
