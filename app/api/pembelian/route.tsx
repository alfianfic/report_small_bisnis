// app/api/pembelian/route.ts

import { prisma } from '@/app/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// ============================================
// HELPER: Update HPP Semua Produk dari Bahan Baku
// ============================================
async function updateAllHPP() {
  try {
    // Ambil semua produk dengan resepnya
    const produkList = await prisma.produk.findMany({
      include: {
        bahanBaku: {
          include: {
            bahanBaku: true,
          },
        },
      },
    });

    let updatedCount = 0;

    for (const produk of produkList) {
      if (produk.bahanBaku.length === 0) {
        continue;
      }

      // Hitung HPP = Σ (harga bahan baku × qty per produk)
      let totalHPP = 0;
      for (const item of produk.bahanBaku) {
        const hargaBahan = Number(item.bahanBaku.harga);
        const qtyPerProduk = Number(item.qty);
        totalHPP += Math.round(hargaBahan * qtyPerProduk);
      }

      // Update HPP produk
      await prisma.produk.update({
        where: { id: produk.id },
        data: { hpp: totalHPP },
      });

      console.log(`📦 Produk ${produk.nama}: HPP = ${totalHPP}`);
      updatedCount++;
    }

    console.log(`✅ HPP ${updatedCount} produk diupdate`);
    return { success: true, updated: updatedCount };
  } catch (error) {
    console.error('❌ Error updating HPP produk:', error);
    throw error;
  }
}

// ============================================
// HELPER: Recalculate Stok Bahan Baku dari Transaksi
// ============================================
async function recalculateStokBahanBaku() {
  try {
    const bahanBakuList = await prisma.bahanBaku.findMany();

    for (const bahan of bahanBakuList) {
      // Total pembelian bahan baku
      const pembelian = await prisma.$queryRaw<{ total: number }[]>`
        SELECT COALESCE(SUM(qty), 0) as total
        FROM "PembelianBahanBaku"
        WHERE "bahanBakuId" = ${bahan.id}
      `;
      const totalPembelian = Number(pembelian[0]?.total) || 0;

      // Total harga pembelian (untuk menghitung harga rata-rata)
      const totalBiaya = await prisma.$queryRaw<{ total: number }[]>`
        SELECT COALESCE(SUM(total), 0) as total
        FROM "PembelianBahanBaku"
        WHERE "bahanBakuId" = ${bahan.id}
      `;
      const totalBiayaPembelian = Number(totalBiaya[0]?.total) || 0;

      // Total penggunaan bahan baku (dari penjualan produk)
      const produkResep = await prisma.produkBahanBaku.findMany({
        where: { bahanBakuId: bahan.id },
        select: {
          produkId: true,
          qty: true,
        },
      });

      let totalPenggunaan = 0;
      for (const resep of produkResep) {
        const penjualan = await prisma.$queryRaw<{ total: number }[]>`
          SELECT COALESCE(SUM(qty), 0) as total
          FROM "Penjualan"
          WHERE "produkId" = ${resep.produkId}
        `;
        const totalPenjualanProduk = Number(penjualan[0]?.total) || 0;
        totalPenggunaan += totalPenjualanProduk * Number(resep.qty);
      }

      // Stok = Total Pembelian - Total Penggunaan
      const stokBaru = Math.max(0, totalPembelian - totalPenggunaan);

      // Harga rata-rata = total biaya / total pembelian (jika ada)
      const hargaRataRata = totalPembelian > 0 
        ? Math.round(totalBiayaPembelian / totalPembelian) 
        : 0;

      await prisma.bahanBaku.update({
        where: { id: bahan.id },
        data: { 
          stok: stokBaru,
          harga: hargaRataRata, // ✅ Update harga rata-rata
        },
      });

      console.log(`📦 Bahan ${bahan.nama}: stok = ${stokBaru}, harga = ${hargaRataRata}`);
    }

    return { success: true };
  } catch (error) {
    console.error('❌ Error recalculate stok bahan baku:', error);
    throw error;
  }
}

// ============================================
// HELPER: Recalculate Stok Produk dari Bahan Baku
// ============================================
async function recalculateStokProduk() {
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

    for (const produk of produkList) {
      if (produk.bahanBaku.length === 0) {
        await prisma.produk.update({
          where: { id: produk.id },
          data: { stok: 0 },
        });
        continue;
      }

      // Hitung maksimum produk yang bisa dibuat dari stok bahan baku
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

      // Kurangi dengan total penjualan produk
      const penjualan = await prisma.$queryRaw<{ total: number }[]>`
        SELECT COALESCE(SUM(qty), 0) as total
        FROM "Penjualan"
        WHERE "produkId" = ${produk.id}
      `;
      const totalPenjualan = Number(penjualan[0]?.total) || 0;

      const stokAkhir = Math.max(0, stokBaru - totalPenjualan);

      await prisma.produk.update({
        where: { id: produk.id },
        data: { stok: stokAkhir },
      });
    }

    return { success: true };
  } catch (error) {
    console.error('❌ Error recalculate stok produk:', error);
    throw error;
  }
}

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
      const profitBaru = existing.labaKotor - totalCost - existing.gaji - existing.overhead;

      await prisma.laporanBulanan.update({
        where: { id: existing.id },
        data: {
          jumlahCost: totalCost,
          costPerPortion: costPerPortion,
          profit: profitBaru,
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
        });

        // ✅ 1. Recalculate stok bahan baku & harga rata-rata
        await recalculateStokBahanBaku();

        // ✅ 2. Update HPP semua produk
        await updateAllHPP();

        // ✅ 3. Recalculate stok produk
        await recalculateStokProduk();

        // ✅ 4. Update laporan
        await updateLaporanBulananCost(tanggalObj);

        return NextResponse.json({
          status: '✅ Berhasil!',
          message: 'Pembelian bahan baku berhasil, stok, HPP, & laporan diupdate',
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

    // Cek apakah data ada di PembelianBahanBaku atau Pembelian
    const pembelianBahan = await prisma.$queryRaw<any[]>`
      SELECT * FROM "PembelianBahanBaku" WHERE id = ${id}
    `;
    const pembelianReguler = await prisma.$queryRaw<any[]>`
      SELECT * FROM "Pembelian" WHERE id = ${id}
    `;

    if ((!pembelianBahan || pembelianBahan.length === 0) &&
      (!pembelianReguler || pembelianReguler.length === 0)) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'Data tidak ditemukan',
      }, { status: 404 });
    }

    let tanggalObj: Date;

    if (pembelianBahan && pembelianBahan.length > 0) {
      const item = pembelianBahan[0];
      tanggalObj = item.tanggal;

      await prisma.$executeRaw`
        DELETE FROM "PembelianBahanBaku" WHERE id = ${id}
      `;

      // ✅ 1. Recalculate stok bahan baku & harga rata-rata
      await recalculateStokBahanBaku();

      // ✅ 2. Update HPP semua produk
      await updateAllHPP();

      // ✅ 3. Recalculate stok produk
      await recalculateStokProduk();
    } else {
      const item = pembelianReguler[0];
      tanggalObj = item.tanggal;

      await prisma.$executeRaw`
        DELETE FROM "Pembelian" WHERE id = ${id}
      `;
    }

    // ✅ Update laporan
    await updateLaporanBulananCost(tanggalObj);

    return NextResponse.json({
      status: '✅ Berhasil!',
      message: 'Data berhasil dihapus, stok, HPP, & laporan diupdate',
    });
  } catch (error: any) {
    console.error('❌ Error deleting pembelian:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}