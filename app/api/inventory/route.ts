import { NextRequest, NextResponse } from 'next/server';
import { getStock, getAllStock, checkStockAvailability } from '@/lib/inventory';

/**
 * GET /api/inventory - Get stock levels
 *
 * Query parameters:
 * - sku: Get stock for a specific SKU
 * - (no params): Get stock for all products
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sku = searchParams.get('sku');

    if (sku) {
      // Get stock for specific SKU
      const stock = await getStock(sku);

      if (!stock) {
        return NextResponse.json(
          { success: false, error: 'Product not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: stock,
      });
    }

    // Get stock for all products
    const allStock = await getAllStock();

    return NextResponse.json({
      success: true,
      data: allStock,
    });
  } catch (error: any) {
    console.error('Inventory API error:', error.message);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/inventory - Check stock availability for cart items
 *
 * Body:
 * {
 *   items: [{ sku: string, quantity: number }]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request: items array required' },
        { status: 400 }
      );
    }

    const result = await checkStockAvailability(items);

    return NextResponse.json({
      success: true,
      available: result.available,
      unavailableItems: result.unavailableItems,
    });
  } catch (error: any) {
    console.error('Inventory check error:', error.message);
    return NextResponse.json(
      { success: false, error: 'Failed to check stock availability' },
      { status: 500 }
    );
  }
}
