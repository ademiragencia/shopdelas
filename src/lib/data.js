import { tile, avatarTile } from "./image";

export const categories = [
  { id: "todos", nome: "Todos", emoji: "🛍️" },
  { id: "feminino", nome: "Feminino", emoji: "👗" },
  { id: "masculino", nome: "Masculino", emoji: "👔" },
  { id: "calcados", nome: "Calçados", emoji: "👟" },
  { id: "infantil", nome: "Infantil", emoji: "🧸" },
  { id: "acessorios", nome: "Acessórios", emoji: "👜" },
  { id: "esporte", nome: "Esporte", emoji: "🏃" },
  { id: "praia", nome: "Praia", emoji: "🏖️" },
];

export const stores = [
  { id: "urban", nome: "Urban Style", emoji: "🧥", categoria: "masculino", rating: 4.8, avaliacoes: 1204, tempo: "30-45 min", frete: 0, cupom: "Frete grátis acima de R$99", selo: "Loja Oficial", pixKey: "contato@urbanstyle.com.br", pixTipo: "E-mail", coord: { x: 22, y: 26 } },
  { id: "bella", nome: "Bella Moda", emoji: "👗", categoria: "feminino", rating: 4.9, avaliacoes: 2380, tempo: "25-40 min", frete: 7.9, cupom: "10% OFF na 1ª compra", selo: "Top Vendas", pixKey: "67 99123-4567", pixTipo: "Telefone", coord: { x: 74, y: 20 } },
  { id: "kids", nome: "Mundo Kids", emoji: "🧸", categoria: "infantil", rating: 4.7, avaliacoes: 640, tempo: "40-60 min", frete: 9.9, cupom: null, selo: null, pixKey: "31.402.155/0001-70", pixTipo: "CNPJ", coord: { x: 18, y: 74 } },
  { id: "sneaker", nome: "SneakerBox", emoji: "👟", categoria: "calcados", rating: 4.9, avaliacoes: 3110, tempo: "35-50 min", frete: 0, cupom: "Frete grátis", selo: "Loja Oficial", pixKey: "pix@sneakerbox.com", pixTipo: "E-mail", coord: { x: 80, y: 70 } },
  { id: "fit", nome: "FitPro Sports", emoji: "🏃", categoria: "esporte", rating: 4.6, avaliacoes: 890, tempo: "30-45 min", frete: 6.9, cupom: null, selo: null, pixKey: "67 98888-2020", pixTipo: "Telefone", coord: { x: 30, y: 50 } },
  { id: "acess", nome: "Charme Acessórios", emoji: "👜", categoria: "acessorios", rating: 4.8, avaliacoes: 1520, tempo: "20-35 min", frete: 5.9, cupom: "Leve 3 pague 2", selo: "Top Vendas", pixKey: "charme.acessorios@pix.com", pixTipo: "E-mail", coord: { x: 68, y: 48 } },
];

// Ponto de entrega padrão do cliente no mapa (0..100)
export const HOME_COORD = { x: 50, y: 88 };

// Entregadores base — usados quando nenhum motoentregador cadastrado está online
export const seedRiders = [
  { id: "r-carlos", nome: "Carlos Souza", veiculo: "Honda CG 160", placa: "OAB-2B34", rating: 4.9, emoji: "🛵", base: true },
  { id: "r-jean", nome: "Jean Oliveira", veiculo: "Yamaha Factor", placa: "NNP-7C88", rating: 4.8, emoji: "🏍️", base: true },
  { id: "r-marcos", nome: "Marcos Lima", veiculo: "Honda Biz", placa: "QAX-1F09", rating: 4.7, emoji: "🛵", base: true },
];

// Helpers para gerar variações
const TAMANHOS_ROUPA = ["PP", "P", "M", "G", "GG"];
const TAMANHOS_CALCADO = ["37", "38", "39", "40", "41", "42", "43"];
const CORES = [
  { nome: "Preto", hex: "#111111" },
  { nome: "Branco", hex: "#f4f4f4" },
  { nome: "Bege", hex: "#d8c3a5" },
  { nome: "Azul", hex: "#2f5aa8" },
  { nome: "Vermelho", hex: "#c0392b" },
  { nome: "Verde", hex: "#2e7d5b" },
  { nome: "Rosa", hex: "#e58fb0" },
];

function make(id, storeId, nome, emoji, categoria, preco, precoAntigo, extra = {}) {
  return {
    id,
    storeId,
    nome,
    emoji,
    categoria,
    preco,
    precoAntigo,
    rating: extra.rating ?? 4.5 + (Math.round(Math.random() * 4) / 10) * 0 + 0.3,
    vendidos: extra.vendidos ?? 100,
    tamanhos: extra.tamanhos ?? TAMANHOS_ROUPA,
    cores: extra.cores ?? CORES.slice(0, 4),
    descricao:
      extra.descricao ??
      `${nome}. Tecido de alta qualidade, caimento perfeito e acabamento premium. Produto com garantia da loja e troca facilitada em até 7 dias.`,
    imagem: tile(id, emoji, { label: nome }),
    parcelas: extra.parcelas ?? 3,
  };
}

