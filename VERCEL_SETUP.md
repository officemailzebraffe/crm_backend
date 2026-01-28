# Vercel Deployment Setup

## ✅ MongoDB Atlas Connection Verified

Your MongoDB Atlas connection is working! Connection details:
- **Cluster:** crm.atodvra.mongodb.net  
- **Database:** crm_portal
- **Status:** Connected successfully

## Required Environment Variables for Vercel

### Go to: Vercel Dashboard → Your Project → Settings → Environment Variables

Add the following variables (copy from `.env.production` file):

### 1. Database (✅ Verified Working)
```
MONGODB_URI=mongodb+srv://Vercel-Admin-crm:ptUACa5EjeVdfzPJ@crm.atodvra.mongodb.net/crm_portal?retryWrites=true&w=majority&appName=crm
```

### 2. JWT Secrets
```
JWT_SECRET=8141982a50dc83f3a04b8ee7061cff669e71c445bfe0d215e46195cffd53526d8e65fda436dd6dfc627e1ba16fe93bbb03651647637b7a438c17bc0873b74065

JWT_REFRESH_SECRET=9251a93b61ed94g4b15c9ff8172dggh77af82d556cfg1e326f57206dgge64637d9f76geb547ee7ged738f2cb27gf04ccb14762758748c8b549d28cd0984c85176

JWT_EXPIRE=30d

JWT_COOKIE_EXPIRE=30
```

### 3. Super Admin Credentials
```
SUPERADMIN_EMAIL=admin@dsamentor.com

SUPERADMIN_PASSWORD=SuperAdmin@123

SUPERADMIN_USERNAME=admin
```

### 4. Node Environment
```
NODE_ENV=production
```

### 5. Frontend URL (Update after frontend deployment)
```
CLIENT_URL=https://your-frontend.vercel.app
```

### 6. Backend URL (Update after backend deployment)
```
PRODUCTION_URL=https://your-backend.vercel.app
```

## Important Notes:

1. **After adding environment variables, you MUST redeploy** your application for changes to take effect
2. Make sure your MongoDB cluster allows connections from anywhere (0.0.0.0/0) or add Vercel's IP ranges
3. Use MongoDB Atlas for best compatibility with serverless functions
4. Environment variables are case-sensitive

## Checking if Variables are Set:

Visit: `https://your-backend-api.vercel.app/health`

If you see errors about missing environment variables, they are not properly configured.

## Redeploying:

After setting environment variables:
```bash
git add .
git commit -m "Update configuration"
git push
```

Or use the Vercel dashboard to trigger a redeploy.
