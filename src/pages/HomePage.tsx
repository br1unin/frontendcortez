import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { getApiBase } from "../api/client";
import { listResource } from "../api/crud";
import { endpoints } from "../api/endpoints";
import logo from "../assets/icono.jpg";
import { DEMO_PRODUCTS } from "../data/demo";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

function normalizeFeatured(product: any) {
  const id =
    product?.id_key ??
    product?.id ??
    product?.sku ??
    product?.slug ??
    product?.name ??
    "product";
  const name = product?.name ?? product?.title ?? "Producto";
  const category =
    product?.category?.name ?? product?.category_name ?? product?.category ?? "General";
  const brand = product?.brand ?? "";
  const image =
    product?.image_url ??
    product?.image ??
    product?.img ??
    "https://images.unsplash.com/photo-1520975958221-4f548d9ac0e9?auto=format&fit=crop&w=1200&q=80";

  return { id: String(id), name, category, brand, image };
}

export default function HomePage() {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const API_BASE = getApiBase();
  const [featured, setFeatured] = useState<any[]>(() => DEMO_PRODUCTS.slice(0, 10));

  useEffect(() => {
    let ignore = false;

    const loadFeatured = async () => {
      if (!API_BASE) {
        if (!ignore) setFeatured(DEMO_PRODUCTS.slice(0, 10));
        return;
      }

      try {
        const data = await listResource<any>(endpoints.products, { skip: 0, limit: 10 });
        const items = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
        if (!ignore) {
          setFeatured(items.length ? items : DEMO_PRODUCTS.slice(0, 10));
        }
      } catch {
        if (!ignore) setFeatured(DEMO_PRODUCTS.slice(0, 10));
      }
    };

    loadFeatured();

    return () => {
      ignore = true;
    };
  }, [API_BASE]);

  const scrollTrack = (dir: number) => {
    if (!trackRef.current) return;
    trackRef.current.scrollBy({ left: dir * 260, behavior: "smooth" });
  };

  return (
    <motion.section
      variants={container}
      initial="hidden"
      animate="show"
      className="relative overflow-hidden rounded-[32px] border border-black/10 bg-white px-6 py-12 text-black shadow-[0_40px_120px_-70px_rgba(15,23,42,0.35)]"
    >
      <div className="pointer-events-none absolute inset-0 opacity-60" style={{
        backgroundImage:
          "radial-gradient(circle at 12% 20%, rgba(15,23,42,0.06), transparent 35%)," +
          "radial-gradient(circle at 85% 0%, rgba(15,23,42,0.04), transparent 30%)," +
          "linear-gradient(180deg, rgba(0,0,0,0.02), transparent 35%)",
      }} />
      <div className="pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full bg-[radial-gradient(circle,#0f172a,transparent_60%)] opacity-10 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-10 h-72 w-72 rounded-full bg-[radial-gradient(circle,#0f172a,transparent_60%)] opacity-10 blur-3xl" />

      <div className="relative mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <motion.div variants={item} className="space-y-6">
          <div className="inline-flex items-center gap-3 rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-black/60">
            Coleccion Nocturna
            <span className="h-1.5 w-1.5 rounded-full bg-black/40" />
            Rebrum
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.5em] text-black/40">Rebrum</div>
            <h1 className="mt-3 text-4xl font-semibold leading-tight text-black sm:text-5xl">
              Siluetas oscuras, elegancia feroz.
            </h1>
            <p className="mt-4 max-w-xl text-sm text-black/70">
              Tejidos densos, cortes amplios y detalles barrocos. Una estetica gotica moderna pensada para destacar sin ruido.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/shop"
              className="inline-flex items-center justify-center rounded-2xl bg-black px-5 py-2.5 text-sm text-white shadow-[0_18px_50px_-25px_rgba(15,23,42,0.35)]"
            >
              Entrar a la tienda
            </Link>
            <Link
              to="/account"
              className="inline-flex items-center justify-center rounded-2xl border border-black/20 bg-white px-5 py-2.5 text-sm text-black"
            >
              Mi cuenta
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { title: "Atelier", text: "Drops limitados y piezas de autor." },
              { title: "Detalles", text: "Texturas oscuras y terminaciones finas." },
              { title: "Envio", text: "Gratis en compras mayores a $65.000." },
            ].map((card) => (
              <motion.div
                key={card.title}
                variants={item}
                className="rounded-2xl border border-black/10 bg-white p-4 text-sm"
              >
                <div className="text-xs font-semibold uppercase tracking-[0.25em] text-black/50">{card.title}</div>
                <div className="mt-2 text-sm text-black/70">{card.text}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={item} className="relative lg:origin-center lg:scale-[1.3]">
          <div className="rounded-[36px] border border-black/10 bg-white p-10 shadow-[0_40px_110px_-70px_rgba(0,0,0,0.55)]">
            <div className="flex items-center gap-3">
              <div className="grid h-18 w-18 place-items-center rounded-2xl border border-black/10 bg-white">
                <img src={logo} alt="Rebrum" className="h-12 w-12 object-contain" />
              </div>
              <div>
                <div className="text-lg font-semibold text-black">Rebrum</div>
                <div className="text-xs text-black/60">Casa gotica de moda urbana</div>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              {[
                { label: "Prendas disponibles", value: "10" },
                { label: "Piezas en sombra", value: "412" },
                { label: "Rating", value: "4.9" },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between rounded-2xl border border-black/10 bg-white px-6 py-5 text-sm">
                  <span className="text-black/60">{stat.label}</span>
                  <span className="text-lg font-semibold text-black">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="absolute -bottom-6 right-8 hidden rounded-2xl border border-black/10 bg-white px-4 py-3 text-xs text-black/70 shadow-sm md:block">
            Ritual semanal, solo lo esencial.
          </div>
        </motion.div>
      </div>

      <motion.div variants={item} className="relative mt-12">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-black/50">Piezas destacadas</div>
            <div className="mt-1 text-sm text-black/70">Desliza para ver nombres de la coleccion.</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Mover a la izquierda"
              onClick={() => scrollTrack(-1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white text-black shadow-sm"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Mover a la derecha"
              onClick={() => scrollTrack(1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white text-black shadow-sm"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div
          ref={trackRef}
          className="mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 pr-2"
        >
          {featured.map((product) => {
            const itemData = normalizeFeatured(product);
            return (
              <Link
                key={itemData.id}
                to="/shop"
                className="min-w-[240px] snap-start rounded-2xl border border-black/10 bg-white text-sm shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="h-36 w-full overflow-hidden rounded-2xl rounded-b-none bg-white">
                  <img
                    src={itemData.image}
                    alt={itemData.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="px-4 py-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-black/40">
                    {itemData.category}
                  </div>
                  <div className="mt-2 text-sm font-semibold text-black">{itemData.name}</div>
                  <div className="mt-1 text-xs text-black/60">{itemData.brand}</div>
                  <div className="mt-3 inline-flex items-center justify-center rounded-full border border-black/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-black/70">
                    Ver
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </motion.div>
    </motion.section>
  );
}
