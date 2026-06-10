"use client";

// app/transactions/page.tsx

import { useEffect, useState, useCallback } from "react";
import {
  Plus, Pencil, Trash2, TrendingUp, TrendingDown,
  Wallet, ShoppingCart, Bus, Zap, Home, Heart,
  Tv, GraduationCap, Briefcase, LineChart, Gift,
  MoreHorizontal, Search, SlidersHorizontal, X,
  ArrowUpRight, ArrowDownRight,
  DollarSign,
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

type TransactionType = "INCOME" | "EXPENSE";

interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description?: string | null;
  paymentMethod: string;
  transactionDate: string;
  createdAt: string;
}

type FilterType = "all" | TransactionType;

interface TransactionForm {
  type: TransactionType;
  amount: string;
  category: string;
  description: string;
  paymentMethod: string;
  transactionDate: string;
}

interface Toast {
  id: string;
  message: string;
  variant: "success" | "error";
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES: Record<TransactionType, string[]> = {
  INCOME: ["Salary", "Freelance", "Business", "Investment", "Gift", "Allowance", "Other"],
  EXPENSE: [
    "Food & Drink", "Transportation", "Utilities",
    "Rent", "Healthcare", "Entertainment",
    "Shopping", "Education", "Sports & Gym", "Other",
  ],
};

// Map each category to an icon and accent color
const CATEGORY_META: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  "Salary":         { icon: Briefcase,   color: "text-indigo-600",  bg: "bg-indigo-50"  },
  "Freelance":      { icon: LineChart,   color: "text-violet-600",  bg: "bg-violet-50"  },
  "Business":       { icon: TrendingUp,  color: "text-blue-600",    bg: "bg-blue-50"    },
  "Investment":     { icon: ArrowUpRight,color: "text-emerald-600", bg: "bg-emerald-50" },
  "Gift":           { icon: Gift,        color: "text-pink-600",    bg: "bg-pink-50"    },
  "Food & Drink":   { icon: ShoppingCart,color: "text-orange-600",  bg: "bg-orange-50"  },
  "Transportation": { icon: Bus,         color: "text-sky-600",     bg: "bg-sky-50"     },
  "Utilities":      { icon: Zap,         color: "text-amber-600",   bg: "bg-amber-50"   },
  "Rent":           { icon: Home,        color: "text-slate-600",   bg: "bg-slate-100"  },
  "Healthcare":     { icon: Heart,       color: "text-red-600",     bg: "bg-red-50"     },
  "Entertainment":  { icon: Tv,          color: "text-purple-600",  bg: "bg-purple-50"  },
  "Shopping":       { icon: ShoppingCart,color: "text-rose-600",    bg: "bg-rose-50"    },
  "Education":      { icon: GraduationCap,color:"text-teal-600",    bg: "bg-teal-50"    },
  "Sports & Gym":     { icon: Zap,         color: "text-green-600",   bg: "bg-green-50"   },
  "Other":          { icon: MoreHorizontal,color:"text-slate-500",  bg: "bg-slate-100"  },
  "Allowance":      { icon: DollarSign,        color: "text-yellow-600",  bg: "bg-yellow-50"   },
};

