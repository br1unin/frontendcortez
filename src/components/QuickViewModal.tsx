import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ShoppingCart } from "lucide-react";
import { ARS } from "../lib/money";
import { Badge, Button } from "./ui";
import { apiFetch } from "../api/client";
import { useAuth } from "../auth/AuthContext";

export default function QuickViewModal({
  product,
  onClose,
  onAdd,
}: {
  product: any | null;
  onClose: () => void;
  onAdd: () => void;
}) {
  const { isAuthed } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");
  const [savingReview, setSavingReview] = useState(false);

  const productId = product?.id_key ?? product?.id;

  useEffect(() => {
    if (!productId) return;
    let cancelled = false;
    async function loadReviews() {
      setLoadingReviews(true);
      setReviewError("");
      try {
        const data = await apiFetch<any[]>(`/reviews/product/${productId}`);
        if (!cancelled) setReviews(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (!cancelled) setReviewError(e.message || "Error cargando reviews");
      } finally {
        if (!cancelled) setLoadingReviews(false);
      }
    }
    loadReviews();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!productId) return;
    const ratingValue = Number(rating);
    if (!Number.isFinite(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      setReviewError("Rating invalido.");
      return;
    }

    setSavingReview(true);
    setReviewError("");
    try {
      const created = await apiFetch(`/reviews/`, {
        method: "POST",
        body: {
          rating: ratingValue,
          comment: comment.trim() || undefined,
          product_id: Number(productId),
        },
      });
      setReviews((prev) => [created, ...prev]);
      setComment("");
      setRating("5");
    } catch (e: any) {
      setReviewError(e.message || "No se pudo guardar la review");
    } finally {
      setSavingReview(false);
    }
  }

  return (
    <AnimatePresence>
      {product && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:items-center"
        >
          <div className="absolute inset-0 bg-black/35" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            <div className="max-h-[90vh] overflow-auto">
              <div className="flex items-center justify-between border-b border-black/10 p-4">
                <div>
                  <div className="text-base font-semibold">{product.name || product.title || "Producto"}</div>
                  <div className="text-xs text-black/60">
                    {product.brand || ""} - {product.category?.name || product.category || ""}
                  </div>
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
                  className="h-64 w-full rounded-3xl bg-white object-contain"
                />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-semibold">{ARS.format(Number(product.price || 0))}</div>
                    <Badge className="rounded-full">Stock: {product.stock ?? "-"}</Badge>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(product.tags || []).map((t: string) => (
                      <Badge key={t} className="rounded-full">
                        {t}
                      </Badge>
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

                </div>
              </div>

              <div className="border-t border-black/10 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">Reviews</div>
                  <div className="text-xs text-black/60">{reviews.length} opiniones</div>
                </div>

                {loadingReviews && <div className="mt-2 text-xs text-black/60">Cargando reviews...</div>}
                {reviewError && <div className="mt-2 text-xs text-red-600">{reviewError}</div>}

                {!loadingReviews && reviews.length === 0 && (
                  <div className="mt-2 text-xs text-black/60">Todavia no hay reviews.</div>
                )}

                <div className="mt-3 space-y-2">
                  {reviews.map((r) => (
                    <div
                      key={r.id_key || `${r.user_id}-${r.product_id}`}
                      className="rounded-2xl border border-black/10 px-3 py-2 text-xs"
                    >
                      <div className="font-semibold">
                        {r.user_name || "Usuario"} - {Number(r.rating || 0).toFixed(1)}
                      </div>
                      {r.comment && <div className="mt-1 text-black/70">{r.comment}</div>}
                    </div>
                  ))}
                </div>

                {isAuthed ? (
                  <form className="mt-4 space-y-2" onSubmit={submitReview}>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div>
                        <label className="text-xs text-black/60">Rating</label>
                        <select
                          className="h-9 w-full rounded-2xl border border-black/10 bg-white px-3 text-xs outline-none focus:ring-2 focus:ring-black/10"
                          value={rating}
                          onChange={(e) => setRating(e.target.value)}
                        >
                          {[5, 4, 3, 2, 1].map((n) => (
                            <option key={n} value={String(n)}>
                              {n} estrellas
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-end">
                        <Button type="submit" className="w-full" disabled={savingReview}>
                          {savingReview ? "Enviando..." : "Dejar review"}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-black/60">Comentario (opcional)</label>
                      <textarea
                        className="h-20 w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-black/10"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Contanos que te parecio (min 10 caracteres)"
                      />
                    </div>
                    <div className="text-[11px] text-black/50">Solo podes comentar si compraste el producto.</div>
                  </form>
                ) : (
                  <div className="mt-4 text-xs text-black/60">Inicia sesion para dejar una review.</div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
