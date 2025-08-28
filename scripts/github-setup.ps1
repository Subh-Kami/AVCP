# AVCP GitHub Setup Script (PowerShell)
# Run this after creating your GitHub repository

Write-Host "🚀 AVCP GitHub Deployment Setup" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

# Check if we're in a git repository
if (-not (Test-Path ".git")) {
    Write-Host "❌ Error: Not in a git repository. Run 'git init' first." -ForegroundColor Red
    exit 1
}

# Prompt for GitHub username and repository name
$github_username = Read-Host "GitHub username"
$repo_name = Read-Host "Repository name [avcp-platform]"

# Use default if no repo name provided
if ([string]::IsNullOrEmpty($repo_name)) {
    $repo_name = "avcp-platform"
}

# Construct the repository URL
$repo_url = "https://github.com/$github_username/$repo_name.git"

Write-Host "📡 Setting up remote origin: $repo_url" -ForegroundColor Yellow

# Add remote origin
try {
    git remote add origin $repo_url
    
    # Check current branch and rename if needed
    $current_branch = git branch --show-current
    if ($current_branch -eq "master") {
        Write-Host "🔄 Renaming branch from master to main" -ForegroundColor Yellow
        git branch -M main
    }
    
    # Push to GitHub
    Write-Host "📤 Pushing to GitHub..." -ForegroundColor Yellow
    $push_result = git push -u origin main 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Successfully deployed to GitHub!" -ForegroundColor Green
        Write-Host "🌐 Repository URL: https://github.com/$github_username/$repo_name" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "🎉 Next steps:" -ForegroundColor Green
        Write-Host "1. Visit your repository on GitHub"
        Write-Host "2. Set up environment variables in Settings → Secrets"
        Write-Host "3. Enable GitHub Actions if needed"
        Write-Host "4. Consider setting up GitHub Pages"
        Write-Host ""
        Write-Host "📖 See DEPLOYMENT.md for detailed instructions" -ForegroundColor Cyan
    } else {
        throw "Git push failed"
    }
} catch {
    Write-Host "❌ Failed to push to GitHub. Please check:" -ForegroundColor Red
    Write-Host "1. Repository exists and you have access"
    Write-Host "2. GitHub authentication is set up (try: gh auth login)"
    Write-Host "3. Repository name is correct"
    Write-Host "4. Error details: $($_.Exception.Message)"
}
