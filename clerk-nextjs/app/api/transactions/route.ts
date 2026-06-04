// app/api/transactions/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import db from '@/lib/db'

// 1. GET: Fetch all transactions for the logged-in user
export async function GET() {
  try {
    // Fetch the authenticated user's ID from Clerk
    const { userId } = await auth()

    // Guard Clause: If no user is logged in, block the request
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Query Supabase via Prisma for transactions matching this userId
    const transactions = await db.transaction.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        transactionDate: 'desc', // Newest transactions appear first
      },
    })

    return NextResponse.json(transactions)
  } catch (error) {
    console.error('[TRANSACTIONS_GET_ERROR]', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

// 2. POST: Create a new transaction
export async function POST(req: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Parse the JSON data sent from the frontend form
    const body = await req.json()
    const { description, amount, type, category, paymentMethod, transactionDate } = body

    // Basic Validation: Ensure mandatory fields are present
    if (!description || !amount || !type || !category || !paymentMethod) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    // Insert the record into Supabase using Prisma
    const newTransaction = await db.transaction.create({
      data: {
        userId,
        description,
        amount: Number(amount), // Ensure it's stored as a float/number
        type,          // Must match 'INCOME' or 'EXPENSE'
        category,      // e.g., "Food"
        paymentMethod, // e.g., "GCash"
        transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
      },
    })

    return NextResponse.json(newTransaction)
  } catch (error) {
    console.error('[TRANSACTIONS_POST_ERROR]', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}