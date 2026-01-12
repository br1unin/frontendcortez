import { useEffect, useState } from "react";
import { listResource, getResource } from "../api/crud";
import { endpoints } from "../api/endpoints";
import { normalizeBill } from "../api/adapters";
import { ARS } from "../lib/money";
import { apiFetch } from "../api/client";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Separator } from "../components/ui";

type BillingMethod = {
  id_key: number;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
};

export default function BillingPage() {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [selected, setSelected] = useState<any | null>(null);

  const [methods, setMethods] = useState<BillingMethod[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(false);
  const [savingMethod, setSavingMethod] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [expMonth, setExpMonth] = useState("");
  const [expYear, setExpYear] = useState("");
  const [cardError, setCardError] = useState("");

  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [lastname, setLastname] = useState("");
  const [country, setCountry] = useState("");
  const [province, setProvince] = useState("");
  const [locality, setLocality] = useState("");
  const [street, setStreet] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [extraInfo, setExtraInfo] = useState("");

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const res: any = await listResource(endpoints.bills, { skip: 0, limit: 200 });
      const arr = Array.isArray(res) ? res : res.items ?? [];
      setBills(arr.map(normalizeBill));
    } catch (e: any) {
      setErr(e.message || "Error cargando facturas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      setProfileLoading(true);
      setProfileError("");
      try {
        const me = await apiFetch<{
          email: string;
          name: string;
          lastname: string;
          country: string;
          province: string;
          locality: string;
          street: string;
          postal_code: string;
          extra_info: string;
        }>("/auth/me");
        if (cancelled) return;
        setEmail(me.email || "");
        setName(me.name || "");
        setLastname(me.lastname || "");
        setCountry(me.country || "");
        setProvince(me.province || "");
        setLocality(me.locality || "");
        setStreet(me.street || "");
        setPostalCode(me.postal_code || "");
        setExtraInfo(me.extra_info || "");
      } catch (e: any) {
        if (!cancelled) setProfileError(e.message || "Error cargando perfil");
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    }
    loadProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadMethods() {
      setLoadingMethods(true);
      setErr("");
      try {
        const data = await apiFetch<BillingMethod[]>(endpoints.billingMethods);
        if (!cancelled) setMethods(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (!cancelled) setErr(e.message || "Error cargando metodos");
      } finally {
        if (!cancelled) setLoadingMethods(false);
      }
    }
    loadMethods();
    return () => {
      cancelled = true;
    };
  }, []);

  async function openBill(id: string) {
    try {
      const raw: any = await getResource(endpoints.bills, id);
      setSelected(normalizeBill(raw));
    } catch (e: any) {
      setErr(e.message || "Error leyendo factura");
    }
  }

  async function addMethod(e: React.FormEvent) {
    e.preventDefault();
    const digits = cardNumber.replace(/\D/g, "");
    const cvvDigits = cardCvv.replace(/\D/g, "");
    if (digits.length < 12 || digits.length > 19) {
      setCardError("Numero de tarjeta invalido.");
      return;
    }
    if (cvvDigits.length < 3 || cvvDigits.length > 4) {
      setCardError("Codigo de seguridad invalido.");
      return;
    }
    const month = Number(expMonth);
    const year = Number(expYear);
    if (!Number.isFinite(month) || month < 1 || month > 12) {
      setCardError("Mes invalido.");
      return;
    }
    if (!Number.isFinite(year) || year < 2020 || year > 2100) {
      setCardError("Ano invalido.");
      return;
    }
    if (!luhnCheck(digits)) {
      setCardError("Numero de tarjeta invalido.");
      return;
    }
    if (isExpired(month, year)) {
      setCardError("La tarjeta esta vencida.");
      return;
    }

    setSavingMethod(true);
    setErr("");
    setCardError("");
    try {
      const payload = {
        brand: inferBrand(digits),
        last4: digits.slice(-4),
        exp_month: month,
        exp_year: year,
      };
      const created = await apiFetch<BillingMethod>(endpoints.billingMethods, {
        method: "POST",
        body: payload,
      });
      setMethods((prev) => [created, ...prev]);
      setCardNumber("");
      setCardCvv("");
      setExpMonth("");
      setExpYear("");
    } catch (e: any) {
      setErr(e.message || "Error guardando metodo");
    } finally {
      setSavingMethod(false);
    }
  }

  async function deleteMethod(id: number | undefined) {
    if (!id) return;
    const ok = window.confirm("Eliminar este metodo");
    if (!ok) return;
    try {
      await apiFetch(`${endpoints.billingMethods}${id}`, { method: "DELETE" });
      setMethods((prev) => prev.filter((m) => m.id_key !== id));
    } catch (e: any) {
      setErr(e.message || "Error eliminando metodo");
    }
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError("");
    setProfileSuccess("");
    try {
      const updated = await apiFetch("/auth/me", {
        method: "PUT",
        body: {
          email: email.trim(),
          name: name.trim() || undefined,
          lastname: lastname.trim() || undefined,
          country: country.trim() || undefined,
          province: province.trim() || undefined,
          locality: locality.trim() || undefined,
          street: street.trim() || undefined,
          postal_code: postalCode.trim() || undefined,
          extra_info: extraInfo.trim() || undefined,
        },
      });
      setEmail((updated as any).email || "");
      setName((updated as any).name || "");
      setLastname((updated as any).lastname || "");
      setCountry((updated as any).country || "");
      setProvince((updated as any).province || "");
      setLocality((updated as any).locality || "");
      setStreet((updated as any).street || "");
      setPostalCode((updated as any).postal_code || "");
      setExtraInfo((updated as any).extra_info || "");
      setProfileSuccess("Datos guardados.");
    } catch (e: any) {
      setProfileError(e.message || "Error guardando datos");
    } finally {
      setProfileSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Facturacion</h1>
        <Button variant="outline" onClick={load}>Recargar</Button>
      </div>

      {loading && <div className="text-sm text-black/60">Cargando...</div>}
      {err && <div className="text-sm text-red-600">{err}</div>}
      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Metodos de pago</CardTitle>
            <div className="text-xs text-black/60">Se guarda solo marca, vencimiento y ultimos 4.</div>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingMethods ? (
              <div className="text-sm text-black/60">Cargando metodos...</div>
            ) : methods.length === 0 ? (
              <div className="text-sm text-black/60">No hay metodos guardados.</div>
            ) : (
              methods.map((m) => (
                <div key={m.id_key} className="flex items-center justify-between rounded-2xl border border-black/10 px-3 py-2 text-sm">
                  <div>
                    <div className="font-semibold">{m.brand.toUpperCase()} **** {m.last4}</div>
                    <div className="text-xs text-black/60">Vence {String(m.exp_month).padStart(2, "0")}/{m.exp_year}</div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => deleteMethod(m.id_key)}>
                    Eliminar
                  </Button>
                </div>
              ))
            )}

            {cardError && <div className="text-sm text-red-600">{cardError}</div>}

            <Separator />

            <form className="space-y-3" onSubmit={addMethod}>
              <div>
                <label className="text-xs text-black/60">Numero de tarjeta</label>
                <Input
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="0000 0000 0000 0000"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="text-xs text-black/60">Mes</label>
                  <Input
                    value={expMonth}
                    onChange={(e) => setExpMonth(e.target.value)}
                    placeholder="MM"
                  />
                </div>
                <div>
                  <label className="text-xs text-black/60">Ano</label>
                  <Input
                    value={expYear}
                    onChange={(e) => setExpYear(e.target.value)}
                    placeholder="YYYY"
                  />
                </div>
                <div>
                  <label className="text-xs text-black/60">CVV</label>
                  <Input
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    placeholder="123"
                  />
                </div>
              </div>
              <Button type="submit" disabled={savingMethod}>
                {savingMethod ? "Guardando..." : "Agregar metodo"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Datos de facturacion</CardTitle>
            <div className="text-xs text-black/60">Se guardan en tu cuenta.</div>
          </CardHeader>
          <CardContent className="pt-0">
            {profileError && <div className="mb-3 text-sm text-red-600">{profileError}</div>}
            {profileSuccess && <div className="mb-3 text-sm text-emerald-600">{profileSuccess}</div>}
            <form className="space-y-3" onSubmit={saveProfile}>
              <div>
                <label className="text-xs text-black/60">Email</label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} disabled={profileLoading} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs text-black/60">Nombre</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} disabled={profileLoading} />
                </div>
                <div>
                  <label className="text-xs text-black/60">Apellido</label>
                  <Input value={lastname} onChange={(e) => setLastname(e.target.value)} disabled={profileLoading} />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs text-black/60">Pais</label>
                  <Input value={country} onChange={(e) => setCountry(e.target.value)} disabled={profileLoading} />
                </div>
                <div>
                  <label className="text-xs text-black/60">Provincia</label>
                  <Input value={province} onChange={(e) => setProvince(e.target.value)} disabled={profileLoading} />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs text-black/60">Localidad</label>
                  <Input value={locality} onChange={(e) => setLocality(e.target.value)} disabled={profileLoading} />
                </div>
                <div>
                  <label className="text-xs text-black/60">Codigo postal</label>
                  <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} disabled={profileLoading} />
                </div>
              </div>
              <div>
                <label className="text-xs text-black/60">Calle</label>
                <Input value={street} onChange={(e) => setStreet(e.target.value)} disabled={profileLoading} />
              </div>
              <div>
                <label className="text-xs text-black/60">Datos extra (opcional)</label>
                <textarea  className="h-24 w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
                  value={extraInfo}
                  onChange={(e) => setExtraInfo(e.target.value)}
                  disabled={profileLoading}
                />
              </div>
              <Button type="submit" disabled={profileSaving || profileLoading}>
                {profileSaving ? "Guardando..." : "Guardar datos"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Facturas</CardTitle>
          <div className="text-xs text-black/60">Desde /bills</div>
        </CardHeader>
        <CardContent className="space-y-2">
          {bills.length === 0 ? (
            <div className="text-sm text-black/60">No hay facturas.</div>
          ) : (
            bills.map((b) => (
              <button
                key={b.id}
                onClick={() => openBill(b.id)}  className="w-full rounded-2xl border border-black/10 p-3 text-left hover:bg-black/5"
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold">Factura #{b.id}</div>
                  <div className="text-sm">{ARS.format(b.total)}</div>
                </div>
                <div className="text-xs text-black/60">
                  Orden: {b.orderId || "-"} - Estado: {b.status} - Fecha: {b.createdAt || "-"}
                </div>
              </button>
            ))
          )}
        </CardContent>
      </Card>

      {selected && (
        <Card>
          <CardHeader>
            <CardTitle>Detalle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><b>ID:</b> {selected.id}</div>
            <div><b>Orden:</b> {selected.orderId || "-"}</div>
            <div><b>Total:</b> {ARS.format(selected.total)}</div>
            <div><b>Estado:</b> {selected.status}</div>
            <div><b>Fecha:</b> {selected.createdAt || "-"}</div>

            <Button variant="outline" onClick={() => setSelected(null)}>Cerrar</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function luhnCheck(value: string) {
  let sum = 0;
  let doubleDigit = false;
  for (let i = value.length - 1; i >= 0; i -= 1) {
    let digit = Number(value[i]);
    if (doubleDigit) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    doubleDigit = !doubleDigit;
  }
  return sum % 10 == 0;
}

function isExpired(month: number, year: number) {
  const now = new Date();
  const exp = new Date(year, month - 1, 1);
  exp.setMonth(exp.getMonth() + 1);
  return exp <= now;
}

function inferBrand(digits: string) {
  if (/^4/.test(digits)) return "visa";
  if (/^5[1-5]/.test(digits)) return "mastercard";
  if (/^3[47]/.test(digits)) return "amex";
  return "other";
}
