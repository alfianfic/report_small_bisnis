// app/api/pembelian/route.ts

import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

// ========================================
// GET: Ambil semua data pembelian
// ========================================
export async function GET() {
  try {
    const pembelian = await prisma.pembelian.findMany({
      orderBy: { tanggal: 'desc' },
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
    const { tanggal, kategori, nama, detail, qty, harga, total, bahanBakuId } = body;

    // Validasi
    if (!tanggal || !kategori || !nama || !qty || !harga) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'Tanggal, kategori, nama, qty, dan harga wajib diisi',
      }, { status: 400 });
    }

    const qtyNum = Number(qty);
    const hargaNum = Number(harga);
    const totalNum = total || qtyNum * hargaNum;

    // Simpan pembelian (tanpa relasi)
    const pembelian = await prisma.pembelian.create({
      data: {
        tanggal: new Date(tanggal),
        kategori,
        nama,
        detail: detail || null,
        qty: qtyNum,
        harga: hargaNum,
        total: totalNum,
        // bahanBakuId dihapus karena tidak ada relasi
      },
    });

    // ✅ UPDATE STOK BAHAN BAKU (hanya jika kategori = Bahan Baku)
    // Kita update manual via nama bahan baku
    if (kategori === 'Bahan Baku') {
      const bahanBaku = await prisma.bahanBaku.findFirst({
        where: { nama: nama },
      });

      if (bahanBaku) {
        await prisma.bahanBaku.update({
          where: { id: bahanBaku.id },
          data: {
            stok: {
              increment: qtyNum,
            },
          },
        });
      }
    }

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

    // Ambil data pembelian sebelum dihapus
    const pembelian = await prisma.pembelian.findUnique({
      where: { id },
    });

    if (!pembelian) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'Data pembelian tidak ditemukan',
      }, { status: 404 });
    }

    // ✅ ROLLBACK STOK BAHAN BAKU (jika kategori Bahan Baku)
    if (pembelian.kategori === 'Bahan Baku') {
      const bahanBaku = await prisma.bahanBaku.findFirst({
        where: { nama: pembelian.nama },
      });

      if (bahanBaku) {
        await prisma.bahanBaku.update({
          where: { id: bahanBaku.id },
          data: {
            stok: {
              decrement: pembelian.qty,
            },
          },
        });
      }
    }

    // Hapus data pembelian
    await prisma.pembelian.delete({
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