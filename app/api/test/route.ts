// app/api/test/route.ts
import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const count = await prisma.dataPenjualan.count();
    return NextResponse.json({
      status: '✅ Koneksi BERHASIL!',
      data: count,
    });
  } catch (error: any) {
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}