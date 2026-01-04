import React from "react";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <section className="rounded-3xl border border-black/10 bg-white p-6">
      <h1 className="text-xl font-semibold">Página no encontrada</h1>
      <p className="mt-2 text-sm text-black/60">No encontramos la ruta. Volvé a la tienda principal.</p>
      <Link className="mt-4 inline-flex rounded-2xl bg-black px-4 py-2 text-sm text-white" to="/">
        Ir a la tienda
      </Link>
    </section>
  );
}