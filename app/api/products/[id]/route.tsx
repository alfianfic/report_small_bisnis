// app/api/products/[id]/route.ts

import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    const produk = await prisma.produk.findUnique({
      where: { id },
      include: {
        bahanBaku: {
          include: {
            bahanBaku: true,
          },
        },
      },
    });

    if (!produk) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'Produk tidak ditemukan',
      }, { status: 404 });
    }

    return NextResponse.json({
      status: '✅ Berhasil!',
      data: produk,
    });
  } catch (error: any) {
    console.error('Error fetching product:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { nama, sku, hpp, hargaJual, targetStok, resep } = body;

    // Validasi
    if (!nama || !sku || !hpp || !hargaJual) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'Semua field wajib diisi',
      }, { status: 400 });
    }

    // Cek SKU duplikat (kecuali dirinya sendiri)
    const existing = await prisma.produk.findFirst({
      where: {
        sku,
        NOT: { id },
      },
    });

    if (existing) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: `SKU "${sku}" sudah digunakan`,
      }, { status: 400 });
    }

    // Update produk dan resep
    const produk = await prisma.$transaction(async (tx) => {
      // Update produk
      await tx.produk.update({
        where: { id },
        data: {
          nama,
          sku,
          hpp: Number(hpp),
          hargaJual: Number(hargaJual),
          targetStok: Number(targetStok) || 0,
        },
      });

      // Hapus resep lama
      await tx.produkBahanBaku.deleteMany({
        where: { produkId: id },
      });

      // Create resep baru
      if (resep && resep.length > 0) {
        await tx.produkBahanBaku.createMany({
          data: resep.map((item: any) => ({
            produkId: id,
            bahanBakuId: item.bahanBakuId,
            qty: Number(item.qty),
          })),
        });
      }

      // Return produk dengan resep
      return await tx.produk.findUnique({
        where: { id },
        include: {
          bahanBaku: {
            include: {
              bahanBaku: true,
            },
          },
        },
      });
    });

    return NextResponse.json({
      status: '✅ Berhasil!',
      data: produk,
    });
  } catch (error: any) {
    console.error('Error updating product:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    await prisma.produk.delete({
      where: { id },
    });

    return NextResponse.json({
      status: '✅ Berhasil!',
      message: 'Produk berhasil dihapus',
    });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}