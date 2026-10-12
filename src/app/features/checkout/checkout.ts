import { CurrencyPipe } from '@angular/common';
import { AfterViewInit, Component, Input, OnInit, signal } from '@angular/core';
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
export class Checkout implements OnInit, AfterViewInit {
  /** Can be set directly by a host component, otherwise read from the `/checkout` route's query params. */
  @Input() eventId?: string;
  @Input() ticketTypeId?: string;

  private clipInstance: any;
  private card: any;
  public isSdkLoaded = false;
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
  ) {}

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    this.eventId = this.eventId ?? params.get('eventId') ?? undefined;
    this.ticketTypeId = this.ticketTypeId ?? params.get('ticketTypeId') ?? undefined;

    if (!this.eventId || !this.ticketTypeId) {
      this.contextError.set('No event/ticket type selected. Go back and pick a ticket to buy.');
      return;
    }
    this.loadContext(this.eventId, this.ticketTypeId);
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
          return;
      }
    }

    this.sendTokenToBackend(cardToken.id);
  }

  // 4. Comunicación final HTTP con el backend de tu comercio
  private sendTokenToBackend(token: string): void {
    this.isProcessing = true;
    const { email, phone } = this.customerForm.getRawValue();
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

    if (res.status === 'success' && res.id) {
      this.createTicket(res.id);
      return;
    }

    this.isProcessing = false;
    alert('El banco o el servidor rechazó la transacción.');
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
        eventId: this.eventId!,
        ticketTypeId: this.ticketTypeId!,
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
