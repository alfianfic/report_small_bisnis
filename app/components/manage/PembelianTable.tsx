// app/components/manage/PembelianTable.tsx

'use client';

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

interface PembelianTableProps {
  data: PembelianItem[];
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

export default function PembelianTable({
  data,
  onEdit,
  onDelete,
  loading = false,
}: PembelianTableProps) {
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
        <p className="text-gray-400">Belum ada data pembelian</p>
        <p className="text-sm text-gray-300 mt-1">Klik tombol "Tambah Pembelian" untuk menambahkan</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-2 bg-white">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
          🛒 Data Pembelian
        </h3>
        <div className="text-xs text-gray-400">
          Total: <strong className="text-gray-700">{data.length}</strong> transaksi
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto overflow-y-auto max-h-[500px]">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-gray-50/95 z-10">
            <tr className="border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">#</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Tanggal</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Jumlah (User)</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Total (User)</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Jumlah (System)</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Total (System)</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">HPP/Porsi</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Keterangan</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => {
              const jumlahEfektif = item.jumlah || item.jumlahSystem || 0;
              const totalEfektif = item.total || item.totalSystem || 0;
              
              return (
                <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                  <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                    {new Date(item.tanggal).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3 text-gray-700 font-medium whitespace-nowrap">
                    {item.jumlah || '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {item.total ? formatRupiah(item.total) : '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {item.jumlahSystem || '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {item.totalSystem ? formatRupiah(item.totalSystem) : '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                    {formatRupiah(item.hppPerPorsi)}
                  </td>
                  <td className="px-4 py-3 text-gray-500 max-w-[150px] truncate">
                    {item.keterangan || '-'}
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
          <span>📊 Total transaksi: <strong className="text-gray-900">{data.length}</strong></span>
          <span>📦 Total unit: <strong className="text-gray-900">
            {data.reduce((s, i) => s + (i.jumlah || i.jumlahSystem || 0), 0)}
          </strong></span>
          <span>💰 Total nilai: <strong className="text-gray-900">
            {formatRupiah(data.reduce((s, i) => s + (i.total || i.totalSystem || 0), 0))}
          </strong></span>
        </div>
      </div>
    </div>
  );
}