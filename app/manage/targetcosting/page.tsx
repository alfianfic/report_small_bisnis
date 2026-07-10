// app/manage/costing/page.tsx

'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

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
  qtyPenjualan: number;
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

  // Filter
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedProduk, setSelectedProduk] = useState('');

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

  const fetchData = async () => {
    if (!selectedProduk) return;

    try {
      setLoading(true);
      const url = `/api/targetcosting?produkId=${selectedProduk}&bulan=${selectedMonth}`;
      const res = await fetch(url);
      const result = await res.json();

      if (result.status === '✅ Berhasil!') {
        setData(result.data);
        setTargetBahanBaku(result.data.target.bahanBaku);
        setTargetOverhead(result.data.target.overhead);
        setTargetGaji(result.data.target.gaji);

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
    }
  };

  useEffect(() => {
    fetchProduk();
  }, []);

  useEffect(() => {
    if (selectedProduk) {
      fetchData();
    }
  }, [selectedProduk, selectedMonth]);

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
        fetchData();
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
          fetchData();
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
    if (target === 0 && realisasi === 0) return '⚪';
    if (realisasi <= target) return '✅';
    return '❌';
  };

  const getStatusColor = (target: number, realisasi: number) => {
    if (target === 0 && realisasi === 0) return 'text-gray-400';
    if (realisasi <= target) return 'text-green-600';
    return 'text-red-600';
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
            <p className="text-sm text-gray-500">Bandingkan Target Biaya vs Realisasi per Produk</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
            >
              🔄 Refresh
            </button>
          </div>
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
            <label className="text-xs text-gray-400 block">📅 Bulan</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
          </div>
          {data && (
            <div className="ml-auto text-sm text-gray-400">
              {data.isOverridden ? '🎯 Target Custom' : '📋 Target Default'}
              <span className="ml-3 text-xs">
                Qty Terjual: <strong>{data.qtyPenjualan}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Main Content */}
        {data ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ========== KIRI: Target Costing ========== */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 bg-purple-50 border-b border-purple-100">
                <h2 className="text-sm font-semibold text-purple-700 flex items-center gap-2">
                  <span>🎯</span> Target Costing
                  <span className="text-xs font-normal text-purple-400 ml-2">(Dapat Diedit)</span>
                </h2>
              </div>
              <div className="p-4 space-y-4">
                {/* Bahan Baku */}
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    🧾 Biaya Bahan Baku
                  </label>
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
                </div>

                {/* Overhead */}
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">
                    🏢 Biaya Overhead
                    <span className="text-xs text-gray-400 ml-2">(per produk)</span>
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
                    <span className="text-xs text-gray-400">
                      Total Overhead: {formatRupiah(data.totalOverhead)}
                    </span>
                  </div>
                </div>

                {/* Gaji */}
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">
                    👨‍💼 Biaya Gaji
                    <span className="text-xs text-gray-400 ml-2">(per produk)</span>
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
                    <span className="text-xs text-gray-400">
                      Total Gaji: {formatRupiah(data.totalGaji)}
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
                  <span className="text-xs font-normal text-green-400 ml-2">(Dari Sistem / Readonly)</span>
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
                    <span className={`text-lg font-bold ${
                      (data.target.total - data.realisasi.total) >= 0
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

                {/* Info Produk */}
                <div className="pt-2 text-xs text-gray-400 border-t border-gray-100">
                  <div className="flex justify-between">
                    <span>Produk</span>
                    <span className="font-medium text-gray-600">{data.produk.nama} ({data.produk.sku})</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Qty Terjual</span>
                    <span className="font-medium text-gray-600">{data.qtyPenjualan}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Overhead</span>
                    <span className="font-medium text-gray-600">{formatRupiah(data.totalOverhead)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Gaji</span>
                    <span className="font-medium text-gray-600">{formatRupiah(data.totalGaji)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center text-gray-400">
            📭 Pilih produk dan bulan untuk melihat data costing
          </div>
        )}
      </div>
    </div>
  );
}