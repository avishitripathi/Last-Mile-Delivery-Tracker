const { db } = require("../db");

/**
 * Zone detection: resolves a pincode to the Zone an admin has mapped it to
 * (Admin > Zones > "assign areas to zones"). Returns null if the pincode
 * is unmapped — callers must handle that (order creation will reject with
 * a 422 asking the admin to map the area first).
 */
function detectZoneByPincode(pincode) {
  if (!pincode) return null;
  const area = db.prepare("SELECT zoneId FROM zone_areas WHERE pincode = ?").get(String(pincode).trim());
  return area ? area.zoneId : null;
}

module.exports = { detectZoneByPincode };