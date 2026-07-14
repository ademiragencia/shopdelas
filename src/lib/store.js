"use client";

import { createContext, useContext, useEffect, useMemo, useReducer } from "react";

const StoreContext = createContext(null);

const STORAGE_KEY = "loja-roupas:state:v1";

const initialState = {
  cart: [], // { key, productId, nome, emoji, preco, imagem, storeId, tamanho, cor, qtd }
  favorites: [], // productId[]
  orders: [], // { id, itens, total, subtotal, frete, endereco, pagamento, criadoEm, statusIndex }
  address: null, // { nome, rua, numero, bairro, cidade, cep }
  hydrated: false,
};

function lineKey(productId, tamanho, cor) {
  return `${productId}|${tamanho}|${cor}`;
}

function reducer(state, action) {
  switch (action.type) {
    case "HYDRATE":
      return { ...state, ...action.payload, hydrated: true };

    case "ADD_TO_CART": {
      const { product, tamanho, cor, qtd } = action;
      const key = lineKey(product.id, tamanho, cor);
      const existing = state.cart.find((i) => i.key === key);
      let cart;
      if (existing) {
        cart = state.cart.map((i) => (i.key === key ? { ...i, qtd: i.qtd + qtd } : i));
      } else {
        cart = [
          ...state.cart,
          {
            key,
            productId: product.id,
            nome: product.nome,
            emoji: product.emoji,
            preco: product.preco,
            imagem: product.imagem,
            storeId: product.storeId,
            tamanho,
            cor,
            qtd,
          },
        ];
      }
      return { ...state, cart };
    }

    case "SET_QTD": {
      const cart = state.cart
        .map((i) => (i.key === action.key ? { ...i, qtd: action.qtd } : i))
        .filter((i) => i.qtd > 0);
      return { ...state, cart };
    }

    case "REMOVE_FROM_CART":
      return { ...state, cart: state.cart.filter((i) => i.key !== action.key) };

    case "CLEAR_CART":
      return { ...state, cart: [] };

    case "TOGGLE_FAVORITE": {
      const has = state.favorites.includes(action.productId);
      return {
        ...state,
        favorites: has
          ? state.favorites.filter((id) => id !== action.productId)
          : [...state.favorites, action.productId],
      };
    }

    case "SET_ADDRESS":
      return { ...state, address: action.address };

    case "PLACE_ORDER":
      return {
        ...state,
        cart: [],
        orders: [action.order, ...state.orders],
      };

    case "ADVANCE_ORDER":
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.id ? { ...o, statusIndex: Math.min(o.statusIndex + 1, 4) } : o
        ),
      };

    default:
      return state;
  }
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        dispatch({ type: "HYDRATE", payload: parsed });
      } else {
        dispatch({ type: "HYDRATE", payload: {} });
      }
    } catch {
      dispatch({ type: "HYDRATE", payload: {} });
    }
  }, []);

  // Persist
  useEffect(() => {
    if (!state.hydrated) return;
    const { hydrated, ...persist } = state;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persist));
    } catch {}
  }, [state]);

  // Simula progresso de entrega dos pedidos em andamento
  useEffect(() => {
    if (!state.hydrated) return;
    const active = state.orders.filter((o) => o.statusIndex < 4);
    if (active.length === 0) return;
    const t = setInterval(() => {
      active.forEach((o) => dispatch({ type: "ADVANCE_ORDER", id: o.id }));
    }, 12000);
    return () => clearInterval(t);
  }, [state.hydrated, state.orders]);

  const api = useMemo(() => {
    const subtotal = state.cart.reduce((s, i) => s + i.preco * i.qtd, 0);
    const count = state.cart.reduce((s, i) => s + i.qtd, 0);
    const frete = subtotal >= 99 || subtotal === 0 ? 0 : 9.9;
    return {
      state,
      subtotal,
      count,
      frete,
      total: subtotal + frete,
      addToCart: (product, tamanho, cor, qtd = 1) =>
        dispatch({ type: "ADD_TO_CART", product, tamanho, cor, qtd }),
      setQtd: (key, qtd) => dispatch({ type: "SET_QTD", key, qtd }),
      removeFromCart: (key) => dispatch({ type: "REMOVE_FROM_CART", key }),
      clearCart: () => dispatch({ type: "CLEAR_CART" }),
      toggleFavorite: (productId) => dispatch({ type: "TOGGLE_FAVORITE", productId }),
      isFavorite: (productId) => state.favorites.includes(productId),
      setAddress: (address) => dispatch({ type: "SET_ADDRESS", address }),
      placeOrder: (order) => dispatch({ type: "PLACE_ORDER", order }),
      getOrder: (id) => state.orders.find((o) => o.id === id),
    };
  }, [state]);

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore precisa estar dentro de <StoreProvider>");
  return ctx;
}

export const ORDER_STEPS = [
  { label: "Pedido confirmado", emoji: "✅", desc: "Recebemos seu pedido" },
  { label: "Preparando", emoji: "📦", desc: "A loja está separando suas peças" },
  { label: "Saiu para entrega", emoji: "🛵", desc: "Seu pedido está a caminho" },
  { label: "Perto de você", emoji: "📍", desc: "O entregador está chegando" },
  { label: "Entregue", emoji: "🎉", desc: "Pedido entregue. Aproveite!" },
];
