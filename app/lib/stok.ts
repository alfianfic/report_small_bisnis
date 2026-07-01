// app/lib/stok.ts

import { prisma } from './prisma';
import { getMasterByDate } from './master';

export async function getStokAwal(tanggal: Date, productId: string) {
  // 1. Cari realisasi H-1 untuk product ini
  const hariSebelumnya = await prisma.realisasiHarian.findFirst({
    where: {
      productId: productId,
      tanggal: { lt: tanggal },
    },
    orderBy: { tanggal: 'desc' },
  });

  // 2. Kalau ada realisasi H-1, pakai sisa-nya
  if (hariSebelumnya) {
    return hariSebelumnya.sisa;
  }

  // 3. Kalau tidak ada realisasi H-1, cari master yang berlaku
  const master = await getMasterByDate(tanggal, productId);
  
  // 4. Kalau ada master, pakai stokAwal master
  if (master) {
    return master.stokAwal;
  }

  // 5. Kalau tidak ada master, return 0
  return 0;
}

export async function getStokSaatIni(tanggal: Date, productId: string) {
  // Ambil realisasi hari ini
  const hariIni = await prisma.realisasiHarian.findUnique({
    where: {
      productId_tanggal: {
        productId,
        tanggal,
      },
    },
  });

  if (hariIni) {
    return hariIni.sisa;
  }

  // Kalau tidak ada, cari H-1
  return getStokAwal(tanggal, productId);
}