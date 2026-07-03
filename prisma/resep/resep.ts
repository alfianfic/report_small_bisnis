// prisma/seed-resep.ts

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Nama bahan baku -> qty per porsi
// Data dari resep yang sudah diberikan
const resepData = {
  'Nasi Gudeg Campur': [
    { bahan: 'Ajinomoto (50 g)', qty: 0.00104 },
    { bahan: 'Asem', qty: 0.00008 },
    { bahan: 'Ayam', qty: 0.1 },
    { bahan: 'Bawang Merah', qty: 0.0044 },
    { bahan: 'Bawang Putih', qty: 0.0074 },
    { bahan: 'Cabai Merah', qty: 0.01 },
    { bahan: 'Cabai Rawit', qty: 0.003 },
    { bahan: 'Daun Bawang', qty: 0.001 },
    { bahan: 'Daun Salam', qty: 0.14 },
    { bahan: 'Garam Balok', qty: 0.108 },
    { bahan: 'Gula Merah', qty: 0.0164 },
    { bahan: 'Gula Putih', qty: 0.004144 },
    { bahan: 'Kelapa', qty: 0.088 },
    { bahan: 'Kemiri', qty: 0.0038 },
    { bahan: 'Kentang', qty: 0.04 },
    { bahan: 'Ketumbar', qty: 0.00008 },
    { bahan: 'Krecek Rambak', qty: 0.002 },
    { bahan: 'Kubis Sayur', qty: 0.008 },
    { bahan: 'Kunyit', qty: 0.000268 },
    { bahan: 'Lada', qty: 0.000144 },
    { bahan: 'Lengkuas', qty: 0.001056 },
    { bahan: 'Mie Sealon', qty: 0.012 },
    { bahan: 'Nangka Muda', qty: 0.04 },
    { bahan: 'Royco', qty: 0.068 },
    { bahan: 'Tahu', qty: 0.24 },
    { bahan: 'Telur', qty: 0.025 },
    { bahan: 'Terasi', qty: 0.0008 },
    { bahan: 'Tomat', qty: 0.008 },
    { bahan: 'Wortel', qty: 0.002 },
    { bahan: 'Nasi', qty: 0.08 },
  ],
  'Ayam Bakar Bumbu Rujak': [
    { bahan: 'Ayam', qty: 0.25 },
    { bahan: 'Cabai Merah', qty: 0.05 },
    { bahan: 'Cabai Rawit', qty: 0.005 },
    { bahan: 'Bawang Putih', qty: 0.01 },
    { bahan: 'Kemiri', qty: 0.01 },
    { bahan: 'Garam Balok', qty: 0.2 },
    { bahan: 'Ajinomoto (50 g)', qty: 0.0025 },
    { bahan: 'Royco', qty: 0.1 },
    { bahan: 'Gula Putih', qty: 0.01 },
  ],
  'Ayam Bakar Bumbu Kecap': [
    { bahan: 'Ayam', qty: 0.25 },
    { bahan: 'Bawang Merah', qty: 0.01 },
    { bahan: 'Bawang Putih', qty: 0.01 },
    { bahan: 'Cabai Rawit', qty: 0.005 },
    { bahan: 'Daun Salam', qty: 0.35 },
    { bahan: 'Lengkuas', qty: 0.0033 },
    { bahan: 'Garam Balok', qty: 0.1 },
    { bahan: 'Gula Putih', qty: 0.01 },
    { bahan: 'Royco', qty: 0.1 },
    { bahan: 'Ajinomoto (50 g)', qty: 0.0025 },
    { bahan: 'Kecap', qty: 12.5 },
  ],
};

async function main() {
  console.log('🌱 Seeding resep...');

  await prisma.produkBahanBaku.deleteMany();
  console.log('🗑️ Data lama dihapus');

  const produkList = await prisma.produk.findMany();
  const bahanList = await prisma.bahanBaku.findMany();

  const bahanMap: Record<string, string> = {};
  for (const b of bahanList) {
    bahanMap[b.nama] = b.id;
  }

  const produkMap: Record<string, string> = {};
  for (const p of produkList) {
    produkMap[p.nama] = p.id;
  }

  let totalResep = 0;

  for (const [produkNama, resepItems] of Object.entries(resepData)) {
    const produkId = produkMap[produkNama];
    if (!produkId) {
      console.warn(`⚠️ Produk "${produkNama}" tidak ditemukan`);
      continue;
    }

    for (const item of resepItems) {
      const bahanId = bahanMap[item.bahan];
      if (!bahanId) {
        console.warn(`⚠️ Bahan "${item.bahan}" tidak ditemukan`);
        continue;
      }

      await prisma.produkBahanBaku.create({
        data: {
          produkId: produkId,
          bahanBakuId: bahanId,
          qty: item.qty,
        },
      });
      totalResep++;
    }
    console.log(`✅ Resep ${produkNama}: ${resepItems.length} bahan`);
  }

  console.log(`✅ Total ${totalResep} resep detail berhasil di-seed`);
  await prisma.$disconnect();
}

main().catch(console.error);