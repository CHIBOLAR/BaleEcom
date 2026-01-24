import { NextRequest, NextResponse } from 'next/server';
import { syncFromWareIQ } from '@/lib/inventory';

// Secret for protecting the sync endpoint (optional, for cron jobs)
const CRON_SECRET = process.env.CRON_SECRET;

/**
 * GET /api/inventory/sync - Sync inventory from WareIQ
 *
 * Can be called:
 * - On-demand (manually or via admin button)
 * - Via Vercel Cron (every hour)
 *
 * Optional: Pass Authorization header with CRON_SECRET for protected access
 */
export async function GET(request: NextRequest) {
  try {
    // Optional: Verify cron secret if configured
    if (CRON_SECRET) {
      const authHeader = request.headers.get('authorization');
      const cronHeader = request.headers.get('x-vercel-cron');

      // Allow Vercel cron jobs or requests with valid secret
      if (!cronHeader && authHeader !== `Bearer ${CRON_SECRET}`) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    console.log('Starting inventory sync from WareIQ...');
    const startTime = Date.now();

    const result = await syncFromWareIQ();

    const duration = Date.now() - startTime;
    console.log(`Inventory sync completed in ${duration}ms`);

    if (!result.success && result.errors.length > 0) {
      return NextResponse.json({
        success: false,
        synced: result.synced,
        errors: result.errors,
        duration: `${duration}ms`,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      synced: result.synced,
      message: `Successfully synced ${result.synced} inventory items from WareIQ`,
      duration: `${duration}ms`,
      errors: result.errors,
    });
  } catch (error: any) {
    console.error('Inventory sync error:', error.message);
    return NextResponse.json(
      { success: false, error: error.message || 'Sync failed' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/inventory/sync - Manual sync trigger with optional SKU filter
 *
 * Body (optional):
 * {
 *   skus: string[] // Only sync specific SKUs (not implemented in basic version)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    console.log('Manual inventory sync triggered...');
    const startTime = Date.now();

    const result = await syncFromWareIQ();

    const duration = Date.now() - startTime;
    console.log(`Manual inventory sync completed in ${duration}ms`);

    return NextResponse.json({
      success: result.success,
      synced: result.synced,
      message: result.success
        ? `Successfully synced ${result.synced} inventory items`
        : 'Sync completed with errors',
      duration: `${duration}ms`,
      errors: result.errors,
    });
  } catch (error: any) {
    console.error('Manual inventory sync error:', error.message);
    return NextResponse.json(
      { success: false, error: error.message || 'Sync failed' },
      { status: 500 }
    );
  }
}
