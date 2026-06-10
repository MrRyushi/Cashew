"use client"
import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import type { HTMLProps } from "@base-ui/react/types"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
export function ModeToggle() {
  const { setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const sunClass = mounted
    ? "h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90"
    : "h-[1.2rem] w-[1.2rem]"

  const moonClass = mounted
    ? "absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"
    : "absolute h-[1.2rem] w-[1.2rem] opacity-0"

  function Trigger(props: React.ComponentProps<typeof Button>) {
    return (
      <Button variant="outline" size="icon" {...props}>
        <Sun className={sunClass} />
        <Moon className={moonClass} />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={(triggerProps: HTMLProps<HTMLButtonElement>) => <Trigger {...triggerProps} />}
      />
      <DropdownMenuContent align="end" className="bg-white dark:bg-gray-800">
        <DropdownMenuItem onClick={() => setTheme("light")} className="text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} className="text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")} className="text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}