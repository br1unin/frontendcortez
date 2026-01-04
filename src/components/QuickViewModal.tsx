import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ShoppingCart } from "lucide-react";
import { ARS } from "../lib/money";
import { Badge, Button } from "./ui";

export default function QuickViewModal({
  product,
  onClose,
  onAdd,
}: {
  product: any | null;
  onClose: () => void;
  onAdd: () => void;
}) {
  return (
    <AnimatePresence>
      {product && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/35" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="absolute left-1/2 top-1/2 w-[92vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-black/10 p-4">
              <div>
                <div className="text-base font-semibold">{product.name || product.title || "Producto"}</div>
                <div className="text-xs text-black/60">{product.brand || ""} • {product.category || ""}</div>
              </div>
              <Button variant="ghost" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="grid gap-4 p-4 md:grid-cols-2">
              <img
                src={
                  product.img ||
                  product.image ||
                  product.image_url ||
                  "https://images.unsplash.com/photo-1520975958221-4f548d9ac0e9?auto=format&fit=crop&w=1200&q=80"
                }
                alt={product.name || product.title || "Producto"}
                className="h-64 w-full rounded-3xl object-cover"
              />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-semibold">{ARS.format(Number(product.price || 0))}</div>
                  <Badge className="rounded-full">Stock: {product.stock ?? "-"}</Badge>
                </div>

                <p className="text-sm text-black/70">{product.description || "Sin descripción."}</p>

                <div className="flex flex-wrap gap-2">
                  {(product.tags || []).map((t: string) => (
                    <Badge key={t} className="rounded-full">{t}</Badge>
                  ))}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button className="flex-1" onClick={onAdd}>
                    <ShoppingCart className="h-4 w-4" />
                    Agregar al carrito
                  </Button>
                  <Button variant="outline" onClick={onClose}>
                    Cerrar
                  </Button>
                </div>

                <div className="text-xs text-black/60">Tip: acá podés agregar variantes (talle/color) si tu backend lo soporta.</div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
