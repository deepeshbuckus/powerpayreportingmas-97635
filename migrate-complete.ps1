# Complete Migration Script - PowerPay Production Code & Tests
# Transfers all production code, tests, and configuration from lovable-test-project to react-js

param(
    [string]$SourceDir = "lovable-test-project",
    [string]$TargetDir = "react-js",
    [switch]$DryRun,
    [switch]$SkipBackup
)

# Color output functions
function Write-Success { param($msg) Write-Host $msg -ForegroundColor Green }
function Write-Warning { param($msg) Write-Host $msg -ForegroundColor Yellow }
function Write-Error { param($msg) Write-Host $msg -ForegroundColor Red }
function Write-Info { param($msg) Write-Host $msg -ForegroundColor Cyan }

# Initialize counters
$script:FilesCreated = 0
$script:FilesUpdated = 0
$script:FilesSkipped = 0
$script:BackupsCreated = 0

# Timestamp for backup directory
$BackupTimestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupDir = Join-Path $TargetDir ".backup\migration_$BackupTimestamp"

Write-Host "`n========================================" -ForegroundColor Magenta
Write-Host "PowerPay Complete Migration Script" -ForegroundColor Magenta
Write-Host "========================================`n" -ForegroundColor Magenta

if ($DryRun) {
    Write-Warning "DRY RUN MODE - No files will be modified`n"
}

# Validate directories
if (-not (Test-Path $SourceDir)) {
    Write-Error "Error: Source directory '$SourceDir' not found!"
    exit 1
}

if (-not (Test-Path $TargetDir)) {
    Write-Error "Error: Target directory '$TargetDir' not found!"
    exit 1
}

# Define all files to migrate
$FilesToMigrate = @(
    # API Layer
    @{ Source = "src/api/powerPayRequests.ts"; Target = "src/api/powerPayRequests.ts" }
    @{ Source = "src/api/powerPayRequests.test.ts"; Target = "src/api/powerPayRequests.test.ts" }
    @{ Source = "src/api/mockData/powerPayMockData.ts"; Target = "src/api/mockData/powerPayMockData.ts" }
    
    # Services
    @{ Source = "src/services/PowerPayReportService.ts"; Target = "src/services/PowerPayReportService.ts" }
    @{ Source = "src/services/PowerPayReportService.test.ts"; Target = "src/services/PowerPayReportService.test.ts" }
    
    # Hooks
    @{ Source = "src/hooks/usePowerPay.ts"; Target = "src/hooks/usePowerPay.ts" }
    @{ Source = "src/hooks/usePowerPay.test.tsx"; Target = "src/hooks/usePowerPay.test.tsx" }
    @{ Source = "src/hooks/usePowerPayReports.ts"; Target = "src/hooks/usePowerPayReports.ts" }
    @{ Source = "src/hooks/usePowerPayReports.test.ts"; Target = "src/hooks/usePowerPayReports.test.ts" }
    @{ Source = "src/hooks/useReportGenerator.ts"; Target = "src/hooks/useReportGenerator.ts" }
    @{ Source = "src/hooks/useReportGenerator.test.ts"; Target = "src/hooks/useReportGenerator.test.ts" }
    @{ Source = "src/hooks/useReportExport.ts"; Target = "src/hooks/useReportExport.ts" }
    @{ Source = "src/hooks/useReportExport.test.ts"; Target = "src/hooks/useReportExport.test.ts" }
    
    # Components
    @{ Source = "src/components/ChatInterface.tsx"; Target = "src/components/ChatInterface.tsx" }
    @{ Source = "src/components/ChatInterface.test.tsx"; Target = "src/components/ChatInterface.test.tsx" }
    @{ Source = "src/components/Header.tsx"; Target = "src/components/Header.tsx" }
    @{ Source = "src/components/Header.test.tsx"; Target = "src/components/Header.test.tsx" }
    @{ Source = "src/components/ReportPreview.tsx"; Target = "src/components/ReportPreview.tsx" }
    @{ Source = "src/components/ReportPreview.test.tsx"; Target = "src/components/ReportPreview.test.tsx" }
    @{ Source = "src/components/SaveReportDialog.tsx"; Target = "src/components/SaveReportDialog.tsx" }
    @{ Source = "src/components/SaveReportDialog.test.tsx"; Target = "src/components/SaveReportDialog.test.tsx" }
    
    # Contexts
    @{ Source = "src/contexts/ReportContext.tsx"; Target = "src/contexts/ReportContext.tsx" }
    @{ Source = "src/contexts/ReportContext.test.tsx"; Target = "src/contexts/ReportContext.test.tsx" }
    
    # Lib
    @{ Source = "src/lib/powerpay-api.ts"; Target = "src/lib/powerpay-api.ts" }
    
    # Interfaces
    @{ Source = "src/interfaces/PowerPayApi.interface.ts"; Target = "src/interfaces/PowerPayApi.interface.ts" }
    
    # Models
    @{ Source = "src/models/powerPayReport.ts"; Target = "src/models/powerPayReport.ts" }
    
    # Pages
    @{ Source = "src/pages/Dashboard.tsx"; Target = "src/pages/Dashboard.tsx" }
    @{ Source = "src/pages/Dashboard.module.css"; Target = "src/pages/Dashboard.module.css" }
    @{ Source = "src/pages/Index.tsx"; Target = "src/pages/Index.tsx" }
    @{ Source = "src/pages/Index.test.tsx"; Target = "src/pages/Index.test.tsx" }
    @{ Source = "src/pages/Index.module.css"; Target = "src/pages/Index.module.css" }
    @{ Source = "src/pages/NotFound.tsx"; Target = "src/pages/NotFound.tsx" }
    @{ Source = "src/pages/NotFound.test.tsx"; Target = "src/pages/NotFound.test.tsx" }
    @{ Source = "src/pages/NotFound.module.css"; Target = "src/pages/NotFound.module.css" }
    
    # Configuration
    @{ Source = "src/setupTests.ts"; Target = "src/tests/setupTests.ts" }
    @{ Source = "vitest.config.ts"; Target = "vitest.config.ts" }
    @{ Source = "src/App.tsx"; Target = "src/App.tsx"; Critical = $true }
)

