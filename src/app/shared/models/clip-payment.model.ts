/**
 * Payload sent to our backend to trigger a CLIP "Checkout Transparente" payment.
 * Mirrors the backend's `ClipPaymentRequest`.
 */
export interface ClipPaymentRequest {
  amount: number;
  currency?: string;
  description: string;
  cardToken: string;
  customerEmail: string;
  customerPhone: string;
}

export interface ClipStatusDetail {
  code?: string;
  message?: string;
}

/**
 * Present when CLIP requires additional client-side action (e.g. 3DS authentication).
 * See: https://developer.clip.mx/reference/autenticacion-3ds-sdk
 */
export interface ClipPendingAction {
  url?: string;
  type?: string;
}

/**
 * Subset of CLIP's payment response our backend forwards back to the client.
 */
export interface ClipPaymentResponse {
  id?: string;
  amount?: number;
  currency?: string;
  description?: string;
  status?: string;
  statusDetail?: ClipStatusDetail;
  receiptNo?: string;
  createdAt?: string;
  pendingAction?: ClipPendingAction;
}
