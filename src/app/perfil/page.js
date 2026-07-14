"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import ProductCard from "@/components/ProductCard";
import { useStore } from "@/lib/store";

export default function ProfilePage() {
  const router = useRouter();
  const { state, currentUser, getProduct, myStore, logout, setRiderOnline } = useStore();
  const favoritos = state.favorites.map(getProduct).filter(Boolean);
  const pedidos = state.orders.length;

  const nome = currentUser?.nome || "visitante";
  const tipoLabel =
    currentUser?.tipo === "lojista"
      ? "Lojista"
      : currentUser?.tipo === "entregador"
      ? "Entregador"
      : currentUser
      ? "Cliente"
      : "Convidado";

  return (
    <>
      <div className="profile-head">
        <div className="ava">
          {currentUser?.tipo === "lojista" ? "🏬" : currentUser?.tipo === "entregador" ? "🛵" : "👤"}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>Olá, {nome} 👋</div>
          <div style={{ fontSize: 13, opacity: 0.95 }}>
            {tipoLabel} · Vistê
          </div>
        </div>
        {currentUser && (
          <button
            onClick={() => {
              logout();
              router.push("/");
            }}
            style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}
          >
            Sair
          </button>
        )}
      </div>

      {!currentUser && (
        <div style={{ padding: 14, display: "flex", gap: 10 }}>
          <Link href="/entrar" className="btn btn--primary" style={{ flex: 1 }}>
            Entrar
          </Link>
          <Link href="/cadastro" className="btn btn--outline" style={{ flex: 1 }}>
            Criar conta
          </Link>
        </div>
      )}

      {/* Painéis por perfil */}
      {currentUser?.tipo === "lojista" && (
        <div className="card-block" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 30 }}>{myStore?.emoji || "🏬"}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800 }}>{myStore?.nome}</div>
            <div style={{ color: "var(--muted)", fontSize: 13 }}>Gerencie produtos e pedidos</div>
          </div>
          <Link href="/lojista" className="btn btn--primary" style={{ padding: "10px 14px" }}>
            Abrir painel
          </Link>
        </div>
      )}

      {currentUser?.tipo === "entregador" && (
        <div className="card-block">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 30 }}>🛵</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800 }}>{currentUser.veiculo}</div>
              <div style={{ color: "var(--muted)", fontSize: 13 }}>
                {currentUser.online ? "🟢 Disponível para corridas" : "⚪ Offline"}
              </div>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={!!currentUser.online}
                onChange={(e) => setRiderOnline(e.target.checked)}
              />
              <span className="slider" />
            </label>
          </div>
          <Link href="/entregador" className="btn btn--primary btn--block" style={{ marginTop: 12 }}>
            Ver corridas
          </Link>
        </div>
      )}

      {/* Stats */}
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
        {!currentUser && (
          <>
            <Link href="/cadastro?tipo=lojista">
              <span>🏬</span> Quero vender (abrir loja) <span className="chev">›</span>
            </Link>
            <Link href="/cadastro?tipo=entregador">
              <span>🛵</span> Quero entregar (motoentregador) <span className="chev">›</span>
            </Link>
          </>
        )}
        <button>
          <span>📍</span> Endereços de entrega <span className="chev">›</span>
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
        Vistê · Vestiu, chegou. — protótipo de marketplace de moda
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
