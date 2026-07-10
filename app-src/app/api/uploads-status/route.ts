import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { listMonthUploads } from '@/lib/drive';
import { ALL_BRANDS } from '@/lib/brands';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = session.user as any;
  if (user.role !== 'processor') {
    return NextResponse.json({ error: 'Processor access only' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const month = searchParams.get('month') || '';
  if (!month) return NextResponse.json({ error: 'Month required' }, { status: 400 });

  const uploads = await listMonthUploads(month);

  // Map to brand status
  const uploadedBrands = new Set(uploads.map(u => u.brand));
  const status = ALL_BRANDS.map(brand => ({
    brand,
    uploaded: uploadedBrands.has(brand),
    file: uploads.find(u => u.brand === brand) || null,
  }));

  return NextResponse.json({
    month,
    total: ALL_BRANDS.length,
    uploaded: uploadedBrands.size,
    pending: ALL_BRANDS.length - uploadedBrands.size,
    brands: status,
  });
}
