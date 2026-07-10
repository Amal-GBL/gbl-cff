import nodemailer from 'nodemailer';
import { PROCESSOR_EMAILS } from './brands';

function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD, // Gmail App Password
    },
  });
}

// ── Notify processor when brand uploads a file ────────────────────────────
export async function notifyUpload({
  brand,
  fileName,
  uploadedBy,
  month,
  driveLink,
}: {
  brand: string;
  fileName: string;
  uploadedBy: string;
  month: string;
  driveLink: string;
}) {
  const transporter = getTransporter();

  const subject = `[GBL CFF] ${brand} uploaded ${month} cash flow file`;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px">
      <h2 style="color:#1a1a2e">GBL Cash Flow — New Upload</h2>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px;font-weight:bold;color:#555">Brand</td><td style="padding:8px">${brand}</td></tr>
        <tr style="background:#f5f5f5"><td style="padding:8px;font-weight:bold;color:#555">Month</td><td style="padding:8px">${month}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;color:#555">File</td><td style="padding:8px">${fileName}</td></tr>
        <tr style="background:#f5f5f5"><td style="padding:8px;font-weight:bold;color:#555">Uploaded by</td><td style="padding:8px">${uploadedBy}</td></tr>
      </table>
      <p style="margin-top:20px">
        <a href="${driveLink}" style="background:#2e6b9e;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none">
          View in Google Drive
        </a>
      </p>
      <p style="color:#999;font-size:12px;margin-top:20px">
        Log in to the GBL CFF tool to process this file.
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: `GBL Finance <${process.env.GMAIL_USER}>`,
    to: PROCESSOR_EMAILS.join(','),
    subject,
    html,
  });
}
