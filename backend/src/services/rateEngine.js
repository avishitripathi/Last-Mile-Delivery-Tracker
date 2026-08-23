const { db } = require("../db");

/**
 * Volumetric weight (kg) = (L x B x H in cm) / 5000
 */
function calcVolumetricWeight({ lengthCm, breadthCm, heightCm }) {
  return (lengthCm * breadthCm * heightCm) / 5000;
}

/**
 * Core pricing engine. Fully data-driven from the rate_cards /
 * cod_surcharge_configs tables — nothing here is hardcoded per order type
 * or zone; an admin can change every number via the Rate Cards screen.
 */
function calculateCharge({
  lengthCm,
  breadthCm,
  heightCm,
  actualWeightKg,
  orderType, // 'B2B' | 'B2C'
  paymentType, // 'PREPAID' | 'COD'
  pickupZoneId,
  dropZoneId,
}) {
  if (!pickupZoneId || !dropZoneId) {
    const err = new Error(
      "Cannot calculate charge: pickup or drop address does not map to a known service zone."
    );
    err.status = 422;
    throw err;
  }

  const volumetricWeightKg = calcVolumetricWeight({ lengthCm, breadthCm, heightCm });
  const chargeableWeightKg = Math.max(actualWeightKg, volumetricWeightKg);

  const zoneTypeUsed = pickupZoneId === dropZoneId ? "INTRA" : "INTER";

  const rateCard = db
    .prepare("SELECT * FROM rate_cards WHERE orderType = ? AND zoneType = ? AND isActive = 1")
    .get(orderType, zoneTypeUsed);

  if (!rateCard) {
    const err = new Error(
      `No active rate card configured for ${orderType} / ${zoneTypeUsed}. Ask an admin to configure one.`
    );
    err.status = 422;
    throw err;
  }

  const computedCharge = Math.max(rateCard.baseCharge, chargeableWeightKg * rateCard.ratePerKg);
  const minChargeApplied = computedCharge < rateCard.minCharge;
  const baseChargeFinal = Math.max(computedCharge, rateCard.minCharge);

  let codSurcharge = 0;
  if (paymentType === "COD") {
    const codConfig = db.prepare("SELECT * FROM cod_surcharge_configs WHERE orderType = ?").get(orderType);
    if (codConfig) {
      codSurcharge = codConfig.flatFee + (baseChargeFinal * codConfig.percentFee) / 100;
    }
  }

  const totalCharge = round2(baseChargeFinal + codSurcharge);

  return {
    volumetricWeightKg: round2(volumetricWeightKg),
    chargeableWeightKg: round2(chargeableWeightKg),
    zoneTypeUsed,
    rateCardId: rateCard.id,
    ratePerKgUsed: rateCard.ratePerKg,
    baseChargeUsed: rateCard.baseCharge,
    computedCharge: round2(computedCharge),
    minChargeApplied,
    codSurcharge: round2(codSurcharge),
    totalCharge,
  };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

module.exports = { calculateCharge, calcVolumetricWeight };