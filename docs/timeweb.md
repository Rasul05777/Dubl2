# DUBL2: Timeweb Cloud App Platform

## Совместимость и минимальные изменения

Стек сохранён: Next.js App Router / TypeScript, FastAPI, PostgreSQL. Дизайн не перерабатывался.

| Было                                             | Стало для static export                                                  |
| ------------------------------------------------ | ------------------------------------------------------------------------ |
| output: standalone, Next.js runtime              | output: export, папка frontend/out                                       |
| Серверная загрузка главной и меню, force-dynamic | Клиентская загрузка FastAPI, состояния загрузки, ошибки, повтор          |
| Next rewrites для /api и /uploads                | NEXT_PUBLIC_API_URL + CORS и credentials: include                        |
| /menu/[slug], серверные params                   | /product/?slug=..., работает для добавленных после сборки товаров        |
| Серверные searchParams меню                      | useSearchParams под Suspense                                             |
| generateMetadata с запросом к backend            | Статические метаданные + обновление title/description после загрузки     |
| Локальные файлы контейнера                       | S3-совместимый приватный бакет, локальный volume оставлен для разработки |

Next.js static export не создаёт HTML для неизвестных во время сборки динамических путей. Поэтому URL карточки изменён, сама карточка и добавление в корзину сохранены. Старые /menu/<slug> нельзя обслуживать произвольным статическим хостингом без правил перенаправления. Если эти адреса уже опубликованы, настройте на внешнем прокси redirect /menu/<slug> → /product/?slug=<slug>.

Статические HTML содержат общие SEO/OG из app/layout.tsx. Заголовок и description из админки применяются в браузере. OG-превью мессенджера не обновляется клиентским JavaScript; для индивидуальных OG нужен отдельный build-time снимок метаданных с пересборкой либо серверный сервис превью. Каталог и настройки не вшиваются в сборку и читаются из FastAPI при открытии. Обновления админки видны при следующей загрузке страницы без deploy frontend.

## Frontend App (оплата за запросы)

- Директория проекта: `frontend`.
- Node.js 22.
- Выбрать Next.js frontend **без SSR**.
- Установка: `npm ci` (lock-файл включён).
- Команда сборки: `npm run build`.
- Директория результата: `out`.
- Переменные **сборки**:
  - `NEXT_PUBLIC_API_URL=https://api.example.com` — origin backend, без `/api`, без завершающего `/`.
  - `SITE_URL=https://www.example.com` — для sitemap/robots.

NEXT_PUBLIC_API_URL публичный и встраивается в JS. Пароли и ключи сюда не помещать. После изменения API URL нужна пересборка. Next.js server, npm start и Dockerfile для frontend в Timeweb frontend-режиме не требуются. Dockerfile frontend оставлен для локального Compose: он раздаёт out через Nginx.

Если используется вариант платформы HTML/CSS/JS вместо Next.js, сначала соберите проект в CI и разместите **содержимое out** как готовый статический артефакт; у этого режима нет этапа сборки.

## Backend App

- Отдельное Python 3.12 приложение, директория проекта `backend`.
- Установка: `pip install -r requirements.lock.txt`.
- Команда запуска: `sh start.sh` (миграция, идемпотентный seed, uvicorn на `${PORT:-8000}`). Укажите соответствующий порт приложения в панели.
- Managed PostgreSQL: создайте базу/пользователя и укажите `DATABASE_URL=postgresql+asyncpg://USER:URL_ENCODED_PASSWORD@HOST:PORT/DBNAME`. Используйте параметры TLS, выданные провайдером, например `?ssl=require`, и сетевые правила доступа к базе.
- Все переменные из `backend/.env.example` задаются в панели, файл сам не загружается.
- `PUBLIC_ORIGIN=https://www.example.com` — точный origin frontend без пути и завершающего слеша.
- `COOKIE_SECURE=true`.
- `COOKIE_SAMESITE=lax` для frontend/API на поддоменах одного сайта с HTTPS.
- ADMIN_PASSWORD — минимум 12 символов. Seed не меняет пароль уже созданного администратора.
- Проверка доступности: `/api/health`. Этот endpoint проверяет процесс, не подключение к БД; `/api/settings` дополнительно проверяет чтение БД.

Рекомендуемая схема доменов: `www.example.com` и `api.example.com`. Cookie остаётся HttpOnly и ограничена хостом API; все запросы frontend используют credentials: include. Для разных сайтов потребуется COOKIE_SAMESITE=none и COOKIE_SECURE=true, но браузеры могут блокировать сторонние cookie — поэтому для надёжной админки используйте поддомены одного собственного домена. Не заменяйте cookie токенами в localStorage. Origin проверяется backend для всех мутаций, CORS допускает только PUBLIC_ORIGIN.

