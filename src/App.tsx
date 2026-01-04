import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SlidersHorizontal } from "lucide-react";

import Header from "./components/Header";
import Filters from "./components/Filters";
import ProductGrid from "./components/ProductGrid";
import CartDrawer from "./components/CartDrawer";
import QuickViewModal from "./components/QuickViewModal";
import Checkout from "./components/Checkout";
import Success from "./components/Success";
import FooterNote from "./components/FooterNote";

import { ARS } from "./lib/money";
import { clamp } from "./lib/utils";
import { DEMO_PRODUCTS, buildCategoriesFromProducts } from "./data/demo";

import { endpoints } from "./api/endpoints";
import { getApiBase, apiFetch } from "./api/client";
import { listResource, createResource } from "./api/crud";
import { createOrderDetailsRateLimited } from "./api/orderDetailsRateLimit";

type Step = "browse" | "checkout" | "success";

export default function App() {
  const API_BASE = getApiBase();

  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>(["Todos"]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [apiError, setApiError] = useState("");

  const [category, setCategory] = useState("Todos");
  const [sort, setSort] = useState("relevancia");
  const [maxPrice, setMaxPrice] = useState(80000);
  const [showFilters, setShowFilters] = useState(false);

  const [cartOpen, setCartOpen] = useState(false);
  const [quickView, setQuickView] = useState<any | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<Step>("browse");
  const [cart, setCart] = useState<Record<string, number>>({});

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      setApiError("");
      setLoadingProducts(true);
      try {
        if (API_BASE) {
          await apiFetch(endpoints.health).catch(() => null);
        }

        const prods = API_BASE
          ? await listResource<any>(endpoints.products, { skip: 0, limit: 500 })
          : DEMO_PRODUCTS;

        let cats: any = null;
        if (API_BASE) {
          try {
            cats = await listResource<any>(endpoints.categories, { skip: 0, limit: 500 });
          } catch {
            cats = null;
          }
        }

        if (cancelled) return;

        const normalizedProds = Array.isArray(prods) ? prods : (prods?.items || []);
        const finalProds = normalizedProds.length ? normalizedProds : DEMO_PRODUCTS;
        setProducts(finalProds);

        const normalizedCats = Array.isArray(cats) ? cats : (cats?.items || null);
        if (normalizedCats && normalizedCats.length) {
          const names = normalizedCats
            .map((c: any) => (typeof c === "string" ? c : c?.name || c?.title || c?.category))
            .filter(Boolean);
          setCategories(["Todos", ...Array.from(new Set(names))]);
        } else {
          setCategories(buildCategoriesFromProducts(finalProds));
        }

        // Ajuste inicial de maxPrice al máximo real
        const max = Math.max(...finalProds.map((p: any) => Number(p.price || 0)));
        if (Number.isFinite(max) && max > 0) setMaxPrice(max);
      } catch (e: any) {
        if (cancelled) return;
        setApiError(e?.message || "Error cargando datos");
        setProducts(DEMO_PRODUCTS);
        setCategories(buildCategoriesFromProducts(DEMO_PRODUCTS));
      } finally {
        if (!cancelled) setLoadingProducts(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [API_BASE]);

  const cartCount = useMemo(() => Object.values(cart).reduce((a, b) => a + b, 0), [cart]);

  const priceBounds = useMemo(() => {
    const source = products.length ? products : DEMO_PRODUCTS;
    const max = Math.max(...source.map((p: any) => Number(p.price || 0)));
    const min = Math.min(...source.map((p: any) => Number(p.price || 0)));
    return { min: Number.isFinite(min) ? min : 0, max: Number.isFinite(max) ? max : 0 };
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = (products.length ? products : DEMO_PRODUCTS).filter((p: any) => {
      const pCategory = p.category || p.category_name || p.categoryId || p.category_id;
      const inCategory = category === "Todos" ? true : pCategory === category;

      const price = Number(p.price || 0);
      const inPrice = price <= maxPrice;

      const haystack = [p.name, p.title, p.brand, pCategory, ...(p.tags || [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const inQuery = !q || haystack.includes(q);
      return inCategory && inPrice && inQuery;
    });

    if (sort === "precio_asc") list = list.slice().sort((a: any, b: any) => Number(a.price || 0) - Number(b.price || 0));
    if (sort === "precio_desc") list = list.slice().sort((a: any, b: any) => Number(b.price || 0) - Number(a.price || 0));
    if (sort === "rating") list = list.slice().sort((a: any, b: any) => Number(b.rating || 0) - Number(a.rating || 0));

    return list;
  }, [products, query, category, sort, maxPrice]);

  const cartLines = useMemo(() => {
    const source = products.length ? products : DEMO_PRODUCTS;
    const items = Object.entries(cart)
      .map(([id, qty]) => {
        const product = source.find((p: any) => String(p.id) === String(id));
        if (!product) return null;
        const price = Number(product.price || 0);
        return { product, qty, lineTotal: price * qty };
      })
      .filter(Boolean) as any[];

    const subtotal = items.reduce((sum, it) => sum + it.lineTotal, 0);
    const shipping = subtotal > 65000 ? 0 : subtotal === 0 ? 0 : 4990;
    const total = subtotal + shipping;
    return { items, subtotal, shipping, total };
  }, [cart, products]);

  function addToCart(productId: string, qty = 1) {
    setCart((prev) => ({ ...prev, [productId]: clamp((prev[productId] || 0) + qty, 1, 99) }));
  }
  function removeFromCart(productId: string) {
    setCart((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  }
  function setQty(productId: string, qty: number) {
    setCart((prev) => ({ ...prev, [productId]: clamp(qty, 1, 99) }));
  }
  function clearCart() {
    setCart({});
  }

  function startCheckout() {
    if (cartLines.subtotal <= 0) return;
    setCheckoutStep("checkout");
    setCartOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function placeOrder(checkoutData: { name?: string; email: string; address?: string; paymentMethod?: string }) {
    if (!API_BASE) {
      setCheckoutStep("success");
      clearCart();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    try {
      setApiError("");

      // 1) Crear cliente (si tu API requiere otros campos, ajustás acá)
      const clientPayload = { name: checkoutData?.name, email: checkoutData?.email };
      const createdClient: any = await createResource(endpoints.clients, clientPayload).catch(() => null);
      const clientId = createdClient?.id || createdClient?.client_id || createdClient?.uuid;

      // 2) Crear orden
      const orderPayload = {
        client_id: clientId,
        total: cartLines.total,
        address: checkoutData?.address,
        payment_method: checkoutData?.paymentMethod,
        status: "created",
      };
      const createdOrder: any = await createResource(endpoints.orders, orderPayload);
      const orderId = createdOrder?.id || createdOrder?.order_id || createdOrder?.uuid;

      // 3) Crear order_details (rate limited)
      const detailLines = cartLines.items.map(({ product, qty }) => ({
        order_id: orderId,
        product_id: product.id,
        quantity: qty,
        unit_price: Number(product.price || 0),
      }));

      await createOrderDetailsRateLimited(detailLines);

      setCheckoutStep("success");
      clearCart();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: any) {
      setApiError(e?.message || "Error creando la orden");
      setCheckoutStep("checkout");
    }
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-black">
      <Header
        query={query}
        setQuery={setQuery}
        cartCount={cartCount}
        onCart={() => setCartOpen(true)}
        onHome={() => setCheckoutStep("browse")}
        checkoutStep={checkoutStep}
      />

      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6">
        <AnimatePresence mode="wait">
          {checkoutStep === "browse" && (
            <motion.div key="browse" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              <div className="grid gap-4 md:grid-cols-[280px_1fr]">
                <div className="hidden md:block">
                  <Filters
                    categories={categories}
                    category={category}
                    setCategory={setCategory}
                    sort={sort}
                    setSort={setSort}
                    maxPrice={maxPrice}
                    setMaxPrice={setMaxPrice}
                    priceBounds={priceBounds}
                    onReset={() => {
                      setCategory("Todos");
                      setSort("relevancia");
                      setMaxPrice(priceBounds.max);
                      setQuery("");
                    }}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3 md:hidden">
                    <button
                      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-4 text-sm hover:bg-black/5"
                      onClick={() => setShowFilters(true)}
                    >
                      <SlidersHorizontal className="h-4 w-4" /> Filtros
                    </button>
                    <button
                      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-4 text-sm hover:bg-black/5"
                      onClick={() => setCartOpen(true)}
                    >
                      Carrito
                    </button>
                  </div>

                  {(loadingProducts || apiError) && (
                    <div className="rounded-3xl border border-black/10 bg-white p-4 text-sm">
                      {loadingProducts ? (
                        <div className="text-black/70">Cargando productos desde la API…</div>
                      ) : (
                        <div className="text-black/70">
                          <span className="font-semibold">API:</span> {apiError}
                        </div>
                      )}
                      {!API_BASE && (
                        <div className="mt-1 text-xs text-black/60">
                          Tip: configurá <code className="rounded bg-black/5 px-1">VITE_API_URL</code> para consumir tu backend.
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm text-black/60">
                      Mostrando <span className="font-semibold text-black">{filtered.length}</span> de{" "}
                      <span className="font-semibold text-black">{products.length ? products.length : DEMO_PRODUCTS.length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-black/5 px-2.5 py-1 text-xs font-medium">{category}</span>
                      <span className="inline-flex items-center rounded-full bg-black/5 px-2.5 py-1 text-xs font-medium">≤ {ARS.format(maxPrice)}</span>
                    </div>
                  </div>

                  <ProductGrid
                    products={filtered}
                    onAdd={(id) => {
                      addToCart(id, 1);
                      setCartOpen(true);
                    }}
                    onQuickView={(p) => setQuickView(p)}
                  />

                  <FooterNote />
                </div>
              </div>

              {/* Mobile filters sheet simple */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/30" onClick={() => setShowFilters(false)} />
                    <motion.div
                      initial={{ y: 18, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 18, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 260, damping: 26 }}
                      className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-white p-4 shadow-2xl"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-base font-semibold">Filtros</div>
                          <div className="text-xs text-black/60">Ajustá y listo</div>
                        </div>
                        <button className="rounded-xl p-2 hover:bg-black/5" onClick={() => setShowFilters(false)}>
                          ✕
                        </button>
                      </div>

                      <div className="mt-4">
                        <Filters
                          categories={categories}
                          category={category}
                          setCategory={setCategory}
                          sort={sort}
                          setSort={setSort}
                          maxPrice={maxPrice}
                          setMaxPrice={setMaxPrice}
                          priceBounds={priceBounds}
                          onReset={() => {
                            setCategory("Todos");
                            setSort("relevancia");
                            setMaxPrice(priceBounds.max);
                            setQuery("");
                          }}
                        />
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              <QuickViewModal
                product={quickView}
                onClose={() => setQuickView(null)}
                onAdd={() => {
                  if (!quickView) return;
                  addToCart(String(quickView.id), 1);
                  setCartOpen(true);
                }}
              />
            </motion.div>
          )}

          {checkoutStep === "checkout" && (
            <motion.div key="checkout" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              <Checkout cartLines={cartLines} onBack={() => setCheckoutStep("browse")} onPlaceOrder={placeOrder} />
            </motion.div>
          )}

          {checkoutStep === "success" && (
            <motion.div key="success" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              <Success onContinue={() => setCheckoutStep("browse")} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cartLines={cartLines}
        setQty={setQty}
        removeFromCart={removeFromCart}
        clearCart={clearCart}
        onCheckout={startCheckout}
      />
    </div>
  );
}
