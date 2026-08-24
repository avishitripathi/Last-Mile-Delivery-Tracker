import {
  useEffect,
  useState
} from "react";

import {
  api,
  unwrap
} from "../api";

import MetricCard from "../components/MetricCard";
import StatusBadge from "../components/StatusBadge";

export default function Admin() {

  const [summary, setSummary] =
    useState({});

  const [agents, setAgents] =
    useState([]);

  const [error, setError] =
    useState("");

  useEffect(() => {

    Promise.all([
      api.adminSummary(),
      api.agents()
    ])

      .then(
        ([s, a]) => {

          setSummary(
            unwrap(s) || {}
          );

          const data = unwrap(a);

          setAgents(
            data?.agents ||
            data?.items ||
            (
              Array.isArray(data)
                ? data
                : []
            )
          );

        }
      )

      .catch(
        (err) =>
          setError(err.message)
      );

  }, []);

  return (
    <>

      <section className="page-heading">

        <div>

          <div className="eyebrow">
            CONTROL ROOM
          </div>

          <h1>
            Operations
          </h1>

          <p>
            Network health, agent capacity
            and delivery performance.
          </p>

        </div>

      </section>

      {error && (
        <div className="error-box">
          {error}
        </div>
      )}

      <div className="metrics">

        <MetricCard
          label="Total orders"
          value={
            summary.totalOrders ??
            summary.orders ??
            "—"
          }
        />

        <MetricCard
          label="Active"
          value={
            summary.activeOrders ??
            summary.active ??
            "—"
          }
          accent
        />

        <MetricCard
          label="Delivered"
          value={
            summary.deliveredOrders ??
            summary.delivered ??
            "—"
          }
        />

        <MetricCard
          label="Failed"
          value={
            summary.failedOrders ??
            summary.failed ??
            "—"
          }
        />

      </div>

      <section className="section-card">

        <div className="section-header">

          <div>

            <span className="eyebrow">
              FIELD CAPACITY
            </span>

            <h2>
              Agents
            </h2>

          </div>

        </div>

        <div className="agent-list">

          {agents.map(
            (agent) => (

              <div
                className="agent-row"
                key={agent.id}
              >

                <div className="avatar">

                  {(agent.name ||
                    "A")
                    .slice(0, 1)}

                </div>

                <div>

                  <strong>

                    {agent.name ||
                      agent.user?.name ||
                      "Agent"}

                  </strong>

                  <span>

                    {agent.phone ||
                      agent.user?.phone ||
                      "Field agent"}

                  </span>

                </div>

                <StatusBadge
                  status={
                    agent.status ||
                    agent.profile?.status
                  }
                />

                <span className="muted">

                  {agent.currentZoneName ||
                    agent.zone?.name ||
                    "—"}

                </span>

              </div>

            )
          )}

          {!agents.length && (
            <div className="empty-inline">
              No agents returned.
            </div>
          )}

        </div>

      </section>

    </>
  );
}