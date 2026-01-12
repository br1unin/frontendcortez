import { useEffect, useState } from "react";
import { ARS } from "../lib/money";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Separator } from "./ui";
import { apiFetch } from "../api/client";
import { endpoints } from "../api/endpoints";

export default function Checkout({
  cartLines,
  onBack,
  onPlaceOrder,
}: {
  cartLines: { items: any[]; subtotal: number; shipping: number; total: number };
  onBack: () => void;
  onPlaceOrder: (data: {
    name: string;
    lastname: string;
    email: string;
    addressId: number;
    paymentType: number;
  }) => void;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [lastname, setLastname] = useState("");
  const [addresses, setAddresses] = useState<any[]>([]);
  const [methods, setMethods] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<number | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [savingMethod, setSavingMethod] = useState(false);
  const [error, setError] = useState("");
  const [addressError, setAddressError] = useState("");
  const [cardError, setCardError] = useState("");
  const [addressForm, setAddressForm] = useState({
    street: "",
    number: "",
    city: "",
    country: "",
    province: "",
    postal_code: "",
  });
  const [methodForm, setMethodForm] = useState({
    brand: "",
    number: "",
    cvv: "",
    exp_month: "",
    exp_year: "",
    is_default: false,
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const me = await apiFetch<{ email: string; name: string; lastname: string }>("/auth/me");
        const addr = await apiFetch<any[]>(`${endpoints.addresses}me`);
        const pay = await apiFetch<any[]>(endpoints.billingMethods);
        if (cancelled) return;
        setEmail(me.email || "");
        setName(me.name || "");
        setLastname(me.lastname || "");
        setAddresses(Array.isArray(addr) ? addr : []);
        setMethods(Array.isArray(pay) ? pay : []);
        setSelectedAddress((Array.isArray(addr) && addr[0]?.id_key) || null);
        setSelectedMethod((Array.isArray(pay) && pay[0]?.id_key) || null);
      } catch (e: any) {
        if (!cancelled) setError(e.message || "Error cargando checkout");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const canSubmit =
    cartLines.items.length > 0 && email.includes("@") && Boolean(selectedAddress) && Boolean(selectedMethod);

  async function addAddress(e: React.FormEvent) {
    e.preventDefault();
    if (!addressForm.street.trim() || !addressForm.city.trim() || !addressForm.country.trim() || !addressForm.province.trim()) {
      setAddressError("Completa calle, ciudad, pais y provincia.");
      return;
    }
    setSavingAddress(true);
    setError("");
    setAddressError("");
    try {
      const created = await apiFetch<any>("/addresses/me", {
        method: "POST",
        body: {
          street: addressForm.street.trim(),
          number: addressForm.number.trim() || undefined,
          city: addressForm.city.trim(),
          country: addressForm.country.trim(),
          province: addressForm.province.trim(),
          postal_code: addressForm.postal_code.trim() || undefined,
        },
      });
      setAddresses((prev) => [created, ...prev]);
      setSelectedAddress(created.id_key || null);
      setAddressForm({ street: "", number: "", city: "", country: "", province: "", postal_code: "" });
    } catch (e: any) {
      setAddressError(e.message || "Error guardando direccion");
    } finally {
      setSavingAddress(false);
    }
  }

  async function addMethod(e: React.FormEvent) {
    e.preventDefault();
    const number = methodForm.number.replace(/\s+/g, "");
    const cvv = methodForm.cvv.trim();
    const last4 = number.slice(-4);
    const expMonth = Number(methodForm.exp_month);
    const expYear = Number(methodForm.exp_year);
    if (!/^\d{13,19}$/.test(number) || !luhnCheck(number)) {
      setCardError("El numero de tarjeta no es valido.");
      return;
    }
    if (!/^\d{3,4}$/.test(cvv)) {
      setCardError("El codigo de seguridad no es valido.");
      return;
    }
    if (!Number.isFinite(expMonth) || expMonth < 1 || expMonth > 12 || !Number.isFinite(expYear)) {
      setCardError("La fecha de vencimiento no es valida.");
      return;
    }
    if (isExpired(expMonth, expYear)) {
      setCardError("La tarjeta esta vencida.");
      return;
    }
    setSavingMethod(true);
    setError("");
    setCardError("");
    try {
      const brand = methodForm.brand.trim() || inferBrand(number);
      const created = await apiFetch<any>(endpoints.billingMethods, {
        method: "POST",
        body: {
          brand,
          last4,
          exp_month: expMonth,
          exp_year: expYear,
          is_default: methodForm.is_default || methods.length === 0,
        },
      });
      setMethods((prev) => [created, ...prev]);
      setSelectedMethod(created.id_key || null);
      setMethodForm({ brand: "", number: "", cvv: "", exp_month: "", exp_year: "", is_default: false });
    } catch (e: any) {
      setCardError(e.message || "Error guardando metodo");
    } finally {
      setSavingMethod(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
      <Card>
        <CardHeader>
          <CardTitle>Checkout</CardTitle>
          <div className="text-xs text-black/60">Datos del comprador</div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <div className="text-xs text-red-600">{error}</div>}
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <div className="mb-2 text-xs font-medium text-black/70">Nombre</div>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Bruno" disabled={loading} />
            </div>
            <div>
              <div className="mb-2 text-xs font-medium text-black/70">Apellido</div>
              <Input value={lastname} onChange={(e) => setLastname(e.target.value)} placeholder="Perez" disabled={loading} />
            </div>
            <div>
              <div className="mb-2 text-xs font-medium text-black/70">Email *</div>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" disabled={loading} />
            </div>
          </div>

          <div>
            <div className="mb-2 text-xs font-medium text-black/70">Direccion de envio</div>
            {addresses.length === 0 ? (
              <div className="text-xs text-black/60">No tenes direcciones guardadas.</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {addresses.map((a) => (
                  <button
                    key={a.id_key}
                    onClick={() => setSelectedAddress(a.id_key)}
                    className={`rounded-2xl border px-3 py-2 text-xs transition ${
                      selectedAddress === a.id_key ? "border-black bg-black text-white" : "border-black/10 hover:bg-black/5"
                    }`}
                  >
                    {a.street} {a.number} - {a.city}
                  </button>
                ))}
              </div>
            )}
            {addressError && <div className="mt-2 text-xs text-red-600">{addressError}</div>}
            <form className="mt-3 grid gap-3 md:grid-cols-2" onSubmit={addAddress}>
              <div>
                <div className="mb-2 text-xs font-medium text-black/70">Calle</div>
                <Input
                  value={addressForm.street}
                  onChange={(e) => setAddressForm((prev) => ({ ...prev, street: e.target.value }))}
                  placeholder="Calle"
                  disabled={savingAddress}
                />
              </div>
              <div>
                <div className="mb-2 text-xs font-medium text-black/70">Numero</div>
                <Input
                  value={addressForm.number}
                  onChange={(e) => setAddressForm((prev) => ({ ...prev, number: e.target.value }))}
                  placeholder="Numero"
                  disabled={savingAddress}
                />
              </div>
              <div>
                <div className="mb-2 text-xs font-medium text-black/70">Ciudad</div>
                <Input
                  value={addressForm.city}
                  onChange={(e) => setAddressForm((prev) => ({ ...prev, city: e.target.value }))}
                  placeholder="Ciudad"
                  disabled={savingAddress}
                />
              </div>
              <div>
                <div className="mb-2 text-xs font-medium text-black/70">Provincia</div>
                <Input
                  value={addressForm.province}
                  onChange={(e) => setAddressForm((prev) => ({ ...prev, province: e.target.value }))}
                  placeholder="Provincia"
                  disabled={savingAddress}
                />
              </div>
              <div>
                <div className="mb-2 text-xs font-medium text-black/70">Pais</div>
                <Input
                  value={addressForm.country}
                  onChange={(e) => setAddressForm((prev) => ({ ...prev, country: e.target.value }))}
                  placeholder="Pais"
                  disabled={savingAddress}
                />
              </div>
              <div>
                <div className="mb-2 text-xs font-medium text-black/70">Codigo postal</div>
                <Input
                  value={addressForm.postal_code}
                  onChange={(e) => setAddressForm((prev) => ({ ...prev, postal_code: e.target.value }))}
                  placeholder="Codigo postal"
                  disabled={savingAddress}
                />
              </div>
              <div className="md:col-span-2">
                <Button type="submit" disabled={savingAddress}>
                  {savingAddress ? "Guardando..." : "Agregar direccion"}
                </Button>
              </div>
            </form>
          </div>

          <div>
            <div className="mb-2 text-xs font-medium text-black/70">Pago</div>
            {methods.length === 0 ? (
              <div className="text-xs text-black/60">No tenes metodos de pago guardados.</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {methods.map((m) => (
                  <button
                    key={m.id_key}
                    onClick={() => setSelectedMethod(m.id_key)}
                    className={`rounded-2xl border px-3 py-2 text-xs transition ${
                      selectedMethod === m.id_key ? "border-black bg-black text-white" : "border-black/10 hover:bg-black/5"
                    }`}
                  >
                    {String(m.brand || "card").toUpperCase()} **** {m.last4}
                  </button>
                ))}
              </div>
            )}
            {cardError && <div className="mt-2 text-xs text-red-600">{cardError}</div>}
            <form className="mt-3 grid gap-3 md:grid-cols-2" onSubmit={addMethod}>
              <div>
                <div className="mb-2 text-xs font-medium text-black/70">Marca</div>
                <Input
                  value={methodForm.brand}
                  onChange={(e) => setMethodForm((prev) => ({ ...prev, brand: e.target.value }))}
                  placeholder="Visa"
                  disabled={savingMethod}
                />
              </div>
              <div>
                <div className="mb-2 text-xs font-medium text-black/70">Numero de tarjeta</div>
                <Input
                  value={methodForm.number}
                  onChange={(e) => setMethodForm((prev) => ({ ...prev, number: e.target.value }))}
                  placeholder="4242 4242 4242 4242"
                  disabled={savingMethod}
                />
              </div>
              <div>
                <div className="mb-2 text-xs font-medium text-black/70">Fecha vencimiento (mes)</div>
                <Input
                  value={methodForm.exp_month}
                  onChange={(e) => setMethodForm((prev) => ({ ...prev, exp_month: e.target.value }))}
                  placeholder="11"
                  disabled={savingMethod}
                />
              </div>
              <div>
                <div className="mb-2 text-xs font-medium text-black/70">Fecha vencimiento (ano)</div>
                <Input
                  value={methodForm.exp_year}
                  onChange={(e) => setMethodForm((prev) => ({ ...prev, exp_year: e.target.value }))}
                  placeholder="2028"
                  disabled={savingMethod}
                />
              </div>
              <div>
                <div className="mb-2 text-xs font-medium text-black/70">Codigo seguridad</div>
                <Input
                  value={methodForm.cvv}
                  onChange={(e) => setMethodForm((prev) => ({ ...prev, cvv: e.target.value }))}
                  placeholder="123"
                  disabled={savingMethod}
                />
              </div>
              <div className="md:col-span-2 flex items-center gap-2 text-xs text-black/60">
                <input
                  type="checkbox"
                  checked={methodForm.is_default}
                  onChange={(e) => setMethodForm((prev) => ({ ...prev, is_default: e.target.checked }))}
                />
                Guardar como predeterminado
              </div>
              <div className="md:col-span-2">
                <Button type="submit" disabled={savingMethod}>
                  {savingMethod ? "Guardando..." : "Agregar metodo"}
                </Button>
              </div>
            </form>
          </div>

          <Separator />

          <div className="flex gap-2">
            <Button variant="outline" onClick={onBack} className="flex-1">
              Volver
            </Button>
            <Button
              onClick={() =>
                onPlaceOrder({
                  name,
                  lastname,
                  email,
                  addressId: selectedAddress ?? 0,
                  paymentType: selectedMethod ?? 2,
                })
              }
              className="flex-1"
              disabled={!canSubmit}
            >
              Confirmar compra
            </Button>
          </div>

          <div className="text-xs text-black/60">* Selecciona direccion y metodo antes de confirmar.</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resumen</CardTitle>
          <div className="text-xs text-black/60">Tu pedido</div>
        </CardHeader>
        <CardContent className="space-y-3">
          {cartLines.items.map(({ product, qty, lineTotal }) => (
            <div key={String(product.id_key ?? product.id)} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{product.name || product.title || "Producto"}</div>
                <div className="text-xs text-black/60">x{qty}</div>
              </div>
              <div className="text-sm">{ARS.format(lineTotal)}</div>
            </div>
          ))}

          <Separator />

          <div className="space-y-2 text-sm">
            <Row label="Subtotal" value={ARS.format(cartLines.subtotal)} />
            <Row label="Envio" value={cartLines.shipping === 0 ? "Gratis" : ARS.format(cartLines.shipping)} />
            <div className="h-px w-full bg-black/10" />
            <Row label={<span className="font-semibold">Total</span>} value={ARS.format(cartLines.total)} />
          </div>

          <div className="rounded-3xl bg-black/5 p-4 text-xs text-black/60">
            Envio gratis a partir de {ARS.format(65000)}.
          </div>
        </CardContent>
      </Card>
    </div>
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

function luhnCheck(value: string) {
  let sum = 0;
  let shouldDouble = false;
  for (let i = value.length - 1; i >= 0; i -= 1) {
    let digit = Number(value[i]);
    if (Number.isNaN(digit)) return false;
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

function isExpired(expMonth: number, expYear: number) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  if (expYear < year) return true;
  if (expYear === year && expMonth < month) return true;
  return false;
}

function inferBrand(number: string) {
  if (/^4/.test(number)) return "Visa";
  if (/^5[1-5]/.test(number) || /^2(2[2-9]|[3-6]|7[01])/.test(number)) return "Mastercard";
  if (/^3[47]/.test(number)) return "Amex";
  return "Card";
}
