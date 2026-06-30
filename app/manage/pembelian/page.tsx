// app/manage/pembelian/page.tsx

'use client';

import { useState, useEffect } from 'react';
import PembelianTable from '@/app/components/manage/PembelianTable';
import PembelianForm from '@/app/components/manage/PembelianForm';
import FilterBar from '@/app/components/ui/FilterBar';

interface PembelianItem {
  id: string;
  tanggal: string;
  jumlah: number | null;
  total: number | null;
  jumlahSystem: number | null;
  totalSystem: number | null;
  hppPerPorsi: number;
  keterangan: string | null;
}

export default function ManagePembelian() {
  const [data, setData] = useState<PembelianItem[]>([]);
  const [filteredData, setFilteredData] = useState<PembelianItem[]>([]);
  const [hppPerPorsi, setHppPerPorsi] = useState(13000);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentWeek, setCurrentWeek] = useState(0);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingData, setEditingData] = useState<PembelianItem | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Fetching pembelian data...');
      
      const res = await fetch('/api/pembelian');
      console.log('📡 Response status:', res.status);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const result = await res.json();
      console.log('📦 Response data:', result);
      
      if (result.status === '✅ Berhasil!') {
        setData(result.data || []);
        setFilteredData(result.data || []);
        
        // Ambil hpp dari data pertama
        if (result.data && result.data.length > 0) {
          setHppPerPorsi(result.data[0].hppPerPorsi);
        } else {
          // Fallback: ambil dari master penjualan
          const masterRes = await fetch('/api/penjualan');
          const masterResult = await masterRes.json();
          if (masterResult.status === '✅ Berhasil!') {
            setHppPerPorsi(masterResult.data.hppPerPorsi);
          }
        }
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
  const handleSubmit = async (formData: { 
    tanggal: string; 
    jumlah?: number; 
    total?: number; 
    keterangan?: string 
  }) => {
    try {
      setFormLoading(true);
      
      const url = editingData 
        ? `/api/pembelian/${editingData.id}` 
        : '/api/pembelian';
      
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
      const res = await fetch(`/api/pembelian/${id}`, {
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
            className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
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
          <p className="mt-4 text-gray-600">Memuat data pembelian...</p>
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
            <h1 className="text-2xl font-bold text-gray-800">🛒 Management Pembelian</h1>
            <p className="text-sm text-gray-400">Kelola data pembelian stok</p>
          </div>
          <button
            onClick={() => {
              setEditingData(null);
              setIsFormOpen(true);
            }}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Pembelian
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
          <PembelianTable
            data={filteredData}
            onEdit={(id) => {
              const item = data.find(d => d.id === id);
              if (item) {
                setEditingData(item);
                setIsFormOpen(true);
              }
            }}
            onDelete={handleDelete}
            loading={loading}
          />
        </div>

        {/* Form Modal */}
        <PembelianForm
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingData(null);
          }}
          onSubmit={handleSubmit}
          initialData={editingData}
          hppPerPorsi={hppPerPorsi}
          loading={formLoading}
        />
      </div>
    </div>
  );
}