Status: Working
Owner: Sofiia
Last Updated: 2026-08-21
Purpose: описать путь от profile input к объяснимой подборке и следующему действию.
Maturity: This is a first product-layer draft grounded in the current Inspirella strategy, data model and AI Studio code snapshot. Review before treating it as final product policy.
Related Files:
- ../API/Recommendation API Contract.md
- ../Backend/Recommendation Engine.md
- ../Screens/Advisor Report Screen.md

# Recommendation Flow

## Flow

1. Validate minimum profile context.
2. Load allowed records from Repository.
3. Apply trust/publication filters.
4. Run deterministic engine.
5. Build shortlist and match reasons.
6. Attach sources and limitations.
7. Render Advisor Report/Dashboard block.
8. Let user inspect alternatives, open official resources or update preferences.
9. Optionally create a tracker action.

## AI use

If Gemini is used, it receives selected facts and produces explanation only after the deterministic result exists. Invalid or ungrounded output falls back to a safe deterministic summary.

## Success

User understands both the recommendation and its uncertainty, then takes or saves a concrete next step.
