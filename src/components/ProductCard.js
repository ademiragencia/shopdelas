"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { formatBRL } from "@/lib/data";

export default function ProductCard({ product }) {
  const { toggleFavorite, isFavorite } = useStore();
  const off = product.precoAntigo
    ? Math.round((1 - product.preco / product.precoAntigo) * 100)
    : 0;
  const fav = isFavorite(product.id);

  return (
    <Link href={`/produto/${product.id}`} className="pcard">
      <div className="pcard__imgwrap">
        <img className="pcard__img" src={product.imagem} alt={product.nome} loading="lazy" />
        {off > 0 && <span className="pcard__off">-{off}%</span>}
        <button
          className="pcard__fav"
          aria-label="favoritar"
          onClick={(e) => {
            e.preventDefault();
            toggleFavorite(product.id);
          }}
        >
          {fav ? "❤️" : "🤍"}
        </button>
      </div>
      <div className="pcard__body">
        <div className="pcard__name">{product.nome}</div>
        <div className="price">
          <span className="price__now">{formatBRL(product.preco)}</span>
          {product.precoAntigo && (
            <span className="price__old">{formatBRL(product.precoAntigo)}</span>
          )}
        </div>
        <div className="pcard__foot">
          <span className="rating">★ {product.rating.toFixed(1)}</span>
          <span>{product.vendidos >= 1000 ? `${(product.vendidos / 1000).toFixed(1)}mil` : product.vendidos} vendidos</span>
        </div>
      </div>
    </Link>
  );
}
