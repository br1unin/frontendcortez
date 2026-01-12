import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "../components/ui";

type Address = {
  id_key: number;
  street: string;
  number: string;
  city: string;
  country: string;
  province: string;
  postal_code: string;
};

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch<Address[]>("/addresses/me");
      setAddresses(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message || "Error cargando direcciones");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function addAddress(e: React.FormEvent) {
    e.preventDefault();
    if (!street.trim() || !city.trim() || !country.trim() || !province.trim()) {
      setError("Completa calle, ciudad, pais y provincia.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const created = await apiFetch<Address>("/addresses/me", {
        method: "POST",
        body: {
          street: street.trim(),
          number: number.trim() || undefined,
          city: city.trim(),
          country: country.trim(),
          province: province.trim(),
          postal_code: postalCode.trim() || undefined,
        },
      });
      setAddresses((prev) => [created, ...prev]);
      setStreet("");
      setNumber("");
      setCity("");
      setCountry("");
      setProvince("");
      setPostalCode("");
    } catch (e: any) {
      setError(e.message || "Error guardando direccion");
    } finally {
      setSaving(false);
    }
  }

  async function deleteAddress(id: number | undefined) {
    if (!id) return;
    const ok = window.confirm("Eliminar esta direccion");
    if (!ok) return;
    try {
      await apiFetch(`/addresses/me/${id}`, { method: "DELETE" });
      setAddresses((prev) => prev.filter((a) => a.id_key !== id));
    } catch (e: any) {
      setError(e.message || "Error eliminando direccion");
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Direcciones</h1>
        <Button variant="outline" onClick={load}>
          Recargar
        </Button>
      </div>

      {loading && <div className="text-sm text-black/60">Cargando...</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      <Card>
        <CardHeader>
          <CardTitle>Mis direcciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {addresses.length === 0 ? (
            <div className="text-sm text-black/60">No hay direcciones guardadas.</div>
          ) : (
            addresses.map((a) => (
              <div
                key={a.id_key}
                className="flex items-center justify-between rounded-2xl border border-black/10 px-3 py-2 text-sm"
              >
                <div>
                  <div className="font-semibold">
                    {a.street || "-"} {a.number || ""}
                  </div>
                  <div className="text-xs text-black/60">
                    {a.city || "-"} - {a.province || "-"} - {a.country || "-"} - {a.postal_code || "-"}
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => deleteAddress(a.id_key)}>
                  Eliminar
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Agregar direccion</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <form className="space-y-3" onSubmit={addAddress}>
            <div>
              <label className="text-xs text-black/60">Calle</label>
              <Input value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Calle" />
            </div>
            <div>
              <label className="text-xs text-black/60">Numero</label>
              <Input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="Numero" />
            </div>
            <div>
              <label className="text-xs text-black/60">Ciudad</label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ciudad" />
            </div>
            <div>
              <label className="text-xs text-black/60">Provincia</label>
              <Input value={province} onChange={(e) => setProvince(e.target.value)} placeholder="Provincia" />
            </div>
            <div>
              <label className="text-xs text-black/60">Pais</label>
              <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Pais" />
            </div>
            <div>
              <label className="text-xs text-black/60">Codigo postal</label>
              <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="Codigo postal" />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Guardar direccion"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
