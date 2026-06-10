// app/api/dashboard/route.ts

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";

// ─── GET /api/dashboard ───────────────────────────────────────────────────────
// Returns all data the dashboard needs in one round-trip:
//  • summary totals (income, expenses, balance, transaction count)
//  • monthly bar chart data (last 6 months)
//  • spending breakdown by category (for pie/donut chart)
//  • 5 most recent transactions
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Fetch all user transactions once — avoids multiple round-trips ─────────
    const transactions = await db.transaction.findMany({
      where: { userId },
      orderBy: { transactionDate: "desc" },
    });

    if (transactions.length === 0) {
      return NextResponse.json({
        summary: { totalIncome: 0, totalExpenses: 0, netBalance: 0, transactionCount: 0 },
        monthlyData: [],
        categoryBreakdown: [],
        recentTransactions: [],
      });
    }

    // ── Summary totals ─────────────────────────────────────────────────────────
    const totalIncome = transactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + t.amount, 0);

    const summary = {
      totalIncome,
      totalExpenses,
      netBalance: totalIncome - totalExpenses,
      transactionCount: transactions.length,
    };

    // ── Monthly bar chart — last 6 months ──────────────────────────────────────
    // Build a map of "YYYY-MM" → { income, expense }
    const now = new Date();
    const monthlyMap: Record<string, { income: number; expense: number }> = {};

    // Pre-populate last 6 months so months with no data still show as 0
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyMap[key] = { income: 0, expense: 0 };
    }

    transactions.forEach((t) => {
      const d = new Date(t.transactionDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      // Only include months within our 6-month window
      if (!(key in monthlyMap)) return;
      if (t.type === "INCOME") {
        monthlyMap[key].income += t.amount;
      } else {
        monthlyMap[key].expense += t.amount;
      }
    });

    // Convert to sorted array with a short month label for Recharts
    const monthlyData = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, values]) => {
        const [year, month] = key.split("-");
        const label = new Date(Number(year), Number(month) - 1, 1)
          .toLocaleString("en-PH", { month: "short" });
        return {
          month: label,
          income: Math.round(values.income * 100) / 100,
          expense: Math.round(values.expense * 100) / 100,
        };
      });

    // ── Category breakdown — expenses only ─────────────────────────────────────
    const categoryMap: Record<string, number> = {};
    transactions
      .filter((t) => t.type === "EXPENSE")
      .forEach((t) => {
        categoryMap[t.category] = (categoryMap[t.category] ?? 0) + t.amount;
      });

    const categoryBreakdown = Object.entries(categoryMap)
      .map(([category, total]) => ({
        category,
        total: Math.round(total * 100) / 100,
        // Percentage of total expenses
        percentage:
          totalExpenses > 0
            ? Math.round((total / totalExpenses) * 1000) / 10
            : 0,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6); // top 6 categories

    // ── Recent transactions — latest 5 ────────────────────────────────────────
    const recentTransactions = transactions.slice(0, 5).map((t) => ({
      id: t.id,
      description: t.description,
      amount: t.amount,
      type: t.type,
      category: t.category,
      paymentMethod: t.paymentMethod,
      transactionDate: t.transactionDate,
    }));

    return NextResponse.json({
      summary,
      monthlyData,
      categoryBreakdown,
      recentTransactions,
    });
  } catch (error) {
    console.error("[DASHBOARD_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
