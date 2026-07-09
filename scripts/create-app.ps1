# Scaffold a new app from template/tauri-react-mobile
param(
    [Parameter(Mandatory = $true)]
    [string]$Name,
    [Parameter(Mandatory = $true)]
    [string]$AppId,
    [Parameter(Mandatory = $true)]
    [string]$Output
)

$ErrorActionPreference = "Stop"

if ($AppId -notmatch '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$') {
    throw "AppId must look like com.example.myapp (got: $AppId)"
}

$root = Split-Path -Parent $PSScriptRoot
$templateDir = Join-Path $root "template\tauri-react-mobile"
if (-not (Test-Path $templateDir)) {
    throw "Template not found: $templateDir"
}

$slug = ($Name.ToLower() -replace '[^a-z0-9]+', '-').Trim('-')
if (-not $slug) { $slug = "my-app" }
$crate = ($slug -replace '-', '_')
$libName = "${crate}_lib"

$resolvedOutput = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($Output)
if (Test-Path $resolvedOutput) {
    throw "Output already exists: $resolvedOutput"
}

Write-Host "Creating app '$Name'"
Write-Host "  slug:   $slug"
Write-Host "  id:     $AppId"
Write-Host "  crate:  $crate"
Write-Host "  output: $resolvedOutput"

Copy-Item -Path $templateDir -Destination $resolvedOutput -Recurse

$replacements = @{
    '{{APP_NAME}}'   = $Name
    '{{APP_SLUG}}'   = $slug
    '{{APP_ID}}'     = $AppId
    '{{CRATE_NAME}}' = $crate
    '{{LIB_NAME}}'   = $libName
}

$textExtensions = @('.ts', '.tsx', '.json', '.md', '.rs', '.toml', '.html', '.css', '.sh', '.ps1', '.kts', '.properties', '.example', '.gitignore')
$utf8NoBom = New-Object System.Text.UTF8Encoding $false

Get-ChildItem $resolvedOutput -Recurse -File | Where-Object {
    $textExtensions -contains $_.Extension -or $_.Name -eq '.gitignore' -or $_.Name -eq '.env.example'
} | ForEach-Object {
    $content = [System.IO.File]::ReadAllText($_.FullName)
    $updated = $content
    foreach ($key in $replacements.Keys) {
        $updated = $updated.Replace($key, $replacements[$key])
    }
    $updated = $updated -replace "`r`n", "`n"
    [System.IO.File]::WriteAllText($_.FullName, $updated, $utf8NoBom)
}

Write-Host ""
Write-Host "Done. Next steps:"
Write-Host "  cd $resolvedOutput"
Write-Host "  npm install"
Write-Host "  npm run android:init"
Write-Host "  npm run android:patch"
Write-Host "  npm run verify"
