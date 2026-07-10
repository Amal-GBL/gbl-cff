// ═══════════════════════════════════════════════════════════════════════════
// GBL Cash Flow Consolidation — Google Apps Script Web App
// ═══════════════════════════════════════════════════════════════════════════

// ── CONFIG ─────────────────────────────────────────────────────────────────
const CONFIG = {
  DRIVE_FOLDER_ID: '1W_32iBVFv0MCLSYRMlj_hhqclutwx7tC',
  PROCESSOR_EMAILS: ['sangeetha.v@goatbrandlabs.com'],
  DOMAIN: 'goatbrandlabs.com',
  CONSOLIDATION_MONTH: '6-2026', // advance each month after bake-in

  // ── Brand-to-email mapping (fill in actual emails) ─────────────────────
  BRAND_MAP: {
    'abhishti.finance@goatbrandlabs.com':    'Abhishti',
    'breakbounce.finance@goatbrandlabs.com': 'Break Bounce',
    'chumbak.finance@goatbrandlabs.com':     'Chumbak',
    'frangipani.finance@goatbrandlabs.com':  'Frangipani',
    'gblantares.finance@goatbrandlabs.com':  'GBL Antares',
    'gblgarden.finance@goatbrandlabs.com':   'GBL Garden',
    'gblindia.finance@goatbrandlabs.com':    'GBL India',
    'gblmimosa.finance@goatbrandlabs.com':   'GBL Mimosa',
    'gblpollux.finance@goatbrandlabs.com':   'GBL Pollux',
    'gblsingapore.finance@goatbrandlabs.com':'GBL Singapore',
    'gblsirius.finance@goatbrandlabs.com':   'GBL Sirius',
    'imara.finance@goatbrandlabs.com':       'Imara',
    'leafytales.finance@goatbrandlabs.com':  'Leafy Tales',
    'neemli.finance@goatbrandlabs.com':      'Neemli',
    'nutriglow.finance@goatbrandlabs.com':   'Nutriglow',
    'petedge.finance@goatbrandlabs.com':     'Pet Edge',
    'pepe.finance@goatbrandlabs.com':        'Pepe',
    'tll.finance@goatbrandlabs.com':         'TLL',
    'truebrowns.finance@goatbrandlabs.com':  'trueBrowns',
    'voylla.finance@goatbrandlabs.com':      'Voylla',
    'yuris.finance@goatbrandlabs.com':       'Yuris',
    // Processor also gets mapped (for testing)
    'sangeetha.v@goatbrandlabs.com':         '__PROCESSOR__',
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// ROUTING — doGet handles all page requests
// ═══════════════════════════════════════════════════════════════════════════
function doGet(e) {
  const user = Session.getActiveUser().getEmail();
  if (!user || !user.endsWith('@' + CONFIG.DOMAIN)) {
    return HtmlService.createHtmlOutput(unauthorizedPage());
  }

  const role = getRole(user);
  const page = e.parameter.page || 'home';

  if (role === 'processor') {
    return HtmlService.createHtmlOutput(processorPage(user))
      .setTitle('GBL CFF — Processor Dashboard')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } else if (role === 'brand') {
    const brand = CONFIG.BRAND_MAP[user];
    return HtmlService.createHtmlOutput(brandUploadPage(user, brand))
      .setTitle('GBL CFF — ' + brand + ' Upload')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } else {
    return HtmlService.createHtmlOutput(unauthorizedPage());
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// doPost — handles file uploads from brand users
// ═══════════════════════════════════════════════════════════════════════════
function doPost(e) {
  const user = Session.getActiveUser().getEmail();
  if (!user || getRole(user) !== 'brand') {
    return ContentService.createTextOutput(JSON.stringify({error: 'Unauthorized'}))
      .setMimeType(ContentService.MimeType.JSON);
  }

  try {
    const brand = CONFIG.BRAND_MAP[user];
    const month = CONFIG.CONSOLIDATION_MONTH;
    const fileData = e.parameter.fileData;
    const fileName = e.parameter.fileName;
    const version  = getNextVersion(brand, month);

    // Build standard filename
    const [m, y] = month.split('-');
    const monthName = ['','Jan','Feb','Mar','Apr','May','Jun',
                       'Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(m)];
    const stdName = `${brand} - Cashflow ${monthName} ${y.slice(2)} V${version}.xlsx`;

    // Save to Drive
    const folder = getOrCreateMonthFolder(month);
    const blob = Utilities.newBlob(
      Utilities.base64Decode(fileData.split(',')[1]),
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      stdName
    );
    folder.createFile(blob);

    // Email notification to processors
    const uploadTime = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'dd-MMM-yyyy HH:mm');
    CONFIG.PROCESSOR_EMAILS.forEach(email => {
      GmailApp.sendEmail(
        email,
        `GBL CFF: ${brand} uploaded ${month} file`,
        `${brand} has uploaded their cash flow file for ${month}.\n\n` +
        `File: ${stdName}\n` +
        `Uploaded by: ${user}\n` +
        `Time: ${uploadTime} IST\n\n` +
        `Login to the GBL CFF tool to process.\n` +
        `https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec`
      );
    });

    return ContentService.createTextOutput(JSON.stringify({
      success: true, fileName: stdName, version
    })).setMimeType(ContentService.MimeType.JSON);

  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({error: err.message}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SERVER-SIDE FUNCTIONS (called from client via google.script.run)
// ═══════════════════════════════════════════════════════════════════════════

function getUploadStatus() {
  const month = CONFIG.CONSOLIDATION_MONTH;
  const folder = getOrCreateMonthFolder(month);
  const files = folder.getFiles();
  const uploaded = {};
  while (files.hasNext()) {
    const f = files.next();
    const name = f.getName();
    // Extract brand name from filename: "Brand Name - Cashflow Mon YY Vn.xlsx"
    const match = name.match(/^(.+?) - Cashflow/);
    if (match) {
      const brand = match[1];
      if (!uploaded[brand] || uploaded[brand].version < getVersionFromName(name)) {
        uploaded[brand] = {
          fileName: name,
          version: getVersionFromName(name),
          size: f.getSize(),
          date: Utilities.formatDate(f.getLastUpdated(), 'Asia/Kolkata', 'dd-MMM HH:mm'),
          fileId: f.getId()
        };
      }
    }
  }
  return {month, uploaded, total: 21};
}

function getFileAsBase64(fileId) {
  const file = DriveApp.getFileById(fileId);
  return {
    name: file.getName(),
    data: Utilities.base64Encode(file.getBlob().getBytes()),
    mimeType: file.getMimeType()
  };
}

function getAllFilesForMonth() {
  const status = getUploadStatus();
  const files = [];
  Object.entries(status.uploaded).forEach(([brand, info]) => {
    files.push(getFileAsBase64(info.fileId));
  });
  return files;
}

function getCurrentUser() {
  const email = Session.getActiveUser().getEmail();
  return { email, role: getRole(email), brand: CONFIG.BRAND_MAP[email] || null };
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function getRole(email) {
  if (CONFIG.PROCESSOR_EMAILS.includes(email)) return 'processor';
  if (CONFIG.BRAND_MAP[email] && CONFIG.BRAND_MAP[email] !== '__PROCESSOR__') return 'brand';
  return 'unknown';
}

function getOrCreateMonthFolder(month) {
  const root = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
  const [m, y] = month.split('-');
  const monthName = ['','Jan','Feb','Mar','Apr','May','Jun',
                     'Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(m)];
  const fyYear = parseInt(m) >= 4 ? parseInt(y) + 1 : parseInt(y);
  const fyName = `FY${fyYear.toString().slice(2)}`;
  const folderName = `${monthName}-${y}`;

  // Get or create FY folder
  let fyFolder;
  const fyIter = root.getFoldersByName(fyName);
  fyFolder = fyIter.hasNext() ? fyIter.next() : root.createFolder(fyName);

  // Get or create month folder
  let monthFolder;
  const mIter = fyFolder.getFoldersByName(folderName);
  monthFolder = mIter.hasNext() ? mIter.next() : fyFolder.createFolder(folderName);

  return monthFolder;
}

function getNextVersion(brand, month) {
  const folder = getOrCreateMonthFolder(month);
  const files = folder.getFiles();
  let maxV = 0;
  while (files.hasNext()) {
    const name = files.next().getName();
    if (name.startsWith(brand)) {
      const v = getVersionFromName(name);
      if (v > maxV) maxV = v;
    }
  }
  return maxV + 1;
}

function getVersionFromName(name) {
  const match = name.match(/V(\d+)\.xlsx$/i);
  return match ? parseInt(match[1]) : 1;
}

