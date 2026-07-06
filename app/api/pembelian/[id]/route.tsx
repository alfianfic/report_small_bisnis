// app/api/pembelian/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'ID wajib diisi',
      }, { status: 400 });
    }

    const pembelian = await prisma.pembelian.findUnique({
      where: { id },
    });

    if (!pembelian) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'Data pembelian tidak ditemukan',
      }, { status: 404 });
    }

    if (pembelian.bahanBakuId && pembelian.kategori === 'Bahan Baku') {
      await prisma.bahanBaku.update({
        where: { id: pembelian.bahanBakuId },
        data: {
          stok: {
            decrement: pembelian.qty,
          },
        },
      });
    }

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