import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import Filters from "../components/Filters";
import ProductGrid from "../components/ProductGrid";
import CartDrawer from "../components/CartDrawer";
import QuickViewModal from "../components/QuickViewModal";
import Checkout from "../components/Checkout";
import Success from "../components/Success";
import { Button } from "../components/ui";

import { ARS } from "../lib/money";
import { clamp } from "../lib/utils";
import { DEMO_PRODUCTS, buildCategoriesFromProducts } from "../data/demo";

import { endpoints } from "../api/endpoints";
import { getApiBase, apiFetch } from "../api/client";
import { listResource, createResource } from "../api/crud";
import { createOrderDetailsRateLimited } from "../api/orderDetailsRateLimit";

type Step = "browse" | "checkout" | "success";

const MOCK_ORDERS_KEY = "mock_orders";

export default function Shop() {
  const API_BASE = getApiBase();
  const navigate = useNavigate();
  const { isAuthed } = useAuth();

  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>(["Todos"]);
  const [categoryItems, setCategoryItems] = useState<{ id_key: number; name: string }[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [apiError, setApiError] = useState("");

  const [category, setCategory] = useState("Todos");
  const [sort, setSort] = useState("relevancia");
  const [maxPrice, setMaxPrice] = useState(100000);
  const [showFilters, setShowFilters] = useState(false);

  const [cartOpen, setCartOpen] = useState(false);
  const [quickView, setQuickView] = useState<any | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<Step>("browse");
  const [lastOrderId, setLastOrderId] = useState<number | string | null>(null);
  const [cart, setCart] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoadingProducts(true);
      setApiError("");

      try {
        if (API_BASE) {
          await apiFetch(endpoints.health).catch(() => null);
        }

        let prods: any = DEMO_PRODUCTS;
        if (API_BASE) {
          try {
            prods = await listResource<any>(endpoints.products, { skip: 0, limit: 500 });
          } catch {
            prods = DEMO_PRODUCTS;
          }
        }

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
        let finalProducts = normalizedProducts.length > 0 ? normalizedProducts : DEMO_PRODUCTS;

        if (API_BASE) {
          try {
            const summary = await apiFetch<any[]>("/reviews/summary");
            const map = new Map<string, { avg: number; count: number }>();
            (Array.isArray(summary) ? summary : []).forEach((s: any) => {
              map.set(String(s.product_id), {
                avg: Number(s.avg_rating || 0),
                count: Number(s.count || 0),
              });
            });
            finalProducts = finalProducts.map((p: any) => {
              const key = String(p.id_key ?? p.id);
              const found = map.get(key);
              if (!found) return p;
              return { ...p, rating: found.avg, review_count: found.count };
            });
          } catch {
            // ignore summary errors
          }
        }

        setProducts(finalProducts);

        if (Array.isArray(cats) && cats.length > 0) {
          const names = cats
            .map((c: any) => (typeof c === "string" ? c : c.name || c.title))
            .filter(Boolean);
          setCategories(["Todos", ...Array.from(new Set(names))]);
          setCategoryItems(cats.filter((c: any) => typeof c === "object"));
        } else {
          setCategories(buildCategoriesFromProducts(finalProducts));
          setCategoryItems([]);
        }

        const max = Math.max(...finalProducts.map((p: any) => Number(p.price || 0)));
        if (Number.isFinite(max) && max > 0) setMaxPrice(max);
      } catch (e: any) {
        setApiError(e.message || "Error cargando productos");
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
    const prices = source.map((p: any) => Number(p.price || 0)).filter((n) => Number.isFinite(n));
    const min = prices.length ? Math.min(...prices) : 0;
    const max = prices.length ? Math.max(...prices) : 0;
    return { min, max };
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    let list = (products.length ? products : DEMO_PRODUCTS).filter((p: any) => {
      const selected = categoryItems.find((c) => String(c.name) === String(category));
      const productCategoryName = p.category?.name || p.category_name || p.category;
      const productCategoryId = p.category_id ?? p.category?.id_key;

      const inCategory =
        category === "Todos"
          ? true
          : selected
          ? String(productCategoryId) === String(selected.id_key)
          : String(productCategoryName) === String(category);

      const price = Number(p.price || 0);
      const inPrice = price <= maxPrice;

      const haystack = [p.name, p.title, p.brand, productCategoryName, ...(p.tags || [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const inQuery = !q || haystack.includes(q);

      return inCategory && inPrice && inQuery;
    });

    if (sort === "precio_asc") {
      list = list.slice().sort((a: any, b: any) => Number(a.price || 0) - Number(b.price || 0));
    }
    if (sort === "precio_desc") {
      list = list.slice().sort((a: any, b: any) => Number(b.price || 0) - Number(a.price || 0));
    }
    if (sort === "rating") {
      list = list.slice().sort((a: any, b: any) => Number(b.rating || 0) - Number(a.rating || 0));
    }

    return list;
  }, [products, query, category, sort, maxPrice, categoryItems]);

  const cartLines = useMemo(() => {
    const source = products.length ? products : DEMO_PRODUCTS;

    const items = Object.entries(cart)
      .map(([id, qty]) => {
        const product = source.find((p: any) => String(p.id_key ?? p.id) === String(id));
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
    if (!isAuthed) {
      setApiError("Necesitas iniciar sesion para continuar con el checkout.");
      navigate("/login", { state: { from: "/" } });
      return;
    }
    setCheckoutStep("checkout");
    setCartOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function placeOrder(data: {
    name: string;
    lastname: string;
    email: string;
    addressId: number;
    paymentType: number;
  }) {
    if (!API_BASE) {
      const stored = localStorage.getItem(MOCK_ORDERS_KEY);
      const list = stored ? JSON.parse(stored) : [];
      const order = {
        id_key: Date.now(),
        total: cartLines.total,
        status: "completada",
        items: cartLines.items.map(({ product, qty }) => ({
          product_id: product.id_key ?? product.id,
          name: product.name || product.title,
          quantity: qty,
          unit_price: Number(product.price || 0),
        })),
      };
      localStorage.setItem(MOCK_ORDERS_KEY, JSON.stringify([order, ...list]));
      setLastOrderId(order.id_key);
      setCheckoutStep("success");
      clearCart();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    try {
      setApiError("");

      let createdClient = await createResource<any>(endpoints.clients, {
        name: data.name,
        lastname: data.lastname,
        email: data.email,
      }).catch(() => null);

      if (!createdClient) {
        try {
          const clients: any = await listResource<any>(endpoints.clients, { skip: 0, limit: 200 });
          const list = Array.isArray(clients) ? clients : clients.items || [];
          createdClient = list.find((c: any) => c.email === data.email) || null;
        } catch {
          createdClient = null;
        }
      }

      const clientId =
        createdClient?.id_key ??
        createdClient?.id ??
        createdClient?.client_id ??
        createdClient?.uuid ??
        null;
      if (!clientId) throw new Error("La API no devolvio un client_id");

      const billNumber = `BILL-${Date.now()}`;
      const billDate = new Date().toISOString().slice(0, 10);
      const bill = await createResource<any>(endpoints.bills, {
        bill_number: billNumber,
        discount: 0,
        date: billDate,
        total: cartLines.total,
        payment_type: data.paymentType || 2,
        client_id: clientId,
      });
      const billId = bill?.id ?? bill?.bill_id ?? bill?.id_key;
      if (!billId) throw new Error("La API no devolvio bill_id");

      const orderDate = new Date().toISOString();
      const createdOrder = await createResource<any>(endpoints.orders, {
        client_id: clientId,
        total: cartLines.total,
        delivery_method: 3,
        status: 1,
        bill_id: billId,
        date: orderDate,
      });

      const orderId =
        createdOrder?.id_key ?? createdOrder?.id ?? createdOrder?.order_id ?? createdOrder?.uuid;
      if (!orderId) throw new Error("La API no devolvio un ID de orden");

      const detailLines = cartLines.items.map(({ product, qty }) => ({
        order_id: orderId,
        product_id: product.id_key ?? product.id,
        quantity: qty,
        price: Number(product.price || 0),
      }));

      await createOrderDetailsRateLimited(detailLines);

      setLastOrderId(orderId);
      setCheckoutStep("success");
      clearCart();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: any) {
      setApiError(e.message || "Error creando la orden");
      setCheckoutStep("checkout");
    }
  }

  return (
    <div className="space-y-4">
      {checkoutStep === "browse" && (
        <>
          <div className="flex items-center justify-between rounded-2xl border border-black/10 bg-white px-4 py-3">
            <div className="text-sm text-black/60">Tienda</div>
            <Button variant="outline" onClick={() => setCartOpen(true)} className="gap-2">
              Ver carrito{cartCount > 0 ? ` (${cartCount})` : ""}
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-[280px_1fr]">
            <div className="hidden self-start md:sticky md:top-24 md:block">
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
              <div className="flex gap-2 md:hidden">
                <button
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-4 text-sm shadow-sm hover:bg-black/5"
                  onClick={() => setShowFilters(true)}
                >
                  Filtros
                </button>
                <button
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-4 text-sm shadow-sm hover:bg-black/5"
                  onClick={() => setCartOpen(true)}
                >
                  Carrito ({cartCount})
                </button>
              </div>

              {(loadingProducts || apiError) && (
                <div className="rounded-3xl border border-black/10 bg-white p-4 text-sm">
                  {loadingProducts ? (
                    <div className="text-black/70">Cargando productos desde la API...</div>
                  ) : (
                    <div className="text-black/70">
                      <span className="font-semibold">API:</span> {apiError}
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm text-black/60">
                  Mostrando <span className="font-semibold text-black">{filtered.length}</span> de{" "}
                  <span className="font-semibold text-black">
                    {products.length ? products.length : DEMO_PRODUCTS.length}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-black/60">
                  <span className="rounded-full bg-black/5 px-2.5 py-1">{category}</span>
                  <span className="rounded-full bg-black/5 px-2.5 py-1">
                    A$ {ARS.format(maxPrice)}
                  </span>
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
            </div>
          </div>
        </>
      )}

      {checkoutStep === "checkout" && (
        <Checkout cartLines={cartLines} onBack={() => setCheckoutStep("browse")} onPlaceOrder={placeOrder} />
      )}

      {checkoutStep === "success" && (
        <Success
          orderId={lastOrderId ?? undefined}
          onContinue={() => {
            setCheckoutStep("browse");
            setLastOrderId(null);
          }}
        />
      )}

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cartLines={cartLines}
        setQty={setQty}
        removeFromCart={removeFromCart}
        clearCart={clearCart}
        onCheckout={startCheckout}
      />

      <QuickViewModal
        product={quickView}
        onClose={() => setQuickView(null)}
        onAdd={() => {
          if (!quickView) return;
          addToCart(String(quickView.id_key ?? quickView.id), 1);
          setCartOpen(true);
        }}
      />

      {showFilters && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowFilters(false)} />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-auto rounded-t-3xl bg-white p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-base font-semibold">Filtros</div>
                <div className="text-xs text-black/60">Ajusta y listo</div>
              </div>
              <button className="rounded-xl p-2 hover:bg-black/5" onClick={() => setShowFilters(false)}>
                Cerrar
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
