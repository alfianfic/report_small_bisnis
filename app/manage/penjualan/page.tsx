// app/manage/penjualan/page.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import FilterBar from '@/app/components/ui/FilterBar';

interface Penjualan {
  id: string;
  tanggal: string;
  produk: string;
  qty: number;
  hargaJual: number;
  hpp: number;
  profit: number;
}

const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(angka);
};

export default function PenjualanPage() {
  const [data, setData] = useState<Penjualan[]>([]);
  const [filteredData, setFilteredData] = useState<Penjualan[]>([]);
  const [filterMonth, setFilterMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [filterProduk, setFilterProduk] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [produkList, setProdukList] = useState<string[]>([]);
  const [produkSuggestions, setProdukSuggestions] = useState<string[]>([]);
  const [showProdukSuggestions, setShowProdukSuggestions] = useState(false);
  const [selectedProdukIndex, setSelectedProdukIndex] = useState(-1);
  
  const produkInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    produk: '',
    qty: '',
    tanggal: new Date().toISOString().split('T')[0],
    hargaJual: '',
    hpp: '',
  });

  // ✅ LOAD DATA
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/penjualan');
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const result = await res.json();
      
      if (result.status === '✅ Berhasil!') {
        // Transform data
        const transformed = result.data.map((item: any) => ({
          id: item.id,
          tanggal: item.tanggal,
          produk: item.produk.nama || item.produk,
          qty: item.qty,
          hargaJual: item.hargaJual,
          hpp: item.hpp,
          profit: item.profit,
        }));
        setData(transformed);
        
        const uniqueProduk = [...new Set(transformed.map((item: Penjualan) => item.produk))] as string[];
        setProdukList(uniqueProduk);
        applyFilters(transformed, filterMonth, filterProduk);
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
    fetchData();
  }, []);

  const applyFilters = (dataSource: Penjualan[], month: string, produk: string) => {
    let filtered = dataSource;

    if (month) {
      filtered = filtered.filter((item) => item.tanggal.startsWith(month));
    }

    if (produk !== 'all') {
      filtered = filtered.filter((item) => item.produk === produk);
    }

    setFilteredData(filtered);
  };

  const handleFilterChange = (month: string, produk: string) => {
    setFilterMonth(month);
    setFilterProduk(produk);
    applyFilters(data, month, produk);
  };

  // ============================================
  // AUTOCOMPLETE PRODUK
  // ============================================
  const handleProdukChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, produk: value });
    setSelectedProdukIndex(-1);
    
    if (value.length > 0) {
      const filtered = produkList.filter(p => 
        p.toLowerCase().includes(value.toLowerCase())
      );
      setProdukSuggestions(filtered);
      setShowProdukSuggestions(true);
    } else {
      setShowProdukSuggestions(false);
    }
  };

  const handleProdukKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedProdukIndex(prev => 
        prev < produkSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedProdukIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && selectedProdukIndex >= 0) {
      e.preventDefault();
      selectProduk(produkSuggestions[selectedProdukIndex]);
    } else if (e.key === 'Escape') {
      setShowProdukSuggestions(false);
    }
  };

  const selectProduk = (produk: string) => {
    setFormData({ ...formData, produk });
    setShowProdukSuggestions(false);
    setSelectedProdukIndex(-1);
  };

  // ============================================
  // CRUD - OPTIMISTIC UPDATE
  // ============================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.produk || !formData.qty || !formData.tanggal) {
      Swal.fire({
        icon: 'warning',
        title: 'Data tidak lengkap!',
        text: 'Produk, Qty, dan Tanggal wajib diisi',
      });
      return;
    }

    const qtyNum = Number(formData.qty);
    const hargaJualNum = Number(formData.hargaJual) || 23000;
    const hppNum = Number(formData.hpp) || 15000;

    if (isNaN(qtyNum) || qtyNum <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Qty tidak valid!',
        text: 'Qty harus lebih dari 0',
      });
      return;
    }

    setIsSubmitting(true);

    const profit = (hargaJualNum - hppNum) * qtyNum;

    const newData: Penjualan = {
      id: `temp-${Date.now()}`,
      tanggal: formData.tanggal,
      produk: formData.produk,
      qty: qtyNum,
      hargaJual: hargaJualNum,
      hpp: hppNum,
      profit: profit,
    };

    setData(prev => [...prev, newData]);
    applyFilters([...data, newData], filterMonth, filterProduk);
    
    setShowForm(false);
    setFormData({ produk: '', qty: '', tanggal: new Date().toISOString().split('T')[0], hargaJual: '', hpp: '' });

    try {
      // 🔥 Cari produk ID dulu
      const produkRes = await fetch('/api/products');
      const produkResult = await produkRes.json();
      const produkMap = produkResult.data.reduce((acc: any, p: any) => {
        acc[p.nama] = p.id;
        return acc;
      }, {});

      const produkId = produkMap[formData.produk];
      if (!produkId) {
        throw new Error('Produk tidak ditemukan');
      }

      const res = await fetch('/api/penjualan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tanggal: formData.tanggal,
          produkId: produkId,
          qty: qtyNum,
          hargaJual: hargaJualNum,
          hpp: hppNum,
          profit: profit,
        }),
      });
      
      const result = await res.json();
      
      if (result.status === '✅ Berhasil!') {
        setData(prev => prev.map(item => 
          item.id === newData.id ? { ...result.data, produk: formData.produk } : item
        ));
        
        Swal.fire({
          icon: 'success',
          title: '✅ Berhasil!',
          text: 'Data penjualan berhasil ditambahkan',
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        setData(prev => prev.filter(item => item.id !== newData.id));
        Swal.fire({
          icon: 'error',
          title: 'Gagal!',
          text: result.error || 'Gagal menyimpan data',
        });
      }
    } catch (error: any) {
      setData(prev => prev.filter(item => item.id !== newData.id));
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: error.message || 'Terjadi kesalahan pada server',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, produk: string) => {
    const result = await Swal.fire({
      title: `Hapus data ${produk}?`,
      text: "Data akan dihapus permanen!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      const oldData = [...data];
      setData(prev => prev.filter(item => item.id !== id));
      applyFilters(data.filter(item => item.id !== id), filterMonth, filterProduk);

      try {
        const res = await fetch(`/api/penjualan/${id}`, {
          method: 'DELETE',
        });
        const result = await res.json();
        
        if (result.status === '✅ Berhasil!') {
          Swal.fire({
            icon: 'success',
            title: '✅ Berhasil!',
            text: 'Data berhasil dihapus',
            timer: 1500,
            showConfirmButton: false,
          });
        } else {
          setData(oldData);
          applyFilters(oldData, filterMonth, filterProduk);
          Swal.fire({
            icon: 'error',
            title: 'Gagal!',
            text: 'Gagal menghapus data',
          });
        }
      } catch (error) {
        setData(oldData);
        applyFilters(oldData, filterMonth, filterProduk);
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: 'Terjadi kesalahan',
        });
      }
    }
  };

  // Statistik
  const totalQty = filteredData.reduce((sum, item) => sum + item.qty, 0);
  const totalProfit = filteredData.reduce((sum, item) => sum + item.profit, 0);
  const totalRevenue = filteredData.reduce((sum, item) => sum + (item.qty * item.hargaJual), 0);
  const uniqueProduk = [...new Set(filteredData.map(item => item.produk))];

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
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">💰 Management Penjualan</h1>
            <p className="text-sm text-gray-500">Kelola data penjualan harian</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Penjualan
          </button>
        </div>

        {/* Form Tambah */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Tambah Data Penjualan</h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <input
                    ref={produkInputRef}
                    type="text"
                    placeholder="Produk"
                    value={formData.produk}
                    onChange={handleProdukChange}
                    onKeyDown={handleProdukKeyDown}
                    onFocus={() => {
                      if (formData.produk.length > 0) {
                        const filtered = produkList.filter(p => 
                          p.toLowerCase().includes(formData.produk.toLowerCase())
                        );
                        setProdukSuggestions(filtered);
                        setShowProdukSuggestions(true);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    required
                    autoComplete="off"
                  />
                  {showProdukSuggestions && produkSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto mt-1">
                      {produkSuggestions.map((name, index) => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => selectProduk(name)}
                          onMouseEnter={() => setSelectedProdukIndex(index)}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-blue-50 text-gray-900 ${
                            index === selectedProdukIndex ? 'bg-blue-100' : ''
                          }`}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <input
                  type="number"
                  placeholder="Qty"
                  value={formData.qty}
                  onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                />

                <input
                  type="number"
                  placeholder="Harga Jual (opsional)"
                  value={formData.hargaJual}
                  onChange={(e) => setFormData({ ...formData, hargaJual: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />

                <input
                  type="date"
                  value={formData.tanggal}
                  onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                />
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? '⏳ Menyimpan...' : 'Simpan'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
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
            onChange={(e) => handleFilterChange(e.target.value, filterProduk)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white cursor-pointer min-w-[180px]"
          />
          
          <select
            value={filterProduk}
            onChange={(e) => handleFilterChange(filterMonth, e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white min-w-[150px]"
          >
            <option value="all">📋 Semua Produk</option>
            {produkList.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          
          <span className="text-xs text-gray-400 ml-auto">
            📊 {filteredData.length} data
          </span>
        </div>

        {/* Statistik */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-4 text-white">
            <p className="text-sm opacity-80">Total Qty</p>
            <p className="text-2xl font-bold">{totalQty}</p>
            <p className="text-xs opacity-70 mt-1">{uniqueProduk.length} produk</p>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-4 text-white">
            <p className="text-sm opacity-80">Total Revenue</p>
            <p className="text-2xl font-bold">{formatRupiah(totalRevenue)}</p>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-4 text-white">
            <p className="text-sm opacity-80">Total Profit</p>
            <p className="text-2xl font-bold">{formatRupiah(totalProfit)}</p>
          </div>
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-4 text-white">
            <p className="text-sm opacity-80">Rata-rata Qty/Hari</p>
            <p className="text-2xl font-bold">
              {filteredData.length > 0 ? (totalQty / filteredData.length).toFixed(1) : 0}
            </p>
          </div>
        </div>

        {/* Tabel */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Tanggal</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Produk</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase">Qty</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase">Harga Jual</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase">HPP</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase">Profit</th>
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
                      <td className="px-4 py-2 font-medium text-gray-900">{item.produk}</td>
                      <td className="px-4 py-2 text-right text-gray-700">{item.qty}</td>
                      <td className="px-4 py-2 text-right text-gray-600">{formatRupiah(item.hargaJual)}</td>
                      <td className="px-4 py-2 text-right text-gray-500">{formatRupiah(item.hpp)}</td>
                      <td className="px-4 py-2 text-right text-green-600">{formatRupiah(item.profit)}</td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => handleDelete(item.id, item.produk)}
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
            Total {filteredData.length} data
          </div>
        </div>
      </div>
    </div>
  );
}