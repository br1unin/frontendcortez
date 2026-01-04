// src/pages/Shop.tsx
import React, { useEffect, useMemo, useState } from "react";

import Filters from "../components/Filters";
import ProductGrid from "../components/ProductGrid";
import CartDrawer from "../components/CartDrawer";
import QuickViewModal from "../components/QuickViewModal";
import Checkout from "../components/Checkout";
import Success from "../components/Success";
import FooterNote from "../components/FooterNote";

import { ARS } from "../lib/money";
import { clamp } from "../lib/utils";
import { DEMO_PRODUCTS, buildCategoriesFromProducts } from "../data/demo";

import { endpoints } from "../api/endpoints";
import { getApiBase, apiFetch } from "../api/client";
import { listResource, createResource } from "../api/crud";
import { createOrderDetailsRateLimited } from "../api/orderDetailsRateLimit";

type Step = "browse" | "checkout" | "success";

export default function Shop() {
  const API_BASE = getApiBase();

  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>(["Todos"]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [apiError, setApiError] = useState("");

  const [category, setCategory] = useState("Todos");
  const [sort, setSort] = useState("relevancia");
  const [maxPrice, setMaxPrice] = useState(100000);
  const [showFilters, setShowFilters] = useState(false);

  const [cartOpen, setCartOpen] = useState(false);
  const [quickView, setQuickView] = useState<any | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<Step>("browse");
  const [cart, setCart] = useState<Record<string, number>>({});

  // -------------------- Load products --------------------
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoadingProducts(true);
      setApiError("");

      try {
        // health check (no rompe si falla)
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

        const normalizedProducts = Array.isArray(prods) ? prods : prods?.items || [];
        const finalProducts = normalizedProducts.length > 0 ? normalizedProducts : DEMO_PRODUCTS;

        setProducts(finalProducts);

        // categorías: si no vienen del endpoint, se derivan de products
        if (cats && Array.isArray(cats)) {
          const names = cats
            .map((c) => (typeof c === "string" ? c : c?.name || c?.title))
            .filter(Boolean);
          setCategories(["Todos", ...Array.from(new Set(names))]);
        } else {
          setCategories(buildCategoriesFromProducts(finalProducts));
        }

        const max = Math.max(...finalProducts.map((p: any) => Number(p.price || 0)));
        if (Number.isFinite(max) && max > 0) setMaxPrice(max);
      } catch (e: any) {
        setApiError(e?.message || "Error cargando productos");
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

  // -------------------- Derived data --------------------
  const cartCount = useMemo(() => Object.values(cart).reduce((a, b) => a + b, 0), [cart]);

  const priceBounds = useMemo(() => {
    const source = products.length ? products : DEMO_PRODUCTS;
    const prices = source.map((p: any) => Number(p.price || 0)).filter((n) => Number.isFinite(n));
    const min = prices.length ? Math.min(...prices) : 0;
    const max = prices.length ? Math.max(...prices) : 0;
    return { min, max };
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    let list = (products.length ? products : DEMO_PRODUCTS).filter((p: any) => {
      const pCategory = p.category ?? p.category_name ?? p.category_id;
      const inCategory = category === "Todos" ? true : String(pCategory) === String(category);

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

  // -------------------- Cart actions --------------------
  function addToCart(productId: string, qty = 1) {
    setCart((prev) => ({
      ...prev,
      [productId]: clamp((prev[productId] || 0) + qty, 1, 99),
    }));
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

  async function placeOrder(data: { name?: string; email: string; address?: string; paymentMethod?: string }) {
    // sin API, demo
    if (!API_BASE) {
      setCheckoutStep("success");
      clearCart();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    try {
      setApiError("");

      // 1) Crear cliente (ajustá keys si tu schema lo requiere)
      const createdClient = await createResource<any>(endpoints.clients, {
        name: data?.name,
        email: data?.email,
      }).catch(() => null);

      const clientId = createdClient?.id ?? createdClient?.client_id ?? createdClient?.uuid ?? null;

      // 2) Crear orden
      const createdOrder = await createResource<any>(endpoints.orders, {
        client_id: clientId,
        total: cartLines.total,
        address: data?.address,
        payment_method: data?.paymentMethod,
        status: "created",
      });

      const orderId = createdOrder?.id ?? createdOrder?.order_id ?? createdOrder?.uuid;
      if (!orderId) throw new Error("La API no devolvió un ID de orden");

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

  // -------------------- Render --------------------
  return (
    <div className="space-y-4">
      <div className="bg-red-500 text-white p-2 text-center font-bold"></div>
      {checkoutStep === "browse" && (
        <div className="grid gap-4 md:grid-cols-[280px_1fr]">
          {/* Sidebar filtros (desktop) */}
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

          {/* Lista de productos */}
          <div className="space-y-4">
            {/* Mobile: botón filtros */}
            <div className="flex gap-2 md:hidden">
              <button
                className="flex h-10 w-full items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-4 text-sm hover:bg-black/5"
                onClick={() => setShowFilters(true)}
              >
                Filtros
              </button>
              <button
                className="flex h-10 w-full items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-4 text-sm hover:bg-black/5"
                onClick={() => setCartOpen(true)}
              >
                Carrito
              </button>
            </div>

            {/* Estado API */}
            {(loadingProducts || apiError) && (
              <div className="rounded-3xl border border-black/10 bg-white p-4 text-sm">
                {loadingProducts ? (
                  <div className="text-black/70">Cargando productos desde la API…</div>
                ) : (
                  <div className="text-black/70">
                    <span className="font-semibold">API:</span> {apiError}
                  </div>
                )}
              </div>
            )}

            {/* Contador */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm text-black/60">
                Mostrando <span className="font-semibold text-black">{filtered.length}</span> de{" "}
                <span className="font-semibold text-black">{products.length ? products.length : DEMO_PRODUCTS.length}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-black/60">
                <span className="rounded-full bg-black/5 px-2.5 py-1">{category}</span>
                <span className="rounded-full bg-black/5 px-2.5 py-1">≤ {ARS.format(maxPrice)}</span>
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
      )}

      {checkoutStep === "checkout" && (
        <Checkout cartLines={cartLines} onBack={() => setCheckoutStep("browse")} onPlaceOrder={placeOrder} />
      )}

      {checkoutStep === "success" && <Success onContinue={() => setCheckoutStep("browse")} />}

      {/* Drawer carrito */}
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cartLines={cartLines}
        setQty={setQty}
        removeFromCart={removeFromCart}
        clearCart={clearCart}
        onCheckout={startCheckout}
      />

      {/* Modal quick view */}
      <QuickViewModal
        product={quickView}
        onClose={() => setQuickView(null)}
        onAdd={() => {
          if (!quickView) return;
          addToCart(String(quickView.id), 1);
          setCartOpen(true);
        }}
      />

      {/* Mobile Filters modal (simple) */}
      {showFilters && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowFilters(false)} />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-auto rounded-t-3xl bg-white p-4 shadow-2xl">
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
          </div>
        </div>
      )}
    </div>
  );
}
