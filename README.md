# MeetBeat

MeetBeat is maintained as one repository with separate web and native iOS applications sharing the same Supabase backend history.

## Repository layout

- `src/` — React and Vite web application used by Bolt
- `ios/` — native SwiftUI application used for TestFlight and App Store releases
- `supabase/` — shared database migrations and Edge Functions

The web and iOS applications are built and deployed independently. Changes to shared data models should include compatible updates for both clients.

## Web application

1. Copy `.env.example` to `.env`.
2. Add the Supabase URL and publishable or anonymous key.
3. Run `npm ci`.
4. Run `npm run dev` for local development.

Validation commands:

```sh
npm run typecheck
npm run lint
npm run build
```

## iOS application

1. Copy `ios/Config/Secrets.example.xcconfig` to `ios/Config/Secrets.xcconfig`.
2. Add the Supabase URL and publishable or anonymous key.
3. Open `ios/BEAT.xcodeproj` in Xcode.

The project can also be regenerated from `ios/project.yml` with XcodeGen.

## Secrets

Never commit `.env`, `ios/Config/Secrets.xcconfig`, signing certificates, provisioning profiles, build archives, or exported applications.
