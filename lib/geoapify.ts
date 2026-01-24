const GEOAPIFY_API_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;

export interface AddressSuggestion {
  formatted: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  lat: number;
  lon: number;
}

interface GeoapifyResult {
  properties: {
    formatted: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
    lat: number;
    lon: number;
  };
}

/**
 * Autocomplete address search
 */
export async function searchAddress(query: string): Promise<AddressSuggestion[]> {
  if (!query || query.length < 3) return [];

  try {
    const response = await fetch(
      `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&filter=countrycode:in&format=json&apiKey=${GEOAPIFY_API_KEY}`
    );

    const data = await response.json();

    if (!data.results) return [];

    return data.results.map((result: any) => ({
      formatted: result.formatted || '',
      address_line1: result.address_line1 || result.street || '',
      address_line2: result.address_line2 || '',
      city: result.city || result.county || '',
      state: result.state || '',
      postcode: result.postcode || '',
      country: result.country || 'India',
      lat: result.lat,
      lon: result.lon,
    }));
  } catch (error) {
    console.error('Geoapify autocomplete error:', error);
    return [];
  }
}

/**
 * Get address details from pincode (India)
 */
export async function getAddressFromPincode(pincode: string): Promise<{
  city: string;
  state: string;
} | null> {
  if (!pincode || pincode.length !== 6) return null;

  try {
    // Use India Post API (free) for pincode lookup
    const response = await fetch(
      `https://api.postalpincode.in/pincode/${pincode}`
    );

    const data = await response.json();

    if (data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
      const postOffice = data[0].PostOffice[0];
      return {
        city: postOffice.District || postOffice.Block || '',
        state: postOffice.State || '',
      };
    }

    // Fallback to Geoapify
    const geoResponse = await fetch(
      `https://api.geoapify.com/v1/geocode/search?text=${pincode}&filter=countrycode:in&format=json&apiKey=${GEOAPIFY_API_KEY}`
    );

    const geoData = await geoResponse.json();

    if (geoData.results?.length > 0) {
      const result = geoData.results[0];
      return {
        city: result.city || result.county || '',
        state: result.state || '',
      };
    }

    return null;
  } catch (error) {
    console.error('Pincode lookup error:', error);
    return null;
  }
}
