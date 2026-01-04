import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, Trash2, X } from "lucide-react";
import { ARS } from "../lib/money";
import { Button } from "./ui";

export default function CartDrawer({
  open,
  onClose,
  cartLines,
  setQty,
  removeFromCart,
  clearCart,
  onCheckout,
}: {
  open: boolean;
  onClose: () => void;
  cartLines: { items: any[]; subtotal: number; shipping: number; total: number };
  setQty: (id: string, qty: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  onCheckout: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50" aria-modal role="dialog">
          <div className="absolute inset-0 bg-black/30" onClick={onClose} />

          <motion.div
            initial={{ x: 24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 24, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-black/10 p-4">
              <div>
                <div className="text-base font-semibold">Tu carrito</div>
                <div className="text-xs text-black/60">
                  {cartLines.items.length} ítem(s) • Subtotal {ARS.format(cartLines.subtotal)}
                </div>
              </div>
              <Button variant="ghost" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="h-[calc(100%-220px)] overflow-auto p-4">
              {cartLines.items.length === 0 ? (
                <div className="rounded-3xl border border-black/10 p-6 text-center">
                  <div className="text-sm font-semibold">Carrito vacío</div>
                  <div className="mt-1 text-sm text-black/60">Agregá productos para empezar.</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {cartLines.items.map(({ product, qty, lineTotal }) => {
                    const id = String(product.id);
                    const name = product.name || product.title || "Producto";
                    return (
                      <div key={id} className="flex gap-3 rounded-3xl border border-black/10 p-3">
                        <img
                          src={
                            product.img ||
                            product.image ||
                            product.image_url ||
                            "https://images.unsplash.com/photo-1520975958221-4f548d9ac0e9?auto=format&fit=crop&w=1200&q=80"
                          }
                          alt={name}
                          className="h-16 w-16 rounded-2xl object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold">{name}</div>
                              <div className="text-xs text-black/60">{product.brand || ""}</div>
                            </div>
                            <button className="rounded-xl p-2 hover:bg-black/5" onClick={() => removeFromCart(id)} aria-label="Eliminar">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="mt-2 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 rounded-2xl border border-black/10 p-1">
                              <button className="grid h-8 w-8 place-items-center rounded-xl hover:bg-black/5" onClick={() => setQty(id, qty - 1)}>
                                <Minus className="h-4 w-4" />
                              </button>
                              <div className="w-6 text-center text-sm font-semibold">{qty}</div>
                              <button className="grid h-8 w-8 place-items-center rounded-xl hover:bg-black/5" onClick={() => setQty(id, qty + 1)}>
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="text-sm font-semibold">{ARS.format(lineTotal)}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="border-t border-black/10 p-4">
              <div className="space-y-2 text-sm">
                <Row label="Subtotal" value={ARS.format(cartLines.subtotal)} />
                <Row label="Envío" value={cartLines.shipping === 0 ? "Gratis" : ARS.format(cartLines.shipping)} />
                <div className="h-px w-full bg-black/10" />
                <Row label={<span className="font-semibold">Total</span>} value={ARS.format(cartLines.total)} />
              </div>

              <div className="mt-4 flex gap-2">
                <Button variant="outline" className="flex-1" onClick={clearCart} disabled={cartLines.items.length === 0}>
                  Vaciar
                </Button>
                <Button className="flex-1" onClick={onCheckout} disabled={cartLines.items.length === 0}>
                  Checkout
                </Button>
              </div>

              <div className="mt-3 text-xs text-black/60">Demo: precios en ARS, envío gratis a partir de {ARS.format(65000)}.</div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-black/70">{label}</div>
      <div>{value}</div>
    </div>
  );
}
