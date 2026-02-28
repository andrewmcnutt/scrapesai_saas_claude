'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, LogOut } from 'lucide-react'
import { NAV_ITEMS } from '@/lib/constants/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'

interface MobileNavProps {
  user: { email: string }
}

export function MobileNav({ user }: MobileNavProps) {
  const pathname = usePathname()

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="p-6 pb-2">
          <SheetTitle className="text-xl font-bold text-left">ScrapesAI</SheetTitle>
        </SheetHeader>

        <nav className="flex-1 px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon

            return (
              <SheetClose key={item.href} asChild>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              </SheetClose>
            )
          })}
        </nav>

        <Separator className="my-4" />

        <div className="px-4 pb-4">
          <p className="text-xs text-muted-foreground truncate mb-3">{user.email}</p>
          <form action="/api/auth/logout" method="POST">
            <Button variant="ghost" type="submit" className="w-full justify-start gap-2" size="sm">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  )
}
