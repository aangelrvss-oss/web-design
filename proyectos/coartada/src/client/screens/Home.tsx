import { useState } from 'react';
import { ROOM_CODE_ALPHABET } from '../../shared/protocol';
import { errorText } from '../lib/text';
import { getPrefs, setPrefs } from '../lib/prefs';
import { roomFromUrl, store, useStore } from '../net/store';
import { openGuide, toast, useAction } from '../ui/kit';

type Mode = 'start' | 'create' | 'join';

export function Home({ onLocal }: { onLocal: () => void }) {
  const snap = useStore();
  const urlCode = roomFromUrl();
  const [mode, setMode] = useState<Mode>(urlCode ? 'join' : 'start');
  const [name, setName] = useState(getPrefs().lastName);
  const [code, setCode] = useState(urlCode ?? '');
  const { busy, run } = useAction();

  const cleanCode = code.toUpperCase().replace(new RegExp(`[^${ROOM_CODE_ALPHABET}]`, 'g'), '').slice(0, 4);
  const nameOk = name.trim().length > 0;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameOk) return toast('Escribe tu nombre (el que verán los demás).', true);
    setPrefs({ lastName: name.trim() });
    if (mode === 'create') void run(() => store.create(name.trim()), undefined, errorText);
    else {
      if (cleanCode.length !== 4) return toast('El código tiene 4 letras.', true);
      void run(() => store.join(cleanCode, name.trim()), undefined, errorText);
    }
  };

  return (
    <main className="screen no-bar" style={{ justifyContent: 'space-between' }}>
      <div className="stack" style={{ gap: 'var(--s-5)', paddingTop: 'var(--s-6)' }}>
        <div>
          <span className="wordmark" aria-label="Coartada">
            Coartada
            <span className="bar" aria-hidden />
          </span>
        </div>
        <section className="paper hero-file tabbed" data-tab="Expediente 001">
          <p className="doc-text">
            Ha ocurrido algo absurdo y una persona del grupo es la culpable. Cada cual declara en secreto dónde estuvo, aparecen pruebas
            que nunca mienten y al final votáis en secreto a quién acusar.
          </p>
        </section>
        {snap.notice && (
          <p className="small" role="status" style={{ color: '#ff8a7e' }}>
            {snap.notice}
          </p>
        )}
      </div>

      {mode === 'start' ? (
        <div className="stack">
          <button className="btn btn-primary btn-block" onClick={() => setMode('create')}>
            Crear sala
          </button>
          <button className="btn btn-paper btn-block" onClick={() => setMode('join')}>
            Unirme con un código
          </button>
          <div className="spread" style={{ marginTop: 'var(--s-2)' }}>
            <button className="link-btn" onClick={openGuide}>
              Guía rápida
            </button>
            <button className="link-btn" onClick={onLocal}>
              Jugar con un solo móvil
            </button>
          </div>
          <p className="muted small">
            De 4 a 10 personas, cada una con su móvil, en la misma habitación o por videollamada. Con el ritmo normal, una ronda dura como
            máximo entre 7 y 9 minutos, según el número de personas. No hace falta registrarse.
          </p>
        </div>
      ) : (
        <form className="stack" onSubmit={submit} noValidate>
          <h2>{mode === 'create' ? 'Nueva sala' : 'Entrar en una sala'}</h2>
          {mode === 'join' && (
            <label className="field">
              <span className="label on-ink">Código de la sala</span>
              <input
                className="input code"
                inputMode="text"
                autoCapitalize="characters"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                maxLength={4}
                value={cleanCode}
                onChange={(e) => setCode(e.target.value)}
                aria-describedby="code-hint"
                autoFocus={!urlCode}
              />
              <span id="code-hint" className="muted small">
                Lo ves en la pantalla de quien creó la sala.
              </span>
            </label>
          )}
          <label className="field">
            <span className="label on-ink">Tu nombre</span>
            <input
              className="input"
              value={name}
              maxLength={16}
              autoComplete="nickname"
              enterKeyHint="go"
              onChange={(e) => setName(e.target.value)}
              autoFocus={mode === 'create' || !!urlCode}
              placeholder="Como te llaman tus amigos"
            />
          </label>
          <button className="btn btn-primary btn-block" type="submit" disabled={busy || !nameOk || (mode === 'join' && cleanCode.length !== 4)}>
            {busy ? 'Conectando…' : mode === 'create' ? 'Crear sala' : 'Entrar'}
          </button>
          <button type="button" className="link-btn" onClick={() => setMode('start')}>
            Volver
          </button>
        </form>
      )}

    </main>
  );
}
