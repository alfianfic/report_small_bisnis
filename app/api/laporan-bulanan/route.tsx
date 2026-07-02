// app/api/laporan-bulanan/route.ts

import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const data = await prisma.laporanBulanan.findMany({
      orderBy: [
        { bulan: 'asc' }, // ✅ ORDER BY BULAN
        { menu: 'asc' },
      ],
    });

    // Group by bulan (format string untuk display)
    const grouped = data.reduce((acc: any, item) => {
      const bulanKey = item.bulan.toISOString().substring(0, 7); // YYYY-MM
      const bulanDisplay = item.bulan.toLocaleDateString('id-ID', { 
        month: 'long', 
        year: 'numeric' 
      });
      
      if (!acc[bulanKey]) {
        acc[bulanKey] = {
          bulan: bulanDisplay,
          bulanKey,
          items: [],
          totalQty: 0,
          totalCost: 0,
          totalOverhead: 0,
          totalLabaKotor: 0,
          totalProfit: 0,
        };
      }
      
      acc[bulanKey].items.push(item);
      acc[bulanKey].totalQty += item.qtyProduksi;
      acc[bulanKey].totalCost += item.jumlahCost;
      acc[bulanKey].totalOverhead += item.overhead;
      acc[bulanKey].totalLabaKotor += item.labaKotor;
      acc[bulanKey].totalProfit += item.profit;
      
      return acc;
    }, {});

    // Convert to array and sort by bulanKey
    const summary = Object.values(grouped).sort((a: any, b: any) => 
      a.bulanKey.localeCompare(b.bulanKey)
    );

    return NextResponse.json({
      status: '✅ Berhasil!',
      data: summary,
      raw: data,
    });
  } catch (error: any) {
    console.error('Error fetching laporan bulanan:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}