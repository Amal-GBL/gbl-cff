// ── Brand → Email mapping ─────────────────────────────────────────────────
// Add each brand stakeholder's email here
// Format: 'email@goatbrandlabs.com': 'Brand Name'
export const BRAND_EMAIL_MAP: Record<string, string> = {
  // Fill in when brand stakeholder emails are provided
  // 'firstname.lastname@goatbrandlabs.com': 'Frangipani',
  // 'firstname.lastname@goatbrandlabs.com': 'GBL Garden',
  // etc.
};

// ── Processor emails (Finance Controller + team) ──────────────────────────
export const PROCESSOR_EMAILS: string[] = [
  // Add processor emails here
  // 'sangeetha@goatbrandlabs.com',
];

// ── All 21 brands (for status tracking) ──────────────────────────────────
export const ALL_BRANDS = [
  'Abhishti',
  'Break Bounce',
  'Chumbak',
  'Frangipani',
  'GBL Antares',
  'GBL Garden',
  'GBL India',
  'GBL Mimosa',
  'GBL Pollux',
  'GBL Singapore',
  'GBL Sirius',
  'Imara',
  'Leafy Tales',
  'Neemli',
  'Nutriglow',
  'Pet Edge',
  'Pepe',
  'TLL',
  'trueBrowns',
  'Voylla',
  'Yuris',
];

// ── Allowed domain ────────────────────────────────────────────────────────
export const ALLOWED_DOMAIN = 'goatbrandlabs.com';

// ── Get role for a given email ────────────────────────────────────────────
export function getRole(email: string): 'processor' | 'brand' | 'unauthorized' {
  if (!email.endsWith(`@${ALLOWED_DOMAIN}`)) return 'unauthorized';
  if (PROCESSOR_EMAILS.includes(email)) return 'processor';
  if (BRAND_EMAIL_MAP[email]) return 'brand';
  return 'unauthorized';
}

// ── Get brand name for a given email ─────────────────────────────────────
export function getBrand(email: string): string | null {
  return BRAND_EMAIL_MAP[email] || null;
}
