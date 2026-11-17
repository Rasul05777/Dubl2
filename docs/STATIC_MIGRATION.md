# Переход DUBL2 на статический сайт

Версия с backend сохранена в ветке fullstack на GitHub. Стили frontend/app/globals.css не изменялись.

## Изменённые файлы

- `D` `.env.example`
- `A` `DEPLOY_STATIC_TIMEWEB.md`
- `M` `README.md`
- `D` `backend/.dockerignore`
- `D` `backend/.env.example`
- `D` `backend/Dockerfile`
- `D` `backend/alembic.ini`
- `D` `backend/alembic/env.py`
- `D` `backend/alembic/versions/0001_initial.py`
- `D` `backend/app/db.py`
- `D` `backend/app/main.py`
- `D` `backend/app/models.py`
- `D` `backend/app/schemas.py`
- `D` `backend/app/seed.py`
- `D` `backend/app/storage.py`
- `D` `backend/requirements.lock.txt`
- `D` `backend/requirements.txt`
- `D` `backend/start.sh`
- `D` `backend/tests/test_api.py`
- `D` `backend/tests/test_storage.py`
- `D` `compose.yaml`
- `M` `docs/timeweb.md`
- `M` `frontend/.env.example`
- `M` `frontend/Dockerfile`
- `D` `frontend/app/admin/layout.tsx`
- `D` `frontend/app/admin/page.tsx`
- `M` `frontend/app/checkout/page.tsx`
- `M` `frontend/app/layout.tsx`
- `A` `frontend/app/menu/[slug]/page.tsx`
- `M` `frontend/app/menu/page.tsx`
- `M` `frontend/app/page.tsx`
- `M` `frontend/app/product/page.tsx`
- `M` `frontend/app/robots.ts`
- `M` `frontend/app/sitemap.ts`
- `M` `frontend/components/catalog.tsx`
- `A` `frontend/components/legacy-product.tsx`
- `D` `frontend/components/public-data.tsx`
- `M` `frontend/components/shop.tsx`
- `A` `frontend/data/categories.json`
- `A` `frontend/data/products.json`
- `A` `frontend/data/settings.json`
- `D` `frontend/lib/api.ts`
- `A` `frontend/lib/catalog.ts`
- `A` `frontend/lib/checkout.ts`
- `A` `frontend/lib/format.ts`
- `A` `frontend/lib/models.ts`
- `A` `frontend/lib/settings.ts`
- `M` `frontend/package.json`
- `M` `frontend/playwright.config.ts`
- `A` `frontend/public/images/categories/.gitkeep`
- `A` `frontend/public/images/products/cafe-selection.webp`
- `A` `frontend/public/images/site/hero.webp`
- `A` `frontend/scripts/validate-data.mjs`
- `A` `frontend/tests/logic.spec.ts`
- `M` `frontend/tests/shop.spec.ts`
- `D` `infra/nginx.conf`
- `D` `infra/nginx.https.conf`
- `D` `scripts/backup.sh`

## Зависимости

Frontend-зависимости сохранены: Next.js, React, TypeScript, Tailwind/CSS, Motion, React Hook Form, Zod и Lucide. Новые runtime-зависимости не добавлялись.

Из текущей архитектуры удалены Python-зависимости: FastAPI, uvicorn, SQLAlchemy, asyncpg, Alembic, pydantic-settings, pwdlib/argon2, python-multipart, Pillow, pytest, httpx, aiosqlite, boto3. Их исходники и lock-файл сохранены в fullstack. PostgreSQL, Docker Compose и S3 не нужны для запуска статического сайта.

## Проверки

Production build и typecheck успешны. 20 проверок Playwright/логики заказа прошли (desktop/mobile Chromium). Главная и каталог проверены без JavaScript, API и backend не запускались. Реальные WhatsApp-контакты и домен ещё нужно заполнить. Инструкция: ../DEPLOY_STATIC_TIMEWEB.md.