const EMPTY_FORM = {
  type: "EXPENSE" as TransactionType,
  amount: "",
  category: "",
  description: "",
  paymentMethod: "",
  transactionDate: new Date().toISOString().split("T")[0],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

function groupByDate(txs: Transaction[]): Record<string, Transaction[]> {
  return txs.reduce((groups, tx) => {
    const key = new Date(tx.transactionDate).toDateString();
    if (!groups[key]) groups[key] = [];
    groups[key].push(tx);
    return groups;
  }, {} as Record<string, Transaction[]>);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-5 py-4 animate-pulse">
      <div className="w-9 h-9 rounded-lg bg-slate-100 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-slate-100 rounded w-1/3" />
        <div className="h-2.5 bg-slate-100 rounded w-1/5" />
      </div>
      <div className="h-3.5 bg-slate-100 rounded w-20" />
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
            "flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium",
            "animate-in slide-in-from-bottom-2 duration-300",
            t.variant === "success"
              ? "bg-emerald-600 text-white"
              : "bg-rose-600 text-white"
          )}
        >
          {t.variant === "success"
            ? <TrendingUp className="w-4 h-4 shrink-0" />
            : <X className="w-4 h-4 shrink-0" />}
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TransactionsPage() {
  const [transactions, setTransactions]   = useState<Transaction[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);

  // Dialog / form state
  const [dialogOpen, setDialogOpen]       = useState(false);
  const [editingId, setEditingId]         = useState<string | null>(null);
  const [form, setForm]                   = useState<TransactionForm>(EMPTY_FORM);
  const [submitting, setSubmitting]       = useState(false);
  const [formError, setFormError]         = useState<string | null>(null);

  // Delete state
  const [deleteId, setDeleteId]           = useState<string | null>(null);
  const [deleting, setDeleting]           = useState(false);

  // UI state
  const [filterType, setFilterType]       = useState<FilterType>("all");
  const [search, setSearch]               = useState("");
  const [toasts, setToasts]               = useState<Toast[]>([]);

  // ── Toast helper ─────────────────────────────────────────────────────────────
  function showToast(message: string, variant: Toast["variant"] = "success") {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/transactions");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setTransactions(data);
    } catch (err) {
      setError("Could not load transactions. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function loadTransactions() {
      await fetchTransactions();
    }

    loadTransactions();
  }, [fetchTransactions]);

  // ── Open dialog ───────────────────────────────────────────────────────────
  function openNew() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setDialogOpen(true);
  }

  function openEdit(tx: Transaction) {
    setEditingId(tx.id);
    setForm({
      type:     tx.type,
      amount:   String(tx.amount),
      category: tx.category,
      description: tx.description || "",
      paymentMethod: tx.paymentMethod,
      transactionDate: tx.transactionDate.split("T")[0],
    });
    setFormError(null);
    setDialogOpen(true);
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    setFormError(null);

    // Client-side validation
    if (!form.amount || parseFloat(form.amount) <= 0) {
      setFormError("Please enter a valid amount greater than 0.");
      return;
    }
    if (!form.category) {
      setFormError("Please select a category.");
      return;
    }
    if (!form.paymentMethod) {
      setFormError("Please select a payment method.");
      return;
    }
    if (!form.transactionDate) {
      setFormError("Please select a date.");
      return;
    }

    setSubmitting(true);
    
    const payload = {
      description: form.description || null,
      amount:   parseFloat(form.amount),
      type:     form.type,
      category: form.category,
      paymentMethod: form.paymentMethod,
      transactionDate: form.transactionDate,
    };

    try {
      if (editingId) {
        const res = await fetch(`/api/transactions/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Update failed");
        showToast("Transaction updated successfully.");
      } else {
        const res = await fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        console.log(data);
        if (!res.ok) throw new Error("Create failed");
        showToast("Transaction added successfully.");
      }
      setDialogOpen(false);
      fetchTransactions();
    } catch (err) {
      console.error(err);
      showToast("Something went wrong. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/transactions/${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setDeleteId(null);
      showToast("Transaction deleted.");
      fetchTransactions();
    } catch (err) {
      console.error(err);
      showToast("Could not delete transaction.", "error");
    } finally {
      setDeleting(false);
    }
  }

  // ── Derived data ──────────────────────────────────────────────────────────
  const totalIncome = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpenses;

  const filtered = transactions
    .filter((t) => filterType === "all" || t.type === filterType)
    .filter((t) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        t.category.toLowerCase().includes(q) ||
        (t.description?.toLowerCase().includes(q) ?? false)
      );
    });

  const grouped = groupByDate(filtered);
  const dateKeys = Object.keys(grouped).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  const deletingTx = transactions.find((t) => t.id === deleteId);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <div className="min-h-screen dark:bg-slate-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

          {/* ── Page Header ── */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-[22px] font-semibold  tracking-tight">
                Transactions
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {transactions.length > 0
                  ? `${transactions.length} transaction${transactions.length !== 1 ? "s" : ""} total`
                  : "Track your income and expenses"}
              </p>
            </div>
            <Button
              onClick={openNew}
              className="bg-indigo-500 hover:bg-indigo-600 text-white shadow-sm shadow-indigo-200 h-9 px-4 text-sm font-medium"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add transaction
            </Button>
          </div>

          {/* ── Summary Cards ── */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {/* Balance */}
            <div className="col-span-1 bg-indigo-500 rounded-2xl p-4 text-white">
              <div className="flex items-center gap-1.5 mb-3">
                <Wallet className="w-3.5 h-3.5 text-indigo-200" />
                <span className="text-xs font-medium text-indigo-200">Net Balance</span>
              </div>
              <p className={cn(
                "text-xl font-semibold font-mono tabular-nums leading-none",
                netBalance < 0 ? "text-rose-200" : "text-white"
              )}>
                {formatCurrency(netBalance)}
              </p>
            </div>

            {/* Income */}
            <div className="bg-white dark:bg-slate-900 dark:border-slate-700 rounded-2xl p-4 border border-slate-200">
              <div className="flex items-center gap-1.5 mb-3">
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Income</span>
              </div>
              <p className="text-xl font-semibold text-emerald-600 font-mono tabular-nums leading-none">
                {formatCurrency(totalIncome)}
              </p>
            </div>

            {/* Expenses */}
            <div className="bg-white dark:bg-slate-900 dark:border-slate-700 rounded-2xl p-4 border border-slate-200">
              <div className="flex items-center gap-1.5 mb-3">
                <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Expenses</span>
              </div>
              <p className="text-xl font-semibold text-rose-500 font-mono tabular-nums leading-none">
                {formatCurrency(totalExpenses)}
              </p>
            </div>
          </div>

          {/* ── Search + Filters ── */}
          <div className="flex gap-2 mb-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by note or category…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-sm bg-white dark:bg-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700 focus-visible:ring-indigo-400"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 dark:border-slate-700 border border-slate-200 rounded-lg px-1.5 py-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400 ml-1" />
              {(["all", "INCOME", "EXPENSE"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterType(f)}
                  className={cn(
                    "px-3 py-1 rounded-md text-xs font-medium transition-colors capitalize",
                    filterType === f
                      ? "bg-indigo-500 text-white"
                      : "text-slate-500 hover:bg-slate-100"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* ── Transaction List ── */}
          <div className="bg-white dark:bg-slate-900 *:dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">

            {/* Loading skeletons */}
            {loading && (
              <div className="divide-y divide-slate-100">
                {Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </div>
            )}

            {/* Error state */}
            {!loading && error && (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center mb-3">
                  <X className="w-5 h-5 text-rose-500" />
                </div>
                <p className="text-sm font-medium text-slate-700 mb-1">Failed to load</p>
                <p className="text-xs text-slate-400 mb-4">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchTransactions}
                  className="text-xs"
                >
                  Try again
                </Button>
              </div>
            )}

            {/* Empty state */}
            {!loading && !error && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
                  <Wallet className="w-6 h-6 text-indigo-400" />
                </div>
                <p className="text-sm font-medium text-slate-700 mb-1">
                  {search || filterType !== "all"
                    ? "No transactions match your filters"
                    : "No transactions yet"}
                </p>
                <p className="text-xs text-slate-400 mb-5">
                  {search || filterType !== "all"
                    ? "Try clearing your search or changing the filter."
                    : "Add your first income or expense to get started."}
                </p>
                {!search && filterType === "all" && (
                  <Button
                    onClick={openNew}
                    size="sm"
                    className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add transaction
                  </Button>
                )}
              </div>
            )}

            {/* Grouped transaction rows */}
            {!loading && !error && filtered.length > 0 && (
              <div>
                {dateKeys.map((dateKey, groupIdx) => {
                  const dayTxs = grouped[dateKey];
                  const dayLabel = formatDate(dayTxs[0].transactionDate);

                  return (
                    <div key={dateKey}>
                      {/* Date group header */}
                      <div className={cn(
                        "flex items-center justify-between px-5 py-2.5 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-700",
                        groupIdx > 0 && "border-t"
                      )}>
                        <span className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide">
                          {dayLabel}
                        </span>
                        <span className="text-xs text-slate-400">
                          {dayTxs.length} item{dayTxs.length !== 1 ? "s" : ""}
                        </span>
                      </div>

                      {/* Rows for this date */}
                      <ul className="divide-y divide-slate-100 dark:divide-slate-500">
                        {dayTxs.map((tx) => {
                          const meta = CATEGORY_META[tx.category] ?? CATEGORY_META["Other"];
                          const Icon = meta.icon;

                          return (
                            <li
                              key={tx.id}
                              className="group flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-800 transition-colors"
                            >
                              {/* Category icon */}
                              <div className={cn(
                                "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                                meta.bg
                              )}>
                                <Icon className={cn("w-4 h-4", meta.color)} />
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-800 dark:text-white truncate leading-snug">
                                  {tx.description || tx.category}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className={cn(
                                    "inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                                    tx.type === "INCOME"
                                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                      : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-200"
                                  )}>
                                    {tx.category}
                                  </span>
                                </div>
                              </div>

                              {/* Amount */}
                              <span className={cn(
                                "font-mono text-sm font-semibold tabular-nums shrink-0",
                                tx.type === "INCOME" ? "text-emerald-600" : "text-rose-500"
                              )}>
                                {tx.type === "INCOME" ? "+" : "−"}
                                {formatCurrency(tx.amount)}
                              </span>

                              {/* Actions — visible on hover */}
                              <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => openEdit(tx)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 transition-colors"
                                  aria-label="Edit"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeleteId(tx.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                                  aria-label="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}

                {/* Footer count */}
                <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 dark:bg-gray-800/50 dark:border-gray-600">
                  <p className="text-xs text-slate-400 text-center">
                    Showing {filtered.length} of {transactions.length} transactions
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Add / Edit Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); setFormError(null); }}>
        <DialogContent className="sm:max-w-md bg-surface dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {editingId ? "Edit transaction" : "New transaction"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-1">

            {/* Type toggle */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-200 dark:bg-slate-700 rounded-xl">
              {(["EXPENSE", "INCOME"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setForm({ ...form, type: t, category: "" })}
                  className={cn(
                    "py-2 rounded-lg text-sm font-medium transition-all capitalize",
                    form.type === t
                      ? t === "INCOME"
                        ? "bg-white dark:bg-slate-950 text-emerald-600 shadow-sm ring-1 ring-emerald-200"
                        : "bg-white dark:bg-slate-950 text-rose-500 shadow-sm ring-1 ring-rose-200"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 "
                  )}
                >
                  {t === "INCOME"
                    ? <span className="flex items-center justify-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" />Income</span>
                    : <span className="flex items-center justify-center gap-1.5"><TrendingDown className="w-3.5 h-3.5" />Expense</span>
                  }
                </button>
              ))}
            </div>

            {/* Amount */}
            <div className="grid gap-1.5">
              <Label htmlFor="amount" className="text-xs font-medium text-slate-600">
                Amount (₱)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">₱</span>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="pl-7 font-mono text-sm focus-visible:ring-indigo-400"
                />
              </div>
            </div>

            {/* Category */}
            <div className="grid gap-1.5">
              <Label className="text-xs font-medium text-slate-600">Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v ?? "" })}
              >
                <SelectTrigger className="text-sm focus:ring-indigo-400">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES[form.type].map((cat) => {
                    const meta = CATEGORY_META[cat] ?? CATEGORY_META["Other"];
                    const CatIcon = meta.icon;
                    return (
                      <SelectItem key={cat} value={cat} className="text-sm bg-white dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-700">
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
            </div>

            {/* Description */}
            <div className="grid gap-1.5">
              <Label htmlFor="description" className="text-xs font-medium text-slate-600">
                Description <span className="text-slate-400 font-normal">(optional)</span>
              </Label>
              <Input
                id="description"
                placeholder="e.g. Lunch with team"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="text-sm focus-visible:ring-indigo-400"
              />
            </div>

            {/* Payment Method */}
            <div className="grid gap-1.5">
              <Label className="text-xs font-medium text-slate-600">Payment Method</Label>
              <Select
                value={form.paymentMethod}
                onValueChange={(v) => setForm({ ...form, paymentMethod: v ?? "" })}
              >
                <SelectTrigger className="text-sm focus:ring-indigo-400">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash" className="text-sm bg-white dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-700">Cash</SelectItem>
                  <SelectItem value="Credit Card" className="text-sm bg-white dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-700">Credit Card</SelectItem>
                  <SelectItem value="Debit Card" className="text-sm bg-white dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-700">Debit Card</SelectItem>
                  <SelectItem value="GCash" className="text-sm bg-white dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-700">GCash</SelectItem>
                  <SelectItem value="PayPal" className="text-sm bg-white dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-700">PayPal</SelectItem>
                  <SelectItem value="Bank Transfer" className="text-sm bg-white dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-700">Bank Transfer</SelectItem>
                  <SelectItem value="Check" className="text-sm bg-white dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-700">Check</SelectItem>
                  <SelectItem value="Other" className="text-sm bg-white dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-700">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date */}
            <div className="grid gap-1.5">
              <Label htmlFor="transactionDate" className="text-xs font-medium text-slate-600">Date</Label>
              <Input
                id="transactionDate"
                type="date"
                value={form.transactionDate}
                onChange={(e) => setForm({ ...form, transactionDate: e.target.value })}
                className="text-sm focus-visible:ring-indigo-400"
              />
            </div>

            {/* Inline form error */}
            {formError && (
              <p className="text-xs text-rose-500 flex items-center gap-1.5">
                <X className="w-3 h-3 shrink-0" />
                {formError}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm min-w-30"
            >
              {submitting
                ? <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</span>
                : editingId ? "Save changes" : "Add transaction"
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ── */}
      <AlertDialog open={!!deleteId} onOpenChange={() => !deleting && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-semibold">Delete transaction?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-500">
              {deletingTx
                ? <>This will permanently delete <strong className="text-slate-700">{deletingTx.description || deletingTx.category}</strong> ({formatCurrency(deletingTx.amount)}). This cannot be undone.</>
                : "This action cannot be undone."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting} className="text-sm">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-rose-500 hover:bg-rose-600 text-white text-sm min-w-20"
            >
              {deleting
                ? <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Deleting…</span>
                : "Delete"
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Toasts ── */}
      <ToastNotification toasts={toasts} />
    </>
  );
}
