// app/api/penjualan/route.ts

import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

// ========================================
// GET: Ambil semua data penjualan
// ========================================
export async function GET() {
  try {
    const penjualan = await prisma.penjualan.findMany({
      orderBy: { tanggal: 'desc' },
      include: {
        produk: {
          select: {
            id: true,
            nama: true,
            sku: true,
          },
        },
      },
    });

    return NextResponse.json({
      status: '✅ Berhasil!',
      data: penjualan,
      count: penjualan.length,
    });
  } catch (error: any) {
    console.error('Error fetching penjualan:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}

// ========================================
// POST: Tambah penjualan baru
// ========================================
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tanggal, produkId, qty, hargaJual, hpp, profit } = body;

    // Validasi
    if (!tanggal || !produkId || !qty) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'Tanggal, produk, dan qty wajib diisi',
      }, { status: 400 });
    }

    // Cek produk
    const produk = await prisma.produk.findUnique({
      where: { id: produkId },
    });

    if (!produk) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'Produk tidak ditemukan',
      }, { status: 404 });
    }

    // Gunakan harga dari produk jika tidak diisi
    const hargaJualFinal = hargaJual || produk.hargaJual;
    const hppFinal = hpp || produk.hpp;
    const profitFinal = profit || ((hargaJualFinal - hppFinal) * qty);

    const penjualan = await prisma.penjualan.create({
      data: {
        tanggal: new Date(tanggal),
        produkId: produkId,
        qty: qty,
        hargaJual: hargaJualFinal,
        hpp: hppFinal,
        profit: profitFinal,
      },
      include: {
        produk: {
          select: {
            nama: true,
            sku: true,
          },
        },
      },
    });

    return NextResponse.json({
      status: '✅ Berhasil!',
      data: penjualan,
      message: 'Penjualan berhasil ditambahkan',
    });
  } catch (error: any) {
    console.error('Error creating penjualan:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}

// ========================================
// DELETE: Hapus penjualan
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

    await prisma.penjualan.delete({
      where: { id },
    });

    return NextResponse.json({
      status: '✅ Berhasil!',
      message: 'Data berhasil dihapus',
    });
  } catch (error: any) {
    console.error('Error deleting penjualan:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}