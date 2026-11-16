"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="section">
      <h1>Небольшая пауза</h1>
      <p>Не удалось загрузить меню. Попробуйте ещё раз чуть позже.</p>
      <button className="button" onClick={reset}>
        Повторить
      </button>
    </main>
  );
}
