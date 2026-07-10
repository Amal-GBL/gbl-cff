'use client';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

function getCurrentMonth(): string {
  const d = new Date();
  return `${d.getMonth() + 1}-${d.getFullYear()}`;
}

interface BrandStatus {
  brand: string;
  uploaded: boolean;
  file: { fileName: string; uploadedAt: string; webViewLink: string } | null;
}

interface UploadStatus {
  month: string;
  total: number;
  uploaded: number;
  pending: number;
  brands: BrandStatus[];
}

export default function ProcessorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [month, setMonth] = useState(getCurrentMonth());
  const [uploadStatus, setUploadStatus] = useState<UploadStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') {
      const role = (session?.user as any)?.role;
      if (role !== 'processor') router.push('/upload');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (month) fetchStatus();
  }, [month]);

  async function fetchStatus() {
    setLoading(true);
    try {
      const res = await fetch(`/api/uploads-status?month=${month}`);
      const data = await res.json();
      setUploadStatus(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const user = session?.user as any;

  // Month options
  const monthOptions = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getMonth() + 1}-${d.getFullYear()}`;
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const label = `${months[d.getMonth()]} ${d.getFullYear()}`;
    return { key, label };
  });

  if (status === 'loading') return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f7f4]">
      <div className="text-gray-400">Loading...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      {/* Header */}
      <div className="bg-[#16213e] text-white px-8 py-4 flex items-center justify-between sticky top-0 z-50">
        <div>
          <div className="text-xs font-bold tracking-widest text-gray-400 uppercase">GBL Finance · Processor</div>
          <div className="text-lg font-bold">Cash Flow Consolidation</div>
        </div>
        <div className="flex items-center gap-6">
          <select
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="bg-[#0f3460] text-white border border-gray-600 rounded-lg px-3 py-2 text-sm"
          >
            {monthOptions.map(m => (
              <option key={m.key} value={m.key}>{m.label}</option>
            ))}
          </select>
          <div className="text-right">
            <div className="text-sm font-semibold">{user?.name}</div>
            <div className="text-xs text-gray-400">{user?.email}</div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-xs text-gray-400 hover:text-white border border-gray-600 rounded px-3 py-1"
          >
            Sign out
          </button>
        </div>
      </div>

      <div className="px-8 py-6">

        {/* Upload status overview */}
        {uploadStatus && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Total Brands</div>
              <div className="text-3xl font-bold text-[#1a1a2e]">{uploadStatus.total}</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-wider text-green-600 mb-1">Uploaded</div>
              <div className="text-3xl font-bold text-green-700">{uploadStatus.uploaded}</div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-1">Pending</div>
              <div className="text-3xl font-bold text-amber-700">{uploadStatus.pending}</div>
            </div>
          </div>
        )}

        {/* Brand status grid */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">
              Brand Upload Status — {monthOptions.find(m => m.key === month)?.label}
            </h2>
            <button
              onClick={fetchStatus}
              className="text-xs text-blue-600 hover:underline"
            >
              ↻ Refresh
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading...</div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {uploadStatus?.brands.map(b => (
                <div
                  key={b.brand}
                  className={`rounded-lg p-3 border ${
                    b.uploaded
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{b.uploaded ? '✅' : '⏳'}</span>
                    <div>
                      <div className="text-sm font-semibold text-[#1a1a2e]">{b.brand}</div>
                      {b.file ? (
                        <div className="text-xs text-gray-500 mt-0.5">
                          {new Date(b.file.uploadedAt).toLocaleDateString('en-IN', {
                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                          })}
                          {' · '}
                          <a href={b.file.webViewLink} target="_blank" className="text-blue-600 hover:underline">
                            View
                          </a>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400 mt-0.5">Not uploaded</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CFF Dashboard embed toggle */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 flex items-center justify-between border-b border-gray-100">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">Consolidation Dashboard</h2>
              <p className="text-xs text-gray-400 mt-1">Process, reconcile, correct and bake in the monthly data</p>
            </div>
            <button
              onClick={() => setShowDashboard(!showDashboard)}
              className="bg-[#2e6b9e] hover:bg-[#1e5280] text-white font-bold py-2 px-5 rounded-lg text-sm transition-all"
            >
              {showDashboard ? 'Hide Dashboard' : 'Open Dashboard'}
            </button>
          </div>

          {showDashboard && (
            <iframe
              src="/dashboard"
              className="w-full border-0"
              style={{ height: 'calc(100vh - 200px)' }}
              title="GBL CFF Dashboard"
            />
          )}
        </div>
      </div>
    </div>
  );
}
