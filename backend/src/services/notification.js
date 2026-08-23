const nodemailer = require("nodemailer");
const { db, id, now } = require("../db");

let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST) return null; // not configured -> simulate only
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
  return transporter;
}

const STATUS_COPY = {
  CREATED: (o) => `Your order ${o.orderNumber} has been placed and is awaiting pickup.`,
  ASSIGNED: (o) => `A delivery agent has been assigned to your order ${o.orderNumber}.`,
  PICKED_UP: (o) => `Your order ${o.orderNumber} has been picked up by the delivery agent.`,
  IN_TRANSIT: (o) => `Your order ${o.orderNumber} is in transit.`,
  OUT_FOR_DELIVERY: (o) => `Your order ${o.orderNumber} is out for delivery today.`,
  DELIVERED: (o) => `Your order ${o.orderNumber} has been delivered. Thank you!`,
  FAILED: (o) => `Delivery attempt for order ${o.orderNumber} failed. You can reschedule it from the tracking page.`,
  RESCHEDULED: (o) => `Your order ${o.orderNumber} has been rescheduled and a new delivery attempt is planned.`,
  CANCELLED: (o) => `Your order ${o.orderNumber} has been cancelled.`,
};

function insertNotification({ orderId, channel, recipient, subject, message, status }) {
  db.prepare(
    "INSERT INTO notifications (id,orderId,channel,recipient,subject,message,status,createdAt) VALUES (?,?,?,?,?,?,?,?)"
  ).run(id(), orderId, channel, recipient, subject || null, message, status, now());
}

/**
 * Sends (or simulates, if SMTP is not configured) an email notification for
 * an order status change and persists a Notification record either way so
 * the full communication history is auditable.
 */
async function notifyOrderStatus(order, customer) {
  const subject = `Order ${order.orderNumber}: ${order.status.replace(/_/g, " ")}`;
  const message = (STATUS_COPY[order.status] || (() => `Order ${order.orderNumber} status updated to ${order.status}.`))(order);

  let status = "SIMULATED";
  const t = getTransporter();
  if (t && customer?.email) {
    try {
      await t.sendMail({
        from: process.env.SMTP_FROM || "notifications@lastmile.test",
        to: customer.email,
        subject,
        text: message,
      });
      status = "SENT";
    } catch (e) {
      console.error("Email send failed:", e.message);
      status = "FAILED";
    }
  } else {
    console.log(`[EMAIL:SIMULATED] to=${customer?.email} subject="${subject}" body="${message}"`);
  }

  insertNotification({ orderId: order.id, channel: "EMAIL", recipient: customer?.email || "unknown", subject, message, status });

  // SMS is stubbed behind the same interface so a real provider (Twilio,
  // MSG91, etc. — any free-tier SMS API) can be dropped in later without
  // touching call sites. See README "SMS integration".
  if (customer?.phone) {
    console.log(`[SMS:SIMULATED] to=${customer.phone} body="${message}"`);
    insertNotification({ orderId: order.id, channel: "SMS", recipient: customer.phone, message, status: "SIMULATED" });
  }
}

module.exports = { notifyOrderStatus };