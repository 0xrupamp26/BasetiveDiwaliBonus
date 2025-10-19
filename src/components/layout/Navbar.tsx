'use client';

import Link from 'next/link';
import { ConnectButton } from '../wallet/ConnectButton';

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold bg-gradient-to-r from-[#0052ff] via-[#2ea0ff] to-[#f59e0b] bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(0,82,255,0.15)]">
              Basetive Diwali Bonus
            </span>
          </Link>
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/submit"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Submit Photo
            </Link>
            <Link
              href="/gallery"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Gallery
            </Link>
            <Link
              href="/about"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              About
            </Link>
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
