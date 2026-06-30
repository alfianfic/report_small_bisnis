// app/components/dashboard/DashboardActions.tsx

'use client';

interface DashboardActionsProps {
  onOpenForm: () => void;
  onOpenBelanja: () => void;
  onToggleTable: () => void;
  showTable: boolean;
  todayDate?: string;
}

export default function DashboardActions({
  onOpenForm,
  onOpenBelanja,
  onToggleTable,
  showTable,
  todayDate,
}: DashboardActionsProps) {
  const today = todayDate || new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-3">
      {/* Info hari ini */}
      <div className="text-center">
        <p className="text-sm text-gray-500">
          📅 Input penjualan untuk tanggal: <span className="font-medium text-gray-700">{today}</span>
        </p>
        <p className="text-xs text-gray-400">
          Klik tombol di bawah untuk input penjualan atau belanja stok
        </p>
      </div>

      {/* Tombol Actions */}
      <div className="flex flex-wrap justify-center gap-3">
        <button
          onClick={onOpenForm}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md font-medium text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Input Penjualan
        </button>
        <button
          onClick={onOpenBelanja}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md font-medium text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          Belanja Stok
        </button>
        <button
          onClick={onToggleTable}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-500 hover:bg-gray-600 text-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md font-medium text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showTable ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
          </svg>
          {showTable ? 'Sembunyikan Tabel' : 'Lihat Tabel'}
        </button>
      </div>
    </div>
  );
}