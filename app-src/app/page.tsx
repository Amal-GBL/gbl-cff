'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') {
      const role = (session?.user as any)?.role;
      if (role === 'processor') router.push('/processor');
      else if (role === 'brand') router.push('/upload');
      else router.push('/login');
    }
  }, [status, session, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f7f4]">
      <div className="text-gray-400 text-sm">Redirecting...</div>
    </div>
  );
}
