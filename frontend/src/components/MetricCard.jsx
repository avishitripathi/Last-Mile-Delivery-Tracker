export default function MetricCard({
  label,
  value,
  detail,
  accent
}) {

  return (
    <div
      className={`metric-card ${
        accent ? "metric-accent" : ""
      }`}
    >

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

      {detail && (
        <small>
          {detail}
        </small>
      )}

    </div>
  );
}