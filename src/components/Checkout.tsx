import React, { useState } from "react";
import { ARS } from "../lib/money";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Separator } from "./ui";

export default function Checkout({
  cartLines,
  onBack,
  onPlaceOrder,
}: {
  cartLines: { items: any[]; subtotal: number; shipping: number; total: number };
  onBack: () => void;
  onPlaceOrder: (data: { name?: string; email: string; address?: string; paymentMethod?: string }) => void;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [pay, setPay] = useState("mp");

  const canSubmit = cartLines.items.length > 0 && email.includes("@");

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
      <Card>
        <CardHeader>
          <CardTitle>Checkout</CardTitle>
          <div className="text-xs text-black/60">Datos del comprador (demo)</div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <div className="mb-2 text-xs font-medium text-black/70">Nombre</div>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Bruno" />
            </div>
            <div>
              <div className="mb-2 text-xs font-medium text-black/70">Email *</div>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" />
            </div>
          </div>

          <div>
            <div className="mb-2 text-xs font-medium text-black/70">Dirección</div>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Calle 123, Salta" />
          </div>

          <div>
            <div className="mb-2 text-xs font-medium text-black/70">Pago</div>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "mp", label: "Mercado Pago" },
                { id: "card", label: "Tarjeta" },
                { id: "cash", label: "Efectivo" },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setPay(m.id)}
                  className={`rounded-2xl border px-3 py-2 text-sm transition ${
                    pay === m.id ? "border-black bg-black text-white" : "border-black/10 hover:bg-black/5"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          <div className="flex gap-2">
            <Button variant="outline" onClick={onBack} className="flex-1">
              Volver
            </Button>
            <Button
              onClick={() => onPlaceOrder({ name, email, address, paymentMethod: pay })}
              className="flex-1"
              disabled={!canSubmit}
            >
              Confirmar compra
            </Button>
          </div>

          <div className="text-xs text-black/60">* En un proyecto real, acá conectás con tu backend y proveedor de pagos.</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resumen</CardTitle>
          <div className="text-xs text-black/60">Tu pedido</div>
        </CardHeader>
        <CardContent className="space-y-3">
          {cartLines.items.map(({ product, qty, lineTotal }) => (
            <div key={String(product.id)} className="flex items-center justify-between gap-3">
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
            <Row label="Envío" value={cartLines.shipping === 0 ? "Gratis" : ARS.format(cartLines.shipping)} />
            <div className="h-px w-full bg-black/10" />
            <Row label={<span className="font-semibold">Total</span>} value={ARS.format(cartLines.total)} />
          </div>

          <div className="rounded-3xl bg-black/5 p-4 text-xs text-black/60">
            Envío gratis a partir de {ARS.format(65000)}.
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
