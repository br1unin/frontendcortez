import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import RootLayout from "./layout/RootLayout";
import Shop from "./pages/Shop";
import OrdersPage from "./pages/OrdersPage";
import AddressesPage from "./pages/AddressesPage";
import BillingPage from "./pages/BillingPage";
import AccountPage from "./pages/AccountPage";
import AdminPage from "./pages/AdminPage";
import NotFoundPage from "./pages/NotFoundPage";

import "./styles.css";

const router = createBrowserRouter([
  { 
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <Shop /> },
      { path: "orders", element: <OrdersPage /> },
      { path: "addresses", element: <AddressesPage /> },
      { path: "billing", element: <BillingPage /> },
      { path: "account", element: <AccountPage /> },
      { path: "admin", element: <AdminPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
    <RouterProvider router={router} />
  </React.StrictMode>
);