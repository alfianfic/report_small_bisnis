// prisma/seed.ts

import { PrismaClient, StatusStok } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seed...');

  // Hapus data lama (urutan penting karena relasi)
  await prisma.riwayatBelanja.deleteMany();
  await prisma.realisasiHarian.deleteMany();
  await prisma.masterData.deleteMany();
  await prisma.product.deleteMany();

  console.log('🗑️ Data lama berhasil dihapus');

  // ========================================
  // 1. BUAT 3 PRODUCTS
  // ========================================
  const productsData = [
    {
      name: 'Makanan 1',
      sku: 'MKN-001',
      description: 'Makanan utama varian 1',
      hppPerPorsi: 13000,
      hargaJualPerPorsi: 15000,
      labaPerPorsi: 2000,
      targetHarian: 200,
      stokAwal: 500,
      thresholdBelanja: 200,
      isActive: true,
    },
    {
      name: 'Makanan 2',
      sku: 'MKN-002',
      description: 'Makanan utama varian 2',
      hppPerPorsi: 14000,
      hargaJualPerPorsi: 17000,
      labaPerPorsi: 3000,
      targetHarian: 150,
      stokAwal: 400,
      thresholdBelanja: 150,
      isActive: true,
    },
    {
      name: 'Makanan 3',
      sku: 'MKN-003',
      description: 'Makanan utama varian 3',
      hppPerPorsi: 12000,
      hargaJualPerPorsi: 14000,
      labaPerPorsi: 2000,
      targetHarian: 100,
      stokAwal: 300,
      thresholdBelanja: 100,
      isActive: true,
    },
  ];

  const products = [];
  for (const p of productsData) {
    const product = await prisma.product.create({
      data: p,
    });
    products.push(product);
    console.log(`✅ Product created: ${product.name} (${product.sku})`);
  }

  // ========================================
  // 2. BUAT MASTER DATA UNTUK MASING-MASING PRODUCT
  // ========================================
  const masterDataList = [];
  for (const product of products) {
    const master = await prisma.masterData.create({
      data: {
        productId: product.id,
        tanggalBerlaku: new Date('2026-06-01'),
        hppPerPorsi: product.hppPerPorsi,
        hargaJualPerPorsi: product.hargaJualPerPorsi,
        labaPerPorsi: product.labaPerPorsi,
        targetHarian: product.targetHarian,
        stokAwal: product.stokAwal,
        thresholdBelanja: product.thresholdBelanja,
      },
    });
    masterDataList.push(master);
    console.log(`✅ MasterData created for ${product.name}: ${master.tanggalBerlaku.toISOString().split('T')[0]}`);
  }

  // ========================================
  // 3. BUAT REALISASI HARIAN UNTUK PRODUCT 1 (Makanan 1)
  // ========================================
  const product1 = products[0];
  const master1 = masterDataList[0];

  const realisasiData1 = [
    // Hari 1 - Senin (17 Juni 2026)
    {
      tanggal: new Date('2026-06-17'),
      terjual: 200,
      sisa: 300,
      stokAwal: 500,
      status: StatusStok.aman,
      perluBelanja: false,
    },
    // Hari 2 - Selasa (18 Juni 2026)
    {
      tanggal: new Date('2026-06-18'),
      terjual: 130,
      sisa: 170,
      stokAwal: 300,
      status: StatusStok.waspada,
      perluBelanja: false,
    },
    // Hari 3 - Rabu (19 Juni 2026)
    {
      tanggal: new Date('2026-06-19'),
      terjual: 130,
      sisa: 40,
      stokAwal: 170,
      status: StatusStok.waspada,
      perluBelanja: true,
    },
    // Hari 4 - Kamis (20 Juni 2026) - Ada Belanja
    {
      tanggal: new Date('2026-06-20'),
      terjual: 200,
      sisa: 140,
      stokAwal: 340,
      status: StatusStok.waspada,
      perluBelanja: false,
    },
    // Hari 5 - Jumat (21 Juni 2026)
    {
      tanggal: new Date('2026-06-21'),
      terjual: 140,
      sisa: 0,
      stokAwal: 140,
      status: StatusStok.habis,
      perluBelanja: true,
    },
    // Hari 6 - Sabtu (22 Juni 2026)
    {
      tanggal: new Date('2026-06-22'),
      terjual: 0,
      sisa: 0,
      stokAwal: 0,
      status: StatusStok.habis,
      perluBelanja: true,
    },
    // Hari 7 - Minggu (23 Juni 2026)
    {
      tanggal: new Date('2026-06-23'),
      terjual: 0,
      sisa: 0,
      stokAwal: 0,
      status: StatusStok.habis,
      perluBelanja: true,
    },
  ];

  for (const data of realisasiData1) {
    await prisma.realisasiHarian.create({
      data: {
        ...data,
        productId: product1.id,
        masterDataId: master1.id,
        hppPerPorsi: master1.hppPerPorsi,
        hargaJualPerPorsi: master1.hargaJualPerPorsi,
        labaPerPorsi: master1.labaPerPorsi,
        targetHarian: master1.targetHarian,
        thresholdBelanja: master1.thresholdBelanja,
      },
    });
  }
  console.log(`📊 ${realisasiData1.length} hari realisasi untuk ${product1.name}`);

  // ========================================
  // 4. BUAT BELANJA UNTUK PRODUCT 1
  // ========================================
  await prisma.riwayatBelanja.create({
    data: {
      tanggal: new Date('2026-06-20'),
      productId: product1.id,
      masterDataId: master1.id,
      jumlah: 300,
      total: null,
      jumlahSystem: null,
      totalSystem: 300 * master1.hppPerPorsi,
      hppPerPorsi: master1.hppPerPorsi,
      keterangan: 'Belanja stok karena sisa 40',
    },
  });
  console.log(`🛒 Belanja created for ${product1.name}`);

  // ========================================
  // 5. BUAT REALISASI UNTUK PRODUCT 2 (Makanan 2)
  // ========================================
  const product2 = products[1];
  const master2 = masterDataList[1];

  await prisma.realisasiHarian.create({
    data: {
      tanggal: new Date('2026-06-20'),
      productId: product2.id,
      masterDataId: master2.id,
      terjual: 100,
      sisa: 300,
      stokAwal: 400,
      status: StatusStok.aman,
      perluBelanja: false,
      hppPerPorsi: master2.hppPerPorsi,
      hargaJualPerPorsi: master2.hargaJualPerPorsi,
      labaPerPorsi: master2.labaPerPorsi,
      targetHarian: master2.targetHarian,
      thresholdBelanja: master2.thresholdBelanja,
    },
  });
  console.log(`📊 1 hari realisasi untuk ${product2.name}`);

  // ========================================
  // 6. BUAT REALISASI UNTUK PRODUCT 3 (Makanan 3)
  // ========================================
  const product3 = products[2];
  const master3 = masterDataList[2];

  await prisma.realisasiHarian.create({
    data: {
      tanggal: new Date('2026-06-21'),
      productId: product3.id,
      masterDataId: master3.id,
      terjual: 80,
      sisa: 220,
      stokAwal: 300,
      status: StatusStok.aman,
      perluBelanja: false,
      hppPerPorsi: master3.hppPerPorsi,
      hargaJualPerPorsi: master3.hargaJualPerPorsi,
      labaPerPorsi: master3.labaPerPorsi,
      targetHarian: master3.targetHarian,
      thresholdBelanja: master3.thresholdBelanja,
    },
  });
  console.log(`📊 1 hari realisasi untuk ${product3.name}`);

  // ========================================
  // 7. BUAT MASTER KEDUA UNTUK PRODUCT 1 (untuk testing tanggalBerlaku)
  // ========================================
  const master1B = await prisma.masterData.create({
    data: {
      productId: product1.id,
      tanggalBerlaku: new Date('2026-07-01'),
      hppPerPorsi: 15000,
      hargaJualPerPorsi: 18000,
      labaPerPorsi: 3000,
      targetHarian: 250,
      stokAwal: 600,
      thresholdBelanja: 150,
    },
  });
  console.log(`✅ MasterData kedua untuk ${product1.name}: berlaku 2026-07-01`);

  // ========================================
  // 8. BUAT REALISASI & BELANJA UNTUK MASTER BARU PRODUCT 1
  // ========================================
  await prisma.realisasiHarian.create({
    data: {
      tanggal: new Date('2026-07-03'),
      productId: product1.id,
      masterDataId: master1B.id,
      terjual: 180,
      sisa: 420,
      stokAwal: 600,
      status: StatusStok.aman,
      perluBelanja: false,
      hppPerPorsi: master1B.hppPerPorsi,
      hargaJualPerPorsi: master1B.hargaJualPerPorsi,
      labaPerPorsi: master1B.labaPerPorsi,
      targetHarian: master1B.targetHarian,
      thresholdBelanja: master1B.thresholdBelanja,
    },
  });
  console.log(`📊 1 hari realisasi untuk ${product1.name} dengan master baru`);

  await prisma.riwayatBelanja.create({
    data: {
      tanggal: new Date('2026-07-03'),
      productId: product1.id,
      masterDataId: master1B.id,
      jumlah: 50,
      total: null,
      jumlahSystem: null,
      totalSystem: 50 * master1B.hppPerPorsi,
      hppPerPorsi: master1B.hppPerPorsi,
      keterangan: 'Belanja stok tambahan',
    },
  });
  console.log(`🛒 Belanja untuk ${product1.name} dengan master baru`);

  // ========================================
  // RINGKASAN
  // ========================================
  const totalRealisasi = await prisma.realisasiHarian.count();
  const totalBelanja = await prisma.riwayatBelanja.count();
  const totalMaster = await prisma.masterData.count();

  console.log('\n✅ Seed data berhasil!');
  console.log(`📊 Total products: ${products.length}`);
  console.log(`📈 Total master data: ${totalMaster}`);
  console.log(`📊 Total realisasi: ${totalRealisasi}`);
  console.log(`🛒 Total belanja: ${totalBelanja}`);
  console.log('\n📌 Products:');
  for (const p of products) {
    console.log(`   - ${p.name} (${p.sku}): HPP Rp${p.hppPerPorsi}, Target ${p.targetHarian}`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });