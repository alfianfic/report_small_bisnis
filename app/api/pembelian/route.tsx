// app/api/pembelian/route.ts - bagian DELETE

import { NextResponse } from "next/server";

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

    // ✅ TIDAK ADA ROLLBACK STOK (karena tidak ada relasi ke bahanBaku)
    // Jika perlu rollback stok, gunakan tabel PembelianBahanBaku terpisah

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