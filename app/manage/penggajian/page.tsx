// app/manage/penggajian/page.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';

interface Penggajian {
  id: string;
  nama: string;
  posisi: string;
  gaji: number;
  tanggal_penggajian: string;
}

const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(angka);
};

export default function PenggajianPage() {
  const [data, setData] = useState<Penggajian[]>([]);
  const [filteredData, setFilteredData] = useState<Penggajian[]>([]);
  const [filterMonth, setFilterMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [filterPosisi, setFilterPosisi] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [namaList, setNamaList] = useState<string[]>([]);
  const [posisiList] = useState<string[]>(['Kitchen', 'Seller']);
  const [namaSuggestions, setNamaSuggestions] = useState<string[]>([]);
  const [posisiSuggestions, setPosisiSuggestions] = useState<string[]>([]);
  const [showNamaSuggestions, setShowNamaSuggestions] = useState(false);
  const [showPosisiSuggestions, setShowPosisiSuggestions] = useState(false);
  const [selectedNamaIndex, setSelectedNamaIndex] = useState(-1);
  const [selectedPosisiIndex, setSelectedPosisiIndex] = useState(-1);
  
  const namaInputRef = useRef<HTMLInputElement>(null);
  const posisiInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    nama: '',
    posisi: '',
    gaji: '',
    tanggalPenggajian: new Date().toISOString().split('T')[0],
  });

  // ✅ LOAD DATA PERTAMA KALI SAJA
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/penggajian');
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const result = await res.json();
      
      if (result.status === '✅ Berhasil!') {
        setData(result.data);
        const uniqueNames = [...new Set(result.data.map((item: Penggajian) => item.nama))] as string[];
        setNamaList(uniqueNames);
        applyFilters(result.data, filterMonth, filterPosisi);
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

  const applyFilters = (dataSource: Penggajian[], month: string, posisi: string) => {
    let filtered = dataSource;

    if (month) {
      filtered = filtered.filter((item) => item.tanggal_penggajian.startsWith(month));
    }

    if (posisi !== 'all') {
      filtered = filtered.filter((item) => item.posisi === posisi);
    }

    setFilteredData(filtered);
  };

  const handleFilterChange = (month: string, posisi: string) => {
    setFilterMonth(month);
    setFilterPosisi(posisi);
    applyFilters(data, month, posisi);
  };

  // ============================================
  // AUTOCOMPLETE NAMA
  // ============================================
  const handleNamaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, nama: value });
    setSelectedNamaIndex(-1);
    
    if (value.length > 0) {
      const filtered = namaList.filter(name => 
        name.toLowerCase().includes(value.toLowerCase())
      );
      setNamaSuggestions(filtered);
      setShowNamaSuggestions(true);
    } else {
      setShowNamaSuggestions(false);
    }
  };

  const handleNamaKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedNamaIndex(prev => 
        prev < namaSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedNamaIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && selectedNamaIndex >= 0) {
      e.preventDefault();
      selectNama(namaSuggestions[selectedNamaIndex]);
    } else if (e.key === 'Escape') {
      setShowNamaSuggestions(false);
    }
  };

  const selectNama = (nama: string) => {
    setFormData({ ...formData, nama });
    setShowNamaSuggestions(false);
    setSelectedNamaIndex(-1);
    posisiInputRef.current?.focus();
  };

  // ============================================
  // AUTOCOMPLETE POSISI
  // ============================================
  const handlePosisiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, posisi: value });
    setSelectedPosisiIndex(-1);
    
    if (value.length > 0) {
      const filtered = posisiList.filter(p => 
        p.toLowerCase().includes(value.toLowerCase())
      );
      setPosisiSuggestions(filtered);
      setShowPosisiSuggestions(true);
    } else {
      setShowPosisiSuggestions(false);
    }
  };

  const handlePosisiKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedPosisiIndex(prev => 
        prev < posisiSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedPosisiIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && selectedPosisiIndex >= 0) {
      e.preventDefault();
      selectPosisi(posisiSuggestions[selectedPosisiIndex]);
    } else if (e.key === 'Escape') {
      setShowPosisiSuggestions(false);
    }
  };

  const selectPosisi = (posisi: string) => {
    setFormData({ ...formData, posisi });
    setShowPosisiSuggestions(false);
    setSelectedPosisiIndex(-1);
  };

  // ============================================
  // CRUD - OPTIMISTIC UPDATE
  // ============================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nama || !formData.posisi || !formData.gaji || !formData.tanggalPenggajian) {
      Swal.fire({
        icon: 'warning',
        title: 'Data tidak lengkap!',
        text: 'Semua field wajib diisi',
      });
      return;
    }

    setIsSubmitting(true);

    // 🔥 OPTIMISTIC: Tambah data ke state dulu
    const newData: Penggajian = {
      id: `temp-${Date.now()}`,
      nama: formData.nama,
      posisi: formData.posisi,
      gaji: Number(formData.gaji),
      tanggal_penggajian: formData.tanggalPenggajian,
    };

    setData(prev => [...prev, newData]);
    applyFilters([...data, newData], filterMonth, filterPosisi);
    
    setShowForm(false);
    setFormData({ nama: '', posisi: 'Kitchen', gaji: '', tanggalPenggajian: new Date().toISOString().split('T')[0] });

    try {
      const res = await fetch('/api/penggajian', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama: formData.nama,
          posisi: formData.posisi,
          gaji: Number(formData.gaji),
          tanggalPenggajian: formData.tanggalPenggajian,
        }),
      });
      
      const result = await res.json();
      
      if (result.status === '✅ Berhasil!') {
        // ✅ Ganti ID temp dengan ID asli dari DB
        setData(prev => prev.map(item => 
          item.id === newData.id ? { ...result.data, id: result.data.id } : item
        ));
        
        Swal.fire({
          icon: 'success',
          title: '✅ Berhasil!',
          text: 'Data gaji berhasil ditambahkan',
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        // ❌ Rollback jika gagal
        setData(prev => prev.filter(item => item.id !== newData.id));
        Swal.fire({
          icon: 'error',
          title: 'Gagal!',
          text: result.error || 'Gagal menyimpan data',
        });
      }
    } catch (error) {
      // ❌ Rollback jika error
      setData(prev => prev.filter(item => item.id !== newData.id));
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Terjadi kesalahan pada server',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, nama: string) => {
    const result = await Swal.fire({
      title: `Hapus data ${nama}?`,
      text: "Data akan dihapus permanen!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      // 🔥 OPTIMISTIC: Hapus dari state dulu
      const oldData = [...data];
      setData(prev => prev.filter(item => item.id !== id));
      applyFilters(data.filter(item => item.id !== id), filterMonth, filterPosisi);

      try {
        const res = await fetch(`/api/penggajian?id=${id}`, {
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
          // ❌ Rollback jika gagal
          setData(oldData);
          applyFilters(oldData, filterMonth, filterPosisi);
          Swal.fire({
            icon: 'error',
            title: 'Gagal!',
            text: 'Gagal menghapus data',
          });
        }
      } catch (error) {
        // ❌ Rollback jika error
        setData(oldData);
        applyFilters(oldData, filterMonth, filterPosisi);
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: 'Terjadi kesalahan',
        });
      }
    }
  };

  // Statistik
  const uniqueNames = [...new Set(filteredData.map(item => item.nama))];
  const uniqueKitchen = [...new Set(
    filteredData.filter(item => item.posisi === 'Kitchen').map(item => item.nama)
  )];
  const uniqueSeller = [...new Set(
    filteredData.filter(item => item.posisi === 'Seller').map(item => item.nama)
  )];

  const totalGaji = filteredData.reduce((sum, item) => sum + item.gaji, 0);
  const totalKitchen = filteredData
    .filter((item) => item.posisi === 'Kitchen')
    .reduce((sum, item) => sum + item.gaji, 0);
  const totalSeller = filteredData
    .filter((item) => item.posisi === 'Seller')
    .reduce((sum, item) => sum + item.gaji, 0);

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
            <h1 className="text-2xl font-bold text-gray-900">👨‍💼 Penggajian</h1>
            <p className="text-sm text-gray-500">Kelola data penggajian karyawan</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Gaji
          </button>
        </div>

        {/* Form Tambah */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Tambah Data Gaji</h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <input
                    ref={namaInputRef}
                    type="text"
                    placeholder="Nama"
                    value={formData.nama}
                    onChange={handleNamaChange}
                    onKeyDown={handleNamaKeyDown}
                    onFocus={() => {
                      if (formData.nama.length > 0) {
                        const filtered = namaList.filter(name => 
                          name.toLowerCase().includes(formData.nama.toLowerCase())
                        );
                        setNamaSuggestions(filtered);
                        setShowNamaSuggestions(true);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    required
                    autoComplete="off"
                  />
                  {showNamaSuggestions && namaSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto mt-1">
                      {namaSuggestions.map((name, index) => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => selectNama(name)}
                          onMouseEnter={() => setSelectedNamaIndex(index)}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-blue-50 text-gray-900 ${
                            index === selectedNamaIndex ? 'bg-blue-100' : ''
                          }`}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <input
                    ref={posisiInputRef}
                    type="text"
                    placeholder="Posisi (Kitchen/Seller)"
                    value={formData.posisi}
                    onChange={handlePosisiChange}
                    onKeyDown={handlePosisiKeyDown}
                    onFocus={() => {
                      if (formData.posisi.length > 0) {
                        const filtered = posisiList.filter(p => 
                          p.toLowerCase().includes(formData.posisi.toLowerCase())
                        );
                        setPosisiSuggestions(filtered);
                        setShowPosisiSuggestions(true);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    required
                    autoComplete="off"
                  />
                  {showPosisiSuggestions && posisiSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto mt-1">
                      {posisiSuggestions.map((posisi, index) => (
                        <button
                          key={posisi}
                          type="button"
                          onClick={() => selectPosisi(posisi)}
                          onMouseEnter={() => setSelectedPosisiIndex(index)}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-blue-50 text-gray-900 ${
                            index === selectedPosisiIndex ? 'bg-blue-100' : ''
                          }`}
                        >
                          {posisi}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <input
                  type="number"
                  placeholder="Gaji"
                  value={formData.gaji}
                  onChange={(e) => setFormData({ ...formData, gaji: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                />
                <input
                  type="date"
                  value={formData.tanggalPenggajian}
                  onChange={(e) => setFormData({ ...formData, tanggalPenggajian: e.target.value })}
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
            onChange={(e) => handleFilterChange(e.target.value, filterPosisi)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white cursor-pointer min-w-[180px]"
          />
          
          <select
            value={filterPosisi}
            onChange={(e) => handleFilterChange(filterMonth, e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white min-w-[150px]"
          >
            <option value="all">📋 Semua Posisi</option>
            <option value="Kitchen">🍳 Kitchen</option>
            <option value="Seller">🛒 Seller</option>
          </select>
          
          <span className="text-xs text-gray-400 ml-auto">
            📊 {filteredData.length} data
          </span>
        </div>

        {/* Statistik */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-4 text-white">
            <p className="text-sm opacity-80">Total Penggajian</p>
            <p className="text-2xl font-bold">{formatRupiah(totalGaji)}</p>
            <p className="text-xs opacity-70 mt-1">{uniqueNames.length} karyawan</p>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-4 text-white">
            <p className="text-sm opacity-80">Total Kitchen</p>
            <p className="text-2xl font-bold">{formatRupiah(totalKitchen)}</p>
            <p className="text-xs opacity-70 mt-1">{uniqueKitchen.length} karyawan</p>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-4 text-white">
            <p className="text-sm opacity-80">Total Seller</p>
            <p className="text-2xl font-bold">{formatRupiah(totalSeller)}</p>
            <p className="text-xs opacity-70 mt-1">{uniqueSeller.length} karyawan</p>
          </div>
        </div>

        {/* Tabel */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Nama</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Posisi</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Gaji</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Tanggal</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-400 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                      📭 Tidak ada data untuk filter ini
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-4 py-2 font-medium text-gray-900">{item.nama}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs ${
                            item.posisi === 'Kitchen'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-purple-100 text-purple-700'
                          }`}
                        >
                          {item.posisi}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-gray-900">{formatRupiah(item.gaji)}</td>
                      <td className="px-4 py-2 text-gray-500">
                        {new Date(item.tanggal_penggajian).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => handleDelete(item.id, item.nama)}
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