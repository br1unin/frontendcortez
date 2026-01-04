import React from "react";

export default function FooterNote() {
  return (
    <div className="rounded-3xl border border-black/10 bg-white p-5 text-sm">
      <div className="font-semibold">Cómo conectarlo a un backend</div>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-black/70">
        <li>Consumí tu API con <code className="rounded bg-black/5 px-1">/products</code> y <code className="rounded bg-black/5 px-1">/categories</code>.</li>
        <li>Persistí el carrito en localStorage o en tu backend (usuarios logueados).</li>
        <li>En checkout: <code className="rounded bg-black/5 px-1">POST /clients</code>, <code className="rounded bg-black/5 px-1">POST /orders</code> y items con <code className="rounded bg-black/5 px-1">POST /order_details</code> (rate limited).</li>
      </ul>
    </div>
  );
}
