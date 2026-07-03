// prisma/import-laporan-bulanan.ts

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

// Total Overhead per tahun = 140.446.771
const OVERHEAD_PER_BULAN = Math.round(140446771 / 12);

// ✅ GAJI PER BULAN (dari data penggajian)
// Kitchen: 3 orang × Rp100.000 × 338 hari = Rp101.400.000
// Seller: 2 orang × Rp50.000 × 338 hari = Rp33.800.000
// Total Gaji Tahunan = Rp135.200.000
const GAJI_PER_BULAN = Math.round(135200000 / 12); // Rp11.266.667

// ✅ DETAIL GAJI PER BULAN (berdasarkan hari kerja)
// Data ini diambil dari generate-csv.ts (338 hari kerja)
const GAJI_PER_BULAN_DETAIL = {
  'Januari 2025': 27 * 400000,   // 27 hari × Rp400.000 = Rp10.800.000
  'Februari 2025': 24 * 400000,  // 24 hari × Rp400.000 = Rp9.600.000
  'Maret 2025': 16 * 400000,     // 16 hari × Rp400.000 = Rp6.400.000
  'April 2025': 22 * 400000,     // 22 hari × Rp400.000 = Rp8.800.000
  'Mei 2025': 28 * 400000,       // 28 hari × Rp400.000 = Rp11.200.000
  'Juni 2025': 30 * 400000,      // 30 hari × Rp400.000 = Rp12.000.000
  'Juli 2025': 31 * 400000,      // 31 hari × Rp400.000 = Rp12.400.000
  'Agustus 2025': 31 * 400000,   // 31 hari × Rp400.000 = Rp12.400.000
  'September 2025': 30 * 400000, // 30 hari × Rp400.000 = Rp12.000.000
  'Oktober 2025': 24 * 400000,   // 24 hari × Rp400.000 = Rp9.600.000
  'November 2025': 30 * 400000,  // 30 hari × Rp400.000 = Rp12.000.000
  'Desember 2025': 31 * 400000,  // 31 hari × Rp400.000 = Rp12.400.000
};

console.log(`📊 Overhead per bulan: Rp${OVERHEAD_PER_BULAN.toLocaleString()}`);
console.log(`📊 Gaji per bulan (rata-rata): Rp${GAJI_PER_BULAN.toLocaleString()}`);
console.log(`📊 Total Overhead Tahunan: Rp${(OVERHEAD_PER_BULAN * 12).toLocaleString()}`);
console.log(`📊 Total Gaji Tahunan: Rp${(GAJI_PER_BULAN * 12).toLocaleString()}`);
console.log('\n📊 Detail Gaji per Bulan:');
for (const [bulan, gaji] of Object.entries(GAJI_PER_BULAN_DETAIL)) {
  console.log(`   ${bulan}: Rp${gaji.toLocaleString()}`);
}

function getBulanDate(bulanStr: string): Date {
  const months: Record<string, number> = {
    'Januari': 0, 'Februari': 1, 'Maret': 2, 'April': 3,
    'Mei': 4, 'Juni': 5, 'Juli': 6, 'Agustus': 7,
    'September': 8, 'Oktober': 9, 'November': 10, 'Desember': 11
  };
  
  const [namaBulan, tahun] = bulanStr.split(' ');
  const date = new Date(parseInt(tahun), months[namaBulan], 1);
  date.setHours(date.getHours() + 7);
  return date;
}

