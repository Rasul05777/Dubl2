"use client";
import { useEffect, useState, ReactNode } from "react";
import { publicData } from "../lib/api";
type Data = Awaited<ReturnType<typeof publicData>>;
export function PublicData({
  children,
}: {
  children: (data: Data) => ReactNode;
}) {
  const [data, setData] = useState<Data | null>(null),
    [error, setError] = useState(false),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setError(false);
    publicData()
      .then((d) => {
        if (active) {
          setData(d);
          document.title = d.settings.seo_title;
          const meta = document.querySelector('meta[name="description"]');
          meta?.setAttribute("content", d.settings.seo_description);
        }
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [attempt]);
  if (error)
    return (
      <main className="section">
        <h1>Небольшая пауза</h1>
        <p>Не удалось загрузить меню. Проверьте соединение.</p>
        <button className="button" onClick={() => setAttempt((x) => x + 1)}>
          Повторить
        </button>
      </main>
    );
  if (!data)
    return (
      <main className="section" role="status">
        <p className="eyebrow">ДУБЛЬ ВТОРОЙ</p>
        <h2>Готовим ваше меню…</h2>
      </main>
    );
  return children(data);
}
