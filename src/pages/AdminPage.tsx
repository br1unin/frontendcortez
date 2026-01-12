import { useEffect, useMemo, useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Badge, Separator } from "../components/ui";
import { ARS } from "../lib/money";
import { endpoints } from "../api/endpoints";
import { apiFetch, getApiBase } from "../api/client";
import { createResource, deleteResource, getResource, listResource, updateResource } from "../api/crud";
import { DEMO_PRODUCTS, type Product as DemoProduct } from "../data/demo";

type Category = {
  id_key: number;
  name: string;
};

type Product = {
  id_key: number;
  id: string | number;
  name: string;
  title?: string;
  price: number;
  stock: number;
  image_url: string;
  category_id: number;
  category: Category;
};

type Client = {
  id_key: number;
  email: string;
  name: string;
  lastname: string;
  phone: string;
  created_at: string;
};

type Order = {
  id_key: number;
  status: number;
  delivery_method: number;
  payment_type: number;
  client_id: number;
  bill_id: number;
  created_at: string;
};

type Address = {
  id_key: number;
  street: string;
  number: string;
  city: string;
  country: string;
  province: string;
  postal_code: string;
  client_id: number;
};

type Review = {
  id_key: number;
  product_id: number;
  user_id: number;
  rating: number;
  comment: string;
};

type OrderDetail = {
  id_key: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price: number;
};

type ClientFormState = {
  id: string;
  email: string;
  name: string;
  lastname: string;
  phone: string;
};

const emptyClientForm: ClientFormState = {
  id: "",
  email: "",
  name: "",
  lastname: "",
  phone: "",
};

type OrderFormState = {
  id: string;
  status: string;
  delivery_method: string;
  payment_type: string;
  client_id: string;
  bill_id: string;
};

const emptyOrderForm: OrderFormState = {
  id: "",
  status: "",
  delivery_method: "",
  payment_type: "",
  client_id: "",
  bill_id: "",
};

type AddressFormState = {
  id: string;
  street: string;
  number: string;
  city: string;
  country: string;
  province: string;
  postal_code: string;
  client_id: string;
};

const emptyAddressForm: AddressFormState = {
  id: "",
  street: "",
  number: "",
  city: "",
  country: "",
  province: "",
  postal_code: "",
  client_id: "",
};

type ReviewFormState = {
  id: string;
  rating: string;
  comment: string;
};

const emptyReviewForm: ReviewFormState = {
  id: "",
  rating: "",
  comment: "",
};

type OrderDetailFormState = {
  id: string;
  order_id: string;
  product_id: string;
  quantity: string;
  price: string;
};

const emptyOrderDetailForm: OrderDetailFormState = {
  id: "",
  order_id: "",
  product_id: "",
  quantity: "",
  price: "",
};

type FormState = {
  id: string;
  name: string;
  price: string;
  stock: string;
  image_url: string;
  category_id: string;
};

const emptyForm: FormState = {
  id: "",
  name: "",
  price: "",
  stock: "",
  image_url: "",
  category_id: "",
};

type CategoryFormState = {
  id: string;
  name: string;
};

const emptyCategoryForm: CategoryFormState = {
  id: "",
  name: "",
};

function toForm(product: Product): FormState {
  const categoryId = product.category_id ?? product.category.id_key;
  return {
    id: String(product.id_key ?? product.id ?? ""),
    name: product.name ?? "",
    price: product.price != null ? String(product.price) : "",
    stock: product.stock != null ? String(product.stock) : "",
    image_url: product.image_url ?? "",
    category_id: categoryId != null ? String(categoryId) : "",
  };
}

function mapDemoProduct(product: DemoProduct, index: number): Product {
  const parsedId = Number(product.id);
  const id_key = Number.isFinite(parsedId) ? parsedId : index + 1;
  return {
    id_key,
    id: product.id,
    name: product.name,
    title: product.title,
    price: product.price,
    stock: product.stock,
    image_url: product.img,
    category_id: id_key,
    category: {
      id_key,
      name: product.category || "Sin categoria",
    },
  };
}

const DEMO_ADMIN_PRODUCTS: Product[] = DEMO_PRODUCTS.map(mapDemoProduct);

function buildPayload(form: FormState) {
  const payload: Record<string, any> = {};
  if (form.name.trim()) payload.name = form.name.trim();
  const price = Number(form.price);
  if (Number.isFinite(price)) payload.price = price;

  const stock = Number(form.stock);
  if (Number.isFinite(stock)) payload.stock = stock;

  if (form.image_url.trim()) payload.image_url = form.image_url.trim();

  const categoryId = Number(form.category_id);
  if (Number.isFinite(categoryId)) payload.category_id = categoryId;

  return payload;
}

