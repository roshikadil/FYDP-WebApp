const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface Photo {
  url?: string;
  filename?: string;
  originalName?: string;
  size?: number;
  mimetype?: string;
  uploadedAt?: string;
}

/**
 * Get the display URL for a photo
 */
export const getPhotoUrl = (photo: Photo | string): string => {
  let imageUrl = '';
  
  if (typeof photo === 'string') {
    imageUrl = photo;
  } else if (typeof photo === 'object' && photo !== null) {
    imageUrl = photo.url || photo.filename || '';
  }
  
  if (!imageUrl) return '';
  
  // If URL doesn't start with http, prepend API_URL
  if (!imageUrl.startsWith('http')) {
    // Remove leading slash if present
    if (imageUrl.startsWith('/')) {
      imageUrl = imageUrl.substring(1);
    }
    
    // Check if it's already a full path
    if (imageUrl.includes('/uploads/') || imageUrl.includes('uploads/')) {
      return `${API_URL}/${imageUrl}`;
    }
    
    // Assume it's in uploads folder
    return `${API_URL}/uploads/${imageUrl}`;
  }
  
  return imageUrl;
};

/**
 * Get the first available photo from incident
 */
export const getIncidentImageUrl = (incident: any): string => {
  if (!incident || !incident.photos || incident.photos.length === 0) {
    return '';
  }
  
  const photo = incident.photos[0];
  return getPhotoUrl(photo);
};

/**
 * Check if image exists
 */
export const checkImageExists = (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
};