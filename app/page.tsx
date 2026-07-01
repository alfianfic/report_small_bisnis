// app/manage/master/page.tsx

'use client';

import { useState, useEffect } from 'react';

interface MasterData {
  id: string;
  productId: string;
  hppPerPorsi: number;
  hargaJualPerPorsi: number;
  labaPerPorsi: number;
  targetHarian: number;
  stokAwal: number;
  thresholdBelanja: number;
  tanggalBerlaku: string;
  createdAt: string;
  updatedAt: string;
  product?: {
    name: string;
    sku: string;
  };
}

export default function ManageMaster() {
  const [masters, setMasters] = useState<MasterData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [productId, setProductId] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [hppPerPorsi, setHppPerPorsi] = useState('');
  const [hargaJualPerPorsi, setHargaJualPerPorsi] = useState('');
  const [targetHarian, setTargetHarian] = useState('');
  const [thresholdBelanja, setThresholdBelanja] = useState('');
  const [stokAwal, setStokAwal] = useState('');
  const [tanggalBerlaku, setTanggalBerlaku] = useState('');

  // Fetch products
  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const result = await res.json();
      if (result.status === '✅ Berhasil!') {
        setProducts(result.data);
        if (result.data.length > 0) {
          setProductId(result.data[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  // Fetch masters
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/master');
      const result = await res.json();
      
      if (result.status === '✅ Berhasil!') {
        setMasters(result.data);
      } else {
        throw new Error(result.error || 'Gagal mengambil data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchData();
  }, []);

  // Handle submit (Create atau Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setFormLoading(true);
      
      const data = {
        productId,
        hppPerPorsi: Number(hppPerPorsi),
        hargaJualPerPorsi: Number(hargaJualPerPorsi),
        targetHarian: targetHarian ? Number(targetHarian) : undefined,
        thresholdBelanja: thresholdBelanja ? Number(thresholdBelanja) : undefined,
        stokAwal: stokAwal ? Number(stokAwal) : undefined,
        tanggalBerlaku: tanggalBerlaku || undefined,
      };

      const url = editingId ? '/api/master' : '/api/master';
      const method = editingId ? 'PUT' : 'POST';
      
      const payload = editingId ? { ...data, id: editingId } : data;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      
      if (result.status === '✅ Berhasil!') {
        setIsFormOpen(false);
        await fetchData();
        resetForm();
        alert(editingId ? 'Master berhasil di-update!' : 'Master baru berhasil dibuat!');
      } else {
        alert(result.error || 'Gagal menyimpan data');
      }
    } catch (error) {
      alert('Terjadi kesalahan');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (master: MasterData) => {
    setEditingId(master.id);
    setProductId(master.productId);
    setHppPerPorsi(String(master.hppPerPorsi));
    setHargaJualPerPorsi(String(master.hargaJualPerPorsi));
    setTargetHarian(String(master.targetHarian));
    setThresholdBelanja(String(master.thresholdBelanja));
    setStokAwal(String(master.stokAwal));
    setTanggalBerlaku(master.tanggalBerlaku.split('T')[0]);
    setIsFormOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setHppPerPorsi('');
    setHargaJualPerPorsi('');
    setTargetHarian('');
    setThresholdBelanja('');
    setStokAwal('');
    setTanggalBerlaku(new Date().toISOString().split('T')[0]);
  };

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(angka);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data master...</p>
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
            <h1 className="text-2xl font-bold text-gray-800">⚙️ Manajemen Data Master</h1>
            <p className="text-sm text-gray-400">Kelola harga, target, dan threshold per produk</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setIsFormOpen(true);
            }}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Buat Master Baru
          </button>
        </div>

        {/* Tabel Historis Master */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-white">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
              📜 Riwayat Perubahan Master
            </h3>
            <p className="text-xs text-gray-400">Total {masters.length} versi</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/95">
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Produk</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Berlaku</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">HPP</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Harga Jual</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Laba</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Target</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Stok Awal</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {masters.map((master) => (
                  <tr 
                    key={master.id} 
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-700">
                      {master.product?.name || '-'}
                      <span className="text-xs text-gray-400 ml-1">({master.product?.sku || '-'})</span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{formatDate(master.tanggalBerlaku)}</td>
                    <td className="px-4 py-3 text-gray-900">{formatRupiah(master.hppPerPorsi)}</td>
                    <td className="px-4 py-3 text-gray-900">{formatRupiah(master.hargaJualPerPorsi)}</td>
                    <td className="px-4 py-3 text-green-600">{formatRupiah(master.labaPerPorsi)}</td>
                    <td className="px-4 py-3 text-gray-900">{master.targetHarian}</td>
                    <td className="px-4 py-3 text-gray-900">{master.stokAwal}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleEdit(master)}
                        className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Form Modal Create/Edit Master */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                {editingId ? '✏️ Edit Master' : '📝 Buat Master Baru'}
              </h2>
              <button
                onClick={() => {
                  setIsFormOpen(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Produk <span className="text-red-500">*</span>
                </label>
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-gray-900"
                  required
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Berlaku
                </label>
                <input
                  type="date"
                  value={tanggalBerlaku}
                  onChange={(e) => setTanggalBerlaku(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  HPP per Porsi <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">Rp</span>
                  <input
                    type="number"
                    value={hppPerPorsi}
                    onChange={(e) => setHppPerPorsi(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-gray-900"
                    placeholder="13000"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Harga Jual per Porsi <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">Rp</span>
                  <input
                    type="number"
                    value={hargaJualPerPorsi}
                    onChange={(e) => setHargaJualPerPorsi(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-gray-900"
                    placeholder="15000"
                    required
                  />
                </div>
                {hppPerPorsi && hargaJualPerPorsi && (
                  <p className="mt-1 text-xs text-green-600">
                    Laba otomatis: Rp{(Number(hargaJualPerPorsi) - Number(hppPerPorsi)).toLocaleString('id-ID')}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Harian (porsi)
                </label>
                <input
                  type="number"
                  value={targetHarian}
                  onChange={(e) => setTargetHarian(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-gray-900"
                  placeholder="200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Threshold Belanja (porsi)
                </label>
                <input
                  type="number"
                  value={thresholdBelanja}
                  onChange={(e) => setThresholdBelanja(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-gray-900"
                  placeholder="200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stok Awal (porsi)
                </label>
                <input
                  type="number"
                  value={stokAwal}
                  onChange={(e) => setStokAwal(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-gray-900"
                  placeholder="500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  ⚠️ Kosongkan untuk copy dari master terakhir
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 px-4 py-2.5 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors font-medium disabled:opacity-50"
                >
                  {formLoading ? 'Menyimpan...' : editingId ? 'Update Master' : 'Buat Master'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}