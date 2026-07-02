// prisma/seed-laporan-bulanan.ts

import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const laporanData = [
  // Januari 2025
  { bulan: 'Januari 2025', menu: 'Nasi Gudeg Campur', qtyProduksi: 8090, costPerPortion: 11111, jumlahCost: 89890190, labaKotor: 129440000, profit: 39549810 },
  { bulan: 'Januari 2025', menu: 'Ayam Bakar Bumbu Rujak', qtyProduksi: 760, costPerPortion: 16379, jumlahCost: 12448192, labaKotor: 17480000, profit: 5031808 },
  { bulan: 'Januari 2025', menu: 'Ayam Bakar Bumbu Kecap', qtyProduksi: 760, costPerPortion: 14175, jumlahCost: 10773156, labaKotor: 17480000, profit: 6706844 },
  // Februari 2025
  { bulan: 'Februari 2025', menu: 'Nasi Gudeg Campur', qtyProduksi: 6400, costPerPortion: 11111, jumlahCost: 71112141, labaKotor: 102400000, profit: 31287859 },
  { bulan: 'Februari 2025', menu: 'Ayam Bakar Bumbu Rujak', qtyProduksi: 560, costPerPortion: 16379, jumlahCost: 9172352, labaKotor: 12880000, profit: 3707648 },
  { bulan: 'Februari 2025', menu: 'Ayam Bakar Bumbu Kecap', qtyProduksi: 560, costPerPortion: 14175, jumlahCost: 7938115, labaKotor: 12880000, profit: 4941885 },
  // Maret 2025
  { bulan: 'Maret 2025', menu: 'Nasi Gudeg Campur', qtyProduksi: 2950, costPerPortion: 11111, jumlahCost: 32778252, labaKotor: 47200000, profit: 14421748 },
  { bulan: 'Maret 2025', menu: 'Ayam Bakar Bumbu Rujak', qtyProduksi: 300, costPerPortion: 16379, jumlahCost: 4913760, labaKotor: 6900000, profit: 1986240 },
  { bulan: 'Maret 2025', menu: 'Ayam Bakar Bumbu Kecap', qtyProduksi: 280, costPerPortion: 14175, jumlahCost: 3969057, labaKotor: 6440000, profit: 2470943 },
  // April 2025
  { bulan: 'April 2025', menu: 'Nasi Gudeg Campur', qtyProduksi: 6432, costPerPortion: 11111, jumlahCost: 71467702, labaKotor: 102912000, profit: 31444298 },
  { bulan: 'April 2025', menu: 'Ayam Bakar Bumbu Rujak', qtyProduksi: 525, costPerPortion: 16379, jumlahCost: 8599080, labaKotor: 12075000, profit: 3475920 },
  { bulan: 'April 2025', menu: 'Ayam Bakar Bumbu Kecap', qtyProduksi: 522, costPerPortion: 14175, jumlahCost: 7399457, labaKotor: 12006000, profit: 4606543 },
  // Mei 2025
  { bulan: 'Mei 2025', menu: 'Nasi Gudeg Campur', qtyProduksi: 6620, costPerPortion: 11111, jumlahCost: 73556621, labaKotor: 105920000, profit: 32363379 },
  { bulan: 'Mei 2025', menu: 'Ayam Bakar Bumbu Rujak', qtyProduksi: 572, costPerPortion: 16379, jumlahCost: 9368902, labaKotor: 13156000, profit: 3787098 },
  { bulan: 'Mei 2025', menu: 'Ayam Bakar Bumbu Kecap', qtyProduksi: 526, costPerPortion: 14175, jumlahCost: 7456158, labaKotor: 12098000, profit: 4641842 },
  // Juni 2025
  { bulan: 'Juni 2025', menu: 'Nasi Gudeg Campur', qtyProduksi: 7246, costPerPortion: 11111, jumlahCost: 80512277, labaKotor: 115936000, profit: 35423723 },
  { bulan: 'Juni 2025', menu: 'Ayam Bakar Bumbu Rujak', qtyProduksi: 610, costPerPortion: 16379, jumlahCost: 9991312, labaKotor: 14030000, profit: 4038688 },
  { bulan: 'Juni 2025', menu: 'Ayam Bakar Bumbu Kecap', qtyProduksi: 606, costPerPortion: 14175, jumlahCost: 8590174, labaKotor: 13938000, profit: 5347826 },
  // Juli 2025
  { bulan: 'Juli 2025', menu: 'Nasi Gudeg Campur', qtyProduksi: 7860, costPerPortion: 11111, jumlahCost: 87334598, labaKotor: 125760000, profit: 38425402 },
  { bulan: 'Juli 2025', menu: 'Ayam Bakar Bumbu Rujak', qtyProduksi: 740, costPerPortion: 16379, jumlahCost: 12120608, labaKotor: 17020000, profit: 4899392 },
  { bulan: 'Juli 2025', menu: 'Ayam Bakar Bumbu Kecap', qtyProduksi: 720, costPerPortion: 14175, jumlahCost: 10206148, labaKotor: 16560000, profit: 6353852 },
  // Agustus 2025
  { bulan: 'Agustus 2025', menu: 'Nasi Gudeg Campur', qtyProduksi: 6489, costPerPortion: 11111, jumlahCost: 72101044, labaKotor: 103824000, profit: 31722956 },
  { bulan: 'Agustus 2025', menu: 'Ayam Bakar Bumbu Rujak', qtyProduksi: 464, costPerPortion: 16379, jumlahCost: 7599949, labaKotor: 10672000, profit: 3072051 },
  { bulan: 'Agustus 2025', menu: 'Ayam Bakar Bumbu Kecap', qtyProduksi: 456, costPerPortion: 14175, jumlahCost: 6463894, labaKotor: 10488000, profit: 4024106 },
  // September 2025
  { bulan: 'September 2025', menu: 'Nasi Gudeg Campur', qtyProduksi: 5700, costPerPortion: 11111, jumlahCost: 63334250, labaKotor: 91200000, profit: 27865750 },
  { bulan: 'September 2025', menu: 'Ayam Bakar Bumbu Rujak', qtyProduksi: 380, costPerPortion: 16379, jumlahCost: 6224096, labaKotor: 8740000, profit: 2515904 },
  { bulan: 'September 2025', menu: 'Ayam Bakar Bumbu Kecap', qtyProduksi: 380, costPerPortion: 14175, jumlahCost: 5386578, labaKotor: 8740000, profit: 3353422 },
  // Oktober 2025
  { bulan: 'Oktober 2025', menu: 'Nasi Gudeg Campur', qtyProduksi: 8570, costPerPortion: 11111, jumlahCost: 95223601, labaKotor: 137120000, profit: 41896399 },
  { bulan: 'Oktober 2025', menu: 'Ayam Bakar Bumbu Rujak', qtyProduksi: 748, costPerPortion: 16379, jumlahCost: 12251642, labaKotor: 17204000, profit: 4952358 },
  { bulan: 'Oktober 2025', menu: 'Ayam Bakar Bumbu Kecap', qtyProduksi: 740, costPerPortion: 14175, jumlahCost: 10489652, labaKotor: 17020000, profit: 6530348 },
  // November 2025
  { bulan: 'November 2025', menu: 'Nasi Gudeg Campur', qtyProduksi: 5950, costPerPortion: 11111, jumlahCost: 66112068, labaKotor: 95200000, profit: 29087932 },
  { bulan: 'November 2025', menu: 'Ayam Bakar Bumbu Rujak', qtyProduksi: 420, costPerPortion: 16379, jumlahCost: 6879264, labaKotor: 9660000, profit: 2780736 },
  { bulan: 'November 2025', menu: 'Ayam Bakar Bumbu Kecap', qtyProduksi: 428, costPerPortion: 14175, jumlahCost: 6066988, labaKotor: 9844000, profit: 3777012 },
  // Desember 2025
  { bulan: 'Desember 2025', menu: 'Nasi Gudeg Campur', qtyProduksi: 7960, costPerPortion: 11111, jumlahCost: 88445725, labaKotor: 127360000, profit: 38914275 },
  { bulan: 'Desember 2025', menu: 'Ayam Bakar Bumbu Rujak', qtyProduksi: 724, costPerPortion: 16379, jumlahCost: 11858541, labaKotor: 16652000, profit: 4793459 },
  { bulan: 'Desember 2025', menu: 'Ayam Bakar Bumbu Kecap', qtyProduksi: 724, costPerPortion: 14175, jumlahCost: 10262849, labaKotor: 16652000, profit: 6389151 },
];

