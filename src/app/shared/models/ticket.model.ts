/**
 * Ticket status — mirrors the backend `TicketStatus` enum.
 */
export type TicketStatus = 'ACTIVE' | 'CANCELLED';

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
}

/**
 * Payload for purchasing a ticket.
 * `seatNumber` is optional — the backend assigns the next available seat if omitted.
 */
export interface TicketRequest {
  eventId: string;
  ownerName: string;
  ownerEmail: string;
  seatNumber?: number;
}
