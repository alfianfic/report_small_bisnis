// app/api/asset/update-laporan/route.ts

import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Ambil total overhead dari Asset
    const overheadData = await prisma.$queryRaw<{ total: number }[]>`
      SELECT COALESCE(SUM("perMonth"), 0) as total
      FROM "Asset"
      WHERE status != 'Rusak'
    `;

    const defaultOverhead = Number(overheadData[0]?.total) || 0;

    // Ambil semua laporan
    const laporanList = await prisma.laporanBulanan.findMany();

    let updatedCount = 0;

    for (const laporan of laporanList) {
      const labaKotor = laporan.labaKotor;
      const gaji = laporan.gaji;
      const profitBaru = labaKotor - gaji - defaultOverhead;

      await prisma.laporanBulanan.update({
        where: { id: laporan.id },
        data: {
          overhead: defaultOverhead,
          profit: profitBaru,
          updatedAt: new Date(),
        },
      });
      updatedCount++;
    }

    return NextResponse.json({
      status: '✅ Berhasil!',
      message: `Berhasil update ${updatedCount} laporan`,
      metadata: {
        updated: updatedCount,
        defaultOverhead,
      },
    });
  } catch (error: any) {
    console.error('Error updating laporan:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}