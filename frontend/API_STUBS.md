# API Endpoints — Plug these in when EC2 is ready

All endpoints use session cookie auth (Google OAuth).

## GET /api/me
Returns current user info.
```json
{ "email": "sangeetha.v@goatbrandlabs.com", "role": "processor", "brand": null }
{ "email": "frangipani.finance@goatbrandlabs.com", "role": "brand", "brand": "Frangipani" }
```

## GET /api/upload-status
Returns upload status for current consolidation month.
```json
{
  "month": "6-2026",
  "total": 21,
  "uploaded": {
    "Frangipani": { "fileName": "Frangipani - Cashflow Jun 26 V1.xlsx", "version": 1, "date": "10-Jul 09:30", "size": 245000, "fileId": "DRIVE_FILE_ID" },
    "GBL Garden": { ... }
  }
}
```

## POST /api/upload
Multipart form upload. Field: `file`.
```json
{ "success": true, "fileName": "Frangipani - Cashflow Jun 26 V1.xlsx", "version": 1 }
```

## GET /api/get-files
Returns all uploaded brand files for current month as base64.
```json
[
  { "name": "Frangipani - Cashflow Jun 26 V1.xlsx", "data": "base64...", "mimeType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
  ...
]
```

## GET /auth/google
Redirects to Google OAuth. After auth, redirects to /processor.html or /upload.html based on role.

## Brand-to-email map (in server config)
```js
const BRAND_MAP = {
  'frangipani.finance@goatbrandlabs.com': 'Frangipani',
  'gblgarden.finance@goatbrandlabs.com':  'GBL Garden',
  // ... fill in actual emails
  'sangeetha.v@goatbrandlabs.com': '__PROCESSOR__',
};
const PROCESSOR_EMAILS = ['sangeetha.v@goatbrandlabs.com'];
```
