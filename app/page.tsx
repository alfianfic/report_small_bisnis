// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import DashboardGrid from '@/app/components/dashboard/DashboardGrid';
import SalesTable from '@/app/components/dashboard/SalesTable';
import SalesForm from '@/app/components/form/SalesForm';
import BelanjaForm from '@/app/components/form/BelanjaForm';
import Button from '@/app/components/ui/Button';

// Type untuk data dari API
interface SalesData {
  id: string;
  hppPerPorsi: number;
  hargaJualPerPorsi: number;
  labaPerPorsi: number;
  targetHarian: number;
  stokAwal: number;
  thresholdBelanja: number;
  realisasi: Array<{
    id: string;
    tanggal: string;
    hari: number;
    terjual: number;
    sisa: number;
    stokAwal: number;
    status: string;
    perluBelanja: boolean;
    belanja: number;
  }>;
  riwayatBelanja: Array<{
    id: string;
    tanggal: string;
    jumlah: number;
    keterangan: string;
  }>;
}

export default function Home() {
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTable, setShowTable] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBelanjaOpen, setIsBelanjaOpen] = useState(false);

  // Fetch data dari database
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/sales');
        const result = await res.json();
        
        if (result.status === '✅ Berhasil!') {
          setSalesData(result.data);
        } else {
          setError('Gagal mengambil data');
        }
      } catch (err) {
        setError('Error fetching data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (error || !salesData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center text-red-600">
          <p>❌ {error || 'Data tidak ditemukan'}</p>
        </div>
      </div>
    );
  }

  // Hitung metrics dari data
  const totalTerjual = salesData.realisasi.reduce((sum, h) => sum + h.terjual, 0);
  const totalPendapatan = totalTerjual * salesData.hargaJualPerPorsi;
  const totalHPP = totalTerjual * salesData.hppPerPorsi;
  const totalProfit = totalTerjual * salesData.labaPerPorsi;
  const totalSisa = salesData.realisasi[salesData.realisasi.length - 1]?.sisa || 0;
  const totalPotensiHilang = totalSisa * salesData.hargaJualPerPorsi;
  const totalBelanja = salesData.riwayatBelanja.reduce((sum, b) => sum + b.jumlah, 0);
  const persentaseEfisiensi = (totalTerjual / (salesData.targetHarian * salesData.realisasi.length)) * 100;

  const metrics = {
    totalTerjual,
    totalSisa,
    sisaBahanBaku: (salesData.stokAwal + totalBelanja) - totalTerjual,
    nilaiAset: ((salesData.stokAwal + totalBelanja) - totalTerjual) * salesData.hppPerPorsi,
    penjualanHariIni: salesData.realisasi[salesData.realisasi.length - 1]?.terjual || 0,
    nilaiPenjualanHariIni: (salesData.realisasi[salesData.realisasi.length - 1]?.terjual || 0) * salesData.hargaJualPerPorsi,
    totalProfit,
    persentaseEfisiensi,
    totalPendapatan,
    totalHPP,
    totalPotensiHilang,
    totalModalTerbuang: totalSisa * salesData.hppPerPorsi,
    stokSaatIni: totalSisa,
    perluBelanja: totalSisa < salesData.thresholdBelanja,
    totalBelanja,
  };

  const dashboardConfig = {
    title: 'DASHBOARD',
    subtitle: 'manajemen penjualan & stok',
    footer: 'data statis · periode mingguan'
  };

  // Convert data untuk SalesTable
  const salesDataForTable = {
    hppPerPorsi: salesData.hppPerPorsi,
    hargaJualPerPorsi: salesData.hargaJualPerPorsi,
    labaPerPorsi: salesData.labaPerPorsi,
    targetHarian: salesData.targetHarian,
    realisasiHarian: salesData.realisasi.map(r => ({
      hari: r.hari,
      terjual: r.terjual,
      sisa: r.sisa,
      tanggal: new Date(r.tanggal).toISOString().split('T')[0],
      stokAwal: r.stokAwal,
      status: r.status,
      perluBelanja: r.perluBelanja,
      belanja: r.belanja,
    })),
    riwayatBelanja: salesData.riwayatBelanja,
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="pt-12 pb-4 text-center border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-700 tracking-wide">
          {dashboardConfig.title}
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {dashboardConfig.subtitle}
        </p>
        {metrics.perluBelanja && (
          <div className="mt-3 px-4 py-2 bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm rounded-lg inline-block">
            ⚠️ Stok menipis ({metrics.stokSaatIni} porsi tersisa)
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-4xl">
          <DashboardGrid
            metrics={metrics}
            onOpenForm={() => setIsFormOpen(true)}
            onOpenBelanja={() => setIsBelanjaOpen(true)}
          />

          <div className="flex justify-center mt-6">
            <Button
              onClick={() => setShowTable(!showTable)}
              isOpen={showTable}
            />
          </div>

          <div
            className={`
              transition-all duration-500 overflow-hidden
              ${showTable ? 'max-h-[600px] opacity-100 mt-8' : 'max-h-0 opacity-0'}
            `}
            aria-hidden={!showTable}
          >
            <SalesTable salesData={salesDataForTable} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 text-center text-xs text-gray-300">
        {dashboardConfig.footer}
      </footer>

      <SalesForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={(value) => {
          // TODO: Implement update ke database
          console.log('Update penjualan:', value);
          setIsFormOpen(false);
        }}
        targetHarian={salesData.targetHarian}
        hariKe={salesData.realisasi.length}
        tanggal={new Date().toISOString().split('T')[0]}
      />

      <BelanjaForm
        isOpen={isBelanjaOpen}
        onClose={() => setIsBelanjaOpen(false)}
        onSubmit={(jumlah, keterangan) => {
          // TODO: Implement belanja ke database
          console.log('Belanja:', jumlah, keterangan);
          setIsBelanjaOpen(false);
        }}
        stokSaatIni={metrics.stokSaatIni}
      />
    </main>
  );
}