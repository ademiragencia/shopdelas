"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import ProductCard from "@/components/ProductCard";
import { useStore } from "@/lib/store";
import {
  categories,
  stores,
  products,
  banners,
  storeAvatar,
} from "@/lib/data";

export default function Home() {
  const [cat, setCat] = useState("todos");
  const [q, setQ] = useState("");
  const router = useRouter();
  const { count } = useStore();

  const filtered = useMemo(() => {
    let list = products;
    if (cat !== "todos") list = list.filter((p) => p.categoria === cat);
    if (q.trim()) {
      const t = q.toLowerCase();
      list = list.filter((p) => p.nome.toLowerCase().includes(t));
    }
    return list;
  }, [cat, q]);

  const featuredStores = cat === "todos" ? stores : stores.filter((s) => s.categoria === cat);

  function submitSearch(e) {
    e.preventDefault();
    if (q.trim()) router.push(`/buscar?q=${encodeURIComponent(q)}`);
  }

  return (
    <>
      {/* Top bar */}
      <header className="topbar">
        <div className="topbar__row">
          <div className="topbar__loc" style={{ flex: 1 }}>
            <span>📍 Entregar em</span>
            <strong>Casa · Campo Grande, MS ⌄</strong>
          </div>
          <Link href="/pedidos" className="icon-btn" aria-label="pedidos">
            🧾
          </Link>
          <Link href="/carrinho" className="icon-btn" aria-label="carrinho">
            🛒
            {count > 0 && <span className="badge">{count}</span>}
          </Link>
        </div>
        <form className="search" onSubmit={submitSearch}>
          <span>🔍</span>
          <input
            placeholder="Buscar roupas, tênis, marcas..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button type="submit" className="search__go">
            Buscar
          </button>
        </form>
      </header>

      {/* Categorias */}
      <div className="section" style={{ paddingBottom: 0 }}>
        <div className="cats">
          {categories.map((c) => (
            <button
              key={c.id}
              className={`cat ${cat === c.id ? "is-active" : ""}`}
              onClick={() => setCat(c.id)}
            >
              <span className="cat__ic">{c.emoji}</span>
              <span className="cat__label">{c.nome}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Banners */}
      <div className="banners">
        {banners.map((b) => (
          <div key={b.id} className="banner" style={{ background: b.cor }}>
            <div>
              <h3>{b.titulo}</h3>
              <p>{b.sub}</p>
            </div>
            <span className="banner__emoji">{b.emoji}</span>
          </div>
        ))}
      </div>

      {/* Lojas */}
      {featuredStores.length > 0 && (
        <section className="section">
          <div className="section__head">
            <span className="section__title">Lojas em destaque</span>
            <span className="section__link">Ver todas</span>
          </div>
          <div className="stores">
            {featuredStores.map((s) => (
              <Link key={s.id} href={`/loja/${s.id}`} className="store">
                <div className="store__avatar">
                  <img src={storeAvatar(s)} alt={s.nome} />
                </div>
                <div className="store__info">
                  <div className="store__name">
                    {s.nome}
                    {s.selo && <span className="selo">{s.selo}</span>}
                  </div>
                  <div className="store__meta">
                    <span className="rating">★ {s.rating}</span>
                    <span className="dot" />
                    <span>🛵 {s.tempo}</span>
                    <span className="dot" />
                    <span className={s.frete === 0 ? "free-tag" : ""}>
                      {s.frete === 0 ? "Grátis" : `R$ ${s.frete.toFixed(2)}`}
                    </span>
                  </div>
                  {s.cupom && <div className="store__cupom">🎟️ {s.cupom}</div>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Produtos */}
      <section className="section">
        <div className="section__head">
          <span className="section__title">
            {cat === "todos" ? "Ofertas relâmpago 🔥" : categories.find((c) => c.id === cat)?.nome}
          </span>
        </div>
        {filtered.length === 0 ? (
          <div className="empty">
            <div className="empty__emoji">🔎</div>
            <h3>Nada encontrado</h3>
            <p>Tente outra categoria ou busca.</p>
          </div>
        ) : (
          <div className="grid">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      <BottomNav />
    </>
  );
}
