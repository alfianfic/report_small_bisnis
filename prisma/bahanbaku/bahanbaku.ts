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

// ✅ HARGA 0, STOK 0, STOK MINIMAL 0
// Harga akan diisi dari pembelian bahan baku
const bahanBakuData = [
  { nama: 'Ajinomoto', satuan: 'g' },
  { nama: 'Asem', satuan: 'g' },
  { nama: 'Ayam', satuan: 'g' },
  { nama: 'Bawang Merah', satuan: 'g' },
  { nama: 'Bawang Putih', satuan: 'g' },
  { nama: 'Cabai Merah', satuan: 'g' },
  { nama: 'Cabai Rawit', satuan: 'g' },
  { nama: 'Daun Bawang', satuan: 'g' },
  { nama: 'Daun Salam', satuan: 'Lbr' },
  { nama: 'Garam', satuan: 'g' },
  { nama: 'Gula Merah', satuan: 'g' },
  { nama: 'Gula Putih', satuan: 'g' },
  { nama: 'Kelapa', satuan: 'g' },
  { nama: 'Kemiri', satuan: 'g' },
  { nama: 'Kentang', satuan: 'g' },
  { nama: 'Ketumbar', satuan: 'g' },
  { nama: 'Krecek Rambak', satuan: 'g' },
  { nama: 'Kubis Sayur', satuan: 'g' },
  { nama: 'Kunyit', satuan: 'g' },
  { nama: 'Lada', satuan: 'g' },
  { nama: 'Lengkuas', satuan: 'g' },
  { nama: 'Mie Sealon', satuan: 'g' },
  { nama: 'Nangka Muda', satuan: 'g' },
  { nama: 'Royco', satuan: 'g' },
  { nama: 'Tahu', satuan: 'g' },
  { nama: 'Telur', satuan: 'g' },
  { nama: 'Terasi', satuan: 'g' },
  { nama: 'Tomat', satuan: 'g' },
  { nama: 'Wortel', satuan: 'g' },
  { nama: 'Nasi', satuan: 'g' },
  { nama: 'Kecap', satuan: 'ml' },
];

async function main() {
  console.log('🌱 Seeding bahan baku...');
  console.log('📦 Harga = 0, Stok = 0, Stok Minimal = 0');
  console.log('💡 Harga akan diisi dari pembelian bahan baku');

  await prisma.bahanBaku.deleteMany();
  console.log('🗑️ Data lama dihapus');

  for (const data of bahanBakuData) {
    await prisma.bahanBaku.create({
      data: {
        nama: data.nama,
        satuan: data.satuan,
        harga: 0,        // ✅ Akan diisi dari pembelian
        stok: 0,         // ✅ Akan bertambah dari pembelian
        stokMinimal: 0,  // ✅ Nanti dihitung dari produk
      },
    });
    console.log(`✅ ${data.nama} (${data.satuan}) - harga: Rp0, stok: 0`);
  }

  console.log(`✅ Total ${bahanBakuData.length} bahan baku berhasil di-seed`);
  await prisma.$disconnect();
}

main().catch(console.error);