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

// ✅ HARGA PER SATUAN (bukan per kg)
// Semua harga dalam satuan terkecil (g, ml, lbr)
const bahanBakuData = [
  // Bumbu Dapur
  { nama: 'Ajinomoto', satuan: 'g', harga: 0 }, // 2.650/50g = 53/g
  { nama: 'Asem', satuan: 'g', harga: 0 }, // 25.000/kg = 25/g
  { nama: 'Bawang Merah', satuan: 'g', harga: 0 }, // 32.000/kg = 32/g
  { nama: 'Bawang Putih', satuan: 'g', harga: 0 }, // 22.000/kg = 22/g
  { nama: 'Cabai Merah', satuan: 'g', harga: 0 }, // 42.000/kg = 42/g
  { nama: 'Cabai Rawit', satuan: 'g', harga: 0 }, // 48.000/kg = 48/g
  { nama: 'Daun Bawang', satuan: 'g', harga: 0 }, // 9.000/kg = 9/g
  { nama: 'Daun Salam', satuan: 'Lbr', harga: 0 }, // 1.500/10lbr = 150/lbr
  { nama: 'Garam', satuan: 'Pcs', harga: 0.0 }, // 250/kg = 0.25/g
  { nama: 'Gula Merah', satuan: 'g', harga: 0 }, // 14.000/kg = 14/g
  { nama: 'Gula Putih', satuan: 'g', harga: 0 }, // 17.000/kg = 17/g
  { nama: 'Kelapa', satuan: 'Pcs', harga: 0 }, // 8.000/kg = 8/g
  { nama: 'Kemiri', satuan: 'g', harga: 0 }, // 42.000/kg = 42/g
  { nama: 'Kentang', satuan: 'g', harga: 0.0 }, // 10.500/kg = 10.5/g
  { nama: 'Ketumbar', satuan: 'g', harga: 0 }, // 45.000/kg = 45/g
  { nama: 'Krecek Rambak', satuan: 'g', harga: 0 }, // 100.000/kg = 100/g
  { nama: 'Kubis Sayur', satuan: 'g', harga: 0 }, // 6.000/kg = 6/g
  { nama: 'Kunyit', satuan: 'g', harga: 0 }, // 10.000/kg = 10/g
  { nama: 'Lada', satuan: 'g', harga: 0 }, // 205.000/kg = 205/g
  { nama: 'Lengkuas', satuan: 'g', harga: 0 }, // 8.000/kg = 8/g
  { nama: 'Mie Sealon', satuan: 'Pcs', harga: 0 }, // 10.000/kg = 10/g
  { nama: 'Nangka Muda', satuan: 'g', harga: 0 }, // 10.000/kg = 10/g
  { nama: 'Royco', satuan: 'Pcs', harga: 0.0 }, // 417/100g = 4.17/g
  { nama: 'Tahu', satuan: 'Pcs', harga: 0.0 }, // 500/kg = 0.5/g
  { nama: 'Telur', satuan: 'g', harga: 0.0 }, // 21.150/kg = 21.15/g
  { nama: 'Terasi', satuan: 'g', harga: 0 }, // 45.000/kg = 45/g
  { nama: 'Tomat', satuan: 'g', harga: 0 }, // 8.000/kg = 8/g
  { nama: 'Wortel', satuan: 'g', harga: 0 }, // 9.000/kg = 9/g
  { nama: 'Nasi', satuan: 'g', harga: 0 }, // 16.000/kg = 16/g
  { nama: 'Ayam', satuan: 'g', harga: 0 }, // 48.000/kg = 48/g
  { nama: 'Kecap', satuan: 'ml', harga: 0.0 }, // 26.000/950ml = 27.37/ml
];

async function main() {
  console.log('🌱 Seeding bahan baku dengan harga per satuan...');
  console.log('📦 Harga dalam satuan terkecil (g, ml, lbr)');

  await prisma.bahanBaku.deleteMany();
  console.log('🗑️ Data lama dihapus');

  for (const data of bahanBakuData) {
    await prisma.bahanBaku.create({
      data: {
        nama: data.nama,
        satuan: data.satuan,
        harga: Math.round(data.harga * 1000) / 1000, // Simpan dengan 3 desimal
        stok: 0,
        stokMinimal: 0,
      },
    });
    console.log(`✅ ${data.nama} (${data.satuan}) - Rp${data.harga}/${data.satuan}`);
  }

  console.log(`✅ Total ${bahanBakuData.length} bahan baku berhasil di-seed`);
  await prisma.$disconnect();
}

main().catch(console.error);