import React, { useEffect, useState } from "react";
import { listResource, getResource } from "../api/crud";
import { endpoints } from "../api/endpoints";
import { normalizeBill } from "../api/adapters";
import { ARS } from "../lib/money";
import { Button, Card, CardContent, CardHeader, CardTitle } from "../components/ui";

export default function BillingPage() {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [selected, setSelected] = useState<any | null>(null);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const res: any = await listResource(endpoints.bills, { skip: 0, limit: 200 });
      const arr = Array.isArray(res) ? res : (res?.items ?? []);
      setBills(arr.map(normalizeBill));
    } catch (e: any) {
      setErr(e?.message || "Error cargando facturas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function openBill(id: string) {
    try {
      const raw: any = await getResource(endpoints.bills, id);
      setSelected(normalizeBill(raw));
    } catch (e: any) {
      setErr(e?.message || "Error leyendo factura");
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Facturación</h1>
        <Button variant="outline" onClick={load}>Recargar</Button>
      </div>

      {loading && <div className="text-sm text-black/60">Cargando…</div>}
      {err && <div className="text-sm text-red-600">{err}</div>}

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
                onClick={() => openBill(b.id)}
                className="w-full rounded-2xl border border-black/10 p-3 text-left hover:bg-black/5"
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold">Factura #{b.id}</div>
                  <div className="text-sm">{ARS.format(b.total)}</div>
                </div>
                <div className="text-xs text-black/60">
                  Orden: {b.orderId || "-"} • Estado: {b.status} • Fecha: {b.createdAt || "-"}
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
