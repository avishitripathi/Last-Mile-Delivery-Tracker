jsx
import {
  useEffect,
  useState
} from "react";

import { useNavigate } from "react-router-dom";

import {
  api,
  unwrap
} from "../api";

const initial = {
  orderType: "B2C",

  pickupName: "",
  pickupPhone: "",
  pickupAddressLine: "",
  pickupCity: "",
  pickupPincode: "",

  recipientName: "",
  recipientPhone: "",
  dropAddressLine: "",
  dropCity: "",
  dropPincode: "",

  actualWeightKg: "1",

  // Package dimensions
  lengthCm: "20",
  breadthCm: "15",
  heightCm: "10",

  paymentType: "PREPAID",

  codAmount: ""
};

export default function NewOrder() {
  const navigate = useNavigate();

  const [form, setForm] = useState(initial);

  const [zones, setZones] = useState([]);

  const [quote, setQuote] = useState(null);

  const [error, setError] = useState("");

  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.zones()
      .then((d) => {
        const data = unwrap(d);

        setZones(
          data?.zones ||
          data ||
          []
        );
      })
      .catch(() => {});
  }, []);

  const update = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  async function getQuote() {
    setError("");
    setQuote(null);

    try {
      const data = unwrap(
        await api.quote({
          orderType: form.orderType,

          pickupPincode:
            form.pickupPincode,

          dropPincode:
            form.dropPincode,

          actualWeightKg:
            Number(form.actualWeightKg),

          lengthCm:
            Number(form.lengthCm),

          breadthCm:
            Number(form.breadthCm),

          heightCm:
            Number(form.heightCm),

          paymentType:
            form.paymentType,

          codAmount:
            Number(form.codAmount || 0)
        })
      );

      setQuote(
        data?.quote || data
      );

    } catch (err) {
      setError(
        err.message ||
        "Unable to calculate quote"
      );
    }
  }

  async function create(e) {
    e.preventDefault();

    setBusy(true);
    setError("");

    try {
      const data = unwrap(
        await api.createOrder({
          ...form,

          actualWeightKg:
            Number(form.actualWeightKg),

          lengthCm:
            Number(form.lengthCm),

          breadthCm:
            Number(form.breadthCm),

          heightCm:
            Number(form.heightCm),

          codAmount:
            Number(form.codAmount || 0)
        })
      );

      const order =
        data?.order || data;

      navigate(
        order?.id
          ? `/orders/${order.id}`
          : "/orders"
      );

    } catch (err) {
      setError(
        err.message ||
        "Unable to create order"
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section className="page-heading">

        <div>

          <div className="eyebrow">
            BOOK A DELIVERY
          </div>

          <h1>
            New delivery
          </h1>

          <p>
            Enter the route details and
            generate a quote before booking.
          </p>

        </div>

      </section>

      <form
        onSubmit={create}
        className="order-form"
      >

        {error && (
          <div className="error-box full-span">
            {error}
          </div>
        )}

        {/* =========================
            SHIPMENT
        ========================== */}

        <section className="form-card">

          <div className="form-card-head">

            <span>
              01
            </span>

            <div>

              <h2>
                Shipment
              </h2>

              <p>
                What are you sending?
              </p>

            </div>

          </div>

          <div className="form-grid">

            {/* Order Type */}

            <label>
              Order type

              <select
                name="orderType"
                value={form.orderType}
                onChange={update}
              >

                <option value="B2C">
                  B2C
                </option>

                <option value="B2B">
                  B2B
                </option>

              </select>

            </label>

            {/* Weight */}

            <label>
              Weight (kg)

              <input
                required
                name="actualWeightKg"
                type="number"
                min="0.1"
                step="0.1"
                value={form.actualWeightKg}
                onChange={update}
              />

            </label>

            {/* Length */}

            <label>
              Length (cm)

              <input
                required
                name="lengthCm"
                type="number"
                min="1"
                step="0.1"
                value={form.lengthCm}
                onChange={update}
              />

            </label>

            {/* Breadth */}

            <label>
              Breadth (cm)

              <input
                required
                name="breadthCm"
                type="number"
                min="1"
                step="0.1"
                value={form.breadthCm}
                onChange={update}
              />

            </label>

            {/* Height */}

            <label>
              Height (cm)

              <input
                required
                name="heightCm"
                type="number"
                min="1"
                step="0.1"
                value={form.heightCm}
                onChange={update}
              />

            </label>

            {/* Payment */}

            <label>
              Payment

              <select
                name="paymentType"
                value={form.paymentType}
                onChange={update}
              >

                <option value="PREPAID">
                  PREPAID
                </option>

                <option value="COD">
                  COD
                </option>

              </select>

            </label>

            {/* COD */}

            {form.paymentType === "COD" && (
              <label>
                COD amount

                <input
                  required
                  name="codAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.codAmount}
                  onChange={update}
                />

              </label>
            )}

          </div>

        </section>

        {/* =========================
            PICKUP
        ========================== */}

        <section className="form-card">

          <div className="form-card-head">

            <span>
              02
            </span>

            <div>

              <h2>
                Pickup
              </h2>

              <p>
                Where should the parcel start?
              </p>

            </div>

          </div>

          <div className="form-grid">

            {/* Pickup Name */}

            <label>
              Name

              <input
                required
                name="pickupName"
                value={form.pickupName}
                onChange={update}
              />

            </label>

            {/* Pickup Phone */}

            <label>
              Phone

              <input
                required
                name="pickupPhone"
                type="tel"
                value={form.pickupPhone}
                onChange={update}
              />

            </label>

            {/* Pickup Address */}

            <label className="span-2">
              Address

              <input
                required
                name="pickupAddressLine"
                value={form.pickupAddressLine}
                onChange={update}
                placeholder="House no., street, area"
              />

            </label>

            {/* Pickup City */}

            <label>
              City

              <input
                required
                name="pickupCity"
                value={form.pickupCity}
                onChange={update}
                placeholder="Bhopal"
              />

            </label>

            {/* Pickup PIN */}

            <label>
              PIN code

              <input
                required
                name="pickupPincode"
                type="text"
                inputMode="numeric"
                maxLength="6"
                value={form.pickupPincode}
                onChange={update}
                placeholder="462001"
              />

            </label>

          </div>

        </section>

        {/* =========================
            DESTINATION
        ========================== */}

        <section className="form-card">

          <div className="form-card-head">

            <span>
              03
            </span>

            <div>

              <h2>
                Destination
              </h2>

              <p>
                Where is the parcel going?
              </p>

            </div>

          </div>

          <div className="form-grid">

            {/* Recipient Name */}

            <label>
              Name

              <input
                required
                name="recipientName"
                value={form.recipientName}
                onChange={update}
              />

            </label>

            {/* Recipient Phone */}

            <label>
              Phone

              <input
                required
                name="recipientPhone"
                type="tel"
                value={form.recipientPhone}
                onChange={update}
              />

            </label>

            {/* Destination Address */}

            <label className="span-2">
              Address

              <input
                required
                name="dropAddressLine"
                value={form.dropAddressLine}
                onChange={update}
                placeholder="House no., street, area"
              />

            </label>

            {/* Destination City */}

            <label>
              City

              <input
                required
                name="dropCity"
                value={form.dropCity}
                onChange={update}
                placeholder="Indore"
              />

            </label>

            {/* Destination PIN */}

            <label>
              PIN code

              <input
                required
                name="dropPincode"
                type="text"
                inputMode="numeric"
                maxLength="6"
                value={form.dropPincode}
                onChange={update}
                placeholder="452001"
              />

            </label>

          </div>

        </section>

        {/* =========================
            QUOTE
        ========================== */}

        <aside className="quote-card">

          <span className="eyebrow">
            ESTIMATE
          </span>

          <div className="quote-price">

            {quote?.totalCharge ??
              quote?.total ??
              quote?.amount ??
              "—"}

            {quote
              ? " ₹"
              : ""}

          </div>

          <p>

            {quote
              ? "Calculated from the active rate card."
              : "Generate a quote to see the delivery charge."}

          </p>

          <button
            type="button"
            className="secondary-button full"
            onClick={getQuote}
          >
            Calculate quote
          </button>

          <button
            type="submit"
            className="button full"
            disabled={busy}
          >

            {busy
              ? "Booking…"
              : "Book delivery →"}

          </button>

        </aside>

      </form>
    </>
  );
}

