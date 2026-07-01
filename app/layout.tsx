// app/layout.tsx

'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <html lang="id">
      <body className="antialiased min-h-screen bg-gray-50 flex flex-col">
        {/* ✅ HEADER GLOBAL - TETAP DI SEMUA HALAMAN */}
        <header className="pt-6 pb-4 text-center border-b border-gray-100 bg-gray-50">
          <h1 className="text-xl font-bold text-gray-700 tracking-wide">DASHBOARD</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manajemen Penjualan & Stok</p>

          {/* Navigation Menu */}
          <div className="mt-4 flex justify-center gap-2 flex-wrap">
            <Link
              href="/"
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                pathname === '/' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              📊 Dashboard
            </Link>
            <Link
              href="/manage/penjualan"
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                pathname === '/manage/penjualan' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              📈 Penjualan
            </Link>
            <Link
              href="/manage/pembelian"
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                pathname === '/manage/pembelian' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              🛒 Pembelian
            </Link>
            <Link
              href="/manage/master"
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                pathname === '/manage/master' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              ⚙️ Master
            </Link>
          </div>
        </header>

        {/* ✅ CONTENT */}
        <main className="flex-1 px-4 py-8 bg-gray-50 mx-auto w-full">
          {children}
        </main>

        {/* ✅ FOOTER GLOBAL - TETAP DI SEMUA HALAMAN */}
        <footer className="py-6 text-center text-xs text-gray-300 border-t border-gray-100 bg-gray-50">
          LAPORAN PENJUALAN & STOK
        </footer>
      </body>
    </html>
  );
}