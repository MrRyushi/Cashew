// app/api/budget/route.ts
//
// GET  /api/budget?month=6&year=2026
//   → Returns all budgets for the user in that month, each enriched with
//     "spent" (actual transactions) so the UI can render progress bars.
//
// POST /api/budget
//   → { category, limitAmount, month, year } — creates or updates a budget
//     (upsert so re-submitting the same category/month is safe)
//
// DELETE /api/budget?id=xxx
//   → Removes a budget by id (ownership verified)

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";

// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1));
    const year  = parseInt(searchParams.get("year")  ?? String(new Date().getFullYear()));

    if (isNaN(month) || isNaN(year) || month < 1 || month > 12) {
      return NextResponse.json({ error: "Invalid month or year" }, { status: 400 });
    }

    // ── Fetch budgets for this user/month/year ────────────────────────────────
    const budgets = await db.budget.findMany({
      where: { userId, month, year },
      orderBy: { category: "asc" },
    });

    // ── Fetch actual spending in that month, grouped by category ──────────────
    const startDate = new Date(year, month - 1, 1);
    const endDate   = new Date(year, month, 0, 23, 59, 59, 999);

    const transactions = await db.transaction.findMany({
      where: {
        userId,
        type: "EXPENSE",
        transactionDate: { gte: startDate, lte: endDate },
      },
      select: { category: true, amount: true },
    });

    // Build a category → spent map
    const spentMap: Record<string, number> = {};
    for (const tx of transactions) {
      spentMap[tx.category] = (spentMap[tx.category] ?? 0) + tx.amount;
    }

    // Enrich each budget with actual spent amount and derived fields
    const enriched = budgets.map((b) => {
      const spent      = Math.round((spentMap[b.category] ?? 0) * 100) / 100;
      const remaining  = Math.max(0, b.limitAmount - spent);
      const percentage = b.limitAmount > 0
        ? Math.min(100, Math.round((spent / b.limitAmount) * 100))
        : 0;
      const status =
        percentage >= 100 ? "over"    :
        percentage >= 80  ? "warning" : "safe";

      return { ...b, spent, remaining, percentage, status };
    });

    return NextResponse.json({ budgets: enriched, month, year });
  } catch (error) {
    console.error("[BUDGET_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST — upsert (create or update) ────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { category, limitAmount, month, year } = body;

    if (!category || typeof limitAmount !== "number" || limitAmount <= 0) {
      return NextResponse.json({ error: "Invalid budget data" }, { status: 400 });
    }

    if (!month || !year || month < 1 || month > 12) {
      return NextResponse.json({ error: "Invalid month or year" }, { status: 400 });
    }

    // Upsert: update if the same category/month/year already exists
    const budget = await db.budget.upsert({
      where: {
        userId_category_month_year: { userId, category, month, year },
      },
      create: { userId, category, limitAmount, month, year },
      update: { limitAmount },
    });

    return NextResponse.json(budget, { status: 201 });
  } catch (error) {
    console.error("[BUDGET_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── DELETE ──────────────────────────────────────────────────────────────────

export async function DELETE(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const existing = await db.budget.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }
    if (existing.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.budget.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[BUDGET_DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
