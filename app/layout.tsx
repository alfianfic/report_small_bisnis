// app/layout.tsx

'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Menu items
  const menuItems = [
    { href: '/', label: '📊 Dashboard', id: 'dashboard' },
    { href: '/manage/persediaan', label: '📦 Stok', id: 'persediaan' },
    { href: '/manage/pembelian', label: '🛒 Pembelian', id: 'pembelian' },
    { href: '/manage/product', label: '📦 Product', id: 'master-product' },
    { href: '/manage/penjualan', label: '💰 Penjualan', id: 'penjualan' },
    { href: '/manage/asset', label: '🏦 Asset', id: 'asset' },
    { href: '/manage/laporan', label: '📄 Laporan', id: 'laporan' },
    { href: '/manage/penggajian', label: '👨‍💼 Penggajian', id: 'penggajian' },
  ];

  return (
    <html lang="id">
      <body className="antialiased min-h-screen bg-gray-50 flex flex-col">
        {/* NAVBAR MODERN */}
        <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              
              {/* Logo / Brand */}
              <div className="flex-shrink-0">
                <Link href="/" className="text-xl font-bold text-gray-800 hover:text-blue-600 transition-colors">
                  📊 SIM
                </Link>
                {/* <span className="hidden sm:inline text-xs text-gray-400 ml-1">| Manajemen</span> */}
              </div>

              {/* Desktop Menu - Center */}
              <div className="hidden lg:flex items-center justify-center flex-1 px-4">
                <div className="flex items-center gap-1 bg-gray-50 rounded-xl px-2 py-1">
                  {menuItems.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap ${
                        pathname === item.href
                          ? 'bg-blue-500 text-white shadow-md shadow-blue-200'
                          : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Desktop Right - KOSONG (dihapus) */}
              <div className="hidden lg:flex items-center gap-3 w-[72px]">
                {/* Kosong untuk menjaga keseimbangan layout */}
              </div>

              {/* Mobile Menu Button */}
              <div className="lg:hidden flex items-center">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isMobileMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Menu - Dropdown */}
          {isMobileMenuOpen && (
            <div className="lg:hidden bg-white border-t border-gray-100 shadow-lg">
              <div className="px-4 py-3 space-y-1 max-h-[70vh] overflow-y-auto">
                {menuItems.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                      pathname === item.href
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* CONTENT */}
        <main className="flex-1 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>

        {/* FOOTER */}
        <footer className="bg-white border-t border-gray-200 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-xs text-gray-400">
              © 2026 | Dibangun dengan persiapan matang untuk menghadapi kata-kata apapun. Kalian jalankan apa yang kalian mau, tapi jangan lupa untuk tetap menjaga etika dan sopan santun.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}