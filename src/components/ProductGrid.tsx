import { motion } from "framer-motion";
import { ShoppingCart, Star, StarHalf } from "lucide-react";
import { ARS } from "../lib/money";
import { stars } from "../lib/utils";
import { Badge, Button, Card, CardContent } from "./ui";

export default function ProductGrid({
  products,
  onAdd,
  onQuickView,
}: {
  products: any[];
  onAdd: (id: string) => void;
  onQuickView: (p: any) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((p, index) => {
        const id = String(p.id_key ?? p.id ?? index);
        const name = p.name || p.title || "Producto";
        const brand = p.brand || "";
        const price = Number(p.price || 0);
        const stock = p.stock ?? p.quantity ?? "-";
        const rating = Number(p.rating || 0);

        return (
          <motion.div key={id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
            <Card className="overflow-hidden border-black/5 shadow-sm">
              <div className="relative">
                <img
                  src={
                    p.img ||
                    p.image ||
                    p.image_url ||
                    "https://images.unsplash.com/photo-1520975958221-4f548d9ac0e9?auto=format&fit=crop&w=1200&q=80"
                  }
                  alt={name}
                  className="h-48 w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute left-3 top-3 flex gap-2">
                  {(p.tags || []).slice(0, 2).map((t: string) => (
                    <span key={t} className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs text-black/60">{brand}</div>
                    <div className="line-clamp-2 text-sm font-semibold leading-5">{name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{ARS.format(price)}</div>
                    <div className="text-xs text-black/60">Stock: {stock}</div>
                  </div>
                </div>

                <Rating rating={rating} />

                <div className="flex items-center gap-2">
                  <Button className="h-9 flex-1 text-xs" onClick={() => onAdd(id)}>
                    <ShoppingCart className="h-4 w-4" />
                    Agregar
                  </Button>
                  <Button variant="outline" className="h-9 text-xs" onClick={() => onQuickView(p)}>
                    Ver
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}

      {products.length === 0 && (
        <Card className="sm:col-span-2 lg:col-span-3">
          <CardContent className="py-10 text-center">
            <div className="text-base font-semibold">No encontramos productos</div>
            <div className="mt-1 text-sm text-black/60">Proba cambiando filtros o busqueda.</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Rating({ rating }: { rating: number }) {
  const { full, half } = stars(rating || 0);
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1 text-sm">
        {Array.from({ length: 5 }).map((_, i) => {
          const filled = i < full;
          const isHalf = i === full && half;
          if (filled) {
            return <Star key={i} className="h-4 w-4 text-amber-500 fill-amber-500" aria-hidden />;
          }
          if (isHalf) {
            return <StarHalf key={i} className="h-4 w-4 text-amber-500 fill-amber-500" aria-hidden />;
          }
          return <Star key={i} className="h-4 w-4 text-black/20" aria-hidden />;
        })}
        <span className="ml-1 text-xs text-black/60">{Number(rating || 0).toFixed(1)}</span>
      </div>
      <Badge className="rounded-full">Calidad verificada</Badge>
    </div>
  );
}
