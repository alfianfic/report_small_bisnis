// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Setup adapter untuk seed (sama seperti di prisma.ts)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Hapus data lama (urutan penting karena relasi)
  await prisma.riwayatBelanja.deleteMany();
  await prisma.realisasiHarian.deleteMany();
  await prisma.dataPenjualan.deleteMany();

  // Buat data penjualan
  await prisma.dataPenjualan.create({
    data: {
      hppPerPorsi: 13000,
      hargaJualPerPorsi: 15000,
      labaPerPorsi: 2000,
      targetHarian: 200,
      stokAwal: 500,
      thresholdBelanja: 200,
      realisasi: {
        create: [
          { tanggal: new Date('2026-06-17'), hari: 1, terjual: 200, sisa: 300, stokAwal: 500, status: 'sisa_banyak', perluBelanja: false, belanja: 0 },
          { tanggal: new Date('2026-06-18'), hari: 2, terjual: 130, sisa: 170, stokAwal: 300, status: 'sisa_banyak', perluBelanja: false, belanja: 0 },
          { tanggal: new Date('2026-06-19'), hari: 3, terjual: 130, sisa: 40, stokAwal: 170, status: 'sisa_sedikit', perluBelanja: true, belanja: 0 },
          { tanggal: new Date('2026-06-20'), hari: 4, terjual: 200, sisa: 140, stokAwal: 340, status: 'sisa_banyak', perluBelanja: false, belanja: 300 },
          { tanggal: new Date('2026-06-21'), hari: 5, terjual: 140, sisa: 0, stokAwal: 140, status: 'habis', perluBelanja: true, belanja: 0 },
          { tanggal: new Date('2026-06-22'), hari: 6, terjual: 0, sisa: 0, stokAwal: 0, status: 'habis', perluBelanja: true, belanja: 0 },
          { tanggal: new Date('2026-06-23'), hari: 7, terjual: 0, sisa: 0, stokAwal: 0, status: 'habis', perluBelanja: true, belanja: 0 },
        ],
      },
      riwayatBelanja: {
        create: [
          { tanggal: new Date('2026-06-20'), jumlah: 300, keterangan: 'Belanja stok karena sisa 40' },
        ],
      },
    },
  });

  console.log('✅ Seed data berhasil!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });