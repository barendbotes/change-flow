"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LoginButton } from "@/components/auth/login-button";

export function TopNavbar() {
  const pathname = usePathname();

  const routes = [
    { href: "/", label: "Home" },
    { href: "/pricing", label: "Pricing" },
    { href: "/about", label: "About Us" },
  ];

  return (
    <header className="w-full border-b bg-background">
      <div className="container mx-auto flex h-16 items-center px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-xl font-bold">ChangeFlow</span>
        </Link>

        {/* Desktop Navigation - Centered */}
        <div className="hidden flex-1 md:flex justify-center">
          <nav className="flex items-center gap-6">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  pathname === route.href
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                {route.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Login Button - Right Aligned */}
        <div className="ml-auto">
          <LoginButton>
            <Button variant="default" size="lg">
              Sign In
            </Button>
          </LoginButton>
        </div>
      </div>
    </header>
  );
}
