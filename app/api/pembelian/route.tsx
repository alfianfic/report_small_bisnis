// app/api/pembelian/route.ts

import { prisma } from '@/app/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// ============================================
// HELPER: Update Laporan Bulanan (HANYA jumlahCost)
// ============================================
async function updateLaporanBulananCost(tanggal: Date) {
  try {
    // ✅ Ambil tahun & bulan dari tanggal (UTC)
    const year = tanggal.getUTCFullYear();
    const month = tanggal.getUTCMonth() + 1;
    const bulanStr = `${year}-${String(month).padStart(2, '0')}`;

    // ✅ Buat tanggal bulan dalam UTC
    const bulanDate = new Date(Date.UTC(year, month - 1, 1));

    console.log(`📊 Updating jumlahCost untuk ${bulanStr}`);

    // ========== 1. Ambil total pembelian bahan baku ==========
    const pembelianBahan = await prisma.$queryRaw<{ total: number }[]>`
      SELECT COALESCE(SUM(total), 0) as total
      FROM "PembelianBahanBaku"
      WHERE DATE_TRUNC('month', "tanggal") = DATE_TRUNC('month', ${bulanDate}::timestamp)
    `;

    const totalPembelianBahan = Number(pembelianBahan[0]?.total) || 0;

    // ========== 2. Ambil total pembelian reguler ==========
    const pembelianReguler = await prisma.$queryRaw<{ total: number }[]>`
      SELECT COALESCE(SUM(total), 0) as total
      FROM "Pembelian"
      WHERE DATE_TRUNC('month', "tanggal") = DATE_TRUNC('month', ${bulanDate}::timestamp)
    `;

    const totalPembelianReguler = Number(pembelianReguler[0]?.total) || 0;

    // ========== 3. Hitung total cost ==========
    const totalCost = totalPembelianBahan + totalPembelianReguler;
    const costPerPortion = totalCost > 0 ? Math.round(totalCost / 1) : 0; // Sementara

    // ========== 4. Cari laporan bulan tersebut ==========
    const existing = await prisma.laporanBulanan.findFirst({
      where: {
        bulan: {
          equals: bulanDate,
        },
      },
    });

    if (existing) {
      // ✅ UPDATE: HANYA jumlahCost & costPerPortion
      const profitBaru = existing.labaKotor - totalCost - existing.gaji - existing.overhead;

      await prisma.laporanBulanan.update({
        where: { id: existing.id },
        data: {
          jumlahCost: totalCost,
          costPerPortion: costPerPortion,
          profit: profitBaru,  // ✅ Update profit juga
          updatedAt: new Date(),
        },
      });
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
          profit: 0,  // ✅ profit = 0 (belum ada pendapatan)
        },
      });
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
// GET: Ambil semua data pembelian
// ============================================
export async function GET() {
  try {
    const pembelianBahan = await prisma.$queryRaw<any[]>`
      SELECT 
        pbb.*,
        bb.nama as bahan_nama,
        bb.satuan as bahan_satuan
      FROM "PembelianBahanBaku" pbb
      LEFT JOIN "BahanBaku" bb ON pbb."bahanBakuId" = bb.id
      ORDER BY pbb."tanggal" DESC
    `;

    const pembelianReguler = await prisma.$queryRaw<any[]>`
      SELECT * FROM "Pembelian" 
      ORDER BY "tanggal" DESC
    `;

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

    // ✅ Buat tanggal dalam UTC
    const [year, month, day] = tanggal.split('-').map(Number);
    const tanggalObj = new Date(Date.UTC(year, month - 1, day));

    // Jika pembelian bahan baku
    if (isBahanBaku && bahanBakuId) {
      try {
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

        // ✅ UPDATE STOK PRODUK
        await updateStokProdukDariBahanBaku();

        // ✅ UPDATE LAPORAN BULANAN (HANYA jumlahCost)
        await updateLaporanBulananCost(tanggalObj);

        return NextResponse.json({
          status: '✅ Berhasil!',
          message: 'Pembelian bahan baku berhasil, stok produk & laporan diupdate',
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

        // ✅ UPDATE LAPORAN BULANAN (HANYA jumlahCost)
        await updateLaporanBulananCost(tanggalObj);

        return NextResponse.json({
          status: '✅ Berhasil!',
          message: 'Pembelian berhasil ditambahkan, laporan diupdate',
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