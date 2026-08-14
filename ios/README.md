# BEAT Native iOS

This is the native SwiftUI migration of the BEAT web application.

## Current milestone

- Native SwiftUI application shell
- Supabase email/password authentication and persisted session
- Signup legal acceptance metadata
- Password-reset and auth deep-link handling
- Native Today mood selection
- Live Matches from `get_my_matches`
- Live Profile read/write against `profiles`
- Conversation list, message history, read receipts, and sending through existing RPCs
- Native Settings legal footer and sign out
- Localization-ready string catalog structure

## Next migration milestone

- Discovery candidate cards and decisions
- Realtime message inserts and updates
- Native photo upload/gallery editing
- Five-day location refresh and city normalization
- GDPR export/deletion controls
- Admin operations optimized for iPhone

## Generate and build

1. Keep `Config/Secrets.xcconfig` local. It is generated from the authoritative web environment and excluded from version control.
2. Run `xcodegen generate`.
3. Open `BEAT.xcodeproj`, select an iPhone simulator, and run the `BEAT` scheme.

The exported web application remains in `../web-source` as the behavioral and backend reference.
