import {
  useEffect,
  useState
} from "react";

import {
  api,
  unwrap
} from "../api";

import StatusBadge from "../components/StatusBadge";

export default function AgentDesk() {

  const [orders, setOrders] =
    useState([]);

  const [error, setError] =
    useState("");

  async function load() {

    try {

      const data = unwrap(
        await api.orders()
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

    }
  }

  useEffect(() => {
    load();
  }, []);

  async function advance(order) {

    const next = {

      ASSIGNED:
        "PICKED_UP",

      PICKED_UP:
        "IN_TRANSIT",

      IN_TRANSIT:
        "OUT_FOR_DELIVERY",

      OUT_FOR_DELIVERY:
        "DELIVERED"

    }[order.status];

    if (!next) return;

    try {

      await api.updateOrderStatus(
        order.id,
        next
      );

      await load();

    } catch (err) {

      setError(err.message);

    }
  }

  return (
    <>

      <section className="page-heading">

        <div>

          <div className="eyebrow">
            FIELD OPERATIONS
          </div>

          <h1>
            Agent desk
          </h1>

          <p>
            Progress your assigned
            deliveries through the route.
          </p>

        </div>

      </section>

      {error && (
        <div className="error-box">
          {error}
        </div>
      )}

      <div className="agent-grid">

        {orders
          .filter(
            (o) =>
              ![
                "DELIVERED",
                "CANCELLED"
              ].includes(o.status)
          )
          .map((order) => (

            <article
              className="agent-card"
              key={order.id}
            >

              <div className="card-row">

                <span className="mono">

                  {order.trackingNumber ||
                    order.id?.slice(0, 10)}

                </span>

                <StatusBadge
                  status={order.status}
                />

              </div>

              <h2>

                {order.recipientName ||
                  order.customerName ||
                  "Recipient"}

              </h2>

              <p>

                {order.destinationAddress ||
                  order.destinationPincode ||
                  "Destination"}

              </p>

              <div className="agent-route">

                <span>
                  FROM{" "}
                  {order.pickupPincode ||
                    "—"}
                </span>

                <span>
                  →
                </span>

                <span>
                  TO{" "}
                  {order.destinationPincode ||
                    "—"}
                </span>

              </div>

              <button
                className="button full"
                disabled={
                  ![
                    "ASSIGNED",
                    "PICKED_UP",
                    "IN_TRANSIT",
                    "OUT_FOR_DELIVERY"
                  ].includes(
                    order.status
                  )
                }
                onClick={() =>
                  advance(order)
                }
              >

                {order.status ===
                "OUT_FOR_DELIVERY"
                  ? "Mark delivered"
                  : "Advance status →"}

              </button>

            </article>

          ))}

      </div>

    </>
  );
}