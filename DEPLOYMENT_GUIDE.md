# Deployment Guide - BongoExpress

## Prerequisites

1. GitHub account
2. Vercel account (sign up at vercel.com)
3. Render account (sign up at render.com)
4. MongoDB Atlas account (cloud.mongodb.com) for production database

---

## Part 1: Prepare Your Code

### Step 1: Update Frontend API Configuration

Update `client/src/api/axios.js` to use environment variable:

```javascript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});
```

### Step 2: Create Environment File for Local Development

Create `client/.env.local`:

```
VITE_API_URL=http://localhost:5000/api
```

### Step 3: Push to GitHub

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Prepare for deployment"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

---

## Part 2: Deploy Backend to Render

### Step 1: Create MongoDB Atlas Database

1. Go to https://cloud.mongodb.com
2. Create a new cluster (free tier available)
3. Create a database user (username & password)
4. Add IP address `0.0.0.0/0` to allow connections from anywhere
5. Get your connection string (looks like `mongodb+srv://username:password@cluster.mongodb.net/`)

### Step 2: Deploy to Render

1. Go to https://render.com and sign in
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Select the repository with your project
5. Configure the service:

   - **Name**: `bongoexpress-backend` (or your preferred name)
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install` or `pnpm install`
   - **Start Command**: `node index.js`
   - **Instance Type**: Free

6. Add Environment Variables (click "Advanced" → "Add Environment Variable"):

   ```
   MONGO_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=your_random_secret_key_min_32_chars
   JWT_EXPIRES_IN=90d
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USERNAME=your_email@gmail.com
   EMAIL_PASSWORD=your_gmail_app_password
   EMAIL_FROM=BongoExpress <noreply@bongoexpress.com>
   PORT=5000
   NODE_ENV=production
   ```

7. Click **"Create Web Service"**
8. Wait for deployment (5-10 minutes)
9. Copy your backend URL (e.g., `https://bongoexpress-backend.onrender.com`)

**Important Notes:**

- Free tier sleeps after 15 minutes of inactivity (first request takes ~30 seconds to wake up)
- For production, upgrade to paid tier ($7/month) for always-on service

---

## Part 3: Deploy Frontend to Vercel

### Step 1: Update Frontend Configuration

1. Your backend URL from Render will be something like:
   `https://bongoexpress-backend.onrender.com`

### Step 2: Deploy to Vercel

1. Go to https://vercel.com and sign in
2. Click **"Add New"** → **"Project"**
3. Import your GitHub repository
4. Configure the project:

   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build` (leave as default)
   - **Output Directory**: `dist` (leave as default)

5. Add Environment Variables:

   - Click **"Environment Variables"**
   - Add variable:
     - **Name**: `VITE_API_URL`
     - **Value**: `https://your-backend-url.onrender.com/api`
     - **Environments**: Production, Preview, Development (check all)

6. Click **"Deploy"**
7. Wait for deployment (2-5 minutes)
8. Your site will be live at `https://your-project-name.vercel.app`

---

## Part 4: Configure Backend CORS

Update `server/index.js` to allow your Vercel frontend:

```javascript
app.use(
  cors({
    origin: ["http://localhost:5173", "https://your-project-name.vercel.app"],
    credentials: true,
  })
);
```

Then push changes:

```bash
git add .
git commit -m "Update CORS for production"
git push
```

Render will auto-redeploy when it detects the changes.

---

## Part 5: Post-Deployment Checklist

### Test Everything:

- [ ] User registration
- [ ] User login
- [ ] Admin dashboard loads
- [ ] Staff dashboard loads
- [ ] Customer dashboard loads
- [ ] Create shipment
- [ ] Payment tracking
- [ ] Receipt download
- [ ] Email notifications
- [ ] Shipment tracking

### Common Issues:

**Backend won't start:**

- Check Render logs (click on service → "Logs")
- Verify all environment variables are set correctly
- Ensure MongoDB connection string is correct

**Frontend can't connect to backend:**

- Check `VITE_API_URL` is correct in Vercel environment variables
- Verify CORS settings in backend
- Check browser console for errors

**Database connection fails:**

- Verify MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- Check database user credentials
- Ensure connection string format is correct

**Emails not sending:**

- Use Gmail App Password (not regular password)
- Enable "Less secure app access" or use OAuth2
- Check EMAIL_HOST and EMAIL_PORT are correct

---

## Part 6: Custom Domain (Optional)

### For Vercel (Frontend):

1. Go to Project Settings → Domains
2. Add your domain
3. Follow DNS configuration instructions

### For Render (Backend):

1. Upgrade to paid plan ($7/month minimum)
2. Go to service Settings → Custom Domain
3. Add your domain
4. Follow DNS configuration instructions

---

## Maintenance Tips

1. **Monitor Logs**: Regularly check Render and Vercel logs for errors
2. **Database Backups**: Set up automated backups in MongoDB Atlas
3. **Update Dependencies**: Keep packages updated for security
4. **Environment Variables**: Never commit `.env` files to git
5. **Free Tier Limitations**: Render free tier sleeps after inactivity

---

## Cost Summary

**Free Tier:**

- Render: Free (with sleep limitations)
- Vercel: Free (generous limits for hobby projects)
- MongoDB Atlas: Free (512MB storage)
- **Total: $0/month**

**Production Ready:**

- Render: $7/month (always-on, better performance)
- Vercel: Free or $20/month for team features
- MongoDB Atlas: Free or $9/month for more storage
- **Total: ~$7-36/month depending on needs**

---

## Support

If you encounter issues:

1. Check deployment logs first
2. Verify environment variables
3. Test API endpoints with Postman/Insomnia
4. Check CORS configuration
5. Review MongoDB connection

Good luck with your deployment! 🚀
