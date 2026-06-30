// app/manage/penjualan/page.tsx

'use client';

import { useState, useEffect } from 'react';
import PenjualanTable from '@/app/components/manage/PenjualanTable';
import PenjualanForm from '@/app/components/manage/PenjualanForm';
import FilterBar from '@/app/components/ui/FilterBar';

interface PenjualanData {
  id: string;
  tanggal: string;
  hariNama: string;
  terjual: number;
  sisa: number;
  stokAwal: number;
  status: string;
  perluBelanja: boolean;
}

interface MasterData {
  id: string;
  hppPerPorsi: number;
  hargaJualPerPorsi: number;
  labaPerPorsi: number;
  targetHarian: number;
}

export default function ManagePenjualan() {
  const [data, setData] = useState<PenjualanData[]>([]);
  const [master, setMaster] = useState<MasterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filteredData, setFilteredData] = useState<PenjualanData[]>([]);
  const [currentWeek, setCurrentWeek] = useState(0);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingData, setEditingData] = useState<{ tanggal: string; terjual: number } | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Fetching data from /api/penjualan...');
      
      const res = await fetch('/api/penjualan');
      console.log('📡 Response status:', res.status);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const result = await res.json();
      console.log('📦 Response data:', result);
      
      if (result.status === '✅ Berhasil!' && result.data) {
        const masterData = result.data;
        setMaster({
          id: masterData.id,
          hppPerPorsi: masterData.hppPerPorsi,
          hargaJualPerPorsi: masterData.hargaJualPerPorsi,
          labaPerPorsi: masterData.labaPerPorsi,
          targetHarian: masterData.targetHarian,
        });

        const items = (masterData.realisasi || []).map((r: any) => ({
          id: r.id || `temp-${Math.random()}`,
          tanggal: r.tanggal || new Date().toISOString(),
          hariNama: r.hariNama || new Date(r.tanggal).toLocaleDateString('id-ID', { weekday: 'long' }),
          terjual: r.terjual || 0,
          sisa: r.sisa || 0,
          stokAwal: r.stokAwal || 0,
          status: r.status || 'belum_terjadi',
          perluBelanja: r.perluBelanja || false,
        }));

        setData(items);
        setFilteredData(items);
      } else {
        throw new Error(result.error || 'Gagal mengambil data');
      }
    } catch (err) {
      console.error('❌ Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter handler
  const handleFilterChange = (startDate: string, endDate: string) => {
    if (!data.length) return;
    
    const filtered = data.filter((item) => {
      const date = item.tanggal.split('T')[0];
      return date >= startDate && date <= endDate;
    });
    setFilteredData(filtered);
  };

  // CRUD: Create / Update
  const handleSubmit = async (formData: { tanggal: string; terjual: number }) => {
    try {
      setFormLoading(true);
      
      const url = editingData 
        ? `/api/penjualan/${editingData.tanggal}` 
        : '/api/penjualan';
      
      const method = editingData ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      
      if (result.status === '✅ Berhasil!') {
        setIsFormOpen(false);
        setEditingData(null);
        await fetchData();
      } else {
        alert(result.error || 'Gagal menyimpan data');
      }
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Terjadi kesalahan');
    } finally {
      setFormLoading(false);
    }
  };

  // CRUD: Delete
  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus data ini?')) return;
    
    try {
      const res = await fetch(`/api/penjualan/${id}`, {
        method: 'DELETE',
      });

      const result = await res.json();
      
      if (result.status === '✅ Berhasil!') {
        await fetchData();
      } else {
        alert(result.error || 'Gagal menghapus data');
      }
    } catch (error) {
      console.error('Error deleting data:', error);
      alert('Terjadi kesalahan');
    }
  };

  // ⚠️ ERROR STATE
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-8 max-w-md text-center">
          <p className="text-red-500 text-lg font-semibold">❌ Error</p>
          <p className="text-gray-600 mt-2">{error}</p>
          <button 
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  // ⚠️ LOADING STATE
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

  // ⚠️ EMPTY STATE
  if (!master) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-md text-center">
          <p className="text-gray-500">Data master tidak ditemukan</p>
          <p className="text-sm text-gray-400 mt-1">Pastikan database sudah di-seed</p>
          <button 
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Refresh
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
            <h1 className="text-2xl font-bold text-gray-800">📊 Management Penjualan</h1>
            <p className="text-sm text-gray-400">Kelola data penjualan harian</p>
          </div>
          <button
            onClick={() => {
              setEditingData(null);
              setIsFormOpen(true);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Penjualan
          </button>
        </div>

        {/* Filter */}
        <FilterBar
          currentWeek={currentWeek}
          onWeekChange={setCurrentWeek}
          onFilterChange={handleFilterChange}
        />

        {/* Table */}
        <div className="mt-4">
          <PenjualanTable
            data={filteredData}
            targetHarian={master.targetHarian}
            hppPerPorsi={master.hppPerPorsi}
            hargaJualPerPorsi={master.hargaJualPerPorsi}
            labaPerPorsi={master.labaPerPorsi}
            onEdit={(id) => {
              const item = data.find(d => d.id === id);
              if (item) {
                setEditingData({
                  tanggal: item.tanggal.split('T')[0],
                  terjual: item.terjual,
                });
                setIsFormOpen(true);
              }
            }}
            onDelete={handleDelete}
            loading={loading}
          />
        </div>

        {/* Form Modal */}
        <PenjualanForm
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingData(null);
          }}
          onSubmit={handleSubmit}
          initialData={editingData}
          targetHarian={master.targetHarian}
          loading={formLoading}
        />
      </div>
    </div>
  );
}