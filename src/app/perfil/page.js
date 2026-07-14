"use client";

import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import { useStore } from "@/lib/store";
import { getProduct } from "@/lib/data";
import ProductCard from "@/components/ProductCard";

export default function ProfilePage() {
  const { state } = useStore();
  const favoritos = state.favorites.map(getProduct).filter(Boolean);
  const pedidos = state.orders.length;

  return (
    <>
      <div className="profile-head">
        <div className="ava">👤</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 18 }}>Olá, visitante 👋</div>
          <div style={{ fontSize: 13, opacity: 0.95 }}>Bem-vindo à ModaExpress</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, padding: 14 }}>
        <StatCard label="Pedidos" value={pedidos} emoji="🧾" href="/pedidos" />
        <StatCard label="Favoritos" value={favoritos.length} emoji="❤️" />
        <StatCard label="Cupons" value={3} emoji="🎟️" />
      </div>

      <div className="menu">
        <Link href="/pedidos">
          <span>🧾</span> Meus pedidos <span className="chev">›</span>
        </Link>
        <Link href="/carrinho">
          <span>🛒</span> Minha sacola <span className="chev">›</span>
        </Link>
        <button>
          <span>📍</span> Endereços de entrega <span className="chev">›</span>
        </button>
        <button>
          <span>🎟️</span> Meus cupons <span className="chev">›</span>
        </button>
        <button>
          <span>⚙️</span> Configurações <span className="chev">›</span>
        </button>
        <button>
          <span>💬</span> Ajuda e suporte <span className="chev">›</span>
        </button>
      </div>

      {favoritos.length > 0 && (
        <section className="section">
          <div className="section__head">
            <span className="section__title">Meus favoritos ❤️</span>
          </div>
          <div className="grid">
            {favoritos.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <p className="helper" style={{ textAlign: "center", marginTop: 20 }}>
        ModaExpress · Demo de marketplace de moda
      </p>

      <BottomNav />
    </>
  );
}

function StatCard({ label, value, emoji, href }) {
  const inner = (
    <div style={{ background: "#fff", borderRadius: 14, padding: "14px 8px", textAlign: "center", boxShadow: "var(--shadow)", flex: 1 }}>
      <div style={{ fontSize: 22 }}>{emoji}</div>
      <div style={{ fontWeight: 900, fontSize: 18 }}>{value}</div>
      <div style={{ fontSize: 12, color: "var(--muted)" }}>{label}</div>
    </div>
  );
  return href ? (
    <Link href={href} style={{ flex: 1, display: "flex" }}>
      {inner}
    </Link>
  ) : (
    inner
  );
}
