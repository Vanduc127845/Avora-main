/**
 * Image URLs utility for AI4A
 * Handles both local development images and Azure Blob Storage URLs
 */

const IMAGE_BASE_URL = (import.meta.env.VITE_AZURE_STORAGE_URL || '/media').replace(/\/$/, '');

/**
 * Get the full URL for an image
 * In development: returns /media/...
 * In production: returns AZURE_STORAGE_URL/...
 */
export function getImageUrl(path: string): string {
  // If it's already an absolute URL, return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Remove leading slash for consistency
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  return `${IMAGE_BASE_URL}/${cleanPath}`;
}

// ============ Image Path Constants ============

// Partner logos
export const IMAGES = {
  // Partner logos
  openai: getImageUrl('openai.svg'),
  google: getImageUrl('google.svg'),
  azure: getImageUrl('azure.svg'),
  supabase: getImageUrl('supabase.svg'),
  vercel: getImageUrl('vercel.svg'),

  // Organization logos
  unicef: getImageUrl('Logo_of_UNICEF.svg'),
  who: getImageUrl('World_Health_Organization_Logo.svg'),
  giaDinhUniversity: getImageUrl('logo-dai-hoc-gia-dinh-.svg'),

  // People/Team images (supports: jpg, jpeg, png, gif, avif, webp)
  people: {
    drNguyenVanMui: getImageUrl('Dr. Nguyen Van Mui.jpg'),
    drNguyenDangTri: getImageUrl('Dr. Nguyen Dang Tri.jpg'),
    drAngelaPratt: getImageUrl('Dr. Angela Pratt.jpg'),
    hoMinhDuy: getImageUrl('Ho Minh Duy.jpg'),
    nguyenThanhNam: getImageUrl('Nguyen Thanh Nam.jpg'),
    silviaDanailov: getImageUrl('Silvia Danailov.jpg'),
  },

  // Editorial illustrations
  fourStep: getImageUrl('career-steps.svg'),
  handshakes: getImageUrl('inclusive-partnership.svg'),

  // Default avatars
  peopleLogo: getImageUrl('people-avatar.svg'),
} as const;

export type ImageKey = keyof typeof IMAGES;
