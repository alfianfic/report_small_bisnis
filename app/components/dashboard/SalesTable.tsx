// app/components/dashboard/SalesTable.tsx

import { salesData as initialSalesData } from "@/app/data/salesData";
import type { SalesData } from "@/app/types";

interface SalesTableProps {
  salesData: {
    hppPerPorsi: number;
    hargaJualPerPorsi: number;
    labaPerPorsi: number;
    targetHarian: number;
    realisasiHarian: Array<{
      hari: number;
      terjual: number;
      sisa: number;
      tanggal: string;
      stokAwal: number;
      status: string;
      perluBelanja: boolean;
      belanja: number;
    }>;
    riwayatBelanja: Array<{
      tanggal: string;
      jumlah: number;
      keterangan: string;
    }>;
  };
}

const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka);
};

export default function SalesTable({ salesData = initialSalesData }: SalesTableProps) {
  const totalTerjual = salesData.realisasiHarian.reduce((sum, h) => sum + h.terjual, 0);
  const totalPendapatan = totalTerjual * salesData.hargaJualPerPorsi;
  const totalHPP = totalTerjual * salesData.hppPerPorsi;
  const totalProfit = totalTerjual * salesData.labaPerPorsi;

  const hariTerakhir = salesData.realisasiHarian[salesData.realisasiHarian.length - 1];
  const totalSisa = hariTerakhir?.sisa || 0;
  const totalPotensiHilang = totalSisa * salesData.hargaJualPerPorsi;

  const totalBelanja = salesData.riwayatBelanja?.reduce((sum, b) => sum + b.jumlah, 0) || 0;
  const adaBelanja = totalBelanja > 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-2 bg-white">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
          Detail Penjualan Harian
        </h3>
        <div className="text-xs text-gray-400 flex flex-wrap gap-2 items-center">
          <span>HPP: {formatRupiah(salesData.hppPerPorsi)}</span>
          <span>|</span>
          <span>Jual: {formatRupiah(salesData.hargaJualPerPorsi)}</span>
          <span>|</span>
          <span>Laba: {formatRupiah(salesData.labaPerPorsi)}/porsi</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto overflow-y-auto max-h-[500px]">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-gray-50/95 z-10">
            <tr className="border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Tanggal</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Target</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Terjual</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Stok Awal</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Sisa</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Belanja</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Pendapatan</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">HPP</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Profit</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Status</th>
            </tr>
          </thead>
          <tbody>
            {salesData.realisasiHarian.map((hari, idx) => {
              const pendapatan = hari.terjual * salesData.hargaJualPerPorsi;
              const hpp = hari.terjual * salesData.hppPerPorsi;
              const profit = hari.terjual * salesData.labaPerPorsi;

              let statusDisplay = '';
              if (hari.belanja > 0) {
                statusDisplay = `🛒 Belanja ${hari.belanja}`;
              } else if (hari.sisa >= salesData.targetHarian) {
                statusDisplay = '✅ Stok aman';
              } else if (hari.sisa > 0 && hari.sisa < salesData.targetHarian) {
                statusDisplay = '⚠️ Stok kurang';
              } else {
                statusDisplay = '❌ Habis';
              }

              const statusColor =
                statusDisplay.includes('Stok aman') ? 'bg-green-100 text-green-700' :
                  statusDisplay.includes('Belanja') ? 'bg-blue-100 text-blue-700' :
                    statusDisplay.includes('Stok kurang') ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700';

              return (
                <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 text-gray-700 font-medium whitespace-nowrap">{hari.tanggal}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{salesData.targetHarian}</td>
                  <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{hari.terjual}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{hari.stokAwal || 0}</td>
                  <td className={`px-4 py-3 whitespace-nowrap ${hari.sisa > 0 ? 'text-orange-500 font-medium' : 'text-gray-400'}`}>
                    {hari.sisa}
                  </td>
                  <td className="px-4 py-3 text-green-600 font-medium whitespace-nowrap">
                    {hari.belanja > 0 ? hari.belanja : '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatRupiah(pendapatan)}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatRupiah(hpp)}</td>
                  <td className="px-4 py-3 font-medium text-green-600 whitespace-nowrap">+{formatRupiah(profit)}</td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full ${statusColor}`}>
                      {statusDisplay}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ✅ 1 SECTION RINGKASAN - HAPUS TOTAL YANG DOUBLE DI DASHBOARD */}
      <div className="px-6 py-3 bg-gray-50/80 border-t border-gray-200 text-xs text-gray-600">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-200">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-700">
              {/* Rata-rata penjualan */}
              <span>📊 Rata-rata penjualan: <strong className="text-gray-900">{(totalTerjual / 7).toFixed(0)}</strong> porsi/hari</span>

              {/* Rata-rata profit/hari */}
              <span>💰 Rata-rata profit/hari: <strong className="text-gray-900">{formatRupiah(totalProfit / 7)}</strong></span>

              {/* Belanja */}
              {adaBelanja && (
                <span className="text-green-600 font-semibold">🛒 Belanja: <strong className="text-green-700">{totalBelanja}</strong></span>
              )}

              {/* Total sisa stok */}
              <span className="text-orange-600 font-semibold">⚠️ Total sisa stok: <strong className="text-orange-700">{totalSisa}</strong> porsi</span>

              {/* Potensi hilang */}
              <span className="text-red-600 font-semibold">💸 Potensi hilang: <strong className="text-red-700">{formatRupiah(totalPotensiHilang)}</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}