Status: Working
Owner: Sofiia
Last Updated: 2026-08-21
Purpose: определить смысл Phoenix Logo и правила использования брендовых символов Inspirella.
Maturity: This is a first product-layer draft grounded in the current Inspirella strategy, data model and AI Studio code snapshot. Review before treating it as final product policy.
Related Files:
- Brand UI Foundations.md
- ../../00_Brain/Vision.md
- ../../04_Development/Coding Standards.md

# Logo and Brand Symbols

## Phoenix meaning

Phoenix может символизировать рост, обновление и возможность начать новый этап. В Inspirella этот образ поддерживает идею, что путь не предопределён и может развиваться, но не должен превращаться в обещание гарантированного успеха.

## Usage

- Logo используется в shell, public home и ключевых identity points.
- Decorative mark не должен конкурировать с recommendation/next step.
- В маленьких размерах сохраняется узнаваемый silhouette.
- Для screen readers нужен meaningful alt там, где logo несёт смысл; декоративные экземпляры помечаются как decorative.
- Не менять пропорции, не использовать слишком яркий glow на каждом экране.

## Current implementation

`src/components/PhoenixLogo.tsx` — текущий reusable logo component. Изменения должны сохранять dark/light readability и не связывать брендовый компонент с feature state.
