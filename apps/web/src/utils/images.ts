/**
 * Image URLs utility for AI4A
 * Handles both local development images and Azure Blob Storage URLs
 */

const AZURE_STORAGE_URL = import.meta.env.VITE_AZURE_STORAGE_URL || '/images';

/**
 * Get the full URL for an image
 * In development: returns /images/...
 * In production: returns AZURE_STORAGE_URL/...
 */
export function getImageUrl(path: string): string {
  // If it's already an absolute URL, return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Remove leading slash for consistency
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  // Check if we have an Azure Storage URL configured
  if (AZURE_STORAGE_URL.startsWith('http')) {
    return `${AZURE_STORAGE_URL}/${cleanPath}`;
  }

  // Fall back to local images
  return `/${cleanPath}`;
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

  // Animated illustrations (gif/webp support)
  fourStep: getImageUrl('fourstep.gif'),
  handshakes: getImageUrl('handshakes.gif'),

  // Default avatars
  peopleLogo: getImageUrl('people.avif'),
} as const;

export type ImageKey = keyof typeof IMAGES;
