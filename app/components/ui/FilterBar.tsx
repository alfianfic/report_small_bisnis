// app/components/ui/FilterBar.tsx

'use client';

import { useState, useEffect } from 'react';

interface FilterBarProps {
  onFilterChange: (startDate: string, endDate: string) => void;
  currentWeek: number;
  onWeekChange: (week: number) => void;
}

export default function FilterBar({ onFilterChange, currentWeek, onWeekChange }: FilterBarProps) {
  const [selectedDate, setSelectedDate] = useState('');

  // ✅ Dapatkan range minggu dari tanggal
  const getWeekRangeFromDate = (date: Date) => {
    const dayOfWeek = date.getDay(); // 0 = Minggu, 1 = Senin, ...
    const startOfWeek = new Date(date);
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startOfWeek.setDate(date.getDate() - diff);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return {
      start: startOfWeek,
      end: endOfWeek,
      startStr: startOfWeek.toISOString().split('T')[0],
      endStr: endOfWeek.toISOString().split('T')[0],
    };
  };

  // ✅ Dapatkan range minggu dari offset
  const getWeekRange = (weekOffset: number = 0) => {
    const now = new Date();
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + (weekOffset * 7));
    return getWeekRangeFromDate(targetDate);
  };

  // ✅ Format display
  const formatDisplay = (start: Date, end: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    };
    
    const startDay = start.toLocaleDateString('id-ID', { weekday: 'long' });
    const endDay = end.toLocaleDateString('id-ID', { weekday: 'long' });
    const startStr = start.toLocaleDateString('id-ID', options);
    const endStr = end.toLocaleDateString('id-ID', options);
    
    return `${startDay}, ${startStr} — ${endDay}, ${endStr}`;
  };

  // ✅ Update filter saat week berubah
  useEffect(() => {
    const range = getWeekRange(currentWeek);
    onFilterChange(range.startStr, range.endStr);
  }, [currentWeek]);

  const handleWeekChange = (direction: 'prev' | 'next') => {
    const newWeek = direction === 'prev' ? currentWeek - 1 : currentWeek + 1;
    onWeekChange(newWeek);
  };

  // ✅ Handler saat pilih tanggal
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    setSelectedDate(date);
    
    if (date) {
      const selected = new Date(date);
      const newRange = getWeekRangeFromDate(selected);
      const now = new Date();
      const diffDays = Math.floor((selected.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const newWeek = Math.round(diffDays / 7);
      onWeekChange(newWeek);
      onFilterChange(newRange.startStr, newRange.endStr);
    }
  };

  const range = getWeekRange(currentWeek);
  const displayText = formatDisplay(range.start, range.end);

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleWeekChange('prev')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Minggu sebelumnya"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <span className="text-sm font-medium text-gray-700 min-w-[260px] text-center whitespace-nowrap">
          {displayText}
        </span>
        
        <button
          onClick={() => handleWeekChange('next')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Minggu berikutnya"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-500 whitespace-nowrap">Cari minggu:</label>
        <input
          type="date"
          value={selectedDate}
          onChange={handleDateChange}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
        />
      </div>
    </div>
  );
}