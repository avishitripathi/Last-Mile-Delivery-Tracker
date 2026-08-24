import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import {
  api,
  unwrap
} from "../api";

import MetricCard from "../components/MetricCard";
import OrderTable from "../components/OrderTable";

export default function Dashboard() {

  const [orders, setOrders] =
    useState([]);

  const [zones, setZones] =
    useState([]);

  const [error, setError] =
    useState("");

  useEffect(() => {

    Promise.all([
      api.orders(),
      api.zones()
    ])

      .then(
        ([
          ordersRaw,
          zonesRaw
        ]) => {

          setOrders(
            normalizeList(
              unwrap(ordersRaw)
            )
          );

          setZones(
            normalizeList(
              unwrap(zonesRaw)
            )
          );

        }
      )

      .catch(
        (err) =>
          setError(err.message)
      );

  }, []);

  const active =
    orders.filter(
      (o) =>
        ![
          "DELIVERED",
          "CANCELLED"
        ].includes(o.status)
    ).length;

  const delivered =
    orders.filter(
      (o) =>
        o.status === "DELIVERED"
    ).length;

  const failed =
    orders.filter(
      (o) =>
        o.status ===
        "DELIVERY_FAILED"
    ).length;

  return (
    <>

      <section className="page-heading">

        <div>

          <div className="eyebrow">
            OPERATIONS SNAPSHOT
          </div>

          <h1>
            Good to see you.
          </h1>

          <p>
            Here’s what is moving through
            the network right now.
          </p>

        </div>

        <Link
          className="button"
          to="/orders/new"
        >
          + New delivery
        </Link>

      </section>

      {error && (
        <div className="error-box">
          {error}
        </div>
      )}

      <div className="metrics">

        <MetricCard
          label="Active deliveries"
          value={active}
          detail="currently moving"
          accent
        />

        <MetricCard
          label="Delivered"
          value={delivered}
          detail="completed orders"
        />

        <MetricCard
          label="Failed attempts"
          value={failed}
          detail="needs attention"
        />

        <MetricCard
          label="Service zones"
          value={zones.length}
          detail="configured coverage"
        />

      </div>

      <section className="section-card">

        <div className="section-header">

          <div>

            <span className="eyebrow">
              RECENT ACTIVITY
            </span>

            <h2>
              Latest deliveries
            </h2>

          </div>

          <Link to="/orders">
            View all →
          </Link>

        </div>

        <OrderTable
          orders={orders}
          compact
        />

      </section>

    </>
  );
}

function normalizeList(value) {

  if (Array.isArray(value)) {
    return value;
  }

  return (
    value?.orders ||
    value?.zones ||
    value?.items ||
    value?.data ||
    []
  );
}