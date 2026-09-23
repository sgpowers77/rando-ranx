# One click: optional zip sync, then commit + push main (Pages deploys from GitHub Actions).
param(
  [string]$Repo = "",
  [switch]$SkipZip
)

$ErrorActionPreference = "Stop"

$here = $PSScriptRoot
if (-not $Repo) {
  if (Test-Path (Join-Path $here ".git")) {
    $Repo = $here
  } else {
    $Repo = Join-Path $env:USERPROFILE "source\rando-ranx-github"
  }
}

if (-not (Test-Path (Join-Path $Repo ".git"))) {
  Write-Host "No git repo at $Repo"
  Write-Host "Clone first: git clone https://github.com/sgpowers77/rando-ranx.git $Repo"
  exit 1
}

$name = git -C $Repo config user.name
$email = git -C $Repo config user.email
if (-not $name -or -not $email) {
  Write-Host "Git still needs an author (this is not GitHub login):"
  Write-Host '  git config --global user.name "Seth Powers"'
  Write-Host '  git config --global user.email "sgpowers77@users.noreply.github.com"'
  exit 1
}

if (-not $SkipZip) {
  $zips = @(
    (Join-Path $here "rando-ranx-source.zip"),
    (Join-Path $env:LOCALAPPDATA "Cursor\AgentStores\cursor_agent_stores\bc-1d1bb0fa-398f-4eaa-b462-3e4c9250cabe\files\docs\rando-ranx-source.zip")
  ) | Where-Object { Test-Path $_ }
  $zip = $zips | Select-Object -First 1
  if ($zip) {
    Write-Host "Unpacking $zip into $Repo"
    Expand-Archive -Path $zip -DestinationPath $Repo -Force
  } else {
    Write-Host "No agent zip found; committing whatever is already in $Repo"
  }
}

Set-Location $Repo
git checkout main 2>$null
git add -A
$status = git status --porcelain
if ($status) {
  $shaFile = Join-Path $Repo "HEAD-SHA.txt"
  $msg = "Publish RandoRanx"
  if (Test-Path $shaFile) {
    $head = (Get-Content $shaFile -TotalCount 1).Trim()
    if ($head) { $msg = "Publish RandoRanx ($head)" }
  }
  git commit -m $msg
} else {
  Write-Host "Nothing new to commit."
}

git push origin main
if ($LASTEXITCODE -ne 0) {
  Write-Host "Push failed. Sign in if Git opens a browser, then run this script again."
  exit $LASTEXITCODE
}

Write-Host "Pushed main. Watch Deploy GitHub Pages:"
Write-Host "https://github.com/sgpowers77/rando-ranx/actions"
Start-Process "https://github.com/sgpowers77/rando-ranx/actions"
