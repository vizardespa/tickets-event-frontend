/**
 * A category of ticket for an event (e.g. "general", "pre-sale"), each with its own price.
 * Mirrors the backend `TicketType` data class.
 *
 * `purchaseStartAt` null means purchases are open immediately; `purchaseEndAt` null means
 * purchases never close.
 */
export interface TicketType {
  id: string;
  eventId: string;
  name: string;
  description: string;
  price: number;
  purchaseStartAt: string | null;
  purchaseEndAt: string | null;
  createdAt: string;
}

/**
 * Returns whether `ticketType` is currently within its purchase window (if any is defined).
 */
export function isTicketTypePurchasable(ticketType: TicketType, now: Date = new Date()): boolean {
  if (ticketType.purchaseStartAt && now < new Date(ticketType.purchaseStartAt)) {
    return false;
  }
  if (ticketType.purchaseEndAt && now > new Date(ticketType.purchaseEndAt)) {
    return false;
  }
  return true;
}
