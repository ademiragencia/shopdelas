# 🛍️ Vistê — *Vestiu, chegou.*

Marketplace de **roupas com entrega expressa** — um web app que combina o modelo do **iFood** (várias lojas, motoentregador e rastreamento no mapa) com o do **Shopee** (catálogo, carrinho, avaliações, cupons e categorias).

Multi-perfil: **cliente**, **lojista** e **motoentregador**. Feito em **Next.js 14 (App Router) + React**, mobile-first, 100% no navegador (sem backend): contas, produtos das lojas, pedidos e entregas são persistidos no `localStorage`.

## ✨ Funcionalidades

### Cliente
- Vitrine com categorias, banners, lojas e grade de produtos (descontos, avaliações, "vendidos").
- Página de produto: tamanho, cor, quantidade, favoritar.
- Sacola, frete grátis acima de R$99 e busca com sugestões.
- **Pagamento**: **Pix online** (na chave Pix escolhida pela loja, com QR e "copiar chave") **ou na entrega** (cartão, dinheiro ou pix).
- **Rastreamento no mapa**: motoentregador se movendo em tempo real da loja até você, com card do entregador e linha do tempo.

### Lojista
- Cadastro como usuário e criação automática da loja.
- Painel com **cadastro/edição/exclusão de produtos**, pedidos recebidos e faturamento.
- Define a **chave Pix** que recebe os pagamentos online.

### Motoentregador
- Cadastro como usuário (veículo/placa) e chave liga/desliga de disponibilidade.
- **Atribuição automática**: ao acontecer uma venda, um entregador online é escolhido na hora.
- Painel de corridas com **mapa**, dados da entrega e avanço de status.

## 🚀 Rodando localmente

```bash
npm install
npm run dev   # http://localhost:3000
```

## 🏗️ Build de produção

```bash
npm run build && npm start
```

## 🧭 Como testar o fluxo completo

1. **Cadastre um entregador** (Perfil → "Quero entregar") e deixe-o **disponível**.
2. **Cadastre um lojista** (Perfil → "Quero vender") e **publique um produto**.
3. Saia e, como cliente, **compre** esse produto → escolha **Pix online** ou **na entrega**.
4. Veja o **mapa de rastreamento** avançar sozinho.
5. Entre de volta como **entregador** para ver a corrida atribuída.

## 🗂️ Estrutura

```
src/
  app/
    page.js              # vitrine (cliente)
    produto/[id]/        # detalhe do produto
    loja/[id]/           # página da loja
    carrinho/            # sacola
    checkout/            # endereço + pagamento (Pix online / na entrega)
    pedidos/  pedido/[id]/  # lista e rastreamento com mapa
    buscar/  perfil/     # busca e central de conta
    entrar/  cadastro/   # login e cadastro por perfil
    lojista/  lojista/produto/   # painel e cadastro de produtos
    entregador/          # painel de corridas do motoentregador
  components/            # Toast, BottomNav, ProductCard, MapTrack
  lib/
    data.js              # catálogo base (lojas com chave Pix + coordenadas, entregadores base)
    store.js             # estado global: contas, catálogo, pedidos, atribuição de entregador
    image.js             # imagens SVG dos produtos e QR Code do Pix
```

## ⚠️ Sobre o protótipo
É uma demonstração funcional **em um dispositivo** (os dados ficam no `localStorage` do navegador, sem sincronizar entre celulares) e o pagamento Pix/mapa são **simulados**. Para produção: adicionar backend com autenticação, banco de dados, gateway de pagamento Pix real e GPS do entregador.
