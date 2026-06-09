// lib/db.ts
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const prismaClientSingleton = () => {
  // 1. Create the database adapter using your .env connection string.
  //    Prisma config can load either DATABASE_URL or DIRECT_URL.
  const connectionString = process.env.DATABASE_URL ?? process.env.DIRECT_URL

  if (!connectionString) {
    throw new Error('DATABASE_URL or DIRECT_URL must be set to connect Prisma.')
  }

  const adapter = new PrismaPg({
    connectionString,
  })

  // 2. Pass the driver adapter directly into the Prisma Client constructor
  return new PrismaClient({ adapter })
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const db = globalThis.prisma ?? prismaClientSingleton()

export default db

if (process.env.NODE_ENV !== 'production') globalThis.prisma = db