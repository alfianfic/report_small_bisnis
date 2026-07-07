// app/api/products/route.ts

import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const data = await prisma.produk.findMany({
      include: {
        bahanBaku: {
          include: {
            bahanBaku: true,
          },
        },
      },
      orderBy: { nama: 'asc' },
    });

    // Hitung ulang HPP dari resep untuk validasi
    const produkWithHPP = data.map(produk => {
      let calculatedHPP = 0;
      for (const item of produk.bahanBaku) {
        calculatedHPP += Math.round(item.qty * item.bahanBaku.harga);
      }
      
      return {
        ...produk,
        calculatedHPP,
        hppDiff: calculatedHPP - produk.hpp,
      };
    });

    return NextResponse.json({
      status: '✅ Berhasil!',
      data: produkWithHPP,
    });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nama, sku, hpp, hargaJual, targetStok, resep } = body;

    // Validasi
    if (!nama || !sku || !hpp || !hargaJual) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'Semua field wajib diisi',
      }, { status: 400 });
    }

    // Cek SKU duplikat
    const existing = await prisma.produk.findUnique({
      where: { sku },
    });

    if (existing) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: `SKU "${sku}" sudah digunakan`,
      }, { status: 400 });
    }

    // Create produk dengan resep
    const produk = await prisma.produk.create({
      data: {
        nama,
        sku,
        hpp: Number(hpp),
        hargaJual: Number(hargaJual),
        targetStok: Number(targetStok) || 0,
        isActive: true,
        bahanBaku: {
          create: resep?.map((item: any) => ({
            bahanBakuId: item.bahanBakuId,
            qty: Number(item.qty),
          })) || [],
        },
      },
      include: {
        bahanBaku: {
          include: {
            bahanBaku: true,
          },
        },
      },
    });

    return NextResponse.json({
      status: '✅ Berhasil!',
      data: produk,
    });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}