# Implementação do Uploadthing para Upload de Imagens

## O que é Uploadthing?

Uploadthing é um serviço de upload de arquivos otimizado para Next.js. Permite que usuários façam upload de imagens diretamente pelo navegador, sem precisar hospedar em sites externos.

**Free Tier:** 2GB de storage (~5.000 fotos otimizadas ou ~1.000 produtos)

---

## Passo a Passo para Implementação

### 1. Criar Conta no Uploadthing

1. Acesse [uploadthing.com](https://uploadthing.com)
2. Crie uma conta (pode usar GitHub)
3. Crie um novo app
4. Copie as chaves `UPLOADTHING_SECRET` e `UPLOADTHING_APP_ID`

### 2. Adicionar Variáveis de Ambiente

No arquivo `.env.local`:

```env
UPLOADTHING_SECRET=sk_live_xxxxx
UPLOADTHING_APP_ID=xxxxx
```

### 3. Instalar Dependências

```bash
npm install uploadthing @uploadthing/react
```

### 4. Criar o Core do Uploadthing

Criar arquivo `src/app/api/uploadthing/core.ts`:

```typescript
import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  productImage: f({ image: { maxFileSize: "4MB", maxFileCount: 10 } })
    .middleware(async () => {
      // Aqui pode adicionar autenticação se necessário
      // Por exemplo, verificar se é admin
      return {};
    })
    .onUploadComplete(async ({ file }) => {
      console.log("Upload completo:", file.url);
      return { url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
```

### 5. Criar Rota da API

Criar arquivo `src/app/api/uploadthing/route.ts`:

```typescript
import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});
```

### 6. Criar Componente de Upload

Criar arquivo `src/components/ImageUpload.tsx`:

```typescript
"use client";

import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

interface ImageUploadProps {
  onUploadComplete: (url: string) => void;
}

export function ImageUpload({ onUploadComplete }: ImageUploadProps) {
  return (
    <UploadButton<OurFileRouter, "productImage">
      endpoint="productImage"
      onClientUploadComplete={(res) => {
        if (res && res[0]) {
          onUploadComplete(res[0].url);
        }
      }}
      onUploadError={(error: Error) => {
        alert(`Erro no upload: ${error.message}`);
      }}
      appearance={{
        button: {
          background: "var(--primary)",
          color: "white",
          padding: "8px 16px",
          borderRadius: "8px",
        },
      }}
      content={{
        button: "Enviar Imagem",
        allowedContent: "Imagens até 4MB",
      }}
    />
  );
}
```

### 7. Usar no Painel Admin

No arquivo `src/app/admin/page.tsx`, substituir o input de URL pelo componente de upload:

**Antes (atual):**
```tsx
<input
  type="text"
  value={newImageUrl}
  onChange={(e) => setNewImageUrl(e.target.value)}
  placeholder="Cole a URL da imagem"
  className="flex-1 px-4 py-2 rounded-lg border"
/>
<button onClick={handleAddImage}>Adicionar</button>
```

**Depois (com Uploadthing):**
```tsx
import { ImageUpload } from "@/components/ImageUpload";

// No JSX:
<ImageUpload
  onUploadComplete={(url) => {
    setEditForm({
      ...editForm,
      images: [...editForm.images, url],
    });
  }}
/>
```

### 8. (Opcional) Estilizar com Tailwind

Adicionar no `tailwind.config.ts`:

```typescript
import { withUt } from "uploadthing/tw";

export default withUt({
  // ...sua config atual
});
```

---

## Estrutura Final de Arquivos

```
src/
├── app/
│   ├── api/
│   │   └── uploadthing/
│   │       ├── core.ts      # Configuração do FileRouter
│   │       └── route.ts     # Rota da API
│   └── admin/
│       └── page.tsx         # Usar o componente ImageUpload
└── components/
    └── ImageUpload.tsx      # Componente de upload
```

---

## Funcionalidades Extras (Opcionais)

### Deletar Imagens

```typescript
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

// Para deletar uma imagem
await utapi.deleteFiles("file-key-aqui");
```

### Múltiplas Imagens de Uma Vez

O componente já suporta até 10 imagens por upload (configurado no `maxFileCount`).

### Preview Antes do Upload

```tsx
import { UploadDropzone } from "@uploadthing/react";

<UploadDropzone
  endpoint="productImage"
  onClientUploadComplete={(res) => {
    // ...
  }}
/>
```

---

## Links Úteis

- [Documentação Oficial](https://docs.uploadthing.com)
- [Exemplos Next.js](https://docs.uploadthing.com/getting-started/appdir)
- [Dashboard](https://uploadthing.com/dashboard)

---

## Custos (se ultrapassar free tier)

| Plano | Storage | Preço |
|-------|---------|-------|
| Free | 2 GB | Grátis |
| Pro | 100 GB | $10/mês |
| Enterprise | Ilimitado | Sob consulta |

Para a maioria dos e-commerces pequenos/médios, o plano gratuito é suficiente.
