# BEAT shared backend update

Live schema was inspected read-only on 2026-07-30. It already contains
`active_beats`, `connection_profiles`, `profiles`, `discovery_settings`,
`profile_photos`, `blocks`, `discovery_decisions`, `matches`, `messages`, and the
shared `app_content` registry. It does not contain `message_reactions` or
`get_discovery_candidates_v2`.

Prepared migrations in the shared web checkout:

- `20260730120000_neurodivergent_dating_core.sql`: membership-protected reactions,
  neutral compatibility scoring, and authenticated exact-BEAT discovery.
- `20260730121000_seed_connection_content.sql`: complete idempotent English copy
  seed using the existing `app_content` table.
- `20260730122000_admin_member_crm.sql`: protected admin notes and a normalized
  admin-only CRM snapshot.

Do not push these migrations with `--include-all`. The linked project has an
inconsistent migration history: local versions `20260722003000`,
`20260722020000`, `20260722030000`, `20260722031000`, and `20260723090000` are
not recorded remotely even though related schema is live. Reconcile those exact
versions with the deployment audit trail first, then run a normal dry run and
review the generated SQL before deployment.

The live linter also reports pre-existing broken functions including
`is_super_admin`, `ops_global_search`, `create_daily_beat_for_user`, and
`create_or_open_conversation`. The new CRM RPC checks `user_roles` directly and
does not depend on the broken `is_super_admin` function.
