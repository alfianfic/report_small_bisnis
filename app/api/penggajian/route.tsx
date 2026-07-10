// app/api/penggajian/route.ts

import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

// ============================================
// HELPER: Update Laporan Bulanan (HANYA gaji)
// ============================================
async function updateLaporanBulananGaji(tanggal: Date) {
  try {
    // ✅ Ambil tahun & bulan dari tanggal (UTC)
    const year = tanggal.getUTCFullYear();
    const month = tanggal.getUTCMonth() + 1;
    const bulanStr = `${year}-${String(month).padStart(2, '0')}`;

    // ✅ Buat tanggal bulan dalam UTC
    const bulanDate = new Date(Date.UTC(year, month - 1, 1));

    console.log(`📊 Updating gaji untuk ${bulanStr}`);

    // ========== 1. Ambil total gaji di bulan tersebut ==========
    const gajiData = await prisma.$queryRaw<{ total: number }[]>`
      SELECT COALESCE(SUM(gaji), 0) as total
      FROM "Penggajian"
      WHERE DATE_TRUNC('month', "tanggal_penggajian") = DATE_TRUNC('month', ${bulanDate}::timestamp)
    `;

    const totalGaji = Number(gajiData[0]?.total) || 0;

    // ========== 2. Cari laporan bulan tersebut ==========
    const existing = await prisma.laporanBulanan.findFirst({
      where: {
        bulan: {
          equals: bulanDate,
        },
      },
    });

    if (existing) {
      // ✅ Hitung ulang profit
      const profitBaru = existing.labaKotor - existing.jumlahCost - totalGaji - existing.overhead;

      await prisma.laporanBulanan.update({
        where: { id: existing.id },
        data: {
          gaji: totalGaji,
          profit: profitBaru,  // ✅ Update profit juga
          updatedAt: new Date(),
        },
      });
    } else {
      await prisma.laporanBulanan.create({
        data: {
          bulan: bulanDate,
          qtyProduksi: 0,
          costPerPortion: 0,
          jumlahCost: 0,
          overhead: 0,
          gaji: totalGaji,
          labaKotor: 0,
          profit: 0,
        },
      });
    }

    return { success: true, totalGaji };
  } catch (error) {
    console.error('❌ Error updating laporan bulanan gaji:', error);
    throw error;
  }
}

// ============================================
// GET: Ambil semua data penggajian
// ============================================
export async function GET() {
  try {
    const data = await prisma.penggajian.findMany({
      orderBy: { tanggal_penggajian: 'desc' },
    });

    return NextResponse.json({
      status: '✅ Berhasil!',
      data,
      count: data.length,
    });
  } catch (error: any) {
    console.error('Error fetching penggajian:', error);
    return NextResponse.json(
      {
        status: '❌ GAGAL',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// ============================================
// POST: Tambah data penggajian
// ============================================
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nama, posisi, gaji, tanggalPenggajian } = body;

    if (!nama || !posisi || !gaji || !tanggalPenggajian) {
      return NextResponse.json(
        {
          status: '❌ GAGAL',
          error: 'Semua field wajib diisi',
        },
        { status: 400 }
      );
    }

    // ✅ Buat tanggal dalam UTC
    const tanggalObj = new Date(tanggalPenggajian);

    // ✅ Create penggajian
    const data = await prisma.penggajian.create({
      data: {
        nama,
        posisi,
        gaji: Number(gaji),
        tanggal_penggajian: tanggalObj,
      },
    });

    // ✅ UPDATE LAPORAN BULANAN (HANYA gaji)
    await updateLaporanBulananGaji(tanggalObj);

    return NextResponse.json({
      status: '✅ Berhasil!',
      data,
      message: 'Penggajian berhasil ditambahkan, laporan bulanan diupdate',
    });
  } catch (error: any) {
    console.error('Error creating penggajian:', error);
    return NextResponse.json(
      {
        status: '❌ GAGAL',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE: Hapus data penggajian
// ============================================
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        {
          status: '❌ GAGAL',
          error: 'ID wajib diisi',
        },
        { status: 400 }
      );
    }

    // ✅ Cari data penggajian yang akan dihapus (untuk dapat tanggal)
    const penggajian = await prisma.penggajian.findUnique({
      where: { id },
    });

    if (!penggajian) {
      return NextResponse.json(
        {
          status: '❌ GAGAL',
          error: 'Data tidak ditemukan',
        },
        { status: 404 }
      );
    }

    const tanggalObj = penggajian.tanggal_penggajian;

    // ✅ Delete penggajian
    await prisma.penggajian.delete({
      where: { id },
    });

    // ✅ UPDATE LAPORAN BULANAN (HANYA gaji)
    await updateLaporanBulananGaji(tanggalObj);

    return NextResponse.json({
      status: '✅ Berhasil!',
      message: 'Data berhasil dihapus, laporan bulanan diupdate',
    });
  } catch (error: any) {
    console.error('Error deleting penggajian:', error);
    return NextResponse.json(
      {
        status: '❌ GAGAL',
        error: error.message,
      },
      { status: 500 }
    );
  }
}