#!/bin/bash

# 🚀 Study Bunny Netlify Deployment Preparation Script
# This script prepares your frontend for clean Netlify deployment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}�� Study Bunny Netlify Deployment Preparation${NC}"
echo -e "${BLUE}===============================================${NC}"

# Check if frontend directory exists
if [ ! -d "frontend" ]; then
    echo -e "${RED}❌ Error: frontend directory not found!${NC}"
    echo -e "${YELLOW}Please run this script from the project root directory.${NC}"
    exit 1
fi

# Remove existing deploy directory if it exists
if [ -d "deploy" ]; then
    echo -e "${YELLOW}🗑️  Removing existing deploy directory...${NC}"
    rm -rf deploy
fi

# Create deploy directory
echo -e "${GREEN}📁 Creating deploy directory...${NC}"
mkdir deploy

# Copy all frontend files to deploy
echo -e "${GREEN}📋 Copying all frontend files...${NC}"
cp -r frontend/* deploy/

# Rename mainpage.html to index.html
echo -e "${GREEN}🔄 Renaming mainpage.html to index.html...${NC}"
cd deploy
mv mainpage.html index.html

# Fix case sensitivity issue - rename Progress.html to progress.html
if [ -f "progress/Progress.html" ]; then
    echo -e "${GREEN}🔧 Fixing Progress.html case sensitivity...${NC}"
    mv progress/Progress.html progress/progress.html
fi

# Update navigation paths in all HTML files
echo -e "${GREEN}🛠️  Updating navigation paths...${NC}"

# Function to update paths in a file
update_paths() {
    local file="$1"
    if [ -f "$file" ]; then
        # Update back to home links
        sed -i.bak 's|href="../mainpage.html"|href="/index.html"|g' "$file"
        sed -i.bak 's|href="../mainpage\.html"|href="/index.html"|g' "$file"
        
        # Update script src paths for cc-system.js
        sed -i.bak 's|src="../cc-system.js"|src="/cc-system.js"|g' "$file"
        
        # Update any other ../ references to root /
        sed -i.bak 's|href="../|href="/|g' "$file"
        sed -i.bak 's|src="../|src="/|g' "$file"
        
        # Remove backup files
        rm -f "$file.bak"
        
        echo -e "   ✅ Updated: $file"
    fi
}

# Update paths in all HTML files
find . -name "*.html" -type f | while read file; do
    update_paths "$file"
done

# Fix specific navigation links in index.html
echo -e "${GREEN}🔧 Fixing specific navigation links...${NC}"
if [ -f "index.html" ]; then
    # Fix the Progress tracker link case
    sed -i.bak 's|progress/Progress.html|progress/progress.html|g' "index.html"
    rm -f "index.html.bak"
    echo -e "   ✅ Fixed Progress tracker link in index.html"
fi

# Create _redirects file for Netlify
echo -e "${GREEN}📝 Creating Netlify _redirects file...${NC}"
cat > _redirects << 'EOF'
# Clean URL redirects for Study Bunny
/calculator     /calculator/calculator.html     200
/calendar       /calendar/calendar.html         200
/flashcards     /flashcards/flashcard.html      200
/mood           /mood-tracker/mood.html         200
/notes          /notes/notes.html               200
/planners       /planners/planner.html          200
/pomodoro       /pomodoro/pomodoro.html         200
/progress       /progress/progress.html         200
/quiz           /Quiz/Quiz.html                 200
/todo           /todolist/todolist.html         200
/water          /water/Water.html               200
/upgrade        /upgrade-page/upgrade.html      200

# Planner sub-routes
/daily          /planners/daily.code/daily.html     200
/weekly         /planners/weekly.code/weekly.html   200
/monthly        /planners/monthly.code/monthly.html 200

# Fallback to home
/*              /index.html                     200
EOF

# Create netlify.toml for configuration
echo -e "${GREEN}⚙️  Creating Netlify configuration...${NC}"
cat > netlify.toml << 'EOF'
[build]
  publish = "."

# Security headers
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "no-referrer-when-downgrade"
    Strict-Transport-Security = "max-age=31536000; includeSubDomains; preload"

# Cache static assets
[[headers]]
  for = "*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "*.css"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "*.png"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

# Prevent caching of HTML files
[[headers]]
  for = "*.html"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"
EOF

# Create a simple robots.txt
echo -e "${GREEN}🤖 Creating robots.txt...${NC}"
cat > robots.txt << 'EOF'
User-agent: *
Allow: /

Sitemap: https://yourdomain.netlify.app/sitemap.xml
EOF

# Go back to project root
cd ..

# Create deployment archive
echo -e "${GREEN}📦 Creating deployment archive...${NC}"
cd deploy
zip -r ../study-bunny-netlify-deploy.zip . -x "*.DS_Store" -q
cd ..

# Summary
echo -e "${GREEN}✅ Deployment preparation complete!${NC}"
echo -e "${BLUE}================================================${NC}"
echo -e "${GREEN}📁 Deploy folder created with all files${NC}"
echo -e "${GREEN}📦 study-bunny-netlify-deploy.zip created${NC}"
echo -e ""
echo -e "${YELLOW}🚀 Next Steps:${NC}"
echo -e "${YELLOW}1. Go to https://netlify.com${NC}"
echo -e "${YELLOW}2. Drag & drop 'study-bunny-netlify-deploy.zip'${NC}"
echo -e "${YELLOW}3. Your Study Bunny app will be live!${NC}"
echo -e ""
echo -e "${BLUE}📋 What's included:${NC}"
echo -e "   ✅ All HTML, CSS, JS files"
echo -e "   ✅ Carrot Currency system"
echo -e "   ✅ All bunny assets"
echo -e "   ✅ Clean URL redirects"
echo -e "   ✅ Netlify configuration"
echo -e "   ✅ SEO optimization"
echo -e ""
echo -e "${GREEN}🎉 Your Study Bunny is ready for the world!${NC}"

# Check if files exist
echo -e "${BLUE}📊 Deployment Statistics:${NC}"
echo -e "   📁 Total files: $(find deploy -type f | wc -l | tr -d ' ')"
echo -e "   📂 Total folders: $(find deploy -type d | wc -l | tr -d ' ')"
echo -e "   💾 Archive size: $(ls -lh study-bunny-netlify-deploy.zip | awk '{print $5}')"
echo -e ""
echo -e "${GREEN}🐰 Happy deploying! Your Study Bunny awaits! 🥕✨${NC}"