const laporanDataRaw = [
  // Januari 2025
  { bulanStr: 'Januari 2025', menu: 'Nasi Gudeg Campur', qtyProduksi: 8090, costPerPortion: 11111, jumlahCost: 89890190, labaKotor: 129440000 },
  { bulanStr: 'Januari 2025', menu: 'Ayam Bakar Bumbu Rujak', qtyProduksi: 760, costPerPortion: 16379, jumlahCost: 12448192, labaKotor: 17480000 },
  { bulanStr: 'Januari 2025', menu: 'Ayam Bakar Bumbu Kecap', qtyProduksi: 760, costPerPortion: 14175, jumlahCost: 10773156, labaKotor: 17480000 },
  // Februari 2025
  { bulanStr: 'Februari 2025', menu: 'Nasi Gudeg Campur', qtyProduksi: 6400, costPerPortion: 11111, jumlahCost: 71112141, labaKotor: 102400000 },
  { bulanStr: 'Februari 2025', menu: 'Ayam Bakar Bumbu Rujak', qtyProduksi: 560, costPerPortion: 16379, jumlahCost: 9172352, labaKotor: 12880000 },
  { bulanStr: 'Februari 2025', menu: 'Ayam Bakar Bumbu Kecap', qtyProduksi: 560, costPerPortion: 14175, jumlahCost: 7938115, labaKotor: 12880000 },
  // Maret 2025
  { bulanStr: 'Maret 2025', menu: 'Nasi Gudeg Campur', qtyProduksi: 2950, costPerPortion: 11111, jumlahCost: 32778252, labaKotor: 47200000 },
  { bulanStr: 'Maret 2025', menu: 'Ayam Bakar Bumbu Rujak', qtyProduksi: 300, costPerPortion: 16379, jumlahCost: 4913760, labaKotor: 6900000 },
  { bulanStr: 'Maret 2025', menu: 'Ayam Bakar Bumbu Kecap', qtyProduksi: 280, costPerPortion: 14175, jumlahCost: 3969057, labaKotor: 6440000 },
  // April 2025
  { bulanStr: 'April 2025', menu: 'Nasi Gudeg Campur', qtyProduksi: 6432, costPerPortion: 11111, jumlahCost: 71467702, labaKotor: 102912000 },
  { bulanStr: 'April 2025', menu: 'Ayam Bakar Bumbu Rujak', qtyProduksi: 525, costPerPortion: 16379, jumlahCost: 8599080, labaKotor: 12075000 },
  { bulanStr: 'April 2025', menu: 'Ayam Bakar Bumbu Kecap', qtyProduksi: 522, costPerPortion: 14175, jumlahCost: 7399457, labaKotor: 12006000 },
  // Mei 2025
  { bulanStr: 'Mei 2025', menu: 'Nasi Gudeg Campur', qtyProduksi: 6620, costPerPortion: 11111, jumlahCost: 73556621, labaKotor: 105920000 },
  { bulanStr: 'Mei 2025', menu: 'Ayam Bakar Bumbu Rujak', qtyProduksi: 572, costPerPortion: 16379, jumlahCost: 9368902, labaKotor: 13156000 },
  { bulanStr: 'Mei 2025', menu: 'Ayam Bakar Bumbu Kecap', qtyProduksi: 526, costPerPortion: 14175, jumlahCost: 7456158, labaKotor: 12098000 },
  // Juni 2025
  { bulanStr: 'Juni 2025', menu: 'Nasi Gudeg Campur', qtyProduksi: 7246, costPerPortion: 11111, jumlahCost: 80512277, labaKotor: 115936000 },
  { bulanStr: 'Juni 2025', menu: 'Ayam Bakar Bumbu Rujak', qtyProduksi: 610, costPerPortion: 16379, jumlahCost: 9991312, labaKotor: 14030000 },
  { bulanStr: 'Juni 2025', menu: 'Ayam Bakar Bumbu Kecap', qtyProduksi: 606, costPerPortion: 14175, jumlahCost: 8590174, labaKotor: 13938000 },
  // Juli 2025
  { bulanStr: 'Juli 2025', menu: 'Nasi Gudeg Campur', qtyProduksi: 7860, costPerPortion: 11111, jumlahCost: 87334598, labaKotor: 125760000 },
  { bulanStr: 'Juli 2025', menu: 'Ayam Bakar Bumbu Rujak', qtyProduksi: 740, costPerPortion: 16379, jumlahCost: 12120608, labaKotor: 17020000 },
  { bulanStr: 'Juli 2025', menu: 'Ayam Bakar Bumbu Kecap', qtyProduksi: 720, costPerPortion: 14175, jumlahCost: 10206148, labaKotor: 16560000 },
  // Agustus 2025
  { bulanStr: 'Agustus 2025', menu: 'Nasi Gudeg Campur', qtyProduksi: 6489, costPerPortion: 11111, jumlahCost: 72101044, labaKotor: 103824000 },
  { bulanStr: 'Agustus 2025', menu: 'Ayam Bakar Bumbu Rujak', qtyProduksi: 464, costPerPortion: 16379, jumlahCost: 7599949, labaKotor: 10672000 },
  { bulanStr: 'Agustus 2025', menu: 'Ayam Bakar Bumbu Kecap', qtyProduksi: 456, costPerPortion: 14175, jumlahCost: 6463894, labaKotor: 10488000 },
  // September 2025
  { bulanStr: 'September 2025', menu: 'Nasi Gudeg Campur', qtyProduksi: 5700, costPerPortion: 11111, jumlahCost: 63334250, labaKotor: 91200000 },
  { bulanStr: 'September 2025', menu: 'Ayam Bakar Bumbu Rujak', qtyProduksi: 380, costPerPortion: 16379, jumlahCost: 6224096, labaKotor: 8740000 },
  { bulanStr: 'September 2025', menu: 'Ayam Bakar Bumbu Kecap', qtyProduksi: 380, costPerPortion: 14175, jumlahCost: 5386578, labaKotor: 8740000 },
  // Oktober 2025
  { bulanStr: 'Oktober 2025', menu: 'Nasi Gudeg Campur', qtyProduksi: 8570, costPerPortion: 11111, jumlahCost: 95223601, labaKotor: 137120000 },
  { bulanStr: 'Oktober 2025', menu: 'Ayam Bakar Bumbu Rujak', qtyProduksi: 748, costPerPortion: 16379, jumlahCost: 12251642, labaKotor: 17204000 },
  { bulanStr: 'Oktober 2025', menu: 'Ayam Bakar Bumbu Kecap', qtyProduksi: 740, costPerPortion: 14175, jumlahCost: 10489652, labaKotor: 17020000 },
  // November 2025
  { bulanStr: 'November 2025', menu: 'Nasi Gudeg Campur', qtyProduksi: 5950, costPerPortion: 11111, jumlahCost: 66112068, labaKotor: 95200000 },
  { bulanStr: 'November 2025', menu: 'Ayam Bakar Bumbu Rujak', qtyProduksi: 420, costPerPortion: 16379, jumlahCost: 6879264, labaKotor: 9660000 },
  { bulanStr: 'November 2025', menu: 'Ayam Bakar Bumbu Kecap', qtyProduksi: 428, costPerPortion: 14175, jumlahCost: 6066988, labaKotor: 9844000 },
  // Desember 2025
  { bulanStr: 'Desember 2025', menu: 'Nasi Gudeg Campur', qtyProduksi: 7960, costPerPortion: 11111, jumlahCost: 88445725, labaKotor: 127360000 },
  { bulanStr: 'Desember 2025', menu: 'Ayam Bakar Bumbu Rujak', qtyProduksi: 724, costPerPortion: 16379, jumlahCost: 11858541, labaKotor: 16652000 },
  { bulanStr: 'Desember 2025', menu: 'Ayam Bakar Bumbu Kecap', qtyProduksi: 724, costPerPortion: 14175, jumlahCost: 10262849, labaKotor: 16652000 },
];

