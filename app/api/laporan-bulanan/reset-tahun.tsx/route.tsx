// app/api/laporan-bulanan/reset-tahun/route.ts

import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tahun } = body;

    if (!tahun) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'Parameter tahun wajib diisi',
      }, { status: 400 });
    }

    const startDate = new Date(Number(tahun), 0, 1);
    const endDate = new Date(Number(tahun), 11, 31, 23, 59, 59);

    // Ambil laporan tahun tersebut
    const laporanList = await prisma.laporanBulanan.findMany({
      where: {
        bulan: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    if (laporanList.length === 0) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: `Tidak ada laporan untuk tahun ${tahun}`,
      }, { status: 404 });
    }

    let resetCount = 0;

    for (const laporan of laporanList) {
      await prisma.laporanBulanan.update({
        where: { id: laporan.id },
        data: {
          qtyProduksi: 0,
          costPerPortion: 0,
          jumlahCost: 0,
          overhead: 0,
          gaji: 0,
          labaKotor: 0,
          profit: 0,
          updatedAt: new Date(),
        },
      });
      resetCount++;
    }

    return NextResponse.json({
      status: '✅ Berhasil!',
      message: `Berhasil reset ${resetCount} laporan untuk tahun ${tahun}`,
      metadata: {
        reset: resetCount,
        tahun,
      },
    });
  } catch (error: any) {
    console.error('Error resetting laporan:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}