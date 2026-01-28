#!/bin/bash

# Vercel Environment Variables Setup Script
# This script helps you add all required environment variables to Vercel

echo "🚀 Vercel Backend Environment Variables"
echo "========================================"
echo ""
echo "Copy and paste these commands in your terminal:"
echo ""
echo "# First, install Vercel CLI if you haven't:"
echo "npm i -g vercel"
echo ""
echo "# Navigate to backend directory:"
echo "cd backend"
echo ""
echo "# Link to your Vercel project:"
echo "vercel link"
echo ""
echo "# Add environment variables:"
echo ""
echo 'vercel env add MONGODB_URI production'
echo "# Paste: mongodb+srv://Vercel-Admin-crm:ptUACa5EjeVdfzPJ@crm.atodvra.mongodb.net/crm_portal?retryWrites=true&w=majority&appName=crm"
echo ""
echo 'vercel env add JWT_SECRET production'
echo "# Paste: 8141982a50dc83f3a04b8ee7061cff669e71c445bfe0d215e46195cffd53526d8e65fda436dd6dfc627e1ba16fe93bbb03651647637b7a438c17bc0873b74065"
echo ""
echo 'vercel env add JWT_REFRESH_SECRET production'
echo "# Paste: 9251a93b61ed94g4b15c9ff8172dggh77af82d556cfg1e326f57206dgge64637d9f76geb547ee7ged738f2cb27gf04ccb14762758748c8b549d28cd0984c85176"
echo ""
echo 'vercel env add JWT_EXPIRE production'
echo "# Type: 30d"
echo ""
echo 'vercel env add JWT_COOKIE_EXPIRE production'
echo "# Type: 30"
echo ""
echo 'vercel env add SUPERADMIN_EMAIL production'
echo "# Type: admin@dsamentor.com"
echo ""
echo 'vercel env add SUPERADMIN_PASSWORD production'
echo "# Type: SuperAdmin@123"
echo ""
echo 'vercel env add SUPERADMIN_USERNAME production'
echo "# Type: admin"
echo ""
echo 'vercel env add NODE_ENV production'
echo "# Type: production"
echo ""
echo 'vercel env add CLIENT_URL production'
echo "# Type: https://crm-frontend-omega-eight.vercel.app"
echo ""
echo 'vercel env add PRODUCTION_URL production'
echo "# Type: https://crm-backend-nu-six.vercel.app"
echo ""
echo "# After adding all variables, redeploy:"
echo "vercel --prod"
echo ""
echo "========================================"
echo "✅ Done! Your backend will redeploy with environment variables."
