"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Bell, LogOut } from "lucide-react";

interface NavProps {
  role: "BUYER" | "PROVIDER" | "ADMIN";
  userName?: string;
  unreadCount?: number;
}

const navLinks = {
  BUYER: [
    { href: "/app", label: "Home" },
    { href: "/app/opportunities", label: "Opportunities" },
    { href: "/app/payloads", label: "Payloads" },
    { href: "/app/requests", label: "Requests" },
  ],
  PROVIDER: [
    { href: "/provider", label: "Home" },
    { href: "/provider/opportunities", label: "Opportunities" },
    { href: "/provider/requests", label: "Requests" },
  ],
  ADMIN: [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/requests", label: "Requests" },
    { href: "/admin/opportunities", label: "Opportunities" },
    { href: "/admin/providers", label: "Providers" },
    { href: "/admin/audit", label: "Audit Log" },
  ],
};

export function Nav({ role, userName, unreadCount = 0 }: NavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const links = navLinks[role] ?? [];

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="border-b border-white/10 bg-[#0B0D10]">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xs font-semibold tracking-widest text-white uppercase">
            ORBITALSLOTS
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded transition-colors",
                  pathname === link.href || pathname.startsWith(link.href + "/")
                    ? "text-white bg-white/10"
                    : "text-[#A0A6B0] hover:text-white hover:bg-white/5"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={role === "ADMIN" ? "/admin/notifications" : "/app/notifications"}
            className="relative p-1.5 text-[#A0A6B0] hover:text-white transition-colors"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-white text-black text-[9px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
          {userName && (
            <span className="text-xs text-[#A0A6B0] hidden md:block">{userName}</span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-[#A0A6B0] hover:text-white hover:bg-white/5 h-7 px-2"
          >
            <LogOut size={14} />
          </Button>
        </div>
      </div>
    </nav>
  );
}
