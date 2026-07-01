// app/api/products/route.ts

import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

// GET: Ambil semua produk aktif
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        masterData: {
          orderBy: { tanggalBerlaku: 'desc' },
          take: 1,
        },
      },
    });

    return NextResponse.json({
      status: '✅ Berhasil!',
      data: products,
    });
  } catch (error: any) {
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}