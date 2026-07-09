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

interface ResepItem {
  bahanBakuNama: string;
  qty: number;
}

interface ProdukResep {
  nama: string;
  sku: string;
  hpp: number;
  hargaJual: number;
  targetStok: number;
  resep: ResepItem[];
}

const produkResepData: ProdukResep[] = [
  {
    nama: 'Nasi Gudeg Campur',
    sku: 'GUD-001',
    hpp: 11111,
    hargaJual: 16000,
    targetStok: 200,
    resep: [
      { bahanBakuNama: 'Ajinomoto', qty: 1.04 }, // 0.00104 kg = 1.04 g
      { bahanBakuNama: 'Asem', qty: 0.08 }, // 0.00008 kg = 0.08 g
      { bahanBakuNama: 'Ayam', qty: 200 }, // 0.2 kg = 200 g
      { bahanBakuNama: 'Bawang Merah', qty: 4.4 }, // 0.0044 kg = 4.4 g
      { bahanBakuNama: 'Bawang Putih', qty: 7.4 }, // 0.0074 kg = 7.4 g
      { bahanBakuNama: 'Cabai Merah', qty: 10 }, // 0.01 kg = 10 g
      { bahanBakuNama: 'Cabai Rawit', qty: 3 }, // 0.003 kg = 3 g
      { bahanBakuNama: 'Daun Bawang', qty: 1 }, // 0.001 kg = 1 g
      { bahanBakuNama: 'Daun Salam', qty: 0.14 }, // 0.14 x 10 = 1.4 lbr
      { bahanBakuNama: 'Garam', qty: 0.108 }, // 0.108 kg = 108 g
      { bahanBakuNama: 'Gula Merah', qty: 16.4 }, // 0.0164 kg = 16.4 g
      { bahanBakuNama: 'Gula Putih', qty: 4.144 }, // 0.004144 kg = 4.144 g
      { bahanBakuNama: 'Kelapa', qty: 0.088 }, // 0.088 kg = 88 g
      { bahanBakuNama: 'Kemiri', qty: 3.8 }, // 0.0038 kg = 3.8 g
      { bahanBakuNama: 'Kentang', qty: 40 }, // 0.04 kg = 40 g
      { bahanBakuNama: 'Ketumbar', qty: 0.08 }, // 0.00008 kg = 0.08 g
      { bahanBakuNama: 'Krecek Rambak', qty: 2 }, // 0.002 kg = 2 g
      { bahanBakuNama: 'Kubis Sayur', qty: 8 }, // 0.008 kg = 8 g
      { bahanBakuNama: 'Kunyit', qty: 0.268 }, // 0.000268 kg = 0.268 g
      { bahanBakuNama: 'Lada', qty: 0.144 }, // 0.000144 kg = 0.144 g
      { bahanBakuNama: 'Lengkuas', qty: 1.056 }, // 0.001056 kg = 1.056 g
      { bahanBakuNama: 'Mie Sealon', qty: 0.012 }, // 0.012 kg = 12 g
      { bahanBakuNama: 'Nangka Muda', qty: 40 }, // 0.04 kg = 40 g
      { bahanBakuNama: 'Nasi', qty: 80 }, // 0.08 kg = 80 g
      { bahanBakuNama: 'Royco', qty: 0.068 }, // 0.068 kg = 68 g
      { bahanBakuNama: 'Tahu', qty: 0.240 }, // 0.24 kg = 240 g
      { bahanBakuNama: 'Telur', qty: 25 }, // 0.025 kg = 25 g
      { bahanBakuNama: 'Terasi', qty: 0.8 }, // 0.0008 kg = 0.8 g
      { bahanBakuNama: 'Tomat', qty: 8 }, // 0.008 kg = 8 g
      { bahanBakuNama: 'Wortel', qty: 2 }, // 0.002 kg = 2 g
    ]
  },
  {
    nama: 'Ayam Bakar Bumbu Rujak',
    sku: 'AYM-001',
    hpp: 16379,
    hargaJual: 23000,
    targetStok: 100,
    resep: [
      { bahanBakuNama: 'Ayam', qty: 500 }, // 0.25 kg = 250 g
      { bahanBakuNama: 'Cabai Merah', qty: 50 }, // 0.05 kg = 50 g
      { bahanBakuNama: 'Cabai Rawit', qty: 5 }, // 0.005 kg = 5 g
      { bahanBakuNama: 'Bawang Putih', qty: 10 }, // 0.01 kg = 10 g
      { bahanBakuNama: 'Kemiri', qty: 10 }, // 0.01 kg = 10 g
      { bahanBakuNama: 'Garam', qty: 0.2 }, // 0.2 kg = 200 g
      { bahanBakuNama: 'Ajinomoto', qty: 2.5 }, // 0.0025 kg = 2.5 g
      { bahanBakuNama: 'Royco', qty: 0.1 }, // 0.1 kg = 100 g
      { bahanBakuNama: 'Gula Putih', qty: 10 }, // 0.01 kg = 10 g
    ]
  },
  {
    nama: 'Ayam Bakar Bumbu Kecap',
    sku: 'AYM-002',
    hpp: 14175,
    hargaJual: 23000,
    targetStok: 100,
    resep: [
      { bahanBakuNama: 'Ayam', qty: 500 }, // 0.25 kg = 250 g
      { bahanBakuNama: 'Bawang Merah', qty: 10 }, // 0.01 kg = 10 g
      { bahanBakuNama: 'Bawang Putih', qty: 10 }, // 0.01 kg = 10 g
      { bahanBakuNama: 'Cabai Rawit', qty: 5 }, // 0.005 kg = 5 g
      { bahanBakuNama: 'Daun Salam', qty: 0.35 }, // 0.35 x 10 = 3.5 lbr
      { bahanBakuNama: 'Lengkuas', qty: 3.3 }, // 0.0033 kg = 3.3 g
      { bahanBakuNama: 'Garam', qty: 0.1 }, // 0.1 kg = 100 g
      { bahanBakuNama: 'Gula Putih', qty: 10 }, // 0.01 kg = 10 g
      { bahanBakuNama: 'Royco', qty: 0.1 }, // 0.1 kg = 100 g
      { bahanBakuNama: 'Ajinomoto', qty: 2.5 }, // 0.0025 kg = 2.5 g
      { bahanBakuNama: 'Kecap', qty: 12.5 }, // 12.5 ml
    ]
  }
];

