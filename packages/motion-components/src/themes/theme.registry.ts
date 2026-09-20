import { VideoTheme, DeepPartial } from './theme.types';

const baseShared = {
  spacing: {
    xs: 8,
    sm: 16,
    md: 24,
    lg: 48,
    xl: 64,
  },
  radius: {
    sm: 4,
    md: 8,
    lg: 16,
    pill: 9999,
  },
};

export const premiumDarkTheme: VideoTheme = {
  id: 'premium_dark',
  name: 'Premium Dark',
  colors: {
    background: '#0B0F19', // Deep dark blue/black
    surface: '#1A1F2C', // Slightly lighter dark
    surfaceSecondary: '#252A36',
    
    textPrimary: '#FFFFFF',
    textSecondary: '#9CA3AF',
    textMuted: '#6B7280',
    
    accent: '#3B82F6', // Blue
    accentSecondary: '#8B5CF6', // Purple
    
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#3B82F6',
    
    border: '#374151',
    shadow: 'rgba(0, 0, 0, 0.5)',
  },
  typography: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    headingWeight: 700,
    bodyWeight: 400,
    labelWeight: 600,
    headingScale: 2.5,
    bodyScale: 1.0,
    labelScale: 0.875,
  },
  ...baseShared,
  effects: {
    shadowIntensity: 0.6,
    blurIntensity: 12,
  },
  style: {
    density: 'comfortable',
    contrast: 'high',
    visualStyle: 'premium',
  }
};

export const cleanLightTheme: VideoTheme = {
  id: 'clean_light',
  name: 'Clean Light',
  colors: {
    background: '#F9FAFB', // Very light gray
    surface: '#FFFFFF', // Pure white
    surfaceSecondary: '#F3F4F6',
    
    textPrimary: '#111827', // Very dark gray
    textSecondary: '#4B5563',
    textMuted: '#9CA3AF',
    
    accent: '#2563EB', // Blue
    accentSecondary: '#10B981', // Emerald
    
    success: '#059669',
    warning: '#D97706',
    danger: '#DC2626',
    info: '#2563EB',
    
    border: '#E5E7EB',
    shadow: 'rgba(0, 0, 0, 0.05)',
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
    headingWeight: 600,
    bodyWeight: 400,
    labelWeight: 500,
    headingScale: 2.25,
    bodyScale: 1.0,
    labelScale: 0.875,
  },
  ...baseShared,
  effects: {
    shadowIntensity: 0.2,
    blurIntensity: 8,
  },
  style: {
    density: 'spacious',
    contrast: 'medium',
    visualStyle: 'clean',
  }
};

export const editorialTheme: VideoTheme = {
  id: 'editorial',
  name: 'Editorial',
  colors: {
    background: '#F3EFE9', // Off-white/paper
    surface: '#FFFFFF', // Pure white
    surfaceSecondary: '#E9E4DC',
    
    textPrimary: '#1C1917', // Stone dark
    textSecondary: '#57534E', // Stone medium
    textMuted: '#A8A29E', // Stone light
    
    accent: '#991B1B', // Deep red
    accentSecondary: '#1E40AF', // Deep blue
    
    success: '#166534',
    warning: '#9A3412',
    danger: '#991B1B',
    info: '#1E40AF',
    
    border: '#D6D3D1',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  typography: {
    fontFamily: 'Georgia, serif', // Editorial standard
    headingWeight: 800,
    bodyWeight: 400,
    labelWeight: 700,
    headingScale: 3.0,
    bodyScale: 1.1,
    labelScale: 0.8,
  },
  ...baseShared,
  effects: {
    shadowIntensity: 0.1,
    blurIntensity: 4,
  },
  style: {
    density: 'compact',
    contrast: 'high',
    visualStyle: 'editorial',
  }
};

const registry: Record<string, VideoTheme> = {
  premium_dark: premiumDarkTheme,
  clean_light: cleanLightTheme,
  editorial: editorialTheme,
};

// Deep merge utility for theme overrides
function deepMerge<T extends object>(target: T, source: DeepPartial<T>): T {
  const output = { ...target };
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      const sourceKey = key as keyof DeepPartial<T>;
      const targetKey = key as keyof T;
      
      if (isObject(source[sourceKey])) {
        if (!(targetKey in target)) {
          Object.assign(output, { [key]: source[sourceKey] });
        } else {
          output[targetKey] = deepMerge(target[targetKey] as any, source[sourceKey] as any);
        }
      } else if (source[sourceKey] !== undefined) {
        Object.assign(output, { [key]: source[sourceKey] });
      }
    });
  }
  return output;
}

function isObject(item: any): boolean {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

/**
 * Resolves a theme deterministically. 
 * Falls back to premium_dark if invalid ID is provided.
 */
export function resolveTheme(id?: string, overrides?: DeepPartial<VideoTheme>): VideoTheme {
  const baseTheme = id && registry[id] ? registry[id] : registry['premium_dark'];
  
  if (overrides) {
    return deepMerge(baseTheme, overrides);
  }
  
  return baseTheme;
}
