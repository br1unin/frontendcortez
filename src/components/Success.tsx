import React from "react";
import { Check } from "lucide-react";
import { Button, Card, CardContent } from "./ui";

export default function Success({ onContinue }: { onContinue: () => void }) {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-black text-white">
          <Check className="h-6 w-6" />
        </div>
        <div className="text-xl font-semibold">¡Compra confirmada!</div>
        <div className="mt-2 text-sm text-black/60">
          Esto es una demo. Acá mostrarías número de orden, tracking, etc.
        </div>
        <div className="mt-6">
          <Button onClick={onContinue}>Seguir comprando</Button>
        </div>
      </CardContent>
    </Card>
  );
}
