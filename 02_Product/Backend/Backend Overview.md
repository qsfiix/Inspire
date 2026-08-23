Status: Working
Owner: Sofiia
Last Updated: 2026-08-21
Purpose: описать серверный слой Inspirella, его ответственность за секреты, внешние интеграции, API и безопасные fallback-механизмы.
Maturity: This is a first product-layer draft grounded in the current Inspirella strategy, data model and AI Studio code snapshot. Review before treating it as final product policy.
Related Files:
- ../API/API Overview.md
- ../../04_Development/Environment Variables.md
- Prototype Limitations.md

# Backend Overview

## Роль backend

Backend защищает server-only secrets, выполняет внешние AI-вызовы, контролирует API-контракты и со временем станет местом, где применяются authorization, validation, publication policy и audit logic.

## Текущий snapshot

`server.ts`:

- вызывает `dotenv.config()`;
- поднимает Express и Vite middleware;
- отдаёт `/api/config`;
- содержит lazy-loaded `GoogleGenAI` client;
- реализует `/api/gemini/advisor`;
- использует fallback response при ошибке AI;
- запускает порт 3000.

## Что должно остаться на сервере

- `GEMINI_API_KEY`;
- service-role/administrative credentials, если они появятся;
- trusted server-to-server tokens;
- rate limits, validation, audit metadata;
- приватная бизнес-логика, которую нельзя доверять клиенту.

Supabase anon key и Mapbox public token могут попадать в клиент только в пределах их public security model, RLS и domain restrictions. Это не означает, что любые Supabase tokens можно отдавать браузеру.

## Backend quality bar

- explicit config schema;
- fail-safe startup checks;
- no secret values in logs;
- structured error responses;
- input size limits;
- request validation;
- tests for missing/invalid environment;
- health check without leaking configuration.
