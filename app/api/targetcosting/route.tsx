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
    const periode = searchParams.get('periode') || 'tahunan';
    const persentaseOverride = searchParams.get('persentase');

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

    // ========== 3. Ambil semua produk untuk alokasi ==========
    const allProduk = await prisma.produk.findMany({
      select: {
        id: true,
        nama: true,
        sku: true,
      },
      orderBy: {
        nama: 'asc',
      },
    });

    // ========== 4. Ambil data dari LAPORAN BULANAN ==========
    let qtyPenjualan = 0;
    let totalOverhead = 0;
    let totalGaji = 0;
    let totalQtyAllProduk = 0;
    let labelPeriode = '';
    let qtyPerProduk: { produkId: string; total: number }[] = [];

    if (periode === 'tahunan') {
      // ---------- DATA TAHUNAN ----------
      labelPeriode = 'Tahunan';
      
      const penjualan = await prisma.$queryRaw<{ total: number }[]>`
        SELECT COALESCE(SUM(qty), 0) as total
        FROM "Penjualan"
        WHERE "produkId" = ${produkId}
          AND DATE_TRUNC('year', "tanggal") = DATE_TRUNC('year', ${yearStart}::timestamp)
      `;
      qtyPenjualan = Number(penjualan[0]?.total) || 0;

      // PERBAIKAN: pakai kolom "bulan" bukan "tanggal"
      const overhead = await prisma.$queryRaw<{ total: number }[]>`
        SELECT COALESCE(SUM(overhead), 0) as total
        FROM "LaporanBulanan"
        WHERE DATE_TRUNC('year', "bulan") = DATE_TRUNC('year', ${yearStart}::timestamp)
      `;
      totalOverhead = Number(overhead[0]?.total) || 0;

      const gaji = await prisma.$queryRaw<{ total: number }[]>`
        SELECT COALESCE(SUM(gaji), 0) as total
        FROM "LaporanBulanan"
        WHERE DATE_TRUNC('year', "bulan") = DATE_TRUNC('year', ${yearStart}::timestamp)
      `;
      totalGaji = Number(gaji[0]?.total) || 0;

      const totalQty = await prisma.$queryRaw<{ total: number }[]>`
        SELECT COALESCE(SUM(qty), 0) as total
        FROM "Penjualan"
        WHERE DATE_TRUNC('year', "tanggal") = DATE_TRUNC('year', ${yearStart}::timestamp)
      `;
      totalQtyAllProduk = Number(totalQty[0]?.total) || 0;

      const qtyPerProdukRaw = await prisma.$queryRaw<{ produkId: string; total: number }[]>`
        SELECT "produkId", COALESCE(SUM(qty), 0) as total
        FROM "Penjualan"
        WHERE DATE_TRUNC('year', "tanggal") = DATE_TRUNC('year', ${yearStart}::timestamp)
        GROUP BY "produkId"
      `;
      qtyPerProduk = qtyPerProdukRaw;

    } else {
      // ---------- DATA BULANAN ----------
      labelPeriode = 'Bulanan';
      
      const penjualan = await prisma.$queryRaw<{ total: number }[]>`
        SELECT COALESCE(SUM(qty), 0) as total
        FROM "Penjualan"
        WHERE "produkId" = ${produkId}
          AND DATE_TRUNC('month', "tanggal") = DATE_TRUNC('month', ${startDate}::timestamp)
      `;
      qtyPenjualan = Number(penjualan[0]?.total) || 0;

      // PERBAIKAN: pakai kolom "bulan" bukan "tanggal"
      const overhead = await prisma.$queryRaw<{ total: number }[]>`
        SELECT COALESCE(overhead, 0) as total
        FROM "LaporanBulanan"
        WHERE DATE_TRUNC('month', "bulan") = DATE_TRUNC('month', ${startDate}::timestamp)
        LIMIT 1
      `;
      totalOverhead = Number(overhead[0]?.total) || 0;

      const gaji = await prisma.$queryRaw<{ total: number }[]>`
        SELECT COALESCE(gaji, 0) as total
        FROM "LaporanBulanan"
        WHERE DATE_TRUNC('month', "bulan") = DATE_TRUNC('month', ${startDate}::timestamp)
        LIMIT 1
      `;
      totalGaji = Number(gaji[0]?.total) || 0;

      const totalQty = await prisma.$queryRaw<{ total: number }[]>`
        SELECT COALESCE(SUM(qty), 0) as total
        FROM "Penjualan"
        WHERE DATE_TRUNC('month', "tanggal") = DATE_TRUNC('month', ${startDate}::timestamp)
      `;
      totalQtyAllProduk = Number(totalQty[0]?.total) || 0;

      const qtyPerProdukRaw = await prisma.$queryRaw<{ produkId: string; total: number }[]>`
        SELECT "produkId", COALESCE(SUM(qty), 0) as total
        FROM "Penjualan"
        WHERE DATE_TRUNC('month', "tanggal") = DATE_TRUNC('month', ${startDate}::timestamp)
        GROUP BY "produkId"
      `;
      qtyPerProduk = qtyPerProdukRaw;
    }

    // ========== 5. Ambil target costing (jika ada) ==========
    const target = await prisma.targetCosting.findUnique({
      where: {
        produkId_bulan: {
          produkId: produkId,
          bulan: startDate,
        },
      },
    });

    // ========== 6. Format data bahan baku dari resep ==========
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

    // ========== 7. Hitung alokasi ==========
    // Buat map qty per produk
    const qtyMap: Record<string, number> = {};
    qtyPerProduk.forEach((item) => {
      qtyMap[item.produkId] = Number(item.total);
    });

    // Hitung persentase default dari qty
    const defaultPersentase: Record<string, number> = {};
    allProduk.forEach((p) => {
      const qty = qtyMap[p.id] || 0;
      defaultPersentase[p.id] = totalQtyAllProduk > 0 
        ? (qty / totalQtyAllProduk) * 100 
        : 0;
    });

    // Parse override dari URL jika ada
    let overridePersentase: Record<string, number> = {};
    if (persentaseOverride) {
      try {
        overridePersentase = JSON.parse(persentaseOverride);
      } catch (e) {
        console.error('Error parsing persentase override:', e);
      }
    }

    // Gunakan override jika ada, else default
    const persentaseFinal: Record<string, number> = {};
    let totalPersentase = 0;
    allProduk.forEach((p) => {
      const overrideValue = overridePersentase[p.id];
      if (overrideValue !== undefined && overrideValue !== null && overrideValue > 0) {
        persentaseFinal[p.id] = Number(overrideValue);
        totalPersentase += Number(overrideValue);
      } else {
        persentaseFinal[p.id] = defaultPersentase[p.id];
        totalPersentase += defaultPersentase[p.id];
      }
    });

    // Normalisasi jika total tidak 100%
    if (totalPersentase > 0 && Math.abs(totalPersentase - 100) > 0.01) {
      allProduk.forEach((p) => {
        persentaseFinal[p.id] = (persentaseFinal[p.id] / totalPersentase) * 100;
      });
    }

    // Persentase untuk produk yang dipilih
    const persentaseProduk = Math.round(persentaseFinal[produkId] || 0);

    // ========== 8. Hitung Target ==========
    const targetBahanBaku = resepBahanBaku.reduce(
      (sum, item) => sum + item.hargaDipilih * item.qty,
      0
    );

    let targetOverhead = 0;
    let targetGaji = 0;

    if (qtyPenjualan > 0) {
      const alokasiOverhead = totalOverhead * (persentaseProduk / 100);
      targetOverhead = Math.round(alokasiOverhead / qtyPenjualan);
      
      const alokasiGaji = totalGaji * (persentaseProduk / 100);
      targetGaji = Math.round(alokasiGaji / qtyPenjualan);
    }

    // Jika ada target custom, timpa dengan nilai dari database
    if (target) {
      if (qtyPenjualan > 0) {
        targetOverhead = Math.round(target.targetOverhead / qtyPenjualan);
        targetGaji = Math.round(target.targetGaji / qtyPenjualan);
      }
    }

    // ========== 9. Hitung Realisasi ==========
    const realisasiBahanBaku = produk.hpp || 0;

    let realisasiOverhead = 0;
    let realisasiGaji = 0;

    if (qtyPenjualan > 0) {
      const alokasiOverhead = totalOverhead * (persentaseProduk / 100);
      realisasiOverhead = Math.round(alokasiOverhead / qtyPenjualan);
      
      const alokasiGaji = totalGaji * (persentaseProduk / 100);
      realisasiGaji = Math.round(alokasiGaji / qtyPenjualan);
    }

    // ========== 10. Format data alokasi untuk UI ==========
    const dataAlokasi = allProduk.map((p) => ({
      id: p.id,
      nama: p.nama,
      sku: p.sku,
      qty: qtyMap[p.id] || 0,
      persentaseDefault: Math.round(defaultPersentase[p.id] || 0),
      persentaseOverride: overridePersentase[p.id] !== undefined ? Number(overridePersentase[p.id]) : null,
      persentaseFinal: Math.round(persentaseFinal[p.id] || 0),
      isOverridden: overridePersentase[p.id] !== undefined && overridePersentase[p.id] !== null && overridePersentase[p.id] > 0,
    }));

    // ========== 11. Return Response ==========
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
          tahun: periode === 'tahunan' ? currentYear : undefined,
          bulan: periode === 'bulanan' ? `${year}-${String(month).padStart(2, '0')}` : undefined,
          totalOverhead,
          totalGaji,
          totalQtyAllProduk,
          qtyPenjualan,
        },
        qtyPenjualan,
        totalQtyAllProduk,
        persentaseProduk,
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
        alokasi: {
          data: dataAlokasi,
          isOverridden: Object.keys(overridePersentase).length > 0,
        },
        rawData: {
          totalOverhead,
          totalGaji,
          totalQtyAllProduk,
          qtyPenjualan,
          persentaseProduk,
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
      qtyPenjualan,
    } = body;

    if (!produkId || !bulan) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'produkId dan bulan wajib diisi',
      }, { status: 400 });
    }

    const [year, month] = bulan.split('-').map(Number);
    const bulanDate = new Date(Date.UTC(year, month - 1, 1));

    const qty = qtyPenjualan || 1;
    const targetOverheadTotal = Math.round(Number(targetOverhead) * qty);
    const targetGajiTotal = Math.round(Number(targetGaji) * qty);

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
// DELETE: Hapus target costing
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