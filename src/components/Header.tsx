import React from "react";
import { ShoppingCart, Search } from "lucide-react";
import { Badge, Button, Input } from "./ui";

export default function Header({
  query,
  setQuery,
  cartCount,
  onCart,
  onHome,
  checkoutStep,
}: {
  query: string;
  setQuery: (v: string) => void;
  cartCount: number;
  onCart: () => void;
  onHome: () => void;
  checkoutStep: "browse" | "checkout" | "success";
}) {
  return (
    <div className="sticky top-0 z-40 border-b border-black/10 bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <button onClick={onHome} className="flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-black text-white">RZ</div>
          <div className="text-left">
            <div className="text-sm font-semibold leading-4">Revolución Shop</div>
            <div className="text-xs text-black/60 leading-4">Frontend demo</div>
          </div>
        </button>

        <div className="hidden flex-1 md:block">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar productos, marcas, tags…"
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex items-cen  ter gap-2">
          {checkoutStep !== "browse" ? (
            <Badge className="hidden sm:inline-flex">Checkout</Badge>
          ) : (
            <Badge className="hidden sm:inline-flex">Envío gratis +65k</Badge>
          )}

          <Button variant="outline" onClick={onCart} className="relative">
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Carrito</span>
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 grid h-6 min-w-6 place-items-center rounded-full bg-black px-2 text-xs font-semibold text-white">
                {cartCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 pb-3 md:hidden">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar productos…" className="pl-9" />
        </div>
      </div>
    </div>
  );
}
