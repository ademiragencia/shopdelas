"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import ProductCard from "@/components/ProductCard";
import { products, categories } from "@/lib/data";

const SUGESTOES = ["Vestido", "Tênis", "Jaqueta", "Legging", "Bolsa", "Cropped", "Boné"];

function SearchInner() {
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");
  const [cat, setCat] = useState("todos");

  const results = useMemo(() => {
    let list = products;
    if (cat !== "todos") list = list.filter((p) => p.categoria === cat);
    const t = q.trim().toLowerCase();
    if (t) list = list.filter((p) => p.nome.toLowerCase().includes(t));
    return list;
  }, [q, cat]);

  return (
    <>
      <header className="topbar" style={{ paddingBottom: 12 }}>
        <form className="search" style={{ marginTop: 0 }} onSubmit={(e) => e.preventDefault()}>
          <span>🔍</span>
          <input
            autoFocus
            placeholder="O que você procura?"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {q && (
            <button type="button" className="search__go" onClick={() => setQ("")}>
              Limpar
            </button>
          )}
        </form>
      </header>

      {!q && (
        <div className="section">
          <div className="section__head">
            <span className="section__title">Buscas populares</span>
          </div>
          <div className="opts">
            {SUGESTOES.map((s) => (
              <button key={s} className="opt" onClick={() => setQ(s)}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="section" style={{ paddingBottom: 0 }}>
        <div className="cats">
          {categories.map((c) => (
            <button key={c.id} className={`cat ${cat === c.id ? "is-active" : ""}`} onClick={() => setCat(c.id)}>
              <span className="cat__ic">{c.emoji}</span>
              <span className="cat__label">{c.nome}</span>
            </button>
          ))}
        </div>
      </div>

      <section className="section">
        <div className="section__head">
          <span className="section__title">
            {q ? `Resultados para "${q}"` : "Todos os produtos"} ({results.length})
          </span>
        </div>
        {results.length === 0 ? (
          <div className="empty">
            <div className="empty__emoji">😕</div>
            <h3>Nenhum resultado</h3>
            <p>Tente outro termo ou categoria.</p>
          </div>
        ) : (
          <div className="grid">
            {results.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      <BottomNav />
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="empty"><div className="empty__emoji">🔍</div></div>}>
      <SearchInner />
    </Suspense>
  );
}