function processLaporanData(data: any[]) {
  const grouped: Record<string, any[]> = {};
  
  for (const item of data) {
    if (!grouped[item.bulanStr]) {
      grouped[item.bulanStr] = [];
    }
    grouped[item.bulanStr].push(item);
  }

  const result = [];
  for (const bulanStr of Object.keys(grouped)) {
    const items = grouped[bulanStr];
    const totalQty = items.reduce((sum, item) => sum + item.qtyProduksi, 0);
    const bulanDate = getBulanDate(bulanStr);
    
    // ✅ Ambil gaji detail per bulan dari GAJI_PER_BULAN_DETAIL
    const gajiBulan = GAJI_PER_BULAN_DETAIL[bulanStr as keyof typeof GAJI_PER_BULAN_DETAIL] || GAJI_PER_BULAN;
    
    const itemsWithCost = items.map((item) => {
      const overhead = Math.round((item.qtyProduksi / totalQty) * OVERHEAD_PER_BULAN);
      // ✅ Gaji dibagi proporsional berdasarkan qty produksi
      const gaji = Math.round((item.qtyProduksi / totalQty) * gajiBulan);
      const totalCost = item.jumlahCost + overhead + gaji;
      const profit = item.labaKotor - totalCost;
      
      return {
        ...item,
        bulan: bulanDate,
        overhead,
        gaji,
        totalCost,
        profit,
      };
    });
    
    result.push(...itemsWithCost);
  }
  
  return result;
}

