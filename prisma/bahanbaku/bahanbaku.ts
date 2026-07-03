// prisma/seed-bahan-baku.ts

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

const bahanBakuData = [
  { nama: 'Ajinomoto (50 g)', satuan: 'Kg', harga: 2650 },
  { nama: 'Asem', satuan: 'Kg', harga: 25000 },
  { nama: 'Ayam', satuan: 'Pcs', harga: 50000 },
  { nama: 'Bawang Merah', satuan: 'Kg', harga: 35000 },
  { nama: 'Bawang Putih', satuan: 'Kg', harga: 25000 },
  { nama: 'Cabai Merah', satuan: 'Kg', harga: 50000 },
  { nama: 'Cabai Rawit', satuan: 'Kg', harga: 57000 },
  { nama: 'Daun Bawang', satuan: 'Kg', harga: 9000 },
  { nama: 'Daun Salam', satuan: 'Lbr', harga: 1500 },
  { nama: 'Garam Balok', satuan: 'Pcs', harga: 250 },
  { nama: 'Gula Merah', satuan: 'Kg', harga: 14000 },
  { nama: 'Gula Putih', satuan: 'Kg', harga: 17000 },
  { nama: 'Kelapa', satuan: 'Pcs', harga: 12000 },
  { nama: 'Kemiri', satuan: 'Kg', harga: 45000 },
  { nama: 'Kentang', satuan: 'Kg', harga: 12000 },
  { nama: 'Ketumbar', satuan: 'Kg', harga: 45000 },
  { nama: 'Krecek Rambak', satuan: 'Kg', harga: 100000 },
  { nama: 'Kubis Sayur', satuan: 'Kg', harga: 8000 },
  { nama: 'Kunyit', satuan: 'Kg', harga: 10000 },
  { nama: 'Lada', satuan: 'Kg', harga: 205000 },
  { nama: 'Lengkuas', satuan: 'Kg', harga: 8000 },
  { nama: 'Mie Sealon', satuan: 'Pcs', harga: 10000 },
  { nama: 'Nangka Muda', satuan: 'Kg', harga: 10000 },
  { nama: 'Royco', satuan: 'Pcs', harga: 417 },
  { nama: 'Tahu', satuan: 'Pcs', harga: 500 },
  { nama: 'Telur', satuan: 'Kg', harga: 23500 },
  { nama: 'Terasi', satuan: 'Kg', harga: 45000 },
  { nama: 'Tomat', satuan: 'Kg', harga: 10000 },
  { nama: 'Wortel', satuan: 'Kg', harga: 10000 },
  { nama: 'Nasi', satuan: 'Kg', harga: 16000 },
  { nama: 'Kecap', satuan: 'Ml', harga: 26000 },
];

async function main() {
  console.log('🌱 Seeding bahan baku...');

  // Hapus data lama
  await prisma.bahanBaku.deleteMany();
  console.log('🗑️ Data lama dihapus');

  // Insert bahan baku
  for (const data of bahanBakuData) {
    await prisma.bahanBaku.create({
      data: {
        nama: data.nama,
        satuan: data.satuan,
        harga: data.harga,
        stok: 0,
        stokMinimal: 0,
      },
    });
    console.log(`✅ ${data.nama} (${data.satuan}) - Rp${data.harga.toLocaleString()}`);
  }

  console.log(`✅ Total ${bahanBakuData.length} bahan baku berhasil di-seed`);
  await prisma.$disconnect();
}

main().catch(console.error);