// Lobby: pick the character you are drawn as. One per person (the server has the last word if two
// people tap the same one at once), changes show for everyone at once, and the name the group sees
// is always your own: the character only gives you a face.
import { AVATARS, type AvatarId } from '../../shared/characters';
import type { PublicView } from '../../shared/engine/views';
import { shortNames } from '../lib/colors';
import { errorText } from '../lib/text';
import { store } from '../net/store';
import { avatarLabel, PortraitCard } from '../ui/portraits';
import { Icon, Pin, useAction } from '../ui/kit';

export function CharacterPicker({ pub, me }: { pub: PublicView; me: string }) {
  const { busy, run } = useAction();
  const mine = pub.players.find((p) => p.id === me);
  const owner = new Map(pub.players.filter((p) => !p.left && p.avatar).map((p) => [p.avatar as AvatarId, p]));
  const free = AVATARS.filter((a) => !owner.has(a));
  // Who has each one, by a short name that is never the same for two people (full name in the
  // card's label and in the list of people just below).
  const short = shortNames(pub.players.filter((p) => !p.left), 7);
  if (!mine) return null;
  const pick = (avatar: AvatarId) => void run(() => store.send('room:avatar', { avatar }), undefined, errorText);

  return (
    <section className="paper tabbed picker" data-tab="Tu personaje" aria-labelledby="picker-title">
      <div className="picker-head">
        <div className="picker-polaroid" aria-hidden>
          {mine.avatar ? <PortraitCard id={mine.avatar} /> : <span className="picker-empty">?</span>}
        </div>
        <div className="stack" style={{ gap: 6, minWidth: 0 }}>
          <h2 id="picker-title" className="picker-title">
            Elige personaje
          </h2>
          <p className="small">Cada persona tiene uno distinto. Es solo tu dibujo: no cambia nada del juego.</p>
          <div className="picker-preview">
            <span className="label">Así te verá el grupo</span>
            <span className="row" style={{ gap: 8 }}>
              <Pin player={mine} size="lg" />
              <b className="picker-name">{mine.name}</b>
            </span>
          </div>
        </div>
      </div>
      {free.length === 0 && !mine.avatar && <p className="small" role="status">No quedan personajes libres: seguirás con tus iniciales.</p>}
      <div className="picker-grid" role="group" aria-label="Personajes">
        {AVATARS.map((a) => {
          const who = owner.get(a);
          const isMine = who?.id === me;
          const taken = !!who && !isMine;
          return (
            <button
              key={a}
              type="button"
              className={`picker-card ${isMine ? 'mine' : ''} ${taken ? 'taken' : ''}`}
              aria-pressed={isMine}
              disabled={taken || busy}
              aria-label={`${avatarLabel(a)}: ${isMine ? 'tu personaje' : taken ? `lo tiene ${who!.name}` : 'libre'}`}
              onClick={() => !isMine && pick(a)}
            >
              <PortraitCard id={a} />
              {isMine && (
                <span className="picker-check" aria-hidden>
                  <Icon name="check" />
                </span>
              )}
              {taken && (
                <span className="picker-owner" aria-hidden>
                  {short[who!.id]}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
