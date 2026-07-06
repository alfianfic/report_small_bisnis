// app/manage/pembelian/page.tsx

'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import FilterBar from '@/app/components/ui/FilterBar';

interface BahanBaku {
  id: string;
  nama: string;
  satuan: string;
  harga: number;
  stok: number;
}

interface Pembelian {
  id: string;
  tanggal: string;
  kategori: string;
  nama: string;
  detail: string | null;
  qty: number;
  harga: number;
  total: number;
  bahanBakuId: string | null;
  bahanBaku?: BahanBaku | null;
}

const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(angka);
};

export default function PembelianPage() {
  const [data, setData] = useState<Pembelian[]>([]);
  const [filteredData, setFilteredData] = useState<Pembelian[]>([]);
  const [bahanList, setBahanList] = useState<BahanBaku[]>([]);
  const [filterMonth, setFilterMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [filterKategori, setFilterKategori] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    kategori: 'Bahan Baku',
    nama: '',
    detail: '',
    qty: '',
    harga: '',
  });

  // ✅ Ambil bahan baku untuk dropdown
  const fetchBahan = async () => {
    try {
      const res = await fetch('/api/bahan-baku');
      const result = await res.json();
      if (result.status === '✅ Berhasil!') {
        setBahanList(result.data);
      }
    } catch (error) {
      console.error('Error fetching bahan:', error);
    }
  };

  // ✅ Ambil data pembelian
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/pembelian');
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const result = await res.json();
      
      if (result.status === '✅ Berhasil!') {
        setData(result.data);
        applyFilters(result.data, filterMonth, filterKategori);
      } else {
        throw new Error(result.error || 'Gagal mengambil data');
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message);
      setData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBahan();
    fetchData();
  }, []);

  const applyFilters = (dataSource: Pembelian[], month: string, kategori: string) => {
    let filtered = dataSource;

    if (month) {
      filtered = filtered.filter((item) => item.tanggal.startsWith(month));
    }

    if (kategori !== 'all') {
      filtered = filtered.filter((item) => item.kategori === kategori);
    }

    setFilteredData(filtered);
  };

  const handleFilterChange = (month: string, kategori: string) => {
    setFilterMonth(month);
    setFilterKategori(kategori);
    applyFilters(data, month, kategori);
  };

  // ✅ Auto-fill harga saat bahan baku dipilih
  const handleBahanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nama = e.target.value;
    setFormData({ ...formData, nama, harga: '' });
    
    if (nama) {
      const selected = bahanList.find(b => b.nama === nama);
      if (selected) {
        setFormData(prev => ({ ...prev, nama, harga: String(selected.harga) }));
      }
    }
  };

  // ============================================
  // CRUD
  // ============================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.tanggal || !formData.kategori || !formData.nama || !formData.qty || !formData.harga) {
      Swal.fire({
        icon: 'warning',
        title: 'Data tidak lengkap!',
        text: 'Semua field wajib diisi',
      });
      return;
    }

    const qtyNum = Number(formData.qty);
    const hargaNum = Number(formData.harga);

    if (isNaN(qtyNum) || qtyNum <= 0) {
      Swal.fire({ icon: 'warning', title: 'Qty tidak valid!', text: 'Qty harus lebih dari 0' });
      return;
    }

    if (isNaN(hargaNum) || hargaNum <= 0) {
      Swal.fire({ icon: 'warning', title: 'Harga tidak valid!', text: 'Harga harus lebih dari 0' });
      return;
    }

    setIsSubmitting(true);
    const total = qtyNum * hargaNum;

    try {
      const url = editingId ? `/api/pembelian/${editingId}` : '/api/pembelian';
      const method = editingId ? 'PUT' : 'POST';
      
      // Cari bahan baku ID jika kategori = Bahan Baku
      let bahanBakuId = null;
      if (formData.kategori === 'Bahan Baku') {
        const selected = bahanList.find(b => b.nama === formData.nama);
        bahanBakuId = selected?.id || null;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tanggal: formData.tanggal,
          kategori: formData.kategori,
          nama: formData.nama,
          detail: formData.detail || null,
          qty: qtyNum,
          harga: hargaNum,
          total: total,
          bahanBakuId: bahanBakuId,
        }),
      });
      
      const result = await res.json();
      
      if (result.status === '✅ Berhasil!') {
        setShowForm(false);
        setEditingId(null);
        setFormData({ tanggal: new Date().toISOString().split('T')[0], kategori: 'Bahan Baku', nama: '', detail: '', qty: '', harga: '' });
        await fetchData();
        await fetchBahan(); // refresh stok
        Swal.fire({
          icon: 'success',
          title: '✅ Berhasil!',
          text: editingId ? 'Pembelian berhasil diupdate' : 'Pembelian berhasil ditambahkan',
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({ icon: 'error', title: 'Gagal!', text: result.error || 'Gagal menyimpan data' });
      }
    } catch (error: any) {
      Swal.fire({ icon: 'error', title: 'Error!', text: error.message || 'Terjadi kesalahan' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, nama: string) => {
    const result = await Swal.fire({
      title: `Hapus pembelian ${nama}?`,
      text: "Data akan dihapus permanen!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/pembelian/${id}`, { method: 'DELETE' });
        if (res.ok) {
          await fetchData();
          await fetchBahan(); // refresh stok
          Swal.fire({ icon: 'success', title: '✅ Berhasil!', timer: 1500, showConfirmButton: false });
        } else {
          throw new Error('Gagal menghapus');
        }
      } catch (error) {
        Swal.fire({ icon: 'error', title: 'Gagal!' });
      }
    }
  };

  const handleEdit = (item: Pembelian) => {
    setEditingId(item.id);
    setFormData({
      tanggal: item.tanggal.split('T')[0],
      kategori: item.kategori,
      nama: item.nama,
      detail: item.detail || '',
      qty: String(item.qty),
      harga: String(item.harga),
    });
    setShowForm(true);
  };

  // Statistik
  const totalQty = filteredData.reduce((sum, item) => sum + (item.qty || 0), 0);
  const totalBiaya = filteredData.reduce((sum, item) => sum + (item.total || 0), 0);
  const totalBahanBaku = filteredData.filter(item => item.kategori === 'Bahan Baku').reduce((sum, item) => sum + (item.total || 0), 0);
  const totalOperasional = filteredData.filter(item => item.kategori === 'Operasional').reduce((sum, item) => sum + (item.total || 0), 0);
  const uniqueKategori = [...new Set(filteredData.map(item => item.kategori))];

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
            <h1 className="text-2xl font-bold text-gray-900">🛒 Management Pembelian</h1>
            <p className="text-sm text-gray-500">Kelola data pembelian</p>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); setEditingId(null); }}
            disabled={isSubmitting}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Pembelian
          </button>
        </div>

        {/* Form Tambah */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              {editingId ? '✏️ Edit Pembelian' : '📝 Tambah Pembelian'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Tanggal */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={formData.tanggal}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    required
                  />
                </div>

                {/* Kategori */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                  <select
                    value={formData.kategori}
                    onChange={(e) => setFormData({ ...formData, kategori: e.target.value, nama: '', harga: '' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    <option value="Bahan Baku">Bahan Baku</option>
                    <option value="Operasional">Operasional</option>
                    <option value="Gaji">Gaji</option>
                    <option value="Overhead">Overhead</option>
                  </select>
                </div>

                {/* Nama (dropdown untuk Bahan Baku, input untuk lainnya) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama</label>
                  {formData.kategori === 'Bahan Baku' ? (
                    <select
                      value={formData.nama}
                      onChange={handleBahanChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      required
                    >
                      <option value="">Pilih Bahan</option>
                      {bahanList.map((b) => (
                        <option key={b.id} value={b.nama}>
                          {b.nama} ({b.satuan}) - {formatRupiah(b.harga)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="Nama item"
                      value={formData.nama}
                      onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      required
                    />
                  )}
                </div>

                {/* Qty */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Qty</label>
                  <input
                    type="number"
                    placeholder="Jumlah"
                    value={formData.qty}
                    onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    required
                  />
                </div>

                {/* Harga */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Harga
                    {formData.kategori === 'Bahan Baku' && (
                      <span className="text-xs text-gray-400 ml-1">(auto-fill)</span>
                    )}
                  </label>
                  <input
                    type="number"
                    placeholder="Harga"
                    value={formData.harga}
                    onChange={(e) => setFormData({ ...formData, harga: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    required
                  />
                </div>

                {/* Detail */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Detail (opsional)</label>
                  <input
                    type="text"
                    placeholder="Detail tambahan..."
                    value={formData.detail}
                    onChange={(e) => setFormData({ ...formData, detail: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
              </div>
              
              {/* Preview */}
              {formData.qty && formData.harga && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-gray-600">
                  <span className="font-medium">Preview:</span>
                  {Number(formData.qty)} × {formatRupiah(Number(formData.harga))} = 
                  <span className="font-bold text-blue-600 ml-1">
                    {formatRupiah(Number(formData.qty) * Number(formData.harga))}
                  </span>
                </div>
              )}

              <div className="flex gap-3 mt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? '⏳ Menyimpan...' : 'Simpan'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingId(null); }}
                  className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 text-sm"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filter */}
        <div className="flex flex-wrap items-center gap-4 mb-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <label className="text-sm text-gray-600 font-medium">📅 Filter:</label>
          
          <input
            type="month"
            value={filterMonth}
            onChange={(e) => handleFilterChange(e.target.value, filterKategori)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white cursor-pointer min-w-[180px]"
          />
          
          <select
            value={filterKategori}
            onChange={(e) => handleFilterChange(filterMonth, e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white min-w-[150px]"
          >
            <option value="all">📋 Semua Kategori</option>
            <option value="Bahan Baku">📦 Bahan Baku</option>
            <option value="Operasional">⚙️ Operasional</option>
            <option value="Gaji">👨‍💼 Gaji</option>
            <option value="Overhead">🏦 Overhead</option>
          </select>
          
          <span className="text-xs text-gray-400 ml-auto">
            📊 {filteredData.length} data
          </span>
        </div>

        {/* Statistik */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-4 text-white">
            <p className="text-sm opacity-80">Total Qty</p>
            <p className="text-2xl font-bold">{totalQty}</p>
            <p className="text-xs opacity-70 mt-1">{uniqueKategori.length} kategori</p>
          </div>
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-4 text-white">
            <p className="text-sm opacity-80">Total Biaya</p>
            <p className="text-2xl font-bold">{formatRupiah(totalBiaya)}</p>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-4 text-white">
            <p className="text-sm opacity-80">Total Bahan Baku</p>
            <p className="text-2xl font-bold">{formatRupiah(totalBahanBaku)}</p>
          </div>
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-4 text-white">
            <p className="text-sm opacity-80">Total Operasional</p>
            <p className="text-2xl font-bold">{formatRupiah(totalOperasional)}</p>
          </div>
        </div>

        {/* Tabel */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Tanggal</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Kategori</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Nama</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase">Qty</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase">Harga</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase">Total</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-400 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                      📭 Tidak ada data untuk filter ini
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-4 py-2 text-gray-500">
                        {new Date(item.tanggal).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          item.kategori === 'Bahan Baku' ? 'bg-green-100 text-green-700' :
                          item.kategori === 'Operasional' ? 'bg-blue-100 text-blue-700' :
                          item.kategori === 'Gaji' ? 'bg-purple-100 text-purple-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {item.kategori}
                        </span>
                      </td>
                      <td className="px-4 py-2 font-medium text-gray-900">
                        {item.nama}
                        {item.detail && (
                          <span className="text-xs text-gray-400 ml-1">({item.detail})</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right text-gray-700">{item.qty}</td>
                      <td className="px-4 py-2 text-right text-gray-600">{formatRupiah(item.harga)}</td>
                      <td className="px-4 py-2 text-right font-medium text-gray-700">{formatRupiah(item.total)}</td>
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
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-400">
            Total {filteredData.length} data
          </div>
        </div>
      </div>
    </div>
  );
}