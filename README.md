# Loja de Roupas - Next.js

Projeto de e-commerce para loja de roupas desenvolvido com Next.js, TypeScript e Tailwind CSS. Integração com Mercado Pago para pagamentos.

## Funcionalidades

- **Página Principal**: Hero section, produtos em destaque, filtro por categorias
- **Cards com Efeito 3D**: Efeito de tilt smooth ao passar o mouse
- **Modal de Produto**: Abre na lateral com 70% da tela, animação suave
- **Carrinho de Compras**: Drawer lateral com gerenciamento de itens
- **Checkout**: Formulário completo de dados e integração com Mercado Pago
- **Painel Admin**: Login com senha, gerenciamento de produtos
- **Design Responsivo**: Funciona em desktop e mobile
- **Cores Neutras**: Fácil customização para a identidade visual da loja

## Tecnologias

- Next.js 16
- TypeScript
- Tailwind CSS
- Mercado Pago SDK
- LocalStorage para persistência

## Configuração

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Edite o arquivo `.env.local` com suas configurações:

```env
# Senha de administrador
ADMIN_PASSWORD=sua_senha_segura

# Mercado Pago - Credenciais de teste ou produção
MERCADOPAGO_ACCESS_TOKEN=seu_access_token

# URL base (altere em produção)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 3. Obter credenciais do Mercado Pago

1. Acesse [Mercado Pago Developers](https://www.mercadopago.com.br/developers)
2. Crie uma aplicação
3. Use as credenciais de **teste** para desenvolvimento
4. Copie o **Access Token** para o `.env.local`

### 4. Executar o projeto

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build
npm start
```

## Estrutura do Projeto

```
src/
├── app/
│   ├── admin/           # Painel administrativo
│   │   ├── login/       # Página de login
│   │   └── page.tsx     # Dashboard admin
│   ├── api/
│   │   ├── auth/        # API de autenticação
│   │   └── payment/     # API do Mercado Pago
│   ├── checkout/        # Páginas de checkout
│   │   ├── success/
│   │   ├── failure/
│   │   └── pending/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── CartDrawer.tsx   # Drawer do carrinho
│   ├── Footer.tsx
│   ├── Header.tsx
│   ├── ImageFrame.tsx   # Componente para exibir imagens via URL
│   ├── ProductCard.tsx  # Card com efeito 3D
│   └── ProductModal.tsx # Modal lateral
├── context/
│   └── StoreContext.tsx # Estado global da loja
├── data/
│   └── products.ts      # Produtos iniciais
└── types/
    └── index.ts         # Tipos TypeScript
```

## Painel Administrativo

Acesse `/admin/login` e use a senha configurada no `.env.local` (padrão: `admin123`).

No painel você pode:
- Visualizar todos os produtos
- Editar nome, descrição, preço, estoque
- Adicionar/remover imagens (via URL)
- Adicionar/remover tamanhos e cores
- Criar novos produtos
- Excluir produtos

## Customização de Cores

As cores estão definidas em `src/app/globals.css` como variáveis CSS:

```css
:root {
  --background: #fafafa;
  --foreground: #171717;
  --primary: #737373;
  --secondary: #e5e5e5;
  --accent: #a3a3a3;
  --card-bg: #ffffff;
  --border: #d4d4d4;
  --muted: #a3a3a3;
}
```

Altere esses valores para aplicar as cores da sua marca.

## Imagens

O componente `ImageFrame` aceita URLs de imagens diretas. Para adicionar imagens:

1. Faça upload para um serviço de hospedagem (Unsplash, Cloudinary, Imgur, etc.)
2. Copie a URL da imagem
3. Cole no painel admin ao editar um produto

## Deploy

O projeto está pronto para deploy na Vercel ou outras plataformas.

Lembre-se de configurar as variáveis de ambiente no painel de deploy:
- `ADMIN_PASSWORD`
- `MERCADOPAGO_ACCESS_TOKEN`
- `NEXT_PUBLIC_BASE_URL`

## Licença

MIT
