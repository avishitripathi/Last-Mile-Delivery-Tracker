import {
  useEffect,
  useState
} from "react";

import {
  Link,
  useParams
} from "react-router-dom";

import {
  api,
  unwrap
} from "../api";

import StatusBadge from "../components/StatusBadge";

const timeline = [
  "CREATED",
  "ASSIGNED",
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED"
];

export default function OrderDetails() {

  const { id } =
    useParams();

  const [order, setOrder] =
    useState(null);

  const [error, setError] =
    useState("");

  async function load() {

    try {

      const data = unwrap(
        await api.order(id)
      );

      setOrder(
        data?.order || data
      );

    } catch (err) {

      setError(err.message);

    }
  }

  useEffect(() => {
    load();
  }, [id]);

  if (error) {
    return (
      <div className="error-box">
        {error}
      </div>
    );
  }

  if (!order) {
    return (
      <div className="loading-card">
        Loading delivery…
      </div>
    );
  }

  const currentIndex =
    timeline.indexOf(
      order.status
    );

  return (
    <>

      <Link
        className="back-link"
        to="/orders"
      >
        ← Back to orders
      </Link>

      <section className="detail-hero">

        <div>

          <div className="eyebrow">
            DELIVERY /{" "}
            {order.trackingNumber ||
              order.id}
          </div>

          <h1>
            {order.recipientName ||
              order.customerName ||
              "Delivery"}
          </h1>

          <p>
            {order.destinationAddress ||
              "Destination details"}
          </p>

        </div>

        <StatusBadge
          status={order.status}
        />

      </section>

      <div className="detail-grid">

        <section className="section-card">

          <div className="section-header">

            <div>

              <span className="eyebrow">
                LIFECYCLE
              </span>

              <h2>
                Delivery progress
              </h2>

            </div>

          </div>

          <div className="timeline">

            {timeline.map(
              (step, index) => (

                <div
                  className={`timeline-step ${
                    index <= currentIndex
                      ? "done"
                      : ""
                  } ${
                    step === order.status
                      ? "current"
                      : ""
                  }`}
                  key={step}
                >

                  <div className="timeline-dot">

                    {index <= currentIndex
                      ? "✓"
                      : ""}

                  </div>

                  <div>

                    <strong>
                      {step.replaceAll(
                        "_",
                        " "
                      )}
                    </strong>

                    <span>

                      {step ===
                      order.status
                        ? "Current status"
                        : index <
                            currentIndex
                          ? "Completed"
                          : "Pending"}

                    </span>

                  </div>

                </div>

              )
            )}

          </div>

        </section>

        <section className="section-card">

          <span className="eyebrow">
            SHIPMENT DATA
          </span>

          <h2>
            Route
          </h2>

          <div className="info-list">

            <div>
              <span>
                Pickup
              </span>

              <strong>
                {order.pickupPincode ||
                  order.fromPincode ||
                  "—"}
              </strong>
            </div>

            <div>
              <span>
                Destination
              </span>

              <strong>
                {order.destinationPincode ||
                  order.toPincode ||
                  "—"}
              </strong>
            </div>

            <div>
              <span>
                Weight
              </span>

              <strong>
                {order.weightKg ?? "—"} kg
              </strong>
            </div>

            <div>
              <span>
                Order type
              </span>

              <strong>
                {order.orderType || "—"}
              </strong>
            </div>

            <div>
              <span>
                Charge
              </span>

              <strong>
                ₹
                {order.totalCharge ??
                  order.total ??
                  "—"}
              </strong>
            </div>

            <div>
              <span>
                Agent
              </span>

              <strong>
                {order.agentName ||
                  order.agent?.name ||
                  "Unassigned"}
              </strong>
            </div>

          </div>

        </section>

      </div>

    </>
  );
}