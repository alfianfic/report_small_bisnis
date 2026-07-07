// app/api/pembelian/route.ts

import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

// Definisikan tipe
interface BahanBakuItem {
  id: string;
  nama: string;
  satuan: string;
  harga: number;
  stok: number;
  stokMinimal: number;
  createdAt: Date;
  updatedAt: Date;
}

interface PembelianBahanItem {
  id: string;
  tanggal: Date;
  bahanBakuId: string;
  qty: number;
  harga: number;
  total: number;
  createdAt: Date;
  updatedAt: Date;
  bahan_nama: string;
  bahan_satuan: string;
}

interface PembelianRegulerItem {
  id: string;
  tanggal: Date;
  nama: string;
  detail: string | null;
  qty: number;
  harga: number;
  total: number;
  createdAt: Date;
  updatedAt: Date;
}

export async function GET() {
  try {
    // 1. Ambil dari PembelianBahanBaku
    const pembelianBahan = await prisma.$queryRaw<PembelianBahanItem[]>`
      SELECT 
        pbb.*,
        bb.nama as bahan_nama,
        bb.satuan as bahan_satuan
      FROM "PembelianBahanBaku" pbb
      LEFT JOIN "BahanBaku" bb ON pbb."bahanBakuId" = bb.id
      ORDER BY pbb."tanggal" DESC
    `;

    // 2. Ambil dari Pembelian
    const pembelianReguler = await prisma.$queryRaw<PembelianRegulerItem[]>`
      SELECT * FROM "Pembelian" 
      ORDER BY "tanggal" DESC
    `;

    // 3. Format data
    const allData = [];

    for (const item of pembelianBahan) {
      allData.push({
        id: item.id,
        tanggal: item.tanggal,
        nama: item.bahan_nama || 'Unknown',
        detail: `Pembelian ${item.bahan_nama || 'Unknown'}`,
        qty: item.qty,
        harga: item.harga,
        total: item.total,
        source: 'bahan_baku',
        satuan: item.bahan_satuan || '-',
      });
    }

    for (const item of pembelianReguler) {
      allData.push({
        id: item.id,
        tanggal: item.tanggal,
        nama: item.nama,
        detail: item.detail,
        qty: item.qty,
        harga: item.harga,
        total: item.total,
        source: 'reguler',
        satuan: '-',
      });
    }

    // Sort by tanggal
    allData.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

    return NextResponse.json({
      status: '✅ Berhasil!',
      data: allData,
      metadata: {
        total: allData.length,
        fromBahanBaku: pembelianBahan.length,
        fromReguler: pembelianReguler.length,
      },
    });
  } catch (error: any) {
    console.error('❌ Error fetching pembelian:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tanggal, nama, detail, qty, harga, total, bahanBakuId, isBahanBaku } = body;

    console.log('📝 POST /api/pembelian - Payload:', { tanggal, nama, qty, harga, total, bahanBakuId, isBahanBaku });

    // Validasi
    if (!tanggal || !nama || !qty || !harga) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'Tanggal, nama, qty, dan harga wajib diisi',
      }, { status: 400 });
    }

    const qtyNum = Number(qty);
    const hargaNum = Number(harga);
    const totalNum = Number(total);

    if (isNaN(qtyNum) || qtyNum <= 0) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'Qty harus lebih dari 0',
      }, { status: 400 });
    }

    if (isNaN(hargaNum) || hargaNum <= 0) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'Harga harus lebih dari 0',
      }, { status: 400 });
    }

    // Jika pembelian bahan baku
    if (isBahanBaku && bahanBakuId) {
      try {
        // 1. Insert ke PembelianBahanBaku
        await prisma.$executeRaw`
          INSERT INTO "PembelianBahanBaku" (
            id, "tanggal", "bahanBakuId", qty, harga, total, "createdAt", "updatedAt"
          ) VALUES (
            gen_random_uuid()::text, 
            ${new Date(tanggal)}::timestamp,
            ${bahanBakuId},
            ${qtyNum},
            ${hargaNum},
            ${totalNum},
            NOW(),
            NOW()
          )
        `;

        console.log('✅ PembelianBahanBaku created');

        // 2. Update stok bahan baku
        const bahanBaku = await prisma.$queryRaw<BahanBakuItem[]>`
          SELECT * FROM "BahanBaku" WHERE id = ${bahanBakuId}
        `;

        if (bahanBaku && bahanBaku.length > 0) {
          const item = bahanBaku[0];
          const totalStokLama = Number(item.stok);
          const totalHargaLama = totalStokLama * Number(item.harga);
          const totalStokBaru = totalStokLama + qtyNum;
          const totalHargaBaru = totalHargaLama + totalNum;
          const hargaRataRataBaru = totalStokBaru > 0 ? Math.round(totalHargaBaru / totalStokBaru) : 0;

          await prisma.$executeRaw`
            UPDATE "BahanBaku" 
            SET stok = ${totalStokBaru}, harga = ${hargaRataRataBaru}
            WHERE id = ${bahanBakuId}
          `;

          console.log('✅ Stok updated');
        }

        return NextResponse.json({
          status: '✅ Berhasil!',
          message: 'Pembelian bahan baku berhasil, stok diupdate',
        });
      } catch (error: any) {
        console.error('❌ Error processing bahan baku:', error);
        return NextResponse.json({
          status: '❌ GAGAL',
          error: 'Gagal memproses pembelian bahan baku',
          detail: error.message,
        }, { status: 500 });
      }
    } 
    // Pembelian reguler
    else {
      try {
        await prisma.$executeRaw`
          INSERT INTO "Pembelian" (
            id, tanggal, nama, detail, qty, harga, total, "createdAt", "updatedAt"
          ) VALUES (
            gen_random_uuid()::text,
            ${new Date(tanggal)}::timestamp,
            ${nama},
            ${detail || null},
            ${qtyNum},
            ${hargaNum},
            ${totalNum},
            NOW(),
            NOW()
          )
        `;

        console.log('✅ Pembelian created');

        return NextResponse.json({
          status: '✅ Berhasil!',
          message: 'Pembelian berhasil ditambahkan',
        });
      } catch (error: any) {
        console.error('❌ Error creating regular purchase:', error);
        return NextResponse.json({
          status: '❌ GAGAL',
          error: 'Gagal menyimpan pembelian reguler',
          detail: error.message,
        }, { status: 500 });
      }
    }
  } catch (error: any) {
    console.error('❌ Error creating pembelian:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message || 'Terjadi kesalahan saat menyimpan data',
    }, { status: 500 });
  }
}