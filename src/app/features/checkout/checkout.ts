import { CurrencyPipe } from '@angular/common';
import { Component, effect, ElementRef, input, OnInit, signal, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute } from '@angular/router';
import { Clip3dsOverlayComponent } from '../../shared/components/clip-3ds-overlay/clip-3ds-overlay.component';
import { ClipPaymentResponse } from '../../shared/models/clip-payment.model';
import { Event as EventModel } from '../../shared/models/event.model';
import { Ticket } from '../../shared/models/ticket.model';
import { isTicketTypePurchasable, TicketType } from '../../shared/models/ticket-type.model';
import { ClipService } from '../../shared/services/clip-service/clip-service';
import { EventService } from '../../shared/services/event.service';
import { TicketTypeService } from '../../shared/services/ticket-type.service';
import { TicketService } from '../../shared/services/ticket.service';

/** Status detail code CLIP returns when a payment requires 3DS authentication. */
const CLIP_3DS_STATUS_CODE = 'PE-3DS01';
const CLIP_3DS_FAILED_CODE = 'RE-3DS01';
const CLIP_STATUS_APPROVED = 'approved';

const CLIP_REJECTION_MESSAGES: Record<string, string> = {
  'RE-3DS01': 'La autenticación 3DS falló. Intenta de nuevo.',
  'RE-ISS01': 'Fondos insuficientes.',
  'RE-ISS02': 'El banco rechazó la transacción.',
  'RE-ISS03': 'Tarjeta restringida.',
  'RE-ISS05': 'Transacción no permitida para este tarjetahabiente.',
  'RE-ISS07': 'Tarjeta expirada.',
  'RE-ISS12': 'Monto inválido.',
  'RE-ISS16': 'Número de tarjeta inválido.',
};

