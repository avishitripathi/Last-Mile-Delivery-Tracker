const { db } = require("../db");

const ACTIVE_STATUSES = ["ASSIGNED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"];
const activePlaceholders = ACTIVE_STATUSES.map(() => "?").join(",");

/** Haversine distance in km between two lat/lng points. */
function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Finds the best available agent to service an order's pickup zone.
 *
 * Selection strategy:
 *  1. Candidate pool = agents who are AVAILABLE and cover the pickup zone
 *     (agent_zones mapping).
 *  2. If the pickup location and candidate agents both have known
 *     lat/lng, rank by haversine distance (nearest first) — "nearest
 *     available agent by current location".
 *  3. Otherwise, rank by current active-order load (fewest active orders
 *     first) so work is balanced across the zone's agents — the
 *     "nearest by zone" fallback when live coordinates aren't available.
 *
 * Returns the winning agent_profiles row, or null if no one is available.
 */
function findBestAgent({ pickupZoneId, pickupLat, pickupLng }) {
  const candidates = db
    .prepare(
      `SELECT ap.* FROM agent_profiles ap
       JOIN agent_zones az ON az.agentId = ap.id
       WHERE ap.status = 'AVAILABLE' AND az.zoneId = ?`
    )
    .all(pickupZoneId);

  if (candidates.length === 0) return null;

  const loadStmt = db.prepare(
    `SELECT COUNT(*) as c FROM orders WHERE assignedAgentId = ? AND status IN (${activePlaceholders})`
  );

  const useDistance = pickupLat != null && pickupLng != null;

  const ranked = candidates
    .map((agent) => ({
      agent,
      activeLoad: loadStmt.get(agent.id, ...ACTIVE_STATUSES).c,
      distanceKm:
        useDistance && agent.currentLat != null && agent.currentLng != null
          ? haversineKm(pickupLat, pickupLng, agent.currentLat, agent.currentLng)
          : null,
    }))
    .sort((a, b) => {
      if (a.distanceKm != null && b.distanceKm != null) {
        if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm;
      } else if (a.distanceKm != null) {
        return -1;
      } else if (b.distanceKm != null) {
        return 1;
      }
      return a.activeLoad - b.activeLoad;
    });

  return ranked[0].agent;
}

module.exports = { findBestAgent, haversineKm, ACTIVE_STATUSES };