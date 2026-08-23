Status: Working
Owner: Sofiia
Last Updated: 2026-08-21
Purpose: разделить доступность функций и ожидания privacy между public, guest и authenticated experiences.
Maturity: This is a first product-layer draft grounded in the current Inspirella strategy, data model and AI Studio code snapshot. Review before treating it as final product policy.
Related Files:
- Navigation Model.md
- ../Requirements/Auth Requirements.md
- ../UX/Trust UX.md

# Public vs Authenticated Areas

## Public

Public users can understand Inspirella, read mission/about content, contact the project and optionally start a constrained exploration. Public screens must not expose private profiles or personal progress.

## Guest

Guest mode lowers entry friction and demonstrates product value. Guest data is local/temporary unless the user explicitly converts it into an account. The UI must state that saved progress may not sync.

## Authenticated

Authenticated users can persist profile, recommendations, saved paths, resources and trackers according to ownership/RLS policy. They can change language and preferences and should be able to understand what is stored.

## Sensitive boundary

Showing a public institution record is different from exposing user data. Auth checks must be enforced server-side; hiding navigation items is only a UX layer.

## Conversion

Guest → account conversion should preserve only explicitly transferable data, show what will be saved and handle conflicts without silent overwrite.
