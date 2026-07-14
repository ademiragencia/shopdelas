"use client";

import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import {
  stores as seedStores,
  products as seedProducts,
  seedRiders,
  HOME_COORD,
} from "./data";
import { tile } from "./image";

const StoreContext = createContext(null);

const STORAGE_KEY = "viste:state:v2";

const initialState = {
  cart: [],
  favorites: [],
  orders: [],
  address: null,
  users: [], // { id, tipo:'cliente'|'lojista'|'entregador', nome, email, senha, ...roleData }
  sessionUserId: null,
  customStores: [], // lojas criadas por lojistas
  customProducts: [], // produtos criados por lojistas
  hydrated: false,
};

function lineKey(productId, tamanho, cor) {
  return `${productId}|${tamanho}|${cor}`;
}

const uid = (p = "") => p + Math.random().toString(36).slice(2, 9);

function reducer(state, action) {
  switch (action.type) {
    case "HYDRATE":
      return { ...initialState, ...action.payload, hydrated: true };

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
      return { ...state, cart: [], orders: [action.order, ...state.orders] };

    case "ADVANCE_ORDER":
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.id ? { ...o, statusIndex: Math.min(o.statusIndex + 1, 4) } : o
        ),
      };

    case "SET_ORDER_STATUS":
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.id ? { ...o, statusIndex: action.statusIndex } : o
        ),
      };

    // ===== Auth =====
    case "REGISTER":
      return {
        ...state,
        users: [...state.users, action.user],
        customStores: action.store ? [...state.customStores, action.store] : state.customStores,
        sessionUserId: action.user.id,
      };

    case "LOGIN":
      return { ...state, sessionUserId: action.userId };

    case "LOGOUT":
      return { ...state, sessionUserId: null };

    case "UPDATE_USER":
      return {
        ...state,
        users: state.users.map((u) => (u.id === action.id ? { ...u, ...action.data } : u)),
      };

    // ===== Lojista =====
    case "UPDATE_STORE":
      return {
        ...state,
        customStores: state.customStores.map((s) =>
          s.id === action.id ? { ...s, ...action.data } : s
        ),
      };

    case "ADD_PRODUCT":
      return { ...state, customProducts: [action.product, ...state.customProducts] };

    case "UPDATE_PRODUCT":
      return {
        ...state,
        customProducts: state.customProducts.map((p) =>
          p.id === action.id ? { ...p, ...action.data } : p
        ),
      };

    case "DELETE_PRODUCT":
      return {
        ...state,
        customProducts: state.customProducts.filter((p) => p.id !== action.id),
      };

    default:
      return state;
  }
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Hydrate
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      dispatch({ type: "HYDRATE", payload: raw ? JSON.parse(raw) : {} });
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

  // Progresso automático das entregas
  useEffect(() => {
    if (!state.hydrated) return;
    const hasActive = state.orders.some((o) => o.statusIndex < 4);
    if (!hasActive) return;
    const t = setInterval(() => {
      state.orders
        .filter((o) => o.statusIndex < 4)
        .forEach((o) => dispatch({ type: "ADVANCE_ORDER", id: o.id }));
    }, 11000);
    return () => clearInterval(t);
  }, [state.hydrated, state.orders]);

  const api = useMemo(() => {
    // Catálogo mesclado (seed + lojistas)
    const stores = [...seedStores, ...state.customStores];
    const products = [...state.customProducts, ...seedProducts];
    const getStore = (id) => stores.find((s) => s.id === id);
    const getProduct = (id) => products.find((p) => p.id === id);
    const productsByStore = (id) => products.filter((p) => p.storeId === id);

    const subtotal = state.cart.reduce((s, i) => s + i.preco * i.qtd, 0);
    const count = state.cart.reduce((s, i) => s + i.qtd, 0);
    const frete = subtotal >= 99 || subtotal === 0 ? 0 : 9.9;

    const currentUser = state.users.find((u) => u.id === state.sessionUserId) || null;

    function pickRider() {
      const online = state.users.filter((u) => u.tipo === "entregador" && u.online);
      const pool = online.length ? online : seedRiders;
      const r = pool[Math.floor(Math.random() * pool.length)];
      return {
        id: r.id,
        nome: r.nome,
        veiculo: r.veiculo,
        placa: r.placa,
        rating: r.rating,
        emoji: r.emoji || "🛵",
      };
    }

    return {
      state,
      // catálogo
      stores,
      products,
      getStore,
      getProduct,
      productsByStore,
      // carrinho
      subtotal,
      count,
      frete,
      total: subtotal + frete,
      addToCart: (product, tamanho, cor, qtd = 1) =>
        dispatch({ type: "ADD_TO_CART", product, tamanho, cor, qtd }),
      setQtd: (key, qtd) => dispatch({ type: "SET_QTD", key, qtd }),
      removeFromCart: (key) => dispatch({ type: "REMOVE_FROM_CART", key }),
      clearCart: () => dispatch({ type: "CLEAR_CART" }),
      // favoritos
      toggleFavorite: (productId) => dispatch({ type: "TOGGLE_FAVORITE", productId }),
      isFavorite: (productId) => state.favorites.includes(productId),
      // endereço
      setAddress: (address) => dispatch({ type: "SET_ADDRESS", address }),
      // auth
      currentUser,
      register: ({ tipo, nome, email, senha, storeNome, categoria, emoji, pixKey, pixTipo, veiculo, placa }) => {
        const existe = state.users.some((u) => u.email.toLowerCase() === email.toLowerCase());
        if (existe) return { ok: false, erro: "E-mail já cadastrado" };
        const id = uid("u-");
        let store = null;
        const user = { id, tipo, nome, email, senha };
        if (tipo === "lojista") {
          const storeId = uid("loja-");
          store = {
            id: storeId,
            nome: storeNome || nome,
            emoji: emoji || "🏬",
            categoria: categoria || "feminino",
            rating: 5.0,
            avaliacoes: 0,
            tempo: "30-50 min",
            frete: 0,
            cupom: null,
            selo: "Nova loja",
            pixKey: pixKey || email,
            pixTipo: pixTipo || "E-mail",
            coord: { x: 20 + Math.random() * 60, y: 20 + Math.random() * 40 },
            ownerId: id,
          };
          user.storeId = storeId;
        }
        if (tipo === "entregador") {
          user.veiculo = veiculo || "Moto";
          user.placa = placa || "";
          user.online = true;
          user.rating = 5.0;
          user.emoji = "🛵";
        }
        dispatch({ type: "REGISTER", user, store });
        return { ok: true, user };
      },
      login: (email, senha) => {
        const u = state.users.find(
          (x) => x.email.toLowerCase() === email.toLowerCase() && x.senha === senha
        );
        if (!u) return { ok: false, erro: "E-mail ou senha inválidos" };
        dispatch({ type: "LOGIN", userId: u.id });
        return { ok: true, user: u };
      },
      logout: () => dispatch({ type: "LOGOUT" }),
      // lojista
      myStore: currentUser?.storeId ? getStore(currentUser.storeId) : null,
      updateStore: (id, data) => dispatch({ type: "UPDATE_STORE", id, data }),
      addProduct: (data) => {
        const id = uid("prod-");
        const product = {
          id,
          storeId: data.storeId,
          nome: data.nome,
          emoji: data.emoji || "👕",
          categoria: data.categoria,
          preco: Number(data.preco),
          precoAntigo: data.precoAntigo ? Number(data.precoAntigo) : null,
          rating: 5.0,
          vendidos: 0,
          tamanhos: data.tamanhos?.length ? data.tamanhos : ["P", "M", "G"],
          cores: data.cores || [
            { nome: "Preto", hex: "#111111" },
            { nome: "Branco", hex: "#f4f4f4" },
          ],
          descricao: data.descricao || data.nome,
          imagem: tile(id, data.emoji || "👕", { label: data.nome }),
          parcelas: 3,
          custom: true,
        };
        dispatch({ type: "ADD_PRODUCT", product });
        return product;
      },
      updateProduct: (id, data) => dispatch({ type: "UPDATE_PRODUCT", id, data }),
      deleteProduct: (id) => dispatch({ type: "DELETE_PRODUCT", id }),
      ordersForStore: (storeId) =>
        state.orders.filter((o) => o.itens.some((i) => i.storeId === storeId)),
      // entregador
      setRiderOnline: (online) => {
        if (currentUser) dispatch({ type: "UPDATE_USER", id: currentUser.id, data: { online } });
      },
      ordersForRider: (riderId) => state.orders.filter((o) => o.rider?.id === riderId),
      advanceOrder: (id) => dispatch({ type: "ADVANCE_ORDER", id }),
      // pedido
      placeOrder: (base) => {
        const rider = pickRider();
        const primeiraLoja = getStore(state.cart[0]?.storeId);
        const order = {
          ...base,
          id: "V" + Date.now().toString().slice(-6),
          criadoEm: Date.now(),
          statusIndex: 0,
          rider,
          storeCoord: primeiraLoja?.coord || { x: 30, y: 30 },
          homeCoord: HOME_COORD,
        };
        dispatch({ type: "PLACE_ORDER", order });
        return order;
      },
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
  { label: "Pedido confirmado", emoji: "✅", desc: "A loja recebeu seu pedido" },
  { label: "Preparando", emoji: "📦", desc: "Separando e embalando suas peças" },
  { label: "A caminho", emoji: "🛵", desc: "O entregador retirou seu pedido" },
  { label: "Perto de você", emoji: "📍", desc: "O entregador está chegando" },
  { label: "Entregue", emoji: "🎉", desc: "Pedido entregue. Aproveite!" },
];

// Progresso 0..1 no mapa por etapa do pedido
export const STEP_PROGRESS = [0, 0.12, 0.5, 0.85, 1];
