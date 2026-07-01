// app/api/penjualan/route.ts

import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

// ========================================
// GET: Ambil data penjualan berdasarkan product & filter tanggal
// ========================================
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!productId) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'productId wajib diisi',
      }, { status: 400 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Cek apakah product exists
    const product = await prisma.product.findUnique({
      where: { id: productId, isActive: true },
    });

    if (!product) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'Produk tidak ditemukan atau tidak aktif',
      }, { status: 404 });
    }

    // 2. Cari master yang berlaku untuk product ini
    let master = await prisma.masterData.findFirst({
      where: {
        productId: productId,
        tanggalBerlaku: { lte: today },
      },
      orderBy: { tanggalBerlaku: 'desc' },
    });

    // 3. Jika tidak ada master aktif hari ini, ambil master terbaru
    if (!master) {
      master = await prisma.masterData.findFirst({
        where: { productId: productId },
        orderBy: { tanggalBerlaku: 'desc' },
      });
    }

    if (!master) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: `Tidak ada master data untuk product ${product.name}`,
      }, { status: 404 });
    }

    // 4. Build filter untuk realisasi
    const whereClause: any = { productId: productId };
    
    // ✅ Filter by date range
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      whereClause.tanggal = {
        gte: start,
        lte: end,
      };
    }

    // 5. Ambil realisasi dengan filter
    const realisasi = await prisma.realisasiHarian.findMany({
      where: whereClause,
      orderBy: { tanggal: 'asc' },
    });

    // 6. Ambil semua belanja dari product ini
    const riwayatBelanja = await prisma.riwayatBelanja.findMany({
      where: {
        productId: productId,
      },
      orderBy: { tanggal: 'asc' },
    });

    // 7. Transform data
    const transformedData = {
      id: master.id,
      productId: productId,
      hppPerPorsi: master.hppPerPorsi,
      hargaJualPerPorsi: master.hargaJualPerPorsi,
      labaPerPorsi: master.labaPerPorsi,
      targetHarian: master.targetHarian,
      stokAwal: master.stokAwal,
      thresholdBelanja: master.thresholdBelanja,
      tanggalBerlaku: master.tanggalBerlaku,
      realisasi: realisasi.map((r: any) => ({
        ...r,
        hariNama: new Date(r.tanggal).toLocaleDateString('id-ID', { 
          weekday: 'long' 
        }),
      })),
      riwayatBelanja: riwayatBelanja,
    };

    return NextResponse.json({
      status: '✅ Berhasil!',
      data: transformedData,
      activeMaster: {
        id: master.id,
        tanggalBerlaku: master.tanggalBerlaku,
        hppPerPorsi: master.hppPerPorsi,
        hargaJualPerPorsi: master.hargaJualPerPorsi,
        labaPerPorsi: master.labaPerPorsi,
        targetHarian: master.targetHarian,
        stokAwal: master.stokAwal,
        thresholdBelanja: master.thresholdBelanja,
      },
      filter: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
    });
  } catch (error: any) {
    console.error('Error fetching sales data:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}

// ========================================
// POST: Tambah/update penjualan
// ========================================
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tanggal, terjual, productId } = body;

    if (!productId) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'productId wajib diisi',
      }, { status: 400 });
    }

    if (!tanggal) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'Tanggal wajib diisi',
      }, { status: 400 });
    }

    if (terjual === undefined || terjual === null || terjual < 0) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'Jumlah terjual harus lebih dari 0',
      }, { status: 400 });
    }

    const tanggalObj = new Date(tanggal);
    tanggalObj.setHours(0, 0, 0, 0);

    // 1. Ambil master yang berlaku untuk tanggal ini
    const master = await prisma.masterData.findFirst({
      where: {
        productId: productId,
        tanggalBerlaku: { lte: tanggalObj },
      },
      orderBy: { tanggalBerlaku: 'desc' },
    });

    if (!master) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: `Tidak ada master yang berlaku untuk tanggal ${tanggal}`,
      }, { status: 404 });
    }

    // 2. Ambil stok awal dari H-1
    const hariSebelumnya = await prisma.realisasiHarian.findFirst({
      where: {
        productId: productId,
        tanggal: { lt: tanggalObj },
      },
      orderBy: { tanggal: 'desc' },
    });

    let stokAwal = 0;
    if (hariSebelumnya) {
      stokAwal = hariSebelumnya.sisa;
    } else {
      // Jika tidak ada H-1, pakai stokAwal master
      stokAwal = master.stokAwal;
    }

    // 3. Hitung total belanja di hari ini
    const startOfDay = new Date(tanggalObj);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(tanggalObj);
    endOfDay.setHours(23, 59, 59, 999);

    const allBelanja = await prisma.riwayatBelanja.findMany({
      where: {
        productId: productId,
        tanggal: { gte: startOfDay, lte: endOfDay },
      },
    });

    let totalBelanjaEfektif = 0;
    for (const b of allBelanja) {
      totalBelanjaEfektif += (b.jumlah || b.jumlahSystem || 0);
    }

    // 4. Hitung stok akhir
    const stokTersedia = stokAwal + totalBelanjaEfektif;
    const sisa = Math.max(0, stokTersedia - terjual);

    // 5. Tentukan status
    let status: 'aman' | 'waspada' | 'habis' = 'habis';
    if (sisa === 0) {
      status = 'habis';
    } else if (sisa < master.targetHarian) {
      status = 'waspada';
    } else {
      status = 'aman';
    }

    const perluBelanja = sisa < master.thresholdBelanja;

    // 6. Upsert realisasi harian
    const realisasi = await prisma.realisasiHarian.upsert({
      where: {
        productId_tanggal: {
          productId: productId,
          tanggal: tanggalObj,
        },
      },
      update: {
        terjual,
        sisa,
        stokAwal,
        status,
        perluBelanja,
        masterDataId: master.id,
        hppPerPorsi: master.hppPerPorsi,
        hargaJualPerPorsi: master.hargaJualPerPorsi,
        labaPerPorsi: master.labaPerPorsi,
        targetHarian: master.targetHarian,
        thresholdBelanja: master.thresholdBelanja,
      },
      create: {
        productId: productId,
        tanggal: tanggalObj,
        terjual,
        sisa,
        stokAwal,
        status,
        perluBelanja,
        masterDataId: master.id,
        hppPerPorsi: master.hppPerPorsi,
        hargaJualPerPorsi: master.hargaJualPerPorsi,
        labaPerPorsi: master.labaPerPorsi,
        targetHarian: master.targetHarian,
        thresholdBelanja: master.thresholdBelanja,
      },
    });

    return NextResponse.json({
      status: '✅ Berhasil!',
      data: realisasi,
      master: {
        id: master.id,
        hppPerPorsi: master.hppPerPorsi,
        hargaJualPerPorsi: master.hargaJualPerPorsi,
        labaPerPorsi: master.labaPerPorsi,
        targetHarian: master.targetHarian,
        thresholdBelanja: master.thresholdBelanja,
        stokAwal: master.stokAwal,
      },
    });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}