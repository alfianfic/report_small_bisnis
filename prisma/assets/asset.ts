// prisma/seed-asset.ts

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

const assetData = [
  {
    name: 'Biaya Air, Listrik',
    category: 'Overhead',
    quantity: 1,
    price: 555000,
    total: 6660000,
    perMonth: 555000,
    status: 'Baik',
  },
  {
    name: 'Biaya Bahan Bakar',
    category: 'Overhead',
    quantity: 1,
    price: 4881667,
    total: 58580000,
    perMonth: 4881667,
    status: 'Baik',
  },
  {
    name: 'Biaya Penyusutan Aset',
    category: 'Overhead',
    quantity: 39,
    price: 28164775,
    total: 28164775,
    perMonth: 2347065,
    status: 'Baik',
  },
  {
    name: 'Biaya Sewa',
    category: 'Overhead',
    quantity: 1,
    price: 333333,
    total: 3999996,
    perMonth: 333333,
    status: 'Baik',
  },
  {
    name: 'Biaya Retribusi Pasar',
    category: 'Overhead',
    quantity: 3,
    price: 486667,
    total: 5840000,
    perMonth: 486667,
    status: 'Baik',
  },
  {
    name: 'Biaya Bahan Penolong',
    category: 'Overhead',
    quantity: 6,
    price: 2788500,
    total: 33462000,
    perMonth: 2788500,
    status: 'Baik',
  },
];

async function main() {
  console.log('🌱 Seeding asset...');

  // Hapus data lama
  await prisma.asset.deleteMany();
  console.log('🗑️ Data lama dihapus');

  // Insert asset
  let totalInserted = 0;
  for (const data of assetData) {
    await prisma.asset.create({
      data: {
        name: data.name,
        category: data.category,
        quantity: data.quantity,
        price: data.price,
        total: data.total,
        perMonth: data.perMonth,
        status: data.status,
      },
    });
    totalInserted++;
    console.log(`✅ ${data.name} - Rp${data.total.toLocaleString()}`);
  }

  console.log(`✅ Total ${totalInserted} asset berhasil di-seed`);

  // Total keseluruhan
  const total = await prisma.asset.aggregate({
    _sum: { total: true, perMonth: true },
  });
  console.log(`\n📊 Total Asset: Rp${(total._sum.total || 0).toLocaleString()}`);
  console.log(`📊 Total Per Bulan: Rp${(total._sum.perMonth || 0).toLocaleString()}`);

  await prisma.$disconnect();
}

main().catch(console.error);