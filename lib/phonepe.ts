import { StandardCheckoutClient, Env, RefundRequest } from 'pg-sdk-node';

const PHONEPE_CLIENT_ID = process.env.PHONEPE_CLIENT_ID!;
const PHONEPE_CLIENT_SECRET = process.env.PHONEPE_CLIENT_SECRET!;
const PHONEPE_CLIENT_VERSION = parseInt(process.env.PHONEPE_CLIENT_VERSION || '1');
const PHONEPE_ENV = process.env.PHONEPE_ENV === 'PRODUCTION' ? Env.PRODUCTION : Env.SANDBOX;

let phonePeClient: StandardCheckoutClient | null = null;

export function getPhonePeClient(): StandardCheckoutClient {
  if (!phonePeClient) {
    phonePeClient = StandardCheckoutClient.getInstance(
      PHONEPE_CLIENT_ID,
      PHONEPE_CLIENT_SECRET,
      PHONEPE_CLIENT_VERSION,
      PHONEPE_ENV
    );
  }
  return phonePeClient;
}

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

/**
 * Initiate a refund for a completed payment
 * @param orderId - Original merchant order ID
 * @param amount - Amount to refund in rupees (not paise)
 * @param refundId - Unique refund ID (optional, will be generated if not provided)
 */
export async function initiateRefund(
  orderId: string,
  amount: number,
  refundId?: string
): Promise<{
  success: boolean;
  refundId?: string;
  state?: string;
  error?: string;
}> {
  try {
    const client = getPhonePeClient();
    const merchantRefundId = refundId || `REFUND-${orderId}-${Date.now()}`;

    const refundRequest = RefundRequest.builder()
      .merchantRefundId(merchantRefundId)
      .originalMerchantOrderId(orderId)
      .amount(Math.round(amount * 100)) // Convert to paise
      .build();

    const response = await client.refund(refundRequest);

    console.log('Refund initiated:', {
      orderId,
      refundId: merchantRefundId,
      amount,
      state: response.state,
    });

    return {
      success: response.state === 'COMPLETED' || response.state === 'PENDING',
      refundId: merchantRefundId,
      state: response.state,
    };
  } catch (error: any) {
    console.error('Refund failed:', error.message || error);
    return {
      success: false,
      error: error.message || 'Refund initiation failed',
    };
  }
}

/**
 * Check refund status
 */
export async function getRefundStatus(refundId: string): Promise<{
  state: string;
  amount?: number;
  error?: string;
}> {
  try {
    const client = getPhonePeClient();
    const response = await client.getRefundStatus(refundId);

    return {
      state: response.state,
      amount: response.amount ? response.amount / 100 : undefined,
    };
  } catch (error: any) {
    console.error('Refund status check failed:', error.message || error);
    return {
      state: 'UNKNOWN',
      error: error.message,
    };
  }
}