# Add customAIReport directory files
$CustomAIReportFiles = @(
    "src/pages/customAIReport/CustomAIReportChat.module.css"
    "src/pages/customAIReport/CustomAIReportDashboard.module.css"
    "src/pages/customAIReport/hooks/useCustomAIReportChat.ts"
    "src/pages/customAIReport/hooks/useCustomAIReportDashboard.ts"
)

foreach ($file in $CustomAIReportFiles) {
    $FilesToMigrate += @{ Source = $file; Target = $file }
}

# Function to create backup
function Backup-File {
    param($FilePath)
    
    if ($SkipBackup -or $DryRun) { return }
    
    $RelativePath = $FilePath.Replace($TargetDir + "\", "")
    $BackupPath = Join-Path $BackupDir $RelativePath
    $BackupFolder = Split-Path $BackupPath -Parent
    
    if (-not (Test-Path $BackupFolder)) {
        New-Item -ItemType Directory -Path $BackupFolder -Force | Out-Null
    }
    
    Copy-Item $FilePath $BackupPath -Force
    $script:BackupsCreated++
}

# Function to copy file
function Copy-MigrationFile {
    param($SourcePath, $TargetPath, $IsCritical = $false)
    
    $FullSourcePath = Join-Path $SourceDir $SourcePath
    $FullTargetPath = Join-Path $TargetDir $TargetPath
    
    # Check if source exists
    if (-not (Test-Path $FullSourcePath)) {
        Write-Warning "  ⚠ Source not found: $SourcePath"
        $script:FilesSkipped++
        return
    }
    
    # Create target directory if needed
    $TargetFolder = Split-Path $FullTargetPath -Parent
    if (-not (Test-Path $TargetFolder)) {
        if (-not $DryRun) {
            New-Item -ItemType Directory -Path $TargetFolder -Force | Out-Null
            Write-Info "  📁 Created directory: $($TargetPath | Split-Path -Parent)"
        } else {
            Write-Info "  📁 Would create directory: $($TargetPath | Split-Path -Parent)"
        }
    }
    
    # Check if target exists
    $TargetExists = Test-Path $FullTargetPath
    
    if ($TargetExists) {
        if ($IsCritical) {
            Write-Warning "  ⚠ CRITICAL FILE EXISTS: $TargetPath"
            Write-Warning "    This file requires manual review after migration!"
        }
        
        if (-not $DryRun) {
            Backup-File $FullTargetPath
            Copy-Item $FullSourcePath $FullTargetPath -Force
            Write-Success "  ✓ Updated (backed up): $TargetPath"
            $script:FilesUpdated++
        } else {
            Write-Info "  ➜ Would update: $TargetPath"
        }
    } else {
        if (-not $DryRun) {
            Copy-Item $FullSourcePath $FullTargetPath -Force
            Write-Success "  ✓ Created: $TargetPath"
            $script:FilesCreated++
        } else {
            Write-Info "  ➜ Would create: $TargetPath"
        }
    }
}

# Migrate all files
Write-Host "`nMigrating files...`n" -ForegroundColor Cyan

foreach ($FileMapping in $FilesToMigrate) {
    Copy-MigrationFile -SourcePath $FileMapping.Source -TargetPath $FileMapping.Target -IsCritical $FileMapping.Critical
}

# Summary
Write-Host "`n========================================" -ForegroundColor Magenta
Write-Host "Migration Summary" -ForegroundColor Magenta
Write-Host "========================================`n" -ForegroundColor Magenta

if ($DryRun) {
    Write-Info "DRY RUN COMPLETED - No changes made"
} else {
    Write-Success "Files created: $FilesCreated"
    Write-Success "Files updated: $FilesUpdated"
    if ($BackupsCreated -gt 0) {
        Write-Info "Backups created: $BackupsCreated (saved to $BackupDir)"
    }
}

if ($FilesSkipped -gt 0) {
    Write-Warning "Files skipped: $FilesSkipped"
}

# Post-migration instructions
Write-Host "`n========================================" -ForegroundColor Magenta
Write-Host "Next Steps" -ForegroundColor Magenta
Write-Host "========================================`n" -ForegroundColor Magenta

Write-Host "1. Review App.tsx changes:" -ForegroundColor Yellow
Write-Host "   - Merge React Router v7 flags into your existing routes" -ForegroundColor White
Write-Host "   - Check: <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>" -ForegroundColor Gray

Write-Host "`n2. Update environment variables (.env):" -ForegroundColor Yellow
Write-Host "   VITE_POWERPAY_API_URL=your-api-url" -ForegroundColor Gray
Write-Host "   VITE_POWERPAY_BEARER_TOKEN=your-token" -ForegroundColor Gray

Write-Host "`n3. Update vitest.config.ts setupFiles path:" -ForegroundColor Yellow
Write-Host "   setupFiles: ['./src/tests/setupTests.ts']" -ForegroundColor Gray

Write-Host "`n4. Install dependencies (if needed):" -ForegroundColor Yellow
Write-Host "   npm install" -ForegroundColor Gray

Write-Host "`n5. Run tests:" -ForegroundColor Yellow
Write-Host "   npm test" -ForegroundColor Gray
Write-Host "   npm run coverage" -ForegroundColor Gray

Write-Host "`n6. Review imports and adjust as needed" -ForegroundColor Yellow

if (-not $DryRun -and $BackupsCreated -gt 0) {
    Write-Host "`n7. If issues occur, restore from backups:" -ForegroundColor Yellow
    Write-Host "   Backup location: $BackupDir" -ForegroundColor Gray
}

Write-Host "`n========================================`n" -ForegroundColor Magenta

# Create rollback script
if (-not $DryRun -and $BackupsCreated -gt 0) {
    $RollbackScript = @"
# Rollback Migration Script
# Created: $BackupTimestamp

`$BackupDir = "$BackupDir"
`$TargetDir = "$TargetDir"

Write-Host "Rolling back migration from $BackupTimestamp..." -ForegroundColor Yellow

Get-ChildItem `$BackupDir -Recurse -File | ForEach-Object {
    `$RelativePath = `$_.FullName.Replace(`$BackupDir + "\", "")
    `$TargetPath = Join-Path `$TargetDir `$RelativePath
    
    Copy-Item `$_.FullName `$TargetPath -Force
    Write-Host "Restored: `$RelativePath" -ForegroundColor Green
}

Write-Host "Rollback complete!" -ForegroundColor Green
"@

    $RollbackPath = Join-Path $BackupDir "rollback.ps1"
    $RollbackScript | Out-File $RollbackPath -Encoding UTF8
    Write-Info "Rollback script created: $RollbackPath"
}

Write-Success "`nMigration completed successfully!`n"
