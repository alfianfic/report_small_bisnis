// app/page.tsx

'use client';

import { useState, useEffect } from 'react';
import DashboardGrid from '@/app/components/dashboard/DashboardGrid';
import ProductSelector from '@/app/components/dashboard/ProductSelector';
import PenjualanForm from '@/app/components/form/PenjualanForm';
import PembelianForm from '@/app/components/form/PembelianForm';

interface Product {
  id: string;
  name: string;
  sku: string;
  hppPerPorsi: number;
  hargaJualPerPorsi: number;
  labaPerPorsi: number;
  targetHarian: number;
  stokAwal: number;
  thresholdBelanja: number;
  isActive: boolean;
  masterData: Array<{
    id: string;
    tanggalBerlaku: string;
    hppPerPorsi: number;
    hargaJualPerPorsi: number;
    labaPerPorsi: number;
    targetHarian: number;
    stokAwal: number;
    thresholdBelanja: number;
  }>;
}

interface SalesData {
  id: string;
  productId: string;
  hppPerPorsi: number;
  hargaJualPerPorsi: number;
  labaPerPorsi: number;
  targetHarian: number;
  stokAwal: number;
  thresholdBelanja: number;
  tanggalBerlaku: string;
  realisasi: Array<{
    id: string;
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
  }>;
  riwayatBelanja: Array<{
    id: string;
    tanggal: string;
    jumlah: number;
    total: number | null;
    totalSystem: number | null;
    hppPerPorsi: number;
    keterangan: string | null;
  }>;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeProductId, setActiveProductId] = useState<string>('');
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [activeMaster, setActiveMaster] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTable, setShowTable] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBelanjaOpen, setIsBelanjaOpen] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(0);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [currentFilter, setCurrentFilter] = useState<{ start: string; end: string } | null>(null);

  // Fetch products
  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const result = await res.json();
      if (result.status === '✅ Berhasil!') {
        setProducts(result.data);
        if (result.data.length > 0) {
          setActiveProductId(result.data[0].id);
          setActiveProduct(result.data[0]);
        }
      } else {
        setError('Gagal mengambil data produk');
      }
    } catch (err) {
      setError('Error fetching products');
    }
  };

  // Fetch data per product with filter
  const fetchProductData = async (productId: string, startDate?: string, endDate?: string) => {
    if (!productId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Build URL dengan filter
      let url = `/api/penjualan?productId=${productId}`;
      if (startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }
      
      const res = await fetch(url);
      const result = await res.json();
      
      if (result.status === '✅ Berhasil!') {
        setSalesData(result.data);
        setActiveMaster(result.activeMaster);
        
        // Update active product with latest master data
        const updatedProduct = products.find(p => p.id === productId);
        if (updatedProduct && result.activeMaster) {
          setActiveProduct({
            ...updatedProduct,
            hppPerPorsi: result.activeMaster.hppPerPorsi,
            hargaJualPerPorsi: result.activeMaster.hargaJualPerPorsi,
            labaPerPorsi: result.activeMaster.labaPerPorsi,
            targetHarian: result.activeMaster.targetHarian,
            stokAwal: result.activeMaster.stokAwal,
            thresholdBelanja: result.activeMaster.thresholdBelanja,
          });
        }
        
        // Set filtered data
        const tableData = (result.data.realisasi || []).map((r: any) => ({
          id: r.id,
          tanggal: r.tanggal,
          hariNama: new Date(r.tanggal).toLocaleDateString('id-ID', { weekday: 'long' }),
          terjual: r.terjual,
          sisa: r.sisa,
          stokAwal: r.stokAwal,
          status: r.status,
          perluBelanja: r.perluBelanja,
          hppPerPorsi: r.hppPerPorsi || result.data.hppPerPorsi,
          hargaJualPerPorsi: r.hargaJualPerPorsi || result.data.hargaJualPerPorsi,
          labaPerPorsi: r.labaPerPorsi || result.data.labaPerPorsi,
          targetHarian: r.targetHarian || result.data.targetHarian,
          thresholdBelanja: r.thresholdBelanja || result.data.thresholdBelanja,
        }));
        setFilteredData(tableData);
        
        // Simpan filter yang digunakan
        if (startDate && endDate) {
          setCurrentFilter({ start: startDate, end: endDate });
        }
      } else {
        setError(result.error || 'Gagal mengambil data');
        setSalesData(null);
        setFilteredData([]);
      }
    } catch (err) {
      setError('Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchProducts();
  }, []);

  // Load data when product changes
  useEffect(() => {
    if (activeProductId) {
      // Dapatkan range minggu default (Senin-Minggu)
      const now = new Date();
      const dayOfWeek = now.getDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - diff);
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      
      const startStr = startOfWeek.toISOString().split('T')[0];
      const endStr = endOfWeek.toISOString().split('T')[0];
      
      // Reset currentWeek ke 0
      setCurrentWeek(0);
      fetchProductData(activeProductId, startStr, endStr);
    }
  }, [activeProductId]);

  // Filter handler
  const handleFilterChange = (startDate: string, endDate: string) => {
    if (activeProductId) {
      fetchProductData(activeProductId, startDate, endDate);
    }
  };

  // Handle product change
  const handleProductChange = (productId: string) => {
    if (productId !== activeProductId) {
      setActiveProductId(productId);
      setShowTable(false);
    }
  };

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (error && products.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center text-red-600">
          <p>❌ {error}</p>
          <button 
            onClick={fetchProducts}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500">Belum ada produk</p>
          <p className="text-sm text-gray-400 mt-1">Silakan tambahkan produk terlebih dahulu</p>
        </div>
      </div>
    );
  }

  // Get active product data
  const product = activeProduct || products.find(p => p.id === activeProductId) || products[0];
  
  // Check if there is data for the selected product
  const hasData = filteredData.length > 0 && salesData !== null;

  // Ambil snapshot dari filteredData
  const latestItem = hasData ? filteredData[filteredData.length - 1] : null;

  const hppPerPorsi = latestItem?.hppPerPorsi || product.hppPerPorsi;
  const hargaJualPerPorsi = latestItem?.hargaJualPerPorsi || product.hargaJualPerPorsi;
  const labaPerPorsi = latestItem?.labaPerPorsi || product.labaPerPorsi;
  const targetHarian = latestItem?.targetHarian || product.targetHarian;
  const thresholdBelanja = latestItem?.thresholdBelanja || product.thresholdBelanja;

  // Hitung metrics dari filtered data
  const totalTerjual = hasData ? filteredData.reduce((sum, h) => sum + h.terjual, 0) : 0;
  const totalSisa = hasData && filteredData.length > 0 ? filteredData[filteredData.length - 1]?.sisa || 0 : 0;

  // Total belanja di periode filter
  const totalBelanja = hasData && salesData ? salesData.riwayatBelanja
    .filter(b => {
      const bDate = new Date(b.tanggal).toISOString().split('T')[0];
      return filteredData.some(f => {
        const fDate = new Date(f.tanggal).toISOString().split('T')[0];
        return bDate === fDate;
      });
    })
    .reduce((sum, b) => sum + (b.jumlah || b.totalSystem || 0), 0) : 0;

  // Sisa bahan baku
  const sisaBahanBaku = hasData 
    ? Math.max(0, (product.stokAwal + totalBelanja) - totalTerjual)
    : 0;

  const metrics = {
    totalTerjual,
    totalSisa,
    sisaBahanBaku,
    nilaiAset: sisaBahanBaku * hppPerPorsi,
    penjualanHariIni: hasData && filteredData.length > 0 ? filteredData[filteredData.length - 1]?.terjual || 0 : 0,
    nilaiPenjualanHariIni: hasData && filteredData.length > 0 ? (filteredData[filteredData.length - 1]?.terjual || 0) * hargaJualPerPorsi : 0,
    totalProfit: hasData ? totalTerjual * labaPerPorsi : 0,
    persentaseEfisiensi: hasData && filteredData.length > 0
      ? (totalTerjual / (targetHarian * filteredData.length)) * 100 
      : 0,
    totalPendapatan: hasData ? totalTerjual * hargaJualPerPorsi : 0,
    totalHPP: hasData ? totalTerjual * hppPerPorsi : 0,
    totalPotensiHilang: hasData ? totalSisa * hargaJualPerPorsi : 0,
    totalModalTerbuang: hasData ? totalSisa * hppPerPorsi : 0,
    stokSaatIni: hasData ? totalSisa : 0,
    perluBelanja: hasData ? totalSisa < thresholdBelanja : false,
    totalBelanja: hasData ? totalBelanja : 0,
  };

  // Chart data
  const chartData = hasData && salesData ? filteredData.map((item) => ({
    tanggal: item.tanggal,
    hariNama: item.hariNama,
    terjual: item.terjual,
    target: targetHarian,
    belanja: salesData.riwayatBelanja
      .filter(b => {
        const bDate = new Date(b.tanggal).toISOString().split('T')[0];
        const iDate = new Date(item.tanggal).toISOString().split('T')[0];
        return bDate === iDate;
      })
      .reduce((sum, b) => sum + (b.jumlah || b.totalSystem || 0), 0),
    sisa: item.sisa,
  })) : [];

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <header className="pt-12 pb-4 text-center border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-700 tracking-wide">DASHBOARD</h1>
        <p className="text-sm text-gray-400 mt-0.5">manajemen penjualan & stok</p>
        
        {/* Product Selector */}
        <div className="mt-4 flex justify-center">
          <ProductSelector
            products={products}
            activeProductId={activeProductId}
            onProductChange={handleProductChange}
          />
        </div>

        {/* Product Info */}
        {activeMaster && (
          <div className="mt-2 text-xs text-gray-400">
            Master aktif: {new Date(activeMaster.tanggalBerlaku).toLocaleDateString('id-ID')}
            {' · '}
            HPP: Rp{activeMaster.hppPerPorsi.toLocaleString('id-ID')}
            {' · '}
            SKU: {product.sku}
          </div>
        )}

        {hasData && metrics.perluBelanja && (
          <div className="mt-3 px-4 py-2 bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm rounded-lg inline-block">
            ⚠️ Stok menipis ({metrics.stokSaatIni} porsi tersisa)
          </div>
        )}
      </header>

      <div className="flex-1 flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-4xl">
          <DashboardGrid
            metrics={metrics}
            onOpenForm={() => setIsFormOpen(true)}
            onOpenBelanja={() => setIsBelanjaOpen(true)}
            showTable={showTable}
            onToggleTable={() => setShowTable(!showTable)}
            tableData={filteredData}
            chartData={chartData}
            targetHarian={targetHarian}
            hppPerPorsi={hppPerPorsi}
            hargaJualPerPorsi={hargaJualPerPorsi}
            labaPerPorsi={labaPerPorsi}
            currentWeek={currentWeek}
            onWeekChange={setCurrentWeek}
            onFilterChange={handleFilterChange}
            productName={product.name}
          />
        </div>
      </div>

      <footer className="py-8 text-center text-xs text-gray-300">
        data real-time · periode mingguan
      </footer>

      {/* Form Penjualan */}
      <PenjualanForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={async (data) => {
          try {
            const res = await fetch('/api/penjualan', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...data, productId: activeProductId }),
            });
            const result = await res.json();
            if (result.status === '✅ Berhasil!') {
              setIsFormOpen(false);
              // Refresh data dengan filter yang sama
              if (currentFilter) {
                await fetchProductData(activeProductId, currentFilter.start, currentFilter.end);
              } else {
                await fetchProductData(activeProductId);
              }
              alert('Penjualan berhasil disimpan!');
            } else {
              alert(result.error || 'Gagal menyimpan data');
            }
          } catch (error) {
            alert('Terjadi kesalahan');
          }
        }}
        targetHarian={targetHarian}
        loading={false}
      />

      {/* Form Pembelian */}
      <PembelianForm
        isOpen={isBelanjaOpen}
        onClose={() => setIsBelanjaOpen(false)}
        onSubmit={async (data) => {
          try {
            const res = await fetch('/api/pembelian', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...data, productId: activeProductId }),
            });
            const result = await res.json();
            if (result.status === '✅ Berhasil!') {
              setIsBelanjaOpen(false);
              // Refresh data dengan filter yang sama
              if (currentFilter) {
                await fetchProductData(activeProductId, currentFilter.start, currentFilter.end);
              } else {
                await fetchProductData(activeProductId);
              }
              alert('Pembelian berhasil disimpan!');
            } else {
              alert(result.error || 'Gagal menyimpan data');
            }
          } catch (error) {
            alert('Terjadi kesalahan');
          }
        }}
        hppPerPorsi={hppPerPorsi}
        loading={false}
      />
    </main>
  );
}