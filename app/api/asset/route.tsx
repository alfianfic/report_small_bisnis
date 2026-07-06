// app/api/asset/route.ts

import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

// ========================================
// GET: Ambil semua asset
// ========================================
export async function GET() {
  try {
    const assets = await prisma.asset.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      status: '✅ Berhasil!',
      data: assets,
      count: assets.length,
    });
  } catch (error: any) {
    console.error('Error fetching assets:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}

// ========================================
// POST: Tambah asset baru
// ========================================
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, quantity, price } = body;

    if (!name || !quantity || !price) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'Nama, quantity, dan price wajib diisi',
      }, { status: 400 });
    }

    const qty = Number(quantity);
    const harga = Number(price);
    const total = qty * harga;
    const perMonth = Math.round(total / 12);

    const asset = await prisma.asset.create({
      data: {
        name,
        category: 'Overhead',
        quantity: qty,
        price: harga,
        total: total,
        perMonth: perMonth,
        status: 'Baik',
      },
    });

    return NextResponse.json({
      status: '✅ Berhasil!',
      data: asset,
      message: 'Asset berhasil ditambahkan',
    });
  } catch (error: any) {
    console.error('Error creating asset:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}

// ========================================
// PUT: Update asset
// ========================================
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, quantity, price } = body;

    if (!id) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'ID wajib diisi',
      }, { status: 400 });
    }

    const qty = Number(quantity);
    const harga = Number(price);
    const total = qty * harga;
    const perMonth = Math.round(total / 12);

    const asset = await prisma.asset.update({
      where: { id },
      data: {
        name,
        quantity: qty,
        price: harga,
        total: total,
        perMonth: perMonth,
      },
    });

    return NextResponse.json({
      status: '✅ Berhasil!',
      data: asset,
      message: 'Asset berhasil diupdate',
    });
  } catch (error: any) {
    console.error('Error updating asset:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}

// ========================================
// DELETE: Hapus asset
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

    await prisma.asset.delete({
      where: { id },
    });

    return NextResponse.json({
      status: '✅ Berhasil!',
      message: 'Asset berhasil dihapus',
    });
  } catch (error: any) {
    console.error('Error deleting asset:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}