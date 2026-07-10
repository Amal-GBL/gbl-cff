# GBL CFF — Google Apps Script Deployment Guide

## Files to deploy
- `gbl_cff_app.js` → Code.gs (main server logic)
- `brand_upload_page.html` → BrandUpload.html
- `processor_page.html` → ProcessorDashboard.html

## Step-by-step setup

### 1. Create Apps Script project
1. Go to script.google.com
2. Click "New Project"
3. Rename to "GBL CFF App"

### 2. Add files
**Code.gs** — paste contents of `gbl_cff_app.js`

**BrandUpload.html** — click + → HTML → name it "BrandUpload" → paste brand_upload_page.html

**ProcessorDashboard.html** — click + → HTML → name it "ProcessorDashboard" → paste processor_page.html

### 3. Fill in brand-to-email mapping
In Code.gs, update BRAND_MAP with actual emails:
```
'actual.email@goatbrandlabs.com': 'Brand Name',
```

### 4. Enable APIs
In Apps Script: Extensions → Services → Add:
- Google Drive API
- Gmail API

### 5. Deploy as Web App
1. Click Deploy → New deployment
2. Type: Web App
3. Execute as: Me (sangeetha.v@goatbrandlabs.com)
4. Who has access: Anyone with Google Account
5. Click Deploy → Copy the Web App URL

### 6. Update DuckDNS redirect
In GitHub Pages index.html, add redirect:
```html
<meta http-equiv="refresh" content="0;url=YOUR_APPS_SCRIPT_URL">
```

### 7. Update deployment URL in Code.gs
Replace YOUR_DEPLOYMENT_ID in the email notification link.

## Folder structure created automatically in Drive
```
GBL CFF (your folder)
  └── FY27
        └── Jun-2026
              ├── Abhishti - Cashflow Jun 26 V1.xlsx
              ├── Frangipani - Cashflow Jun 26 V1.xlsx
              └── ...
```

## Monthly update
Change CONSOLIDATION_MONTH in CONFIG after each Bake In.
Re-deploy (Manage deployments → Edit → New version).
