import type { ReactNode } from "react";
import { NavLink, Outlet, useLocation, Link, useNavigate } from "react-router-dom";
import { LayoutGrid, Receipt, MapPin, User, Package, Shield } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import logo from "../assets/icono.jpg";

function LinkItem({
  to,
  label,
  icon,
}: {
  to: string;
  label: string;
  icon: ReactNode;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm transition ${
          isActive ? "bg-black text-white" : "hover:bg-black/5"
        }`
      }
      end={to === "/"}
    >
      {icon} <span className="hidden sm:inline">{label}</span>
    </NavLink>
  );
}

export default function RootLayout() {
  const loc = useLocation();
  const navigate = useNavigate();
  const { isAuthed, isAdmin, logout } = useAuth();

  return (
    <div className="min-h-screen bg-transparent text-black">
      
      <header className="sticky top-0 z-40 border-b border-black/10 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="grid h-14 w-14 place-items-center">
              <img src={logo} alt="Rebrum" className="h-full w-full object-contain" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold italic">Rebrum</div>
              <div className="text-xs text-black/60">{loc.pathname}</div>
            </div>
          </div>

          <nav className="flex items-center gap-1 rounded-2xl border border-black/5 bg-white/80 px-2 py-1 shadow-sm">
            <LinkItem to="/" label="Tienda" icon={<LayoutGrid className="h-4 w-4" />} />
            <LinkItem to="/orders" label="Ordenes" icon={<Package className="h-4 w-4" />} />
            <LinkItem to="/addresses" label="Direcciones" icon={<MapPin className="h-4 w-4" />} />
            <LinkItem to="/billing" label="Facturacion" icon={<Receipt className="h-4 w-4" />} />
            <LinkItem to="/account" label="Cuenta" icon={<User className="h-4 w-4" />} />
            {isAdmin && <LinkItem to="/admin" label="Admin" icon={<Shield className="h-4 w-4" />} />}
            {isAuthed ? (
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate("/");
                }}  className="inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm transition hover:bg-black/5"
              >
                Salir
              </button>
            ) : (
              <>
                <Link
                  to="/login"  className="inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm transition hover:bg-black/5"
                >
                  Login
                </Link>
                <Link
                  to="/register"  className="inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm transition hover:bg-black/5"
                >
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-black/10 bg-white" />
    </div>
  );
}
