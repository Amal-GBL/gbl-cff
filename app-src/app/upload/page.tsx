'use client';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

const MONTHS: Record<string, string> = {
  '1':'January','2':'February','3':'March','4':'April','5':'May','6':'June',
  '7':'July','8':'August','9':'September','10':'October','11':'November','12':'December'
};

function getCurrentMonth(): string {
  const d = new Date();
  return `${d.getMonth() + 1}-${d.getFullYear()}`;
}

export default function UploadPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ success?: string; error?: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') {
      const role = (session?.user as any)?.role;
      if (role === 'processor') router.push('/processor');
      if (role === 'unauthorized') router.push('/login');
    }
  }, [status, session, router]);

  const user = session?.user as any;
  const brand = user?.brand || '';

  // Build last 6 months as options
  const monthOptions = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getMonth() + 1}-${d.getFullYear()}`;
    const label = `${MONTHS[String(d.getMonth() + 1)]} ${d.getFullYear()}`;
    return { key, label };
  });

  async function handleUpload() {
    if (!file || !selectedMonth) return;
    setUploading(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('month', selectedMonth);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) {
        setResult({ success: data.message });
        setFile(null);
        if (fileRef.current) fileRef.current.value = '';
      } else {
        setResult({ error: data.error });
      }
    } catch (e: any) {
      setResult({ error: e.message });
    } finally {
      setUploading(false);
    }
  }

  if (status === 'loading') return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f7f4]">
      <div className="text-gray-400">Loading...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      {/* Header */}
      <div className="bg-[#16213e] text-white px-8 py-4 flex items-center justify-between">
        <div>
          <div className="text-xs font-bold tracking-widest text-gray-400 uppercase">GBL Finance</div>
          <div className="text-lg font-bold">Cash Flow · File Upload</div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm font-semibold">{brand}</div>
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

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="bg-white rounded-2xl shadow p-8">
          <h2 className="text-xl font-bold text-[#1a1a2e] mb-1">Upload Cash Flow File</h2>
          <p className="text-sm text-gray-500 mb-8">Upload your brand's monthly cash flow Excel file for consolidation.</p>

          {/* Month selector */}
          <div className="mb-6">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Month</label>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:border-blue-400 focus:outline-none"
            >
              {monthOptions.map(m => (
                <option key={m.key} value={m.key}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* File drop zone */}
          <div className="mb-6">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">File</label>
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                dragOver ? 'border-blue-400 bg-blue-50' :
                file ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-blue-300'
              }`}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => {
                e.preventDefault(); setDragOver(false);
                const f = e.dataTransfer.files[0];
                if (f) setFile(f);
              }}
              onClick={() => fileRef.current?.click()}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.xlsb"
                className="hidden"
                onChange={e => setFile(e.target.files?.[0] || null)}
              />
              {file ? (
                <div>
                  <div className="text-2xl mb-2">✅</div>
                  <div className="font-semibold text-green-700">{file.name}</div>
                  <div className="text-sm text-gray-500 mt-1">{(file.size / 1024).toFixed(0)} KB</div>
                  <div className="text-xs text-gray-400 mt-2">Click to change file</div>
                </div>
              ) : (
                <div>
                  <div className="text-3xl mb-3">📂</div>
                  <div className="font-semibold text-gray-600">Drop file here or click to browse</div>
                  <div className="text-sm text-gray-400 mt-1">.xlsx · .xls · .xlsb</div>
                </div>
              )}
            </div>
          </div>

          {/* Expected filename hint */}
          {selectedMonth && (
            <div className="mb-6 text-xs text-gray-400 bg-gray-50 rounded-lg px-4 py-3">
              Expected filename format: <code className="text-gray-600">{brand} - Cashflow {monthOptions.find(m=>m.key===selectedMonth)?.label?.replace(' ','_')} V1.xlsx</code>
            </div>
          )}

          {/* Result */}
          {result?.success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">
              ✅ {result.success}
            </div>
          )}
          {result?.error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              ❌ {result.error}
            </div>
          )}

          {/* Upload button */}
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full bg-[#2e6b9e] hover:bg-[#1e5280] disabled:bg-gray-300 text-white font-bold py-3 px-6 rounded-xl transition-all text-sm"
          >
            {uploading ? 'Uploading...' : 'Upload File'}
          </button>
        </div>
      </div>
    </div>
  );
}
