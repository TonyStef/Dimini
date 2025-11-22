# 🚀 Dimini - Railway Hackathon Deployment Guide

**GOAL:** Get Dimini online in 1-2 hours for FREE using Railway's $5 trial credit

**Timeline:** 60-90 minutes total
**Cost:** $0 (using Railway's free trial)
**Expiry:** Good for 2+ days of demo usage

---

## 📋 Prerequisites (5 minutes)

Before you start, make sure you have:

- [ ] GitHub account (to connect Railway)
- [ ] Your domain name and access to DNS settings
- [ ] OpenAI API key ([get it here](https://platform.openai.com/api-keys))
- [ ] Together AI API key ([get it here](https://api.together.xyz/settings/api-keys))
- [ ] Hume AI credentials ([get them here](https://platform.hume.ai/))

**Pro tip:** Have all your API keys ready in a text file before starting!

---

## 🎯 Deployment Strategy

We'll use **Railway** which offers:
- ✅ $5 free trial credit (no credit card for trial)
- ✅ Supports Docker deployments
- ✅ Auto-generates public URLs with SSL
- ✅ Simple environment variable management
- ✅ Cancel anytime (no recurring charges)

---

## 🚂 OPTION 1: Quick Deploy (Recommended for Hackathon)

### Step 1: Sign Up for Railway (2 minutes)

1. Go to [railway.app](https://railway.app)
2. Click **"Start a New Project"**
3. Sign in with GitHub
4. Claim your **$5 free trial credit**

### Step 2: Push Your Code to GitHub (5 minutes)

```bash
# If not already on GitHub, push your repo:
cd /Users/tonyystef/base-jump/Dimini

# Add all changes
git add .

# Commit
git commit -m "Add Railway deployment configuration"

# Push to GitHub
git push origin main
```

**IMPORTANT:** Make sure your `.env` file is in `.gitignore` so you don't commit secrets!

### Step 3: Create Railway Project (3 minutes)

1. In Railway dashboard, click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your `Dimini` repository
4. Railway will detect the Dockerfile automatically

### Step 4: Add Database Services (5 minutes)

**Add PostgreSQL:**
1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"PostgreSQL"**
3. Railway auto-creates and provides `DATABASE_URL`

**Add Neo4j (Manual deployment):**
1. Click **"+ New"** → **"Empty Service"**
2. Name it `neo4j`
3. Go to **Settings** → **Source**
4. Select **"Docker Image"**
5. Enter: `neo4j:5.14-community`
6. Click **"Deploy"**

### Step 5: Configure Environment Variables (15 minutes)

#### For Backend Service:

1. Click on your **backend** service in Railway
2. Go to **Variables** tab
3. Click **"Raw Editor"** and paste:

```env
# Database (Railway auto-fills DATABASE_URL, but add these too)
POSTGRES_USER=dimini_user
POSTGRES_PASSWORD=YOUR_SECURE_PASSWORD
POSTGRES_DB=dimini_db

# Neo4j
NEO4J_URI=bolt://neo4j.railway.internal:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=YOUR_NEO4J_PASSWORD

# AI Providers (FILL IN YOUR REAL KEYS!)
TOGETHER_API_KEY=your_together_api_key_here
OPENAI_API_KEY=sk-proj-YOUR_OPENAI_KEY_HERE

# Security (Generate: python -c "import secrets; print(secrets.token_urlsafe(32))")
SECRET_KEY=YOUR_GENERATED_SECRET_KEY_32_CHARS
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Hume AI
HUME_API_KEY=your_hume_api_key
HUME_SECRET_KEY=your_hume_secret_key
HUME_CONFIG_ID=your_hume_config_id
HUME_TOOL_SAVE_SESSION_NOTE_ID=your_tool_id_1
HUME_TOOL_MARK_PROGRESS_ID=your_tool_id_2
HUME_TOOL_FLAG_CONCERN_ID=your_tool_id_3
HUME_TOOL_GENERATE_SESSION_SUMMARY_ID=your_tool_id_4

# Server
HOST=0.0.0.0
PORT=8000
DEBUG=false

# AI Models
GPT_MODEL=gpt-4o-mini
EMBEDDING_MODEL=text-embedding-3-small
SIMILARITY_THRESHOLD=0.50
EXTRACTION_INTERVAL=30
PAGERANK_UPDATE_INTERVAL=10
BETWEENNESS_UPDATE_INTERVAL=60
```

4. Click **"Save"**

#### For Neo4j Service:

1. Click on **neo4j** service
2. Go to **Variables**
3. Add these:

```env
NEO4J_AUTH=neo4j/YOUR_NEO4J_PASSWORD
NEO4J_PLUGINS=["graph-data-science"]
NEO4J_server_memory_heap_max__size=512M
NEO4J_server_memory_pagecache_size=256M
NEO4J_dbms_security_procedures_unrestricted=gds.*
```

#### For Frontend Service:

1. Click on **frontend** service
2. Go to **Variables**
3. Add:

```env
NODE_ENV=production
NEXT_PUBLIC_BACKEND_URL=https://YOUR-BACKEND-URL.up.railway.app
NEXT_PUBLIC_API_URL=https://YOUR-BACKEND-URL.up.railway.app
```

**NOTE:** You'll get the backend URL after it deploys. Update this in Step 7.

### Step 6: Deploy Services (10 minutes)

Railway will automatically deploy when you save variables. Watch the logs:

1. Click on each service
2. Go to **"Deployments"** tab
3. Click on the latest deployment
4. Watch the **Build Logs** and **Deploy Logs**

**Expected build time:**
- PostgreSQL: ~1 min (instant, it's pre-built)
- Neo4j: ~2 mins
- Backend: ~5-7 mins (Python dependencies + Prisma)
- Frontend: ~3-5 mins (Next.js build)

### Step 7: Get Public URLs (2 minutes)

For each service:

1. Click on the service
2. Go to **Settings** → **Networking**
3. Click **"Generate Domain"**
4. Railway creates a public URL like:
   - Backend: `dimini-backend-production.up.railway.app`
   - Frontend: `dimini-frontend-production.up.railway.app`

**IMPORTANT:** Copy the backend URL and update frontend environment variables!

1. Go to **frontend** service → **Variables**
2. Update:
   ```env
   NEXT_PUBLIC_BACKEND_URL=https://dimini-backend-production.up.railway.app
   NEXT_PUBLIC_API_URL=https://dimini-backend-production.up.railway.app
   ```
3. Frontend will auto-redeploy with new variables

### Step 8: Connect Your Custom Domain (10 minutes)

#### For Frontend:

1. In Railway, click **frontend** service
2. Go to **Settings** → **Networking**
3. Click **"Custom Domain"**
4. Enter your domain: `dimini.yourdomain.com`
5. Railway shows DNS records you need to add

#### Update DNS:

1. Go to your domain registrar (GoDaddy, Namecheap, etc.)
2. Add CNAME record:
   ```
   Type: CNAME
   Name: dimini (or @)
   Value: dimini-frontend-production.up.railway.app
   TTL: 300
   ```
3. Wait 5-10 minutes for DNS propagation

#### For Backend API:

1. Click **backend** service
2. **Settings** → **Networking** → **Custom Domain**
3. Enter: `api.yourdomain.com`
4. Add DNS CNAME:
   ```
   Type: CNAME
   Name: api
   Value: dimini-backend-production.up.railway.app
   TTL: 300
   ```

### Step 9: Update Environment After Domain Connection (5 minutes)

Once your custom domains are live:

1. Update **frontend** variables:
   ```env
   NEXT_PUBLIC_BACKEND_URL=https://api.yourdomain.com
   NEXT_PUBLIC_API_URL=https://api.yourdomain.com
   ```

2. Railway auto-redeploys

### Step 10: Test Everything! (10 minutes)

#### Health Check:

```bash
# Test backend
curl https://api.yourdomain.com/health

# Expected response:
{"status":"healthy","timestamp":"..."}
```

#### Test Frontend:

1. Open: `https://dimini.yourdomain.com`
2. You should see the landing page
3. Try creating a patient
4. Start a session
5. Check if graph visualization loads

#### Check Logs:

If something fails:

1. Go to Railway service
2. Click **"Deployments"**
3. View **Deploy Logs** for errors
4. Common issues:
   - Missing environment variables
   - Database connection errors (check NEO4J_URI)
   - API key issues (verify keys are correct)

---

## 🆘 Troubleshooting

### Backend won't start

**Error:** `Prisma client not generated`

**Fix:** Railway should run `prisma generate` automatically. If not:
1. Add to `backend/Dockerfile` before CMD:
   ```dockerfile
   RUN python -m prisma generate
   ```

### Frontend can't reach backend

**Error:** `Network request failed` or CORS errors

**Fix:**
1. Verify `NEXT_PUBLIC_BACKEND_URL` in frontend variables
2. Make sure backend is deployed and healthy
3. Check backend logs for CORS errors

### Neo4j connection fails

**Error:** `Unable to connect to Neo4j`

**Fix:**
1. Verify Neo4j service is running (check Railway dashboard)
2. Check `NEO4J_URI` uses internal Railway networking:
   ```env
   NEO4J_URI=bolt://neo4j.railway.internal:7687
   ```
3. Verify `NEO4J_PASSWORD` matches in both services

### Out of Memory

**Error:** `Container killed (OOM)`

**Fix:** Railway free tier has 512MB RAM limit per service
1. In Neo4j variables, reduce memory:
   ```env
   NEO4J_server_memory_heap_max__size=256M
   NEO4J_server_memory_pagecache_size=128M
   ```

### Database not persisting

**Problem:** Data disappears after redeployment

**Fix:** Railway auto-creates volumes for databases. Check:
1. PostgreSQL service → **Data** tab → Verify volume exists
2. Neo4j service → Add volume mount if missing

---

## 🔍 Monitoring Your Deployment

### Check Railway Credit Usage:

1. Click your profile icon
2. Go to **"Billing"**
3. See usage: Should be ~$0.50-$1.00 per day for hackathon demo

### View Logs:

```bash
# Install Railway CLI (optional)
npm i -g @railway/cli

# Login
railway login

# View logs
railway logs --service backend
railway logs --service frontend
```

### Monitor Performance:

1. Railway Dashboard → **Metrics** tab shows:
   - CPU usage
   - Memory usage
   - Network traffic
   - Request count

---

## 🎉 Success Checklist

- [ ] Backend returns `{"status":"healthy"}` at `/health`
- [ ] Frontend loads at your domain
- [ ] Can create a patient in the UI
- [ ] Can start a session
- [ ] Graph visualization appears
- [ ] WebSocket connects (check browser console)
- [ ] No errors in Railway logs

---

## 💰 Cost Breakdown (2-day hackathon)

**Railway Free Tier ($5 credit):**
- PostgreSQL: ~$0.10/day
- Neo4j: ~$0.30/day
- Backend: ~$0.20/day
- Frontend: ~$0.15/day
- **Total: ~$0.75/day**

**2 days = ~$1.50** (well within $5 free credit!)

---

## 🧹 Cleanup After Hackathon

To avoid charges after your demo:

1. Go to Railway dashboard
2. Click on your project
3. **Settings** → **Danger** → **Delete Project**

Or just let the free credit run out (Railway pauses services when credit expires).

---

## 🚨 Emergency Fixes

### Backend crash loop:

```bash
# Check logs in Railway dashboard
# Look for error messages

# Common fixes:
# 1. Verify all environment variables are set
# 2. Check DATABASE_URL format
# 3. Ensure Prisma schema matches database
```

### Frontend 500 errors:

```bash
# Check frontend build logs
# Ensure standalone build works:

# Add to frontend/next.config.js (already done):
output: 'standalone'
```

### Neo4j won't start:

```bash
# Reduce memory in Neo4j variables:
NEO4J_server_memory_heap_max__size=256M
```

---

## 📞 Need Help?

1. **Railway Discord:** [discord.gg/railway](https://discord.gg/railway)
2. **Railway Docs:** [docs.railway.app](https://docs.railway.app)
3. **Check logs** in Railway dashboard first!

---

## 🏆 Hackathon Tips

1. **Deploy early!** Don't wait until last minute
2. **Test your demo** end-to-end before presenting
3. **Keep Railway logs open** during judging (in case of issues)
4. **Have backup screenshots** if site goes down
5. **Monitor your free credit** - $5 should last 5-7 days

---

## ✅ You're All Set!

Your Dimini app should now be live at:
- **Frontend:** `https://dimini.yourdomain.com`
- **Backend API:** `https://api.yourdomain.com`

**Time to win that hackathon!** 🎯

---

## 📸 Demo Day Checklist

Before judging:

- [ ] Test all features work
- [ ] Prepare sample patient data
- [ ] Have a demo session ready
- [ ] Check graph visualizations load
- [ ] Clear any error messages
- [ ] Test on judge's network (sometimes wifi blocks WebSocket)
- [ ] Have backup video recording

**Good luck!** 🚀
