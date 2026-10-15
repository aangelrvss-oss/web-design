// Standalone demo: single-phone mode + illustrated guide, no server.
// Built into ONE self-contained HTML file by `npm run build:demo`.
import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/archivo/standard.css';
import '@fontsource-variable/instrument-sans/standard.css';
import '@fontsource/courier-prime/400.css';
import '@fontsource/courier-prime/700.css';
import './styles/app.css';
import { LocalGame } from './screens/Local';
import { Guide } from './screens/Guide';
import { ToastHost } from './ui/kit';

type View = 'inicio' | 'guia' | 'jugar';

function initialView(): View {
  const h = location.hash.replace('#', '');
  return h === 'guia' || h === 'jugar' ? h : 'inicio';
}

function DemoApp() {
  const [view, setView] = useState<View>(initialView);
  useEffect(() => window.scrollTo({ top: 0 }), [view]);

  if (view === 'jugar')
    return (
      <>
        <LocalGame onExit={() => setView('inicio')} />
        <ToastHost />
      </>
    );
  if (view === 'guia') return <Guide onPlay={() => setView('jugar')} onBack={() => setView('inicio')} />;

  return (
    <main className="screen no-bar" style={{ justifyContent: 'space-between' }}>
      <div className="stack" style={{ gap: 'var(--s-5)', paddingTop: 'var(--s-6)' }}>
        <span className="wordmark" aria-label="Coartada">
          Coartada
          <span className="bar" aria-hidden />
        </span>
        <section className="paper hero-file tabbed" data-tab="Expediente 001">
          <p className="doc-text">
            Anoche pasó algo absurdo y uno de vosotros fue. Cada uno declara dónde estuvo, las pruebas van saliendo y al final votáis en
            secreto quién miente.
          </p>
        </section>
      </div>
      <div className="stack">
        <button className="btn btn-primary btn-block" onClick={() => setView('jugar')}>
          Jugar en este móvil
        </button>
        <button className="btn btn-paper btn-block" onClick={() => setView('guia')}>
          Guía rápida (2 minutos)
        </button>
        <p className="muted small">
          De 4 a 10 personas con un solo móvil que os vais pasando. La versión con un móvil por persona necesita el servidor del
          proyecto; la guía explica cómo arrancarlo.
        </p>
      </div>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DemoApp />
  </StrictMode>,
);
