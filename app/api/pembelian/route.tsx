// app/api/pembelian/route.ts

import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

// ============================================
// HELPER: Update Stok Produk dari Bahan Baku
// ============================================
async function updateStokProdukDariBahanBaku() {
  try {
    // 1. Ambil semua produk dengan resepnya
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
        // Produk tanpa resep -> stok tetap 0
        updates.push(
          prisma.produk.update({
            where: { id: produk.id },
            data: { stok: 0 },
          })
        );
        continue;
      }

      // 2. Hitung maksimum produk yang bisa dibuat dari stok bahan baku saat ini
      let maxProduk = Infinity;

      for (const item of produk.bahanBaku) {
        const stokBahan = Number(item.bahanBaku.stok);
        const qtyPerProduk = Number(item.qty);
        
        if (qtyPerProduk > 0) {
          const bisaDibuat = Math.floor(stokBahan / qtyPerProduk);
          maxProduk = Math.min(maxProduk, bisaDibuat);
        }
      }

      // 3. Update stok produk
      const stokBaru = maxProduk === Infinity ? 0 : maxProduk;
      
      updates.push(
        prisma.produk.update({
          where: { id: produk.id },
          data: { stok: stokBaru },
        })
      );

      console.log(`📦 Produk ${produk.nama}: stok = ${stokBaru} (dari bahan baku)`);
    }

    await Promise.all(updates);
    console.log(`✅ Stok ${updates.length} produk diupdate dari bahan baku`);

    return { success: true, updated: updates.length };
  } catch (error) {
    console.error('❌ Error updating stok produk:', error);
    throw error;
  }
}