async function main() {
  console.log('🌱 Seeding laporan bulanan...');

  // CEK APAKAH TABEL ADA
  const checkResult = await pool.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = 'LaporanBulanan'
    )
  `);

  if (!checkResult.rows[0].exists) {
    console.log('❌ Tabel LaporanBulanan belum ada!');
    console.log('▶️ Jalankan: npx prisma db push');
    process.exit(1);
  }

  // Hapus data lama
  await pool.query(`TRUNCATE TABLE "LaporanBulanan"`);
  console.log('🗑️ Data lama dihapus');

  // Insert batch
  const batchSize = 50;
  let totalInserted = 0;

  for (let i = 0; i < laporanData.length; i += batchSize) {
    const batch = laporanData.slice(i, i + batchSize);
    
    const placeholders = batch.map((_, idx) => 
      `($${idx * 6 + 1}, $${idx * 6 + 2}, $${idx * 6 + 3}, $${idx * 6 + 4}, $${idx * 6 + 5}, $${idx * 6 + 6})`
    ).join(',');

    const values = batch.flatMap(item => [
      item.bulan,
      item.menu,
      item.qtyProduksi,
      item.costPerPortion,
      item.jumlahCost,
      item.labaKotor,
      item.profit,
    ]);

    await pool.query(`
      INSERT INTO "LaporanBulanan" (bulan, menu, qtyProduksi, costPerPortion, jumlahCost, labaKotor, profit)
      VALUES ${placeholders}
    `, values);

    totalInserted += batch.length;
    console.log(`✅ Inserted ${totalInserted}/${laporanData.length}`);
  }

  console.log('✅ Seed laporan bulanan selesai!');

  // Preview
  const preview = await pool.query(`
    SELECT * FROM "LaporanBulanan" LIMIT 10
  `);
  console.log('\n📋 Preview:');
  console.table(preview.rows);

  await pool.end();
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  });