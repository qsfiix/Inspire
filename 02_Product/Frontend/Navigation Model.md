Status: Working
Owner: Sofiia
Last Updated: 2026-08-21
Purpose: описать навигацию public/authenticated areas и переходы между экранами в первой версии.
Maturity: This is a first product-layer draft grounded in the current Inspirella strategy, data model and AI Studio code snapshot. Review before treating it as final product policy.
Related Files:
- ../Screens/Screen Index.md
- ../User Flows/User Flows Overview.md
- ../Requirements/Auth Requirements.md

# Navigation Model

## Public navigation

- Home
- About
- Contact
- Get started / Explore as guest

## Authenticated/guest product navigation

- Dashboard
- Discover / Map
- Resources
- Tracker
- Profile

## Entry rules

- Public user can inspect marketing pages without account.
- Guest may enter limited discovery/demo path.
- Authenticated user gets persistent profile and progress.
- Protected actions redirect to login with explanation, not silent failure.
- Onboarding-required user is sent to onboarding before recommendation-dependent dashboard.

## Current implementation

`Navbar` and `App.tsx` use string `activeTab`. This is acceptable for a prototype, but target navigation should have stable route identifiers and deep-linkable URLs before public launch.

## Navigation acceptance

Back/refresh does not unexpectedly erase state, active page is visible, keyboard focus follows transitions, and every protected route has a recoverable path back to public or login.