export default function AdminPage() {
  const API_BASE = getApiBase();
  const hasApi = Boolean(API_BASE);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [deletingIds, setDeletingIds] = useState<Record<string, boolean>>({});
  const [imageUploading, setImageUploading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(emptyCategoryForm);
  const [categoryMode, setCategoryMode] = useState<"create" | "edit">("create");
  const [categorySaving, setCategorySaving] = useState(false);
  const [deletingCategoryIds, setDeletingCategoryIds] = useState<Record<string, boolean>>({});
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [deletingClientIds, setDeletingClientIds] = useState<Record<string, boolean>>({});
  const [clientForm, setClientForm] = useState<ClientFormState>(emptyClientForm);
  const [clientMode, setClientMode] = useState<"create" | "edit">("create");
  const [clientSaving, setClientSaving] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [deletingOrderIds, setDeletingOrderIds] = useState<Record<string, boolean>>({});
  const [orderForm, setOrderForm] = useState<OrderFormState>(emptyOrderForm);
  const [orderMode, setOrderMode] = useState<"create" | "edit">("create");
  const [orderSaving, setOrderSaving] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [deletingAddressIds, setDeletingAddressIds] = useState<Record<string, boolean>>({});
  const [addressForm, setAddressForm] = useState<AddressFormState>(emptyAddressForm);
  const [addressMode, setAddressMode] = useState<"create" | "edit">("create");
  const [addressSaving, setAddressSaving] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [deletingReviewIds, setDeletingReviewIds] = useState<Record<string, boolean>>({});
  const [reviewForm, setReviewForm] = useState<ReviewFormState>(emptyReviewForm);
  const [reviewMode, setReviewMode] = useState<"create" | "edit">("create");
  const [reviewSaving, setReviewSaving] = useState(false);
  const [orderDetails, setOrderDetails] = useState<OrderDetail[]>([]);
  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);
  const [deletingOrderDetailIds, setDeletingOrderDetailIds] = useState<Record<string, boolean>>({});
  const [orderDetailForm, setOrderDetailForm] = useState<OrderDetailFormState>(emptyOrderDetailForm);
  const [orderDetailMode, setOrderDetailMode] = useState<"create" | "edit">("create");
  const [orderDetailSaving, setOrderDetailSaving] = useState(false);

  async function loadProducts() {
    setLoading(true);
    setError("");

    try {
      const data = hasApi
        ? await listResource<Product>(endpoints.products, { skip: 0, limit: 500 })
        : DEMO_ADMIN_PRODUCTS;
      const normalized = Array.isArray(data) ? data : (data as any).items || [];
      const finalList = normalized.length ? normalized : DEMO_ADMIN_PRODUCTS;
      setProducts(finalList);
    } catch (e: any) {
      setError(e.message || "Error cargando productos");
      setProducts(DEMO_ADMIN_PRODUCTS);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, [API_BASE]);

  async function loadCategories() {
    if (!hasApi) {
      setCategories([]);
      return;
    }
    setLoadingCategories(true);
    setError("");

    try {
      const data = await listResource<Category>(endpoints.categories, { skip: 0, limit: 500 });
      const normalized = Array.isArray(data) ? data : (data as any).items || [];
      setCategories(normalized);
    } catch (e: any) {
      setError(e.message || "Error cargando categorias");
    } finally {
      setLoadingCategories(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, [API_BASE]);

  async function loadClients() {
    if (!hasApi) {
      setClients([]);
      return;
    }
    setLoadingClients(true);
    setError("");

    try {
      const data = await listResource<Client>(endpoints.clients, { skip: 0, limit: 500 });
      const normalized = Array.isArray(data) ? data : (data as any).items || [];
      setClients(normalized);
    } catch (e: any) {
      setError(e.message || "Error cargando clientes");
    } finally {
      setLoadingClients(false);
    }
  }

  useEffect(() => {
    loadClients();
  }, [API_BASE]);

  async function loadOrders() {
    if (!hasApi) {
      setOrders([]);
      return;
    }
    setLoadingOrders(true);
    setError("");

    try {
      const data = await listResource<Order>(endpoints.orders, { skip: 0, limit: 500 });
      const normalized = Array.isArray(data) ? data : (data as any).items || [];
      setOrders(normalized);
    } catch (e: any) {
      setError(e.message || "Error cargando ordenes");
    } finally {
      setLoadingOrders(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, [API_BASE]);

  async function loadAddresses() {
    if (!hasApi) {
      setAddresses([]);
      return;
    }
    setLoadingAddresses(true);
    setError("");

    try {
      const data = await listResource<Address>(endpoints.addresses, { skip: 0, limit: 500 });
      const normalized = Array.isArray(data) ? data : (data as any).items || [];
      setAddresses(normalized);
    } catch (e: any) {
      setError(e.message || "Error cargando direcciones");
    } finally {
      setLoadingAddresses(false);
    }
  }

  useEffect(() => {
    loadAddresses();
  }, [API_BASE]);

  async function loadReviews() {
    if (!hasApi) {
      setReviews([]);
      return;
    }
    setLoadingReviews(true);
    setError("");

    try {
      const data = await listResource<Review>(endpoints.reviews, { skip: 0, limit: 500 });
      const normalized = Array.isArray(data) ? data : (data as any).items || [];
      setReviews(normalized);
    } catch (e: any) {
      setError(e.message || "Error cargando reviews");
    } finally {
      setLoadingReviews(false);
    }
  }

  useEffect(() => {
    loadReviews();
  }, [API_BASE]);

  async function loadOrderDetails() {
    if (!hasApi) {
      setOrderDetails([]);
      return;
    }
    setLoadingOrderDetails(true);
    setError("");

    try {
      const data = await listResource<OrderDetail>(endpoints.orderDetails, { skip: 0, limit: 500 });
      const normalized = Array.isArray(data) ? data : (data as any).items || [];
      setOrderDetails(normalized);
    } catch (e: any) {
      setError(e.message || "Error cargando items de orden");
    } finally {
      setLoadingOrderDetails(false);
    }
  }

  useEffect(() => {
    loadOrderDetails();
  }, [API_BASE]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      const categoryName =
        p.category?.name ||
        categories.find((c) => String(c.id_key) === String(p.category_id))?.name ||
        (p as any).category ||
        "";
      const haystack = [p.name, categoryName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [products, query, categories]);

  function resetForm() {
    setMode("create");
    setForm(emptyForm);
  }

  function resetCategoryForm() {
    setCategoryMode("create");
    setCategoryForm(emptyCategoryForm);
  }

  function resetClientForm() {
    setClientMode("create");
    setClientForm(emptyClientForm);
  }

  function resetAddressForm() {
    setAddressMode("create");
    setAddressForm(emptyAddressForm);
  }

  function resetReviewForm() {
    setReviewMode("create");
    setReviewForm(emptyReviewForm);
  }

  function resetOrderDetailForm() {
    setOrderDetailMode("create");
    setOrderDetailForm(emptyOrderDetailForm);
  }

  function resetOrderForm() {
    setOrderMode("create");
    setOrderForm(emptyOrderForm);
  }

  async function editProduct(product: Product) {
    setMode("edit");
    const id = String(product.id_key ?? product.id ?? "");
    if (!hasApi || !id) {
      setForm(toForm(product));
      return;
    }

    setError("");
    try {
      const fresh = await getResource<Product>(endpoints.products, id);
      setForm(toForm(fresh || product));
    } catch (e: any) {
      setError(e.message || "Error cargando producto");
      setForm(toForm(product));
    }
  }

  async function uploadProductImage(file: File) {
    if (!hasApi) {
      setError("Configura VITE_API_URL para habilitar el upload.");
      return;
    }
    const base = (API_BASE || "").replace(/\/$/, "");
    const formData = new FormData();
    formData.append("file", file);

    setImageUploading(true);
    setError("");

    try {
      const data = await apiFetch<{ url: string }>("/upload/products", {
        method: "POST",
        body: formData,
      });
      let url = data.url || "";
      if (url && !url.startsWith("http")) {
        url = `${base}${url.startsWith("/") ? "" : "/"}${url}`;
      }
      if (!url) {
        throw new Error("No se pudo obtener URL de la imagen");
      }
      setForm((prev) => ({ ...prev, image_url: url }));
    } catch (e: any) {
      setError(e.message || "Error subiendo imagen");
    } finally {
      setImageUploading(false);
    }
  }

  async function editCategory(category: Category) {
    setCategoryMode("edit");
    const id = String(category.id_key ?? "");
    if (!hasApi || !id) {
      setCategoryForm({
        id,
        name: category.name ?? "",
      });
      return;
    }

    setError("");
    try {
      const fresh = await getResource<Category>(endpoints.categories, id);
      setCategoryForm({
        id,
        name: fresh.name ?? category.name ?? "",
      });
    } catch (e: any) {
      setError(e.message || "Error cargando categoria");
      setCategoryForm({
        id,
        name: category.name ?? "",
      });
    }
  }

  async function editClient(client: Client) {
    setClientMode("edit");
    const id = String(client.id_key ?? "");
    if (!hasApi || !id) {
      setClientForm({
        id,
        email: client.email ?? "",
        name: client.name ?? "",
        lastname: client.lastname ?? "",
        phone: client.phone ?? "",
      });
      return;
    }

    setError("");
    try {
      const fresh = await getResource<Client>(endpoints.clients, id);
      setClientForm({
        id,
        email: fresh.email ?? client.email ?? "",
        name: fresh.name ?? client.name ?? "",
        lastname: fresh.lastname ?? client.lastname ?? "",
        phone: fresh.phone ?? client.phone ?? "",
      });
    } catch (e: any) {
      setError(e.message || "Error cargando cliente");
      setClientForm({
        id,
        email: client.email ?? "",
        name: client.name ?? "",
        lastname: client.lastname ?? "",
        phone: client.phone ?? "",
      });
    }
  }

  async function editOrder(order: Order) {
    setOrderMode("edit");
    const id = String(order.id_key ?? "");
    if (!hasApi || !id) {
      setOrderForm({
        id,
        status: order.status != null ? String(order.status) : "",
        delivery_method: order.delivery_method != null ? String(order.delivery_method) : "",
        payment_type: order.payment_type != null ? String(order.payment_type) : "",
        client_id: order.client_id != null ? String(order.client_id) : "",
        bill_id: order.bill_id != null ? String(order.bill_id) : "",
      });
      return;
    }

    setError("");
    try {
      const fresh = await getResource<Order>(endpoints.orders, id);
      setOrderForm({
        id,
        status: fresh.status != null ? String(fresh.status) : order.status != null ? String(order.status) : "",
        delivery_method:
          fresh.delivery_method != null ? String(fresh.delivery_method) : order.delivery_method != null ? String(order.delivery_method) : "",
        payment_type:
          fresh.payment_type != null ? String(fresh.payment_type) : order.payment_type != null ? String(order.payment_type) : "",
        client_id:
          fresh.client_id != null ? String(fresh.client_id) : order.client_id != null ? String(order.client_id) : "",
        bill_id: fresh.bill_id != null ? String(fresh.bill_id) : order.bill_id != null ? String(order.bill_id) : "",
      });
    } catch (e: any) {
      setError(e.message || "Error cargando orden");
      setOrderForm({
        id,
        status: order.status != null ? String(order.status) : "",
        delivery_method: order.delivery_method != null ? String(order.delivery_method) : "",
        payment_type: order.payment_type != null ? String(order.payment_type) : "",
        client_id: order.client_id != null ? String(order.client_id) : "",
        bill_id: order.bill_id != null ? String(order.bill_id) : "",
      });
    }
  }

  async function editAddress(address: Address) {
    setAddressMode("edit");
    const id = String(address.id_key ?? "");
    if (!hasApi || !id) {
      setAddressForm({
        id,
        street: address.street ?? "",
        number: address.number ?? "",
        city: address.city ?? "",
        country: address.country ?? "",
        province: address.province ?? "",
        postal_code: address.postal_code ?? "",
        client_id: address.client_id != null ? String(address.client_id) : "",
      });
      return;
    }

    setError("");
    try {
      const fresh = await getResource<Address>(endpoints.addresses, id);
      setAddressForm({
        id,
        street: fresh.street ?? address.street ?? "",
        number: fresh.number ?? address.number ?? "",
        city: fresh.city ?? address.city ?? "",
        country: fresh.country ?? address.country ?? "",
        province: fresh.province ?? address.province ?? "",
        postal_code: fresh.postal_code ?? address.postal_code ?? "",
        client_id:
          fresh.client_id != null ? String(fresh.client_id) : address.client_id != null ? String(address.client_id) : "",
      });
    } catch (e: any) {
      setError(e.message || "Error cargando direccion");
      setAddressForm({
        id,
        street: address.street ?? "",
        number: address.number ?? "",
        city: address.city ?? "",
        country: address.country ?? "",
        province: address.province ?? "",
        postal_code: address.postal_code ?? "",
        client_id: address.client_id != null ? String(address.client_id) : "",
      });
    }
  }

  async function editReview(review: Review) {
    setReviewMode("edit");
    const id = String(review.id_key ?? "");
    if (!hasApi || !id) {
      setReviewForm({
        id,
        rating: review.rating != null ? String(review.rating) : "",
        comment: review.comment ?? "",
      });
      return;
    }

    setError("");
    try {
      const fresh = await getResource<Review>(endpoints.reviews, id);
      setReviewForm({
        id,
        rating: fresh.rating != null ? String(fresh.rating) : review.rating != null ? String(review.rating) : "",
        comment: fresh.comment ?? review.comment ?? "",
      });
    } catch (e: any) {
      setError(e.message || "Error cargando review");
      setReviewForm({
        id,
        rating: review.rating != null ? String(review.rating) : "",
        comment: review.comment ?? "",
      });
    }
  }

  async function editOrderDetail(detail: OrderDetail) {
    setOrderDetailMode("edit");
    const id = String(detail.id_key ?? "");
    if (!hasApi || !id) {
      setOrderDetailForm({
        id,
        order_id: detail.order_id != null ? String(detail.order_id) : "",
        product_id: detail.product_id != null ? String(detail.product_id) : "",
        quantity: detail.quantity != null ? String(detail.quantity) : "",
        price: detail.price != null ? String(detail.price) : "",
      });
      return;
    }

    setError("");
    try {
      const fresh = await getResource<OrderDetail>(endpoints.orderDetails, id);
      setOrderDetailForm({
        id,
        order_id:
          fresh.order_id != null ? String(fresh.order_id) : detail.order_id != null ? String(detail.order_id) : "",
        product_id:
          fresh.product_id != null ? String(fresh.product_id) : detail.product_id != null ? String(detail.product_id) : "",
        quantity:
          fresh.quantity != null ? String(fresh.quantity) : detail.quantity != null ? String(detail.quantity) : "",
        price:
          fresh.price != null ? String(fresh.price) : detail.price != null ? String(detail.price) : "",
      });
    } catch (e: any) {
      setError(e.message || "Error cargando item de orden");
      setOrderDetailForm({
        id,
        order_id: detail.order_id != null ? String(detail.order_id) : "",
        product_id: detail.product_id != null ? String(detail.product_id) : "",
        quantity: detail.quantity != null ? String(detail.quantity) : "",
        price: detail.price != null ? String(detail.price) : "",
      });
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!hasApi) {
      setError("Configura VITE_API_URL para habilitar el CRUD real.");
      return;
    }

    const payload = buildPayload(form);
    if (!payload.name) {
      setError("El nombre es obligatorio.");
      return;
    }

    if (!Number.isFinite(payload.price)) {
      setError("El precio es obligatorio.");
      return;
    }

    if (!Number.isFinite(payload.category_id)) {
      setError("La categoria es obligatoria.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      let saved: Product | null = null;
      if (mode === "edit" && form.id) {
        saved = await updateResource<Product>(endpoints.products, form.id, payload);
      } else {
        saved = await createResource<Product>(endpoints.products, payload);
      }

      if (saved && saved.id != null) {
        setProducts((prev) => {
          const id = String(saved.id);
          const exists = prev.some((p) => String(p.id) === id);
          if (exists) return prev.map((p) => (String(p.id) === id ? { ...p, ...saved } : p));
          return [{ ...saved }, ...prev];
        });
      } else {
        await loadProducts();
      }

      resetForm();
    } catch (e: any) {
      setError(e.message || "Error guardando producto");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(product: Product) {
    if (!hasApi) {
      setError("Configura VITE_API_URL para habilitar el CRUD real.");
      return;
    }
    const id = String(product.id_key ?? product.id ?? "");
    if (!id) return;

    const ok = window.confirm(`Eliminar producto "${product.title ?? product.name ?? id}"`);
    if (!ok) return;

    setDeletingIds((prev) => ({ ...prev, [id]: true }));
    setError("");

    try {
      await deleteResource(endpoints.products, id);
      setProducts((prev) => prev.filter((p) => String(p.id) !== id));
      if (form.id === id) resetForm();
    } catch (e: any) {
      setError(e.message || "Error eliminando producto");
    } finally {
      setDeletingIds((prev) => ({ ...prev, [id]: false }));
    }
  }

  async function onCategorySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!hasApi) {
      setError("Configura VITE_API_URL para habilitar el CRUD real.");
      return;
    }

    if (!categoryForm.name.trim()) {
      setError("El nombre de categoria es obligatorio.");
      return;
    }

    setCategorySaving(true);
    setError("");

    try {
      let saved: Category | null = null;
      if (categoryMode === "edit" && categoryForm.id) {
        saved = await updateResource<Category>(endpoints.categories, categoryForm.id, {
          name: categoryForm.name.trim(),
        });
      } else {
        saved = await createResource<Category>(endpoints.categories, {
          name: categoryForm.name.trim(),
        });
      }

      if (saved && saved.id_key != null) {
        setCategories((prev) => {
          const id = String(saved.id_key);
          const exists = prev.some((c) => String(c.id_key) === id);
          if (exists) return prev.map((c) => (String(c.id_key) === id ? { ...c, ...saved } : c));
          return [{ ...saved }, ...prev];
        });
      } else {
        await loadCategories();
      }

      resetCategoryForm();
    } catch (e: any) {
      setError(e.message || "Error guardando categoria");
    } finally {
      setCategorySaving(false);
    }
  }

  async function onDeleteCategory(category: Category) {
    if (!hasApi) {
      setError("Configura VITE_API_URL para habilitar el CRUD real.");
      return;
    }
    const id = String(category.id_key ?? "");
    if (!id) return;

    const ok = window.confirm(`Eliminar categoria "${category.name ?? id}"`);
    if (!ok) return;

    setDeletingCategoryIds((prev) => ({ ...prev, [id]: true }));
    setError("");

    try {
      await deleteResource(endpoints.categories, id);
      setCategories((prev) => prev.filter((c) => String(c.id_key) !== id));
      if (form.category_id === id) {
        setForm((prev) => ({ ...prev, category_id: "" }));
      }
      if (categoryForm.id === id) resetCategoryForm();
    } catch (e: any) {
      setError(e.message || "Error eliminando categoria");
    } finally {
      setDeletingCategoryIds((prev) => ({ ...prev, [id]: false }));
    }
  }

  async function onClientSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!hasApi) {
      setError("Configura VITE_API_URL para habilitar el CRUD real.");
      return;
    }
    if (!clientForm.email.trim()) {
      setError("El email del cliente es obligatorio.");
      return;
    }

    setClientSaving(true);
    setError("");

    try {
      const payload = {
        email: clientForm.email.trim(),
        name: clientForm.name.trim(),
        lastname: clientForm.lastname.trim(),
        phone: clientForm.phone.trim(),
      };

      let saved: Client | null = null;
      if (clientMode === "edit" && clientForm.id) {
        saved = await updateResource<Client>(endpoints.clients, clientForm.id, payload);
      } else {
        saved = await createResource<Client>(endpoints.clients, payload);
      }

      if (saved && saved.id_key != null) {
        setClients((prev) => {
          const id = String(saved.id_key);
          const exists = prev.some((c) => String(c.id_key) === id);
          if (exists) return prev.map((c) => (String(c.id_key) === id ? { ...c, ...saved } : c));
          return [{ ...saved }, ...prev];
        });
      } else {
        await loadClients();
      }

      resetClientForm();
    } catch (e: any) {
      setError(e.message || "Error guardando cliente");
    } finally {
      setClientSaving(false);
    }
  }

  async function onOrderSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!hasApi) {
      setError("Configura VITE_API_URL para habilitar el CRUD real.");
      return;
    }
    if (!orderForm.id && orderMode === "edit") {
      setError("Selecciona una orden para editar.");
      return;
    }

    const payload: Record<string, any> = {};
    const status = Number(orderForm.status);
    if (Number.isFinite(status)) payload.status = status;

    const deliveryMethod = Number(orderForm.delivery_method);
    if (Number.isFinite(deliveryMethod)) payload.delivery_method = deliveryMethod;

    const paymentType = Number(orderForm.payment_type);
    if (Number.isFinite(paymentType)) payload.payment_type = paymentType;

    const clientId = Number(orderForm.client_id);
    if (Number.isFinite(clientId)) payload.client_id = clientId;

    const billId = Number(orderForm.bill_id);
    if (Number.isFinite(billId)) payload.bill_id = billId;

    setOrderSaving(true);
    setError("");

    try {
      if (orderMode !== "edit" || !orderForm.id) {
        setError("Las ordenes se crean desde checkout.");
        return;
      }

      const saved = await updateResource<Order>(endpoints.orders, orderForm.id, payload);
      if (saved && saved.id_key != null) {
        setOrders((prev) => {
          const id = String(saved.id_key);
          const exists = prev.some((o) => String(o.id_key) === id);
          if (exists) return prev.map((o) => (String(o.id_key) === id ? { ...o, ...saved } : o));
          return [{ ...saved }, ...prev];
        });
      } else {
        await loadOrders();
      }

      resetOrderForm();
    } catch (e: any) {
      setError(e.message || "Error actualizando orden");
    } finally {
      setOrderSaving(false);
    }
  }

  async function onAddressSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!hasApi) {
      setError("Configura VITE_API_URL para habilitar el CRUD real.");
      return;
    }
    if (!addressForm.street.trim() || !addressForm.city.trim() || !addressForm.country.trim() || !addressForm.province.trim()) {
      setError("Completa calle, ciudad, pais y provincia.");
      return;
    }

    const payload: Record<string, any> = {
      street: addressForm.street.trim(),
      number: addressForm.number.trim() || undefined,
      city: addressForm.city.trim(),
      country: addressForm.country.trim(),
      province: addressForm.province.trim(),
      postal_code: addressForm.postal_code.trim() || undefined,
    };
    const clientId = Number(addressForm.client_id);
    if (Number.isFinite(clientId)) payload.client_id = clientId;

    setAddressSaving(true);
    setError("");

    try {
      let saved: Address | null = null;
      if (addressMode === "edit" && addressForm.id) {
        saved = await updateResource<Address>(endpoints.addresses, addressForm.id, payload);
      } else {
        saved = await createResource<Address>(endpoints.addresses, payload);
      }

      if (saved && saved.id_key != null) {
        setAddresses((prev) => {
          const id = String(saved.id_key);
          const exists = prev.some((a) => String(a.id_key) === id);
          if (exists) return prev.map((a) => (String(a.id_key) === id ? { ...a, ...saved } : a));
          return [{ ...saved }, ...prev];
        });
      } else {
        await loadAddresses();
      }

      resetAddressForm();
    } catch (e: any) {
      setError(e.message || "Error guardando direccion");
    } finally {
      setAddressSaving(false);
    }
  }

  async function onReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!hasApi) {
      setError("Configura VITE_API_URL para habilitar el CRUD real.");
      return;
    }

    const rating = Number(reviewForm.rating);
    if (!Number.isFinite(rating)) {
      setError("La calificacion es obligatoria.");
      return;
    }

    setReviewSaving(true);
    setError("");

    try {
      if (reviewMode !== "edit" || !reviewForm.id) {
        setError("Las reviews se crean desde la tienda.");
        return;
      }

      const payload = {
        rating,
        comment: reviewForm.comment.trim(),
      };

      const saved = await updateResource<Review>(endpoints.reviews, reviewForm.id, payload);
      if (saved && saved.id_key != null) {
        setReviews((prev) => {
          const id = String(saved.id_key);
          const exists = prev.some((r) => String(r.id_key) === id);
          if (exists) return prev.map((r) => (String(r.id_key) === id ? { ...r, ...saved } : r));
          return [{ ...saved }, ...prev];
        });
      } else {
        await loadReviews();
      }

      resetReviewForm();
    } catch (e: any) {
      setError(e.message || "Error actualizando review");
    } finally {
      setReviewSaving(false);
    }
  }

  async function onOrderDetailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!hasApi) {
      setError("Configura VITE_API_URL para habilitar el CRUD real.");
      return;
    }

    const quantity = Number(orderDetailForm.quantity);
    const price = Number(orderDetailForm.price);
    const orderId = Number(orderDetailForm.order_id);
    const productId = Number(orderDetailForm.product_id);

    if (!Number.isFinite(quantity) || !Number.isFinite(orderId) || !Number.isFinite(productId)) {
      setError("Completa cantidad, orden y producto.");
      return;
    }

    setOrderDetailSaving(true);
    setError("");

    try {
      if (orderDetailMode !== "edit" || !orderDetailForm.id) {
        setError("Los items se crean desde checkout.");
        return;
      }

      const payload: Record<string, any> = {
        quantity,
        order_id: orderId,
        product_id: productId,
      };
      if (Number.isFinite(price)) payload.price = price;

      const saved = await updateResource<OrderDetail>(endpoints.orderDetails, orderDetailForm.id, payload);
      if (saved && saved.id_key != null) {
        setOrderDetails((prev) => {
          const id = String(saved.id_key);
          const exists = prev.some((d) => String(d.id_key) === id);
          if (exists) return prev.map((d) => (String(d.id_key) === id ? { ...d, ...saved } : d));
          return [{ ...saved }, ...prev];
        });
      } else {
        await loadOrderDetails();
      }

      resetOrderDetailForm();
    } catch (e: any) {
      setError(e.message || "Error actualizando item");
    } finally {
      setOrderDetailSaving(false);
    }
  }

  return (
    <section className="space-y-4">
      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Admin  -  Productos</CardTitle>
            <div className="mt-1 text-sm text-black/60">
              Gestiona el catalogo desde la API. {hasApi ? "API conectada." : "API desconectada, mostrando demo."}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!hasApi && <Badge className="bg-amber-100 text-amber-900">Sin API</Badge>}
            <Button
              variant="outline"
              onClick={() => {
                loadProducts();
                loadCategories();
                loadClients();
                loadOrders();
                loadAddresses();
                loadReviews();
                loadOrderDetails();
              }}
              disabled={loading || loadingCategories || loadingClients || loadingOrders || loadingAddresses || loadingReviews || loadingOrderDetails}
            >
              {loading || loadingCategories || loadingClients || loadingOrders || loadingAddresses || loadingReviews || loadingOrderDetails ? "Cargando..." : "Recargar"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {error && <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Input
                  placeholder="Buscar por nombre, marca o categoria..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <div className="text-xs text-black/60">Total: {products.length}</div>
              </div>

              <div className="overflow-hidden rounded-3xl border border-black/10 bg-white">
                <table className="w-full text-left text-sm">
                  <thead className="bg-black/5 text-xs text-black/60">
                    <tr>
                      <th className="px-4 py-3">Producto</th>
                      <th className="px-4 py-3">Categoria</th>
                      <th className="px-4 py-3">Precio</th>
                      <th className="px-4 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p) => {
                      const id = String(p.id_key ?? p.id ?? "");
                      const title = p.name ?? "Producto";
                      const categoryName =
                        p.category?.name ||
                        categories.find((c) => String(c.id_key) === String(p.category_id))?.name ||
                        (p as any).category ||
                        "-";
                      const price = Number(p.price || 0);
                      return (
                        <tr key={id} className="border-t border-black/5">
                          <td className="px-4 py-3">
                            <div className="font-medium">{title}</div>
                            <div className="text-xs text-black/50">ID: {id || "-"}</div>
                          </td>
                          <td className="px-4 py-3 text-xs text-black/70">{categoryName}</td>
                          <td className="px-4 py-3 font-medium">{ARS.format(price)}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => editProduct(p)}>
                                Editar
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => onDelete(p)}
                                disabled={deletingIds[id]}
                              >
                                {deletingIds[id] ? "Eliminando..." : "Eliminar"}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {!filtered.length && (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-sm text-black/60">
                          No hay productos para mostrar.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <Card>
                <CardHeader className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle>Categorias</CardTitle>
                  <div className="text-xs text-black/60">Total: {categories.length}</div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <form className="flex flex-wrap items-end gap-2" onSubmit={onCategorySubmit}>
                    <div className="flex-1 min-w-[220px]">
                      <label className="text-xs text-black/60">Nombre de categoria</label>
                      <Input
                        value={categoryForm.name}  onChange={(e) => setCategoryForm((prev) => ({ ...prev, name : e.target.value }))}  placeholder="Ej : Ropa"
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <Button type="submit" size="sm" disabled={categorySaving || !hasApi}>
                        {categorySaving ? "Guardando..." : categoryMode === "edit" ? "Actualizar" : "Crear"}
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={resetCategoryForm}>
                        Limpiar
                      </Button>
                    </div>
                  </form>

                  <div className="overflow-hidden rounded-2xl border border-black/10">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-black/5 text-xs text-black/60">
                        <tr>
                          <th className="px-4 py-2">Categoria</th>
                          <th className="px-4 py-2 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categories.map((cat) => {
                          const id = String(cat.id_key ?? "");
                          return (
                            <tr key={id} className="border-t border-black/5">
                              <td className="px-4 py-2">
                                <div className="font-medium">{cat.name ?? "-"}</div>
                                <div className="text-xs text-black/50">ID: {id || "-"}</div>
                              </td>
                              <td className="px-4 py-2 text-right">
                                <div className="inline-flex gap-2">
                                  <Button variant="outline" size="sm" onClick={() => editCategory(cat)}>
                                    Editar
                                  </Button>
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => onDeleteCategory(cat)}
                                    disabled={deletingCategoryIds[id]}
                                  >
                                    {deletingCategoryIds[id] ? "Eliminando..." : "Eliminar"}
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {!categories.length && (
                          <tr>
                            <td colSpan={2} className="px-4 py-4 text-center text-xs text-black/60">
                              No hay categorias creadas.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle>Clientes</CardTitle>
                  <div className="text-xs text-black/60">Total: {clients.length}</div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <form className="grid gap-3 md:grid-cols-[1fr_1fr] lg:grid-cols-[1fr_1fr_1fr] items-end" onSubmit={onClientSubmit}>
                    <div>
                      <label className="text-xs text-black/60">Email</label>
                      <Input
                        type="email"
                        value={clientForm.email}  onChange={(e) => setClientForm((prev) => ({ ...prev, email : e.target.value }))}
                        placeholder="cliente@email.com"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-black/60">Nombre</label>
                      <Input
                        value={clientForm.name}  onChange={(e) => setClientForm((prev) => ({ ...prev, name : e.target.value }))}
                        placeholder="Nombre"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-black/60">Apellido</label>
                      <Input
                        value={clientForm.lastname}  onChange={(e) => setClientForm((prev) => ({ ...prev, lastname : e.target.value }))}
                        placeholder="Apellido"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-black/60">Telefono</label>
                      <Input
                        value={clientForm.phone}  onChange={(e) => setClientForm((prev) => ({ ...prev, phone : e.target.value }))}
                        placeholder="Opcional"
                      />
                    </div>
                    <div className="flex items-end gap-2 md:col-span-2 lg:col-span-2">
                      <Button type="submit" size="sm" disabled={clientSaving || !hasApi}>
                        {clientSaving ? "Guardando..." : clientMode === "edit" ? "Actualizar" : "Crear"}
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={resetClientForm}>
                        Limpiar
                      </Button>
                    </div>
                  </form>

                  <div className="overflow-hidden rounded-2xl border border-black/10">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-black/5 text-xs text-black/60">
                        <tr>
                          <th className="px-4 py-2">Cliente</th>
                          <th className="px-4 py-2">Contacto</th>
                          <th className="px-4 py-2 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clients.map((client) => {
                          const id = String(client.id_key ?? "");
                          const fullName = [client.name, client.lastname].filter(Boolean).join(" ");
                          return (
                            <tr key={id} className="border-t border-black/5">
                              <td className="px-4 py-2">
                                <div className="font-medium">{fullName || client.email || "Cliente"}</div>
                                <div className="text-xs text-black/50">ID: {id || "-"}</div>
                              </td>
                              <td className="px-4 py-2 text-xs text-black/70">
                                <div>{client.email || "-"}</div>
                                <div>{client.phone || "-"}</div>
                              </td>
                              <td className="px-4 py-2 text-right">
                                <div className="inline-flex gap-2">
                                  <Button variant="outline" size="sm" onClick={() => editClient(client)}>
                                    Editar
                                  </Button>
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={async () => {
                                      if (!hasApi) {
                                        setError("Configura VITE_API_URL para habilitar el CRUD real.");
                                        return;
                                      }
                                      if (!id) return;
                                      const ok = window.confirm(`Eliminar cliente "${client.email ?? id}"`);
                                      if (!ok) return;

                                      setDeletingClientIds((prev) => ({ ...prev, [id]: true }));
                                      setError("");

                                      try {
                                        await deleteResource(endpoints.clients, id);
                                        setClients((prev) => prev.filter((c) => String(c.id_key) !== id));
                                        if (clientForm.id === id) resetClientForm();
                                      } catch (e: any) {
                                        setError(e.message || "Error eliminando cliente");
                                      } finally {
                                        setDeletingClientIds((prev) => ({ ...prev, [id]: false }));
                                      }
                                    }}
                                    disabled={deletingClientIds[id]}
                                  >
                                    {deletingClientIds[id] ? "Eliminando..." : "Eliminar"}
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {!clients.length && (
                          <tr>
                            <td colSpan={3} className="px-4 py-4 text-center text-xs text-black/60">
                              No hay clientes cargados.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle>Ordenes</CardTitle>
                  <div className="text-xs text-black/60">Total: {orders.length}</div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <form  className="grid gap-3 md:grid-cols-[1fr_1fr] lg:grid-cols-[1fr_1fr_1fr] items-end"
                    onSubmit={onOrderSubmit}
                  >
                    <div>
                      <label className="text-xs text-black/60">Estado</label>
                      <Input
                        type="number"
                        min="0"
                        value={orderForm.status}  onChange={(e) => setOrderForm((prev) => ({ ...prev, status : e.target.value }))}
                        placeholder="1"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-black/60">Delivery</label>
                      <Input
                        type="number"
                        min="0"
                        value={orderForm.delivery_method}  onChange={(e) => setOrderForm((prev) => ({ ...prev, delivery_method : e.target.value }))}
                        placeholder="3"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-black/60">Pago</label>
                      <Input
                        type="number"
                        min="0"
                        value={orderForm.payment_type}  onChange={(e) => setOrderForm((prev) => ({ ...prev, payment_type : e.target.value }))}
                        placeholder="2"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-black/60">Cliente ID</label>
                      <Input
                        type="number"
                        min="1"
                        value={orderForm.client_id}  onChange={(e) => setOrderForm((prev) => ({ ...prev, client_id : e.target.value }))}
                        placeholder="ID cliente"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-black/60">Factura ID</label>
                      <Input
                        type="number"
                        min="1"
                        value={orderForm.bill_id}  onChange={(e) => setOrderForm((prev) => ({ ...prev, bill_id : e.target.value }))}
                        placeholder="ID factura"
                      />
                    </div>
                    <div className="flex items-end gap-2 md:col-span-2 lg:col-span-2">
                      <Button type="submit" size="sm" disabled={orderSaving || !hasApi}>
                        {orderSaving ? "Guardando..." : orderMode === "edit" ? "Actualizar" : "Crear"}
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={resetOrderForm}>
                        Limpiar
                      </Button>
                    </div>
                  </form>

                  <div className="overflow-hidden rounded-2xl border border-black/10">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-black/5 text-xs text-black/60">
                        <tr>
                          <th className="px-4 py-2">Orden</th>
                          <th className="px-4 py-2">Cliente</th>
                          <th className="px-4 py-2">Estado</th>
                          <th className="px-4 py-2 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => {
                          const id = String(order.id_key ?? "");
                          return (
                            <tr key={id} className="border-t border-black/5">
                              <td className="px-4 py-2">
                                <div className="font-medium">#{id || "-"}</div>
                                <div className="text-xs text-black/50">Factura: {order.bill_id ?? "-"}</div>
                              </td>
                              <td className="px-4 py-2 text-xs text-black/70">
                                {order.client_id ?? "-"}
                              </td>
                              <td className="px-4 py-2 text-xs text-black/70">
                                Estado: {order.status ?? "-"}
                              </td>
                              <td className="px-4 py-2 text-right">
                                <div className="inline-flex gap-2">
                                  <Button variant="outline" size="sm" onClick={() => editOrder(order)}>
                                    Editar
                                  </Button>
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={async () => {
                                      if (!hasApi) {
                                        setError("Configura VITE_API_URL para habilitar el CRUD real.");
                                        return;
                                      }
                                      if (!id) return;
                                      const ok = window.confirm(`Eliminar orden #${id}`);
                                      if (!ok) return;

                                      setDeletingOrderIds((prev) => ({ ...prev, [id]: true }));
                                      setError("");

                                      try {
                                        await deleteResource(endpoints.orders, id);
                                        setOrders((prev) => prev.filter((o) => String(o.id_key) !== id));
                                        if (orderForm.id === id) resetOrderForm();
                                      } catch (e: any) {
                                        setError(e.message || "Error eliminando orden");
                                      } finally {
                                        setDeletingOrderIds((prev) => ({ ...prev, [id]: false }));
                                      }
                                    }}
                                    disabled={deletingOrderIds[id]}
                                  >
                                    {deletingOrderIds[id] ? "Eliminando..." : "Eliminar"}
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {!orders.length && (
                          <tr>
                            <td colSpan={4} className="px-4 py-4 text-center text-xs text-black/60">
                              No hay ordenes cargadas.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="rounded-2xl border border-black/10 p-3">
                    <div className="mb-2 text-xs font-semibold text-black/60">Items de orden</div>
                    <form  className="grid gap-3 md:grid-cols-[1fr_1fr] lg:grid-cols-[1fr_1fr_1fr] items-end"
                      onSubmit={onOrderDetailSubmit}
                    >
                      <div>
                        <label className="text-xs text-black/60">Orden ID</label>
                        <Input
                          type="number"
                          min="1"
                          value={orderDetailForm.order_id}  onChange={(e) => setOrderDetailForm((prev) => ({ ...prev, order_id : e.target.value }))}
                          placeholder="ID orden"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-black/60">Producto ID</label>
                        <Input
                          type="number"
                          min="1"
                          value={orderDetailForm.product_id}  onChange={(e) => setOrderDetailForm((prev) => ({ ...prev, product_id : e.target.value }))}
                          placeholder="ID producto"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-black/60">Cantidad</label>
                        <Input
                          type="number"
                          min="1"
                          value={orderDetailForm.quantity}  onChange={(e) => setOrderDetailForm((prev) => ({ ...prev, quantity : e.target.value }))}
                          placeholder="1"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-black/60">Precio</label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={orderDetailForm.price}  onChange={(e) => setOrderDetailForm((prev) => ({ ...prev, price : e.target.value }))}
                          placeholder="0"
                        />
                      </div>
                      <div className="flex items-end gap-2 md:col-span-2 lg:col-span-2">
                        <Button type="submit" size="sm" disabled={orderDetailSaving || !hasApi || !orderDetailForm.id}>
                          {orderDetailSaving ? "Guardando..." : "Actualizar"}
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={resetOrderDetailForm}>
                          Limpiar
                        </Button>
                      </div>
                    </form>

                    <div className="mt-3 overflow-hidden rounded-2xl border border-black/10">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-black/5 text-xs text-black/60">
                          <tr>
                            <th className="px-4 py-2">Orden</th>
                            <th className="px-4 py-2">Producto</th>
                            <th className="px-4 py-2">Cantidad</th>
                            <th className="px-4 py-2">Precio</th>
                            <th className="px-4 py-2 text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orderDetails.map((detail) => {
                            const id = String(detail.id_key ?? "");
                            return (
                              <tr key={id} className="border-t border-black/5">
                                <td className="px-4 py-2 text-xs text-black/70">{detail.order_id ?? "-"}</td>
                                <td className="px-4 py-2 text-xs text-black/70">{detail.product_id ?? "-"}</td>
                                <td className="px-4 py-2 text-xs text-black/70">{detail.quantity ?? "-"}</td>
                                <td className="px-4 py-2 text-xs text-black/70">{detail.price ?? "-"}</td>
                                <td className="px-4 py-2 text-right">
                                  <div className="inline-flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => editOrderDetail(detail)}>
                                      Editar
                                    </Button>
                                    <Button
                                      variant="danger"
                                      size="sm"
                                      onClick={async () => {
                                        if (!hasApi) {
                                          setError("Configura VITE_API_URL para habilitar el CRUD real.");
                                          return;
                                        }
                                        if (!id) return;
                                        const ok = window.confirm(`Eliminar item #${id}`);
                                        if (!ok) return;

                                        setDeletingOrderDetailIds((prev) => ({ ...prev, [id]: true }));
                                        setError("");

                                        try {
                                          await deleteResource(endpoints.orderDetails, id);
                                          setOrderDetails((prev) => prev.filter((d) => String(d.id_key) !== id));
                                          if (orderDetailForm.id === id) resetOrderDetailForm();
                                        } catch (e: any) {
                                          setError(e.message || "Error eliminando item");
                                        } finally {
                                          setDeletingOrderDetailIds((prev) => ({ ...prev, [id]: false }));
                                        }
                                      }}
                                      disabled={deletingOrderDetailIds[id]}
                                    >
                                      {deletingOrderDetailIds[id] ? "Eliminando..." : "Eliminar"}
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                          {!orderDetails.length && (
                            <tr>
                              <td colSpan={5} className="px-4 py-4 text-center text-xs text-black/60">
                                No hay items cargados.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle>Direcciones</CardTitle>
                  <div className="text-xs text-black/60">Total: {addresses.length}</div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <form  className="grid gap-3 md:grid-cols-[1fr_1fr] lg:grid-cols-[1fr_1fr_1fr] items-end"
                    onSubmit={onAddressSubmit}
                  >
                    <div>
                      <label className="text-xs text-black/60">Calle</label>
                      <Input
                        value={addressForm.street}  onChange={(e) => setAddressForm((prev) => ({ ...prev, street : e.target.value }))}
                        placeholder="Calle"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-black/60">Numero</label>
                      <Input
                        value={addressForm.number}  onChange={(e) => setAddressForm((prev) => ({ ...prev, number : e.target.value }))}
                        placeholder="Numero"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-black/60">Ciudad</label>
                      <Input
                        value={addressForm.city}  onChange={(e) => setAddressForm((prev) => ({ ...prev, city : e.target.value }))}
                        placeholder="Ciudad"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-black/60">Provincia</label>
                      <Input
                        value={addressForm.province}  onChange={(e) => setAddressForm((prev) => ({ ...prev, province : e.target.value }))}
                        placeholder="Provincia"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-black/60">Pais</label>
                      <Input
                        value={addressForm.country}  onChange={(e) => setAddressForm((prev) => ({ ...prev, country : e.target.value }))}
                        placeholder="Pais"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-black/60">Codigo postal</label>
                      <Input
                        value={addressForm.postal_code}  onChange={(e) => setAddressForm((prev) => ({ ...prev, postal_code : e.target.value }))}
                        placeholder="Codigo postal"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-black/60">Cliente ID</label>
                      <Input
                        type="number"
                        min="1"
                        value={addressForm.client_id}  onChange={(e) => setAddressForm((prev) => ({ ...prev, client_id : e.target.value }))}
                        placeholder="ID cliente"
                      />
                    </div>
                    <div className="flex items-end gap-2 md:col-span-2 lg:col-span-2">
                      <Button type="submit" size="sm" disabled={addressSaving || !hasApi}>
                        {addressSaving ? "Guardando..." : addressMode === "edit" ? "Actualizar" : "Crear"}
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={resetAddressForm}>
                        Limpiar
                      </Button>
                    </div>
                  </form>

                  <div className="overflow-hidden rounded-2xl border border-black/10">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-black/5 text-xs text-black/60">
                        <tr>
                          <th className="px-4 py-2">Direccion</th>
                          <th className="px-4 py-2">Cliente</th>
                          <th className="px-4 py-2 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {addresses.map((address) => {
                          const id = String(address.id_key ?? "");
                          const label = `${address.street || "-"} ${address.number || ""}`.trim();
                          const meta = [address.city, address.province, address.country, address.postal_code]
                            .filter(Boolean)
                            .join("  -  ");
                          const client = clients.find((c) => String(c.id_key) === String(address.client_id));
                          const baseClientLabel = client ? [client.name, client.lastname].filter(Boolean).join(" ") || client.email || String(client.id_key ?? "") : address.client_id ?? "-";
                          const clientLabel = client?.id_key ? `${baseClientLabel} (${client.id_key})` : baseClientLabel;
                          return (
                            <tr key={id} className="border-t border-black/5">
                              <td className="px-4 py-2">
                                <div className="font-medium">{label || "-"}</div>
                                <div className="text-xs text-black/50">{meta || "-"}</div>
                              </td>
                              <td className="px-4 py-2 text-xs text-black/70">
                                {clientLabel}
                              </td>
                              <td className="px-4 py-2 text-right">
                                <div className="inline-flex gap-2">
                                  <Button variant="outline" size="sm" onClick={() => editAddress(address)}>
                                    Editar
                                  </Button>
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={async () => {
                                      if (!hasApi) {
                                        setError("Configura VITE_API_URL para habilitar el CRUD real.");
                                        return;
                                      }
                                      if (!id) return;
                                      const ok = window.confirm(`Eliminar direccion #${id}`);
                                      if (!ok) return;

                                      setDeletingAddressIds((prev) => ({ ...prev, [id]: true }));
                                      setError("");

                                      try {
                                        await deleteResource(endpoints.addresses, id);
                                        setAddresses((prev) => prev.filter((a) => String(a.id_key) !== id));
                                        if (addressForm.id === id) resetAddressForm();
                                      } catch (e: any) {
                                        setError(e.message || "Error eliminando direccion");
                                      } finally {
                                        setDeletingAddressIds((prev) => ({ ...prev, [id]: false }));
                                      }
                                    }}
                                    disabled={deletingAddressIds[id]}
                                  >
                                    {deletingAddressIds[id] ? "Eliminando..." : "Eliminar"}
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {!addresses.length && (
                          <tr>
                            <td colSpan={3} className="px-4 py-4 text-center text-xs text-black/60">
                              No hay direcciones cargadas.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle>Reviews</CardTitle>
                  <div className="text-xs text-black/60">Total: {reviews.length}</div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <form  className="grid gap-3 md:grid-cols-[1fr_1fr] lg:grid-cols-[1fr_1fr_1fr] items-end"
                    onSubmit={onReviewSubmit}
                  >
                    <div>
                      <label className="text-xs text-black/60">Calificacion</label>
                      <Input
                        type="number"
                        min="1"
                        max="5"
                        value={reviewForm.rating}  onChange={(e) => setReviewForm((prev) => ({ ...prev, rating : e.target.value }))}
                        placeholder="5"
                      />
                    </div>
                    <div className="md:col-span-2 lg:col-span-2">
                      <label className="text-xs text-black/60">Comentario</label>
                      <Input
                        value={reviewForm.comment}  onChange={(e) => setReviewForm((prev) => ({ ...prev, comment : e.target.value }))}
                        placeholder="Comentario"
                      />
                    </div>
                    <div className="flex items-end gap-2 md:col-span-2 lg:col-span-2">
                      <Button type="submit" size="sm" disabled={reviewSaving || !hasApi || !reviewForm.id}>
                        {reviewSaving ? "Guardando..." : "Actualizar"}
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={resetReviewForm}>
                        Limpiar
                      </Button>
                    </div>
                  </form>

                  <div className="overflow-hidden rounded-2xl border border-black/10">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-black/5 text-xs text-black/60">
                        <tr>
                          <th className="px-4 py-2">Producto</th>
                          <th className="px-4 py-2">Usuario</th>
                          <th className="px-4 py-2">Rating</th>
                          <th className="px-4 py-2 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reviews.map((review) => {
                          const id = String(review.id_key ?? "");
                          return (
                            <tr key={id} className="border-t border-black/5">
                              <td className="px-4 py-2 text-xs text-black/70">{review.product_id ?? "-"}</td>
                              <td className="px-4 py-2 text-xs text-black/70">{review.user_id ?? "-"}</td>
                              <td className="px-4 py-2 text-xs text-black/70">{review.rating ?? "-"}</td>
                              <td className="px-4 py-2 text-right">
                                <div className="inline-flex gap-2">
                                  <Button variant="outline" size="sm" onClick={() => editReview(review)}>
                                    Editar
                                  </Button>
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={async () => {
                                      if (!hasApi) {
                                        setError("Configura VITE_API_URL para habilitar el CRUD real.");
                                        return;
                                      }
                                      if (!id) return;
                                      const ok = window.confirm(`Eliminar review #${id}`);
                                      if (!ok) return;

                                      setDeletingReviewIds((prev) => ({ ...prev, [id]: true }));
                                      setError("");

                                      try {
                                        await deleteResource(endpoints.reviews, id);
                                        setReviews((prev) => prev.filter((r) => String(r.id_key) !== id));
                                        if (reviewForm.id === id) resetReviewForm();
                                      } catch (e: any) {
                                        setError(e.message || "Error eliminando review");
                                      } finally {
                                        setDeletingReviewIds((prev) => ({ ...prev, [id]: false }));
                                      }
                                    }}
                                    disabled={deletingReviewIds[id]}
                                  >
                                    {deletingReviewIds[id] ? "Eliminando..." : "Eliminar"}
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {!reviews.length && (
                          <tr>
                            <td colSpan={4} className="px-4 py-4 text-center text-xs text-black/60">
                              No hay reviews cargadas.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="self-start">
              <CardHeader>
                <CardTitle>{mode === "edit" ? "Editar producto" : "Nuevo producto"}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <form className="space-y-3" onSubmit={onSubmit}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs text-black/60">Nombre</label>
                      <Input
                        value={form.name}  onChange={(e) => setForm((prev) => ({ ...prev, name : e.target.value }))}
                        placeholder="Nombre corto"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-black/60">Categoria</label>
                      {categories.length ? (
                        <select  className="h-10 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-black/10"
                          value={form.category_id}  onChange={(e) => setForm((prev) => ({ ...prev, category_id : e.target.value }))}
                        >
                          <option value="">Selecciona una categoria</option>
                          {categories.map((cat) => (
                            <option key={String(cat.id_key)} value={String(cat.id_key)}>
                              {cat.name ?? `Categoria ${cat.id_key}`}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Input
                          type="number"
                          min="1"
                          value={form.category_id}  onChange={(e) => setForm((prev) => ({ ...prev, category_id : e.target.value }))}
                          placeholder="ID de categoria"
                        />
                      )}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs text-black/60">Precio</label>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={form.price}  onChange={(e) => setForm((prev) => ({ ...prev, price : e.target.value }))}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-black/60">Stock</label>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={form.stock}  onChange={(e) => setForm((prev) => ({ ...prev, stock : e.target.value }))}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs text-black/60">Imagen (URL)</label>
                      <Input
                        value={form.image_url}
                        onChange={(e) => setForm((prev) => ({ ...prev, image_url: e.target.value }))}
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <label className="text-xs text-black/60">Imagen (archivo)</label>
                      <input
                        type="file"
                        accept="image/*"  className="h-10 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-black/10"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadProductImage(file);
                        }}
                      />
                      {imageUploading && <div className="mt-1 text-xs text-black/50">Subiendo imagen...</div>}
                    </div>
                  </div>

                  <Separator />

                  <div className="flex flex-wrap items-center gap-2">
                    <Button type="submit" disabled={saving || !hasApi}>
                      {saving ? "Guardando..." : mode === "edit" ? "Actualizar" : "Crear"}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Limpiar
                    </Button>
                    {!hasApi && <span className="text-xs text-black/50">Define VITE_API_URL para habilitar CRUD.</span>}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
