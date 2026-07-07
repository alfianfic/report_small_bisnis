// app/layout.tsx

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './globals.css';

const menuItems = [
  {
    id: 'dashboard',
    href: '/',
    label: 'Dashboard',
    icon: '📊',
  },
  {
    id: 'product',
    href: '/manage/product',
    label: 'Produk',
    icon: '📦',
  },
  {
    id: 'persediaan',
    href: '/manage/persediaan',
    label: 'Persediaan',
    icon: '📚',
  },
  {
    id: 'pembelian',
    href: '/manage/pembelian',
    label: 'Pembelian',
    icon: '🛒',
  },
  {
    id: 'penjualan',
    href: '/manage/penjualan',
    label: 'Penjualan',
    icon: '💰',
  },
  {
    id: 'asset',
    href: '/manage/asset',
    label: 'Aset',
    icon: '🏦',
  },
  {
    id: 'penggajian',
    href: '/manage/penggajian',
    label: 'Penggajian',
    icon: '👨‍💼',
  },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <html lang="id">
      <body className="bg-gradient-to-br from-amber-50 via-orange-50/50 to-rose-50/50 antialiased">

        <div className="flex h-screen overflow-hidden">

          {/* =======================
              Desktop Sidebar
          ======================== */}

          <aside className="hidden lg:flex w-72 bg-white/90 backdrop-blur-sm border-r border-amber-200/50 shadow-lg flex-col">

            {/* Logo */}

            <div className="h-20 flex items-center px-8 border-b border-amber-200/50">

              <div>

                <h1 className="text-2xl font-bold text-amber-800">
                  🍽️ Gudeg Bu Ucik
                </h1>

                <p className="text-xs text-amber-600/70 mt-1">
                  The New System just for Gudeg Bu Ucik
                </p>

              </div>

            </div>

            {/* Menu */}

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">

              {menuItems.map((item) => (

                <Link
                  key={item.id}
                  href={item.href}
                  className={`
                    flex
                    items-center
                    gap-4
                    px-4
                    py-3
                    rounded-2xl
                    transition-all
                    duration-200

                    ${pathname === item.href
                      ? 'bg-amber-500 text-white shadow-lg shadow-amber-200'
                      : 'text-amber-700 hover:bg-amber-100/70 hover:text-amber-800'
                    }
                  `}
                >

                  <span className="text-xl">
                    {item.icon}
                  </span>

                  <span className="font-medium">
                    {item.label}
                  </span>

                </Link>

              ))}

            </nav>

            {/* Footer Sidebar */}

            <div className="border-t border-amber-200/50 p-4">

              <div className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white p-4 shadow-lg shadow-amber-200">

                <p className="text-sm font-semibold">
                  Gudeg Bu Ucik
                </p>

                <p className="text-xs text-amber-100 mt-1">
                  Inventori, Pembelian, Penjualan
                </p>

              </div>

            </div>

          </aside>

          {/* =======================
              Main Area
          ======================== */}

          <div className="flex flex-col flex-1 overflow-hidden">

            {/* =======================
                Header
            ======================== */}

            <header className="bg-white/80 backdrop-blur-sm border-b border-amber-200/50 shadow-sm px-6 py-3 flex items-center justify-between">

              <div className="flex items-center gap-4">

                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 rounded-xl hover:bg-amber-100 transition"
                >
                  <svg className="w-6 h-6 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>

                <div>

                  <p className="text-sm text-amber-600/70">
                    Beranda /
                    <span className="font-medium text-amber-800 ml-1">
                      {menuItems.find((m) => m.href === pathname)?.label ??
                        "Dashboard"}
                    </span>
                  </p>

                  <h1 className="text-2xl font-bold text-amber-800">
                    {menuItems.find((m) => m.href === pathname)?.label ??
                      "Dashboard"}
                  </h1>

                </div>

              </div>

              <div className="hidden lg:flex items-center gap-3">

                <div className="rounded-xl bg-white/80 backdrop-blur-sm px-5 py-3 shadow-sm border border-amber-200/50">

                  <p className="text-xs text-amber-600/70">
                    
                  </p>

                  <p className="text-amber-800 font-medium">
                    {new Date().toLocaleDateString("id-ID", {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>

                </div>

              </div>

            </header>

            {/* =======================
                Mobile Sidebar
            ======================== */}

            {sidebarOpen && (
              <>
                {/* Overlay */}
                <div
                  className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
                  onClick={() => setSidebarOpen(false)}
                />

                {/* Drawer */}
                <aside className="fixed left-0 top-0 z-50 h-full w-72 bg-white/95 backdrop-blur-sm shadow-2xl lg:hidden">

                  {/* Header */}

                  <div className="h-20 border-b border-amber-200/50 flex items-center justify-between px-6">

                    <div>

                      <h1 className="text-xl font-bold text-amber-800">
                        🍽️ Gudeg Bu Ucik
                      </h1>

                      <p className="text-xs text-amber-600/70">
                        Inventori Management
                      </p>

                    </div>

                    <button
                      onClick={() => setSidebarOpen(false)}
                      className="rounded-lg p-2 hover:bg-amber-100 transition text-amber-700"
                    >
                      ✕
                    </button>

                  </div>

                  {/* Menu */}

                  <nav className="p-4 space-y-2">

                    {menuItems.map((item) => (

                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`
                          flex
                          items-center
                          gap-4
                          rounded-xl
                          px-4
                          py-3
                          transition

                          ${pathname === item.href
                            ? "bg-amber-500 text-white shadow-lg shadow-amber-200"
                            : "hover:bg-amber-100/70 text-amber-700 hover:text-amber-800"
                          }
                        `}
                      >

                        <span className="text-xl">
                          {item.icon}
                        </span>

                        <span>
                          {item.label}
                        </span>

                      </Link>

                    ))}

                  </nav>

                </aside>
              </>
            )}

            {/* =======================
                Content
            ======================== */}

            <main className="flex-1 overflow-auto bg-gradient-to-br from-amber-50/50 via-orange-50/30 to-rose-50/30">

              <div className="p-6 lg:p-8">

                {/* Content Card */}

                <div
                  className="
                    rounded-3xl
                    bg-white/90
                    backdrop-blur-sm
                    border
                    border-amber-200/50
                    shadow-xl
                    shadow-amber-200/20
                    min-h-[600px]
                    p-6
                    transition-all
                    hover:shadow-2xl
                    hover:shadow-amber-200/30
                  "
                >

                  {children}

                </div>

                {/* ======================= Footer ======================= */}

                <footer className="mt-8">

                  <div className="
                                    rounded-3xl
                                    border
                                    border-amber-200/50
                                    bg-white/80
                                    backdrop-blur-sm
                                    px-6
                                    py-4
                                    shadow-lg
                                    shadow-amber-200/10
                                  ">

                    <div className="flex flex-col items-center justify-between gap-3 lg:flex-row">

                      <p className="text-sm text-amber-700 font-medium">
                        🍽️ Gudeg Bu Ucik
                        <span className="text-amber-400 mx-2">•</span>
                        <span className="font-normal text-amber-600/70 text-xs">
                          Sistem Inventori, Pembelian, Penjualan
                        </span>
                      </p>

                      <p className="text-xs text-amber-400">
                        © 2026 • Dibangun dengan Next.js & Tailwind CSS
                      </p>

                    </div>

                  </div>

                </footer>

              </div>

            </main>

          </div>

        </div>

      </body>
    </html>
  );
}