# EC2 Setup & Deployment Guide

## Prerequisites
- Ubuntu EC2 instance with Node.js installed
- Port 3000 open in Security Group (or 80/443 with Nginx later)

## Step 1 — Clone repo on EC2

```bash
cd ~
git clone https://github.com/Amal-GBL/gbl-cff.git
# App code will be in a separate branch or folder
```

## Step 2 — Install dependencies

```bash
cd gbl-cff-app
npm install
```

## Step 3 — Create .env file

```bash
cp .env.example .env
nano .env
# Fill in all values
```

Generate NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

## Step 4 — Build the app

```bash
npm run build
```

## Step 5 — Install PM2 and start

```bash
npm install -g pm2
pm2 start npm --name "gbl-cff" -- start
pm2 save
pm2 startup  # follow the printed command to auto-start on reboot
```

## Step 6 — Test

Open browser: `http://YOUR_EC2_IP:3000`

## Step 7 — Google Cloud Setup (one-time)

1. Go to console.cloud.google.com
2. Create project: GBL-CFF
3. Enable APIs:
   - Google Drive API
   - Gmail API
   - Google OAuth 2.0
4. Create OAuth 2.0 credentials:
   - Type: Web Application
   - Authorised redirect URIs:
     - http://YOUR_EC2_IP:3000/api/auth/callback/google
     - https://gbl-cff.duckdns.org/api/auth/callback/google (add later)
5. Create Service Account:
   - Name: gbl-cff-service
   - Download JSON key
   - Share your Drive folder with the service account email

## Step 8 — Brand email mapping

Edit `lib/brands.ts`:
```typescript
export const BRAND_EMAIL_MAP: Record<string, string> = {
  'brand.user@goatbrandlabs.com': 'Frangipani',
  'another.user@goatbrandlabs.com': 'GBL Garden',
  // ... all 21 brands
};

export const PROCESSOR_EMAILS: string[] = [
  'sangeetha@goatbrandlabs.com',
  // other processor if needed
];
```

Then rebuild: `npm run build && pm2 restart gbl-cff`

## Phase 4 — Nginx + DuckDNS (later)

```bash
sudo apt install nginx certbot python3-certbot-nginx
```

Nginx config (`/etc/nginx/sites-available/gbl-cff`):
```nginx
server {
    server_name gbl-cff.duckdns.org;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

SSL:
```bash
sudo certbot --nginx -d gbl-cff.duckdns.org
```

Then update NEXTAUTH_URL in .env to `https://gbl-cff.duckdns.org`
