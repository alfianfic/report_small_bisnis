// app/manage/persediaan/page.tsx

'use client';

import { useState } from 'react';

interface StokItem {
  id: string;
  productName: string;
  sku: string;
  stokAwal: number;
  masuk: number;
  keluar: number;
  stokAkhir: number;
  status: 'Aman' | 'Waspada' | 'Kritis';
}

const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(angka);
};

export default function PersediaanPage() {
  const [stokData] = useState<StokItem[]>([
    {
      id: '1',
      productName: 'Makanan 1',
      sku: 'MKN-001',
      stokAwal: 500,
      masuk: 300,
      keluar: 400,
      stokAkhir: 400,
      status: 'Aman',
    },
    {
      id: '2',
      productName: 'Makanan 2',
      sku: 'MKN-002',
      stokAwal: 400,
      masuk: 0,
      keluar: 150,
      stokAkhir: 250,
      status: 'Waspada',
    },
    {
      id: '3',
      productName: 'Makanan 3',
      sku: 'MKN-003',
      stokAwal: 300,
      masuk: 0,
      keluar: 80,
      stokAkhir: 220,
      status: 'Aman',
    },
  ]);

  const [loading, setLoading] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Aman': return 'bg-green-100 text-green-700';
      case 'Waspada': return 'bg-yellow-100 text-yellow-700';
      case 'Kritis': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  const totalStokAwal = stokData.reduce((s, i) => s + i.stokAwal, 0);
  const totalMasuk = stokData.reduce((s, i) => s + i.masuk, 0);
  const totalKeluar = stokData.reduce((s, i) => s + i.keluar, 0);
  const totalStokAkhir = stokData.reduce((s, i) => s + i.stokAkhir, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data persediaan...</p>
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
            <h1 className="text-2xl font-bold text-gray-800">📦 Persediaan</h1>
            <p className="text-sm text-gray-400">Monitoring stok bahan baku</p>
          </div>
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Update Stok
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-xs text-gray-400">Stok Awal</p>
            <p className="text-xl font-bold text-gray-800">{totalStokAwal}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-green-100 p-4">
            <p className="text-xs text-green-400">Stok Masuk</p>
            <p className="text-xl font-bold text-green-600">+{totalMasuk}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-red-100 p-4">
            <p className="text-xs text-red-400">Stok Keluar</p>
            <p className="text-xl font-bold text-red-600">-{totalKeluar}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-4">
            <p className="text-xs text-blue-400">Stok Akhir</p>
            <p className="text-xl font-bold text-blue-600">{totalStokAkhir}</p>
          </div>
        </div>

        {/* Tabel */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Produk</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">SKU</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Stok Awal</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Masuk</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Keluar</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Stok Akhir</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {stokData.map((item) => (
                  <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-800">{item.productName}</td>
                    <td className="px-4 py-3 text-gray-500">{item.sku}</td>
                    <td className="px-4 py-3 text-gray-600">{item.stokAwal}</td>
                    <td className="px-4 py-3 text-green-600">+{item.masuk}</td>
                    <td className="px-4 py-3 text-red-600">-{item.keluar}</td>
                    <td className="px-4 py-3 font-medium text-gray-700">{item.stokAkhir}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}