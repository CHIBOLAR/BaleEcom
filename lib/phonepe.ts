import { StandardCheckoutClient, Env } from 'pg-sdk-node';

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
