"use client";

import Link from "next/link";
import { SignInButton, SignUpButton, useUser } from "@clerk/nextjs";
import { ArrowRight, BarChart3, ShieldCheck, Wallet } from "lucide-react";

const highlights = [
  {
    icon: Wallet,
    title: "Track everything",
    description: "See income, expenses, and categories in one clean view.",
  },
  {
    icon: BarChart3,
    title: "Understand trends",
    description: "Spot patterns quickly with a clear snapshot of your finances.",
  },
  {
    icon: ShieldCheck,
    title: "Stay in control",
    description: "Keep your budget organized with dependable, secure tracking.",
  },
] as const;

export default function Home() {
  const { isSignedIn } = useUser();

  return (
    <main className="min-h-[calc(100vh-4rem)]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <section className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative">
            <div className="absolute inset-0 -z-10 rounded-4xl bg-linear-to-br from-brand/20 dark:from-brand/30 dark:via-slate-900 dark:to-slate-950" />

            <div className="max-w-2xl p-md sm:p-6 lg:p-8">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-white/70 px-3 py-1 text-sm font-medium text-brand shadow-sm backdrop-blur dark:border-brand/30 dark:bg-slate-900/60">
                <span className="h-2 w-2 rounded-full bg-brand" />
                Smart money tracking
              </div>

              <h1 className="font-plus-jakarta-sans text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-white">
                Welcome to Cashew!
              </h1>

              <p className="mt-4 max-w-xl text-base leading-7 text-slate-600 sm:text-lg dark:text-slate-300">
                Keep your spending, savings, and goals in one place with a simple dashboard built for everyday life.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                {!isSignedIn ? (
                  <>
                    <SignUpButton>
                      <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/20 transition hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand/40">
                        Sign up
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </SignUpButton>

                    <SignInButton>
                      <button className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
                        Log in
                      </button>
                    </SignInButton>
                  </>
                ) : (
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/20 transition hover:bg-brand-dark"
                  >
                    Open dashboard
                  </Link>
                )}
              </div>

              <div className="mt-6 text-sm text-slate-500 dark:text-slate-400">
                New here? Create an account to get started.
              </div>
            </div>
          </div>

          <div className="rounded-4xl border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
            <div className="rounded-3xl bg-slate-50 p-4 dark:bg-slate-800/70">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Overview</p>
                  <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">This month</h2>
                </div>
                <div className="rounded-xl bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-600 dark:text-emerald-300">
                  +12.4%
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Income</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">₱68,420</p>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Expenses</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">₱41,280</p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Category split</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">₱27,140</span>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Food & Drink", value: "36%", bar: "w-[36%]", color: "bg-orange-500" },
                    { label: "Utilities", value: "24%", bar: "w-[24%]", color: "bg-amber-500" },
                    { label: "Transportation", value: "18%", bar: "w-[18%]", color: "bg-sky-500" },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="mb-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>{item.label}</span>
                        <span>{item.value}</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700">
                        <div className={`h-2 rounded-full ${item.color} ${item.bar}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-3">
          {highlights.map(({ icon: Icon, title, description }) => (
            <article
              key={title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand dark:bg-brand/20">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {description}
              </p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
