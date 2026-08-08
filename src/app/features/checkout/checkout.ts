import { CurrencyPipe } from '@angular/common';
import { AfterViewInit, Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ClipService } from '../../shared/services/clip-service/clip-service';

@Component({
  selector: 'app-checkout',
  imports: [CurrencyPipe, MatButtonModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout implements OnInit, AfterViewInit {
  private clipInstance: any;
  private card: any;
  public isSdkLoaded = false;
  public isProcessing = false;
  public paymentAmount = 150.0; // Monto de ejemplo en MXN

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
    if (!this.clipInstance) return;

    console.log('onPaySubmit init:', this.card);

    let cardToken = null;
    try {
      // Obtén el token de la tarjeta
      cardToken = await this.card.cardToken();
      const cardTokenID = cardToken.id;
      console.log('Card Token ID:', cardTokenID);
    } catch (error: any) {
      // Maneja errores durante la tokenización de la tarjeta
      switch (error.code) {
        case 'CL2200':
        case 'CL2290':
          alert('Error: ' + error.message);
          throw error;
        case 'AI1300':
          break;
        default:
          break;
      }
    }
    console.log('Card Token ID:', cardToken);

    // this.isProcessing = true;

    // // Solicita al SDK que valide y transforme los datos en un Card Token ID
    // this.clipInstance
    //   .getCardToken()
    //   .then((response: { card_token_id: string }) => {
    //     // Enviar el token recibido de forma segura a tu servidor backend
    //     this.sendTokenToBackend(response.card_token_id);
    //   })
    //   .catch((error: any) => {
    //     this.isProcessing = false;
    //     console.error('Error en la tokenización de la tarjeta:', error);
    //     alert('Hubo un error con los datos de tu tarjeta. Intenta de nuevo.');
    //   });
  }

  // 4. Comunicación final HTTP con el backend de tu comercio
  private sendTokenToBackend(token: string): void {
    const payload = {
      token: token,
      amount: this.paymentAmount,
    };

    this.clipService.processPaymentBackend(payload).subscribe({
      next: (res) => {
        this.isProcessing = false;
        alert('¡Pago completado con éxito!');
      },
      error: (err) => {
        this.isProcessing = false;
        console.error('Error al procesar el cobro en el backend:', err);
        alert('El banco o el servidor rechazó la transacción.');
      },
    });
  }
}
