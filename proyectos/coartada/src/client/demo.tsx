// Standalone demo: single-phone mode + illustrated guide, no server.
// Built into ONE self-contained HTML file by `npm run build:demo`.
import { Component, StrictMode, useEffect, useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/archivo/standard.css';
import '@fontsource-variable/instrument-sans/standard.css';
import '@fontsource/courier-prime/400.css';
import '@fontsource/courier-prime/700.css';
import './styles/app.css';
import { LocalGame } from './screens/Local';
import { Guide } from './screens/Guide';
import { GuideHost } from './screens/QuickGuide';
import { ToastHost } from './ui/kit';

type View = 'inicio' | 'guia' | 'jugar';

function initialView(): View {
  const h = location.hash.replace('#', '');
  return h === 'guia' || h === 'jugar' ? h : 'inicio';
}

function DemoApp() {
  const [view, setView] = useState<View>(initialView);
  useEffect(() => {
    // Statement body on purpose: an effect must never return a value (some hosts patch scrollTo).
    try {
      window.scrollTo(0, 0);
    } catch {
      /* ignore */
    }
  }, [view]);

  if (view === 'jugar')
    return (
      <>
        <LocalGame onExit={() => setView('inicio')} />
        <ToastHost />
        <GuideHost />
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
            Ha ocurrido algo absurdo y una persona del grupo es la culpable. Cada cual declara en secreto dónde estuvo, aparecen pruebas que
            nunca mienten y al final votáis en secreto a quién acusar.
          </p>
        </section>
      </div>
      <div className="stack">
        <button className="btn btn-primary btn-block" onClick={() => setView('jugar')}>
          Jugar en este móvil
        </button>
        <button className="btn btn-paper btn-block" onClick={() => setView('guia')}>
          Guía rápida (3 minutos)
        </button>
        <p className="muted small">
          Esta página es la versión de un solo móvil: de 4 a 10 personas, os lo vais pasando para las partes secretas. La versión con un
          móvil por persona necesita el servidor del proyecto.
        </p>
      </div>
    </main>
  );
}

/** Shows what went wrong instead of a blank screen, and offers a way back. */
class Boundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="screen no-bar" style={{ justifyContent: 'center' }}>
        <section className="paper stack">
          <h2>Algo ha fallado</h2>
          <p>La página ha encontrado un error. Vuelve al inicio para seguir. Si se repite, comunica este mensaje:</p>
          <p className="doc-text" style={{ overflowWrap: 'anywhere' }}>{String(this.state.error.message || this.state.error)}</p>
          <button className="btn btn-primary btn-block" onClick={() => this.setState({ error: null })}>
            Volver al inicio
          </button>
        </section>
      </main>
    );
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Clearing the error remounts the demo fresh, on the home screen. */}
    <Boundary>
      <DemoApp />
    </Boundary>
  </StrictMode>,
);
