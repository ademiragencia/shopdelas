"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import { tile } from "./image";
import { stores as demoStores, products as demoProducts } from "./data";

const StoreContext = createContext(null);
const LOCAL_KEY = "viste:local:v1";
const uid6 = () => "V" + Date.now().toString().slice(-6);

function normProduct(p) {
  return {
    ...p,
    preco: Number(p.preco),
    precoAntigo: p.precoAntigo != null ? Number(p.precoAntigo) : null,
    tamanhos: p.tamanhos?.length ? p.tamanhos : ["Único"],
    cores: p.cores || [],
    vendidos: p.vendidos || 0,
    parcelas: 3,
    imagem: p.imagem || tile(p.id, p.emoji || "👕", { label: p.nome }),
  };
}
function normOrder(o) {
  return {
    ...o,
    statusIndex: o.statusIndex ?? 0,
    criadoEm: o.createdAt?.toMillis ? o.createdAt.toMillis() : o.criadoEm || Date.now(),
    rider: o.riderInfo || null,
    itens: (o.itens || []).map((i) => ({
      ...i,
      key: `${i.productId}|${i.tamanho}|${i.cor}`,
      imagem: tile(i.productId || i.nome, i.emoji || "👕", { label: i.nome }),
    })),
  };
}

export function StoreProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState(null);
  const [fbStores, setFbStores] = useState([]);
  const [fbProducts, setFbProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  const [cart, setCart] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [address, setAddressState] = useState(null);
  const localReady = useRef(false);
  const profileUnsub = useRef(null);
  const ordersUnsub = useRef(null);

  // Local
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        setCart(p.cart || []);
        setFavorites(p.favorites || []);
        setAddressState(p.address || null);
      }
    } catch {}
    localReady.current = true;
  }, []);
  useEffect(() => {
    if (!localReady.current) return;
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify({ cart, favorites, address }));
    } catch {}
  }, [cart, favorites, address]);

  // Catálogo em tempo real
  useEffect(() => {
    const us = onSnapshot(
      collection(db, "stores"),
      (snap) => setFbStores(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      () => {}
    );
    const up = onSnapshot(
      collection(db, "products"),
      (snap) => setFbProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      () => {}
    );
    return () => {
      us();
      up();
    };
  }, []);

  // Auth + perfil
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      profileUnsub.current?.();
      ordersUnsub.current?.();
      if (!user) {
        setProfile(null);
        setOrders([]);
        setReady(true);
        return;
      }
      profileUnsub.current = onSnapshot(doc(db, "profiles", user.uid), (d) => {
        const prof = d.exists() ? { id: user.uid, ...d.data() } : { id: user.uid, tipo: "cliente", nome: "" };
        setProfile(prof);
        setupOrders(prof);
        setReady(true);
      });
    });
    return () => {
      unsub();
      profileUnsub.current?.();
      ordersUnsub.current?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setupOrders(prof) {
    ordersUnsub.current?.();
    let q;
    if (prof.tipo === "entregador") q = query(collection(db, "orders"), where("riderId", "==", prof.id));
    else if (prof.tipo === "lojista") q = query(collection(db, "orders"), where("sellerIds", "array-contains", prof.id));
    else q = query(collection(db, "orders"), where("clienteId", "==", prof.id));
    ordersUnsub.current = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => normOrder({ id: d.id, ...d.data() }));
        list.sort((a, b) => b.criadoEm - a.criadoEm);
        setOrders(list);
      },
      () => {}
    );
  }

  // Catálogo mesclado (demo + Firebase)
  const stores = useMemo(() => [...demoStores, ...fbStores], [fbStores]);
  const products = useMemo(() => [...fbProducts.map(normProduct), ...demoProducts], [fbProducts]);
  const getStore = (id) => stores.find((s) => s.id === id);
  const getProduct = (id) => products.find((p) => p.id === id);
  const productsByStore = (id) => products.filter((p) => p.storeId === id);

  const subtotal = cart.reduce((s, i) => s + i.preco * i.qtd, 0);
  const count = cart.reduce((s, i) => s + i.qtd, 0);
  const frete = subtotal >= 99 || subtotal === 0 ? 0 : 9.9;

  const currentUser = profile;
  const myStore = profile?.id ? stores.find((s) => s.ownerId === profile.id) : null;

  // Carrinho / favoritos
  const addToCart = (product, tamanho, cor, qtd = 1) => {
    const key = `${product.id}|${tamanho}|${cor}`;
    setCart((c) => {
      const ex = c.find((i) => i.key === key);
      if (ex) return c.map((i) => (i.key === key ? { ...i, qtd: i.qtd + qtd } : i));
      return [...c, { key, productId: product.id, nome: product.nome, emoji: product.emoji, preco: product.preco, imagem: product.imagem, storeId: product.storeId, tamanho, cor, qtd }];
    });
  };
  const setQtd = (key, qtd) => setCart((c) => c.map((i) => (i.key === key ? { ...i, qtd } : i)).filter((i) => i.qtd > 0));
  const removeFromCart = (key) => setCart((c) => c.filter((i) => i.key !== key));
  const clearCart = () => setCart([]);
  const toggleFavorite = (id) => setFavorites((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));

  // Auth
  const register = async (d) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, d.email, d.senha);
      const uid = cred.user.uid;
      await setDoc(doc(db, "profiles", uid), {
        tipo: d.tipo,
        nome: d.nome,
        email: d.email || null,
        veiculo: d.veiculo || null,
        placa: d.placa || null,
        online: d.tipo === "entregador",
        rating: 5,
        emoji: "🛵",
        createdAt: serverTimestamp(),
      });
      if (d.tipo === "lojista") {
        await addDoc(collection(db, "stores"), {
          ownerId: uid,
          nome: d.storeNome || d.nome,
          emoji: d.emoji || "🏬",
          categoria: d.categoria || "feminino",
          rating: 5,
          avaliacoes: 0,
          tempo: "30-50 min",
          frete: 0,
          cupom: null,
          selo: "Nova loja",
          pixKey: d.pixKey || d.email,
          pixTipo: d.pixTipo || "E-mail",
          coord: { x: Math.round(20 + Math.random() * 60), y: Math.round(20 + Math.random() * 40) },
          lat: d.storeLat ?? null,
          lng: d.storeLng ?? null,
          createdAt: serverTimestamp(),
        });
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, erro: traduzErro(e.code || e.message) };
    }
  };

  const login = async (email, senha) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, senha);
      const snap = await getDoc(doc(db, "profiles", cred.user.uid));
      return { ok: true, user: snap.exists() ? { id: cred.user.uid, ...snap.data() } : { tipo: "cliente" } };
    } catch (e) {
      return { ok: false, erro: traduzErro(e.code || e.message) };
    }
  };

  const loginGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const uid = cred.user.uid;
      const ref = doc(db, "profiles", uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        const novo = {
          tipo: "cliente",
          nome: cred.user.displayName || "Cliente",
          email: cred.user.email || null,
          online: false,
          rating: 5,
          emoji: "🛵",
          createdAt: serverTimestamp(),
        };
        await setDoc(ref, novo);
        return { ok: true, user: { id: uid, ...novo } };
      }
      return { ok: true, user: { id: uid, ...snap.data() } };
    } catch (e) {
      const code = e.code || e.message || "";
      if (String(code).includes("popup-closed") || String(code).includes("cancelled")) {
        return { ok: false, erro: "Login cancelado" };
      }
      return { ok: false, erro: traduzErro(code) };
    }
  };

  const logout = async () => {
    await signOut(auth);
    setProfile(null);
    setOrders([]);
  };

  // Lojista
  const addProduct = async (d) => {
    try {
      await addDoc(collection(db, "products"), {
        storeId: d.storeId,
        nome: d.nome,
        emoji: d.emoji || "👕",
        categoria: d.categoria,
        preco: Number(d.preco),
        precoAntigo: d.precoAntigo ? Number(d.precoAntigo) : null,
        tamanhos: d.tamanhos?.length ? d.tamanhos : ["Único"],
        cores: d.cores || [],
        descricao: d.descricao || d.nome,
        vendidos: 0,
        ativo: true,
        createdAt: serverTimestamp(),
      });
      return { ok: true };
    } catch (e) {
      return { ok: false, erro: e.message };
    }
  };
  const updateProduct = async (id, d) => {
    await updateDoc(doc(db, "products", id), {
      nome: d.nome,
      emoji: d.emoji,
      categoria: d.categoria,
      preco: Number(d.preco),
      precoAntigo: d.precoAntigo ? Number(d.precoAntigo) : null,
      tamanhos: d.tamanhos?.length ? d.tamanhos : ["Único"],
      descricao: d.descricao,
    });
  };
  const deleteProduct = async (id) => deleteDoc(doc(db, "products", id));
  const updateStore = async (id, d) => updateDoc(doc(db, "stores", id), d);
  const ordersForStore = (storeId) => orders.filter((o) => o.itens.some((i) => i.storeId === storeId));

  // Entregador
  const setRiderOnline = async (online) => {
    if (!profile) return;
    setProfile((p) => ({ ...p, online }));
    try {
      await updateDoc(doc(db, "profiles", profile.id), { online });
    } catch {}
  };
  const ordersForRider = (riderId) => orders.filter((o) => o.rider?.id === riderId);
  const advanceOrder = async (id) => {
    const o = orders.find((x) => x.id === id);
    const next = Math.min((o?.statusIndex ?? 0) + 1, 4);
    await updateDoc(doc(db, "orders", id), { statusIndex: next });
  };
  const updateRiderLocation = async (orderId, lat, lng) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { "geo.rider": { lat, lng } });
      if (profile) await updateDoc(doc(db, "profiles", profile.id), { lat, lng });
    } catch {}
  };

  // Pedido
  const placeOrder = async (base) => {
    if (!currentUser) return { ok: false, erro: "Entre na sua conta para finalizar" };
    const loja = getStore(cart[0]?.storeId);
    const sellerIds = [...new Set(cart.map((i) => getStore(i.storeId)?.ownerId).filter(Boolean))];

    // Atribui um entregador online (no cliente)
    let riderId = null;
    let riderInfo = null;
    try {
      const qs = await getDocs(query(collection(db, "profiles"), where("tipo", "==", "entregador"), where("online", "==", true)));
      const riders = qs.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (riders.length) {
        const r = riders[Math.floor(Math.random() * riders.length)];
        riderId = r.id;
        riderInfo = { id: r.id, nome: r.nome, veiculo: r.veiculo, placa: r.placa, rating: r.rating || 5, emoji: r.emoji || "🛵" };
      }
    } catch {}

    const storePos = loja?.lat != null ? { lat: loja.lat, lng: loja.lng } : null;
    const geo = { store: storePos, home: base.home || null, rider: storePos };
    const codigo = uid6();
    const payload = {
      codigo,
      clienteId: currentUser.id,
      riderId,
      riderInfo,
      sellerIds,
      statusIndex: 0,
      subtotal: base.subtotal,
      frete: base.frete,
      total: base.total,
      endereco: base.endereco,
      pagamento: base.pagamento,
      storeCoord: loja?.coord || null,
      geo,
      itens: cart.map((i) => ({ productId: i.productId, storeId: i.storeId, nome: i.nome, emoji: i.emoji, preco: i.preco, tamanho: i.tamanho, cor: i.cor, qtd: i.qtd })),
      createdAt: serverTimestamp(),
    };
    try {
      const ref = await addDoc(collection(db, "orders"), payload);
      // otimista (evita "não encontrado" antes do snapshot)
      setOrders((prev) => [normOrder({ id: ref.id, ...payload, createdAt: { toMillis: () => Date.now() } }), ...prev]);
      clearCart();
      return { ok: true, codigo, id: ref.id };
    } catch (e) {
      return { ok: false, erro: e.message };
    }
  };
  const getOrder = (x) => orders.find((o) => o.id === x || o.codigo === x);
  const setAddress = (a) => setAddressState(a);

  const api = useMemo(
    () => ({
      ready,
      state: { cart, favorites, orders, address },
      stores, products, getStore, getProduct, productsByStore,
      subtotal, count, frete, total: subtotal + frete,
      addToCart, setQtd, removeFromCart, clearCart,
      toggleFavorite, isFavorite: (id) => favorites.includes(id),
      setAddress,
      currentUser, myStore,
      register, login, loginGoogle, logout,
      addProduct, updateProduct, deleteProduct, updateStore, ordersForStore,
      setRiderOnline, ordersForRider, advanceOrder, updateRiderLocation,
      placeOrder, getOrder,
    }),
    [ready, cart, favorites, orders, address, stores, products, profile]
  );

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

function traduzErro(code = "") {
  const c = String(code).toLowerCase();
  if (c.includes("email-already")) return "E-mail já cadastrado";
  if (c.includes("invalid-credential") || c.includes("wrong-password") || c.includes("user-not-found")) return "E-mail ou senha inválidos";
  if (c.includes("weak-password")) return "Senha muito curta (mín. 6 caracteres)";
  if (c.includes("invalid-email")) return "E-mail inválido";
  if (c.includes("configuration-not-found") || c.includes("api-key")) return "Firebase ainda não configurado";
  return "Não foi possível concluir. Tente novamente.";
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

export const STEP_PROGRESS = [0, 0.12, 0.5, 0.85, 1];
