import axios from 'axios';

export const isCoordinates = (address: string): boolean => {
  if (!address) return false;
  if (address.includes('Lat:') || address.includes('Lng:')) return true;
  
  const coordRegex = /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/;
  const bracketCoordRegex = /^\(-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?\)$/;
  const trimmed = address.trim();
  
  return coordRegex.test(trimmed) || bracketCoordRegex.test(trimmed);
};

export const getAddressFromCoordinates = async (lat: number, lng: number): Promise<string | null> => {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: {
        lat: lat,
        lon: lng,
        format: 'json',
        'accept-language': 'en',
        zoom: 18,
        addressdetails: 1
      },
      headers: {
        'User-Agent': 'IncidentReportingAppWeb/1.0'
      }
    });

    if (response.data && response.data.address) {
      const address = response.data.address;
      const parts = [];
      
      if (address.house_number) parts.push(address.house_number);
      if (address.building) parts.push(address.building);
      if (address.block) parts.push(address.block);
      if (address.road) parts.push(address.road);
      if (address.suburb) parts.push(address.suburb);
      if (address.city || address.town || address.village) {
        parts.push(address.city || address.town || address.village);
      }

      // Filter out duplicates and join
      const formatted = Array.from(new Set(parts)).join(', ');
      
      return formatted || response.data.display_name || null;
    }
    return null;
  } catch (error) {
    console.error('Error in reverse geocoding:', error);
    return null;
  }
};
