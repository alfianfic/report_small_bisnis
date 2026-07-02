// app/api/penggajian/route.ts

import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

// GET: Ambil semua data penggajian
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

// POST: Tambah data penggajian
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

    const data = await prisma.penggajian.create({
      data: {
        nama,
        posisi,
        gaji: Number(gaji),
        tanggal_penggajian: new Date(tanggalPenggajian),
      },
    });

    return NextResponse.json({
      status: '✅ Berhasil!',
      data,
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

// DELETE: Hapus data penggajian
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

    await prisma.penggajian.delete({
      where: { id },
    });

    return NextResponse.json({
      status: '✅ Berhasil!',
      message: 'Data berhasil dihapus',
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