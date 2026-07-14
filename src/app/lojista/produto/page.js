"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { categories } from "@/lib/data";
import { tile } from "@/lib/image";

const EMOJIS = ["👕", "👗", "👖", "🧥", "👚", "👟", "🥾", "🩴", "👜", "🕶️", "🧢", "⌚", "👙", "🩳", "🎽", "🩱"];
const TAMS = ["PP", "P", "M", "G", "GG", "XG", "36", "38", "40", "42", "Único"];

function ProdutoInner() {
  const router = useRouter();
  const toast = useToast();
  const params = useSearchParams();
  const editId = params.get("id");
  const { myStore, getProduct, addProduct, updateProduct } = useStore();

  const editing = editId ? getProduct(editId) : null;

  const [f, setF] = useState(
    editing
      ? {
          nome: editing.nome,
          categoria: editing.categoria,
          emoji: editing.emoji,
          preco: String(editing.preco),
          precoAntigo: editing.precoAntigo ? String(editing.precoAntigo) : "",
          tamanhos: editing.tamanhos || [],
          descricao: editing.descricao || "",
        }
      : {
          nome: "",
          categoria: myStore?.categoria || "feminino",
          emoji: "👕",
          preco: "",
          precoAntigo: "",
          tamanhos: ["P", "M", "G"],
          descricao: "",
        }
  );

  const up = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const toggleTam = (t) =>
    setF((s) => ({
      ...s,
      tamanhos: s.tamanhos.includes(t) ? s.tamanhos.filter((x) => x !== t) : [...s.tamanhos, t],
    }));

  function submit() {
    if (!f.nome || !f.preco) return toast("Informe nome e preço", "⚠️");
    if (editing) {
      updateProduct(editId, {
        nome: f.nome,
        categoria: f.categoria,
        emoji: f.emoji,
        preco: Number(f.preco),
        precoAntigo: f.precoAntigo ? Number(f.precoAntigo) : null,
        tamanhos: f.tamanhos.length ? f.tamanhos : ["Único"],
        descricao: f.descricao,
      });
      toast("Produto atualizado ✅");
    } else {
      addProduct({ ...f, storeId: myStore.id });
      toast("Produto publicado! 🎉");
    }
    router.push("/lojista");
  }

  if (!myStore) {
    return (
      <div className="empty">
        <div className="empty__emoji">🏬</div>
        <h3>Faça login como lojista</h3>
      </div>
    );
  }

  return (
    <>
      <header className="pagehead">
        <button className="back-btn" onClick={() => router.back()}>‹</button>
        <span className="pagehead__title">{editing ? "Editar produto" : "Novo produto"}</span>
      </header>

      {/* Preview */}
      <div style={{ display: "flex", justifyContent: "center", padding: "16px 0 4px" }}>
        <div style={{ width: 120, height: 120, borderRadius: 16, overflow: "hidden", boxShadow: "var(--shadow)" }}>
          <img
            src={tile(editId || "novo", f.emoji, { label: f.nome || "Produto" })}
            alt="preview"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      </div>

      <div className="card-block">
        <div className="field">
          <label>Nome do produto</label>
          <input value={f.nome} onChange={(e) => up("nome", e.target.value)} placeholder="Ex: Vestido Longo Verão" />
        </div>
        <div className="field">
          <label>Ícone</label>
          <div className="opts">
            {EMOJIS.map((e) => (
              <button key={e} className={`opt ${f.emoji === e ? "is-active" : ""}`} onClick={() => up("emoji", e)} style={{ fontSize: 20 }}>
                {e}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label>Categoria</label>
          <select value={f.categoria} onChange={(e) => up("categoria", e.target.value)}>
            {categories.filter((c) => c.id !== "todos").map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>
        <div className="row2">
          <div className="field">
            <label>Preço (R$)</label>
            <input type="number" inputMode="decimal" value={f.preco} onChange={(e) => up("preco", e.target.value)} placeholder="99.90" />
          </div>
          <div className="field">
            <label>Preço antigo (opcional)</label>
            <input type="number" inputMode="decimal" value={f.precoAntigo} onChange={(e) => up("precoAntigo", e.target.value)} placeholder="139.90" />
          </div>
        </div>
        <div className="field">
          <label>Tamanhos disponíveis</label>
          <div className="opts">
            {TAMS.map((t) => (
              <button key={t} className={`opt ${f.tamanhos.includes(t) ? "is-active" : ""}`} onClick={() => toggleTam(t)}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label>Descrição</label>
          <textarea
            value={f.descricao}
            onChange={(e) => up("descricao", e.target.value)}
            placeholder="Detalhes, tecido, caimento..."
            rows={3}
            style={{ width: "100%", padding: "12px 14px", border: "1.5px solid var(--line)", borderRadius: 10, fontFamily: "inherit", fontSize: 15, resize: "vertical" }}
          />
        </div>
      </div>

      <div style={{ padding: "4px 14px 24px" }}>
        <button className="btn btn--primary btn--block" onClick={submit}>
          {editing ? "Salvar alterações" : "Publicar produto"}
        </button>
      </div>
    </>
  );
}

export default function ProdutoFormPage() {
  return (
    <Suspense fallback={<div className="empty"><div className="empty__emoji">📦</div></div>}>
      <ProdutoInner />
    </Suspense>
  );
}
