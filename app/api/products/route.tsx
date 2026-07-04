// app/api/products/route.ts

import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

// GET: Ambil semua produk aktif
export async function GET() {
  try {
    const products = await prisma.produk.findMany({
      where: { isActive: true },
      orderBy: { nama: 'asc' },
      select: {
        id: true,
        nama: true,
        sku: true,
        hpp: true,
        hargaJual: true,
        stok: true,
      },
    });

    return NextResponse.json({
      status: '✅ Berhasil!',
      data: products,
      count: products.length,
    });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}