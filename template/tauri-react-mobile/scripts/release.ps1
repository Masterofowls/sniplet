# Local release script (Windows) — build APK and publish GitHub Release

param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$Tag,
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

function Get-Sha256Hex([string]$FilePath) {
    $stream = [System.IO.File]::OpenRead($FilePath)
    try {
        $sha = [System.Security.Cryptography.SHA256]::Create()
        $bytes = $sha.ComputeHash($stream)
        return ([System.BitConverter]::ToString($bytes) -replace "-", "").ToLowerInvariant()
    } finally {
        $stream.Dispose()
    }
}

if ($Tag -notmatch '^v\d+\.\d+\.\d+') {
    throw "Tag must look like v0.1.0 (got: $Tag)"
}

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$version = $Tag.TrimStart("v")
$releaseDir = Join-Path $root "dist\release"
$releaseApk = Join-Path $releaseDir "{{APP_SLUG}}-$version.apk"

if (-not $SkipBuild) {
    npm run verify
    & "$PSScriptRoot\android-build.ps1" -Target aarch64
    $apkCandidates = @(
        "src-tauri\gen\android\app\build\outputs\apk\arm64\release\app-arm64-release.apk",
        "src-tauri\gen\android\app\build\outputs\apk\universal\release\app-universal-release.apk"
    )
    $apkPath = $apkCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
    if (-not $apkPath) { throw "Release APK not found" }
    New-Item -ItemType Directory -Force -Path $releaseDir | Out-Null
    Copy-Item $apkPath $releaseApk -Force
} elseif (-not (Test-Path $releaseApk)) {
    $apkCandidates = @(
        "src-tauri\gen\android\app\build\outputs\apk\arm64\release\app-arm64-release.apk",
        "src-tauri\gen\android\app\build\outputs\apk\universal\release\app-universal-release.apk"
    )
    $apkPath = $apkCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
    if (-not $apkPath) { throw "SkipBuild: APK not found" }
    New-Item -ItemType Directory -Force -Path $releaseDir | Out-Null
    Copy-Item $apkPath $releaseApk -Force
}

$sdkRoot = $env:ANDROID_HOME
if (-not $sdkRoot) { $sdkRoot = $env:ANDROID_SDK_ROOT }
if (-not $sdkRoot) { $sdkRoot = Join-Path $env:LOCALAPPDATA "Android\Sdk" }
$buildTools = Get-ChildItem (Join-Path $sdkRoot "build-tools") -Directory -ErrorAction SilentlyContinue |
    Sort-Object Name -Descending | Select-Object -First 1
if ($buildTools) {
    $apksigner = Join-Path $buildTools.FullName "apksigner.bat"
    if (Test-Path $apksigner) {
        & $apksigner verify --verbose $releaseApk
        if ($LASTEXITCODE -ne 0) { throw "apksigner verify failed" }
    }
}

$hashPath = Join-Path $releaseDir "SHA256SUMS.txt"
$hashHex = Get-Sha256Hex $releaseApk
"$hashHex  $(Split-Path $releaseApk -Leaf)" | Set-Content -Encoding ascii $hashPath

gh release create $Tag $releaseApk $hashPath --title "{{APP_NAME}} $Tag" --generate-notes

Write-Host "Release published: $releaseApk"
