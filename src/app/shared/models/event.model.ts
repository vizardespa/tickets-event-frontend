/**
 * Event model — mirrors the backend `Event` data class.
 */
export interface Event {
  id: string;
  name: string;
  description: string;
  venue: string;
  date: string;
  totalSeats: number;
  availableSeats: number;
  price: number;
  createdAt: string;
}

/**
 * Payload for creating/updating an event.
 * `availableSeats` is optional on create (defaults to `totalSeats` on the backend).
 */
export interface EventRequest {
  name: string;
  description?: string;
  venue: string;
  date: string;
  totalSeats: number;
  availableSeats?: number;
  price: number;
}
