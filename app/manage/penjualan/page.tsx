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
  productId: string;
}

interface MasterData {
  id: string;
  productId: string;
  hppPerPorsi: number;
  hargaJualPerPorsi: number;
  labaPerPorsi: number;
  targetHarian: number;
  thresholdBelanja: number;
  stokAwal: number;
}

interface Product {
  id: string;
  name: string;
  sku: string;
}

export default function ManagePenjualan() {
  const [data, setData] = useState<PenjualanData[]>([]);
  const [master, setMaster] = useState<MasterData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filteredData, setFilteredData] = useState<PenjualanData[]>([]);
  const [currentWeek, setCurrentWeek] = useState(0);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingData, setEditingData] = useState<{ tanggal: string; terjual: number } | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Fetch products
  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const result = await res.json();
      if (result.status === '✅ Berhasil!') {
        setProducts(result.data);
        if (result.data.length > 0) {
          setSelectedProductId(result.data[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  // Fetch data
  const fetchData = async (productId?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const pid = productId || selectedProductId;
      if (!pid) {
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/penjualan?productId=${pid}`);
      const result = await res.json();
      
      if (result.status === '✅ Berhasil!') {
        const masterData = result.activeMaster;
        setMaster({
          id: masterData.id,
          productId: masterData.productId || pid,
          hppPerPorsi: masterData.hppPerPorsi,
          hargaJualPerPorsi: masterData.hargaJualPerPorsi,
          labaPerPorsi: masterData.labaPerPorsi,
          targetHarian: masterData.targetHarian,
          thresholdBelanja: masterData.thresholdBelanja,
          stokAwal: masterData.stokAwal,
        });

        const items = (result.data.realisasi || []).map((r: any) => ({
          id: r.id,
          tanggal: r.tanggal,
          hariNama: r.hariNama || new Date(r.tanggal).toLocaleDateString('id-ID', { weekday: 'long' }),
          terjual: r.terjual,
          sisa: r.sisa,
          stokAwal: r.stokAwal,
          status: r.status,
          perluBelanja: r.perluBelanja,
          productId: pid,
        }));

        setData(items);
        setFilteredData(items);
      } else {
        setError(result.error || 'Gagal mengambil data');
        setData([]);
        setFilteredData([]);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Terjadi kesalahan saat mengambil data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedProductId) {
      fetchData(selectedProductId);
    }
  }, [selectedProductId]);

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
      
      const url = editingData ? `/api/penjualan/${editingData.tanggal}` : '/api/penjualan';
      const method = editingData ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, productId: selectedProductId }),
      });

      const result = await res.json();
      
      if (result.status === '✅ Berhasil!') {
        setIsFormOpen(false);
        setEditingData(null);
        await fetchData(selectedProductId);
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
        await fetchData(selectedProductId);
      } else {
        alert(result.error || 'Gagal menghapus data');
      }
    } catch (error) {
      console.error('Error deleting data:', error);
      alert('Terjadi kesalahan');
    }
  };

  // Product change handler
  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
    setCurrentWeek(0);
  };

  if (loading && !data.length) {
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
            <h1 className="text-2xl font-bold text-gray-800">📊 Management Penjualan</h1>
            <p className="text-sm text-gray-400">Kelola data penjualan harian</p>
          </div>
          <div className="flex gap-2">
            {/* Product Selector */}
            <select
              value={selectedProductId}
              onChange={(e) => handleProductChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
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
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            ❌ {error}
            <button 
              onClick={() => fetchData(selectedProductId)}
              className="ml-4 text-sm text-red-700 hover:text-red-900 underline"
            >
              Coba Lagi
            </button>
          </div>
        )}

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
            targetHarian={master?.targetHarian || 200}
            hppPerPorsi={master?.hppPerPorsi || 13000}
            hargaJualPerPorsi={master?.hargaJualPerPorsi || 15000}
            labaPerPorsi={master?.labaPerPorsi || 2000}
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
          targetHarian={master?.targetHarian || 200}
          loading={formLoading}
        />
      </div>
    </div>
  );
}