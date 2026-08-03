export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface CartItem {
  productId: number;
  quantity: number;
}

export interface Product {
  id: number;
  name: string;
  category: string;
  sku: string;
  price: number;
  salePrice: number;
  image: string;
  images: string[];
  video?: string;
  description: string;
  featured: boolean;
  inStock: boolean;
}

export interface Category {
  id: number;
  name: string;
  tagline: string;
  images: string[];
  video: string;
}

export interface Testimonial {
  id: number;
  name: string;
  city: string;
  text: string;
}

export interface Faq {
  id: number;
  question: string;
  answer: string;
}
