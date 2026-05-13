# Auth — GitHub via Convex Auth

## Auth Page `/sign-in`

- Single page with a "Continue with GitHub" button.

## Route Protection

- All routes are protected by default.
- Public routes: `/sign-in`
- in next js 16 middleware.ts is named proxy.ts
- so create a proxy.ts file

## Checklist

- All routes protected except `/sign-in`
- proxy.ts is created
- `npm run build` passes
