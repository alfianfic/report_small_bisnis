// app/api/laporan-bulanan/override-overhead/route.ts

import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

// ============================================
// GET: Ambil semua laporan dengan default overhead
// ============================================
export async function GET() {
  try {
    // Ambil total overhead dari Asset
    const overheadData = await prisma.$queryRaw<{ total: number }[]>`
      SELECT COALESCE(SUM("perMonth"), 0) as total
      FROM "Asset"
      WHERE status != 'Rusak'
    `;

    const defaultOverhead = Number(overheadData[0]?.total) || 0;

    // Ambil semua laporan
    const laporan = await prisma.laporanBulanan.findMany({
      orderBy: { bulan: 'asc' },
    });

    // Format data
    const formattedData = laporan.map(item => ({
      id: item.id,
      bulan: item.bulan,
      bulanStr: `${item.bulan.getFullYear()}-${String(item.bulan.getMonth() + 1).padStart(2, '0')}`,
      qtyProduksi: item.qtyProduksi,
      costPerPortion: item.costPerPortion,
      jumlahCost: item.jumlahCost,
      overhead: item.overhead,
      gaji: item.gaji,
      labaKotor: item.labaKotor,
      profit: item.profit,
      defaultOverhead: defaultOverhead,
      isOverridden: item.overhead !== defaultOverhead,
    }));

    return NextResponse.json({
      status: '✅ Berhasil!',
      data: formattedData,
      metadata: {
        defaultOverhead,
        total: laporan.length,
      },
    });
  } catch (error: any) {
    console.error('Error fetching laporan:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}

// ============================================
// POST: Override overhead per bulan
// ============================================
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bulan, overhead } = body;

    if (!bulan) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'Bulan wajib diisi (format: YYYY-MM)',
      }, { status: 400 });
    }

    // Parse bulan
    const [year, month] = bulan.split('-').map(Number);
    const bulanDate = new Date(year, month - 1, 1);

    // Cari laporan
    const existing = await prisma.laporanBulanan.findFirst({
      where: {
        bulan: {
          equals: bulanDate,
        },
      },
    });

    if (!existing) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: `Laporan untuk ${bulan} tidak ditemukan`,
      }, { status: 404 });
    }

    // Update overhead
    const overheadNum = Number(overhead) || 0;
    const newProfit = existing.labaKotor - existing.gaji - overheadNum;

    const updated = await prisma.laporanBulanan.update({
      where: { id: existing.id },
      data: {
        overhead: overheadNum,
        profit: newProfit,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      status: '✅ Berhasil!',
      message: `Overhead untuk ${bulan} diupdate menjadi ${overheadNum}`,
      data: updated,
    });
  } catch (error: any) {
    console.error('Error overriding overhead:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}