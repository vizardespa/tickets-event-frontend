import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ClipService {
  private scriptUrl = 'https://payclip.com'; // URL provista por Clip
  private backendUrl = 'https://tu-api.com'; // Tu servidor Backend

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

  // Envía el Card Token ID resultante a tu backend para procesar el cargo
  processPaymentBackend(paymentData: { token: string; amount: number }): Observable<any> {
    return this.http.post<any>(this.backendUrl, paymentData);
  }
}
