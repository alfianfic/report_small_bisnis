// app/manage/laporan/page.tsx

'use client';

import { useState } from 'react';

interface LaporanItem {
  id: string;
  name: string;
  type: 'Penjualan' | 'Pembelian' | 'Stok' | 'Keuangan';
  date: string;
  status: 'Tersedia' | 'Diproses' | 'Selesai';
}

export default function LaporanPage() {
  const [laporan] = useState<LaporanItem[]>([
    {
      id: '1',
      name: 'Laporan Penjualan Bulanan',
      type: 'Penjualan',
      date: '2026-06-30',
      status: 'Tersedia',
    },
    {
      id: '2',
      name: 'Laporan Pembelian Bulanan',
      type: 'Pembelian',
      date: '2026-06-30',
      status: 'Tersedia',
    },
    {
      id: '3',
      name: 'Laporan Stok Akhir Bulan',
      type: 'Stok',
      date: '2026-06-30',
      status: 'Tersedia',
    },
    {
      id: '4',
      name: 'Laporan Keuangan',
      type: 'Keuangan',
      date: '2026-06-30',
      status: 'Diproses',
    },
  ]);

  const [loading, setLoading] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Tersedia': return 'bg-green-100 text-green-700';
      case 'Diproses': return 'bg-yellow-100 text-yellow-700';
      case 'Selesai': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Penjualan': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'Pembelian': return 'bg-green-50 text-green-600 border-green-200';
      case 'Stok': return 'bg-orange-50 text-orange-600 border-orange-200';
      case 'Keuangan': return 'bg-purple-50 text-purple-600 border-purple-200';
      default: return 'bg-gray-50 text-gray-500 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data laporan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">📄 Daftar Laporan</h1>
            <p className="text-sm text-gray-400">Lihat dan unduh berbagai laporan</p>
          </div>
          <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Generate Laporan
          </button>
        </div>

        {/* Filter */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600">
            Semua
          </button>
          <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200">
            Penjualan
          </button>
          <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200">
            Pembelian
          </button>
          <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200">
            Stok
          </button>
          <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200">
            Keuangan
          </button>
        </div>

        {/* Grid Laporan */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {laporan.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`px-2 py-0.5 text-xs rounded-full border ${getTypeColor(item.type)}`}>
                  {item.type}
                </span>
                <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(item.status)}`}>
                  {item.status}
                </span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">{item.name}</h3>
              <p className="text-xs text-gray-400">
                {new Date(item.date).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
              <div className="flex gap-2 mt-4">
                <button className="flex-1 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs hover:bg-blue-600 transition-colors">
                  📥 Download
                </button>
                <button className="px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs hover:bg-gray-50 transition-colors">
                  👁️ Preview
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}