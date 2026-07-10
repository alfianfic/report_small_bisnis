// app/api/costing/route.ts

import { prisma } from '@/app/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// ============================================
// GET: Ambil data costing per produk
// ============================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const produkId = searchParams.get('produkId');
    const bulan = searchParams.get('bulan');

    if (!produkId) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'Parameter produkId wajib diisi',
      }, { status: 400 });
    }

    if (!bulan) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'Parameter bulan wajib diisi (format: YYYY-MM)',
      }, { status: 400 });
    }

    const [year, month] = bulan.split('-').map(Number);
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59));

    // ========== 1. Ambil data produk ==========
    const produk = await prisma.produk.findUnique({
      where: { id: produkId },
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

    // ========== 2. Ambil total penjualan produk bulan ini ==========
    const penjualan = await prisma.$queryRaw<{ total: number }[]>`
      SELECT COALESCE(SUM(qty), 0) as total
      FROM "Penjualan"
      WHERE "produkId" = ${produkId}
        AND DATE_TRUNC('month', "tanggal") = DATE_TRUNC('month', ${startDate}::timestamp)
    `;
    const qtyPenjualan = Number(penjualan[0]?.total) || 0;

    // ========== 3. Ambil total overhead bulan ini ==========
    const overheadData = await prisma.$queryRaw<{ total: number }[]>`
      SELECT COALESCE(SUM("perMonth"), 0) as total
      FROM "Asset"
      WHERE status != 'Rusak'
    `;
    const totalOverhead = Number(overheadData[0]?.total) || 0;

    // ========== 4. Ambil total gaji bulan ini ==========
    const gajiData = await prisma.$queryRaw<{ total: number }[]>`
      SELECT COALESCE(SUM(gaji), 0) as total
      FROM "Penggajian"
      WHERE DATE_TRUNC('month', "tanggal_penggajian") = DATE_TRUNC('month', ${startDate}::timestamp)
    `;
    const totalGaji = Number(gajiData[0]?.total) || 0;

    // ========== 5. Ambil target costing (jika ada) ==========
    const target = await prisma.targetCosting.findUnique({
      where: {
        produkId_bulan: {
          produkId: produkId,
          bulan: startDate,
        },
      },
    });

    // ========== 6. Format data bahan baku untuk dropdown ==========
    const bahanBakuList = produk.bahanBaku.map((item) => {
      const defaultHarga = item.bahanBaku.harga;
      const customHarga = target?.hargaBahanBaku as any;
      const hargaDipilih = customHarga?.[item.bahanBakuId] || defaultHarga;

      return {
        id: item.bahanBakuId,
        nama: item.bahanBaku.nama,
        satuan: item.bahanBaku.satuan,
        qty: item.qty,
        hargaDefault: defaultHarga,
        hargaDipilih: hargaDipilih,
      };
    });

    // ========== 7. Hitung target & realisasi ==========
    // Target Bahan Baku = Σ (hargaDipilih × qty)
    const targetBahanBaku = bahanBakuList.reduce(
      (sum, item) => sum + item.hargaDipilih * item.qty,
      0
    );

    // Default target overhead & gaji = dari sistem (jika belum ada target)
    const defaultOverheadPerProduk = qtyPenjualan > 0 
      ? Math.round((totalOverhead * 1) / qtyPenjualan) // Sementara 100%
      : 0;
    const defaultGajiPerProduk = qtyPenjualan > 0
      ? Math.round((totalGaji * 1) / qtyPenjualan)
      : 0;

    const targetOverhead = target?.targetOverhead ?? defaultOverheadPerProduk;
    const targetGaji = target?.targetGaji ?? defaultGajiPerProduk;

    // Realisasi
    const realisasiBahanBaku = produk.hpp;
    const realisasiOverhead = qtyPenjualan > 0
      ? Math.round(totalOverhead / qtyPenjualan)
      : 0;
    const realisasiGaji = qtyPenjualan > 0
      ? Math.round(totalGaji / qtyPenjualan)
      : 0;

    return NextResponse.json({
      status: '✅ Berhasil!',
      data: {
        produk: {
          id: produk.id,
          nama: produk.nama,
          sku: produk.sku,
          hpp: produk.hpp,
        },
        qtyPenjualan,
        totalOverhead,
        totalGaji,
        bahanBaku: bahanBakuList,
        target: {
          bahanBaku: targetBahanBaku,
          overhead: targetOverhead,
          gaji: targetGaji,
          total: targetBahanBaku + targetOverhead + targetGaji,
        },
        realisasi: {
          bahanBaku: realisasiBahanBaku,
          overhead: realisasiOverhead,
          gaji: realisasiGaji,
          total: realisasiBahanBaku + realisasiOverhead + realisasiGaji,
        },
        isOverridden: !!target,
      },
    });
  } catch (error: any) {
    console.error('Error fetching costing:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}

// ============================================
// POST: Simpan Target Costing
// ============================================
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { produkId, bulan, targetBahanBaku, targetOverhead, targetGaji, hargaBahanBaku } = body;

    if (!produkId || !bulan) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'produkId dan bulan wajib diisi',
      }, { status: 400 });
    }

    const [year, month] = bulan.split('-').map(Number);
    const bulanDate = new Date(Date.UTC(year, month - 1, 1));

    // Upsert target costing
    const target = await prisma.targetCosting.upsert({
      where: {
        produkId_bulan: {
          produkId: produkId,
          bulan: bulanDate,
        },
      },
      update: {
        targetBahanBaku: Number(targetBahanBaku) || 0,
        targetOverhead: Number(targetOverhead) || 0,
        targetGaji: Number(targetGaji) || 0,
        hargaBahanBaku: hargaBahanBaku || {},
        updatedAt: new Date(),
      },
      create: {
        produkId: produkId,
        bulan: bulanDate,
        targetBahanBaku: Number(targetBahanBaku) || 0,
        targetOverhead: Number(targetOverhead) || 0,
        targetGaji: Number(targetGaji) || 0,
        hargaBahanBaku: hargaBahanBaku || {},
      },
    });

    return NextResponse.json({
      status: '✅ Berhasil!',
      data: target,
      message: 'Target costing berhasil disimpan',
    });
  } catch (error: any) {
    console.error('Error saving costing:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}

// ============================================
// DELETE: Hapus target costing (reset ke default)
// ============================================
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const produkId = searchParams.get('produkId');
    const bulan = searchParams.get('bulan');

    if (!produkId || !bulan) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'produkId dan bulan wajib diisi',
      }, { status: 400 });
    }

    const [year, month] = bulan.split('-').map(Number);
    const bulanDate = new Date(Date.UTC(year, month - 1, 1));

    await prisma.targetCosting.delete({
      where: {
        produkId_bulan: {
          produkId: produkId,
          bulan: bulanDate,
        },
      },
    });

    return NextResponse.json({
      status: '✅ Berhasil!',
      message: 'Target costing berhasil direset',
    });
  } catch (error: any) {
    console.error('Error deleting costing:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}