async function main() {
  console.log('🌱 Seeding resep produk...');

  // Get all bahan baku
  const bahanBakuMap = new Map();
  const bahanList = await prisma.bahanBaku.findMany();
  for (const bahan of bahanList) {
    bahanBakuMap.set(bahan.nama, bahan);
  }

  // Hapus data lama
  await prisma.produkBahanBaku.deleteMany();
  await prisma.produk.deleteMany();
  console.log('🗑️ Data lama dihapus');

  console.log('\n📋 DETAIL RESEP PER PRODUK:');
  console.log('='.repeat(80));

  for (const produkData of produkResepData) {
    console.log(`\n📦 ${produkData.nama} (${produkData.sku})`);
    console.log(`   Target HPP: Rp${produkData.hpp.toLocaleString()}`);
    console.log(`   Harga Jual: Rp${produkData.hargaJual.toLocaleString()}`);
    console.log('   ' + '-'.repeat(70));
    
    // Create produk
    const produk = await prisma.produk.create({
      data: {
        nama: produkData.nama,
        sku: produkData.sku,
        hpp: produkData.hpp,
        hargaJual: produkData.hargaJual,
        stok: 0,
        targetStok: produkData.targetStok,
        isActive: true,
      },
    });

    // Create resep
    let totalHPP = 0;
    console.log(`   ${'Nama Bahan'.padEnd(20)} ${'Qty'.padEnd(12)} ${'Satuan'.padEnd(8)} ${'Harga/Satuan'.padEnd(14)} ${'Subtotal'.padEnd(12)}`);
    console.log('   ' + '-'.repeat(70));
    
    for (const resepItem of produkData.resep) {
      const bahan = bahanBakuMap.get(resepItem.bahanBakuNama);
      if (!bahan) {
        console.warn(`   ⚠️ Bahan baku "${resepItem.bahanBakuNama}" tidak ditemukan!`);
        continue;
      }

      const subtotal = Math.round(resepItem.qty * bahan.harga);
      totalHPP += subtotal;

      await prisma.produkBahanBaku.create({
        data: {
          produkId: produk.id,
          bahanBakuId: bahan.id,
          qty: resepItem.qty,
        },
      });
      
      console.log(`   ${resepItem.bahanBakuNama.padEnd(20)} ${String(resepItem.qty).padEnd(12)} ${bahan.satuan.padEnd(8)} Rp${String(bahan.harga).padEnd(13)} Rp${subtotal.toLocaleString().padEnd(12)}`);
    }
    
    console.log('   ' + '-'.repeat(70));
    console.log(`   ${'Total HPP'.padEnd(20)} ${' '.padEnd(12)} ${' '.padEnd(8)} ${' '.padEnd(14)} Rp${totalHPP.toLocaleString()}`);
    console.log(`   ${'Selisih'.padEnd(20)} ${' '.padEnd(12)} ${' '.padEnd(8)} ${' '.padEnd(14)} Rp${(totalHPP - produkData.hpp).toLocaleString()}`);
    console.log(`   ${'Status'.padEnd(20)} ${' '.padEnd(12)} ${' '.padEnd(8)} ${' '.padEnd(14)} ${totalHPP === produkData.hpp ? '✅ SAMA' : '⚠️ BERBEDA'}`);
  }

  // Verifikasi
  const totalProduk = await prisma.produk.count();
  const totalResep = await prisma.produkBahanBaku.count();

  console.log('\n' + '='.repeat(80));
  console.log('📊 SUMMARY:');
  console.log(`✅ ${totalProduk} produk`);
  console.log(`✅ ${totalResep} resep terdaftar`);

  // Tampilkan detail produk dengan HPP
  const produkList = await prisma.produk.findMany({
    include: {
      bahanBaku: {
        include: {
          bahanBaku: true,
        },
      },
    },
  });

  console.log('\n📋 DETAIL HPP PRODUK:');
  console.log('='.repeat(80));
  for (const produk of produkList) {
    let calculatedHPP = 0;
    for (const item of produk.bahanBaku) {
      calculatedHPP += Math.round(item.qty * item.bahanBaku.harga);
    }
    console.log(`${produk.nama}:`);
    console.log(`  HPP Database: Rp${produk.hpp.toLocaleString()}`);
    console.log(`  HPP Resep:    Rp${calculatedHPP.toLocaleString()}`);
    console.log(`  Selisih:      Rp${(calculatedHPP - produk.hpp).toLocaleString()}`);
    console.log(`  Status:       ${calculatedHPP === produk.hpp ? '✅ SAMA' : '⚠️ BERBEDA'}`);
    console.log(`  Jumlah Bahan: ${produk.bahanBaku.length} bahan`);
    console.log('');
  }

  await prisma.$disconnect();
}

main().catch(console.error);