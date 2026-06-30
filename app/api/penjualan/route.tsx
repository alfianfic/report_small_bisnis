// app/api/penjualan/route.ts

import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';
import { getMasterByDate, getMasterTerbaru } from '@/app/lib/master';

// GET: Ambil data penjualan berdasarkan master aktif
export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Cari master yang aktif hari ini
    let master = await getMasterByDate(today);
    
    // 2. Jika tidak ada master yang aktif hari ini, ambil master terbaru
    if (!master) {
      master = await getMasterTerbaru();
    }
    
    // 3. Jika tetap tidak ada, error
    if (!master) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'Tidak ada master yang aktif. Silakan buat master terlebih dahulu.',
      }, { status: 404 });
    }

    // 4. Ambil semua realisasi dari master ini
    const salesData = await prisma.dataPenjualan.findUnique({
      where: { id: master.id },
      include: {
        realisasi: {
          orderBy: { tanggal: 'asc' },
        },
        riwayatBelanja: {
          orderBy: { tanggal: 'asc' },
        },
      },
    });

    if (!salesData) {
      return NextResponse.json({
        status: '❌ Data tidak ditemukan',
      }, { status: 404 });
    }

    // 5. Transform data
    const transformedData = {
      ...salesData,
      realisasi: salesData.realisasi.map((r: any) => ({
        ...r,
        hariNama: new Date(r.tanggal).toLocaleDateString('id-ID', { 
          weekday: 'long' 
        }),
      })),
    };

    return NextResponse.json({
      status: '✅ Berhasil!',
      data: transformedData,
      activeMaster: {
        id: master.id,
        tanggalBerlaku: master.tanggalBerlaku,
        hppPerPorsi: master.hppPerPorsi,
        hargaJualPerPorsi: master.hargaJualPerPorsi,
        stokAwal: master.stokAwal,
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