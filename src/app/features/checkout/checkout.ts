import { AfterViewInit, Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Clip3dsOverlayComponent } from '../../shared/components/clip-3ds-overlay/clip-3ds-overlay.component';
import { ClipPaymentResponse } from '../../shared/models/clip-payment.model';
import { ClipService } from '../../shared/services/clip-service/clip-service';

/** Status detail code CLIP returns when a payment requires 3DS authentication. */
const CLIP_3DS_STATUS_CODE = 'PE-3DS01';

@Component({
  selector: 'app-checkout',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    Clip3dsOverlayComponent,
  ],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout implements OnInit, AfterViewInit {
  private clipInstance: any;
  private card: any;
  public isSdkLoaded = false;
  public isProcessing = false;
  public isVerifying3ds = false;
  public pendingAction3ds: { url: string } | null = null;
  public paymentAmount = 150.0; // Monto de ejemplo en MXN

  private readonly fb = new FormBuilder();
  readonly customerForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
  });

  constructor(private clipService: ClipService) {}

  ngOnInit(): void {
    // const lol = new ClipSDK();
  }

  ngAfterViewInit(): void {
    // El formulario requiere que el contenedor del DOM ya exista
    // 1. Cargar el script al inicializar el componente
    this.clipService.loadScript().then((loaded) => {
      if (loaded) {
        this.isSdkLoaded = true;
        this.initializeClipForm();
      } else {
        console.error('Error al cargar el SDK de Clip');
      }
    });
  }

  // 2. Inicializar el SDK de Checkout Transparente
  initializeClipForm(): void {
    // @ts-ignore
    if (window.ClipSDK) {
      // TODO: Reemplazar API Key por una de PROD que venga de variables de entorno o configuración segura...
      const apiKey = 'test_a56c6479-1ef9-4c9a-9629-0b76bbb0211f';
      const containerId = 'checkout';
      // @ts-ignore
      this.clipInstance = new window.ClipSDK(apiKey);
      // Crea un elemento tarjeta con el SDK de Clip
      this.card = this.clipInstance.element.create('Card', {
        theme: 'light',
      });
      // Renderiza el formulario seguro dentro del div especificado
      this.card.mount(containerId);
    }
  }

  // 3. Ejecutar la acción al dar clic en el botón de pagar
  async onPaySubmit(event: Event) {
    event.preventDefault();
    if (!this.clipInstance || this.customerForm.invalid) return;

    let cardToken = null;
    try {
      // Obtén el token de la tarjeta
      cardToken = await this.card.cardToken();
    } catch (error: any) {
      // Maneja errores durante la tokenización de la tarjeta
      switch (error.code) {
        case 'CL2200':
        case 'CL2290':
          alert('Error: ' + error.message);
          return;
        default:
          return;
      }
    }

    this.sendTokenToBackend(cardToken.id);
  }

  // 4. Comunicación final HTTP con el backend de tu comercio
  private sendTokenToBackend(token: string): void {
    this.isProcessing = true;
    const { email, phone } = this.customerForm.getRawValue();

    this.clipService
      .createClipPayment({
        amount: this.paymentAmount,
        currency: 'MXN',
        description: 'Compra de boleto',
        cardToken: token,
        customerEmail: email,
        customerPhone: phone,
      })
      .subscribe({
        next: (res) => this.handlePaymentResponse(res),
        error: (err) => {
          this.isProcessing = false;
          console.error('Error al procesar el cobro en el backend:', err);
          alert('El banco o el servidor rechazó la transacción.');
        },
      });
  }

  // 5. Decide si el pago requiere autenticación 3DS o si ya se resolvió.
  // https://developer.clip.mx/reference/autenticacion-3ds-sdk
  private handlePaymentResponse(res: ClipPaymentResponse): void {
    if (res.statusDetail?.code === CLIP_3DS_STATUS_CODE && res.pendingAction?.url) {
      this.isProcessing = false;
      this.pendingAction3ds = { url: res.pendingAction.url };
      return;
    }

    this.isProcessing = false;
    if (res.status === 'success') {
      alert('¡Pago completado con éxito!');
    } else {
      alert('El banco o el servidor rechazó la transacción.');
    }
  }

  // 6. Al recibir el paymentId desde el iframe de 3DS, se consulta el estado final
  // del pago en nuestro backend (nunca directamente contra CLIP desde el cliente).
  onPaymentIdReceived(paymentId: string): void {
    this.pendingAction3ds = null;
    this.isVerifying3ds = true;

    this.clipService.getPaymentStatus(paymentId).subscribe({
      next: (res) => {
        this.isVerifying3ds = false;
        this.handlePaymentResponse(res);
      },
      error: (err) => {
        this.isVerifying3ds = false;
        console.error('Error al verificar el estado del pago:', err);
        alert('No se pudo verificar el resultado del pago. Contacta a soporte.');
      },
    });
  }
}
