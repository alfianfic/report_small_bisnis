// app/api/master/route.ts

import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

// GET: Ambil semua master data
export async function GET() {
  try {
    const masters = await prisma.masterData.findMany({
      orderBy: { tanggalBerlaku: 'desc' },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
        realisasi: {
          take: 3,
          orderBy: { tanggal: 'desc' },
        },
        riwayatBelanja: {
          take: 3,
          orderBy: { tanggal: 'desc' },
        },
      },
    });

    return NextResponse.json({
      status: '✅ Berhasil!',
      data: masters,
      count: masters.length,
    });
  } catch (error: any) {
    console.error('Error fetching master data:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}

// POST: Tambah master baru
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      productId,
      hppPerPorsi, 
      hargaJualPerPorsi, 
      targetHarian, 
      thresholdBelanja,
      stokAwal,
      tanggalBerlaku,
    } = body;

    if (!productId) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'productId wajib diisi',
      }, { status: 400 });
    }

    if (!hppPerPorsi || !hargaJualPerPorsi) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'HPP dan Harga Jual wajib diisi',
      }, { status: 400 });
    }

    if (hargaJualPerPorsi <= hppPerPorsi) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'Harga jual harus lebih besar dari HPP',
      }, { status: 400 });
    }

    // Cek apakah product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'Product tidak ditemukan',
      }, { status: 404 });
    }

    // Ambil master terakhir untuk stokAwal default
    const lastMaster = await prisma.masterData.findFirst({
      where: { productId },
      orderBy: { tanggalBerlaku: 'desc' },
    });

    const master = await prisma.masterData.create({
      data: {
        productId,
        hppPerPorsi,
        hargaJualPerPorsi,
        labaPerPorsi: hargaJualPerPorsi - hppPerPorsi,
        targetHarian: targetHarian || 200,
        thresholdBelanja: thresholdBelanja || 200,
        stokAwal: stokAwal || lastMaster?.stokAwal || 500,
        tanggalBerlaku: tanggalBerlaku ? new Date(tanggalBerlaku) : new Date(),
      },
      include: {
        product: {
          select: {
            name: true,
            sku: true,
          },
        },
      },
    });

    return NextResponse.json({
      status: '✅ Berhasil!',
      data: master,
      message: `Master baru berhasil dibuat untuk ${master.product.name}`,
    });
  } catch (error: any) {
    console.error('Error creating master:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}

// PUT: Update master (buat baru dengan tanggalBerlaku baru)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { 
      id,
      hppPerPorsi, 
      hargaJualPerPorsi, 
      targetHarian, 
      thresholdBelanja,
      stokAwal,
      tanggalBerlaku,
    } = body;

    // Cek master yang akan diedit
    const existingMaster = await prisma.masterData.findUnique({
      where: { id },
      include: {
        product: true,
      },
    });

    if (!existingMaster) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'Master tidak ditemukan',
      }, { status: 404 });
    }

    // Buat master BARU (bukan update)
    const newMaster = await prisma.masterData.create({
      data: {
        productId: existingMaster.productId,
        hppPerPorsi: hppPerPorsi || existingMaster.hppPerPorsi,
        hargaJualPerPorsi: hargaJualPerPorsi || existingMaster.hargaJualPerPorsi,
        labaPerPorsi: (hargaJualPerPorsi || existingMaster.hargaJualPerPorsi) - (hppPerPorsi || existingMaster.hppPerPorsi),
        targetHarian: targetHarian || existingMaster.targetHarian,
        thresholdBelanja: thresholdBelanja || existingMaster.thresholdBelanja,
        stokAwal: stokAwal || existingMaster.stokAwal,
        tanggalBerlaku: tanggalBerlaku ? new Date(tanggalBerlaku) : new Date(),
      },
      include: {
        product: {
          select: {
            name: true,
            sku: true,
          },
        },
      },
    });

    return NextResponse.json({
      status: '✅ Berhasil!',
      data: newMaster,
      message: `Master berhasil di-update untuk ${newMaster.product.name} (versi baru)`,
      oldVersion: existingMaster,
    });
  } catch (error: any) {
    console.error('Error updating master:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}