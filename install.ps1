$ErrorActionPreference = "Stop"

$dest = "$env:USERPROFILE\.claude"
$src  = "$PSScriptRoot\.claude"

Write-Host "Installing claude-dev-workflow plugin..."

New-Item -ItemType Directory -Force -Path "$dest\skills\dev-setup\templates" | Out-Null
New-Item -ItemType Directory -Force -Path "$dest\rules" | Out-Null

Copy-Item "$src\skills\dev-setup.md"    "$dest\skills\dev-setup.md"    -Force
Copy-Item "$src\skills\verify-setup.md" "$dest\skills\verify-setup.md" -Force
Copy-Item "$src\skills\dev-setup\templates\*" "$dest\skills\dev-setup\templates\" -Recurse -Force
Copy-Item "$src\rules\03-development.md" "$dest\rules\03-development.md" -Force

Write-Host ""
Write-Host "Done!"
Write-Host ""
Write-Host "Add the following line to ~/.claude/CLAUDE.md:"
Write-Host ""
Write-Host "  @rules/03-development.md"
Write-Host ""
Write-Host "Then use /dev-setup in any Claude Code project."
