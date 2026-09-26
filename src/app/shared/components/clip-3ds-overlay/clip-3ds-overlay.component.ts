import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
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
  template: `
    <div class="clip-3ds-overlay">
      <iframe
        title="cybersource3Ds"
        [src]="safeUrl"
        data-testid="cybersource3Ds-iframe"
        class="clip-3ds-overlay__iframe"
      ></iframe>
    </div>
  `,
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
export class Clip3dsOverlayComponent implements OnInit, OnChanges, OnDestroy {
  @Input({ required: true }) url!: string;
  @Output() paymentIdReceived = new EventEmitter<string>();

  safeUrl!: SafeResourceUrl;

  private urlOrigin: string | null = null;
  private readonly onMessage = (event: MessageEvent) => {
    if (!this.urlOrigin || event.origin !== this.urlOrigin) {
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

  ngOnChanges(): void {
    this.urlOrigin = this.url ? new URL(this.url).origin : null;
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.url);
  }

  ngOnDestroy(): void {
    window.removeEventListener('message', this.onMessage);
  }
}
