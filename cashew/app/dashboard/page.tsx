"use client";

// app/dashboard/page.tsx

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie,
} from "recharts";
import {
  TrendingUp, TrendingDown, Wallet, ArrowUpRight,
  ArrowDownRight, ArrowRight, RefreshCw,
  ShoppingCart, Bus, Zap, Home, Heart, Tv,
  GraduationCap, Briefcase, LineChart as LineChartIcon,
  Gift, MoreHorizontal, CreditCard,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Summary {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  transactionCount: number;
}

interface MonthlyDataPoint {
  month: string;
  income: number;
  expense: number;
}

interface CategoryBreakdown {
  category: string;
  total: number;
  percentage: number;
}

interface RecentTransaction {
  id: string;
  description: string | null;
  amount: number;
  type: "INCOME" | "EXPENSE";
  category: string;
  paymentMethod: string;
  transactionDate: string;
}

interface DashboardData {
  summary: Summary;
  monthlyData: MonthlyDataPoint[];
  categoryBreakdown: CategoryBreakdown[];
  recentTransactions: RecentTransaction[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_META: Record<string, { icon: React.ElementType; color: string; bg: string; chartColor: string }> = {
  "Salary":         { icon: Briefcase,    color: "text-indigo-600",  bg: "bg-indigo-50",  chartColor: "#6366F1" },
  "Freelance":      { icon: LineChartIcon,color: "text-violet-600",  bg: "bg-violet-50",  chartColor: "#7C3AED" },
  "Business":       { icon: TrendingUp,   color: "text-blue-600",    bg: "bg-blue-50",    chartColor: "#2563EB" },
  "Investment":     { icon: ArrowUpRight, color: "text-emerald-600", bg: "bg-emerald-50", chartColor: "#059669" },
  "Gift":           { icon: Gift,         color: "text-pink-600",    bg: "bg-pink-50",    chartColor: "#DB2777" },
  "Food & Drink":   { icon: ShoppingCart, color: "text-orange-600",  bg: "bg-orange-50",  chartColor: "#EA580C" },
  "Transportation": { icon: Bus,          color: "text-sky-600",     bg: "bg-sky-50",     chartColor: "#0284C7" },
  "Utilities":      { icon: Zap,          color: "text-amber-600",   bg: "bg-amber-50",   chartColor: "#D97706" },
  "Rent":           { icon: Home,         color: "text-slate-600",   bg: "bg-slate-100",  chartColor: "#475569" },
  "Healthcare":     { icon: Heart,        color: "text-red-600",     bg: "bg-red-50",     chartColor: "#DC2626" },
  "Entertainment":  { icon: Tv,           color: "text-purple-600",  bg: "bg-purple-50",  chartColor: "#9333EA" },
  "Shopping":       { icon: ShoppingCart, color: "text-rose-600",    bg: "bg-rose-50",    chartColor: "#F43F5E" },
  "Education":      { icon: GraduationCap,color: "text-teal-600",    bg: "bg-teal-50",    chartColor: "#0D9488" },
  "Other":          { icon: MoreHorizontal,color:"text-slate-500",   bg: "bg-slate-100",  chartColor: "#94A3B8" },
  "Allowance":     { icon: DollarSign,         color: "text-yellow-600",    bg: "bg-yellow-50",    chartColor: "#F59E0B" },
};

const FALLBACK_META = { icon: MoreHorizontal, color: "text-slate-500", bg: "bg-slate-100", chartColor: "#94A3B8" };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatCompact(amount: number) {
  if (amount >= 1_000_000) return `₱${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000)     return `₱${(amount / 1_000).toFixed(1)}K`;
  return formatCurrency(amount);
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString())     return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

// ─── Skeleton Components ──────────────────────────────────────────────────────

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("bg-white rounded-2xl border border-slate-200 p-5 animate-pulse", className)}>
      <div className="h-3 bg-slate-100 rounded w-24 mb-4" />
      <div className="h-7 bg-slate-100 rounded w-36 mb-2" />
      <div className="h-2.5 bg-slate-100 rounded w-20" />
    </div>
  );
}

function SkeletonChart({ className }: { className?: string }) {
  return (
    <div className={cn("bg-white rounded-2xl border border-slate-200 p-5 animate-pulse", className)}>
      <div className="h-3 bg-slate-100 rounded w-32 mb-6" />
      <div className="flex items-end gap-3 h-40">
        {[60, 80, 45, 90, 70, 55].map((h, i) => (
          <div key={i} className="flex gap-1 items-end flex-1">
            <div className="bg-slate-100 rounded-t w-full" style={{ height: `${h}%` }} />
            <div className="bg-slate-100 rounded-t w-full" style={{ height: `${h * 0.6}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

interface TooltipPayload {
  dataKey: string;
  name: string;
  value: number;
  color: string;
  payload: Record<string, unknown>;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

// ─── Custom Tooltip for Bar Chart ─────────────────────────────────────────────

function CustomBarTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 text-white rounded-xl px-3 py-2.5 shadow-xl text-xs">
      <p className="font-semibold mb-1.5 text-slate-300">{label}</p>
      {payload.map((entry: TooltipPayload) => (
        <div key={entry.dataKey} className="flex items-center gap-2 mb-0.5">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: entry.color }}
          />
          <span className="text-slate-400 capitalize">{entry.dataKey}:</span>
          <span className="font-mono font-medium">{formatCompact(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useUser();
  const [data, setData]       = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError("Could not load dashboard. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const loadDashboard = async () => {
      await fetchDashboard();
    };
    void loadDashboard();
  }, [fetchDashboard]);

  const firstName = user?.firstName ?? "there";
  const isPositive = (data?.summary.netBalance ?? 0) >= 0;

  // ── Empty state ───────────────────────────────────────────────────────────
  const isEmpty =
    !loading &&
    !error &&
    data?.summary.transactionCount === 0;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-sm text-slate-500 mb-0.5">{getGreeting()},</p>
            <h1 className="text-[22px] font-semibold  tracking-tight">
              {firstName} 👋
            </h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDashboard(true)}
            disabled={refreshing}
            className="text-xs text-slate-500 border-slate-200 hover:bg-slate-100 h-8 gap-1.5"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 mb-6 flex items-center justify-between">
            <p className="text-sm text-rose-600">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchDashboard()}
              className="text-rose-600 hover:bg-rose-100 text-xs h-7"
            >
              Retry
            </Button>
          </div>
        )}

        {/* ── Empty state ── */}
        {isEmpty && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-7 h-7 text-indigo-400" />
            </div>
            <h2 className="text-base font-semibold text-slate-800 mb-1">No data yet</h2>
            <p className="text-sm text-slate-400 mb-5 max-w-xs mx-auto">
              Add your first income or expense and your dashboard will come to life.
            </p>
            <Link href="/transactions">
              <Button className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm">
                Add your first transaction
              </Button>
            </Link>
          </div>
        )}

        {!isEmpty && (
          <>
            {/* ── Summary Cards ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">

              {/* Net Balance — hero card */}
              {loading ? (
                <SkeletonCard className="col-span-2" />
              ) : (
                <div className={cn(
                  "col-span-2 rounded-2xl p-5 text-white",
                  isPositive
                    ? "bg-indigo-500 shadow-lg shadow-indigo-200"
                    : "bg-rose-500 shadow-lg shadow-rose-200"
                )}>
                  <div className="flex items-center gap-1.5 mb-4">
                    <Wallet className="w-3.5 h-3.5 opacity-70" />
                    <span className="text-xs font-medium opacity-70">Net Balance</span>
                  </div>
                  <p className="text-3xl font-semibold font-mono tabular-nums leading-none mb-3">
                    {formatCurrency(data!.summary.netBalance)}
                  </p>
                  <p className="text-xs opacity-60">
                    {data!.summary.transactionCount} transaction
                    {data!.summary.transactionCount !== 1 ? "s" : ""} recorded
                  </p>
                </div>
              )}

              {/* Income */}
              {loading ? (
                <SkeletonCard />
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-center gap-1.5 mb-4">
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-xs font-medium text-slate-500">Income</span>
                  </div>
                  <p className="text-xl font-semibold text-emerald-600 font-mono tabular-nums leading-none mb-2">
                    {formatCompact(data!.summary.totalIncome)}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {formatCurrency(data!.summary.totalIncome)}
                  </p>
                </div>
              )}

              {/* Expenses */}
              {loading ? (
                <SkeletonCard />
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-center gap-1.5 mb-4">
                    <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
                    <span className="text-xs font-medium text-slate-500">Expenses</span>
                  </div>
                  <p className="text-xl font-semibold text-rose-500 font-mono tabular-nums leading-none mb-2">
                    {formatCompact(data!.summary.totalExpenses)}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {formatCurrency(data!.summary.totalExpenses)}
                  </p>
                </div>
              )}
            </div>

            {/* ── Charts Row ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">

              {/* Bar Chart — 6-month overview (spans 2 cols) */}
              {loading ? (
                <SkeletonChart className="md:col-span-2" />
              ) : (
                <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="text-sm font-semibold text-slate-800">Monthly overview</h2>
                      <p className="text-xs text-slate-400 mt-0.5">Last 6 months</p>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block" />
                        Income
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm bg-rose-400 inline-block" />
                        Expenses
                      </span>
                    </div>
                  </div>

                  {data!.monthlyData.length === 0 ? (
                    <div className="h-44 flex items-center justify-center text-sm text-slate-400">
                      No data available
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={176}>
                      <BarChart
                        data={data!.monthlyData}
                        barCategoryGap="28%"
                        barGap={3}
                      >
                        <CartesianGrid
                          vertical={false}
                          stroke="#F1F5F9"
                          strokeDasharray="0"
                        />
                        <XAxis
                          dataKey="month"
                          tick={{ fontSize: 11, fill: "#94A3B8" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: "#94A3B8" }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) => formatCompact(v)}
                          width={52}
                        />
                        <Tooltip
                          content={<CustomBarTooltip />}
                          cursor={{ fill: "#F8FAFC", radius: 6 }}
                        />
                        <Bar
                          dataKey="income"
                          fill="#34D399"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={28}
                        />
                        <Bar
                          dataKey="expense"
                          fill="#FB7185"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={28}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              )}

              {/* Category breakdown (1 col) */}
              {loading ? (
                <SkeletonChart />
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <h2 className="text-sm font-semibold text-slate-800 mb-1">
                    Top spending
                  </h2>
                  <p className="text-xs text-slate-400 mb-4">By category</p>

                  {data!.categoryBreakdown.length === 0 ? (
                    <div className="h-44 flex items-center justify-center text-sm text-slate-400">
                      No expenses yet
                    </div>
                  ) : (
                    <>
                      {/* Mini donut chart */}
                      <div className="flex justify-center mb-4">
                        <ResponsiveContainer width={120} height={120}>
                          <PieChart>
                            <Pie
                              data={data!.categoryBreakdown}
                              dataKey="total"
                              nameKey="category"
                              cx="50%"
                              cy="50%"
                              innerRadius={36}
                              outerRadius={56}
                              strokeWidth={2}
                              stroke="#fff"
                              paddingAngle={2}
                            >
                              {data!.categoryBreakdown.map((entry) => {
                                const meta = CATEGORY_META[entry.category] ?? FALLBACK_META;
                                return (
                                  <Cell
                                    key={entry.category}
                                    fill={meta.chartColor}
                                  />
                                );
                              })}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Legend list */}
                      <ul className="space-y-2">
                        {data!.categoryBreakdown.map((entry) => {
                          const meta = CATEGORY_META[entry.category] ?? FALLBACK_META;
                          const Icon = meta.icon;
                          return (
                            <li key={entry.category} className="flex items-center gap-2">
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ background: meta.chartColor }}
                              />
                              <Icon className={cn("w-3 h-3 shrink-0", meta.color)} />
                              <span className="text-xs text-slate-600 flex-1 truncate">
                                {entry.category}
                              </span>
                              <span className="text-[11px] font-mono text-slate-400">
                                {entry.percentage}%
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* ── Recent Transactions ── */}
            {loading ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse">
                <div className="h-3 bg-slate-100 rounded w-36 mb-5" />
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-slate-100 rounded w-1/3" />
                      <div className="h-2.5 bg-slate-100 rounded w-1/5" />
                    </div>
                    <div className="h-3 bg-slate-100 rounded w-16" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                  <h2 className="text-sm font-semibold text-slate-800">Recent transactions</h2>
                  <Link
                    href="/transactions"
                    className="text-xs text-indigo-500 hover:text-indigo-600 flex items-center gap-1 font-medium"
                  >
                    View all
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                {data!.recentTransactions.length === 0 ? (
                  <div className="py-10 text-center text-sm text-slate-400">
                    No transactions yet
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {data!.recentTransactions.map((tx) => {
                      const meta = CATEGORY_META[tx.category] ?? FALLBACK_META;
                      const Icon = meta.icon;
                      const isIncome = tx.type === "INCOME";

                      return (
                        <li
                          key={tx.id}
                          className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/80 transition-colors"
                        >
                          {/* Category icon */}
                          <div className={cn(
                            "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                            meta.bg
                          )}>
                            <Icon className={cn("w-3.5 h-3.5", meta.color)} />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate leading-snug">
                              {tx.description || tx.category}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-slate-400">
                                {formatDate(tx.transactionDate)}
                              </span>
                              <span className="text-slate-200">·</span>
                              <span className="flex items-center gap-1 text-[10px] text-slate-400">
                                <CreditCard className="w-2.5 h-2.5" />
                                {tx.paymentMethod}
                              </span>
                            </div>
                          </div>

                          {/* Amount */}
                          <span className={cn(
                            "font-mono text-sm font-semibold tabular-nums shrink-0",
                            isIncome ? "text-emerald-600" : "text-slate-700"
                          )}>
                            {isIncome ? "+" : "−"}
                            {formatCurrency(tx.amount)}
                          </span>

                          {/* Type badge */}
                          <span className={cn(
                            "hidden sm:inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0",
                            isIncome
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          )}>
                            {isIncome ? (
                              <><TrendingUp className="w-2.5 h-2.5 mr-1" />Income</>
                            ) : (
                              <><TrendingDown className="w-2.5 h-2.5 mr-1" />Expense</>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
