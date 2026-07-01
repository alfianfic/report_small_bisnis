// app/components/manage/PenjualanTable.tsx

'use client';

interface PenjualanItem {
  id: string;
  tanggal: string;
  hariNama: string;
  terjual: number;
  sisa: number;
  stokAwal: number;
  status: string;
  perluBelanja: boolean;
}

interface PenjualanTableProps {
  data: PenjualanItem[];
  targetHarian: number;
  hppPerPorsi: number;
  hargaJualPerPorsi: number;
  labaPerPorsi: number;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
}

const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(angka);
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'aman': return 'bg-green-100 text-green-700';
    case 'waspada': return 'bg-yellow-100 text-yellow-700';
    case 'habis': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-500';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'aman': return '✅ Aman';
    case 'waspada': return '⚠️ Waspada';
    case 'habis': return '❌ Habis';
    default: return '⚪ Belum Terjadi';
  }
};

export default function PenjualanTable({
  data,
  targetHarian,
  hppPerPorsi,
  hargaJualPerPorsi,
  labaPerPorsi,
  onEdit,
  onDelete,
  loading = false,
}: PenjualanTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-500">Memuat data...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
        <p className="text-gray-400">Tidak ada data penjualan untuk periode ini</p>
        <p className="text-sm text-gray-300 mt-1">Klik tombol "Tambah Penjualan" untuk menambahkan</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-2 bg-white">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
          📊 Data Penjualan
        </h3>
        <div className="text-xs text-gray-400 flex flex-wrap gap-2 items-center">
          <span>HPP: {formatRupiah(hppPerPorsi)}</span>
          <span>|</span>
          <span>Jual: {formatRupiah(hargaJualPerPorsi)}</span>
          <span>|</span>
          <span>Laba: {formatRupiah(labaPerPorsi)}/porsi</span>
          <span>|</span>
          <span>Target: {targetHarian}/hari</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto overflow-y-auto max-h-[500px]">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-gray-50/95 z-10">
            <tr className="border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">#</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Tanggal</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Hari</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Terjual</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Stok Awal</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Sisa</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Pendapatan</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">HPP</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Profit</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Status</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => {
              const pendapatan = item.terjual * hargaJualPerPorsi;
              const hpp = item.terjual * hppPerPorsi;
              const profit = item.terjual * labaPerPorsi;

              let rowClass = 'border-b border-gray-50 hover:bg-gray-50/50 transition-colors';
              if (item.sisa === 0) {
                rowClass += ' bg-red-50/50 hover:bg-red-100/50';
              } else if (item.perluBelanja) {
                rowClass += ' bg-yellow-50/50 hover:bg-yellow-100/50';
              }

              return (
                <tr key={item.id} className={rowClass}>
                  <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                  <td className="px-4 py-3 text-gray-700 font-medium whitespace-nowrap">
                    {new Date(item.tanggal).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{item.hariNama}</td>
                  <td className="px-4 py-3 text-gray-700 font-medium whitespace-nowrap">{item.terjual}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{item.stokAwal}</td>
                  <td className={`px-4 py-3 whitespace-nowrap font-medium ${item.sisa > 0 ? 'text-orange-500' : 'text-red-400'}`}>
                    {item.sisa}
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatRupiah(pendapatan)}</td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{formatRupiah(hpp)}</td>
                  <td className="px-4 py-3 font-medium text-green-600 whitespace-nowrap">+{formatRupiah(profit)}</td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full ${getStatusColor(item.status)}`}>
                      {getStatusLabel(item.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onEdit(item.id)}
                        className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => onDelete(item.id)}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="px-6 py-3 bg-gray-50/80 border-t border-gray-200 text-xs text-gray-600">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
          <span>📊 Total data: <strong className="text-gray-900">{data.length}</strong> hari</span>
          <span>📈 Total terjual: <strong className="text-gray-900">{data.reduce((s, i) => s + i.terjual, 0)}</strong></span>
          <span>💰 Total profit: <strong className="text-gray-900">{formatRupiah(data.reduce((s, i) => s + (i.terjual * labaPerPorsi), 0))}</strong></span>
        </div>
      </div>
    </div>
  );
}