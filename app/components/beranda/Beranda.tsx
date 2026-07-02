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
  Line,
  ComposedChart,
} from 'recharts';

interface LaporanBulanan {
  bulan: string;
  items: Array<{
    id: string;
    menu: string;
    qtyProduksi: number;
    costPerPortion: number;
    jumlahCost: number;
    labaKotor: number;
    profit: number;
  }>;
  totalQty: number;
  totalCost: number;
  totalOverhead: number;
  totalLabaKotor: number;
  totalProfit: number;
}

const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(angka);
};

export default function Beranda() {
  const [data, setData] = useState<LaporanBulanan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState('2025');

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/laporan-bulanan');
      const result = await res.json();
      
      if (result.status === '✅ Berhasil!') {
        setData(result.data);
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

  // Data untuk grafik
  const chartData = data.map((item) => ({
    bulan: item.bulan, // Sudah string display dari API
    qty: item.totalQty,
    labaKotor: item.totalLabaKotor,
    profit: item.totalProfit,
    cost: item.totalCost,
    overhead: item.totalOverhead,
  }));

  // Data untuk grafik per menu (stacked)
  const menuChartData = data.map((item) => {
    const menuData: any = { bulan: item.bulan };
    item.items.forEach((menu) => {
      menuData[menu.menu] = menu.qtyProduksi;
    });
    return menuData;
  });

  // Warna untuk menu
  const menuColors: Record<string, string> = {
    'Nasi Gudeg Campur': '#3B82F6',
    'Ayam Bakar Bumbu Rujak': '#10B981',
    'Ayam Bakar Bumbu Kecap': '#F59E0B',
  };

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

  // Total keseluruhan
  const totalQty = data.reduce((sum, d) => sum + d.totalQty, 0);
  const totalProfit = data.reduce((sum, d) => sum + d.totalProfit, 0);
  const totalLabaKotor = data.reduce((sum, d) => sum + d.totalLabaKotor, 0);
  const totalCost = data.reduce((sum, d) => sum + d.totalCost, 0);
  const totalOverhead = data.reduce((sum, d) => sum + d.totalOverhead, 0);

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">📊 Laporan Tahunan {selectedYear}</h2>
          <p className="text-sm text-gray-400">Data penjualan & produksi per bulan</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          >
            <option value="2025">2025</option>
          </select>
        </div>
      </div>

      {/* 4 Cards Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-4 text-white">
          <p className="text-sm opacity-80">Total Laba Kotor</p>
          <p className="text-2xl font-bold">{formatRupiah(totalLabaKotor)}</p>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-4 text-white">
          <p className="text-sm opacity-80">Total Profit</p>
          <p className="text-2xl font-bold">{formatRupiah(totalProfit)}</p>
        </div>
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-4 text-white">
          <p className="text-sm opacity-80">Total Cost</p>
          <p className="text-2xl font-bold">{formatRupiah(totalCost)}</p>
        </div>
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-4 text-white">
          <p className="text-sm opacity-80">Total Overhead</p>
          <p className="text-2xl font-bold">{formatRupiah(totalOverhead)}</p>
          <p className="text-xs opacity-70 mt-1">{data.length} bulan</p>
        </div>
      </div>

      {/* Grafik 2: Laba Kotor vs Profit vs Cost */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          📊 Laba Kotor vs Profit vs Cost
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="bulan" tick={{ fontSize: 10, fill: '#888' }} />
            <YAxis tick={{ fontSize: 11, fill: '#888' }} tickFormatter={(v) => `Rp${(v/1000000).toFixed(0)}M`} />
            <Tooltip formatter={(value: any) => formatRupiah(value)} />
            <Legend />
            <Bar dataKey="labaKotor" fill="#10B981" name="Laba Kotor" radius={[4, 4, 0, 0]} />
            <Bar dataKey="profit" fill="#3B82F6" name="Profit" radius={[4, 4, 0, 0]} />
            <Bar dataKey="cost" fill="#aa1b4b" name="Cost" radius={[4, 4, 0, 0]} />
            <Bar dataKey="overhead" fill="#EF4444" name="Overhead" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Grafik 3: Produksi per Menu (Stacked) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          📊 Produksi per Menu (Stacked)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={menuChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="bulan" tick={{ fontSize: 10, fill: '#888' }} />
            <YAxis tick={{ fontSize: 11, fill: '#888' }} />
            <Tooltip />
            <Legend />
            {Object.keys(menuColors).map((menu) => (
              <Bar
                key={menu}
                dataKey={menu}
                stackId="stack"
                fill={menuColors[menu]}
                name={menu}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tabel Detail */}
      <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">📋 Detail Laporan Bulanan</h3>
        </div>
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase">Bulan</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase">Menu</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-400 uppercase">Qty</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-400 uppercase">Cost/Porsi</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-400 uppercase">Total Cost</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-400 uppercase">Laba Kotor</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-400 uppercase">Profit</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                item.items.map((menu, idx) => (
                  <tr key={`${item.bulan}-${menu.menu}`} className="border-b border-gray-50 hover:bg-gray-50/50">
                    {idx === 0 && (
                      <td className="px-3 py-2 font-medium text-gray-800" rowSpan={item.items.length}>
                        {item.bulan}
                      </td>
                    )}
                    <td className="px-3 py-2 text-gray-600">{menu.menu}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{menu.qtyProduksi.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right text-gray-600">{formatRupiah(menu.costPerPortion)}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{formatRupiah(menu.jumlahCost)}</td>
                    <td className="px-3 py-2 text-right text-green-600">{formatRupiah(menu.labaKotor)}</td>
                    <td className="px-3 py-2 text-right text-blue-600">{formatRupiah(menu.profit)}</td>
                  </tr>
                ))
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-400">
          Total {data.length} bulan · {data.reduce((sum, d) => sum + d.items.length, 0)} data menu
        </div>
      </div>
    </div>
  );
}