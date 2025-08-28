#!/bin/bash

# AVCP GitHub Setup Script
# Run this after creating your GitHub repository

echo "🚀 AVCP GitHub Deployment Setup"
echo "================================"

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Error: Not in a git repository. Run 'git init' first."
    exit 1
fi

# Prompt for GitHub username and repository name
echo "Please provide your GitHub repository details:"
read -p "GitHub username: " github_username
read -p "Repository name [avcp-platform]: " repo_name

# Use default if no repo name provided
repo_name=${repo_name:-avcp-platform}

# Construct the repository URL
repo_url="https://github.com/$github_username/$repo_name.git"

echo "📡 Setting up remote origin: $repo_url"

# Add remote origin
git remote add origin "$repo_url"

# Check if main branch exists, if not rename master to main
current_branch=$(git branch --show-current)
if [ "$current_branch" = "master" ]; then
    echo "🔄 Renaming branch from master to main"
    git branch -M main
fi

# Push to GitHub
echo "📤 Pushing to GitHub..."
if git push -u origin main; then
    echo "✅ Successfully deployed to GitHub!"
    echo "🌐 Repository URL: https://github.com/$github_username/$repo_name"
    echo ""
    echo "🎉 Next steps:"
    echo "1. Visit your repository on GitHub"
    echo "2. Set up environment variables in Settings → Secrets"
    echo "3. Enable GitHub Actions if needed"
    echo "4. Consider setting up GitHub Pages"
    echo ""
    echo "📖 See DEPLOYMENT.md for detailed instructions"
else
    echo "❌ Failed to push to GitHub. Please check:"
    echo "1. Repository exists and you have access"
    echo "2. GitHub authentication is set up"
    echo "3. Repository name is correct"
fi
