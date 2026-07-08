// app/components/beranda/Beranda.tsx

'use client';

import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface LaporanBulanan {
  id: string;
  bulan: string;
  bulanKey: string;
  qtyProduksi: number;
  costPerPortion: number;
  jumlahCost: number;
  overhead: number;
  gaji: number;
  labaKotor: number;
  profit: number;
}

interface PenjualanItem {
  id: string;
  tanggal: string;
  produkId: string;
  qty: number;
  hargaJual: number;
  hpp: number;
  profit: number;
  produk: {
    id: string;
    nama: string;
    sku: string;
    hpp: number;
    hargaJual: number;
  };
}

const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(angka);
};

export default function Beranda() {
  // ========== SEMUA HOOKS DIATAS ==========
  const [data, setData] = useState<LaporanBulanan[]>([]);
  const [filteredData, setFilteredData] = useState<LaporanBulanan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState('2026');
  const [availableYears, setAvailableYears] = useState<string[]>(['2026']);
  
  // HOOKS UNTUK PENJUALAN
  const [dataPenjualan, setDataPenjualan] = useState<PenjualanItem[]>([]);
  const [chartMode, setChartMode] = useState<'stacked' | 'grouped'>('stacked');
  
  // Warna untuk setiap produk
  const PRODUK_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  // ========== FUNGSI-FUNGSI ==========
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/laporan-bulanan');
      const result = await res.json();
      
      if (result.status === '✅ Berhasil!') {
        setData(result.data);
        
        const years = result.data.map((item: LaporanBulanan) => {
          return item.bulanKey.split('-')[0];
        });
        
        const uniqueYears = [...new Set(years)] as string[];
        uniqueYears.sort();
        
        if (uniqueYears.length > 0) {
          setAvailableYears(uniqueYears);
          if (!uniqueYears.includes(selectedYear)) {
            setSelectedYear(uniqueYears[0]);
          }
        }
      } else {
        throw new Error(result.error || 'Gagal mengambil data');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPenjualan = async () => {
    try {
      const res = await fetch('/api/penjualan');
      const result = await res.json();
      if (result.status === '✅ Berhasil!') {
        setDataPenjualan(result.data);
      }
    } catch (error) {
      console.error('Error fetching penjualan:', error);
    }
  };

  // Proses data untuk grafik penjualan per menu
  const getPenjualanPerMenu = () => {
    const grouped: any = {};
    
    const filteredPenjualan = dataPenjualan.filter((item: PenjualanItem) => {
      const year = new Date(item.tanggal).getFullYear().toString();
      return year === selectedYear;
    });
    
    filteredPenjualan.forEach((item: PenjualanItem) => {
      const bulan = new Date(item.tanggal).toLocaleString('id-ID', { month: 'short' });
      const key = bulan;
      const produkNama = item.produk.nama;
      
      if (!grouped[key]) grouped[key] = { bulan: key };
      if (!grouped[key][produkNama]) grouped[key][produkNama] = 0;
      grouped[key][produkNama] += item.qty;
    });
    
    const bulanOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return Object.values(grouped).sort((a: any, b: any) => {
      return bulanOrder.indexOf(a.bulan) - bulanOrder.indexOf(b.bulan);
    });
  };

  const getProdukList = (): string[] => {
    const produkSet = new Set<string>();
    const filteredPenjualan = dataPenjualan.filter((item: PenjualanItem) => {
      const year = new Date(item.tanggal).getFullYear().toString();
      return year === selectedYear;
    });
    
    filteredPenjualan.forEach((item: PenjualanItem) => {
      produkSet.add(item.produk.nama);
    });
    return Array.from(produkSet);
  };

  // ========== useEffect ==========
  useEffect(() => {
    fetchData();
    fetchPenjualan();
  }, []);

  useEffect(() => {
    const filtered = data.filter(item => {
      const year = item.bulanKey.split('-')[0];
      return year === selectedYear;
    });
    setFilteredData(filtered);
  }, [data, selectedYear]);

  // ========== CONDITIONAL RENDERING (SETELAH HOOKS) ==========
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data laporan...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center text-red-600">
          <p>❌ {error}</p>
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

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="text-center">
          <p className="text-gray-400 text-lg">📭 Belum ada data laporan</p>
          <p className="text-sm text-gray-300 mt-1">Silakan seed data laporan bulanan terlebih dahulu</p>
        </div>
      </div>
    );
  }

  // ========== RENDER MAIN ==========
  const totalQty = filteredData.reduce((sum, d) => sum + (d.qtyProduksi || 0), 0);
  const totalProfit = filteredData.reduce((sum, d) => sum + (d.profit || 0), 0);
  const totalLabaKotor = filteredData.reduce((sum, d) => sum + (d.labaKotor || 0), 0);
  const totalCost = filteredData.reduce((sum, d) => sum + (d.jumlahCost || 0), 0);
  const totalOverhead = filteredData.reduce((sum, d) => sum + (d.overhead || 0), 0);
  const totalGaji = filteredData.reduce((sum, d) => sum + (d.gaji || 0), 0);
  const totalBulan = filteredData.length;

  // Data untuk grafik Laba Kotor vs Profit vs Cost
  const chartData = filteredData.map((d) => ({
    bulan: d.bulan.trim(), 
    labaKotor: d.labaKotor || 0,
    cost: d.jumlahCost || 0,
    overhead: d.overhead || 0,
    gaji: d.gaji || 0,
    profit: d.profit || 0,
  }));

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">📊 Laporan Tahunan {selectedYear}</h2>
          <p className="text-sm text-gray-400">
            {totalBulan} bulan data
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Tahun:</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 5 Cards Summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-4 text-white">
          <p className="text-sm opacity-80">Total Laba Kotor</p>
          <p className="text-2xl font-bold">{formatRupiah(totalLabaKotor)}</p>
          <p className="text-xs opacity-70 mt-1">{totalBulan} bulan</p>
        </div>
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-4 text-white">
          <p className="text-sm opacity-80">Total Cost</p>
          <p className="text-2xl font-bold">{formatRupiah(totalCost)}</p>
          <p className="text-xs opacity-70 mt-1">{totalBulan} bulan</p>
        </div>
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-4 text-white">
          <p className="text-sm opacity-80">Total Overhead</p>
          <p className="text-2xl font-bold">{formatRupiah(totalOverhead)}</p>
          <p className="text-xs opacity-70 mt-1">{totalBulan} bulan</p>
        </div>
        <div className="bg-gradient-to-r from-pink-500 to-pink-600 rounded-2xl p-4 text-white">
          <p className="text-sm opacity-80">Total Gaji</p>
          <p className="text-2xl font-bold">{formatRupiah(totalGaji)}</p>
          <p className="text-xs opacity-70 mt-1">{totalBulan} bulan</p>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-4 text-white">
          <p className="text-sm opacity-80">Total Profit</p>
          <p className="text-2xl font-bold">{formatRupiah(totalProfit)}</p>
          <p className="text-xs opacity-70 mt-1">{totalBulan} bulan</p>
        </div>
      </div>

      {/* ===== GRAFIK PENJUALAN PER MENU ===== */}
      {dataPenjualan.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-gray-700">
              📈 Penjualan per Menu ({selectedYear})
            </h3>
            <div className="flex items-center gap-3">
              {/* Toggle Stacked/Grouped */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => setChartMode('stacked')}
                  className={`px-2 py-1 text-xs rounded ${
                    chartMode === 'stacked' 
                      ? 'bg-blue-500 text-white' 
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Stacked
                </button>
                <button
                  onClick={() => setChartMode('grouped')}
                  className={`px-2 py-1 text-xs rounded ${
                    chartMode === 'grouped' 
                      ? 'bg-blue-500 text-white' 
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Grouped
                </button>
              </div>
              <span className="text-xs text-gray-400">
                {getPenjualanPerMenu().length} bulan
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-3 text-xs">
            {getProdukList().map((produk: string, index: number) => {
              const totalQtyProduk = dataPenjualan
                .filter((item: PenjualanItem) => {
                  const year = new Date(item.tanggal).getFullYear().toString();
                  return item.produk.nama === produk && year === selectedYear;
                })
                .reduce((sum: number, item: PenjualanItem) => sum + item.qty, 0);
              
              return (
                <div key={index} className="flex items-center gap-1.5">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: PRODUK_COLORS[index % PRODUK_COLORS.length] }}
                  />
                  <span className="text-gray-600">{produk}</span>
                  <span className="text-gray-400">({totalQtyProduk} porsi)</span>
                </div>
              );
            })}
          </div>

          {getPenjualanPerMenu().length === 0 ? (
            <div className="flex items-center justify-center h-[250px] text-gray-400">
              <p>📭 Belum ada data penjualan untuk tahun {selectedYear}</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={getPenjualanPerMenu()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: '#888' }} />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#888' }} 
                  tickFormatter={(v) => v.toLocaleString()}
                />
                <Tooltip 
                  formatter={(value: any) => `${value} porsi`}
                  labelFormatter={(label: any) => `Bulan: ${label}`}
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: 'none', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
                  }}
                />
                <Legend />
                {getProdukList().map((produk: string, index: number) => (
                  <Bar
                    key={index}
                    dataKey={produk}
                    fill={PRODUK_COLORS[index % PRODUK_COLORS.length]}
                    name={produk}
                    radius={[4, 4, 0, 0]}
                    stackId={chartMode === 'stacked' ? 'stack' : undefined}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* ===== GRAFIK LABA KOTOR VS PROFIT VS COST ===== */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          📊 Laba Kotor vs Profit vs Cost vs Overhead vs Gaji ({selectedYear})
        </h3>
        {filteredData.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-gray-400">
            <p>Tidak ada data untuk tahun {selectedYear}</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="bulan" tick={{ fontSize: 10, fill: '#888' }} />
              <YAxis tick={{ fontSize: 11, fill: '#888' }} tickFormatter={(v) => `Rp${(v/1000000).toFixed(0)}M`} />
              <Tooltip formatter={(value: any) => formatRupiah(value)} />
              <Legend />
              <Bar dataKey="labaKotor" fill="#10B981" name="Laba Kotor" radius={[4, 4, 0, 0]} />
              <Bar dataKey="cost" fill="#aa1b4b" name="Cost" radius={[4, 4, 0, 0]} />
              <Bar dataKey="overhead" fill="#EF4444" name="Overhead" radius={[4, 4, 0, 0]} />
              <Bar dataKey="gaji" fill="#EC4899" name="Gaji" radius={[4, 4, 0, 0]} />
              <Bar dataKey="profit" fill="#3B82F6" name="Profit" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ===== TABEL DETAIL ===== */}
      <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-gray-700">📋 Detail Laporan Bulanan</h3>
          <span className="text-xs text-gray-400">{totalBulan} bulan</span>
        </div>
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase">Bulan</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-400 uppercase">Qty Produksi</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-400 uppercase">Total Cost</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-400 uppercase">Overhead</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-400 uppercase">Gaji</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-400 uppercase">Laba Kotor</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-400 uppercase">Profit</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-gray-400">
                    📭 Tidak ada data untuk tahun {selectedYear}
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-3 py-2 font-medium text-gray-800">{item.bulan.trim()}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{item.qtyProduksi.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{formatRupiah(item.jumlahCost)}</td>
                    <td className="px-3 py-2 text-right text-orange-600">{formatRupiah(item.overhead)}</td>
                    <td className="px-3 py-2 text-right text-pink-600">{formatRupiah(item.gaji)}</td>
                    <td className="px-3 py-2 text-right text-green-600">{formatRupiah(item.labaKotor)}</td>
                    <td className="px-3 py-2 text-right text-blue-600">{formatRupiah(item.profit)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-400 flex justify-between">
          <span>Total {totalBulan} bulan</span>
          <span>Total Quantity: {formatRupiah(totalQty)}</span>
        </div>
      </div>
    </div>
  );
}