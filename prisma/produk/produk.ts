// prisma/seed-produk.ts

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

const produkData = [
  { nama: 'Nasi Gudeg Campur', sku: 'GUD-001', hpp: 11111, hargaJual: 16000, stok: 0, targetStok: 200 },
  { nama: 'Ayam Bakar Bumbu Rujak', sku: 'AYM-001', hpp: 16379, hargaJual: 23000, stok: 0, targetStok: 100 },
  { nama: 'Ayam Bakar Bumbu Kecap', sku: 'AYM-002', hpp: 14175, hargaJual: 23000, stok: 0, targetStok: 100 },
];

async function main() {
  console.log('🌱 Seeding produk...');

  await prisma.produk.deleteMany();
  console.log('🗑️ Data lama dihapus');

  for (const data of produkData) {
    await prisma.produk.create({
      data: {
        nama: data.nama,
        sku: data.sku,
        hpp: data.hpp,
        hargaJual: data.hargaJual,
        stok: data.stok,
        targetStok: data.targetStok,
        isActive: true,
      },
    });
    console.log(`✅ ${data.nama} (${data.sku}) - HPP Rp${data.hpp.toLocaleString()}, Jual Rp${data.hargaJual.toLocaleString()}`);
  }

  console.log(`✅ Total ${produkData.length} produk berhasil di-seed`);
  await prisma.$disconnect();
}

main().catch(console.error);