// ============================================
// GET: Ambil semua data pembelian
// ============================================
export async function GET() {
  try {
    // 1. Ambil dari PembelianBahanBaku
    const pembelianBahan = await prisma.$queryRaw<any[]>`
      SELECT 
        pbb.*,
        bb.nama as bahan_nama,
        bb.satuan as bahan_satuan
      FROM "PembelianBahanBaku" pbb
      LEFT JOIN "BahanBaku" bb ON pbb."bahanBakuId" = bb.id
      ORDER BY pbb."tanggal" DESC
    `;

    // 2. Ambil dari Pembelian
    const pembelianReguler = await prisma.$queryRaw<any[]>`
      SELECT * FROM "Pembelian" 
      ORDER BY "tanggal" DESC
    `;

    // 3. Format data
    const allData = [];

    for (const item of pembelianBahan) {
      allData.push({
        id: item.id,
        tanggal: item.tanggal,
        nama: item.bahan_nama || 'Unknown',
        detail: `Pembelian ${item.bahan_nama || 'Unknown'}`,
        qty: item.qty,
        harga: item.harga,
        total: item.total,
        source: 'bahan_baku',
        satuan: item.bahan_satuan || '-',
      });
    }

    for (const item of pembelianReguler) {
      allData.push({
        id: item.id,
        tanggal: item.tanggal,
        nama: item.nama,
        detail: item.detail,
        qty: item.qty,
        harga: item.harga,
        total: item.total,
        source: 'reguler',
        satuan: '-',
      });
    }

    // Sort by tanggal
    allData.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

    return NextResponse.json({
      status: '✅ Berhasil!',
      data: allData,
      metadata: {
        total: allData.length,
        fromBahanBaku: pembelianBahan.length,
        fromReguler: pembelianReguler.length,
      },
    });
  } catch (error: any) {
    console.error('❌ Error fetching pembelian:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}

// ============================================
// POST: Tambah pembelian baru
// ============================================
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tanggal, nama, detail, qty, hargaTotal, total, bahanBakuId, isBahanBaku } = body;

    console.log('📝 POST /api/pembelian - Payload:', { 
      tanggal, nama, qty, hargaTotal, total, bahanBakuId, isBahanBaku 
    });

    // Validasi
    if (!tanggal || !nama || !qty || !hargaTotal) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'Tanggal, nama, qty, dan hargaTotal wajib diisi',
      }, { status: 400 });
    }

    const qtyNum = Number(qty);
    const hargaTotalNum = Number(hargaTotal);

    if (isNaN(qtyNum) || qtyNum <= 0) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'Qty harus lebih dari 0',
      }, { status: 400 });
    }

    if (isNaN(hargaTotalNum) || hargaTotalNum <= 0) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'Harga Total harus lebih dari 0',
      }, { status: 400 });
    }

    const tanggalObj = new Date(tanggal);

    // Jika pembelian bahan baku
    if (isBahanBaku && bahanBakuId) {
      try {
        // Cek bahan baku
        const bahanBaku = await prisma.$queryRaw<any[]>`
          SELECT * FROM "BahanBaku" WHERE id = ${bahanBakuId}
        `;

        if (!bahanBaku || bahanBaku.length === 0) {
          return NextResponse.json({
            status: '❌ GAGAL',
            error: 'Bahan baku tidak ditemukan',
          }, { status: 404 });
        }

        const item = bahanBaku[0];
        const hargaPerSatuan = Math.round(hargaTotalNum / qtyNum);

        // ✅ TRANSACTION: Insert pembelian, update stok bahan baku, update stok produk
        await prisma.$transaction(async (tx) => {
          // 1. Insert ke PembelianBahanBaku
          await tx.$executeRaw`
            INSERT INTO "PembelianBahanBaku" (
              id, "tanggal", "bahanBakuId", qty, harga, total, "createdAt", "updatedAt"
            ) VALUES (
              gen_random_uuid()::text, 
              ${tanggalObj}::timestamp,
              ${bahanBakuId},
              ${qtyNum},
              ${hargaPerSatuan},
              ${hargaTotalNum},
              NOW(),
              NOW()
            )
          `;

          // 2. Update stok bahan baku
          const totalStokLama = Number(item.stok);
          const totalHargaLama = totalStokLama * Number(item.harga);
          const totalStokBaru = totalStokLama + qtyNum;
          const totalHargaBaru = totalHargaLama + hargaTotalNum;
          const hargaRataRataBaru = totalStokBaru > 0 ? Math.round(totalHargaBaru / totalStokBaru) : 0;

          await tx.$executeRaw`
            UPDATE "BahanBaku" 
            SET stok = ${totalStokBaru}, harga = ${hargaRataRataBaru}
            WHERE id = ${bahanBakuId}
          `;

          console.log('✅ Stok bahan baku updated');
        });

        // ✅ UPDATE STOK PRODUK (di luar transaction atau di dalam)
        await updateStokProdukDariBahanBaku();

        return NextResponse.json({
          status: '✅ Berhasil!',
          message: 'Pembelian bahan baku berhasil, stok produk diupdate',
          data: {
            hargaPerSatuan,
            total: hargaTotalNum,
          },
        });
      } catch (error: any) {
        console.error('❌ Error processing bahan baku:', error);
        return NextResponse.json({
          status: '❌ GAGAL',
          error: 'Gagal memproses pembelian bahan baku',
          detail: error.message,
        }, { status: 500 });
      }
    } 
    // Pembelian reguler
    else {
      try {
        await prisma.$executeRaw`
          INSERT INTO "Pembelian" (
            id, tanggal, nama, detail, qty, harga, total, "createdAt", "updatedAt"
          ) VALUES (
            gen_random_uuid()::text,
            ${tanggalObj}::timestamp,
            ${nama},
            ${detail || null},
            ${qtyNum},
            ${Math.round(hargaTotalNum / qtyNum)},
            ${hargaTotalNum},
            NOW(),
            NOW()
          )
        `;

        console.log('✅ Pembelian created');

        return NextResponse.json({
          status: '✅ Berhasil!',
          message: 'Pembelian berhasil ditambahkan',
        });
      } catch (error: any) {
        console.error('❌ Error creating regular purchase:', error);
        return NextResponse.json({
          status: '❌ GAGAL',
          error: 'Gagal menyimpan pembelian reguler',
          detail: error.message,
        }, { status: 500 });
      }
    }
  } catch (error: any) {
    console.error('❌ Error creating pembelian:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message || 'Terjadi kesalahan saat menyimpan data',
    }, { status: 500 });
  }
}

// ============================================
// DELETE: Hapus pembelian
// ============================================
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'ID wajib diisi',
      }, { status: 400 });
    }

    // Cari data pembelian yang akan dihapus
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

    // ✅ TRANSACTION: Delete pembelian, restore stok bahan baku, update stok produk
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

      console.log('✅ Stok bahan baku restored');
    });

    // ✅ UPDATE STOK PRODUK
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