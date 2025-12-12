import { Product } from "@/types";

export const initialProducts: Product[] = [
  {
    id: "1",
    name: "Camiseta Básica Premium",
    description:
      "Camiseta de algodão premium com corte moderno. Perfeita para o dia a dia, combina com qualquer ocasião. Tecido macio e confortável que não deforma após lavagens.",
    price: 89.9,
    originalPrice: 129.9,
    imageUrl:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500",
    images: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500",
      "https://images.unsplash.com/photo-1622445275576-721325763afe?w=500",
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=500",
    ],
    sizes: ["P", "M", "G", "GG"],
    colors: [
      { name: "Branco", hex: "#FFFFFF" },
      { name: "Preto", hex: "#000000" },
      { name: "Cinza", hex: "#6B7280" },
    ],
    category: "Camisetas",
    stock: 50,
    featured: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Calça Jeans Slim Fit",
    description:
      "Calça jeans de alta qualidade com elastano para maior conforto. Modelagem slim fit que valoriza a silhueta. Lavagem moderna e durável.",
    price: 199.9,
    originalPrice: 259.9,
    imageUrl: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500",
    images: [
      "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500",
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500",
    ],
    sizes: ["38", "40", "42", "44", "46"],
    colors: [
      { name: "Azul Escuro", hex: "#1E3A5F" },
      { name: "Azul Claro", hex: "#5B8DB8" },
    ],
    category: "Calças",
    stock: 30,
    featured: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Vestido Midi Elegante",
    description:
      "Vestido midi sofisticado perfeito para ocasiões especiais. Tecido fluido com caimento impecável. Detalhe de amarração na cintura.",
    price: 249.9,
    imageUrl:
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500",
    images: [
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500",
      "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500",
    ],
    sizes: ["PP", "P", "M", "G"],
    colors: [
      { name: "Preto", hex: "#000000" },
      { name: "Bege", hex: "#D4B896" },
    ],
    category: "Vestidos",
    stock: 20,
    featured: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "4",
    name: "Blazer Estruturado",
    description:
      "Blazer estruturado com acabamento premium. Ideal para looks formais e casuais. Forro interno em tecido respirável.",
    price: 359.9,
    originalPrice: 449.9,
    imageUrl:
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=500",
    images: [
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=500",
      "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=500",
    ],
    sizes: ["P", "M", "G", "GG"],
    colors: [
      { name: "Preto", hex: "#000000" },
      { name: "Marinho", hex: "#1B2838" },
    ],
    category: "Blazers",
    stock: 15,
    featured: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "5",
    name: "Saia Plissada Midi",
    description:
      "Saia plissada midi com cintura alta elástica. Movimento fluido e elegante. Perfeita para compor looks femininos.",
    price: 159.9,
    imageUrl:
      "https://images.unsplash.com/photo-1583496661160-fb5886a0uj9?w=500",
    images: [
      "https://images.unsplash.com/photo-1583496661160-fb5886a0uj9?w=500",
    ],
    sizes: ["PP", "P", "M", "G"],
    colors: [
      { name: "Nude", hex: "#E8D4C4" },
      { name: "Preto", hex: "#000000" },
    ],
    category: "Saias",
    stock: 25,
    featured: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "6",
    name: "Moletom Oversized",
    description:
      "Moletom oversized super confortável em algodão flanelado. Capuz com ajuste por cordão. Bolso canguru frontal.",
    price: 179.9,
    originalPrice: 219.9,
    imageUrl: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500",
    images: [
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500",
      "https://images.unsplash.com/photo-1578768079052-aa76e52ff62e?w=500",
    ],
    sizes: ["P", "M", "G", "GG", "XG"],
    colors: [
      { name: "Cinza", hex: "#9CA3AF" },
      { name: "Preto", hex: "#000000" },
      { name: "Bege", hex: "#D4B896" },
    ],
    category: "Moletons",
    stock: 40,
    featured: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "7",
    name: "Camisa Social Slim",
    description:
      "Camisa social slim fit em algodão egípcio. Colarinho italiano estruturado. Punhos com botão duplo.",
    price: 189.9,
    imageUrl:
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500",
    images: [
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500",
      "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=500",
    ],
    sizes: ["P", "M", "G", "GG"],
    colors: [
      { name: "Branco", hex: "#FFFFFF" },
      { name: "Azul Claro", hex: "#ADD8E6" },
    ],
    category: "Camisas",
    stock: 35,
    featured: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "8",
    name: "Shorts Alfaiataria",
    description:
      "Shorts de alfaiataria com corte reto e cintura alta. Tecido estruturado que não amassa. Bolsos laterais funcionais.",
    price: 139.9,
    imageUrl:
      "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=500",
    images: [
      "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=500",
    ],
    sizes: ["PP", "P", "M", "G"],
    colors: [
      { name: "Bege", hex: "#D4B896" },
      { name: "Preto", hex: "#000000" },
    ],
    category: "Shorts",
    stock: 28,
    featured: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
