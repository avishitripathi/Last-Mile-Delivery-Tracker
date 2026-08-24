import {
  useEffect,
  useState
} from "react";

import { Link } from "react-router-dom";

import {
  api,
  unwrap
} from "../api";

import OrderTable from "../components/OrderTable";

export default function Orders() {

  const [orders, setOrders] =
    useState([]);

  const [filter, setFilter] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function load() {

    setLoading(true);

    try {

      const data = unwrap(
        await api.orders(
          filter
            ? `status=${encodeURIComponent(
                filter
              )}`
            : ""
        )
      );

      setOrders(
        data?.orders ||
        data?.items ||
        (
          Array.isArray(data)
            ? data
            : []
        )
      );

    } catch (err) {

      setError(err.message);

    } finally {

      setLoading(false);

    }
  }

  useEffect(() => {
    load();
  }, [filter]);

  return (
    <>

      <section className="page-heading">

        <div>

          <div className="eyebrow">
            DELIVERY REGISTER
          </div>

          <h1>
            Orders
          </h1>

          <p>
            Search, inspect and track
            every parcel.
          </p>

        </div>

        <Link
          className="button"
          to="/orders/new"
        >
          + New delivery
        </Link>

      </section>

      <div className="toolbar">

        <div className="filter-tabs">

          {[
            "",
            "CREATED",
            "ASSIGNED",
            "IN_TRANSIT",
            "OUT_FOR_DELIVERY",
            "DELIVERED",
            "DELIVERY_FAILED"
          ].map((s) => (

            <button
              key={s}
              className={
                filter === s
                  ? "active"
                  : ""
              }
              onClick={() =>
                setFilter(s)
              }
            >
              {s
                ? s.replaceAll(
                    "_",
                    " "
                  )
                : "All"}
            </button>

          ))}

        </div>

      </div>

      {error && (
        <div className="error-box">
          {error}
        </div>
      )}

      {loading ? (

        <div className="loading-card">
          Loading orders…
        </div>

      ) : (

        <section className="section-card">

          <OrderTable
            orders={orders}
          />

        </section>

      )}

    </>
  );
}