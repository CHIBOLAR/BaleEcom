import { NextRequest, NextResponse } from 'next/server';
import { sendContactFormEmail } from '@/lib/email';
import {
  checkRateLimit,
  getClientIp,
  rateLimitHeaders,
  RATE_LIMITS,
} from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  // Rate limiting
  const clientIp = getClientIp(request.headers);
  const rateLimitResult = checkRateLimit(`contact:${clientIp}`, RATE_LIMITS.contact);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: 'Too many requests. Please try again later.',
      },
      {
        status: 429,
        headers: rateLimitHeaders(rateLimitResult),
      }
    );
  }

  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Send email
    const result = await sendContactFormEmail({
      name,
      email,
      subject,
      message,
    });

    if (!result.success) {
      console.error('Contact form email failed:', result.error);
      return NextResponse.json(
        { success: false, error: 'Failed to send message. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, messageId: result.messageId },
      { headers: rateLimitHeaders(rateLimitResult) }
    );
  } catch (error: any) {
    console.error('Contact form error:', error.message);
    return NextResponse.json(
      { success: false, error: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
