export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  images: string[];
  sizes: string[];
  colors: ProductColor[];
  category: string;
  stock: number;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductColor {
  name: string;
  hex: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize: string;
  selectedColor: ProductColor;
}

export interface User {
  isAdmin: boolean;
  isAuthenticated: boolean;
}
