// app/components/beranda/Beranda.tsx

'use client';

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface Product {
  id: string;
  name: string;
  sku: string;
}

interface SalesData {
  id: string;
  productId: string;
  productName?: string;
  tanggal: string;
  terjual: number;
  sisa: number;
  stokAwal: number;
  status: string;
  perluBelanja: boolean;
  hppPerPorsi: number;
  hargaJualPerPorsi: number;
  labaPerPorsi: number;
  targetHarian: number;
  thresholdBelanja: number;
}

interface BelanjaData {
  id: string;
  productId: string;
  productName?: string;
  tanggal: string;
  jumlah: number;
  total: number | null;
  totalSystem: number | null;
  hppPerPorsi: number;
  keterangan: string | null;
}

const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(angka);
};

export default function Beranda() {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data mentah dari API
  const [products, setProducts] = useState<Product[]>([]);
  const [allSales, setAllSales] = useState<SalesData[]>([]);
  const [allBelanja, setAllBelanja] = useState<BelanjaData[]>([]);

  // Data hasil filter
  const [filteredSales, setFilteredSales] = useState<SalesData[]>([]);
  const [filteredBelanja, setFilteredBelanja] = useState<BelanjaData[]>([]);

  // Fetch semua data
  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch products
      const productRes = await fetch('/api/products');
      const productResult = await productRes.json();
      
      let productList: Product[] = [];
      if (productResult.status === '✅ Berhasil!') {
        productList = productResult.data;
        setProducts(productList);
      }

      // 2. Fetch semua penjualan dari semua product
      const salesPromises = productList.map(async (p: Product) => {
        const res = await fetch(`/api/penjualan?productId=${p.id}`);
        const result = await res.json();
        if (result.status === '✅ Berhasil!') {
          return (result.data.realisasi || []).map((s: any) => ({
            ...s,
            productId: p.id,
            productName: p.name,
          }));
        }
        return [];
      });

      const allSalesResults = await Promise.all(salesPromises);
      const flatSales = allSalesResults.flat();
      setAllSales(flatSales);

      // 3. Fetch semua pembelian dari semua product
      const belanjaPromises = productList.map(async (p: Product) => {
        const res = await fetch(`/api/pembelian?productId=${p.id}`);
        const result = await res.json();
        if (result.status === '✅ Berhasil!') {
          return (result.data || []).map((b: any) => ({
            ...b,
            productId: p.id,
            productName: p.name,
          }));
        }
        return [];
      });

      const allBelanjaResults = await Promise.all(belanjaPromises);
      const flatBelanja = allBelanjaResults.flat();
      setAllBelanja(flatBelanja);

      // Set default filter (bulan ini)
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(lastDay.toISOString().split('T')[0]);

    } catch (err) {
      setError('Gagal mengambil data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Filter data berdasarkan tanggal
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const filteredSales = allSales.filter(s => {
        const date = new Date(s.tanggal);
        return date >= start && date <= end;
      });
      setFilteredSales(filteredSales);

      const filteredBelanja = allBelanja.filter(b => {
        const date = new Date(b.tanggal);
        return date >= start && date <= end;
      });
      setFilteredBelanja(filteredBelanja);
    }
  }, [startDate, endDate, allSales, allBelanja]);

  // ========================================
  // KALKULASI METRICS
  // ========================================
  
  // Total Profit
  const totalProfit = filteredSales.reduce((sum, s) => {
    return sum + (s.terjual * s.labaPerPorsi);
  }, 0);

  // Total Penjualan (pendapatan)
  const totalPenjualan = filteredSales.reduce((sum, s) => {
    return sum + (s.terjual * s.hargaJualPerPorsi);
  }, 0);

  // Total Product Terjual
  const totalTerjual = filteredSales.reduce((sum, s) => sum + s.terjual, 0);

  // Total Pengeluaran (belanja)
  const totalPengeluaran = filteredBelanja.reduce((sum, b) => {
    return sum + (b.total || b.totalSystem || 0);
  }, 0);

  // ========================================
  // DATA GRAFIK
  // ========================================

  // Grafik 1: Penjualan vs Pengeluaran (harian)
  const chartData1 = filteredSales.reduce((acc: any[], sale) => {
    const date = sale.tanggal.split('T')[0];
    const existing = acc.find(item => item.tanggal === date);
    
    const pendapatan = sale.terjual * sale.hargaJualPerPorsi;
    const belanjaHari = filteredBelanja
      .filter(b => b.tanggal.split('T')[0] === date)
      .reduce((sum, b) => sum + (b.total || b.totalSystem || 0), 0);
    
    if (existing) {
      existing.penjualan += pendapatan;
      existing.pengeluaran += belanjaHari;
    } else {
      acc.push({
        tanggal: date,
        penjualan: pendapatan,
        pengeluaran: belanjaHari,
        label: new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      });
    }
    return acc;
  }, []).sort((a, b) => a.tanggal.localeCompare(b.tanggal));

  // Grafik 2: Penjualan Harian per Product
  const chartData2 = filteredSales.reduce((acc: any[], sale) => {
    const date = sale.tanggal.split('T')[0];
    const existing = acc.find(item => item.tanggal === date);
    
    if (existing) {
      const productKey = `product_${sale.productId}`;
      existing[productKey] = (existing[productKey] || 0) + sale.terjual;
    } else {
      const newEntry: any = {
        tanggal: date,
        label: new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      };
      products.forEach(p => {
        newEntry[`product_${p.id}`] = 0;
      });
      newEntry[`product_${sale.productId}`] = sale.terjual;
      acc.push(newEntry);
    }
    return acc;
  }, []).sort((a, b) => a.tanggal.localeCompare(b.tanggal));

  // Warna untuk masing-masing product
  const productColors: Record<string, string> = {
    [products[0]?.id || '']: '#3B82F6',
    [products[1]?.id || '']: '#10B981',
    [products[2]?.id || '']: '#F59E0B',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data...</p>
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
            onClick={fetchAllData}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  // Cek apakah ada data
  const hasData = filteredSales.length > 0 || filteredBelanja.length > 0;

  if (!hasData) {
    return (
      <div className="w-full max-w-7xl mx-auto">
        {/* Filter Date Range */}
        <div className="flex justify-end items-center gap-4 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <span className="text-sm text-gray-500">📅 Filter Tanggal:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
          <span className="text-gray-400">—</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
        </div>

        <div className="flex items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="text-center">
            <p className="text-gray-400 text-lg">📭 Belum ada data</p>
            <p className="text-sm text-gray-300 mt-1">Silakan input penjualan atau pembelian terlebih dahulu</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Filter Date Range */}
      <div className="flex justify-end items-center gap-4 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <span className="text-sm text-gray-500">📅 Filter Tanggal:</span>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
        />
        <span className="text-gray-400">—</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
        />
        <span className="text-xs text-gray-400 ml-2">
          {filteredSales.length} transaksi
        </span>
      </div>

      {/* 4 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6">
          <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">Total Profit</p>
          <p className="text-2xl font-bold text-gray-800 mt-2">{formatRupiah(totalProfit)}</p>
          <p className="text-sm text-gray-500 mt-1">Laba bersih periode ini</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-6">
          <p className="text-xs font-medium text-green-600 uppercase tracking-wider">Total Penjualan</p>
          <p className="text-2xl font-bold text-gray-800 mt-2">{formatRupiah(totalPenjualan)}</p>
          <p className="text-sm text-gray-500 mt-1">Pendapatan kotor</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6">
          <p className="text-xs font-medium text-orange-600 uppercase tracking-wider">Total Product Terjual</p>
          <p className="text-2xl font-bold text-gray-800 mt-2">{totalTerjual} porsi</p>
          <p className="text-sm text-gray-500 mt-1">Unit terjual keseluruhan</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-6">
          <p className="text-xs font-medium text-red-600 uppercase tracking-wider">Total Pengeluaran</p>
          <p className="text-2xl font-bold text-gray-800 mt-2">{formatRupiah(totalPengeluaran)}</p>
          <p className="text-sm text-gray-500 mt-1">Total belanja stok</p>
        </div>
      </div>

      {/* 2 Grafik */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grafik 1: Penjualan vs Pengeluaran */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            📊 Perbandingan Penjualan vs Pengeluaran
          </h3>
          {chartData1.length === 0 ? (
            <div className="flex items-center justify-center h-[300px] text-gray-400">
              Tidak ada data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData1}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#888' }} />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#888' }}
                  tickFormatter={(value) => `Rp${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip 
                  formatter={(value: any) => formatRupiah(value)}
                  labelFormatter={(label) => `Tanggal: ${label}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="penjualan" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  name="Penjualan"
                  dot={{ r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="pengeluaran" 
                  stroke="#EF4444" 
                  strokeWidth={2}
                  name="Pengeluaran"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Grafik 2: Penjualan per Product */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            📈 Penjualan Harian per Product
          </h3>
          {chartData2.length === 0 ? (
            <div className="flex items-center justify-center h-[300px] text-gray-400">
              Tidak ada data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#888' }} />
                <YAxis tick={{ fontSize: 11, fill: '#888' }} />
                <Tooltip />
                <Legend />
                {products.map((p) => (
                  <Line
                    key={p.id}
                    type="monotone"
                    dataKey={`product_${p.id}`}
                    stroke={productColors[p.id] || '#888'}
                    strokeWidth={2}
                    name={p.name}
                    dot={{ r: 3 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Info tambahan */}
      <div className="mt-6 text-center text-xs text-gray-400">
        Data {filteredSales.length} transaksi penjualan & {filteredBelanja.length} transaksi pembelian
      </div>
    </div>
  );
}