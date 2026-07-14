# 🛍️ ModaExpress

Marketplace de **roupas com entrega expressa** — um web app que combina o modelo do **iFood** (várias lojas + rastreamento do pedido em tempo real) com o do **Shopee** (catálogo de produtos, carrinho, avaliações, cupons e categorias).

Feito em **Next.js 14 (App Router) + React**, mobile-first, 100% autocontido (sem backend): o catálogo é local e o estado do usuário (carrinho, favoritos, pedidos) é persistido no `localStorage`.

## ✨ Funcionalidades

- **Vitrine estilo Shopee**: categorias, banners promocionais, grade de produtos com desconto, avaliações e "vendidos".
- **Lojas estilo iFood**: cartões de loja com nota, tempo de entrega, frete e cupom.
- **Página de produto**: seleção de tamanho e cor, quantidade, descrição, favoritar.
- **Sacola (carrinho)**: ajuste de quantidade, cálculo de frete grátis acima de R$99.
- **Checkout**: endereço de entrega + forma de pagamento (Pix, cartão, dinheiro).
- **Rastreamento do pedido**: linha do tempo animada (Confirmado → Preparando → Saiu para entrega → Perto de você → Entregue) que avança sozinha.
- **Busca** com sugestões e filtro por categoria.
- **Perfil** com favoritos, pedidos e cupons.
- **PWA**: instalável, com manifest e ícone.

## 🚀 Rodando localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## 🏗️ Build de produção

```bash
npm run build
npm start
```

## 📦 Deploy

Pronto para publicar na **Vercel** (`vercel` / import do repositório). Também funciona em qualquer host que rode Node 18+.

## 🗂️ Estrutura

```
src/
  app/                # rotas (App Router)
    page.js           # home / vitrine
    produto/[id]/     # detalhe do produto
    loja/[id]/        # página da loja
    carrinho/         # sacola
    checkout/         # endereço + pagamento
    pedidos/          # lista de pedidos
    pedido/[id]/      # rastreamento
    buscar/           # busca
    perfil/           # perfil e favoritos
  components/         # Toast, BottomNav, ProductCard
  lib/
    data.js           # catálogo (lojas e produtos)
    store.js          # estado global (carrinho/pedidos) + localStorage
    image.js          # gerador de imagens SVG dos produtos
```

> Projeto de demonstração. Substitua o catálogo em `src/lib/data.js` e conecte um backend/pagamento real para produção.
