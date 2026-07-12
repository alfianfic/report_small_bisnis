// app/manage/targetcosting/page.tsx

'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

interface AlokasiItem {
  id: string;
  nama: string;
  sku: string;
  qty: number;
  persentaseDefault: number;
  persentaseOverride: number | null;
  persentaseFinal: number;
  isOverridden: boolean;
}

interface BahanBakuItem {
  id: string;
  nama: string;
  satuan: string;
  qty: number;
  hargaDefault: number;
  hargaDipilih: number;
}

interface CostingData {
  produk: {
    id: string;
    nama: string;
    sku: string;
    hpp: number;
  };
  periode: {
    type: string;
    label: string;
    tahun?: number;
    bulan?: string;
    totalOverhead: number;
    totalGaji: number;
    totalQtyAllProduk: number;
    qtyPenjualan: number;
  };
  qtyPenjualan: number;
  totalQtyAllProduk: number;
  persentaseProduk: number;
  totalOverhead: number;
  totalGaji: number;
  bahanBaku: BahanBakuItem[];
  target: {
    bahanBaku: number;
    overhead: number;
    gaji: number;
    total: number;
  };
  realisasi: {
    bahanBaku: number;
    overhead: number;
    gaji: number;
    total: number;
  };
  isOverridden: boolean;
  rawData?: {
    totalOverhead: number;
    totalGaji: number;
    totalQtyAllProduk: number;
    qtyPenjualan: number;
    persentaseProduk: number;
  };
  alokasi?: {
    data: AlokasiItem[];
    isOverridden: boolean;
  };
}

interface Produk {
  id: string;
  nama: string;
  sku: string;
}

const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(angka);
};

