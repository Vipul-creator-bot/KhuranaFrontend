import { Directive, ElementRef, HostListener, Input, Renderer2 } from '@angular/core';

/**
 * Applies a subtle, mouse-tracked 3D tilt to the host element — the classic
 * "card lifts toward your cursor" effect. Pure CSS transforms (perspective +
 * rotateX/rotateY), no WebGL/canvas, so it stays lightweight and works on
 * any element.
 *
 * Usage: <div kkTilt [kkTiltMax]="8">...</div>
 */
@Directive({
  selector: '[kkTilt]',
  standalone: true,
})
export class TiltDirective {
  /** Maximum tilt angle in degrees. Keep this small (6–10) for a subtle, premium feel. */
  @Input() kkTiltMax = 8;
  /** Slight scale-up on hover, layered with the tilt for a "lift off the page" feel. */
  @Input() kkTiltScale = 1.02;

  private rafId: number | null = null;

  constructor(private el: ElementRef<HTMLElement>, private renderer: Renderer2) {
    this.renderer.setStyle(this.el.nativeElement, 'transform-style', 'preserve-3d');
    this.renderer.setStyle(this.el.nativeElement, 'transition', 'transform 0.15s ease-out');
    this.renderer.setStyle(this.el.nativeElement, 'will-change', 'transform');
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    // matchMedia check is cheap enough to do per-event here since tilt only
    // fires on devices with a mouse anyway (touch devices don't fire mousemove
    // the same way), but bail early if the user prefers reduced motion.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const rect = this.el.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateY = ((x - centerX) / centerX) * this.kkTiltMax;
    const rotateX = -((y - centerY) / centerY) * this.kkTiltMax;

    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = requestAnimationFrame(() => {
      this.renderer.setStyle(
        this.el.nativeElement,
        'transform',
        `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${this.kkTiltScale})`
      );
    });
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.renderer.setStyle(
      this.el.nativeElement,
      'transform',
      'perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)'
    );
  }
}
