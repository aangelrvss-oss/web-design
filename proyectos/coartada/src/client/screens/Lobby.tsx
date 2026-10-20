import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { FORGERY_CHANCES, MAX_PLAYERS, MIN_PLAYERS, timingsFor, type Pace } from '../../shared/types';
import type { PublicView } from '../../shared/engine/views';
import { errorText, PACE_TEXT, plural } from '../lib/text';
import { store } from '../net/store';
import { ActionBar, Icon, Pin, Segmented, Switch, toast, TopBar, useAction } from '../ui/kit';
import { CharacterPicker } from './CharacterPicker';

/** Maximum round length with full timers (verdict and runoff excluded), rounded. */
function roundMinutes(pace: Pace, players: number): string {
  const t = timingsFor(pace, players);
  const secs = t.declare + t.investigate1 + t.investigate2 + t.defense + t.vote;
  return String(Math.round(secs / 60));
}

export function inviteUrl(code: string): string {
  return `${location.origin}/?sala=${code}`;
}

function Qr({ text }: { text: string }) {
  const [svg, setSvg] = useState('');
  useEffect(() => {
    QRCode.toString(text, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#2b2721', light: '#efe8d8' } })
      .then(setSvg)
      .catch(() => setSvg(''));
  }, [text]);
  // The SVG comes from the qrcode library, built from our own invite URL.
  return <div className="qr" role="img" aria-label="Código QR para unirse" dangerouslySetInnerHTML={{ __html: svg }} />;
}

export function Lobby({ pub, me, onMenu }: { pub: PublicView; me: string; onMenu: () => void }) {
  const isHost = pub.hostId === me;
  const present = pub.players.filter((p) => !p.left);
  const online = present.filter((p) => p.connected);
  const host = pub.players.find((p) => p.id === pub.hostId);
  const url = inviteUrl(pub.code);
  const { busy, run } = useAction();
  const missing = Math.max(0, MIN_PLAYERS - online.length);

  const share = async () => {
    const data = { title: 'Coartada', text: `Entra en mi sala de Coartada: ${pub.code}`, url };
    try {
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(url);
        toast('Enlace copiado.');
      }
    } catch {
      /* share sheet dismissed */
    }
  };

  const setSettings = (patch: object) => void run(() => store.send('room:settings', patch), undefined, errorText);

  return (
    <main className="screen">
      <TopBar title={PHASE_TITLE(pub)} step={pub.roundsPlayed ? `${plural(pub.roundsPlayed, 'ronda jugada', 'rondas jugadas')}` : undefined} onMenu={onMenu} />

      <section className="paper tabbed" data-tab="Invitación" aria-label="Invitar a la sala">
        <div className="row" style={{ gap: 'var(--s-4)', alignItems: 'center', flexWrap: 'wrap' }}>
          <Qr text={url} />
          <div className="stack" style={{ gap: 6, minWidth: 140, flex: 1 }}>
            <div className="label">Código de la sala</div>
            <div className="room-code">{pub.code}</div>
            <p className="small muted">Escaneadlo con la cámara o entrad en {location.host} con el código.</p>
          </div>
        </div>
        <div className="row" style={{ marginTop: 'var(--s-3)' }}>
          <button className="btn btn-ghost btn-sm grow" onClick={share}>
            <span style={{ width: 18 }}>
              <Icon name="share" />
            </span>
            Compartir enlace
          </button>
        </div>
      </section>

      <CharacterPicker pub={pub} me={me} />

      <section aria-label="Personas en la sala">
        <div className="spread">
          <h3>En la sala</h3>
          <span className="muted small">
            {online.length}/{MAX_PLAYERS}
          </span>
        </div>
        <ul className="list-plain" style={{ marginTop: 6 }}>
          {present.map((p) => (
            <li key={p.id} className="player-row">
              <Pin player={p} size="lg" />
              <span className="player-name">
                {p.name}
                {p.id === me && <span className="muted"> (tú)</span>}
              </span>
              {p.isHost && <span className="tag">Dirige</span>}
              {!p.connected && <span className="tag">Sin conexión</span>}
              {pub.roundsPlayed > 0 && <span className="tag">{p.score} pts</span>}
              {isHost && !p.connected && p.id !== me && (
                <button className="btn btn-ghost btn-sm" onClick={() => void run(() => store.send('room:kick', { playerId: p.id }), undefined, errorText)}>
                  Quitar
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="stack" aria-label="Ajustes de la partida">
        <h3>Ajustes</h3>
        {!isHost && <p className="small muted">Solo {host?.name ?? 'quien dirige'} puede cambiarlos.</p>}
        <div className="field">
          <span className="label on-ink">Ritmo</span>
          <Segmented
            label="Ritmo"
            value={pub.settings.pace}
            disabled={!isHost || busy}
            onChange={(pace) => setSettings({ pace })}
            options={(['relajado', 'normal', 'rapido'] as const).map((v) => ({ value: v, label: PACE_TEXT[v] }))}
          />
        </div>
        <p className="small muted">
          Con {Math.max(online.length, MIN_PLAYERS)} personas, una ronda dura como máximo {roundMinutes(pub.settings.pace, Math.max(online.length, MIN_PLAYERS))}{' '}
          minutos (termina antes si todo el mundo acaba).
        </p>
        <div className="field">
          <span className="label on-ink">Rondas por partida</span>
          <Segmented
            label="Rondas"
            value={pub.settings.rounds}
            disabled={!isHost || busy}
            onChange={(rounds) => setSettings({ rounds })}
            options={[
              { value: 3, label: '3' },
              { value: 5, label: '5' },
              { value: 8, label: '8' },
              { value: 0, label: 'Sin fin' },
            ]}
          />
        </div>
        <Switch
          label="Objetivos secretos"
          hint="Cada persona recibe una misión extra de +1 punto; alguna obliga a mentir. No cambian quién gana la ronda. Recomendados a partir de la segunda ronda."
          checked={pub.settings.encargos}
          disabled={!isHost || busy}
          onChange={(encargos) => setSettings({ encargos })}
        />
        <Switch
          label="Prueba falsificable · experimental"
          hint="Reglas en prueba: la persona culpable puede falsificar una de las dos pruebas y el grupo puede pedir que se revise una. No cambia los puntos. Solo para partidas de prueba."
          checked={pub.settings.variant === 'prueba_falsa'}
          disabled={!isHost || busy}
          onChange={(on) => setSettings({ variant: on ? 'prueba_falsa' : null })}
        />
        {pub.settings.variant === 'prueba_falsa' && (
          <div className="field">
            <span className="label on-ink">Oportunidad de falsificar (experimental)</span>
            <Segmented
              label="Oportunidad de falsificar"
              value={pub.settings.forgeryChance ?? 100}
              disabled={!isHost || busy}
              onChange={(forgeryChance) => setSettings({ forgeryChance })}
              options={FORGERY_CHANCES.map((v) => ({ value: v, label: `${v} %` }))}
            />
            <p className="small muted" style={{ marginTop: 6 }}>
              Probabilidad de que la persona culpable pueda falsificar en cada ronda; si la tiene, decide si la usa. Son condiciones de prueba para
              comparar con grupos reales, ninguna es mejor de antemano. Nadie más sabe si la tuvo hasta el veredicto.
            </p>
          </div>
        )}
      </section>

      <ActionBar
        hint={
          isHost
            ? missing > 0
              ? `Faltan ${plural(missing, 'persona', 'personas')} para empezar.`
              : `Hay ${online.length} personas conectadas. Ya podéis empezar.`
            : `Esperando a que ${host?.name ?? 'quien dirige'} empiece la partida.`
        }
      >
        {isHost ? (
          <button className="btn btn-primary" disabled={busy || missing > 0} onClick={() => void run(() => store.send('game:start'), undefined, errorText)}>
            Empezar partida
          </button>
        ) : (
          <button className="btn btn-ghost" onClick={share}>
            Invitar a más gente
          </button>
        )}
      </ActionBar>
    </main>
  );
}

function PHASE_TITLE(pub: PublicView): string {
  return pub.roundsPlayed > 0 ? 'Sala de espera' : 'Sala de espera';
}
