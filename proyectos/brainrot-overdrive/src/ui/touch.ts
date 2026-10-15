import { input } from '../core/input';
import { touchState } from '../scenes/GameScene';

/**
 * Touch controls: a floating joystick (appears where the left thumb lands) and two big
 * buttons on the right. Only shown once touch input is detected and during gameplay.
 */
export class TouchControls {
  private el: HTMLElement;
  private stick: HTMLElement;
  private knob: HTMLElement;
  private dashMask: HTMLElement;
  private odBtn: HTMLElement;
  private pointerId: number | null = null;
  private ox = 0;
  private oy = 0;
  private visible = false;

  constructor(root: HTMLElement) {
    this.el = document.createElement('div');
    this.el.className = 'touch hidden';
    this.el.innerHTML = `
      <div class="stick-zone"><div class="stick"><i></i></div></div>
      <div class="touch-btns">
        <button class="tbtn od" aria-label="Overdrive"><span>OD</span></button>
        <button class="tbtn dash" aria-label="Dash"><div class="cdmask"></div><span>Dash</span></button>
      </div>`;
    root.appendChild(this.el);
    const zone = this.el.querySelector<HTMLElement>('.stick-zone')!;
    this.stick = this.el.querySelector<HTMLElement>('.stick')!;
    this.knob = this.stick.querySelector('i')!;
    this.dashMask = this.el.querySelector<HTMLElement>('.cdmask')!;
    this.odBtn = this.el.querySelector<HTMLElement>('.tbtn.od')!;

    zone.addEventListener('pointerdown', (e) => {
      if (this.pointerId !== null) return;
      this.pointerId = e.pointerId;
      zone.setPointerCapture(e.pointerId);
      this.ox = e.clientX;
      this.oy = e.clientY;
      this.stick.style.left = `${e.clientX}px`;
      this.stick.style.top = `${e.clientY - zone.getBoundingClientRect().top}px`;
      this.stick.classList.add('on');
      input.usedTouch = true;
      input.touchActive = true;
      this.move(e.clientX, e.clientY);
    });
    zone.addEventListener('pointermove', (e) => {
      if (e.pointerId === this.pointerId) this.move(e.clientX, e.clientY);
    });
    const end = (e: PointerEvent) => {
      if (e.pointerId !== this.pointerId) return;
      this.pointerId = null;
      input.touchActive = false;
      input.stickX = input.stickY = 0;
      this.stick.classList.remove('on');
      this.knob.style.transform = '';
    };
    zone.addEventListener('pointerup', end);
    zone.addEventListener('pointercancel', end);
    const tap = (btn: HTMLElement, key: string) => btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      input.usedTouch = true;
      input.press(key);
    });
    tap(this.el.querySelector<HTMLElement>('.tbtn.dash')!, 'dash');
    tap(this.odBtn, 'overdrive');
    const loop = () => {
      if (this.visible) {
        this.dashMask.style.transform = `scaleY(${(1 - touchState.dashFrac).toFixed(2)})`;
        this.odBtn.classList.toggle('ready', touchState.odReady);
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  private move(x: number, y: number) {
    const max = 52;
    let dx = x - this.ox, dy = y - this.oy;
    const d = Math.hypot(dx, dy);
    if (d > max) {
      // drag the base along so the stick never "runs out"
      this.ox += (dx / d) * (d - max);
      this.oy += (dy / d) * (d - max);
      dx = x - this.ox;
      dy = y - this.oy;
      const zone = this.stick.parentElement!.getBoundingClientRect();
      this.stick.style.left = `${this.ox}px`;
      this.stick.style.top = `${this.oy - zone.top}px`;
    }
    const m = Math.min(1, Math.hypot(dx, dy) / max);
    const a = Math.atan2(dy, dx);
    const dead = m < 0.12 ? 0 : m;
    input.stickX = Math.cos(a) * dead;
    input.stickY = Math.sin(a) * dead;
    this.knob.style.transform = `translate(${dx}px, ${dy}px)`;
  }

  show(on: boolean) {
    this.visible = on && input.usedTouch;
    this.el.classList.toggle('hidden', !this.visible);
    document.documentElement.classList.toggle('is-touch', input.usedTouch);
  }
}
