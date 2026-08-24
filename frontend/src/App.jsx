import { Navigate, Route, Routes } from "react-router-dom";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import NewOrder from "./pages/NewOrder";
import OrderDetails from "./pages/OrderDetails";
import AgentDesk from "./pages/AgentDesk";
import Admin from "./pages/Admin";

export default function App() {
  return (
    <Routes>

      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Logged-in routes */}
      <Route element={<ProtectedRoute />}>

        <Route element={<Layout />}>

          <Route index element={<Dashboard />} />

          <Route path="orders" element={<Orders />} />

          <Route
            path="orders/new"
            element={<NewOrder />}
          />

          <Route
            path="orders/:id"
            element={<OrderDetails />}
          />

          {/* Agent + Admin */}
          <Route
            element={
              <ProtectedRoute roles={["AGENT", "ADMIN"]} />
            }
          >
            <Route
              path="agent"
              element={<AgentDesk />}
            />
          </Route>

          {/* Admin only */}
          <Route
            element={
              <ProtectedRoute roles={["ADMIN"]} />
            }
          >
            <Route
              path="admin"
              element={<Admin />}
            />
          </Route>

        </Route>

      </Route>

      {/* Unknown route */}
      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />

    </Routes>
  );
}
