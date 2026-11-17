# DUBL2 — статический сайт гастробара

Next.js App Router + TypeScript + CSS, локальный JSON-каталог, localStorage-корзина и заказ через WhatsApp. Существующий дизайн сохранён. Backend, базы данных, S3 и админка для текущего сайта не нужны.

```bash
cd frontend
npm ci
npm run dev
# Production:
npm run build
npm start
```

Результат сборки — `frontend/out`. Для Timeweb: Frontend / Next.js / SSR выключен / директория frontend / сборка npm run build / результат out.

**Полная инструкция:** [DEPLOY_STATIC_TIMEWEB.md](DEPLOY_STATIC_TIMEWEB.md).

- Товары: `frontend/data/products.json`.
- Категории: `frontend/data/categories.json`.
- Контакты, доставка, WhatsApp и SEO: `frontend/data/settings.json`.
- Фото: `frontend/public/images/` (WebP/AVIF).
- Слои данных: `frontend/lib/catalog.ts`, `settings.ts`, типы `models.ts`.

Перед публикацией заполните реальный WhatsApp, контакты и домен в settings.json. Сейчас контакты пустые; вымышленные номера не используются. Сумма заказа предварительная, приём подтверждает сотрудник. Фотографии товаров сейчас используют общий иллюстративный AI-кадр; замените их реальными фото заведения.

Сборка, TypeScript и проверки: `npm run build`, `npm run typecheck`, `npx playwright install chromium`, `npm run test:e2e -- --workers=1`. Тесты не требуют FastAPI/PostgreSQL.

Прежняя архитектура сохранена в [ветке fullstack](https://github.com/Rasul05777/Dubl2/tree/fullstack), включая FastAPI, PostgreSQL, админку, S3, Docker Compose и их документацию. Она не участвует в production-сборке main.
