// app/manage/asset/page.tsx

'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

interface AssetItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  total: number;
  perMonth: number;
  status: string;
}

const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(angka);
};

export default function AssetPage() {
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    price: '',
  });

  const totalAset = assets.reduce((s, i) => s + i.total, 0);
  const totalPerMonth = assets.reduce((s, i) => s + i.perMonth, 0);

  // ✅ FETCH DATA
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/asset');
      const result = await res.json();
      
      if (result.status === '✅ Berhasil!') {
        setAssets(result.data);
      } else {
        throw new Error(result.error || 'Gagal mengambil data');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ✅ CRUD: CREATE & UPDATE
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.quantity || !formData.price) {
      Swal.fire({
        icon: 'warning',
        title: 'Data tidak lengkap!',
        text: 'Nama, Quantity, dan Price wajib diisi',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const url = editingId ? '/api/asset' : '/api/asset';
      const method = editingId ? 'PUT' : 'POST';
      
      const payload = editingId 
        ? { id: editingId, ...formData }
        : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      
      if (result.status === '✅ Berhasil!') {
        setShowForm(false);
        setEditingId(null);
        setFormData({ name: '', quantity: '', price: '' });
        await fetchData();
        Swal.fire({
          icon: 'success',
          title: '✅ Berhasil!',
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        throw new Error(result.error || 'Gagal menyimpan');
      }
    } catch (error: any) {
      Swal.fire({ icon: 'error', title: 'Gagal!', text: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ CRUD: DELETE
  const handleDelete = async (id: string, name: string) => {
    const result = await Swal.fire({
      title: `Hapus ${name}?`,
      text: "Data akan dihapus permanen!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/asset?id=${id}`, { method: 'DELETE' });
        const result = await res.json();
        
        if (result.status === '✅ Berhasil!') {
          await fetchData();
          Swal.fire({ icon: 'success', title: '✅ Berhasil!', timer: 1500, showConfirmButton: false });
        } else {
          throw new Error(result.error || 'Gagal menghapus');
        }
      } catch (error: any) {
        Swal.fire({ icon: 'error', title: 'Gagal!', text: error.message });
      }
    }
  };

  const handleEdit = (item: AssetItem) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      quantity: String(item.quantity),
      price: String(item.price),
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ name: '', quantity: '', price: '' });
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-8 max-w-md text-center">
          <p className="text-red-500 text-lg">❌ {error}</p>
          <button onClick={fetchData} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">🏦 Overhead</h1>
            <p className="text-sm text-gray-400">Kelola biaya overhead pabrik</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Overhead
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              {editingId ? '✏️ Edit Overhead' : '📝 Tambah Overhead'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Nama Biaya"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                />
                <input
                  type="number"
                  placeholder="Quantity"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                />
                <input
                  type="number"
                  placeholder="Harga per Unit"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                />
              </div>
              {formData.quantity && formData.price && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-gray-600">
                  <span className="font-medium">Preview:</span>
                  {Number(formData.quantity)} × {formatRupiah(Number(formData.price))} = 
                  <span className="font-bold text-blue-600 ml-1">
                    {formatRupiah(Number(formData.quantity) * Number(formData.price))}
                  </span>
                  <span className="ml-2 text-xs text-gray-400">
                    (Per Bulan: {formatRupiah(Math.round((Number(formData.quantity) * Number(formData.price)) / 12))})
                  </span>
                </div>
              )}
              <div className="flex gap-3 mt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? '⏳ Menyimpan...' : 'Simpan'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 text-sm"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Nama Biaya</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Harga/Unit</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Per Bulan</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((item) => (
                  <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                    <td className="px-4 py-3 text-gray-600">{item.quantity}</td>
                    <td className="px-4 py-3 text-gray-600">{formatRupiah(item.price)}</td>
                    <td className="px-4 py-3 font-medium text-gray-700">{formatRupiah(item.total)}</td>
                    <td className="px-4 py-3 font-medium text-blue-600">{formatRupiah(item.perMonth)}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        ✏️
                      </button>
                      {/* <button
                        onClick={() => handleDelete(item.id, item.name)}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors ml-1"
                      >
                        🗑️
                      </button> */}
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