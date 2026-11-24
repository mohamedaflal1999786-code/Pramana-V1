"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  FileText,
  Network,
  ShieldCheck,
  AlertOctagon,
  Clock,
  Layers,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import * as React from "react";

export interface SidebarItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

const DEFAULT_NAV_ITEMS: SidebarItem[] = [
  { label: "Overview", href: "/platform", icon: <Layers className="w-4 h-4" /> },
  { label: "Clinical Documents", href: "/platform/documents", icon: <FileText className="w-4 h-4" /> },
  { label: "Safety Graph", href: "/platform/graph", icon: <Network className="w-4 h-4" /> },
  { label: "Medication Audits", href: "/platform/medications", icon: <AlertOctagon className="w-4 h-4" /> },
  { label: "Verification Queue", href: "/platform/verification", icon: <ShieldCheck className="w-4 h-4" />, badge: "Active" },
  { label: "Audit Timeline", href: "/platform/timeline", icon: <Clock className="w-4 h-4" /> },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <aside
      className={cn(
        "h-full border-r border-[var(--line)] bg-[#faf9f5] flex flex-col transition-all duration-200 select-none",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      <div className="p-4 border-b border-[var(--line)] flex items-center justify-between">
        {!collapsed && (
          <span className="text-[12px] font-[750] tracking-[1.4px] text-[var(--green)] uppercase">
            Platform Workspaces
          </span>
        )}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-[5px] text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[#e9eee6] ml-auto"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {DEFAULT_NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-[7px] text-[13px] font-[650] transition-colors",
                isActive
                  ? "bg-[var(--green)] text-white"
                  : "text-[var(--ink)] hover:bg-[#e9eee6]",
                collapsed && "justify-center px-0"
              )}
              title={collapsed ? item.label : undefined}
            >
              <span className="shrink-0">{item.icon}</span>
              {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
              {!collapsed && item.badge && (
                <span
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full font-bold",
                    isActive ? "bg-white/20 text-white" : "bg-[#e5f1df] text-[#145a45]"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-[var(--line)] text-[11px] text-[var(--muted)]">
        {!collapsed && <p className="my-0">Pramana-V1 · Unknown GenZ</p>}
      </div>
    </aside>
  );
}
