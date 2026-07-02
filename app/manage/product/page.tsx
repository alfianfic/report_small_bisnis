// app/master/product/page.tsx

'use client';

import { useState } from 'react';

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  hpp: number;
  hargaJual: number;
  stok: number;
  status: 'Aktif' | 'Nonaktif';
}

const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(angka);
};

export default function MasterProductPage() {
  const [products, setProducts] = useState<Product[]>([
    {
      id: '1',
      name: 'Makanan 1',
      sku: 'MKN-001',
      category: 'Makanan Utama',
      hpp: 13000,
      hargaJual: 15000,
      stok: 500,
      status: 'Aktif',
    },
    {
      id: '2',
      name: 'Makanan 2',
      sku: 'MKN-002',
      category: 'Makanan Utama',
      hpp: 14000,
      hargaJual: 17000,
      stok: 400,
      status: 'Aktif',
    },
    {
      id: '3',
      name: 'Makanan 3',
      sku: 'MKN-003',
      category: 'Makanan Utama',
      hpp: 12000,
      hargaJual: 14000,
      stok: 300,
      status: 'Aktif',
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data produk...</p>
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
            <h1 className="text-2xl font-bold text-gray-800">📦 Master Product</h1>
            <p className="text-sm text-gray-400">Kelola data produk</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Produk
          </button>
        </div>

        {/* Form Tambah */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Tambah Produk Baru</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Nama Produk"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="SKU"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Kategori"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="HPP"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="Harga Jual"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="Stok Awal"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-3 mt-4">
              <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm">
                Simpan
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 text-sm"
              >
                Batal
              </button>
            </div>
          </div>
        )}

        {/* Tabel Product */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Nama</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">SKU</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Kategori</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">HPP</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Harga Jual</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Stok</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                    <td className="px-4 py-3 text-gray-500">{p.sku}</td>
                    <td className="px-4 py-3 text-gray-500">{p.category}</td>
                    <td className="px-4 py-3 text-gray-600">{formatRupiah(p.hpp)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatRupiah(p.hargaJual)}</td>
                    <td className="px-4 py-3 font-medium text-gray-700">{p.stok}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button className="p-1 text-blue-500 hover:text-blue-700">
                        ✏️
                      </button>
                      <button className="p-1 text-red-500 hover:text-red-700 ml-1">
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-400">
            Total {products.length} produk
          </div>
        </div>
      </div>
    </div>
  );
}