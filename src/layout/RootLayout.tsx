import React from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { LayoutGrid, Receipt, MapPin, User, Package, Shield } from "lucide-react";

function LinkItem({
  to,
  label,
  icon,
}: {
  to: string;
  label: string;
  icon: React.ReactNode;
}) {
    <div className="bg-red-500 text-white p-2 text-center font-bold">
  ROOTLAYOUT OK
</div>

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
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </NavLink>
  );
}

export default function RootLayout() {
  const loc = useLocation();

    return (
        <div className="min-h-screen bg-[#fafafa] text-black">
            <div className="bg-red-500 text-white p-2 text-center font-bold">
    ROOTLAYOUT OK
    </div>

        <header className="sticky top-0 z-40 border-b border-black/10 bg-white/80 backdrop-blur">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-2">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-black text-white font-semibold">
                RZ
                </div>
                <div className="leading-tight">
                <div className="text-sm font-semibold">Revolución Shop</div>
                <div className="text-xs text-black/60">{loc.pathname}</div>
                </div>
            </div>

            <nav className="flex items-center gap-1">
                <LinkItem to="/" label="Tienda" icon={<LayoutGrid className="h-4 w-4" />} />
                <LinkItem to="/orders" label="Órdenes" icon={<Package className="h-4 w-4" />} />
                <LinkItem to="/addresses" label="Direcciones" icon={<MapPin className="h-4 w-4" />} />
                <LinkItem to="/billing" label="Facturación" icon={<Receipt className="h-4 w-4" />} />
                <LinkItem to="/account" label="Cuenta" icon={<User className="h-4 w-4" />} />
                <LinkItem to="/admin" label="Admin" icon={<Shield className="h-4 w-4" />} />
            </nav>
            </div>
        </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6">
        <Outlet />
      </main>

      <footer className="border-t border-black/10 bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 text-sm text-black/60">
          Frontend ecommerce • React + Vite + Tailwind • Conectado por .env
        </div>
      </footer>
    </div>
  );
}
