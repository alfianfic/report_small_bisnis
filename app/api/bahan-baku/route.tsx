// app/api/bahan-baku/route.ts

import { prisma } from '@/app/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// ============================================
// HELPER: Update Stok Minimal Bahan Baku dari Target Produk
// ============================================
async function updateStokMinimalBahanBaku() {
  try {
    // 1. Ambil semua produk dengan target stok > 0
    const produkList = await prisma.produk.findMany({
      where: {
        targetStok: {
          gt: 0,
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

    // 2. Hitung kebutuhan bahan baku per produk
    const kebutuhanBahan: Record<string, number> = {};

    for (const produk of produkList) {
      const targetQty = Number(produk.targetStok);

      for (const item of produk.bahanBaku) {
        const bahanId = item.bahanBakuId;
        const qtyPerProduk = Number(item.qty);
        const totalKebutuhan = targetQty * qtyPerProduk;

        if (!kebutuhanBahan[bahanId]) {
          kebutuhanBahan[bahanId] = 0;
        }
        kebutuhanBahan[bahanId] += totalKebutuhan;
      }
    }

    // 3. Update stok minimal bahan baku
    const bahanBakuList = await prisma.bahanBaku.findMany();
    let updatedCount = 0;

    for (const bahan of bahanBakuList) {
      const kebutuhan = kebutuhanBahan[bahan.id] || 0;
      const stokMinimalBaru = Math.ceil(kebutuhan); // Pembulatan ke atas

      await prisma.bahanBaku.update({
        where: { id: bahan.id },
        data: {
          stokMinimal: stokMinimalBaru,
        },
      });

      console.log(`📦 Bahan ${bahan.nama}: stok minimal = ${stokMinimalBaru} (dari target produk)`);
      updatedCount++;
    }

    console.log(`✅ Stok minimal ${updatedCount} bahan baku diupdate`);
    return { success: true, updated: updatedCount };
  } catch (error) {
    console.error('❌ Error updating stok minimal bahan baku:', error);
    throw error;
  }
}

// ============================================
// HELPER: Update Stok Bahan Baku dari Transaksi
// ============================================
async function updateStokBahanBaku() {
  try {
    const bahanBakuList = await prisma.bahanBaku.findMany();

    for (const bahan of bahanBakuList) {
      // 1. Total pembelian bahan baku
      const pembelian = await prisma.$queryRaw<{ total: number }[]>`
        SELECT COALESCE(SUM(qty), 0) as total
        FROM "PembelianBahanBaku"
        WHERE "bahanBakuId" = ${bahan.id}
      `;
      const totalPembelian = Number(pembelian[0]?.total) || 0;

      // 2. Total biaya pembelian (untuk harga rata-rata)
      const totalBiaya = await prisma.$queryRaw<{ total: number }[]>`
        SELECT COALESCE(SUM(total), 0) as total
        FROM "PembelianBahanBaku"
        WHERE "bahanBakuId" = ${bahan.id}
      `;
      const totalBiayaPembelian = Number(totalBiaya[0]?.total) || 0;

      // 3. Total penggunaan bahan baku dari penjualan produk
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

      // 4. Hitung stok baru
      const stokBaru = Math.max(0, totalPembelian - totalPenggunaan);

      // 5. Harga rata-rata
      const hargaRataRata = totalPembelian > 0
        ? Math.round(totalBiayaPembelian / totalPembelian)
        : 0;

      await prisma.bahanBaku.update({
        where: { id: bahan.id },
        data: {
          stok: Math.round(stokBaru * 1000) / 1000,
          harga: hargaRataRata,
        },
      });

      console.log(`📦 Bahan ${bahan.nama}: stok=${stokBaru}, harga=${hargaRataRata}`);
    }

    return { success: true, updated: bahanBakuList.length };
  } catch (error) {
    console.error('❌ Error updating stok bahan baku:', error);
    throw error;
  }
}

// ============================================
// HELPER: Update Stok Produk dari Bahan Baku
// ============================================
async function updateStokProduk() {
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

      // Hitung maksimum produk yang bisa dibuat
      let maxProduk = Infinity;
      for (const item of produk.bahanBaku) {
        const stokBahan = Number(item.bahanBaku.stok);
        const qtyPerProduk = Number(item.qty);
        if (qtyPerProduk > 0) {
          const bisaDibuat = Math.floor((stokBahan / qtyPerProduk) + 0.0000001);
          maxProduk = Math.min(maxProduk, bisaDibuat);
        }
      }

      const stokBaru = maxProduk === Infinity ? 0 : maxProduk;

      // Kurangi dengan total penjualan
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

      console.log(`📦 Produk ${produk.nama}: stok=${stokAkhir}`);
    }

    return { success: true, updated: produkList.length };
  } catch (error) {
    console.error('❌ Error updating stok produk:', error);
    throw error;
  }
}

// ============================================
// HELPER: Update HPP Produk
// ============================================
async function updateHPPProduk() {
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

    let updatedCount = 0;

    for (const produk of produkList) {
      if (produk.bahanBaku.length === 0) continue;

      let totalHPP = 0;
      for (const item of produk.bahanBaku) {
        const hargaBahan = Number(item.bahanBaku.harga);
        const qtyPerProduk = Number(item.qty);
        totalHPP += Math.round(hargaBahan * qtyPerProduk);
      }

      await prisma.produk.update({
        where: { id: produk.id },
        data: { hpp: totalHPP },
      });

      updatedCount++;
    }

    return { success: true, updated: updatedCount };
  } catch (error) {
    console.error('❌ Error updating HPP produk:', error);
    throw error;
  }
}

// ============================================
// HELPER: Update Semua (Stok + HPP + Stok Minimal)
// ============================================
async function updateAll() {
  try {
    console.log('🔄 Mulai update semua data...');

    // 1. Update stok bahan baku
    const resultBahan = await updateStokBahanBaku();
    console.log(`✅ Stok bahan baku: ${resultBahan.updated} bahan diupdate`);

    // 2. Update HPP produk
    const resultHPP = await updateHPPProduk();
    console.log(`✅ HPP produk: ${resultHPP.updated} produk diupdate`);

    // 3. Update stok produk
    const resultProduk = await updateStokProduk();
    console.log(`✅ Stok produk: ${resultProduk.updated} produk diupdate`);

    // 4. Update stok minimal bahan baku dari target produk
    const resultMinimal = await updateStokMinimalBahanBaku();
    console.log(`✅ Stok minimal: ${resultMinimal.updated} bahan diupdate`);

    return {
      success: true,
      metadata: {
        stokBahanBaku: resultBahan.updated,
        hppProduk: resultHPP.updated,
        stokProduk: resultProduk.updated,
        stokMinimal: resultMinimal.updated,
      },
    };
  } catch (error) {
    console.error('❌ Error updating all:', error);
    throw error;
  }
}

// ============================================
// GET: Ambil semua bahan baku
// ============================================
export async function GET() {
  try {
    const bahanBaku = await prisma.bahanBaku.findMany({
      orderBy: { nama: 'asc' },
    });

    return NextResponse.json({
      status: '✅ Berhasil!',
      data: bahanBaku,
      count: bahanBaku.length,
    });
  } catch (error: any) {
    console.error('Error fetching bahan baku:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}

// ============================================
// POST: Tambah bahan baku baru
// ============================================
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nama, satuan, harga, stokMinimal } = body;

    if (!nama || !satuan || !harga) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'Nama, satuan, dan harga wajib diisi',
      }, { status: 400 });
    }

    const existing = await prisma.bahanBaku.findUnique({
      where: { nama },
    });

    if (existing) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: `Bahan baku "${nama}" sudah ada`,
      }, { status: 400 });
    }

    const bahanBaku = await prisma.bahanBaku.create({
      data: {
        nama,
        satuan,
        harga: Number(harga),
        stok: 0,
        stokMinimal: Number(stokMinimal) || 0,
      },
    });

    return NextResponse.json({
      status: '✅ Berhasil!',
      data: bahanBaku,
      message: `Bahan baku "${nama}" berhasil ditambahkan`,
    });
  } catch (error: any) {
    console.error('Error creating bahan baku:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}

// ============================================
// PUT: Update bahan baku
// ============================================
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, nama, satuan, harga, stokMinimal } = body;

    if (!id) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'ID wajib diisi',
      }, { status: 400 });
    }

    const bahanBaku = await prisma.bahanBaku.update({
      where: { id },
      data: {
        nama,
        satuan,
        harga: Number(harga),
        stokMinimal: Number(stokMinimal) || 0,
      },
    });

    return NextResponse.json({
      status: '✅ Berhasil!',
      data: bahanBaku,
      message: `Bahan baku "${nama}" berhasil diupdate`,
    });
  } catch (error: any) {
    console.error('Error updating bahan baku:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}

// ============================================
// DELETE: Hapus bahan baku
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

    await prisma.bahanBaku.delete({
      where: { id },
    });

    return NextResponse.json({
      status: '✅ Berhasil!',
      message: 'Bahan baku berhasil dihapus',
    });
  } catch (error: any) {
    console.error('Error deleting bahan baku:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}

// ============================================
// PATCH: Update Stok / Status / Stok Minimal
// ============================================
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // ========== Jika action = 'update-stok' ==========
    if (action === 'update-stok') {
      console.log('🔄 Mulai update stok bahan baku & produk...');

      const result = await updateAll();

      return NextResponse.json({
        status: '✅ Berhasil!',
        message: 'Stok bahan baku, produk, HPP, dan stok minimal berhasil diupdate',
        metadata: result.metadata,
      });
    }

    // ========== Jika action = 'update-minimal' ==========
    if (action === 'update-minimal') {
      console.log('🔄 Mulai update stok minimal dari target produk...');

      const result = await updateStokMinimalBahanBaku();

      return NextResponse.json({
        status: '✅ Berhasil!',
        message: `Stok minimal ${result.updated} bahan baku berhasil diupdate dari target produk`,
        metadata: {
          updated: result.updated,
        },
      });
    }

    // ========== Jika action = 'status' ==========
    if (action === 'status') {
      const bahanBaku = await prisma.bahanBaku.findMany({
        orderBy: { nama: 'asc' },
      });

      const status = bahanBaku.map(item => {
        const stok = Number(item.stok);
        const minimal = Number(item.stokMinimal);
        let statusStok = 'aman';
        if (stok <= 0) statusStok = 'habis';
        else if (stok <= minimal) statusStok = 'waspada';
        return {
          id: item.id,
          nama: item.nama,
          stok,
          stokMinimal: minimal,
          status: statusStok,
        };
      });

      return NextResponse.json({
        status: '✅ Berhasil!',
        data: status,
        metadata: {
          total: status.length,
          aman: status.filter(s => s.status === 'aman').length,
          waspada: status.filter(s => s.status === 'waspada').length,
          habis: status.filter(s => s.status === 'habis').length,
        },
      });
    }

    return NextResponse.json({
      status: '❌ GAGAL',
      error: 'Action tidak valid. Gunakan: update-stok, update-minimal, atau status',
    }, { status: 400 });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}