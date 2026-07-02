// app/manage/asset/page.tsx

'use client';

import { useState } from 'react';

interface AssetItem {
  id: string;
  name: string;
  category: string;
  purchaseDate: string;
  quantity: number;
  price: number;
  total: number;
  status: 'Baik' | 'Rusak' | 'Perbaikan';
}

const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(angka);
};

export default function AssetPage() {
  const [assets] = useState<AssetItem[]>([
    {
      id: '1',
      name: 'Kompor Gas 2 Tungku',
      category: 'Peralatan Masak',
      purchaseDate: '2026-01-15',
      quantity: 3,
      price: 1500000,
      total: 4500000,
      status: 'Baik',
    },
    {
      id: '2',
      name: 'Kulkas 2 Pintu',
      category: 'Elektronik',
      purchaseDate: '2026-02-01',
      quantity: 1,
      price: 4500000,
      total: 4500000,
      status: 'Baik',
    },
    {
      id: '3',
      name: 'Meja Kayu',
      category: 'Furniture',
      purchaseDate: '2026-03-10',
      quantity: 5,
      price: 750000,
      total: 3750000,
      status: 'Perbaikan',
    },
    {
      id: '4',
      name: 'Blender',
      category: 'Peralatan Masak',
      purchaseDate: '2026-04-20',
      quantity: 2,
      price: 850000,
      total: 1700000,
      status: 'Baik',
    },
  ]);

  const [loading, setLoading] = useState(false);
  const totalAset = assets.reduce((s, i) => s + i.total, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Baik': return 'bg-green-100 text-green-700';
      case 'Rusak': return 'bg-red-100 text-red-700';
      case 'Perbaikan': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data asset...</p>
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
            <h1 className="text-2xl font-bold text-gray-800">🏦 Asset</h1>
            <p className="text-sm text-gray-400">Kelola aset dan inventaris</p>
          </div>
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Asset
          </button>
        </div>

        {/* Total Asset */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 mb-6 text-white">
          <p className="text-sm opacity-80">Total Nilai Asset</p>
          <p className="text-3xl font-bold">{formatRupiah(totalAset)}</p>
          <p className="text-xs opacity-70 mt-1">{assets.length} item terdaftar</p>
        </div>

        {/* Tabel */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Nama</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Kategori</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Tgl Beli</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Harga</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((item) => (
                  <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                    <td className="px-4 py-3 text-gray-500">{item.category}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(item.purchaseDate).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{item.quantity}</td>
                    <td className="px-4 py-3 text-gray-600">{formatRupiah(item.price)}</td>
                    <td className="px-4 py-3 font-medium text-gray-700">{formatRupiah(item.total)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button className="p-1 text-blue-500 hover:text-blue-700">✏️</button>
                      <button className="p-1 text-red-500 hover:text-red-700 ml-1">🗑️</button>
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