export default function CostingPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<CostingData | null>(null);
  const [produkList, setProdukList] = useState<Produk[]>([]);

  // State untuk hide/show bahan baku
  const [showBahanBaku, setShowBahanBaku] = useState(false);

  // State untuk alokasi override - DEFAULT AKTIF
  const [showAlokasiModal, setShowAlokasiModal] = useState(false);
  const [persentaseOverride, setPersentaseOverride] = useState<Record<string, number>>({});
  const [alokasiData, setAlokasiData] = useState<AlokasiItem[]>([]);
  const [isAlokasiActive, setIsAlokasiActive] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true); // Flag untuk initial load

  // Filter
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedProduk, setSelectedProduk] = useState('');
  const [selectedPeriode, setSelectedPeriode] = useState('tahunan');

  // Target Form (editable)
  const [targetBahanBaku, setTargetBahanBaku] = useState(0);
  const [targetOverhead, setTargetOverhead] = useState(0);
  const [targetGaji, setTargetGaji] = useState(0);
  const [hargaBahanBaku, setHargaBahanBaku] = useState<Record<string, number>>({});

  const fetchProduk = async () => {
    try {
      const res = await fetch('/api/products');
      const result = await res.json();
      if (result.status === '✅ Berhasil!') {
        setProdukList(result.data);
        if (result.data.length > 0 && !selectedProduk) {
          setSelectedProduk(result.data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching produk:', error);
    }
  };

  const fetchData = async (isFromInit = false) => {
    if (!selectedProduk) return;

    try {
      setLoading(true);

      // Build URL dengan override jika checkbox aktif
      let url = `/api/targetcosting?produkId=${selectedProduk}&bulan=${selectedMonth}&periode=${selectedPeriode}`;

      // 🔥 PERBAIKAN: Selalu kirim override jika aktif
      if (isAlokasiActive) {
        // Jika override kosong dan ini initial load, buat default dulu
        let overrideToSend = { ...persentaseOverride };
        
        if (Object.keys(overrideToSend).length === 0 && isFromInit) {
          // Ini initial load, override akan diisi dari response API
          // Kita tetap fetch dulu untuk dapat data alokasi
        } else if (Object.keys(overrideToSend).length > 0) {
          url += `&persentase=${JSON.stringify(overrideToSend)}`;
        }
      }

      const res = await fetch(url);
      const result = await res.json();

      if (result.status === '✅ Berhasil!') {
        setData(result.data);
        setTargetBahanBaku(result.data.target.bahanBaku);
        setTargetOverhead(result.data.target.overhead);
        setTargetGaji(result.data.target.gaji);

        // Set alokasi data & default override (hanya jika initial load)
        if (result.data.alokasi) {
          const alokasi = result.data.alokasi.data;
          setAlokasiData(alokasi);

          // Jika initial load, set default override
          if (isFromInit) {
            const defaultOverride: Record<string, number> = {};
            alokasi.forEach((item: AlokasiItem) => {
              if (item.nama.toLowerCase().includes('gudeg')) {
                defaultOverride[item.id] = 70;
              } else {
                defaultOverride[item.id] = 15;
              }
            });
            setPersentaseOverride(defaultOverride);
            
            // 🔥 Setelah override di-set, fetch ulang dengan override
            if (isAlokasiActive) {
              // Fetch ulang dengan override
              setTimeout(() => {
                fetchData(false);
              }, 100);
            }
          }
        }

        // Set harga bahan baku
        const hargaMap: Record<string, number> = {};
        result.data.bahanBaku.forEach((item: BahanBakuItem) => {
          hargaMap[item.id] = item.hargaDipilih;
        });
        setHargaBahanBaku(hargaMap);
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Error fetching costing:', error);
      Swal.fire({
        icon: 'error',
        title: 'Gagal!',
        text: error.message,
      });
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  };

  useEffect(() => {
    fetchProduk();
  }, []);

  useEffect(() => {
    if (selectedProduk) {
      // Reset initial load flag saat produk/ bulan/ periode berubah
      setIsInitialLoad(true);
      fetchData(true);
    }
  }, [selectedProduk, selectedMonth, selectedPeriode]);

  // 🔥 Effect terpisah untuk menangani perubahan isAlokasiActive
  useEffect(() => {
    if (selectedProduk && !isInitialLoad) {
      // Jika isAlokasiActive berubah (bukan initial load), fetch ulang
      fetchData(false);
    }
  }, [isAlokasiActive]);

  // Update target bahan baku ketika harga berubah
  useEffect(() => {
    if (data) {
      const total = data.bahanBaku.reduce((sum, item) => {
        const harga = hargaBahanBaku[item.id] || item.hargaDefault;
        return sum + harga * item.qty;
      }, 0);
      setTargetBahanBaku(total);
    }
  }, [hargaBahanBaku, data]);

  const handleHargaChange = (bahanId: string, value: number) => {
    setHargaBahanBaku((prev) => ({
      ...prev,
      [bahanId]: value,
    }));
  };

  const handleSaveTarget = async () => {
    if (!data) return;

    setSaving(true);
    try {
      const res = await fetch('/api/targetcosting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          produkId: selectedProduk,
          bulan: selectedMonth,
          targetBahanBaku: targetBahanBaku,
          targetOverhead: targetOverhead,
          targetGaji: targetGaji,
          hargaBahanBaku: hargaBahanBaku,
          qtyPenjualan: data.qtyPenjualan,
        }),
      });

      const result = await res.json();

      if (result.status === '✅ Berhasil!') {
        Swal.fire({
          icon: 'success',
          title: '✅ Berhasil!',
          text: 'Target costing berhasil disimpan',
          timer: 1500,
          showConfirmButton: false,
        });
        fetchData(false);
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
      setSaving(false);
    }
  };

  const handleResetTarget = async () => {
    if (!data) return;

    const result = await Swal.fire({
      title: 'Reset Target Costing?',
      text: 'Target akan direset ke default dari sistem',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Ya, Reset!',
      cancelButtonText: 'Batal',
    });

    if (result.isConfirmed) {
      setSaving(true);
      try {
        const res = await fetch(`/api/targetcosting?produkId=${selectedProduk}&bulan=${selectedMonth}`, {
          method: 'DELETE',
        });

        const result = await res.json();

        if (result.status === '✅ Berhasil!') {
          Swal.fire({
            icon: 'success',
            title: '✅ Berhasil!',
            text: 'Target costing berhasil direset',
            timer: 1500,
            showConfirmButton: false,
          });
          fetchData(false);
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
        setSaving(false);
      }
    }
  };

  const getStatusIcon = (target: number, realisasi: number) => {
    if (Math.abs(target - realisasi) <= 1) return '✅';
    if (target === 0 && realisasi === 0) return '⚪';
    if (realisasi <= target) return '✅';
    return '❌';
  };

  const getStatusColor = (target: number, realisasi: number) => {
    if (Math.abs(target - realisasi) <= 1) return 'text-green-600';
    if (target === 0 && realisasi === 0) return 'text-gray-400';
    if (realisasi <= target) return 'text-green-600';
    return 'text-red-600';
  };

  const handleApplyAlokasi = () => {
    setIsAlokasiActive(true);
    fetchData(false);
    setShowAlokasiModal(false);
  };

  const handleResetAlokasi = () => {
    const systemDefault: Record<string, number> = {};
    alokasiData.forEach((item) => {
      systemDefault[item.id] = item.persentaseDefault;
    });
    setPersentaseOverride(systemDefault);
    setIsAlokasiActive(false);
    fetchData(false);
    setShowAlokasiModal(false);
  };

  const getTotalPersentase = () => {
    if (Object.keys(persentaseOverride).length === 0) {
      return alokasiData.reduce((sum, item) => sum + (item.persentaseDefault || 0), 0);
    }
    return Object.values(persentaseOverride).reduce((a, b) => a + b, 0);
  };

  const totalPersentase = getTotalPersentase();
  const isTotalValid = Math.abs(totalPersentase - 100) < 0.01;

  const handleToggleAlokasi = () => {
    const newState = !isAlokasiActive;
    setIsAlokasiActive(newState);

    if (!newState) {
      const systemDefault: Record<string, number> = {};
      alokasiData.forEach((item) => {
        systemDefault[item.id] = item.persentaseDefault;
      });
      setPersentaseOverride(systemDefault);
    }
    // fetchData akan dipanggil oleh useEffect isAlokasiActive
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
            <h1 className="text-2xl font-bold text-gray-900">🎯 Target Costing</h1>
            <p className="text-sm text-gray-500">
              Bandingkan Target Biaya vs Realisasi per Produk
              <span className="ml-2 text-xs text-purple-600 font-medium">
                ({selectedPeriode === 'tahunan' ? '📅 Data Tahunan' : '📆 Data Bulanan'})
              </span>
            </p>
          </div>
          {/* <div className="flex gap-2">
            <button
              onClick={() => fetchData(false)}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
            >
              🔄 Refresh
            </button>
          </div> */}
        </div>

        {/* Filter */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-wrap items-center gap-4">
          <div>
            <label className="text-xs text-gray-400 block">📦 Produk</label>
            <select
              value={selectedProduk}
              onChange={(e) => setSelectedProduk(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 min-w-[200px]"
            >
              <option value="">Pilih Produk</option>
              {produkList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nama} ({p.sku})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 block">📅 Periode</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              {Array.from({ length: 12 }, (_, i) => {
                const year = new Date().getFullYear();
                const month = i + 1;
                const value = `${year}-${String(month).padStart(2, '0')}`;
                const label = new Date(year, i).toLocaleString('id-ID', { month: 'long', year: 'numeric' });
                return (
                  <option key={value} value={value}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 block">📊 Tipe Data</label>
            <select
              value={selectedPeriode}
              onChange={(e) => setSelectedPeriode(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value="tahunan">📅 Tahunan</option>
              <option value="bulanan">📆 Bulanan</option>
            </select>
          </div>

          {/* Checkbox & Tombol Atur Alokasi */}
          <div className="flex items-center gap-3">
            <div>
              <label className="text-xs text-gray-400 block">&nbsp;</label>
              <div className="flex items-center gap-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAlokasiActive}
                    onChange={handleToggleAlokasi}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  <span className="ml-2 text-sm text-gray-700">Alokasi Custom</span>
                </label>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 block">&nbsp;</label>
              <button
                onClick={() => {
                  const defaultOverride: Record<string, number> = {};
                  alokasiData.forEach((item) => {
                    if (item.nama.toLowerCase().includes('gudeg')) {
                      defaultOverride[item.id] = 70;
                    } else {
                      defaultOverride[item.id] = 15;
                    }
                  });
                  setPersentaseOverride(defaultOverride);
                  setShowAlokasiModal(true);
                }}
                className="px-4 py-2 text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors flex items-center gap-2"
              >
                📊 Atur Alokasi
                {isAlokasiActive && (
                  <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full">Active</span>
                )}
              </button>
            </div>
          </div>

          {data && (
            <div className="ml-auto text-sm text-gray-400">
              {data.isOverridden ? '🎯 Target Custom' : '📋 Target Default'}
              <span className="ml-3 text-xs">
                Qty Terjual: <strong>{data.qtyPenjualan}</strong>
              </span>
              <span className="ml-3 text-xs">
                Persentase: <strong>{data.persentaseProduk}%</strong>
              </span>
            </div>
          )}
        </div>

        {/* Modal Alokasi Persentase */}
        {showAlokasiModal && alokasiData.length > 0 && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div
              className="absolute inset-0 bg-transparent"
              onClick={() => setShowAlokasiModal(false)}
            />
            <div className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200">
              <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-indigo-700">📊 Atur Persentase Alokasi</h3>
                <button
                  onClick={() => setShowAlokasiModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                <p className="text-sm text-gray-500 mb-4">
                  Atur persentase alokasi biaya overhead dan gaji untuk setiap produk.
                  Total persentase harus 100%.
                </p>

                <div className="space-y-3">
                  {alokasiData.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-700">{item.nama}</div>
                        <div className="text-xs text-gray-400">
                          Qty: {item.qty} | Default: {item.persentaseDefault}%
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={persentaseOverride[item.id] ?? item.persentaseDefault}
                          onChange={(e) => {
                            const value = Number(e.target.value);
                            setPersentaseOverride(prev => ({
                              ...prev,
                              [item.id]: value
                            }));
                          }}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                        />
                        <span className="text-sm text-gray-500">%</span>
                        <button
                          onClick={() => {
                            setPersentaseOverride(prev => {
                              const newPrev = { ...prev };
                              delete newPrev[item.id];
                              return newPrev;
                            });
                          }}
                          className="text-xs text-red-400 hover:text-red-600"
                        >
                          ↺ Reset
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Persentase:</span>
                    <span className={`font-bold ${isTotalValid ? 'text-green-600' : 'text-red-600'}`}>
                      {Math.round(totalPersentase)}%
                      {!isTotalValid && (
                        <span className="text-xs text-red-500 ml-2">(harus 100%)</span>
                      )}
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={handleApplyAlokasi}
                    disabled={!isTotalValid}
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                      isTotalValid
                        ? 'bg-indigo-500 text-white hover:bg-indigo-600'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    ✅ Terapkan
                  </button>
                  <button
                    onClick={handleResetAlokasi}
                    className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    ↩️ Reset ke Sistem
                  </button>
                  <button
                    onClick={() => setShowAlokasiModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        {data ? (
          <>
            {/* 2 Card Perbandingan */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* ========== KIRI: Target Costing ========== */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-4 py-3 bg-purple-50 border-b border-purple-100">
                  <h2 className="text-sm font-semibold text-purple-700 flex items-center gap-2">
                    <span>🎯</span> Target Costing
                    <span className="text-xs font-normal text-purple-400 ml-2">(Dapat Diedit)</span>
                  </h2>
                </div>
                <div className="p-4 space-y-4">
                  {/* Bahan Baku dengan Toggle Hide/Show */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        🧾 Biaya Bahan Baku
                        <span className="text-xs text-gray-400 ml-2">
                          {showBahanBaku ? '(ditampilkan)' : '(disembunyikan)'}
                        </span>
                      </label>
                      <button
                        onClick={() => setShowBahanBaku(!showBahanBaku)}
                        className="text-xs px-3 py-1 bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors"
                      >
                        {showBahanBaku ? '🙈 Sembunyikan' : '👁️ Tampilkan'}
                      </button>
                    </div>

                    {showBahanBaku ? (
                      <div className="space-y-2 bg-gray-50 rounded-lg p-3">
                        {data.bahanBaku.map((item) => (
                          <div key={item.id} className="flex items-center gap-2">
                            <span className="text-sm text-gray-600 min-w-[100px]">
                              {item.nama}
                              <span className="text-xs text-gray-400 ml-1">
                                ({item.qty} {item.satuan})
                              </span>
                            </span>
                            <span className="text-gray-400 text-sm">Rp</span>
                            <input
                              type="number"
                              value={hargaBahanBaku[item.id] || item.hargaDefault}
                              onChange={(e) => handleHargaChange(item.id, Number(e.target.value))}
                              className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                              min="0"
                              step="1"
                            />
                            <span className="text-xs text-gray-400 min-w-[60px] text-right">
                              = {formatRupiah((hargaBahanBaku[item.id] || item.hargaDefault) * item.qty)}
                            </span>
                          </div>
                        ))}
                        <div className="flex justify-between pt-2 border-t border-gray-200">
                          <span className="text-sm font-medium text-gray-600">Total Bahan Baku</span>
                          <span className="text-sm font-bold text-purple-600">
                            {formatRupiah(targetBahanBaku)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <p className="text-sm text-gray-400">
                          💡 Bahan baku disembunyikan. Klik "Tampilkan" untuk melihat dan mengedit.
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Total biaya bahan baku: {formatRupiah(targetBahanBaku)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Overhead */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">
                      🏢 Biaya Overhead
                      <span className="text-xs text-gray-400 ml-2">
                        (alokasi {data.persentaseProduk}% ÷ {data.qtyPenjualan} qty)
                      </span>
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-sm">Rp</span>
                      <input
                        type="number"
                        value={targetOverhead}
                        onChange={(e) => setTargetOverhead(Number(e.target.value))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                        min="0"
                        step="1"
                      />
                    </div>
                    <div className="text-xs text-gray-400 mt-1 flex justify-between">
                      <span>Total {data.periode.label}: {formatRupiah(data.totalOverhead)}</span>
                      <span>
                        ({formatRupiah(data.totalOverhead)} × {data.persentaseProduk}%) / {data.qtyPenjualan} qty
                      </span>
                    </div>
                  </div>

                  {/* Gaji */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">
                      👨‍💼 Biaya Gaji
                      <span className="text-xs text-gray-400 ml-2">
                        (alokasi {data.persentaseProduk}% ÷ {data.qtyPenjualan} qty)
                      </span>
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-sm">Rp</span>
                      <input
                        type="number"
                        value={targetGaji}
                        onChange={(e) => setTargetGaji(Number(e.target.value))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                        min="0"
                        step="1"
                      />
                    </div>
                    <div className="text-xs text-gray-400 mt-1 flex justify-between">
                      <span>Total {data.periode.label}: {formatRupiah(data.totalGaji)}</span>
                      <span>
                        ({formatRupiah(data.totalGaji)} × {data.persentaseProduk}%) / {data.qtyPenjualan} qty
                      </span>
                    </div>
                  </div>

                  {/* Total Target */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center p-4 bg-purple-50 rounded-xl">
                      <span className="font-semibold text-purple-800">💰 TOTAL TARGET</span>
                      <span className="text-xl font-bold text-purple-700">
                        {formatRupiah(targetBahanBaku + targetOverhead + targetGaji)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={handleSaveTarget}
                      disabled={saving}
                      className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {saving ? '⏳ Menyimpan...' : '💾 Simpan Target'}
                    </button>
                    <button
                      onClick={handleResetTarget}
                      disabled={saving}
                      className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      ↩️ Reset
                    </button>
                  </div>
                </div>
              </div>

              {/* ========== KANAN: Realisasi Biaya ========== */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-4 py-3 bg-green-50 border-b border-green-100">
                  <h2 className="text-sm font-semibold text-green-700 flex items-center gap-2">
                    <span>📊</span> Realisasi Biaya
                    <span className="text-xs font-normal text-green-400 ml-2">
                      (Data {data.periode.label} / Readonly)
                    </span>
                  </h2>
                </div>
                <div className="p-4 space-y-4">
                  {/* Bahan Baku */}
                  <div className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-sm text-gray-600">🧾 Biaya Bahan Baku (HPP)</span>
                    <div className="text-right">
                      <span className="text-sm font-medium text-gray-700">{formatRupiah(data.realisasi.bahanBaku)}</span>
                      <span className={`ml-2 text-sm ${getStatusColor(data.target.bahanBaku, data.realisasi.bahanBaku)}`}>
                        {getStatusIcon(data.target.bahanBaku, data.realisasi.bahanBaku)}
                      </span>
                    </div>
                  </div>

                  {/* Overhead */}
                  <div className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-sm text-gray-600">🏢 Biaya Overhead</span>
                    <div className="text-right">
                      <span className="text-sm font-medium text-gray-700">{formatRupiah(data.realisasi.overhead)}</span>
                      <span className={`ml-2 text-sm ${getStatusColor(data.target.overhead, data.realisasi.overhead)}`}>
                        {getStatusIcon(data.target.overhead, data.realisasi.overhead)}
                      </span>
                    </div>
                  </div>

                  {/* Gaji */}
                  <div className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-sm text-gray-600">👨‍💼 Biaya Gaji</span>
                    <div className="text-right">
                      <span className="text-sm font-medium text-gray-700">{formatRupiah(data.realisasi.gaji)}</span>
                      <span className={`ml-2 text-sm ${getStatusColor(data.target.gaji, data.realisasi.gaji)}`}>
                        {getStatusIcon(data.target.gaji, data.realisasi.gaji)}
                      </span>
                    </div>
                  </div>

                  {/* Total Realisasi */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center p-4 bg-green-50 rounded-xl">
                      <span className="font-semibold text-green-800">💰 TOTAL REALISASI</span>
                      <span className="text-xl font-bold text-green-700">
                        {formatRupiah(data.realisasi.total)}
                      </span>
                    </div>
                  </div>

                  {/* Selisih */}
                  <div className="pt-2">
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                      <span className="text-sm font-medium text-gray-600">📊 Selisih (Target - Realisasi)</span>
                      <span className={`text-lg font-bold ${(data.target.total - data.realisasi.total) >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                        }`}>
                        {formatRupiah(data.target.total - data.realisasi.total)}
                      </span>
                    </div>
                  </div>

                  {/* Detail Selisih per komponen */}
                  <div className="pt-2 space-y-1 text-xs text-gray-400">
                    <div className="flex justify-between">
                      <span>Bahan Baku</span>
                      <span className={data.target.bahanBaku - data.realisasi.bahanBaku >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatRupiah(data.target.bahanBaku - data.realisasi.bahanBaku)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Overhead</span>
                      <span className={data.target.overhead - data.realisasi.overhead >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatRupiah(data.target.overhead - data.realisasi.overhead)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Gaji</span>
                      <span className={data.target.gaji - data.realisasi.gaji >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatRupiah(data.target.gaji - data.realisasi.gaji)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ========== CARD INFORMASI DI BAWAH (FULL WIDTH) ========== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Card Kiri: Detail Perhitungan */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
                  <h2 className="text-sm font-semibold text-blue-700 flex items-center gap-2">
                    <span>📐</span> Detail Perhitungan
                  </h2>
                </div>
                <div className="p-4 space-y-3">
                  <div className="text-xs text-gray-600">
                    <div className="font-medium text-gray-700 mb-2">🎯 Target:</div>
                    <div className="space-y-1.5 bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between">
                        <span>Overhead Target</span>
                        <span className="font-mono">
                          {formatRupiah(data.totalOverhead)} × {data.persentaseProduk}% / {data.qtyPenjualan}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Gaji Target</span>
                        <span className="font-mono">
                          {formatRupiah(data.totalGaji)} × {data.persentaseProduk}% / {data.qtyPenjualan}
                        </span>
                      </div>
                      <div className="flex justify-between text-purple-600 font-medium pt-1 border-t border-gray-200">
                        <span>Total Target</span>
                        <span>{formatRupiah(data.target.total)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-gray-600">
                    <div className="font-medium text-gray-700 mb-2">📊 Realisasi:</div>
                    <div className="space-y-1.5 bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between">
                        <span>Overhead Realisasi</span>
                        <span className="font-mono">
                          {formatRupiah(data.totalOverhead)} × ({data.qtyPenjualan}/{data.totalQtyAllProduk}) / {data.qtyPenjualan}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Gaji Realisasi</span>
                        <span className="font-mono">
                          {formatRupiah(data.totalGaji)} × ({data.qtyPenjualan}/{data.totalQtyAllProduk}) / {data.qtyPenjualan}
                        </span>
                      </div>
                      <div className="flex justify-between text-green-600 font-medium pt-1 border-t border-gray-200">
                        <span>Total Realisasi</span>
                        <span>{formatRupiah(data.realisasi.total)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-gray-600">
                    <div className="font-medium text-gray-700 mb-2">📈 Selisih:</div>
                    <div className="space-y-1.5 bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between">
                        <span>Selisih Overhead</span>
                        <span className={data.target.overhead - data.realisasi.overhead >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatRupiah(data.target.overhead - data.realisasi.overhead)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Selisih Gaji</span>
                        <span className={data.target.gaji - data.realisasi.gaji >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatRupiah(data.target.gaji - data.realisasi.gaji)}
                        </span>
                      </div>
                      <div className="flex justify-between font-bold pt-1 border-t border-gray-200">
                        <span>Total Selisih</span>
                        <span className={data.target.total - data.realisasi.total >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatRupiah(data.target.total - data.realisasi.total)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Kanan: Informasi Produk */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-4 py-3 bg-indigo-50 border-b border-indigo-100">
                  <h2 className="text-sm font-semibold text-indigo-700 flex items-center gap-2">
                    <span>📋</span> Informasi Produk & Periode
                  </h2>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {/* Produk */}
                    <div className="col-span-2 bg-gray-50 rounded-lg p-3">
                      <div className="font-medium text-gray-700 mb-1">📦 Produk</div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Nama</span>
                          <span className="font-medium text-gray-700">{data.produk.nama}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">SKU</span>
                          <span className="font-medium text-gray-700">{data.produk.sku}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">HPP</span>
                          <span className="font-medium text-gray-700">{formatRupiah(data.produk.hpp)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Qty */}
                    <div className="col-span-2 bg-gray-50 rounded-lg p-3">
                      <div className="font-medium text-gray-700 mb-1">📊 Quantity</div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Qty Terjual</span>
                          <span className="font-medium text-gray-700">{data.qtyPenjualan}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Total Qty (Semua Produk)</span>
                          <span className="font-medium text-gray-700">{data.totalQtyAllProduk}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Persentase Alokasi</span>
                          <span className="font-medium text-indigo-600">{data.persentaseProduk}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Biaya */}
                    <div className="col-span-2 bg-gray-50 rounded-lg p-3">
                      <div className="font-medium text-gray-700 mb-1">💰 Biaya {data.periode.label}</div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Total Overhead</span>
                          <span className="font-medium text-gray-700">{formatRupiah(data.totalOverhead)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Total Gaji</span>
                          <span className="font-medium text-gray-700">{formatRupiah(data.totalGaji)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Total Biaya</span>
                          <span className="font-medium text-gray-700">{formatRupiah(data.totalOverhead + data.totalGaji)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="col-span-2 bg-gray-50 rounded-lg p-3">
                      <div className="font-medium text-gray-700 mb-1">📌 Status</div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Target Costing</span>
                        <span className={`font-medium ${data.isOverridden ? 'text-purple-600' : 'text-gray-500'}`}>
                          {data.isOverridden ? '🎯 Custom' : '📋 Default'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-gray-500">Periode Data</span>
                        <span className="font-medium text-blue-600">
                          {data.periode.label}
                          {data.periode.tahun && ` (${data.periode.tahun})`}
                          {data.periode.bulan && ` (${data.periode.bulan})`}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-gray-500">Alokasi Custom</span>
                        <span className={`font-medium ${isAlokasiActive ? 'text-indigo-600' : 'text-gray-400'}`}>
                          {isAlokasiActive ? '✅ Aktif' : '❌ Nonaktif'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center text-gray-400">
            📭 Pilih produk dan bulan untuk melihat data costing
          </div>
        )}
      </div>
    </div>
  );
}