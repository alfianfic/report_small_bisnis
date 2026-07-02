// app/manage/asset/page.tsx

'use client';

import { useState } from 'react';

interface AssetItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  total: number;
  perMonth: number;
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
      name: 'Biaya Air, Listrik',
      category: 'Overhead',
      quantity: 1,
      price: 555000,
      total: 6660000,
      perMonth: 555000,
      status: 'Baik',
    },
    {
      id: '2',
      name: 'Biaya Bahan Bakar',
      category: 'Overhead',
      quantity: 1,
      price: 5200000,
      total: 62400000,
      perMonth: 5200000,
      status: 'Baik',
    },
    {
      id: '3',
      name: 'Biaya Penyusutan Aset',
      category: 'Overhead',
      quantity: 39,
      price: 28164775,
      total: 28164775,
      perMonth: 2347065,
      status: 'Baik',
    },
    {
      id: '4',
      name: 'Biaya Sewa',
      category: 'Overhead',
      quantity: 1,
      price: 333333,
      total: 3999996,
      perMonth: 333333,
      status: 'Baik',
    },
    {
      id: '5',
      name: 'Biaya Retribusi Pasar',
      category: 'Overhead',
      quantity: 3,
      price: 480000,
      total: 5760000,
      perMonth: 480000,
      status: 'Baik',
    },
    {
      id: '6',
      name: 'Biaya Bahan Penolong',
      category: 'Overhead',
      quantity: 6,
      price: 2788500,
      total: 33462000,
      perMonth: 2788500,
      status: 'Baik',
    },
  ]);

  const totalAset = assets.reduce((s, i) => s + i.total, 0);
  const totalPerMonth = assets.reduce((s, i) => s + i.perMonth, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Baik': return 'bg-green-100 text-green-700';
      case 'Rusak': return 'bg-red-100 text-red-700';
      case 'Perbaikan': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">🏦 Asset & Overhead</h1>
            <p className="text-sm text-gray-400">Kelola aset dan biaya overhead pabrik</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-4 text-white">
            <p className="text-sm opacity-80">Total Asset</p>
            <p className="text-2xl font-bold">{formatRupiah(totalAset)}</p>
            <p className="text-xs opacity-70 mt-1">{assets.length} item</p>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-4 text-white">
            <p className="text-sm opacity-80">Overhead per Bulan</p>
            <p className="text-2xl font-bold">{formatRupiah(totalPerMonth)}</p>
            <p className="text-xs opacity-70 mt-1">Biaya tetap bulanan</p>
          </div>
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-4 text-white">
            <p className="text-sm opacity-80">Overhead per Tahun</p>
            <p className="text-2xl font-bold">{formatRupiah(totalPerMonth * 12)}</p>
            <p className="text-xs opacity-70 mt-1">Total biaya overhead tahunan</p>
          </div>
        </div>

        {/* Tabel */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Nama</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Kategori</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Harga/Bulan</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Per Bulan</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((item) => (
                  <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{item.quantity}</td>
                    <td className="px-4 py-3 text-gray-600">{formatRupiah(item.price)}</td>
                    <td className="px-4 py-3 font-medium text-gray-700">{formatRupiah(item.total)}</td>
                    <td className="px-4 py-3 font-medium text-blue-600">{formatRupiah(item.perMonth)}</td>
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
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-400">
            Total {assets.length} item overhead
          </div>
        </div>
      </div>
    </div>
  );
}