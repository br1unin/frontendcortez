import React from "react";
import { ARS } from "../lib/money";
import { Button, Card, CardContent, CardHeader, CardTitle, Separator } from "./ui";

export default function Filters({
  categories,
  category,
  setCategory,
  sort,
  setSort,
  maxPrice,
  setMaxPrice,
  priceBounds,
  onReset,
}: {
  categories: string[];
  category: string;
  setCategory: (c: string) => void;
  sort: string;
  setSort: (s: string) => void;
  maxPrice: number;
  setMaxPrice: (n: number) => void;
  priceBounds: { min: number; max: number };
  onReset: () => void;
}) {
  const list = categories?.length ? categories : ["Todos"];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtros</CardTitle>
        <div className="text-xs text-black/60">Refiná tu búsqueda</div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <div className="mb-2 text-xs font-medium text-black/70">Categoría</div>
          <div className="flex flex-wrap gap-2">
            {list.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  category === c ? "border-black bg-black text-white" : "border-black/10 hover:bg-black/5"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 text-xs font-medium text-black/70">Precio máximo</div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-black/60">{ARS.format(priceBounds.min)}</span>
            <span className="font-semibold">≤ {ARS.format(maxPrice)}</span>
          </div>
          <input
            type="range"
            min={priceBounds.min}
            max={priceBounds.max}
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="mt-2 w-full"
          />
        </div>

        <div>
          <div className="mb-2 text-xs font-medium text-black/70">Ordenar</div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-10 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm"
          >
            <option value="relevancia">Relevancia</option>
            <option value="rating">Mejor puntuados</option>
            <option value="precio_asc">Precio: menor a mayor</option>
            <option value="precio_desc">Precio: mayor a menor</option>
          </select>
        </div>

        <Separator />
        <Button variant="outline" onClick={onReset} className="w-full">
          Resetear
        </Button>
      </CardContent>
    </Card>
  );
}
