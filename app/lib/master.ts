// app/lib/master.ts

import { prisma } from './prisma';

export async function getMasterByDate(tanggal: Date, productId?: string) {
  const whereClause: any = {
    tanggalBerlaku: { lte: tanggal },
  };
  
  if (productId) {
    whereClause.productId = productId;
  }
  
  const master = await prisma.masterData.findFirst({
    where: whereClause,
    orderBy: { tanggalBerlaku: 'desc' },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          sku: true,
        },
      },
    },
  });
  
  return master;
}

export async function getMasterTerbaru(productId?: string) {
  const whereClause: any = {};
  if (productId) {
    whereClause.productId = productId;
  }
  
  const master = await prisma.masterData.findFirst({
    where: whereClause,
    orderBy: { tanggalBerlaku: 'desc' },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          sku: true,
        },
      },
    },
  });
  return master;
}

export async function getAllMasters(productId?: string) {
  const whereClause: any = {};
  if (productId) {
    whereClause.productId = productId;
  }
  
  const masters = await prisma.masterData.findMany({
    where: whereClause,
    orderBy: { tanggalBerlaku: 'desc' },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          sku: true,
        },
      },
    },
  });
  return masters;
}