// app/manage/pembelian/page.tsx

'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

interface BahanBaku {
  id: string;
  nama: string;
  satuan: string;
  harga: number;
  stok: number;
}

interface PembelianItem {
  id: string;
  tanggal: string;
  nama: string;
  detail: string | null;
  qty: number;
  harga: number;
  total: number;
  source: 'bahan_baku' | 'reguler';
  satuan?: string;
  bahanBaku?: any;
}

const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(angka);
};

export default function PembelianPage() {
  const [data, setData] = useState<PembelianItem[]>([]);
  const [filteredData, setFilteredData] = useState<PembelianItem[]>([]);
  const [bahanList, setBahanList] = useState<BahanBaku[]>([]);
  const [filterMonth, setFilterMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    nama: '',
    detail: '',
    qty: '',
    hargaTotal: '',  // Changed from 'harga' to 'hargaTotal'
    isBahanBaku: false,
    bahanBakuId: '',
  });

  // Fetch bahan baku
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
        applyFilters(result.data, filterMonth);
        console.log(`✅ Total data: ${result.data.length}`);
        console.log(`   - Bahan Baku: ${result.metadata?.fromBahanBaku || 0}`);
        console.log(`   - Reguler: ${result.metadata?.fromReguler || 0}`);
      } else {
        throw new Error(result.error || 'Gagal mengambil data');
      }
    } catch (err: any) {
      console.error('❌ Error:', err);
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

  const applyFilters = (dataSource: PembelianItem[], month: string) => {
    let filtered = dataSource;
    if (month) {
      filtered = filtered.filter((item) => item.tanggal.startsWith(month));
    }
    setFilteredData(filtered);
  };

  const handleFilterChange = (month: string) => {
    setFilterMonth(month);
    applyFilters(data, month);
  };

  // Handle form
  const handleBahanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;

    if (id) {
      const selected = bahanList.find(b => b.id === id);
      if (selected) {
        setFormData({
          ...formData,
          bahanBakuId: id,
          nama: selected.nama,
          hargaTotal: '', // Reset hargaTotal, user will input total
          isBahanBaku: true,
        });
      }
    } else {
      setFormData({
        ...formData,
        bahanBakuId: '',
        nama: '',
        hargaTotal: '',
        isBahanBaku: false,
      });
    }
  };

  const handleNamaInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({
      ...formData,
      nama: value,
      isBahanBaku: false,
      bahanBakuId: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.tanggal || !formData.nama || !formData.qty || !formData.hargaTotal) {
      Swal.fire({
        icon: 'warning',
        title: 'Data tidak lengkap!',
        text: 'Semua field wajib diisi',
        confirmButtonText: 'OK',
      });
      return;
    }

    const qtyNum = Number(formData.qty);
    const hargaTotalNum = Number(formData.hargaTotal);

    if (isNaN(qtyNum) || qtyNum <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Qty tidak valid!',
        text: 'Qty harus lebih dari 0',
        confirmButtonText: 'OK',
      });
      return;
    }

    if (isNaN(hargaTotalNum) || hargaTotalNum <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Harga Total tidak valid!',
        text: 'Harga Total harus lebih dari 0',
        confirmButtonText: 'OK',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: any = {
        tanggal: formData.tanggal,
        nama: formData.nama,
        detail: formData.detail || null,
        qty: qtyNum,
        hargaTotal: hargaTotalNum,  // Kirim hargaTotal
        total: hargaTotalNum,       // Total = hargaTotal
        isBahanBaku: formData.isBahanBaku,
      };

      if (formData.isBahanBaku && formData.bahanBakuId) {
        payload.bahanBakuId = formData.bahanBakuId;
      }

      const res = await fetch('/api/pembelian', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (result.status === '✅ Berhasil!') {
        setShowForm(false);
        setFormData({
          tanggal: new Date().toISOString().split('T')[0],
          nama: '',
          detail: '',
          qty: '',
          hargaTotal: '',
          isBahanBaku: false,
          bahanBakuId: '',
        });
        await fetchData();
        await fetchBahan();

        // Update Laporan Bulanan
        await updateLaporanBulanan(formData.tanggal);

        Swal.fire({
          icon: 'success',
          title: '✅ Berhasil!',
          text: result.message || 'Pembelian berhasil ditambahkan',
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Gagal!',
          text: result.error || 'Gagal menyimpan data',
          confirmButtonText: 'OK',
        });
      }
    } catch (error: any) {
      console.error('❌ Submit error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: error.message || 'Terjadi kesalahan',
        confirmButtonText: 'OK',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update Laporan Bulanan
  const updateLaporanBulanan = async (tanggal: string) => {
    try {
      const bulan = new Date(tanggal);
      const bulanStr = `${bulan.getFullYear()}-${String(bulan.getMonth() + 1).padStart(2, '0')}`;

      const res = await fetch('/api/laporan-bulanan/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bulan: bulanStr }),
      });

      const result = await res.json();
      console.log('📊 Laporan Bulanan updated:', result);
    } catch (error) {
      console.error('❌ Error updating laporan bulanan:', error);
    }
  };

  const handleDelete = async (id: string, nama: string, source: string, tanggal: string) => {
    const result = await Swal.fire({
      title: `Hapus ${nama}?`,
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
          await fetchBahan();

          // Update Laporan Bulanan
          await updateLaporanBulanan(tanggal);

          Swal.fire({ icon: 'success', title: '✅ Berhasil!', timer: 1500, showConfirmButton: false });
        } else {
          throw new Error('Gagal menghapus');
        }
      } catch (error) {
        Swal.fire({ icon: 'error', title: 'Gagal!' });
      }
    }
  };

  // Statistik
  const totalQty = filteredData.reduce((sum, item) => sum + (item.qty || 0), 0);
  const totalBiaya = filteredData.reduce((sum, item) => sum + (item.total || 0), 0);
  const fromBahanBaku = filteredData.filter(d => d.source === 'bahan_baku').length;
  const fromReguler = filteredData.filter(d => d.source === 'reguler').length;

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
            <h1 className="text-2xl font-bold text-gray-900">🛒 Pembelian</h1>
            <p className="text-sm text-gray-500">
              Total: {data.length} data
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
            >
              🔄 Refresh
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              disabled={isSubmitting}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tambah Pembelian
            </button>
          </div>
        </div>

        {/* Form Tambah */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">📝 Tambah Pembelian</h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tanggal */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tanggal <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.tanggal}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    required
                  />
                </div>

                {/* Nama Item */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Item <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    <select
                      value={formData.isBahanBaku ? formData.bahanBakuId : ''}
                      onChange={handleBahanChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    >
                      <option value="">Pilih dari daftar bahan baku</option>
                      {bahanList.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.nama} ({b.satuan}) - Stok: {b.stok} | {formatRupiah(b.harga)}
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">atau input manual:</span>
                      <input
                        type="text"
                        placeholder="Nama item (Gas, Listrik, dll)"
                        value={!formData.isBahanBaku ? formData.nama : ''}
                        onChange={handleNamaInputChange}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      />
                    </div>
                  </div>
                </div>

                {/* Qty */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Qty <span className="text-red-500">*</span>
                    {formData.isBahanBaku && formData.bahanBakuId && (
                      <span className="text-xs text-gray-400 ml-1">
                        ({bahanList.find(b => b.id === formData.bahanBakuId)?.satuan})
                      </span>
                    )}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Jumlah"
                      value={formData.qty}
                      onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      required
                      min="0.001"
                      step="0.001"
                    />
                    {formData.isBahanBaku && formData.bahanBakuId && (
                      <span className="text-sm text-gray-500 min-w-[40px]">
                        {bahanList.find(b => b.id === formData.bahanBakuId)?.satuan}
                      </span>
                    )}
                  </div>
                </div>

                {/* Harga */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Harga Total <span className="text-red-500">*</span>
                    {formData.isBahanBaku && formData.bahanBakuId && (
                      <span className="text-xs text-gray-400 ml-1">(input total belanja)</span>
                    )}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rp</span>
                    <input
                      type="number"
                      placeholder="Total harga (misal: 50000)"
                      value={formData.hargaTotal}
                      onChange={(e) => setFormData({ ...formData, hargaTotal: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      required
                      min="1"
                      step="1"
                    />
                  </div>
                  {formData.isBahanBaku && formData.bahanBakuId && formData.qty && formData.hargaTotal && (
                    <p className="text-xs text-gray-400 mt-1">
                      Harga per satuan: {formatRupiah(Math.round(Number(formData.hargaTotal) / Number(formData.qty)))}
                    </p>
                  )}
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
              {formData.qty && formData.hargaTotal && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <span className="text-sm text-gray-600 font-medium">📊 Preview:</span>
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <span>
                        {Number(formData.qty)} × {formatRupiah(Math.round(Number(formData.hargaTotal) / Number(formData.qty)))}
                        <span className="text-gray-400 ml-1">=</span>
                      </span>
                      <span className="font-bold text-blue-600 text-base">
                        {formatRupiah(Number(formData.hargaTotal))}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Info Stok */}
              {formData.isBahanBaku && formData.bahanBakuId && formData.qty && (
                <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-2 text-sm text-yellow-700">
                    <span>ℹ️</span>
                    <span>
                      Stok akan bertambah <strong>{Number(formData.qty)}</strong>{' '}
                      {bahanList.find(b => b.id === formData.bahanBakuId)?.satuan}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Menyimpan...
                    </>
                  ) : (
                    '💾 Simpan'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); }}
                  className="px-6 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 text-sm"
                >
                  ❌ Batal
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
            onChange={(e) => handleFilterChange(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white cursor-pointer min-w-[180px]"
          />
          <span className="text-xs text-gray-400 ml-auto">
            📊 {filteredData.length} data
          </span>
        </div>

        {/* Statistik */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-4 text-white">
            <p className="text-sm opacity-80">Total Data</p>
            <p className="text-2xl font-bold">{filteredData.length}</p>
          </div>
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-4 text-white">
            <p className="text-sm opacity-80">Total Qty</p>
            <p className="text-2xl font-bold">{totalQty}</p>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-4 text-white">
            <p className="text-sm opacity-80">Total Biaya</p>
            <p className="text-2xl font-bold">{formatRupiah(totalBiaya)}</p>
          </div>
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-4 text-white">
            <p className="text-sm opacity-80">Sumber Data</p>
            <p className="text-xl font-bold">
              📦{fromBahanBaku} 📝{fromReguler}
            </p>
          </div>
        </div>

        {/* Tabel */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Tanggal</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Nama</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Qty</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Satuan</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Harga</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Total</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">Sumber</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                      📭 Belum ada data
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr key={`${item.source}-${item.id}`} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(item.tanggal).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {item.nama}
                        {item.detail && (
                          <span className="text-xs text-gray-400 ml-1">({item.detail})</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        {item.qty}
                        {item.source === 'bahan_baku' && (
                          <span className="text-xs text-green-500 ml-1">↑</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500">
                        {item.satuan || '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {formatRupiah(item.harga)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-700">
                        {formatRupiah(item.total)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs px-2 py-1 rounded-full ${item.source === 'bahan_baku'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                          }`}>
                          {item.source === 'bahan_baku' ? '📦 Bahan' : '📝 Reguler'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleDelete(item.id, item.nama, item.source, item.tanggal)}
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
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-400 flex justify-between">
            <span>Total {filteredData.length} data</span>
            <span>
              📦 Bahan: {fromBahanBaku} | 📝 Reguler: {fromReguler}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}