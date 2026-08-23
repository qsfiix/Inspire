Status: Working
Owner: Sofiia
Last Updated: 2026-08-21
Purpose: зафиксировать структуру и поведение текущего React frontend snapshot, включая сильные стороны и технические долги.
Maturity: This is a first product-layer draft grounded in the current Inspirella strategy, data model and AI Studio code snapshot. Review before treating it as final product policy.
Related Files:
- ../Architecture/Current Product State.md
- ../../04_Development/Folder Structure.md
- ../../04_Development/Testing.md

# Current Frontend State

## Entry and shell

`src/main.tsx` монтирует React app. `src/App.tsx` является central shell: language, active tab, auth/profile, theme, resources, trackers и переходы.

## Current views

- `HomeView`, `AboutView`, `ContactView`;
- `LoginView`, `OnboardingView`;
- `DashboardView`, `ResourcesView`, `ProfileView`;
- `MapboxMap`;
- `TrackerSystem`;
- `AdvisorReport`.

## State/data behavior

- theme сохраняется в localStorage;
- profile и trackers идут через `DataRepository`, но часто local-first;
- resources and institutions пытаются загружаться из Supabase через Repository;
- EducationEngine вызывается через `useEducationEngine`;
- Mapbox имеет fallback projection map;
- multilingual UI хранится в большом `src/data.ts`.

## Frontend risks

- App shell перегружен;
- feature logic и presentation местами смешаны;
- route state не отражён в URL;
- типизация ослаблена `any` в Repository и feature props;
- data loading дублируется;
- current auth labels выглядят реальнее, чем фактическая auth implementation.

## First target

Не переписывать frontend с нуля. Сначала закрепить contracts, добавить typed services, исправить runtime config flow и выделить state boundaries, сохраняя рабочую визуальную версию.
