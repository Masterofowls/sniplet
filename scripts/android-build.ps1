# Sniplet Android APK build script (Windows)
# Ensures rustup rustc and NDK clang are on PATH before building.

param(
    [ValidateSet("aarch64", "universal", "split")]
    [string]$Target = "aarch64"
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$cargoBin = Join-Path $env:USERPROFILE ".cargo\bin"
if (-not (Test-Path $cargoBin)) {
    throw "rustup cargo bin not found at $cargoBin"
}

$sdkRoot = $env:ANDROID_HOME
if (-not $sdkRoot) { $sdkRoot = $env:ANDROID_SDK_ROOT }
if (-not $sdkRoot) {
    $sdkRoot = Join-Path $env:LOCALAPPDATA "Android\Sdk"
}

if (-not (Test-Path $sdkRoot)) {
    throw "Android SDK not found. Set ANDROID_HOME or install Android SDK."
}

$ndkDir = Get-ChildItem (Join-Path $sdkRoot "ndk") -Directory | Sort-Object Name -Descending | Select-Object -First 1
if (-not $ndkDir) {
    throw "Android NDK not found under $sdkRoot\ndk"
}

$llvmBin = Join-Path $ndkDir.FullName "toolchains\llvm\prebuilt\windows-x86_64\bin"
if (-not (Test-Path $llvmBin)) {
    throw "NDK LLVM bin not found at $llvmBin"
}

$env:PATH = "$cargoBin;$llvmBin;" + $env:PATH
$env:ANDROID_HOME = $sdkRoot
$env:ANDROID_SDK_ROOT = $sdkRoot
$env:NDK_HOME = $ndkDir.FullName

Write-Host "Using rustup from: $cargoBin"
Write-Host "Using NDK: $($ndkDir.FullName)"

switch ($Target) {
    "aarch64" { npm run tauri android build -- --apk --target aarch64 }
    "universal" { npm run tauri android build -- --apk }
    "split" { npm run tauri android build -- --apk --split-per-abi }
}

Write-Host ""
Write-Host "APK output directory:"
Write-Host "  src-tauri\gen\android\app\build\outputs\apk\"
