export type Product = {
  id: string;
  name?: string;
  title?: string;
  brand?: string;
  category?: string;
  price: number;
  rating?: number;
  stock?: number;
  tags?: string[];
  img?: string;
  description?: string;
};

export const DEMO_PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "Aurora Hoodie",
    brand: "Revolución",
    category: "Ropa",
    price: 34990,
    rating: 4.7,
    stock: 18,
    tags: ["nuevo", "premium"],
    img: "https://images.unsplash.com/photo-1520975958221-4f548d9ac0e9?auto=format&fit=crop&w=1200&q=80",
    description: "Hoodie pesado con interior suave. Corte relax, capucha amplia y costuras reforzadas.",
  },
  {
    id: "p2",
    name: "Classic Tee",
    brand: "Revolución",
    category: "Ropa",
    price: 15990,
    rating: 4.5,
    stock: 42,
    tags: ["básico"],
    img: "https://images.unsplash.com/photo-1520975693414-0f835d6e5f10?auto=format&fit=crop&w=1200&q=80",
    description: "Remera de algodón peinado, suave y resistente. Ideal para usar todos los días.",
  },
  {
    id: "p3",
    name: "Minimal Sneakers",
    brand: "RZ",
    category: "Calzado",
    price: 58990,
    rating: 4.6,
    stock: 10,
    tags: ["top"],
    img: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=1200&q=80",
    description: "Zapatillas minimalistas, plantilla cómoda y suela durable. Diseño limpio.",
  },
  {
    id: "p4",
    name: "Everyday Backpack",
    brand: "RZ Gear",
    category: "Accesorios",
    price: 44990,
    rating: 4.8,
    stock: 7,
    tags: ["premium"],
    img: "https://images.unsplash.com/photo-1518623380242-d992d3c57b35?auto=format&fit=crop&w=1200&q=80",
    description: "Mochila urbana con compartimento acolchado para laptop y bolsillos internos.",
  }
];

export function buildCategoriesFromProducts(products: Product[]) {
  return ["Todos", ...Array.from(new Set(products.map((p) => p.category).filter(Boolean) as string[]))];
}
