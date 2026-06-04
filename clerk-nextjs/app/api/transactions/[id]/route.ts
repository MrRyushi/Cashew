// app/api/transactions/[id]/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import db from '@/lib/db'

type RouteParams = {
  params: Promise<{ id: string }>
}

// 1. PUT: Update a specific transaction
export async function PUT(
  req: Request,
  { params }: RouteParams
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Next.js dynamic params are asynchronous
    const { id } = await params

    const body = await req.json()
    const { description, amount, type, category, paymentMethod, transactionDate } = body

    // SECURITY CHECK: Fetch the transaction first to verify ownership
    const existingTransaction = await db.transaction.findUnique({
      where: { id },
    })

    if (!existingTransaction) {
      return new NextResponse('Transaction not found', { status: 404 })
    }

    if (existingTransaction.userId !== userId) {
      return new NextResponse('Forbidden: You do not own this transaction', { status: 403 })
    }

    // Update the transaction safely
    const updatedTransaction = await db.transaction.update({
      where: { id },
      data: {
        description,
        amount: amount ? Number(amount) : undefined,
        type,
        category,
        paymentMethod,
        transactionDate: transactionDate ? new Date(transactionDate) : undefined,
      },
    })

    return NextResponse.json(updatedTransaction)
  } catch (error) {
    console.error('[TRANSACTION_PUT_ERROR]', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

// 2. DELETE: Remove a specific transaction
export async function DELETE(
  req: Request,
  { params }: RouteParams
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { id } = await params

    // SECURITY CHECK: Fetch the transaction first to verify ownership
    const existingTransaction = await db.transaction.findUnique({
      where: { id },
    })

    if (!existingTransaction) {
      return new NextResponse('Transaction not found', { status: 404 })
    }

    if (existingTransaction.userId !== userId) {
      return new NextResponse('Forbidden: You do not own this transaction', { status: 403 })
    }

    // Delete the transaction from Supabase
    await db.transaction.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Transaction successfully deleted' })
  } catch (error) {
    console.error('[TRANSACTION_DELETE_ERROR]', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}