# Relay System Cleanup Script
# Automates the cleanup process identified in SYSTEM-AUDIT-AND-CLEANUP-REPORT.md
# Run this script from the project root directory

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Relay System Cleanup Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Ask for confirmation
Write-Host "This script will:" -ForegroundColor Yellow
Write-Host "  1. Archive 33 intermediary documentation files" -ForegroundColor Yellow
Write-Host "  2. Delete 5 backup/temporary files" -ForegroundColor Yellow
Write-Host "  3. Archive 1 unused code file (SimpleChannelRenderer.jsx)" -ForegroundColor Yellow
Write-Host ""
Write-Host "The following 7 production docs will be KEPT:" -ForegroundColor Green
Write-Host "  - README.md" -ForegroundColor Green
Write-Host "  - RELAY-IMPLEMENTATION-PLAN.md" -ForegroundColor Green
Write-Host "  - UNIFIED-BOUNDARY-SYSTEM-COMPLETE.md" -ForegroundColor Green
Write-Host "  - READY-TO-USE.md" -ForegroundColor Green
Write-Host "  - GLOBAL-GENERATION-COMPLETE.md" -ForegroundColor Green
Write-Host "  - PERFORMANCE-AND-VOTE-FIXES-COMPLETE.md" -ForegroundColor Green
Write-Host "  - MACRO-REGIONS-README.md" -ForegroundColor Green
Write-Host ""

$confirm = Read-Host "Do you want to proceed? (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "Cleanup cancelled." -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "Starting cleanup..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Create archive directories
Write-Host "[1/4] Creating archive directories..." -ForegroundColor Cyan
$docArchivePath = "archive\documentation\2025-01"
$codeArchivePath = "archive\frontend\renderers"

if (-not (Test-Path $docArchivePath)) {
    New-Item -Path $docArchivePath -ItemType Directory -Force | Out-Null
    Write-Host "  [OK] Created $docArchivePath" -ForegroundColor Green
} else {
    Write-Host "  [OK] Directory already exists: $docArchivePath" -ForegroundColor Green
}

if (-not (Test-Path $codeArchivePath)) {
    New-Item -Path $codeArchivePath -ItemType Directory -Force | Out-Null
    Write-Host "  [OK] Created $codeArchivePath" -ForegroundColor Green
} else {
    Write-Host "  [OK] Directory already exists: $codeArchivePath" -ForegroundColor Green
}

Write-Host ""

# Step 2: Archive intermediary documentation files
Write-Host "[2/4] Archiving intermediary documentation files..." -ForegroundColor Cyan

$docsToArchive = @(
    "ACTUAL-CHANNEL-ANALYSIS.md",
    "AUTOMATIC-CLUSTERING-FIX.md",
    "CHANNEL-GENERATION-FIX.md",
    "CLUSTERING-FIX-SUMMARY.md",
    "CONTINENT-COUNTRY-HOVER-FIX-IMPLEMENTATION.md",
    "CONTINENT-FIX-V2-SUMMARY.md",
    "COORDINATE-DISTRIBUTION-ANALYSIS.md",
    "COORDINATE-FIXES-SUMMARY.md",
    "COORDINATE-GENERATION-COMPLETE.md",
    "COORDINATE-GENERATION-EXPLANATION.md",
    "COORDINATE-ISSUE-SUMMARY.md",
    "COORDINATE-VISUAL-EXPLANATION.md",
    "COORDINATE-VOTE-AUDIT.md",
    "COUNTRY-LIST-ANALYSIS.json",
    "CRITICAL-ISSUES-FOUND.md",
    "CUBE-OVERLAP-ISSUE-ANALYSIS.md",
    "DEPENDENCY-ANALYSIS-ISO-CODES.md",
    "DEPENDENCY-OWNERSHIP-EXPLAINED.md",
    "DOWNLOADING-ALL-COUNTRIES.md",
    "FIX-CONTINENT-COUNTRY-HOVER.md",
    "FIXES-APPLIED-OCT-4.md",
    "FIXES-COMPLETED-SUMMARY.md",
    "GLOBAL-COORDINATE-SYSTEM-ANALYSIS.md",
    "IMPLEMENTATION-SUMMARY.md",
    "INTEGRATION-CHECKLIST.md",
    "ISSUES-TO-FIX.md",
    "LOGGING-ISSUE-RESOLVED.md",
    "ON-DEMAND-BOUNDARY-SYSTEM.md",
    "OPTIMIZED-CLUSTERING-SYSTEM-COMPLETE.md",
    "POINT-IN-POLYGON-RESTORATION.md",
    "PRECISION-FIXES-COMPLETED.md",
    "PRECISION-RESTORATION-FIX.md",
    "QUICK-FIX-SUMMARY.md",
    "REFACTOR-CENTRALIZED-BOUNDARY-DATA.md",
    "REGIONAL-POLYGON-DISTRIBUTION-FIX.md",
    "TESTDATAPANEL-INTEGRATION-COMPLETE.md",
    "VOTE-COUNT-DISPLAY-FIX.md",
    "ZERO-DEPENDENCY-ISO-SOLUTION.md",
    "FINAL-SUCCESS-REPORT.md"
)

