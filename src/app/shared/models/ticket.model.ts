/**
 * Ticket status — mirrors the backend `TicketStatus` enum.
 */
export type TicketStatus = 'ACTIVE' | 'CANCELLED';

/**
 * How a ticket was paid for — mirrors the backend `TicketPaymentMethod` enum.
 */
export type TicketPaymentMethod = 'CLIP' | 'MANUAL';

/**
 * Ticket model — mirrors the backend `Ticket` data class.
 */
export interface Ticket {
  id: string;
  eventId: string;
  ownerName: string;
  ownerEmail: string;
  seatNumber: number;
  status: TicketStatus;
  purchasedAt: string;
  paymentMethod: TicketPaymentMethod;
  clipPaymentId?: string | null;
  paymentNotes?: string | null;
  ticketTypeId?: string | null;
  price?: number | null;
}

/**
 * Payload for purchasing a ticket paid via CLIP.
 * `clipPaymentId` must reference an already-successful CLIP payment (see `ClipService`).
 * `ticketTypeId` is required — its price is snapshotted onto the ticket and its purchase
 * window is enforced by the backend. `seatNumber` is optional — the backend assigns the next
 * available seat if omitted.
 */
export interface TicketRequest {
  eventId: string;
  ownerName: string;
  ownerEmail: string;
  clipPaymentId: string;
  ticketTypeId: string;
  seatNumber?: number;
}
