# Rishi Seeds Admin Portal — Server Deployment Guide

## Server Details
- **Host:** 116.203.159.36
- **User:** appdev
- **SSH Key:** ~/.ssh/appdev.pem

---

## Step 1 — Connect to Server

```bash
chmod 600 ~/.ssh/appdev.pem
ssh -i ~/.ssh/appdev.pem appdev@116.203.159.36
```

---

## Step 2 — Install System Dependencies (run once)

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install PM2 (process manager to keep app running)
sudo npm install -g pm2

# Install Git
sudo apt install -y git

# Verify
node -v    # should be v20.x
npm -v
psql --version
pm2 -v
```

---

## Step 3 — Set Up PostgreSQL Database

```bash
# Switch to postgres user
sudo -u postgres psql

# Inside psql shell — run these commands:
CREATE USER rishiadmin WITH PASSWORD 'YourStrongPassword123';
CREATE DATABASE rishiseeds OWNER rishiadmin;
GRANT ALL PRIVILEGES ON DATABASE rishiseeds TO rishiadmin;
\q
```

---

## Step 4 — Upload or Clone the Project

### Option A: Copy from your local machine (from YOUR computer, not the server)
```bash
# Run this on your local machine
scp -i ~/.ssh/appdev.pem -r /path/to/rishi-seeds-portal appdev@116.203.159.36:/home/appdev/rishi-seeds
```

### Option B: Clone from Git (if you have a repo)
```bash
# Run on the server
cd /home/appdev
git clone https://your-git-repo-url.git rishi-seeds
```

---

## Step 5 — Create Environment File

```bash
cd /home/appdev/rishi-seeds

# Create the .env file
nano .env
```

Paste the following into the file (edit values to match your setup):

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://rishiadmin:YourStrongPassword123@localhost:5432/rishiseeds
SESSION_SECRET=change-this-to-a-long-random-string-minimum-32-chars
```

Save with `Ctrl+O`, `Enter`, `Ctrl+X`.

---

## Step 6 — Install Dependencies & Build

```bash
cd /home/appdev/rishi-seeds

# Install all packages
npm install

# Run database migrations (creates all tables)
npm run db:push

# Build the app (compiles frontend + backend into dist/)
npm run build
```

---

## Step 7 — Start the App with PM2

```bash
cd /home/appdev/rishi-seeds

# Start the app
pm2 start "NODE_ENV=production node dist/index.cjs" --name rishi-seeds

# Save PM2 so it restarts on server reboot
pm2 save

# Set PM2 to start on system boot
pm2 startup
# Copy and run the command that PM2 prints out
```

---

## Step 8 — Verify the App is Running

```bash
# Check PM2 status
pm2 status

# View app logs
pm2 logs rishi-seeds

# Test the app is responding
curl http://localhost:5000
```

---

## Step 9 — Open Firewall Port (if needed)

```bash
sudo ufw allow 5000/tcp
sudo ufw status
```

Your app is now accessible at: **http://116.203.159.36:5000**

---

## Step 10 (Optional) — Set Up Nginx on Port 80

This makes the app available on port 80 (standard web port) instead of port 5000.

```bash
sudo apt install -y nginx

sudo nano /etc/nginx/sites-available/rishi-seeds
```

Paste this config:

```nginx
server {
    listen 80;
    server_name 116.203.159.36;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and start nginx:

```bash
sudo ln -s /etc/nginx/sites-available/rishi-seeds /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo ufw allow 80/tcp
```

App now accessible at: **http://116.203.159.36**

---

## Updating the App Later

When you make code changes and want to redeploy:

```bash
# On your local machine — copy updated files
scp -i ~/.ssh/appdev.pem -r /path/to/rishi-seeds-portal appdev@116.203.159.36:/home/appdev/rishi-seeds

# On the server
cd /home/appdev/rishi-seeds
npm install
npm run db:push
npm run build
pm2 restart rishi-seeds
```

---

## Useful PM2 Commands

```bash
pm2 status              # Check if app is running
pm2 logs rishi-seeds    # View live logs
pm2 restart rishi-seeds # Restart the app
pm2 stop rishi-seeds    # Stop the app
pm2 delete rishi-seeds  # Remove from PM2
```

---

## Default Login

After deployment, log in with:
- **Username:** admin
- **Password:** admin123 (or whatever was set during initial setup)
