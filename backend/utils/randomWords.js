import crypto from "crypto";

export function generateRandomNumbers(length) {
  // generate a random integer string of desired length (digits only)
  const digits = crypto.randomInt(0, Math.pow(10, length))
    .toString()
    .padStart(length, "0");
  return digits;
}



export function generateStrategyUniqueId(strategyName) {
  if (!strategyName) return null;

  const shortId = crypto.randomUUID().split("-")[0]; // fa26ee6969f
  const cleanName = strategyName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

  return `${shortId}_${cleanName}`;
}