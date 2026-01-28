# Vercel Deployment Setup

## Required Environment Variables

You **MUST** set these environment variables in your Vercel project settings:

### Go to: Vercel Dashboard → Your Project → Settings → Environment Variables

Add the following variables:

### 1. Database
- **Variable Name:** `MONGODB_URI`
- **Value:** Your MongoDB connection string
- **Example:** `mongodb+srv://username:password@cluster.mongodb.net/crm_portal?retryWrites=true&w=majority`

### 2. JWT Secrets
- **Variable Name:** `JWT_SECRET`
- **Value:** A random secure string (at least 32 characters)
- **Example:** `your-super-secret-jwt-key-change-this-in-production`

- **Variable Name:** `JWT_REFRESH_SECRET`
- **Value:** Another random secure string (different from JWT_SECRET)
- **Example:** `your-super-secret-refresh-key-change-this-too`

### 3. Frontend URL
- **Variable Name:** `CLIENT_URL`
- **Value:** Your frontend deployment URL
- **Example:** `https://your-frontend-app.vercel.app`

### 4. Node Environment
- **Variable Name:** `NODE_ENV`
- **Value:** `production`

### 5. Optional - Production URL
- **Variable Name:** `PRODUCTION_URL`
- **Value:** Your backend URL (same as your Vercel deployment)
- **Example:** `https://your-backend-api.vercel.app`

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
