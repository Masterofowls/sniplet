# Sniplet local release script (Windows)
# Builds a signed arm64 APK locally and publishes a GitHub Release for the tag.

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
$releaseApk = Join-Path $releaseDir "sniplet-$version-arm64.apk"

if (-not $SkipBuild) {
    Write-Host "==> Verifying project"
    npm run verify

    Write-Host "==> Building signed arm64 APK"
    & "$PSScriptRoot\android-build.ps1" -Target aarch64

    $apkCandidates = @(
        "src-tauri\gen\android\app\build\outputs\apk\arm64\release\app-arm64-release.apk",
        "src-tauri\gen\android\app\build\outputs\apk\universal\release\app-universal-release.apk",
        "src-tauri\gen\android\app\build\outputs\apk\arm64\release\app-arm64-release-unsigned.apk",
        "src-tauri\gen\android\app\build\outputs\apk\universal\release\app-universal-release-unsigned.apk"
    )

    $apkPath = $null
    foreach ($candidate in $apkCandidates) {
        if (Test-Path $candidate) {
            $apkPath = $candidate
            break
        }
    }

    if (-not $apkPath) {
        throw "Release APK not found. Checked: $($apkCandidates -join ', ')"
    }

    New-Item -ItemType Directory -Force -Path $releaseDir | Out-Null
    Copy-Item $apkPath $releaseApk -Force
} elseif (-not (Test-Path $releaseApk)) {
    throw "SkipBuild set but release APK not found at $releaseApk"
}

$sdkRoot = $env:ANDROID_HOME
if (-not $sdkRoot) { $sdkRoot = $env:ANDROID_SDK_ROOT }
if (-not $sdkRoot) {
    $sdkRoot = Join-Path $env:LOCALAPPDATA "Android\Sdk"
}

$buildTools = Get-ChildItem (Join-Path $sdkRoot "build-tools") -Directory |
    Sort-Object Name -Descending |
    Select-Object -First 1

if ($buildTools) {
    $apksigner = Join-Path $buildTools.FullName "apksigner.bat"
    if (Test-Path $apksigner) {
        Write-Host "==> Verifying APK signature"
        & $apksigner verify --verbose $releaseApk
        if ($LASTEXITCODE -ne 0) {
            throw "apksigner verify failed for $releaseApk"
        }
    }
}

$hashPath = Join-Path $releaseDir "SHA256SUMS.txt"
$hashHex = Get-Sha256Hex $releaseApk
"$hashHex  $(Split-Path $releaseApk -Leaf)" | Set-Content -Encoding ascii $hashPath

Write-Host "==> Creating GitHub release $Tag"
$notesFile = Join-Path $root "CHANGELOG.md"
$releaseArgs = @(
    "release", "create", $Tag,
    $releaseApk,
    $hashPath,
    "--title", "Sniplet $Tag",
    "--generate-notes"
)

if (Test-Path $notesFile) {
    $releaseArgs += @("--notes-file", $notesFile)
}

gh @releaseArgs

Write-Host ""
Write-Host "Release published:"
Write-Host "  Tag: $Tag"
Write-Host "  APK: $releaseApk"
