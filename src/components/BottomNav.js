"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";

const items = [
  { href: "/", label: "Início", ic: "🏠" },
  { href: "/buscar", label: "Buscar", ic: "🔍" },
  { href: "/pedidos", label: "Pedidos", ic: "🧾" },
  { href: "/perfil", label: "Perfil", ic: "👤" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { state } = useStore();
  const activeOrders = state.orders.filter((o) => o.statusIndex < 4).length;

  return (
    <nav className="bottomnav">
      {items.map((it) => {
        const active =
          it.href === "/" ? pathname === "/" : pathname.startsWith(it.href);
        return (
          <Link key={it.href} href={it.href} className={`nav-item ${active ? "is-active" : ""}`}>
            <span className="nav-item__ic">{it.ic}</span>
            {it.label}
            {it.href === "/pedidos" && activeOrders > 0 && (
              <span className="badge">{activeOrders}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
