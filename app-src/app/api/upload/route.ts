import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getOrCreateMonthFolder, uploadToDrive } from '@/lib/drive';
import { notifyUpload } from '@/lib/notify';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  // Auth check
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user as any;
  if (user.role !== 'brand') {
    return NextResponse.json({ error: 'Only brand users can upload files' }, { status: 403 });
  }

  const brand = user.brand as string;
  const email = user.email as string;

  // Parse form data
  const formData = await req.formData();
  const file = formData.get('file') as File;
  const month = formData.get('month') as string; // e.g. "6-2026"

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  if (!month) return NextResponse.json({ error: 'No month provided' }, { status: 400 });

  // Validate file type
  const validTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/vnd.ms-excel.sheet.binary.macroEnabled.12',
  ];
  if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|xlsb)$/i)) {
    return NextResponse.json({ error: 'Only Excel files (.xlsx, .xls, .xlsb) are accepted' }, { status: 400 });
  }

  try {
    // Build standardised filename: "GBL Garden - Cashflow Jun 26 V1.xlsx"
    const [mo, yr] = month.split('-');
    const monthNames: Record<string, string> = {
      '1':'Jan','2':'Feb','3':'Mar','4':'Apr','5':'May','6':'Jun',
      '7':'Jul','8':'Aug','9':'Sep','10':'Oct','11':'Nov','12':'Dec'
    };
    const monName = monthNames[mo] || mo;
    const yrShort = yr.slice(2);
    const ext = file.name.split('.').pop();
    const fileName = `${brand} - Cashflow ${monName} ${yrShort} V1.${ext}`;

    // Read file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Get or create month folder in Drive
    const folderId = await getOrCreateMonthFolder(month);

    // Upload to Drive
    const { webViewLink } = await uploadToDrive(
      buffer,
      fileName,
      file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      folderId
    );

    // Send email notification to processor
    await notifyUpload({
      brand,
      fileName,
      uploadedBy: email,
      month,
      driveLink: webViewLink,
    });

    return NextResponse.json({
      success: true,
      fileName,
      message: `File uploaded successfully. The finance team has been notified.`,
    });

  } catch (err: any) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 });
  }
}
