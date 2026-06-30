// app/lib/stok.ts

import { prisma } from './prisma';
import { getMasterByDate } from './master';

export async function getStokAwal(tanggal: Date, dataPenjualanId: string) {
  // 1. Cari realisasi H-1
  const hariSebelumnya = await prisma.realisasiHarian.findFirst({
    where: {
      tanggal: { lt: tanggal },
      dataPenjualanId,
    },
    orderBy: { tanggal: 'desc' },
  });

  // 2. Kalau ada realisasi H-1, pakai sisa-nya
  if (hariSebelumnya) {
    return hariSebelumnya.sisa;
  }

  // 3. Kalau tidak ada realisasi H-1, cari master yang berlaku
  const master = await getMasterByDate(tanggal);
  
  // 4. Kalau tanggal transaksi >= tanggalBerlaku master, pakai stokAwal master
  if (master && tanggal >= master.tanggalBerlaku) {
    return master.stokAwal;
  }

  // 5. Kalau tidak ada master atau tanggal belum berlaku, return 0
  return 0;
}