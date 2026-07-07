// app/api/pembelian/[id]/route.ts

import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

// Definisikan tipe untuk hasil query
interface BahanBakuItem {
  id: string;
  nama: string;
  satuan: string;
  harga: number;
  stok: number;
  stokMinimal: number;
  createdAt: Date;
  updatedAt: Date;
}

interface PembelianBahanItem {
  id: string;
  tanggal: Date;
  bahanBakuId: string;
  qty: number;
  harga: number;
  total: number;
  createdAt: Date;
  updatedAt: Date;
  bahanBaku?: BahanBakuItem;
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    console.log(`🗑️ DELETE /api/pembelian/${id}`);

    // 1. Cek apakah data ada di PembelianBahanBaku
    const bahanBaku = await prisma.$queryRaw<PembelianBahanItem[]>`
      SELECT pbb.*, bb.* 
      FROM "PembelianBahanBaku" pbb
      LEFT JOIN "BahanBaku" bb ON pbb."bahanBakuId" = bb.id
      WHERE pbb.id = ${id}
    `;

    if (bahanBaku && bahanBaku.length > 0) {
      const item = bahanBaku[0];
      
      // Rollback stok
      if (item.bahanBakuId) {
        const bahan = await prisma.$queryRaw<BahanBakuItem[]>`
          SELECT * FROM "BahanBaku" WHERE id = ${item.bahanBakuId}
        `;
        
        if (bahan && bahan.length > 0) {
          const stokLama = Number(bahan[0].stok) - Number(item.qty);
          const hargaLama = stokLama > 0 
            ? Math.round(((Number(bahan[0].stok) * Number(bahan[0].harga)) - Number(item.total)) / stokLama)
            : 0;

          await prisma.$executeRaw`
            UPDATE "BahanBaku" 
            SET stok = ${Math.max(0, stokLama)}, harga = ${Math.max(0, hargaLama)}
            WHERE id = ${item.bahanBakuId}
          `;
        }
      }

      // Hapus dari PembelianBahanBaku
      await prisma.$executeRaw`
        DELETE FROM "PembelianBahanBaku" WHERE id = ${id}
      `;

      return NextResponse.json({
        status: '✅ Berhasil!',
        message: 'Data pembelian bahan baku berhasil dihapus',
      });
    }

    // 2. Jika tidak ada di PembelianBahanBaku, hapus dari Pembelian
    await prisma.$executeRaw`
      DELETE FROM "Pembelian" WHERE id = ${id}
    `;

    return NextResponse.json({
      status: '✅ Berhasil!',
      message: 'Data pembelian berhasil dihapus',
    });
  } catch (error: any) {
    console.error('❌ Error deleting pembelian:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}