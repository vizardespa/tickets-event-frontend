import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ClipPaymentRequest, ClipPaymentResponse } from '../../models/clip-payment.model';

@Injectable({
  providedIn: 'root',
})
export class ClipService {
  private scriptUrl = 'https://payclip.com'; // URL provista por Clip
  private readonly baseUrl = `${environment.apiBaseUrl}/api/payments`;

  constructor(private http: HttpClient) {}

  // Carga dinámicamente el SDK oficial en el navegador
  loadScript(): Promise<boolean> {
    return new Promise((resolve) => {
      // @ts-ignore
      if (window.ClipSDK) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = this.scriptUrl;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  }

  // Envía el Card Token ID resultante a nuestro backend para procesar el cargo con CLIP
  createClipPayment(payload: ClipPaymentRequest): Observable<ClipPaymentResponse> {
    return this.http.post<ClipPaymentResponse>(`${this.baseUrl}/clip`, payload);
  }

  // Consulta el estado final de un pago, usado tras completar la autenticación 3DS.
  // https://developer.clip.mx/reference/autenticacion-3ds-sdk
  getPaymentStatus(paymentId: string): Observable<ClipPaymentResponse> {
    return this.http.get<ClipPaymentResponse>(`${this.baseUrl}/${paymentId}`);
  }
}
