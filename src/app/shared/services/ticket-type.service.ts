import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TicketType } from '../models/ticket-type.model';

/**
 * HttpClient wrapper for the Ticket Types API (`/api/events/{eventId}/ticket-types`,
 * `/api/ticket-types/{id}`).
 */
@Injectable({ providedIn: 'root' })
export class TicketTypeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api`;

  getByEvent(eventId: string): Observable<TicketType[]> {
    return this.http.get<TicketType[]>(`${this.baseUrl}/events/${eventId}/ticket-types`);
  }

  getById(id: string): Observable<TicketType> {
    return this.http.get<TicketType>(`${this.baseUrl}/ticket-types/${id}`);
  }
}