async function importLaporan() {
  console.log('📥 Importing laporan bulanan dengan overhead & gaji detail...');
  console.log(`📊 Overhead per bulan: Rp${OVERHEAD_PER_BULAN.toLocaleString()}`);
  console.log(`📊 Total Gaji Tahunan: Rp135.200.000`);
  console.log('\n📊 Detail Gaji per Bulan:');
  for (const [bulan, gaji] of Object.entries(GAJI_PER_BULAN_DETAIL)) {
    console.log(`   ${bulan}: Rp${gaji.toLocaleString()}`);
  }
  
  const processedData = processLaporanData(laporanDataRaw);
  console.log(`\n📊 Found ${processedData.length} records`);

  // Hapus data lama
  await prisma.laporanBulanan.deleteMany();
  console.log('🗑️ Data lama dihapus');

  const batchSize = 50;
  let batch: any[] = [];
  let totalInserted = 0;

  for (const item of processedData) {
    batch.push({
      bulan: item.bulan,
      menu: item.menu,
      qtyProduksi: item.qtyProduksi,
      costPerPortion: item.costPerPortion,
      jumlahCost: item.jumlahCost,
      overhead: item.overhead,
      gaji: item.gaji,
      labaKotor: item.labaKotor,
      profit: item.profit,
    });

    if (batch.length >= batchSize) {
      await prisma.laporanBulanan.createMany({ data: batch });
      totalInserted += batch.length;
      batch = [];
      console.log(`✅ Inserted ${totalInserted}/${processedData.length}`);
    }
  }

  if (batch.length > 0) {
    await prisma.laporanBulanan.createMany({ data: batch });
    totalInserted += batch.length;
  }

  console.log(`✅ Import selesai! Total: ${totalInserted} records`);

  // Preview
  const preview = await prisma.laporanBulanan.findMany({
    take: 10,
    orderBy: { bulan: 'asc' },
  });
  console.log('\n📋 Preview:');
  preview.forEach(p => {
    const bulanStr = p.bulan.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    console.log(`   ${bulanStr} | ${p.menu} | Gaji:${p.gaji.toLocaleString()} | Overhead:${p.overhead.toLocaleString()} | Profit:${p.profit.toLocaleString()}`);
  });

  // Summary per bulan
  const summary = await prisma.$queryRaw`
    SELECT 
      TO_CHAR(bulan, 'Month YYYY') as bulan,
      SUM(overhead) as total_overhead,
      SUM(gaji) as total_gaji,
      SUM(profit) as total_profit
    FROM "LaporanBulanan"
    GROUP BY bulan
    ORDER BY bulan
  `;
  console.log('\n📊 Summary per bulan:');
  console.table(summary);

  await prisma.$disconnect();
}

importLaporan().catch(console.error);