@Component({
  selector: 'app-checkout',
  imports: [
    CurrencyPipe,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    Clip3dsOverlayComponent,
  ],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout implements OnInit {
  /** Can be set directly by a host component, otherwise read from the `/checkout` route's query params. */
  readonly eventId = input<string>();
  readonly ticketTypeId = input<string>();

  private resolvedEventId?: string;
  private resolvedTicketTypeId?: string;

  private clipInstance: any;
  private card: any;
  readonly isSdkLoaded = signal(false);
  private readonly cardContainer = viewChild<ElementRef<HTMLElement>>('cardContainer');
  public isProcessing = false;
  public isVerifying3ds = false;
  public pendingAction3ds: { url: string } | null = null;

  readonly loadingContext = signal(false);
  readonly contextError = signal<string | null>(null);
  readonly event = signal<EventModel | null>(null);
  readonly ticketType = signal<TicketType | null>(null);
  readonly purchasedTicket = signal<Ticket | null>(null);
  readonly ticketCreationError = signal<string | null>(null);

  private readonly fb = new FormBuilder();
  readonly customerForm = this.fb.nonNullable.group({
    ownerName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
  });

  constructor(
    private readonly clipService: ClipService,
    private readonly eventService: EventService,
    private readonly ticketTypeService: TicketTypeService,
    private readonly ticketService: TicketService,
    private readonly route: ActivatedRoute
  ) {
    // The #checkout container lives inside an @else block, so it only exists after the
    // context has loaded. Mount the card whenever the SDK is ready and the container appears.
    effect(() => {
      if (this.cardContainer() && this.isSdkLoaded()) {
        this.initializeClipForm();
      }
    });
  }

  ngOnInit(): void {
    this.loadSdk();
    const params = this.route.snapshot.queryParamMap;
    this.resolvedEventId = this.eventId() ?? params.get('eventId') ?? undefined;
    this.resolvedTicketTypeId = this.ticketTypeId() ?? params.get('ticketTypeId') ?? undefined;

    if (!this.resolvedEventId || !this.resolvedTicketTypeId) {
      this.contextError.set('No event/ticket type selected. Go back and pick a ticket to buy.');
      return;
    }
    this.loadContext(this.resolvedEventId, this.resolvedTicketTypeId);
  }

  private loadContext(eventId: string, ticketTypeId: string): void {
    this.loadingContext.set(true);
    this.contextError.set(null);

    this.eventService.getById(eventId).subscribe({
      next: (event) => this.event.set(event),
      error: () => this.contextError.set('Event not found or backend unavailable.'),
    });

    this.ticketTypeService.getById(ticketTypeId).subscribe({
      next: (ticketType) => {
        this.loadingContext.set(false);
        if (ticketType.eventId !== eventId) {
          this.contextError.set('This ticket type does not belong to the selected event.');
          return;
        }
        if (!isTicketTypePurchasable(ticketType)) {
          this.contextError.set('This ticket type is not currently available for purchase.');
        }
        this.ticketType.set(ticketType);
      },
      error: () => {
        this.loadingContext.set(false);
        this.contextError.set('Ticket type not found or backend unavailable.');
      },
    });
  }

  // 1. Cargar el script del SDK
  private loadSdk(): void {
    this.clipService.loadScript().then((loaded) => {
      if (loaded) {
        this.isSdkLoaded.set(true);
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

  get canPay(): boolean {
    return !this.contextError() && !!this.event() && !!this.ticketType();
  }

  // 3. Ejecutar la acción al dar clic en el botón de pagar
  async onPaySubmit(event: Event) {
    event.preventDefault();
    if (!this.clipInstance || this.customerForm.invalid || !this.canPay) return;

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
          console.error('Error al tokenizar la tarjeta:', error);
          alert('No se pudo procesar la tarjeta. Intenta de nuevo.');
          return;
      }
    }

    let preventionData: any = {};
    try {
      preventionData = (await this.card.preventionData()) ?? {};
    } catch (error) {
      console.warn('No se pudieron obtener los datos de prevención de fraude:', error);
    }

    this.sendTokenToBackend(cardToken.id, preventionData);
  }

  // 4. Comunicación final HTTP con el backend de tu comercio
  private sendTokenToBackend(token: string, preventionData: any): void {
    this.isProcessing = true;
    const { ownerName, email, phone } = this.customerForm.getRawValue();
    const [firstName, ...rest] = ownerName.trim().split(/\s+/);
    const ticketType = this.ticketType();
    const event = this.event();

    this.clipService
      .createClipPayment({
        amount: ticketType!.price,
        currency: 'MXN',
        description: `${event?.name ?? 'Evento'} - ${ticketType!.name}`,
        cardToken: token,
        customerEmail: email,
        customerPhone: phone,
        customerFirstName: firstName,
        customerLastName: rest.join(' ') || undefined,
        externalReference: `${this.resolvedEventId}:${this.resolvedTicketTypeId}`,
        sessionId: preventionData.session_id ?? preventionData.sessionId,
        userAgent: preventionData.user_agent ?? preventionData.userAgent,
        pendingTicket: {
          eventId: this.resolvedEventId!,
          ticketTypeId: this.resolvedTicketTypeId!,
          ownerName,
          ownerEmail: email,
        },
      })
      .subscribe({
        next: (res) => this.handlePaymentResponse(res),
        error: (err) => {
          this.isProcessing = false;
          console.error('Error al procesar el cobro en el backend:', err);
          this.resetCard();
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

    if (res.status === CLIP_STATUS_APPROVED && res.id) {
      this.createTicket(res.id);
      return;
    }

    this.isProcessing = false;
    this.resetCard();
    if (res.status === 'pending') {
      alert('Tu pago sigue pendiente de confirmación. Contacta a soporte si no se completa pronto.');
      return;
    }
    const code = res.statusDetail?.code;
    const reason = (code && CLIP_REJECTION_MESSAGES[code]) || 'El banco o el servidor rechazó la transacción.';
    alert(code === CLIP_3DS_FAILED_CODE ? reason : `${reason} Vuelve a ingresar tu tarjeta.`);
  }

  // The Card Token ID is single-use (15 min), so a retry needs a freshly mounted card element.
  private resetCard(): void {
    this.card?.unmount?.();
    if (this.cardContainer() && this.isSdkLoaded()) {
      this.initializeClipForm();
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

  // 7. Con el pago de CLIP ya exitoso, se crea el boleto en nuestro backend, enlazándolo
  // al pago mediante clipPaymentId.
  private createTicket(clipPaymentId: string): void {
    const { ownerName, email } = this.customerForm.getRawValue();

    this.ticketService
      .purchase({
        eventId: this.resolvedEventId!,
        ticketTypeId: this.resolvedTicketTypeId!,
        ownerName,
        ownerEmail: email,
        clipPaymentId,
      })
      .subscribe({
        next: (ticket) => {
          this.isProcessing = false;
          this.purchasedTicket.set(ticket);
        },
        error: (err) => {
          this.isProcessing = false;
          console.error('El pago se completó pero no se pudo crear el boleto:', err);
          this.ticketCreationError.set(
            `Tu pago (${clipPaymentId}) se completó, pero no pudimos generar el boleto. Contacta a soporte con este número de pago.`
          );
        },
      });
  }
}
