const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Delivery = {
  delivery_id: string;
  broadcast_id: string;
  member_id: string;
  title: string;
  body: string;
  audience: string;
  attempt: number;
  idempotency_key: string;
};

const rpc = async <T>(name: string, body: Record<string, unknown>): Promise<T> => {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) throw new Error("Supabase runtime credentials are unavailable");

  const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`${name} failed (${response.status})`);
  return await response.json() as T;
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const expectedSecret = Deno.env.get("BROADCAST_WORKER_SECRET");
  const webhookUrl = Deno.env.get("BROADCAST_DELIVERY_WEBHOOK_URL");
  if (!expectedSecret || request.headers.get("x-worker-secret") !== expectedSecret) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!webhookUrl) {
    return Response.json({ status: "not_configured", reason: "Delivery webhook is unavailable" }, { status: 503 });
  }

  const workerId = `edge:${crypto.randomUUID()}`;
  const requestedLimit = Number(new URL(request.url).searchParams.get("limit") ?? "100");
  const limit = Math.max(1, Math.min(Number.isFinite(requestedLimit) ? requestedLimit : 100, 500));
  const deliveries = await rpc<Delivery[]>("claim_ops_broadcast_deliveries", {
    p_worker_id: workerId,
    p_limit: limit,
  });

  let delivered = 0;
  let retrying = 0;
  for (const delivery of deliveries) {
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": delivery.idempotency_key,
        },
        body: JSON.stringify({
          recipient_id: delivery.member_id,
          title: delivery.title,
          body: delivery.body,
          broadcast_id: delivery.broadcast_id,
          delivery_id: delivery.delivery_id,
        }),
      });
      if (!response.ok) throw new Error(`Delivery provider returned ${response.status}`);
      const providerResult = await response.json().catch(() => ({})) as { id?: string };
      await rpc("complete_ops_broadcast_delivery", {
        p_delivery_id: delivery.delivery_id,
        p_success: true,
        p_external_delivery_id: providerResult.id ?? null,
        p_error: null,
      });
      delivered += 1;
    } catch (error) {
      await rpc("complete_ops_broadcast_delivery", {
        p_delivery_id: delivery.delivery_id,
        p_success: false,
        p_external_delivery_id: null,
        p_error: error instanceof Error ? error.message : "Unknown delivery error",
      });
      retrying += 1;
    }
  }

  return Response.json({ status: "processed", claimed: deliveries.length, delivered, retrying });
});
