# DUBL2 / Дубль второй

Next.js App Router + TypeScript (static export), FastAPI, PostgreSQL. Целевой deploy: отдельные Frontend App и Backend App в Timeweb Cloud App Platform, фотографии в S3. Каталог и настройки загружаются из FastAPI в браузере. Корзина сохраняется в localStorage; backend повторно проверяет цены и доступность перед подготовкой WhatsApp-сообщения. Бронирование, оплата, Wallet и лояльность не реализуются.

**Инструкция Timeweb, переменные, ограничения SEO и проверка:** [docs/timeweb.md](docs/timeweb.md).

## Локальный Docker Compose

```bash
cp .env.example .env
# Установите свои POSTGRES_PASSWORD и ADMIN_PASSWORD (минимум 12 символов).
docker compose up --build -d
```

Сайт: http://localhost:8080, админка: http://localhost:8080/admin/. Dockerfile frontend собирает статическую папку out и раздаёт её через Nginx. Node.js runtime для frontend не используется. PostgreSQL и uploads хранятся в volumes. Backend при старте применяет миграции и идемпотентный seed. Начальные товары редактируются через админку. Seed создаёт администратора только при отсутствии пользователей; перемена ADMIN_PASSWORD после этого не меняет пароль.

## Локальная разработка без Compose

```bash
python3 -m venv .venv
.venv/bin/pip install -r backend/requirements.lock.txt
cd backend
# Экспортируйте DATABASE_URL для своей PostgreSQL и остальные backend env.
../.venv/bin/alembic upgrade head
../.venv/bin/python -m app.seed
PUBLIC_ORIGIN=http://localhost:3000 COOKIE_SECURE=false ../.venv/bin/uvicorn app.main:app --reload
```

В другом терминале:

```bash
cd frontend
npm ci
# API URL по умолчанию http://localhost:8000
npm run dev
```

Для статической проверки: `npm run build`, затем `npm start` (локальный Python http.server отдаёт out на порту 3000). В Timeweb frontend-режиме команда запуска не нужна. NEXT_PUBLIC_API_URL задаётся при сборке, не во время раздачи.

## Управление контентом

Админка: категории, товары, наличие/видимость, порядок, фотографии, контакты, WhatsApp, доставка/самовывоз, режим работы, заголовки и SEO. WhatsApp задаётся цифрами без плюса; без него оформление блокируется с понятной ошибкой. После проверки заказа покупатель самостоятельно отправляет сообщение; принятие подтверждает заведение.

Категорию с товарами нельзя удалить. Фото: JPEG/PNG/WebP до 8 МБ и 24 Мп, сервер перекодирует в WebP (1920 px и 640 px). `DELETE /api/admin/uploads/{filename}` удаляет только неиспользуемые изображения. В App Platform обязательно настройте STORAGE_BACKEND=s3 — локальная файловая система приложения не является постоянным хранилищем.

## Проверки

- `cd backend && ../.venv/bin/python -m pytest -q` — API, сессии, CSRF/CORS, цены/наличие, загрузки, адаптер S3.
- `cd frontend && npm run build && npm run typecheck` — static export и TypeScript.
- Playwright: см. docs/timeweb.md. E2E выполняйте только на отдельной тестовой БД: создаются/удаляются товары и устанавливается тестовый WhatsApp.

## Резервное копирование

Для локального Compose: `bash scripts/backup.sh` создаёт PostgreSQL dump и архив uploads. Для Timeweb настройте резервные копии managed PostgreSQL и отдельное версионирование/backup S3. Локальный backup-скрипт S3 не копирует. Храните копии вне основного сервера и проверяйте восстановление.

Восстановление локального Compose при остановленных frontend/backend:

```bash
docker compose stop frontend backend
cat backups/DATE/database.dump | docker compose exec -T db pg_restore -U dubl -d dubl --clean --if-exists
cat backups/DATE/uploads.tar.gz | docker compose run --rm -T --no-deps backend tar xzf - -C /app/uploads
docker compose up -d
```

## Структура и ограничения

- frontend/app и components — страницы Next.js и UI, состояния загрузки/ошибок.
- frontend/lib/api.ts — единый API client и URL загруженных фото.
- backend/app — модели, валидация, REST API, storage, seed.
- backend/alembic — миграции; backend/tests — API и storage tests.
- docs/timeweb.md — конфигурация раздельного deploy.
- infra, compose.yaml, scripts — локальная инфраструктура и backup.

Branch предусмотрен в схеме; выбор филиалов пока отсутствует. Админка обновляет данные без пересборки frontend. URL товара для статического хостинга: `/product/?slug=...`. Серверные OG из динамических данных статическому экспорту недоступны; подробности в docs/timeweb.md.

Обложка frontend/public/images/hero.webp создана AI как иллюстрация. Перед публикацией замените её реальными фотографиями. Логотип и снимки из референса в проект не копировались. Дизайн в этой итерации не перерабатывается.

Проверено 14 ноября 2026: static build, TypeScript, 6 backend-тестов, миграция/seed PostgreSQL 17, 6 desktop/mobile Chromium E2E на static out с отдельным API. Реальное окружение Timeweb и S3-ключи ещё не подключались; подробности в docs/timeweb.md.
