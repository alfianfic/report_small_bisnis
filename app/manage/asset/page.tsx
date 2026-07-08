// app/manage/overhead/page.tsx

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Swal from 'sweetalert2';

interface Asset {
  id: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  total: number;
  perMonth: number;
  status: string;
  createdAt: string;
}

const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(angka);
};

export default function OverheadPage() {
  const [data, setData] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalOverhead, setTotalOverhead] = useState(0);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: '',
    price: '',
    perMonth: '',
    status: 'Baik',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/asset');
      const result = await res.json();
      
      if (result.status === '✅ Berhasil!') {
        setData(result.data);
        setTotalOverhead(result.metadata?.totalOverheadPerBulan || 0);
      } else {
        throw new Error(result.error);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category || !formData.quantity || !formData.price || !formData.perMonth) {
      Swal.fire({
        icon: 'warning',
        title: 'Data tidak lengkap!',
        text: 'Semua field wajib diisi',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/asset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          quantity: Number(formData.quantity),
          price: Number(formData.price),
          perMonth: Number(formData.perMonth),
        }),
      });

      const result = await res.json();

      if (result.status === '✅ Berhasil!') {
        setShowForm(false);
        setFormData({ name: '', category: '', quantity: '', price: '', perMonth: '', status: 'Baik' });
        await fetchData();
        Swal.fire({
          icon: 'success',
          title: '✅ Berhasil!',
          text: 'Asset berhasil ditambahkan',
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal!',
        text: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
        if (res.ok) {
          await fetchData();
          Swal.fire({ icon: 'success', title: '✅ Berhasil!', timer: 1500, showConfirmButton: false });
        } else {
          throw new Error('Gagal menghapus');
        }
      } catch (error) {
        Swal.fire({ icon: 'error', title: 'Gagal!' });
      }
    }
  };

  const handleStatusChange = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Baik' ? 'Rusak' : 'Baik';
    
    try {
      const res = await fetch('/api/asset', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (res.ok) {
        await fetchData();
        Swal.fire({
          icon: 'success',
          title: '✅ Status diupdate!',
          timer: 1500,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Gagal update status!' });
    }
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
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🏢 Management Asset / Overhead</h1>
            <p className="text-sm text-gray-500">
              Total Overhead per Bulan: <span className="font-bold text-purple-600">{formatRupiah(totalOverhead)}</span>
            </p>
          </div>
          <div className="flex gap-2">
            {/* ✅ Tombol ke Override */}
            <Link
              href="/manage/overhead/override"
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Override Overhead
            </Link>
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 flex items-center gap-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tambah Asset
            </button>
          </div>
        </div>

        {/* Form Tambah */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">📝 Tambah Asset / Overhead</h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Asset</label>
                  <input
                    type="text"
                    placeholder="Contoh: Komputer, AC, dll"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  >
                    <option value="">Pilih Kategori</option>
                    <option value="Elektronik">Elektronik</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Kendaraan">Kendaraan</option>
                    <option value="Bangunan">Bangunan</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Baik">Baik</option>
                    <option value="Rusak">Rusak</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    placeholder="Jumlah"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Harga (Rp)</label>
                  <input
                    type="number"
                    placeholder="Harga per unit"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Biaya per Bulan (Rp)
                    <span className="text-xs text-gray-400 ml-1">(overhead)</span>
                  </label>
                  <input
                    type="number"
                    placeholder="Biaya per bulan"
                    value={formData.perMonth}
                    onChange={(e) => setFormData({ ...formData, perMonth: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                    min="1"
                  />
                </div>
              </div>

              {/* Preview Total */}
              {formData.quantity && formData.price && (
                <div className="mt-4 p-3 bg-purple-50 rounded-lg text-sm text-gray-600">
                  <span className="font-medium">Total Asset:</span>
                  <span className="ml-2">
                    {Number(formData.quantity)} × {formatRupiah(Number(formData.price))} = 
                    <span className="font-bold text-purple-600 ml-1">
                      {formatRupiah(Number(formData.quantity) * Number(formData.price))}
                    </span>
                  </span>
                  <span className="ml-4 text-gray-400">
                    Overhead/bulan: {formatRupiah(Number(formData.perMonth) || 0)}
                  </span>
                </div>
              )}

              <div className="flex gap-3 mt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-sm transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? '⏳ Menyimpan...' : '💾 Simpan'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 text-sm"
                >
                  ❌ Batal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-4 text-white">
            <p className="text-sm opacity-80">Total Asset</p>
            <p className="text-2xl font-bold">{data.length}</p>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-4 text-white">
            <p className="text-sm opacity-80">Aktif</p>
            <p className="text-2xl font-bold">{data.filter(d => d.status !== 'Rusak').length}</p>
          </div>
          <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-4 text-white">
            <p className="text-sm opacity-80">Rusak</p>
            <p className="text-2xl font-bold">{data.filter(d => d.status === 'Rusak').length}</p>
          </div>
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-4 text-white">
            <p className="text-sm opacity-80">Overhead / Bulan</p>
            <p className="text-2xl font-bold">{formatRupiah(totalOverhead)}</p>
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
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Qty</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Harga</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Total</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Per Bulan</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                      📭 Belum ada asset
                    </td>
                  </tr>
                ) : (
                  data.map((item) => (
                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                      <td className="px-4 py-3 text-gray-600">{item.category}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{item.quantity}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{formatRupiah(item.price)}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{formatRupiah(item.total)}</td>
                      <td className="px-4 py-3 text-right font-medium text-purple-600">
                        {formatRupiah(item.perMonth)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleStatusChange(item.id, item.status)}
                          className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                            item.status === 'Baik'
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : item.status === 'Rusak'
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          }`}
                        >
                          {item.status}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleDelete(item.id, item.name)}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-400">
            Total {data.length} asset | Overhead/bulan: {formatRupiah(totalOverhead)}
          </div>
        </div>
      </div>
    </div>
  );
}