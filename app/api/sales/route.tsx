// app/api/sales/route.ts
import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const salesData = await prisma.dataPenjualan.findFirst({
      include: {
        realisasi: {
          orderBy: { hari: 'asc' },
        },
        riwayatBelanja: {
          orderBy: { tanggal: 'asc' },
        },
      },
    });

    if (!salesData) {
      return NextResponse.json({
        status: '❌ Data tidak ditemukan',
      }, { status: 404 });
    }

    return NextResponse.json({
      status: '✅ Berhasil!',
      data: salesData,
    });
  } catch (error: any) {
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}