export const products = [
  // Urban Style (masculino)
  make("p1", "urban", "Jaqueta Corta-Vento Urban", "🧥", "masculino", 199.9, 289.9, { vendidos: 1200, rating: 4.8 }),
  make("p2", "urban", "Camiseta Oversized Preta", "👕", "masculino", 79.9, 119.9, { vendidos: 3400, rating: 4.9 }),
  make("p3", "urban", "Calça Cargo Bege", "👖", "masculino", 149.9, 199.9, { vendidos: 890, rating: 4.7, cores: CORES.slice(1, 5) }),
  make("p4", "urban", "Moletom Canguru Cinza", "🧥", "masculino", 169.9, 229.9, { vendidos: 2100, rating: 4.8 }),

  // Bella Moda (feminino)
  make("p5", "bella", "Vestido Floral Midi", "👗", "feminino", 159.9, 219.9, { vendidos: 5200, rating: 4.9 }),
  make("p6", "bella", "Blusa Cropped Canelada", "👚", "feminino", 59.9, 89.9, { vendidos: 4100, rating: 4.8 }),
  make("p7", "bella", "Saia Plissada Midi", "👗", "feminino", 119.9, 159.9, { vendidos: 980, rating: 4.7 }),
  make("p8", "bella", "Conjunto Alfaiataria", "👗", "feminino", 249.9, 349.9, { vendidos: 640, rating: 4.9 }),

  // Mundo Kids (infantil)
  make("p9", "kids", "Conjunto Infantil Dino", "🧸", "infantil", 69.9, 99.9, { vendidos: 1500, rating: 4.7, tamanhos: ["2", "4", "6", "8", "10"] }),
  make("p10", "kids", "Vestido Infantil Unicórnio", "👗", "infantil", 79.9, 109.9, { vendidos: 1200, rating: 4.8, tamanhos: ["2", "4", "6", "8"] }),
  make("p11", "kids", "Tênis Infantil LED", "👟", "infantil", 129.9, 169.9, { vendidos: 2200, rating: 4.9, tamanhos: ["24", "26", "28", "30", "32"] }),

  // SneakerBox (calçados)
  make("p12", "sneaker", "Tênis Runner Branco", "👟", "calcados", 299.9, 399.9, { vendidos: 6800, rating: 4.9, tamanhos: TAMANHOS_CALCADO }),
  make("p13", "sneaker", "Tênis Chunky Retrô", "👟", "calcados", 349.9, 459.9, { vendidos: 3300, rating: 4.8, tamanhos: TAMANHOS_CALCADO }),
  make("p14", "sneaker", "Bota Coturno Preta", "🥾", "calcados", 279.9, 359.9, { vendidos: 1100, rating: 4.7, tamanhos: TAMANHOS_CALCADO }),
  make("p15", "sneaker", "Chinelo Slide Confort", "🩴", "calcados", 89.9, 129.9, { vendidos: 4500, rating: 4.8, tamanhos: TAMANHOS_CALCADO }),

  // FitPro Sports (esporte)
  make("p16", "fit", "Legging Fitness High", "🩱", "esporte", 99.9, 139.9, { vendidos: 5600, rating: 4.9 }),
  make("p17", "fit", "Top Fitness Sustentação", "🎽", "esporte", 69.9, 99.9, { vendidos: 4200, rating: 4.8 }),
  make("p18", "fit", "Camiseta Dry Fit", "🎽", "esporte", 59.9, 89.9, { vendidos: 3100, rating: 4.7 }),
  make("p19", "fit", "Shorts Corrida Masc.", "🩳", "esporte", 79.9, 109.9, { vendidos: 2400, rating: 4.6 }),

  // Charme Acessórios
  make("p20", "acess", "Bolsa Transversal Couro", "👜", "acessorios", 189.9, 259.9, { vendidos: 1800, rating: 4.9, tamanhos: ["Único"], cores: CORES.slice(0, 5) }),
  make("p21", "acess", "Óculos de Sol Retrô", "🕶️", "acessorios", 129.9, 179.9, { vendidos: 2600, rating: 4.8, tamanhos: ["Único"] }),
  make("p22", "acess", "Boné Aba Reta Snapback", "🧢", "acessorios", 69.9, 99.9, { vendidos: 3400, rating: 4.7, tamanhos: ["Único"] }),
  make("p23", "acess", "Relógio Minimalista", "⌚", "acessorios", 219.9, 299.9, { vendidos: 900, rating: 4.9, tamanhos: ["Único"] }),

  // Praia (compartilhado)
  make("p24", "bella", "Biquíni Cortininha", "👙", "praia", 89.9, 129.9, { vendidos: 3200, rating: 4.8, cores: CORES.slice(3) }),
];

export const banners = [
  { id: "b1", titulo: "Frete GRÁTIS", sub: "em milhares de produtos", emoji: "🚚", cor: "#ee4d2d" },
  { id: "b2", titulo: "Até 60% OFF", sub: "coleção nova chegando", emoji: "🔥", cor: "#8e44ad" },
  { id: "b3", titulo: "Entrega Expressa", sub: "receba em até 45 min", emoji: "⚡", cor: "#0a8f5b" },
];

// Lookups
export function getProduct(id) {
  return products.find((p) => p.id === id);
}
export function getStore(id) {
  return stores.find((s) => s.id === id);
}
export function productsByStore(id) {
  return products.filter((p) => p.storeId === id);
}
export function storeAvatar(store) {
  return avatarTile(store.id, store.emoji);
}

export function formatBRL(v) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
