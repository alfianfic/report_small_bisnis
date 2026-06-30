// app/components/dashboard/DashboardGrid.tsx

'use client';

import { useMemo } from 'react';
import StatCardGrid from './StatCardGrid';
import SalesChart from './SalesChart';
import PenjualanTable from './PenjualanTable';
import FilterBar from '../ui/FilterBar';        // ✅ Dari dashboard
import DashboardActions from './DashboardActions';
import { getDashboardCards } from '@/app/config/cards';

// Interface tetap sama...
interface DashboardGridProps {
  metrics: any;
  onOpenForm: () => void;
  onOpenBelanja: () => void;
  showTable: boolean;
  onToggleTable: () => void;
  tableData: any[];
  chartData: any[];
  targetHarian: number;
  hppPerPorsi: number;
  hargaJualPerPorsi: number;
  labaPerPorsi: number;
  currentWeek: number;
  onWeekChange: (week: number) => void;
  onFilterChange: (start: string, end: string) => void;
}

export default function DashboardGrid({ 
  metrics, 
  onOpenForm, 
  onOpenBelanja,
  showTable,
  onToggleTable,
  tableData,
  chartData,
  targetHarian,
  hppPerPorsi,
  hargaJualPerPorsi,
  labaPerPorsi,
  currentWeek,
  onWeekChange,
  onFilterChange,
}: DashboardGridProps) {
  
  const cards = useMemo(
    () => getDashboardCards(metrics, targetHarian),
    [metrics, targetHarian]
  );

  const todayDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div>
      <FilterBar
        currentWeek={currentWeek}
        onWeekChange={onWeekChange}
        onFilterChange={onFilterChange}
      />

      <StatCardGrid cards={cards} className="mt-6" />

      <div className="mt-6">
        <SalesChart
          data={chartData}
          title="📊 Grafik Penjualan & Pembelian"
          height={350}
        />
      </div>
      
      <div className="mt-6">
        <DashboardActions
          onOpenForm={onOpenForm}
          onOpenBelanja={onOpenBelanja}
          onToggleTable={onToggleTable}
          showTable={showTable}
          todayDate={todayDate}
        />
      </div>

      <div
        className={`
          transition-all duration-500 overflow-hidden
          ${showTable ? 'max-h-[600px] opacity-100 mt-6' : 'max-h-0 opacity-0'}
        `}
        aria-hidden={!showTable}
      >
        <PenjualanTable
          data={tableData}
          targetHarian={targetHarian}
          hppPerPorsi={hppPerPorsi}
          hargaJualPerPorsi={hargaJualPerPorsi}
          labaPerPorsi={labaPerPorsi}
          onEdit={() => {}}
          onDelete={() => {}}
        />
      </div>
    </div>
  );
}