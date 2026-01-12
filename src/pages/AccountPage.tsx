import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Badge } from "../components/ui";

export default function AccountPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [lastname, setLastname] = useState("");
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const me = await apiFetch<{
          email: string;
          name: string;
          lastname: string;
        }>("/auth/me");
        if (cancelled) return;
        setEmail(me.email || "");
        setName(me.name || "");
        setLastname(me.lastname || "");
        const reviews = await apiFetch<any[]>("/reviews/me").catch(() => []);
        if (!cancelled && Array.isArray(reviews)) setReviewCount(reviews.length);
      } catch (e: any) {
        if (!cancelled) setError(e.message || "Error cargando perfil");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const updated = await apiFetch<{
        email: string;
        name: string;
        lastname: string;
      }>("/auth/me", {
        method: "PUT",
        body: {
          email: email.trim(),
          name: name.trim() || undefined,
          lastname: lastname.trim() || undefined,
        },
      });
      setEmail(updated.email || "");
      setName(updated.name || "");
      setLastname(updated.lastname || "");
      setSuccess("Perfil actualizado.");
    } catch (e: any) {
      setError(e.message || "Error guardando perfil");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <Card>
        <CardHeader>
          <CardTitle>Cuenta</CardTitle>
          <div className="flex flex-wrap items-center gap-2 text-sm text-black/60">
            <span>Actualiza tus datos personales.</span>
            <Badge className="rounded-full">Reviews: {reviewCount}</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {error && (
            <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}
          {success && (
            <div className="mb-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {success}
            </div>
          )}
          <form className="space-y-3" onSubmit={onSubmit}>
            <div>
              <label className="text-xs text-black/60">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@mail.com"
                disabled={loading}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs text-black/60">Nombre</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="text-xs text-black/60">Apellido</label>
                <Input
                  value={lastname}
                  onChange={(e) => setLastname(e.target.value)}
                  placeholder="Tu apellido"
                  disabled={loading}
                />
              </div>
            </div>
            <Button type="submit" disabled={saving || loading}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
