import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import RootLayout from "./layout/RootLayout";
import HomePage from "./pages/HomePage";
import Shop from "./pages/Shop";
import OrdersPage from "./pages/OrdersPage";
import AddressesPage from "./pages/AddressesPage";
import BillingPage from "./pages/BillingPage";
import AccountPage from "./pages/AccountPage";
import AdminPage from "./pages/AdminPage";
import NotFoundPage from "./pages/NotFoundPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import RequireAuth from "./auth/RequireAuth";
import { AuthProvider } from "./auth/AuthContext";

import "./index.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "shop", element: <Shop /> },
      { path: "orders", element: <RequireAuth><OrdersPage /></RequireAuth> },
      { path: "addresses", element: <RequireAuth><AddressesPage /></RequireAuth> },
      { path: "billing", element: <RequireAuth><BillingPage /></RequireAuth> },
      { path: "account", element: <RequireAuth><AccountPage /></RequireAuth> },
      { path: "admin", element: <RequireAuth requireAdmin><AdminPage /></RequireAuth> },
      { path: "admin/login", element: <AdminLoginPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>,
);
