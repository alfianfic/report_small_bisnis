// app/api/pembelian/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// ============================================
// HELPER: Update Stok Produk dari Bahan Baku
// ============================================
async function updateStokProdukDariBahanBaku() {
  try {
    const produkList = await prisma.produk.findMany({
      include: {
        bahanBaku: {
          include: {
            bahanBaku: true,
          },
        },
      },
    });

    const updates = [];

    for (const produk of produkList) {
      if (produk.bahanBaku.length === 0) {
        updates.push(
          prisma.produk.update({
            where: { id: produk.id },
            data: { stok: 0 },
          })
        );
        continue;
      }

      let maxProduk = Infinity;

      for (const item of produk.bahanBaku) {
        const stokBahan = Number(item.bahanBaku.stok);
        const qtyPerProduk = Number(item.qty);
        
        if (qtyPerProduk > 0) {
          const bisaDibuat = Math.floor(stokBahan / qtyPerProduk);
          maxProduk = Math.min(maxProduk, bisaDibuat);
        }
      }

      const stokBaru = maxProduk === Infinity ? 0 : maxProduk;
      
      updates.push(
        prisma.produk.update({
          where: { id: produk.id },
          data: { stok: stokBaru },
        })
      );
    }

    await Promise.all(updates);
    return { success: true, updated: updates.length };
  } catch (error) {
    console.error('❌ Error updating stok produk:', error);
    throw error;
  }
}

// ============================================
// DELETE
// ============================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'ID wajib diisi',
      }, { status: 400 });
    }

    // Cari data pembelian
    const pembelian = await prisma.$queryRaw<any[]>`
      SELECT * FROM "PembelianBahanBaku" WHERE id = ${id}
    `;

    if (!pembelian || pembelian.length === 0) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'Data tidak ditemukan',
      }, { status: 404 });
    }

    const item = pembelian[0];

    // TRANSACTION
    await prisma.$transaction(async (tx) => {
      // 1. Delete
      await tx.$executeRaw`
        DELETE FROM "PembelianBahanBaku" WHERE id = ${id}
      `;

      // 2. Restore stok bahan baku
      const bahanBaku = await tx.$queryRaw<any[]>`
        SELECT * FROM "BahanBaku" WHERE id = ${item.bahanBakuId}
      `;

      if (bahanBaku && bahanBaku.length > 0) {
        const bb = bahanBaku[0];
        const stokSaatIni = Number(bb.stok);
        const stokBaru = stokSaatIni - Number(item.qty);
        
        await tx.$executeRaw`
          UPDATE "BahanBaku" 
          SET stok = ${stokBaru}
          WHERE id = ${item.bahanBakuId}
        `;
      }
    });

    // Update stok produk
    await updateStokProdukDariBahanBaku();

    return NextResponse.json({
      status: '✅ Berhasil!',
      message: 'Data berhasil dihapus, stok produk diupdate',
    });
  } catch (error: any) {
    console.error('❌ Error deleting pembelian:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}