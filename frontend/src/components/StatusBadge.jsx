const labels = {

  CREATED: "Created",

  ASSIGNED: "Assigned",

  PICKED_UP: "Picked up",

  IN_TRANSIT: "In transit",

  OUT_FOR_DELIVERY:
    "Out for delivery",

  DELIVERED: "Delivered",

  DELIVERY_FAILED:
    "Delivery failed",

  RESCHEDULED: "Rescheduled",

  CANCELLED: "Cancelled",

  AVAILABLE: "Available",

  BUSY: "Busy",

  OFFLINE: "Offline"
};

export default function StatusBadge({
  status
}) {

  return (
    <span
      className={`status status-${String(
        status || ""
      ).toLowerCase()}`}
    >
      {labels[status] ||
        status ||
        "Unknown"}
    </span>
  );
}