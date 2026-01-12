import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "../components/ui";
import { useAuth } from "../auth/AuthContext";
import { apiFetch, getApiBase } from "../api/client";

export default function LoginPage({
  initialMode = "login",
  adminMode = false,
}: {
  initialMode?: "login" | "register";
  adminMode?: boolean;
}) {
  const { isAuthed, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const API_BASE = getApiBase();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (isAuthed) return <Navigate to={adminMode ? "/admin" : "/"} replace />;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!API_BASE) {
      setError("Configura VITE_API_URL para usar el login.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (mode === "register" && !adminMode) {
        await apiFetch("/auth/register", {
          method: "POST",
          body: { email, password, name: name.trim() || undefined },
        });
      }
      const endpoint = adminMode ? "/auth/admin/login" : "/auth/login";
      const res = await apiFetch<{ access_token: string }>(endpoint, {
        method: "POST",
        body: { email, password },
      });

      if (!res.access_token) throw new Error("Token no recibido");
      login(res.access_token);

      const fallback = adminMode ? "/admin" : "/";
      const nextPath = (location.state as any)?.from || fallback;
      navigate(nextPath, { replace: true });
    } catch (e: any) {
      setError(e.message || "Error iniciando sesion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="grid min-h-[60vh] place-items-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {adminMode ? "Login admin" : mode === "login" ? "Iniciar sesion" : "Crear cuenta"}
          </CardTitle>
          <div className="text-sm text-black/60">
            {adminMode
              ? "Acceso exclusivo para administradores."
              : mode === "login"
              ? "Accede a tu cuenta."
              : "Crea tu usuario para comprar."}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {error && (
            <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          <form className="space-y-3" onSubmit={onSubmit}>
            {mode === "register" && !adminMode && (
              <div>
                <label className="text-xs text-black/60">Nombre</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" />
              </div>
            )}
            <div>
              <label className="text-xs text-black/60">Email</label>
              <Input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@mail.com"
              />
            </div>
            <div>
              <label className="text-xs text-black/60">Password</label>
              <Input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="******"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Procesando..." : mode === "login" ? "Entrar" : "Registrarme"}
            </Button>
            {!adminMode && (
              <button
                type="button"
                className="w-full text-sm text-black/60 hover:text-black"
                onClick={() => {
                  setError("");
                  setMode((prev) => (prev === "login" ? "register" : "login"));
                }}
              >
                {mode === "login" ? "No tenes cuenta? Registrate" : "Ya tenes cuenta? Inicia sesion"}
              </button>
            )}
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