Начните с одного экземпляра/worker: существующий limiter хранится в памяти процесса. Перед масштабированием нужен общий limiter и настройка доверенного источника IP за прокси Timeweb. Миграции для нескольких реплик запускаются одним отдельным pre-deploy job; не запускайте параллельно несколько миграторов.

## Постоянные фотографии: Timeweb S3

Создайте приватный бакет и сервисные ключи с правами чтения, записи и удаления объектов только этого бакета. Задайте backend:

```dotenv
STORAGE_BACKEND=s3
S3_ENDPOINT_URL=https://s3.twcstorage.ru
S3_REGION=ru-1
S3_BUCKET=your-bucket
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_PREFIX=uploads
```

Endpoint и регион сверяйте с параметрами вашего бакета. Ключи хранятся только в backend env. Локальный каталог контейнера в этом режиме не используется для фотографий.

Backend проверяет и перекодирует изображение, отправляет WebP и уменьшенную версию в S3. В PostgreSQL остаётся `/uploads/<key>.webp`. Frontend дополняет URL origin API. GET /uploads/<key> возвращает временный подписанный S3 URL (15 минут) с Cache-Control: no-store. Бакет открывать на публичную запись/чтение не требуется. После перезапуска backend ссылки в БД продолжают работать. Удаление проверяет связи товаров и настроек. Версионирование/резервное копирование бакета настройте отдельно.

Если ранее использовали local volume, скопируйте файлы из uploads в S3 под S3_PREFIX **с теми же именами**, затем переключите STORAGE_BACKEND. Автоматической миграции файлов нет. Старые записи /uploads/... сохраняются. Включите STORAGE_BACKEND=s3 до приёма новых загрузок в App Platform.

## Проверки перед публикацией

```bash
cd frontend
npm ci
NEXT_PUBLIC_API_URL=https://api.example.com SITE_URL=https://www.example.com npm run build
npm run typecheck
# Локальная раздача результата (только для разработки):
python3 -m http.server 3000 --directory out
```

В другом терминале запустите FastAPI с PUBLIC_ORIGIN=http://localhost:3000, COOKIE_SECURE=false, DATABASE_URL для отдельной тестовой PostgreSQL. Не используйте production-базу для e2e: тест создаёт/удаляет товар и задаёт тестовый WhatsApp.

```bash
cd backend
python -m pytest -q
# после запуска frontend и API:
cd ../frontend
npx playwright install chromium
E2E_BASE_URL=http://localhost:3000 E2E_API_URL=http://localhost:8000 \
E2E_ADMIN_PASSWORD=your-test-password npm run test:e2e -- --workers=1
```

Собирайте frontend с тем API URL, на котором будете тестировать. E2E_BASE_URL и E2E_API_URL не меняют уже собранный JavaScript. Mobile-проект проверяет мобильную геометрию в Chromium, Safari/WebKit отдельно не проверяется.

После реального deploy отдельно проверьте TLS, CORS, вход/выход и фото из S3 после redeploy backend. Учётная запись Timeweb, домены и ключи S3 в исходники не включены.

Официальная документация:

- https://nextjs.org/docs/app/guides/static-exports
- https://timeweb.cloud/docs/apps/deploying-frontend-apps/nextjs
- https://timeweb.cloud/docs/apps/deploying-frontend-apps/static-website
- https://github.com/timeweb-cloud/s3-examples/blob/master/python3/main.py

## Результаты проверки 14 ноября 2026

- `npm run build` (Next.js 16.4.6, webpack): успешен; все страницы статические, результат в frontend/out. Сборка не требует подключения к FastAPI.
- `npm run typecheck`: успешен.
- `pytest`: 6 passed (SQLite API-тесты, CORS и mock S3 adapter). Есть предупреждение Starlette о будущем переходе TestClient на httpx2, на результат не влияет.
- Alembic upgrade head + seed: успешны на отдельном PostgreSQL 17.
- Playwright: 6 passed, desktop и mobile Chromium. Раздача out обычным HTTP-сервером на отдельном порту; API на другом origin, PostgreSQL. Проверены CORS/cookie login, корзина после reload, валидация, создание товара и фото после сборки, открытие товара, WhatsApp preview, удаление тестовых данных.
- Docker Compose config и shell-синтаксис start.sh: проверены. Полная сборка Docker-образов в этой итерации отдельно не выполнялась.
- Реальный deploy Timeweb, сертификаты и S3 с облачными ключами не проверены. Mock S3 проверяет контракт boto3, но не доступность конкретного бакета и его IAM-политику.

Turbopack в этом sandbox не может открыть внутренний порт; команда build использует штатный `next build --webpack`, который успешно собирает тот же static export.
