// app/api/pembelian/route.ts

import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

// ========================================
// GET: Ambil semua data pembelian
// ========================================
export async function GET() {
  try {
    const pembelian = await prisma.pembelianBahanBaku.findMany({
      orderBy: { tanggal: 'desc' },
      include: {
        bahanBaku: {
          select: {
            id: true,
            nama: true,
            satuan: true,
          },
        },
      },
    });

    return NextResponse.json({
      status: '✅ Berhasil!',
      data: pembelian,
      count: pembelian.length,
    });
  } catch (error: any) {
    console.error('Error fetching pembelian:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}

// ========================================
// POST: Tambah pembelian baru
// ========================================
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tanggal, bahanBakuId, qty, harga } = body;

    // Validasi
    if (!tanggal || !bahanBakuId || !qty) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'Tanggal, bahan baku, dan qty wajib diisi',
      }, { status: 400 });
    }

    // Cek bahan baku
    const bahanBaku = await prisma.bahanBaku.findUnique({
      where: { id: bahanBakuId },
    });

    if (!bahanBaku) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'Bahan baku tidak ditemukan',
      }, { status: 404 });
    }

    // Gunakan harga dari master jika tidak diisi
    const hargaFinal = harga || bahanBaku.harga;
    const totalFinal = qty * hargaFinal;

    // Simpan pembelian
    const pembelian = await prisma.pembelianBahanBaku.create({
      data: {
        tanggal: new Date(tanggal),
        bahanBakuId: bahanBakuId,
        qty: qty,
        harga: hargaFinal,
        total: totalFinal,
      },
      include: {
        bahanBaku: {
          select: {
            nama: true,
            satuan: true,
          },
        },
      },
    });

    // ✅ UPDATE STOK BAHAN BAKU
    await prisma.bahanBaku.update({
      where: { id: bahanBakuId },
      data: {
        stok: {
          increment: qty,
        },
      },
    });

    return NextResponse.json({
      status: '✅ Berhasil!',
      data: pembelian,
      message: 'Pembelian berhasil ditambahkan',
    });
  } catch (error: any) {
    console.error('Error creating pembelian:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}

// ========================================
// DELETE: Hapus pembelian
// ========================================
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

    // Ambil data pembelian sebelum dihapus (untuk rollback stok)
    const pembelian = await prisma.pembelianBahanBaku.findUnique({
      where: { id },
    });

    if (!pembelian) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'Data pembelian tidak ditemukan',
      }, { status: 404 });
    }

    // ✅ ROLLBACK STOK BAHAN BAKU
    await prisma.bahanBaku.update({
      where: { id: pembelian.bahanBakuId },
      data: {
        stok: {
          decrement: pembelian.qty,
        },
      },
    });

    // Hapus data pembelian
    await prisma.pembelianBahanBaku.delete({
      where: { id },
    });

    return NextResponse.json({
      status: '✅ Berhasil!',
      message: 'Data pembelian berhasil dihapus',
    });
  } catch (error: any) {
    console.error('Error deleting pembelian:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}