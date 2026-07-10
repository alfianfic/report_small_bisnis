// app/api/asset/route.ts

import { prisma } from '@/app/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// ============================================
// HELPER: Update Overhead di Laporan Bulanan (per Tahun)
// ============================================
async function updateLaporanByYear(tahun: string) {
  try {
    const overheadData = await prisma.$queryRaw<{ total: number }[]>`
      SELECT COALESCE(SUM("perMonth"), 0) as total
      FROM "Asset"
      WHERE status != 'Rusak'
    `;

    const defaultOverhead = Number(overheadData[0]?.total) || 0;
    console.log(`📊 Default overhead: ${defaultOverhead}`);

    const startDate = new Date(Number(tahun), 0, 1);
    const endDate = new Date(Number(tahun), 11, 31, 23, 59, 59);

    const laporanList = await prisma.laporanBulanan.findMany({
      where: {
        bulan: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    if (laporanList.length === 0) {
      return {
        success: false,
        message: `Tidak ada laporan untuk tahun ${tahun}`,
        updated: 0
      };
    }

    let updatedCount = 0;

    for (const laporan of laporanList) {
      const profitBaru = laporan.labaKotor - laporan.jumlahCost - laporan.gaji - defaultOverhead;

      await prisma.laporanBulanan.update({
        where: { id: laporan.id },
        data: {
          overhead: defaultOverhead,
          profit: profitBaru,
          updatedAt: new Date(),
        },
      });
      updatedCount++;
    }

    console.log(`✅ Overhead ${updatedCount} laporan tahun ${tahun} diupdate ke ${defaultOverhead}`);

    return {
      success: true,
      message: `Berhasil update ${updatedCount} laporan tahun ${tahun}`,
      updated: updatedCount,
      defaultOverhead,
    };
  } catch (error) {
    console.error('❌ Error updating laporan overhead:', error);
    throw error;
  }
}

// ============================================
// GET: Ambil semua asset ATAU ambil laporan
// ============================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // ========== Jika action = 'get-laporan' ==========
    if (action === 'get-laporan') {
      const overheadData = await prisma.$queryRaw<{ total: number }[]>`
        SELECT COALESCE(SUM("perMonth"), 0) as total
        FROM "Asset"
        WHERE status != 'Rusak'
      `;

      const defaultOverhead = Number(overheadData[0]?.total) || 0;

      const laporan = await prisma.laporanBulanan.findMany({
        orderBy: { bulan: 'asc' },
      });

      const formattedData = laporan.map(item => ({
        id: item.id,
        bulan: item.bulan,
        bulanStr: `${item.bulan.getFullYear()}-${String(item.bulan.getMonth() + 1).padStart(2, '0')}`,
        qtyProduksi: item.qtyProduksi,
        costPerPortion: item.costPerPortion,
        jumlahCost: item.jumlahCost,
        overhead: item.overhead,
        gaji: item.gaji,
        labaKotor: item.labaKotor,
        profit: item.profit,
        defaultOverhead: defaultOverhead,
        isOverridden: item.overhead !== defaultOverhead,
      }));

      return NextResponse.json({
        status: '✅ Berhasil!',
        data: formattedData,
        metadata: {
          defaultOverhead,
          total: laporan.length,
        },
      });
    }

    // ========== Ambil semua asset (default) ==========
    const assets = await prisma.asset.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const totalOverhead = assets
      .filter(a => a.status !== 'Rusak')
      .reduce((sum, a) => sum + a.perMonth, 0);

    return NextResponse.json({
      status: '✅ Berhasil!',
      data: assets,
      metadata: {
        total: assets.length,
        totalOverheadPerBulan: totalOverhead,
        aktif: assets.filter(a => a.status !== 'Rusak').length,
        rusak: assets.filter(a => a.status === 'Rusak').length,
      },
    });
  } catch (error: any) {
    console.error('Error fetching data:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}

// ============================================
// POST: Tambah asset baru (TIDAK update laporan)
// ============================================
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, category, quantity, price, perMonth, status } = body;

    if (!name || !category || !quantity || !price || !perMonth) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'Semua field wajib diisi',
      }, { status: 400 });
    }

    const total = Number(quantity) * Number(price);

    await prisma.asset.create({
      data: {
        name,
        category,
        quantity: Number(quantity),
        price: Number(price),
        total,
        perMonth: Number(perMonth),
        status: status || 'Baik',
      },
    });

    // ❌ TIDAK update laporan otomatis
    // User harus klik tombol "Update dari Asset" untuk update laporan

    return NextResponse.json({
      status: '✅ Berhasil!',
      message: 'Asset berhasil ditambahkan. Klik "Update dari Asset" untuk update laporan.',
    });
  } catch (error: any) {
    console.error('Error creating asset:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}

// ============================================
// DELETE: Hapus asset (TIDAK update laporan)
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

    await prisma.asset.delete({
      where: { id },
    });

    // ❌ TIDAK update laporan otomatis
    // User harus klik tombol "Update dari Asset" untuk update laporan

    return NextResponse.json({
      status: '✅ Berhasil!',
      message: 'Asset berhasil dihapus. Klik "Update dari Asset" untuk update laporan.',
    });
  } catch (error: any) {
    console.error('Error deleting asset:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}

// ============================================
// PATCH: Update status asset ATAU Update Laporan per Tahun ATAU Override Overhead
// ============================================
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const body = await request.json();

    // ========== Jika action = 'update-laporan' ==========
    if (action === 'update-laporan') {
      const { tahun } = body;

      if (!tahun) {
        return NextResponse.json({
          status: '❌ GAGAL',
          error: 'Parameter tahun wajib diisi',
        }, { status: 400 });
      }

      const result = await updateLaporanByYear(tahun);

      if (!result.success) {
        return NextResponse.json({
          status: '❌ GAGAL',
          error: result.message,
        }, { status: 404 });
      }

      return NextResponse.json({
        status: '✅ Berhasil!',
        message: result.message,
        metadata: {
          updated: result.updated,
          defaultOverhead: result.defaultOverhead,
          tahun,
        },
      });
    }

    // ========== Jika action = 'override-overhead' ==========
    if (action === 'override-overhead') {
      const { bulan, overhead } = body;

      if (!bulan) {
        return NextResponse.json({
          status: '❌ GAGAL',
          error: 'Bulan wajib diisi (format: YYYY-MM)',
        }, { status: 400 });
      }

      const [year, month] = bulan.split('-').map(Number);
      const bulanDate = new Date(Date.UTC(year, month - 1, 1));

      const existing = await prisma.laporanBulanan.findFirst({
        where: {
          bulan: {
            equals: bulanDate,
          },
        },
      });

      if (!existing) {
        return NextResponse.json({
          status: '❌ GAGAL',
          error: `Laporan untuk ${bulan} tidak ditemukan`,
        }, { status: 404 });
      }

      const overheadNum = Number(overhead) || 0;
      const newProfit = existing.labaKotor - existing.jumlahCost - existing.gaji - overheadNum;

      const updated = await prisma.laporanBulanan.update({
        where: { id: existing.id },
        data: {
          overhead: overheadNum,
          profit: newProfit,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        status: '✅ Berhasil!',
        message: `Overhead untuk ${bulan} diupdate menjadi ${overheadNum}`,
        data: updated,
      });
    }

    // ========== Jika update status asset (TIDAK update laporan) ==========
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'ID dan status wajib diisi',
      }, { status: 400 });
    }

    await prisma.asset.update({
      where: { id },
      data: { status },
    });

    // ❌ TIDAK update laporan otomatis
    // User harus klik tombol "Update dari Asset" untuk update laporan

    return NextResponse.json({
      status: '✅ Berhasil!',
      message: 'Status asset berhasil diupdate. Klik "Update dari Asset" untuk update laporan.',
    });
  } catch (error: any) {
    console.error('Error updating asset:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}