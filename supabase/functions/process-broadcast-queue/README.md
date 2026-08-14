# Broadcast queue worker

This Edge Function claims delivery rows atomically, calls the configured delivery provider, and acknowledges success or schedules an exponential-backoff retry.

Required secrets:

- `BROADCAST_WORKER_SECRET`: caller authentication for the worker endpoint.
- `BROADCAST_DELIVERY_WEBHOOK_URL`: HTTPS delivery provider endpoint. The worker sends a stable `Idempotency-Key` header.

The function intentionally returns `503` before claiming work when the delivery provider is not configured.
After the provider is configured and tested, create the Vault secret
`beat_broadcast_delivery_enabled` with value `true`, then apply
`20260722031000_schedule_broadcast_worker.sql` to enable the minute worker.
