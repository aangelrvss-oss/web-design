/**
 * Global input state, registered exactly once for the app's lifetime (never per scene),
 * so restarts can't stack listeners. Keyboard, mouse and touch all feed one model.
 */
export class Input {
  private keys = new Set<string>();
  private pressed = new Set<string>();
  mouseX = 0;
  mouseY = 0;
  mouseDown = false;
  mouseMovedAt = 0;
  /** Touch joystick vector, magnitude 0..1. */
  stickX = 0;
  stickY = 0;
  touchActive = false;
  /** True once any touch input happened (switches to auto-aim + touch HUD). */
  usedTouch = false;
  private bound = false;

  bind(canvasParent: HTMLElement) {
    if (this.bound) return;
    this.bound = true;
    window.addEventListener('keydown', (e) => {
      const k = norm(e.key);
      if (GAME_KEYS.has(k) && !isTyping(e)) e.preventDefault();
      if (!this.keys.has(k)) this.pressed.add(k);
      this.keys.add(k);
    });
    window.addEventListener('keyup', (e) => this.keys.delete(norm(e.key)));
    // no stuck keys when focus leaves the page
    window.addEventListener('blur', () => this.reset());
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.reset(); });
    canvasParent.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'mouse') {
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;
        this.mouseMovedAt = performance.now();
      }
    });
    canvasParent.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse') {
        this.mouseDown = true;
        if (e.button === 2) this.pressed.add('mouse2');
      } else this.usedTouch = true;
    });
    window.addEventListener('pointerup', (e) => { if (e.pointerType === 'mouse') this.mouseDown = false; });
    canvasParent.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  reset() {
    this.keys.clear();
    this.pressed.clear();
    this.mouseDown = false;
    this.stickX = this.stickY = 0;
    this.touchActive = false;
  }

  down(k: string) {
    return this.keys.has(k);
  }

  /** True once per physical press. */
  consume(k: string) {
    const had = this.pressed.has(k);
    this.pressed.delete(k);
    return had;
  }

  /** Simulated press from on-screen buttons. */
  press(k: string) {
    this.pressed.add(k);
  }

  clearPressed() {
    this.pressed.clear();
  }

  moveVector(): { x: number; y: number } {
    let x = 0, y = 0;
    if (this.down('a') || this.down('arrowleft')) x -= 1;
    if (this.down('d') || this.down('arrowright')) x += 1;
    if (this.down('w') || this.down('arrowup')) y -= 1;
    if (this.down('s') || this.down('arrowdown')) y += 1;
    if (x || y) {
      const l = Math.hypot(x, y);
      return { x: x / l, y: y / l };
    }
    if (this.touchActive) return { x: this.stickX, y: this.stickY };
    return { x: 0, y: 0 };
  }
}

const GAME_KEYS = new Set(['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'shift', 'e', 'f', 'q']);

function norm(k: string) {
  return k.length === 1 ? k.toLowerCase() : k.toLowerCase();
}

function isTyping(e: KeyboardEvent) {
  const t = e.target as HTMLElement | null;
  return !!t && (t.tagName === 'INPUT' && (t as HTMLInputElement).type === 'text');
}

export const input = new Input();
