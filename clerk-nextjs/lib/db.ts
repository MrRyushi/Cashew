// lib/db.ts
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const prismaClientSingleton = () => {
  // 1. Create the database adapter using your existing .env connection string
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
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