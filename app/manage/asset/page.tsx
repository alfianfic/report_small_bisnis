// app/manage/asset/override/page.tsx

'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

interface LaporanItem {
  id: string;
  bulan: Date;
  bulanStr: string;
  qtyProduksi: number;
  costPerPortion: number;
  jumlahCost: number;
  overhead: number;
  gaji: number;
  labaKotor: number;
  profit: number;
  defaultOverhead: number;
  isOverridden: boolean;
}

const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(angka);
};

const formatBulan = (bulanStr: string) => {
  const [year, month] = bulanStr.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
};

export default function OverrideOverheadPage() {
  const [data, setData] = useState<LaporanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/laporan-bulanan/override-overhead');
      const result = await res.json();
      
      if (result.status === '✅ Berhasil!') {
        setData(result.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ✅ Override single bulan
  const handleOverride = async (bulan: string, value: number) => {
    try {
      const res = await fetch('/api/laporan-bulanan/override-overhead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bulan, overhead: value }),
      });

      const result = await res.json();

      if (result.status === '✅ Berhasil!') {
        await fetchData();
        return true;
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal!',
        text: error.message,
      });
      return false;
    }
  };

  // ✅ Set 0 Semua
  const handleSetAllZero = async () => {
    if (data.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Tidak ada data!',
        text: 'Belum ada laporan bulanan',
      });
      return;
    }

    const result = await Swal.fire({
      title: '⚠️ Set 0 Semua Overhead?',
      html: `
        <p>Anda akan mengatur <strong>semua overhead</strong> menjadi <strong>Rp 0</strong> untuk ${data.length} bulan.</p>
        <p class="text-xs text-gray-400 mt-2">Tindakan ini dapat dibatalkan dengan klik "Reset Semua"</p>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Ya, Set 0 Semua!',
      cancelButtonText: 'Batal',
    });

    if (result.isConfirmed) {
      setIsSubmitting(true);
      let successCount = 0;
      let failCount = 0;

      for (const item of data) {
        const success = await handleOverride(item.bulanStr, 0);
        if (success) {
          successCount++;
        } else {
          failCount++;
        }
      }

      setIsSubmitting(false);

      Swal.fire({
        icon: successCount > 0 ? 'success' : 'error',
        title: successCount > 0 ? '✅ Berhasil!' : '❌ Gagal!',
        html: `
          <p>${successCount} bulan berhasil di-set 0</p>
          ${failCount > 0 ? `<p class="text-red-500">${failCount} bulan gagal</p>` : ''}
        `,
        timer: 2000,
        showConfirmButton: true,
      });
    }
  };

  // ✅ Reset Semua ke Default
  const handleResetAll = async () => {
    if (data.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Tidak ada data!',
        text: 'Belum ada laporan bulanan',
      });
      return;
    }

    const overriddenCount = data.filter(d => d.isOverridden).length;
    
    if (overriddenCount === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Tidak ada override!',
        text: 'Semua bulan sudah menggunakan nilai default',
      });
      return;
    }

    const result = await Swal.fire({
      title: '🔄 Reset Semua Overhead?',
      html: `
        <p>Anda akan mengembalikan <strong>${overriddenCount}</strong> bulan ke nilai default.</p>
        <p class="text-xs text-gray-400 mt-2">Nilai default: ${formatRupiah(data[0]?.defaultOverhead || 0)}</p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3B82F6',
      confirmButtonText: 'Ya, Reset Semua!',
      cancelButtonText: 'Batal',
    });

    if (result.isConfirmed) {
      setIsSubmitting(true);
      let successCount = 0;
      let failCount = 0;

      for (const item of data) {
        if (item.isOverridden) {
          const success = await handleOverride(item.bulanStr, item.defaultOverhead);
          if (success) {
            successCount++;
          } else {
            failCount++;
          }
        }
      }

      setIsSubmitting(false);

      Swal.fire({
        icon: 'success',
        title: '✅ Berhasil!',
        html: `
          <p>${successCount} bulan berhasil direset ke default</p>
          ${failCount > 0 ? `<p class="text-red-500">${failCount} bulan gagal</p>` : ''}
        `,
        timer: 2000,
        showConfirmButton: true,
      });
    }
  };

  // ✅ Override single dengan prompt
  const handleEditSingle = async (bulan: string, currentOverhead: number) => {
    const { value } = await Swal.fire({
      title: `Override Overhead ${formatBulan(bulan)}`,
      text: 'Masukkan nilai overhead baru (0 untuk menghapus)',
      input: 'number',
      inputValue: currentOverhead,
      inputPlaceholder: 'Masukkan nominal overhead',
      showCancelButton: true,
      confirmButtonText: 'Simpan',
      cancelButtonText: 'Batal',
      preConfirm: (value) => {
        if (value === '' || value === null || value === undefined) {
          Swal.showValidationMessage('Nilai tidak boleh kosong');
          return;
        }
        return Number(value);
      },
    });

    if (value !== undefined) {
      const success = await handleOverride(bulan, value);
      if (success) {
        Swal.fire({
          icon: 'success',
          title: '✅ Berhasil!',
          text: `Overhead diupdate menjadi ${formatRupiah(value)}`,
          timer: 1500,
          showConfirmButton: false,
        });
      }
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🎛️ Override Overhead Bulanan</h1>
            <p className="text-sm text-gray-500">
              Atur overhead per bulan secara manual (override dari Asset)
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* ✅ Tombol Refresh */}
            <button
              onClick={fetchData}
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>

            {/* ✅ Tombol Set 0 Semua */}
            <button
              onClick={handleSetAllZero}
              disabled={isSubmitting || data.length === 0}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              0️⃣ Set 0 Semua
            </button>

            {/* ✅ Tombol Reset Semua */}
            <button
              onClick={handleResetAll}
              disabled={isSubmitting || data.filter(d => d.isOverridden).length === 0}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              ↩️ Reset Semua
            </button>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">ℹ️</span>
            <div>
              <p className="text-sm text-blue-700 font-medium">Cara Kerja Overhead:</p>
              <ul className="text-xs text-blue-600 mt-1 space-y-1">
                <li>• Default overhead diambil dari total <strong>Asset.perMonth</strong></li>
                <li>• Anda bisa <strong>override</strong> nilai overhead per bulan</li>
                <li>• Klik <strong>Reset</strong> untuk kembali ke nilai default</li>
                <li>• Klik <strong>Set 0</strong> untuk menghapus overhead bulan tersebut</li>
                <li>• Gunakan <strong>Set 0 Semua</strong> untuk semua bulan</li>
                <li>• Gunakan <strong>Reset Semua</strong> untuk mengembalikan semua ke default</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-4 text-white">
            <p className="text-sm opacity-80">Total Bulan</p>
            <p className="text-2xl font-bold">{data.length}</p>
          </div>
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-4 text-white">
            <p className="text-sm opacity-80">Override</p>
            <p className="text-2xl font-bold">{data.filter(d => d.isOverridden).length}</p>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-4 text-white">
            <p className="text-sm opacity-80">Default</p>
            <p className="text-2xl font-bold">{data.filter(d => !d.isOverridden).length}</p>
          </div>
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-4 text-white">
            <p className="text-sm opacity-80">Default Overhead</p>
            <p className="text-xl font-bold">{formatRupiah(data[0]?.defaultOverhead || 0)}</p>
          </div>
        </div>

        {/* Tabel */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Bulan</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Qty Produksi</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Cost</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Gaji</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Laba Kotor</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Overhead</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Profit</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                      📭 Belum ada laporan bulanan
                    </td>
                  </tr>
                ) : (
                  data.map((item) => (
                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {formatBulan(item.bulanStr)}
                        {item.isOverridden && (
                          <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                            Override
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">{item.qtyProduksi}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{formatRupiah(item.jumlahCost)}</td>
                      <td className="px-4 py-3 text-right text-pink-600">{formatRupiah(item.gaji)}</td>
                      <td className="px-4 py-3 text-right text-green-600">{formatRupiah(item.labaKotor)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-medium ${item.isOverridden ? 'text-orange-600' : 'text-purple-600'}`}>
                          {formatRupiah(item.overhead)}
                        </span>
                        {!item.isOverridden && (
                          <span className="text-xs text-gray-400 ml-1">(default)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-blue-600">
                        {formatRupiah(item.profit)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-1">
                          {/* ✅ Edit Single */}
                          <button
                            onClick={() => handleEditSingle(item.bulanStr, item.overhead)}
                            disabled={isSubmitting}
                            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
                          >
                            ✏️ Edit
                          </button>
                          {/* ✅ Set 0 Single */}
                          <button
                            onClick={() => {
                              handleOverride(item.bulanStr, 0).then(success => {
                                if (success) {
                                  Swal.fire({
                                    icon: 'success',
                                    title: '✅ Berhasil!',
                                    text: `Overhead ${formatBulan(item.bulanStr)} di-set 0`,
                                    timer: 1500,
                                    showConfirmButton: false,
                                  });
                                }
                              });
                            }}
                            disabled={isSubmitting}
                            className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50"
                          >
                            0️⃣ Set 0
                          </button>
                          {/* ✅ Reset Single (hanya jika override) */}
                          {item.isOverridden && (
                            <button
                              onClick={() => {
                                handleOverride(item.bulanStr, item.defaultOverhead).then(success => {
                                  if (success) {
                                    Swal.fire({
                                      icon: 'success',
                                      title: '✅ Berhasil!',
                                      text: `Overhead ${formatBulan(item.bulanStr)} direset ke default`,
                                      timer: 1500,
                                      showConfirmButton: false,
                                    });
                                  }
                                });
                              }}
                              disabled={isSubmitting}
                              className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50"
                            >
                              ↩️ Reset
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Footer */}
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-400 flex justify-between">
            <span>Total {data.length} bulan</span>
            <span>
              Override: {data.filter(d => d.isOverridden).length} | 
              Default: {data.filter(d => !d.isOverridden).length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}