import {
  Component,
  computed,
  input,
  OnDestroy,
  OnInit,
  output,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

/**
 * Full-screen iframe overlay used to run CLIP's 3DS authentication challenge.
 * See: https://developer.clip.mx/reference/autenticacion-3ds-sdk
 */
@Component({
  selector: 'app-clip-3ds-overlay',
  standalone: true,
  imports: [],
  templateUrl: './clip-3ds-overlay.component.html',
  styles: [
    `
      .clip-3ds-overlay {
        position: fixed;
        inset: 0;
        z-index: 1000;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .clip-3ds-overlay__iframe {
        width: min(900px, 100vw);
        height: min(900px, 100vh);
        border: none;
        background: #fff;
      }
    `,
  ],
})
export class Clip3dsOverlayComponent implements OnInit, OnDestroy {
  readonly url = input.required<string>();
  readonly paymentIdReceived = output<string>();

  readonly safeUrl = computed<SafeResourceUrl>(() =>
    this.sanitizer.bypassSecurityTrustResourceUrl(this.url())
  );

  private readonly urlOrigin = computed<string | null>(() => {
    const url = this.url();
    return url ? new URL(url).origin : null;
  });

  private readonly onMessage = (event: MessageEvent) => {
    const origin = this.urlOrigin();
    if (!origin || event.origin !== origin) {
      return;
    }
    const paymentId = event.data?.paymentId;
    if (paymentId) {
      this.paymentIdReceived.emit(paymentId);
    }
  };

  constructor(private readonly sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    window.addEventListener('message', this.onMessage);
  }

  ngOnDestroy(): void {
    window.removeEventListener('message', this.onMessage);
  }
}
