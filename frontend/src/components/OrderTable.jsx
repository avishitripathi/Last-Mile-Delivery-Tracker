import { Link } from "react-router-dom";

import StatusBadge from "./StatusBadge";

export default function OrderTable({
  orders = [],
  compact = false
}) {

  if (!orders.length) {

    return (
      <div className="empty-state">

        <div className="empty-icon">
          □
        </div>

        <h3>
          No deliveries yet
        </h3>

        <p>
          Create a delivery to see it
          appear here.
        </p>

        <Link
          className="button"
          to="/orders/new"
        >
          Create delivery
        </Link>

      </div>
    );
  }

  const list = compact
    ? orders.slice(0, 5)
    : orders;

  return (
    <div className="table-wrap">

      <table>

        <thead>

          <tr>
            <th>Tracking</th>
            <th>Customer</th>
            <th>Route</th>
            <th>Status</th>
            <th>Created</th>
          </tr>

        </thead>

        <tbody>

          {list.map((order) => (

            <tr key={order.id}>

              <td>

                <Link
                  className="mono-link"
                  to={`/orders/${order.id}`}
                >
                  {order.trackingNumber ||
                    order.id?.slice(0, 10)}
                </Link>

              </td>

              <td>
                {order.customerName ||
                  order.recipientName ||
                  "—"}
              </td>

              <td>
                {order.destinationPincode ||
                  order.toPincode ||
                  "—"}
              </td>

              <td>
                <StatusBadge
                  status={order.status}
                />
              </td>

              <td className="muted">
                {formatDate(
                  order.createdAt
                )}
              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );
}

function formatDate(value) {

  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
}