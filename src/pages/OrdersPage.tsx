import { useEffect, useState } from "react";
import { apiFetch, getApiBase } from "../api/client";
import { ARS } from "../lib/money";
import { Button, Card, CardContent, CardHeader, CardTitle } from "../components/ui";

export default function OrdersPage() {
  const API_BASE = getApiBase();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<any | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      if (!API_BASE) {
        const stored = localStorage.getItem("mock_orders");
        const data = stored ? JSON.parse(stored) : [];
        setOrders(Array.isArray(data) ? data : []);
        return;
      }
      const data = await apiFetch<any[]>("/orders/me");
      setOrders(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message || "Error cargando ordenes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Ordenes</h1>
        <Button variant="outline" onClick={load}>
          Recargar
        </Button>
      </div>

      {loading && <div className="text-sm text-black/60">Cargando...</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      <Card>
        <CardHeader>
          <CardTitle>Historial</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {orders.length === 0 ? (
            <div className="text-sm text-black/60">No hay ordenes.</div>
          ) : (
            orders.map((o) => (
              <button
                key={o.id_key}
                onClick={() => setSelected(o)}
                className="w-full rounded-2xl border border-black/10 p-3 text-left hover:bg-black/5"
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold">Orden #{o.id_key}</div>
                  <div className="text-sm">{ARS.format(Number(o.total || 0))}</div>
                </div>
                <div className="text-xs text-black/60">
                  Items: {o.items.length || 0} - Estado: {o.status || "-"}
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
            <div>
              <b>Orden:</b> #{selected.id_key}
            </div>
            <div>
              <b>Estado:</b> {selected.status || "-"}
            </div>
            <div>
              <b>Total:</b> {ARS.format(Number(selected.total || 0))}
            </div>
            <div className="mt-2 space-y-2">
              {(selected.items || []).map((it: any, idx: number) => (
                <div key={`${it.product_id}-${idx}`} className="rounded-2xl border border-black/10 px-3 py-2">
                  <div className="font-semibold">{it.name || `Producto ${it.product_id}`}</div>
                  <div className="text-xs text-black/60">
                    Cantidad: {it.quantity} - Unitario: {ARS.format(Number(it.unit_price || 0))}
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" onClick={() => setSelected(null)}>
              Cerrar
            </Button>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
