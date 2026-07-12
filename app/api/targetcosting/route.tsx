// app/api/targetcosting/route.ts

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
    const periode = searchParams.get('periode') || 'tahunan'; // 'tahunan' atau 'bulanan'

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

    // ========== 2. Tentukan periode ==========
    const currentYear = startDate.getFullYear();
    const yearStart = new Date(Date.UTC(currentYear, 0, 1));
    const yearEnd = new Date(Date.UTC(currentYear, 11, 31, 23, 59, 59));

    // ========== 3. Ambil data berdasarkan periode ==========
    let qtyPenjualan = 0;
    let totalOverhead = 0;
    let totalGaji = 0;
    let totalQtyAllProduk = 0;
    let labelPeriode = '';
    let detailPeriode = {};

    if (periode === 'tahunan') {
      // ---------- DATA TAHUNAN ----------
      labelPeriode = 'Tahunan';
      
      // Total penjualan produk di tahun ini
      const penjualan = await prisma.$queryRaw<{ total: number }[]>`
        SELECT COALESCE(SUM(qty), 0) as total
        FROM "Penjualan"
        WHERE "produkId" = ${produkId}
          AND DATE_TRUNC('year', "tanggal") = DATE_TRUNC('year', ${yearStart}::timestamp)
      `;
      qtyPenjualan = Number(penjualan[0]?.total) || 0;

      // Total overhead tahunan (perMonth * 12)
      const overhead = await prisma.$queryRaw<{ total: number }[]>`
        SELECT COALESCE(SUM("perMonth" * 12), 0) as total
        FROM "Asset"
        WHERE status != 'Rusak'
      `;
      totalOverhead = Number(overhead[0]?.total) || 0;

      // Total gaji tahunan
      const gaji = await prisma.$queryRaw<{ total: number }[]>`
        SELECT COALESCE(SUM(gaji), 0) as total
        FROM "Penggajian"
        WHERE DATE_TRUNC('year', "tanggal_penggajian") = DATE_TRUNC('year', ${yearStart}::timestamp)
      `;
      totalGaji = Number(gaji[0]?.total) || 0;

      // Total qty semua produk di tahun yang sama
      const totalQty = await prisma.$queryRaw<{ total: number }[]>`
        SELECT COALESCE(SUM(qty), 0) as total
        FROM "Penjualan"
        WHERE DATE_TRUNC('year', "tanggal") = DATE_TRUNC('year', ${yearStart}::timestamp)
      `;
      totalQtyAllProduk = Number(totalQty[0]?.total) || 0;

      detailPeriode = {
        periode: 'tahunan',
        tahun: currentYear,
        totalOverhead,
        totalGaji,
        totalQtyAllProduk,
        qtyPenjualan,
      };

    } else {
      // ---------- DATA BULANAN ----------
      labelPeriode = 'Bulanan';
      
      // Total penjualan produk di bulan ini
      const penjualan = await prisma.$queryRaw<{ total: number }[]>`
        SELECT COALESCE(SUM(qty), 0) as total
        FROM "Penjualan"
        WHERE "produkId" = ${produkId}
          AND DATE_TRUNC('month', "tanggal") = DATE_TRUNC('month', ${startDate}::timestamp)
      `;
      qtyPenjualan = Number(penjualan[0]?.total) || 0;

      // Total overhead bulanan
      const overhead = await prisma.$queryRaw<{ total: number }[]>`
        SELECT COALESCE(SUM("perMonth"), 0) as total
        FROM "Asset"
        WHERE status != 'Rusak'
      `;
      totalOverhead = Number(overhead[0]?.total) || 0;

      // Total gaji bulanan
      const gaji = await prisma.$queryRaw<{ total: number }[]>`
        SELECT COALESCE(SUM(gaji), 0) as total
        FROM "Penggajian"
        WHERE DATE_TRUNC('month', "tanggal_penggajian") = DATE_TRUNC('month', ${startDate}::timestamp)
      `;
      totalGaji = Number(gaji[0]?.total) || 0;

      // Total qty semua produk di bulan yang sama
      const totalQty = await prisma.$queryRaw<{ total: number }[]>`
        SELECT COALESCE(SUM(qty), 0) as total
        FROM "Penjualan"
        WHERE DATE_TRUNC('month', "tanggal") = DATE_TRUNC('month', ${startDate}::timestamp)
      `;
      totalQtyAllProduk = Number(totalQty[0]?.total) || 0;

      detailPeriode = {
        periode: 'bulanan',
        bulan: `${year}-${String(month).padStart(2, '0')}`,
        totalOverhead,
        totalGaji,
        totalQtyAllProduk,
        qtyPenjualan,
      };
    }

    // ========== 4. Ambil target costing (jika ada) ==========
    const target = await prisma.targetCosting.findUnique({
      where: {
        produkId_bulan: {
          produkId: produkId,
          bulan: startDate,
        },
      },
    });

    // ========== 5. Format data bahan baku dari resep ==========
    const resepBahanBaku = produk.bahanBaku.map((item) => {
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

    // ========== 6. Hitung Target ==========
    
    // Target Bahan Baku = Σ (hargaDipilih × qty)
    const targetBahanBaku = resepBahanBaku.reduce(
      (sum, item) => sum + item.hargaDipilih * item.qty,
      0
    );

    // Hitung persentase produk dari total qty
    const persentaseProduk = totalQtyAllProduk > 0 
      ? (qtyPenjualan / totalQtyAllProduk) * 100
      : 0;

    // Target Overhead & Gaji (per produk)
    let targetOverhead = 0;
    let targetGaji = 0;

    if (qtyPenjualan > 0 && totalQtyAllProduk > 0) {
      const alokasiOverhead = totalOverhead * (qtyPenjualan / totalQtyAllProduk);
      targetOverhead = Math.round(alokasiOverhead / qtyPenjualan);
      
      const alokasiGaji = totalGaji * (qtyPenjualan / totalQtyAllProduk);
      targetGaji = Math.round(alokasiGaji / qtyPenjualan);
    }

    // Jika ada target custom, timpa dengan nilai dari database
    if (target) {
      if (qtyPenjualan > 0) {
        targetOverhead = Math.round(target.targetOverhead / qtyPenjualan);
        targetGaji = Math.round(target.targetGaji / qtyPenjualan);
      }
    }

    // ========== 7. Hitung Realisasi (SAMA dengan target) ==========
    
    // Realisasi Bahan Baku = HPP produk
    const realisasiBahanBaku = produk.hpp || 0;

    // Realisasi Overhead & Gaji (per produk)
    let realisasiOverhead = 0;
    let realisasiGaji = 0;

    if (qtyPenjualan > 0 && totalQtyAllProduk > 0) {
      const alokasiOverhead = totalOverhead * (qtyPenjualan / totalQtyAllProduk);
      realisasiOverhead = Math.round(alokasiOverhead / qtyPenjualan);
      
      const alokasiGaji = totalGaji * (qtyPenjualan / totalQtyAllProduk);
      realisasiGaji = Math.round(alokasiGaji / qtyPenjualan);
    }

    // ========== 8. Return Response ==========
    return NextResponse.json({
      status: '✅ Berhasil!',
      data: {
        produk: {
          id: produk.id,
          nama: produk.nama,
          sku: produk.sku,
          hpp: produk.hpp,
        },
        periode: {
          type: periode,
          label: labelPeriode,
          ...detailPeriode,
        },
        qtyPenjualan,
        totalQtyAllProduk,
        persentaseProduk: Math.round(persentaseProduk),
        totalOverhead,
        totalGaji,
        bahanBaku: resepBahanBaku,
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
        // Data mentah untuk transparansi
        rawData: {
          totalOverhead,
          totalGaji,
          totalQtyAllProduk,
          qtyPenjualan,
          persentaseProduk: Math.round(persentaseProduk),
        }
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
    const { 
      produkId, 
      bulan, 
      targetBahanBaku, 
      targetOverhead, 
      targetGaji, 
      hargaBahanBaku,
      qtyPenjualan
    } = body;

    if (!produkId || !bulan) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'produkId dan bulan wajib diisi',
      }, { status: 400 });
    }

    const [year, month] = bulan.split('-').map(Number);
    const bulanDate = new Date(Date.UTC(year, month - 1, 1));

    // Konversi target per produk ke total (untuk disimpan)
    const qty = qtyPenjualan || 1;
    const targetOverheadTotal = Math.round(Number(targetOverhead) * qty);
    const targetGajiTotal = Math.round(Number(targetGaji) * qty);

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
        targetOverhead: targetOverheadTotal,
        targetGaji: targetGajiTotal,
        hargaBahanBaku: hargaBahanBaku || {},
        updatedAt: new Date(),
      },
      create: {
        produkId: produkId,
        bulan: bulanDate,
        targetBahanBaku: Number(targetBahanBaku) || 0,
        targetOverhead: targetOverheadTotal,
        targetGaji: targetGajiTotal,
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