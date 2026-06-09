'use client'

import { useState } from 'react'
import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'

const navItems = ['Dashboard', 'Transactions', 'Budget', 'Settings']

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false)

  const closeMenu = () => setMenuOpen(false)

  return (
    <header className="relative z-50 m-4 rounded-xl bg-sidebar font-plus-jakarta-sans text-white shadow-lg">
      <div className="flex h-16 items-center justify-between gap-4 px-4 py-4 md:px-6">
      
        <nav className="hidden items-center gap-6 md:flex">
          <button className="text-xl font-semibold text-white" onClick={closeMenu}>Cashew</button>
          {navItems.map((item) => (
            <button
              key={item}
              className="rounded-lg px-4 py-2 text-sm text-white hover:bg-brand-dark"
              type="button"
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Show when="signed-out">
            <SignInButton className="rounded-lg bg-gray-700 px-4 py-2 text-sm text-white hover:bg-gray-600" />
            <SignUpButton>
              <button className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark">
                Sign Up
              </button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>

        <button
          type="button"
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((prev) => !prev)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white hover:bg-white/10 md:hidden"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {menuOpen && (
        <nav className="absolute left-0 right-0 top-full z-50 mt-1 rounded-b-xl border border-white/10 bg-sidebar p-4 shadow-xl md:hidden">
          <div className="flex flex-col gap-2 text-white">
            {navItems.map((item) => (
              <button
                key={item}
                type="button"
                onClick={closeMenu}
                className="rounded-lg px-3 py-2 text-left hover:bg-brand-dark"
              >
                {item}
              </button>
            ))}

            <div className="mt-2 border-t border-white/10 pt-3">
              <Show when="signed-out">
                <div className="flex flex-col gap-2">
                  <SignInButton className="rounded-lg bg-gray-700 px-4 py-2 text-center text-white hover:bg-gray-600" />
                  <SignUpButton>
                    <button className="rounded-lg bg-brand px-4 py-2 text-center font-medium text-white hover:bg-brand-dark">
                      Sign Up
                    </button>
                  </SignUpButton>
                </div>
              </Show>
              <Show when="signed-in">
                <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                  <span className="text-sm text-white/80">Profile</span>
                  <UserButton />
                </div>
              </Show>
            </div>
          </div>
        </nav>
      )}
    </header>
  )
}

export default Navbar