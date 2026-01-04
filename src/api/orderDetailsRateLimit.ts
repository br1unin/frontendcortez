import { createResource } from "./crud";
import { endpoints } from "./endpoints";
import { sleep } from "../lib/utils";

/**
 * Tu API: POST /order_details/ tiene rate limit 10 req/min por IP.
 * Para no chocar, posteamos uno por uno, espaciando ~6.5s.
 */
export async function createOrderDetailsRateLimited(lines: any[], spacingMs = 6500) {
  const results: any[] = [];
  for (let i = 0; i < lines.length; i++) {
    // eslint-disable-next-line no-await-in-loop
    const created = await createResource(endpoints.orderDetails, lines[i]);
    results.push(created);
    if (i < lines.length - 1) {
      // eslint-disable-next-line no-await-in-loop
      await sleep(spacingMs);
    }
  }
  return results;
}
