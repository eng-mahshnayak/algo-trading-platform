
export function isCompleted(order) {
    
  if (!order) return false;

  const status = String(
    order.orderstatus || order.status || ""
  ).toLowerCase();

  return ["complete", "filled", "executed"].includes(status);

}