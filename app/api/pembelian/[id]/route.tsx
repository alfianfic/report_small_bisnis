// app/api/pembelian/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// ============================================
// HELPER: Update Laporan Bulanan (HANYA jumlahCost)
// ============================================
async function updateLaporanBulananCost(tanggal: Date) {
  try {
    const year = tanggal.getUTCFullYear();
    const month = tanggal.getUTCMonth() + 1;
    const bulanStr = `${year}-${String(month).padStart(2, '0')}`;
    const bulanDate = new Date(Date.UTC(year, month - 1, 1));
    
    console.log(`📊 Updating jumlahCost untuk ${bulanStr}`);

    const pembelianBahan = await prisma.$queryRaw<{ total: number }[]>`
      SELECT COALESCE(SUM(total), 0) as total
      FROM "PembelianBahanBaku"
      WHERE DATE_TRUNC('month', "tanggal") = DATE_TRUNC('month', ${bulanDate}::timestamp)
    `;

    const totalPembelianBahan = Number(pembelianBahan[0]?.total) || 0;

    const pembelianReguler = await prisma.$queryRaw<{ total: number }[]>`
      SELECT COALESCE(SUM(total), 0) as total
      FROM "Pembelian"
      WHERE DATE_TRUNC('month', "tanggal") = DATE_TRUNC('month', ${bulanDate}::timestamp)
    `;

    const totalPembelianReguler = Number(pembelianReguler[0]?.total) || 0;

    const totalCost = totalPembelianBahan + totalPembelianReguler;
    const costPerPortion = totalCost > 0 ? Math.round(totalCost / 1) : 0;

    const existing = await prisma.laporanBulanan.findFirst({
      where: {
        bulan: {
          equals: bulanDate,
        },
      },
    });

    if (existing) {
      await prisma.laporanBulanan.update({
        where: { id: existing.id },
        data: {
          jumlahCost: totalCost,
          costPerPortion: costPerPortion,
          updatedAt: new Date(),
        },
      });
      console.log(`✅ Laporan ${bulanStr} diupdate (jumlahCost = ${totalCost})`);
    } else {
      await prisma.laporanBulanan.create({
        data: {
          bulan: bulanDate,
          qtyProduksi: 0,
          costPerPortion: costPerPortion,
          jumlahCost: totalCost,
          overhead: 0,
          gaji: 0,
          labaKotor: 0,
          profit: 0,
        },
      });
      console.log(`✅ Laporan ${bulanStr} dibuat (jumlahCost = ${totalCost})`);
    }

    return { success: true, totalCost };
  } catch (error) {
    console.error('❌ Error updating laporan bulanan cost:', error);
    throw error;
  }
}

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
  context: any
) {
  try {
    const { id } = context.params;

    if (!id) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'ID wajib diisi',
      }, { status: 400 });
    }

    // ✅ Ambil source dari query parameter
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source');

    console.log(`🗑️ DELETE pembelian ID: ${id}, Source: ${source}`);

    // ========== Jika Bahan Baku ==========
    if (source === 'bahan_baku') {
      const pembelianBahan = await prisma.$queryRaw<any[]>`
        SELECT * FROM "PembelianBahanBaku" WHERE id = ${id}
      `;

      if (!pembelianBahan || pembelianBahan.length === 0) {
        return NextResponse.json({
          status: '❌ GAGAL',
          error: 'Data bahan baku tidak ditemukan',
        }, { status: 404 });
      }

      const item = pembelianBahan[0];
      const tanggalObj = item.tanggal;

      await prisma.$transaction(async (tx) => {
        // 1. Delete dari PembelianBahanBaku
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

      await updateStokProdukDariBahanBaku();
      await updateLaporanBulananCost(tanggalObj);

      return NextResponse.json({
        status: '✅ Berhasil!',
        message: 'Data bahan baku berhasil dihapus, stok produk & laporan diupdate',
      });
    }

    // ========== Jika Reguler ==========
    if (source === 'reguler') {
      const pembelianReguler = await prisma.$queryRaw<any[]>`
        SELECT * FROM "Pembelian" WHERE id = ${id}
      `;

      if (!pembelianReguler || pembelianReguler.length === 0) {
        return NextResponse.json({
          status: '❌ GAGAL',
          error: 'Data reguler tidak ditemukan',
        }, { status: 404 });
      }

      const item = pembelianReguler[0];
      const tanggalObj = item.tanggal;

      // ✅ Delete dari Pembelian (Reguler)
      await prisma.$executeRaw`
        DELETE FROM "Pembelian" WHERE id = ${id}
      `;

      // ✅ Update laporan bulanan (HANYA jumlahCost)
      await updateLaporanBulananCost(tanggalObj);

      return NextResponse.json({
        status: '✅ Berhasil!',
        message: 'Data reguler berhasil dihapus, laporan diupdate',
      });
    }

    // ========== Jika source tidak valid ==========
    return NextResponse.json({
      status: '❌ GAGAL',
      error: 'Parameter source tidak valid (harus "bahan_baku" atau "reguler")',
    }, { status: 400 });

  } catch (error: any) {
    console.error('❌ Error deleting pembelian:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}