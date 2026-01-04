export function getId(x: any) {
  return x?.id ?? x?.uuid ?? x?.order_id ?? x?.client_id ?? x?.bill_id ?? x?.address_id ?? x?.product_id;
}

export function normalizeProduct(p: any) {
  return {
    id: String(getId(p)),
    name: p?.name ?? p?.title ?? p?.product_name ?? "Producto",
    price: Number(p?.price ?? p?.unit_price ?? 0),
    category: p?.category ?? p?.category_name ?? p?.category_id ?? "Sin categoría",
    img: p?.img ?? p?.image_url ?? p?.image ?? "",
    brand: p?.brand ?? p?.brand_name ?? "",
    rating: Number(p?.rating ?? 0),
    stock: Number(p?.stock ?? p?.quantity ?? 0),
    description: p?.description ?? "",
    tags: Array.isArray(p?.tags) ? p.tags : [],
    raw: p,
  };
}

export function normalizeBill(b: any) {
  return {
    id: String(getId(b)),
    orderId: String(b?.order_id ?? b?.orderId ?? ""),
    total: Number(b?.total ?? b?.amount ?? 0),
    status: b?.status ?? "issued",
    createdAt: b?.created_at ?? b?.date ?? "",
    raw: b,
  };
}

export function normalizeOrder(o: any) {
  return {
    id: String(getId(o)),
    clientId: o?.client_id ?? o?.clientId,
    total: Number(o?.total ?? 0),
    status: o?.status ?? "created",
    createdAt: o?.created_at ?? "",
    raw: o,
  };
}
