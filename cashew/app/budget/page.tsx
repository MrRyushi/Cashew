"use client";

// app/budget/page.tsx

import { useEffect, useState, useCallback } from "react";
import {
  Plus, Pencil, Trash2, ChevronLeft, ChevronRight,
  ShoppingCart, Bus, Zap, Home, Heart, Tv,
  GraduationCap, Briefcase, LineChart, Gift,
  MoreHorizontal, AlertTriangle, CheckCircle2,
  TrendingDown, Wallet, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Budget {
  id: string;
  category: string;
  limitAmount: number;
  month: number;
  year: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: "safe" | "warning" | "over";
}

interface Toast {
  id: string;
  message: string;
  variant: "success" | "error";
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EXPENSE_CATEGORIES = [
  "Food & Drink", "Transportation", "Utilities",
  "Rent", "Healthcare", "Entertainment",
  "Shopping", "Education", "Other",
];

const CATEGORY_META: Record<string, {
  icon: React.ElementType;
  color: string;
  bg: string;
  barColor: string;
}> = {
  "Food & Drink":   { icon: ShoppingCart,  color: "text-orange-600",  bg: "bg-orange-50",  barColor: "bg-orange-400"  },
  "Transportation": { icon: Bus,           color: "text-sky-600",     bg: "bg-sky-50",     barColor: "bg-sky-400"     },
  "Utilities":      { icon: Zap,           color: "text-amber-600",   bg: "bg-amber-50",   barColor: "bg-amber-400"   },
  "Rent":           { icon: Home,          color: "text-slate-600",   bg: "bg-slate-100",  barColor: "bg-slate-400"   },
  "Healthcare":     { icon: Heart,         color: "text-red-600",     bg: "bg-red-50",     barColor: "bg-red-400"     },
  "Entertainment":  { icon: Tv,            color: "text-purple-600",  bg: "bg-purple-50",  barColor: "bg-purple-400"  },
  "Shopping":       { icon: ShoppingCart,  color: "text-rose-600",    bg: "bg-rose-50",    barColor: "bg-rose-400"    },
  "Education":      { icon: GraduationCap, color: "text-teal-600",    bg: "bg-teal-50",    barColor: "bg-teal-400"    },
  "Salary":         { icon: Briefcase,     color: "text-indigo-600",  bg: "bg-indigo-50",  barColor: "bg-indigo-400"  },
  "Freelance":      { icon: LineChart,     color: "text-violet-600",  bg: "bg-violet-50",  barColor: "bg-violet-400"  },
  "Investment":     { icon: TrendingDown,  color: "text-emerald-600", bg: "bg-emerald-50", barColor: "bg-emerald-400" },
  "Gift":           { icon: Gift,          color: "text-pink-600",    bg: "bg-pink-50",    barColor: "bg-pink-400"    },
  "Other":          { icon: MoreHorizontal,color: "text-slate-500",   bg: "bg-slate-100",  barColor: "bg-slate-300"   },
};

const FALLBACK_META = {
  icon: MoreHorizontal,
  color: "text-slate-500",
  bg: "bg-slate-100",
  barColor: "bg-slate-300",
};

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const EMPTY_FORM = {
  category: "",
  limitAmount: "",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(amount);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({
  percentage,
  status,
  barColor,
}: {
  percentage: number;
  status: Budget["status"];
  barColor: string;
}) {
  const trackColor =
    status === "over"    ? "bg-rose-100"  :
    status === "warning" ? "bg-amber-100" : "bg-slate-100";

  const fillColor =
    status === "over"    ? "bg-rose-500"  :
    status === "warning" ? "bg-amber-400" : barColor;

  return (
    <div className={cn("w-full h-2 rounded-full overflow-hidden", trackColor)}>
      <div
        className={cn("h-full rounded-full transition-all duration-500", fillColor)}
        style={{ width: `${Math.min(percentage, 100)}%` }}
      />
    </div>
  );
}

function StatusBadge({ status, percentage }: { status: Budget["status"]; percentage: number }) {
  if (status === "over") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-rose-50 text-rose-600">
        <AlertTriangle className="w-2.5 h-2.5" />
        Over budget
      </span>
    );
  }
  if (status === "warning") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
        <AlertTriangle className="w-2.5 h-2.5" />
        {percentage}% used
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
      <CheckCircle2 className="w-2.5 h-2.5" />
      On track
    </span>
  );
}

function SkeletonBudgetCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-slate-100 flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 bg-slate-100 rounded w-28" />
          <div className="h-2.5 bg-slate-100 rounded w-16" />
        </div>
        <div className="h-5 bg-slate-100 rounded w-16" />
      </div>
      <div className="h-2 bg-slate-100 rounded-full mb-3" />
      <div className="flex justify-between">
        <div className="h-2.5 bg-slate-100 rounded w-20" />
        <div className="h-2.5 bg-slate-100 rounded w-20" />
      </div>
    </div>
  );
}

function ToastNotification({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium",
            t.variant === "success" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
          )}
        >
          {t.variant === "success"
            ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            : <X className="w-4 h-4 flex-shrink-0" />}
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BudgetPage() {
  const now = new Date();
  const [month, setMonth]     = useState(now.getMonth() + 1); // 1-indexed
  const [year, setYear]       = useState(now.getFullYear());
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen]   = useState(false);
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [formError, setFormError]     = useState<string | null>(null);
  const [submitting, setSubmitting]   = useState(false);

  // Delete state
  const [deleteId, setDeleteId]       = useState<string | null>(null);
  const [deleting, setDeleting]       = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);

  function showToast(message: string, variant: Toast["variant"] = "success") {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }

  // ── Month navigation ────────────────────────────────────────────────────────
  function prevMonth() {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  // ── Fetch budgets ───────────────────────────────────────────────────────────
  const fetchBudgets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/budget?month=${month}&year=${year}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setBudgets(data.budgets);
    } catch (err) {
      setError("Could not load budgets. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    const timer = window.setTimeout(fetchBudgets, 0);
    return () => window.clearTimeout(timer);
  }, [fetchBudgets]);

  // ── Open dialog ─────────────────────────────────────────────────────────────
  function openNew() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setDialogOpen(true);
  }

  function openEdit(b: Budget) {
    setEditingId(b.id);
    setForm({ category: b.category, limitAmount: String(b.limitAmount) });
    setFormError(null);
    setDialogOpen(true);
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    setFormError(null);

    if (!form.category) {
      setFormError("Please select a category.");
      return;
    }
    const amount = parseFloat(form.limitAmount);
    if (!form.limitAmount || isNaN(amount) || amount <= 0) {
      setFormError("Please enter a valid limit amount greater than 0.");
      return;
    }

    // Check duplicate category (only for new budgets)
    if (!editingId) {
      const exists = budgets.some((b) => b.category === form.category);
      if (exists) {
        setFormError(`A budget for "${form.category}" already exists this month. Edit it instead.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category:    form.category,
          limitAmount: amount,
          month,
          year,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");

      setDialogOpen(false);
      showToast(editingId ? "Budget updated." : "Budget created.");
      fetchBudgets();
    } catch (err) {
      console.error(err);
      showToast("Something went wrong. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Delete ──────────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/budget?id=${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setDeleteId(null);
      showToast("Budget removed.");
      fetchBudgets();
    } catch (err) {
      console.error(err);
      showToast("Could not delete budget.", "error");
    } finally {
      setDeleting(false);
    }
  }

  // ── Derived stats ───────────────────────────────────────────────────────────
  const totalLimit   = budgets.reduce((s, b) => s + b.limitAmount, 0);
  const totalSpent   = budgets.reduce((s, b) => s + b.spent, 0);
  const overCount    = budgets.filter((b) => b.status === "over").length;
  const warningCount = budgets.filter((b) => b.status === "warning").length;
  const deletingBudget = budgets.find((b) => b.id === deleteId);
  const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="min-h-screen ">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

          {/* ── Page Header ── */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-[22px] font-semibold  tracking-tight">
                Budget
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Set monthly spending limits per category
              </p>
            </div>
            <Button
              onClick={openNew}
              className="bg-indigo-500 hover:bg-indigo-600 text-white shadow-sm shadow-indigo-200 h-9 px-4 text-sm font-medium"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add budget
            </Button>
          </div>

          {/* ── Month Selector ── */}
          <div className="flex items-center justify-between  border dark:bg-slate-900 dark:border-slate-700 rounded-2xl px-5 py-3.5 mb-5 shadow-sm">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="text-center">
              <p className="text-sm font-semibold">
                {MONTH_NAMES[month - 1]} {year}
              </p>
              {isCurrentMonth && (
                <span className="text-[10px] font-medium text-indigo-500">Current month</span>
              )}
            </div>

            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* ── Summary Strip ── */}
          {!loading && budgets.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="dark:bg-slate-900 dark:border-slate-700 border  rounded-2xl p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <Wallet className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-medium text-slate-500">Total limit</span>
                </div>
                <p className="text-lg font-semibold  font-mono tabular-nums">
                  {formatCurrency(totalLimit)}
                </p>
              </div>
              <div className="dark:bg-slate-900 dark:border-slate-700 border  rounded-2xl p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-xs font-medium text-slate-500">Total spent</span>
                </div>
                <p className="text-lg font-semibold text-red-500 font-mono tabular-nums">
                  {formatCurrency(totalSpent)}
                </p>
              </div>
              <div className={cn(
                "border rounded-2xl p-4",
                overCount > 0
                  ? "bg-rose-50 border-rose-200"
                  : warningCount > 0
                    ? "bg-amber-50 border-amber-200"
                    : "bg-emerald-50 border-emerald-200"
              )}>
                <div className="flex items-center gap-1.5 mb-2">
                  {overCount > 0
                    ? <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                    : warningCount > 0
                      ? <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                  <span className="text-xs font-medium text-slate-500">Status</span>
                </div>
                <p className={cn(
                  "text-sm font-semibold",
                  overCount > 0 ? "text-rose-600"
                    : warningCount > 0 ? "text-amber-600"
                    : "text-emerald-600"
                )}>
                  {overCount > 0
                    ? `${overCount} over limit`
                    : warningCount > 0
                      ? `${warningCount} near limit`
                      : "All on track"}
                </p>
              </div>
            </div>
          )}

          {/* ── Alert Banner for over-budget ── */}
          {!loading && overCount > 0 && (
            <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 mb-5">
              <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <p className="text-sm text-rose-700">
                <span className="font-semibold">{overCount} {overCount === 1 ? "category has" : "categories have"}</span> exceeded their budget limit this month.
              </p>
            </div>
          )}

          {/* ── Error State ── */}
          {error && !loading && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 mb-5 flex items-center justify-between">
              <p className="text-sm text-rose-600">{error}</p>
              <Button variant="ghost" size="sm" onClick={fetchBudgets} className="text-rose-600 hover:bg-rose-100 text-xs h-7">
                Retry
              </Button>
            </div>
          )}

          {/* ── Budget Cards ── */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => <SkeletonBudgetCard key={i} />)}
            </div>
          ) : budgets.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-14 text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-6 h-6 text-indigo-400" />
              </div>
              <p className="text-sm font-medium  mb-1">No budgets set</p>
              <p className="text-xs mb-5 max-w-xs mx-auto">
                Set a monthly spending limit for each category to start tracking your budget.
              </p>
              <Button
                onClick={openNew}
                size="sm"
                className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add your first budget
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {budgets.map((b) => {
                const meta  = CATEGORY_META[b.category] ?? FALLBACK_META;
                const Icon  = meta.icon;
                const isOver = b.status === "over";

                return (
                  <div
                    key={b.id}
                    className={cn(
                      "group dark:bg-slate-900 dark:border-slate-700 rounded-2xl border p-5 transition-shadow hover:shadow-md",
                      isOver
                        ? "border-rose-200 bg-rose-50/30"
                        : b.status === "warning"
                          ? "border-amber-200"
                          : "border-slate-200"
                    )}
                  >
                    {/* Card header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                        meta.bg
                      )}>
                        <Icon className={cn("w-4 h-4", meta.color)} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold  leading-snug truncate">
                          {b.category}
                        </p>
                        <StatusBadge status={b.status} percentage={b.percentage} />
                      </div>

                      {/* Actions — reveal on hover */}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button
                          onClick={() => openEdit(b)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 transition-colors"
                          aria-label="Edit budget"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteId(b.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                          aria-label="Delete budget"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <ProgressBar
                      percentage={b.percentage}
                      status={b.status}
                      barColor={meta.barColor}
                    />

                    {/* Amounts row */}
                    <div className="flex justify-between items-center mt-3">
                      <div>
                        <p className="text-[10px] text-slate-400 mb-0.5">Spent</p>
                        <p className={cn(
                          "text-sm font-semibold font-mono tabular-nums",
                          isOver ? "text-rose-600" : ""
                        )}>
                          {formatCurrency(b.spent)}
                        </p>
                      </div>

                      {/* Percentage badge */}
                      <span className={cn(
                        "text-[11px] font-bold tabular-nums px-2 py-1 rounded-lg",
                        isOver
                          ? "bg-rose-100 text-rose-600"
                          : b.status === "warning"
                            ? "bg-amber-100 text-amber-600"
                            : "bg-slate-100 text-slate-500"
                      )}>
                        {b.percentage}%
                      </span>

                      <div className="text-right">
                        <p className="text-[10px] text-slate-400 mb-0.5">
                          {isOver ? "Over by" : "Remaining"}
                        </p>
                        <p className={cn(
                          "text-sm font-semibold font-mono tabular-nums",
                          isOver ? "text-rose-600" : "text-emerald-600"
                        )}>
                          {isOver
                            ? formatCurrency(b.spent - b.limitAmount)
                            : formatCurrency(b.remaining)}
                        </p>
                      </div>
                    </div>

                    {/* Limit label */}
                    <p className="text-[10px] text-slate-400 mt-2 text-center">
                      Monthly limit: {formatCurrency(b.limitAmount)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Add / Edit Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); setFormError(null); }}>
        <DialogContent className="sm:max-w-sm bg-white dark:bg-slate-900 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {editingId ? "Edit budget limit" : "New budget"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-1">
            {/* Month/Year display — read-only context */}
            <div className="flex items-center gap-2 bg-indigo-50 rounded-xl px-3 py-2.5">
              <span className="text-xs text-indigo-600 font-medium">
                Setting budget for {MONTH_NAMES[month - 1]} {year}
              </span>
            </div>

            {/* Category */}
            <div className="grid gap-1.5">
              <Label className="text-xs font-medium ">Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v || "" })}
                disabled={!!editingId} // Can't change category on edit — create a new one
              >
                <SelectTrigger className={cn("text-sm focus:ring-indigo-400", editingId && "opacity-60")}>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((cat) => {
                    const meta = CATEGORY_META[cat] ?? FALLBACK_META;
                    const CatIcon = meta.icon;
                    return (
                      <SelectItem key={cat} value={cat} className="text-sm bg-white hover:bg-slate-100">
                        <span className="flex items-center gap-2">
                          <span className={cn("flex w-5 h-5 rounded items-center justify-center", meta.bg)}>
                            <CatIcon className={cn("w-3 h-3", meta.color)} />
                          </span>
                          {cat}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {editingId && (
                <p className="text-[10px] text-slate-400">
                  Category cannot be changed. Delete and re-create to use a different one.
                </p>
              )}
            </div>

            {/* Limit amount */}
            <div className="grid gap-1.5">
              <Label htmlFor="limit" className="text-xs font-medium text-slate-600">
                Monthly limit (₱)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">₱</span>
                <Input
                  id="limit"
                  type="number"
                  min="1"
                  step="100"
                  placeholder="0.00"
                  value={form.limitAmount}
                  onChange={(e) => setForm({ ...form, limitAmount: e.target.value })}
                  className="pl-7 font-mono text-sm focus-visible:ring-indigo-400"
                />
              </div>
            </div>

            {/* Form error */}
            {formError && (
              <p className="text-xs text-rose-500 flex items-center gap-1.5">
                <X className="w-3 h-3 flex-shrink-0" />
                {formError}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="text-sm text-white bg-slate-600 hover:bg-slate-700 min-w-[80px]">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm min-w-[110px]"
            >
              {submitting
                ? <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving…
                  </span>
                : editingId ? "Save changes" : "Create budget"
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ── */}
      <AlertDialog open={!!deleteId} onOpenChange={() => !deleting && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-semibold">Remove budget?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-500">
              {deletingBudget
                ? <>This will permanently remove the <strong className="text-slate-700">{deletingBudget.category}</strong> budget limit of {formatCurrency(deletingBudget.limitAmount)}. Your transaction history is unaffected.</>
                : "This action cannot be undone."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting} className="text-sm">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-rose-500 hover:bg-rose-600 text-white text-sm min-w-[80px]"
            >
              {deleting
                ? <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Removing…
                  </span>
                : "Remove"
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ToastNotification toasts={toasts} />
    </>
  );
}
