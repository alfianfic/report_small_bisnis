// app/manage/bahan-baku/page.tsx

'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

interface BahanBaku {
  id: string;
  nama: string;
  satuan: string;
  harga: number;
  stok: number;
  stokMinimal: number;
}

const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(angka);
};

export default function BahanBakuPage() {
  const [data, setData] = useState<BahanBaku[]>([]);
  const [filteredData, setFilteredData] = useState<BahanBaku[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [formData, setFormData] = useState({
    nama: '',
    satuan: 'Kg',
    harga: '',
    stokMinimal: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/bahan-baku');
      const result = await res.json();

      if (result.status === '✅ Berhasil!') {
        setData(result.data);
        setFilteredData(result.data);
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

  useEffect(() => {
    if (filter) {
      const filtered = data.filter((item) =>
        item.nama.toLowerCase().includes(filter.toLowerCase())
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(data);
    }
  }, [filter, data]);

  // ============================================
  // Update Stok & Stok Minimal
  // ============================================
  const handleUpdateStok = async () => {
    const result = await Swal.fire({
      title: '🔄 Update Stok & Stok Minimal?',
      html: `
        <p>Anda akan <strong>menghitung ulang</strong> semua stok dari transaksi.</p>
        <ul class="text-left text-xs text-gray-500 mt-2 space-y-1">
          <li>• Stok bahan baku dari pembelian - penjualan</li>
          <li>• Stok produk dari bahan baku</li>
          <li>• HPP produk dari harga bahan baku terbaru</li>
          <li>• Stok minimal bahan baku dari target produk</li>
        </ul>
        <p class="text-xs text-yellow-600 mt-2">⚠️ Proses ini mungkin memakan waktu beberapa detik.</p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3B82F6',
      confirmButtonText: 'Ya, Update!',
      cancelButtonText: 'Batal',
    });

    if (result.isConfirmed) {
      setIsUpdating(true);

      try {
        const res = await fetch('/api/bahan-baku?action=update-stok', {
          method: 'PATCH',
        });

        const result = await res.json();

        if (result.status === '✅ Berhasil!') {
          await fetchData();
          Swal.fire({
            icon: 'success',
            title: '✅ Berhasil!',
            html: `
              <p>Semua data berhasil diupdate:</p>
              <ul class="text-left text-sm mt-2 space-y-1">
                <li>📦 Stok bahan baku: <strong>${result.metadata?.stokBahanBaku || 0}</strong> bahan</li>
                <li>📦 Stok produk: <strong>${result.metadata?.stokProduk || 0}</strong> produk</li>
                <li>💰 HPP produk: <strong>${result.metadata?.hppProduk || 0}</strong> produk</li>
                <li>📊 Stok minimal: <strong>${result.metadata?.stokMinimal || 0}</strong> bahan</li>
              </ul>
            `,
            timer: 3000,
            showConfirmButton: true,
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
        setIsUpdating(false);
      }
    }
  };

  // ============================================
  // Update Stok Minimal Saja
  // ============================================
  const handleUpdateMinimal = async () => {
    const result = await Swal.fire({
      title: '📊 Update Stok Minimal?',
      html: `
        <p>Anda akan <strong>menghitung ulang</strong> stok minimal bahan baku dari target produk.</p>
        <p class="text-xs text-gray-400 mt-2">Stok minimal = Σ (target produk × qty resep)</p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10B981',
      confirmButtonText: 'Ya, Update!',
      cancelButtonText: 'Batal',
    });

    if (result.isConfirmed) {
      setIsUpdating(true);

      try {
        const res = await fetch('/api/bahan-baku?action=update-minimal', {
          method: 'PATCH',
        });

        const result = await res.json();

        if (result.status === '✅ Berhasil!') {
          await fetchData();
          Swal.fire({
            icon: 'success',
            title: '✅ Berhasil!',
            text: `Stok minimal ${result.metadata?.updated || 0} bahan baku berhasil diupdate dari target produk`,
            timer: 2000,
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
        setIsUpdating(false);
      }
    }
  };

  // ============================================
  // CRUD
  // ============================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nama || !formData.harga) {
      Swal.fire({ icon: 'warning', title: 'Data tidak lengkap!' });
      return;
    }

    setIsSubmitting(true);

    try {
      const url = editingId ? `/api/bahan-baku/${editingId}` : '/api/bahan-baku';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama: formData.nama,
          satuan: formData.satuan,
          harga: Number(formData.harga),
          stokMinimal: Number(formData.stokMinimal) || 0,
        }),
      });

      const result = await res.json();

      if (result.status === '✅ Berhasil!') {
        setShowForm(false);
        setEditingId(null);
        setFormData({ nama: '', satuan: 'Kg', harga: '', stokMinimal: '' });
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

  const handleDelete = async (id: string, nama: string) => {
    const result = await Swal.fire({
      title: `Hapus ${nama}?`,
      text: 'Data akan dihapus permanen!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal',
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/bahan-baku/${id}`, { method: 'DELETE' });
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

  const handleEdit = (item: BahanBaku) => {
    setEditingId(item.id);
    setFormData({
      nama: item.nama,
      satuan: item.satuan,
      harga: String(item.harga),
      stokMinimal: String(item.stokMinimal),
    });
    setShowForm(true);
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
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
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
            <h1 className="text-2xl font-bold text-gray-900">📦 Bahan Baku</h1>
            <p className="text-sm text-gray-500">Kelola data bahan baku</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* Update Stok */}
            <button
              onClick={handleUpdateStok}
              disabled={isUpdating}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {isUpdating ? '⏳ Updating...' : '🔄 Update Stok'}
            </button>

            {/* Update Minimal */}
            {/* <button
              onClick={handleUpdateMinimal}
              disabled={isUpdating}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
              📊 Update Minimal
            </button> */}

            <button
              onClick={() => {
                setEditingId(null);
                setFormData({ nama: '', satuan: 'Kg', harga: '', stokMinimal: '' });
                setShowForm(true);
              }}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tambah Bahan Baku
            </button>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              {editingId ? '✏️ Edit Bahan Baku' : '📝 Tambah Bahan Baku'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                  type="text"
                  placeholder="Nama Bahan"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                  required
                />
                <select
                  value={formData.satuan}
                  onChange={(e) => setFormData({ ...formData, satuan: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                >
                  <option value="Kg">Kg</option>
                  <option value="Gram">Gram</option>
                  <option value="Pcs">Pcs</option>
                  <option value="Lbr">Lbr</option>
                  <option value="Ml">Ml</option>
                </select>
                <input
                  type="number"
                  placeholder="Harga"
                  value={formData.harga}
                  onChange={(e) => setFormData({ ...formData, harga: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                  required
                />
                <input
                  type="number"
                  placeholder="Stok Minimal"
                  value={formData.stokMinimal}
                  onChange={(e) => setFormData({ ...formData, stokMinimal: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                />
              </div>
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
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 text-sm"
                >
                  ❌ Batal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filter */}
        <div className="flex flex-wrap items-center gap-4 mb-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <label className="text-sm text-gray-600 font-medium">🔍 Cari:</label>
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Cari bahan baku..."
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 flex-1 min-w-[200px]"
          />
          <span className="text-xs text-gray-400 ml-auto">📊 {filteredData.length} data</span>
        </div>

        {/* Tabel */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Nama</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Satuan</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase">Harga</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase">Stok</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase">Stok Minimal</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-400 uppercase">Status</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-400 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                      📭 Tidak ada data
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => {
                    const isStokMenipis = item.stok <= item.stokMinimal && item.stok > 0;
                    const isStokHabis = item.stok <= 0;
                    return (
                      <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="px-4 py-2 font-medium text-gray-900">{item.nama}</td>
                        <td className="px-4 py-2 text-gray-500">{item.satuan}</td>
                        <td className="px-4 py-2 text-right text-gray-600">
                          {formatRupiah(item.harga)}
                        </td>
                        <td
                          className={`px-4 py-2 text-right font-medium ${
                            isStokHabis
                              ? 'text-red-600'
                              : isStokMenipis
                              ? 'text-yellow-600'
                              : 'text-gray-700'
                          }`}
                        >
                          {item.stok}
                        </td>
                        <td className="px-4 py-2 text-right text-gray-400">{item.stokMinimal}</td>
                        <td className="px-4 py-2 text-center">
                          {isStokHabis ? (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                              ⛔ Habis
                            </span>
                          ) : isStokMenipis ? (
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                              ⚠️ Menipis
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                              ✅ Aman
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.nama)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors ml-1"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-400 flex justify-between">
            <span>Total {filteredData.length} data</span>
            <span>
              ✅ Aman: {filteredData.filter((d) => d.stok > d.stokMinimal && d.stok > 0).length} | 
              ⚠️ Menipis: {filteredData.filter((d) => d.stok <= d.stokMinimal && d.stok > 0).length} | 
              ⛔ Habis: {filteredData.filter((d) => d.stok <= 0).length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}