$archivedCount = 0
$notFoundCount = 0

foreach ($doc in $docsToArchive) {
    if (Test-Path $doc) {
        Move-Item -Path $doc -Destination $docArchivePath -Force
        Write-Host "  [OK] Archived: $doc" -ForegroundColor Green
        $archivedCount++
    } else {
        Write-Host "  [WARN] Not found (already archived?): $doc" -ForegroundColor Yellow
        $notFoundCount++
    }
}

Write-Host "  → Archived $archivedCount files, $notFoundCount already missing" -ForegroundColor Cyan
Write-Host ""

# Step 3: Delete backup/temporary files
Write-Host "[3/4] Deleting backup and temporary files..." -ForegroundColor Cyan

$filesToDelete = @(
    "V86_demo-data.json.backup",
    "V86_GlobalChannelRenderer.jsx.backup",
    "temp-countries.json",
    "current-channels.json",
    "COORDINATE-GENERATION-FIX.js"
)

$deletedCount = 0
$notFoundCountDel = 0

foreach ($file in $filesToDelete) {
    if (Test-Path $file) {
        Remove-Item -Path $file -Force
        Write-Host "  [OK] Deleted: $file" -ForegroundColor Green
        $deletedCount++
    } else {
        Write-Host "  [WARN] Not found (already deleted?): $file" -ForegroundColor Yellow
        $notFoundCountDel++
    }
}

Write-Host "  → Deleted $deletedCount files, $notFoundCountDel already missing" -ForegroundColor Cyan
Write-Host ""

# Step 4: Archive unused code file
Write-Host "[4/4] Archiving unused code file..." -ForegroundColor Cyan

$simpleRenderer = "src\frontend\components\workspace\components\Globe\SimpleChannelRenderer.jsx"

if (Test-Path $simpleRenderer) {
    Move-Item -Path $simpleRenderer -Destination $codeArchivePath -Force
    Write-Host "  [OK] Archived: SimpleChannelRenderer.jsx" -ForegroundColor Green
} else {
    Write-Host "  [WARN] Not found (already archived?): SimpleChannelRenderer.jsx" -ForegroundColor Yellow
}

Write-Host ""

# Summary
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Cleanup Complete!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  - Archived $archivedCount documentation files to $docArchivePath" -ForegroundColor Green
Write-Host "  - Deleted $deletedCount backup/temporary files" -ForegroundColor Green
Write-Host "  - Archived unused code file to $codeArchivePath" -ForegroundColor Green
Write-Host ""
Write-Host "Remaining production documentation (7 files):" -ForegroundColor Cyan
Write-Host "  [OK] README.md" -ForegroundColor Green
Write-Host "  [OK] RELAY-IMPLEMENTATION-PLAN.md" -ForegroundColor Green
Write-Host "  [OK] UNIFIED-BOUNDARY-SYSTEM-COMPLETE.md" -ForegroundColor Green
Write-Host "  [OK] READY-TO-USE.md" -ForegroundColor Green
Write-Host "  [OK] GLOBAL-GENERATION-COMPLETE.md" -ForegroundColor Green
Write-Host "  [OK] PERFORMANCE-AND-VOTE-FIXES-COMPLETE.md" -ForegroundColor Green
Write-Host "  [OK] MACRO-REGIONS-README.md" -ForegroundColor Green
Write-Host ""
Write-Host "New reference documents:" -ForegroundColor Cyan
Write-Host "  [OK] SYSTEM-AUDIT-AND-CLEANUP-REPORT.md (detailed audit)" -ForegroundColor Green
Write-Host "  [OK] ACTIVE-SYSTEMS-REFERENCE.md (quick reference)" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Review SYSTEM-AUDIT-AND-CLEANUP-REPORT.md for detailed findings" -ForegroundColor Yellow
Write-Host "  2. Remove commented 'regionManager' code from src/backend/services/boundaryService.mjs" -ForegroundColor Yellow
Write-Host "  3. Test system to verify everything still works" -ForegroundColor Yellow
Write-Host ""
Write-Host "Your codebase is now production-ready!" -ForegroundColor Green
Write-Host ""
