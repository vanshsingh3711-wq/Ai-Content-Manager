import React from 'react';
import { AbsoluteFill, useVideoConfig, useCurrentFrame } from 'remotion';
import { useFadeUp, useExitFade } from '../shared';

export interface EffectOverlayProps {
  effectType?: string;
  intensity?: number;
  opacity?: number;
  feather?: number;
  tintColor?: string;
  warmth?: number;
  angle?: number;
  flareColor?: string;
  streakWidth?: number;
  sepiaAmount?: number;
  jitter?: number;
  flashColor?: string;
  decaySpeed?: number;
  radialLines?: number;
  phosphorTint?: string;
  curvature?: number;
  dotScale?: number;
  bokehDensity?: number;
  scopeVignette?: boolean;
  grain?: number;
  accentColor?: string;
  shadowColor?: string;
  highlightColor?: string;
  barHeight?: number;
  accentLine?: boolean;
  glowColor?: string;
}

export const EffectOverlay: React.FC<EffectOverlayProps> = (props) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const exit = useExitFade(durationInFrames);
  const intro = useFadeUp(0);

  const {
    effectType = 'rgb_glitch',
    intensity = 80,
    opacity = 100,
    feather = 60,
    tintColor = '#000000',
    warmth = 80,
    angle = 45,
    flareColor = '#38bdf8',
    flashColor = '#ffffff',
    decaySpeed = 2,
    radialLines = 24,
    phosphorTint = '#22c55e',
    dotScale = 12,
    accentColor = '#ec4899',
  } = props;

  const totalOpacity = (opacity / 100) * (intensity / 100);
  const localTime = frame / fps;
  const flashDecay = Math.max(0, 1 - localTime * decaySpeed * 1.5);

  return (
    <AbsoluteFill
      style={{
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          ...intro,
          ...exit,
          opacity: totalOpacity * (intro.opacity as number) * (exit.opacity as number),
          width: '100%',
          height: '100%',
          position: 'relative',
        }}
      >
        {/* 1. RGB Glitch */}
        {effectType.includes('glitch') && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.08), rgba(0, 255, 0, 0.03), rgba(0, 255, 255, 0.08))',
              backgroundSize: '100% 3px, 6px 100%',
              boxShadow: 'inset 0 0 80px rgba(6, 182, 212, 0.4)',
              mixBlendMode: 'screen',
            }}
          />
        )}

        {/* 2. Teal & Orange Grade */}
        {effectType.includes('teal') && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(135deg, rgba(249, 115, 22, 0.3) 0%, rgba(13, 148, 136, 0.4) 100%)',
              mixBlendMode: 'color',
            }}
          />
        )}

        {/* 3. Retro VHS Scanlines */}
        {effectType.includes('vhs') && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'repeating-linear-gradient(0deg, rgba(255,255,255,0.08) 0, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 4px)',
              boxShadow: 'inset 0 0 60px rgba(0, 0, 0, 0.5)',
            }}
          />
        )}

        {/* 4. Cyberpunk Neon Glow */}
        {effectType.includes('neon') && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              boxShadow: `inset 0 0 100px ${accentColor || 'rgba(236, 72, 153, 0.6)'}`,
            }}
          />
        )}

        {/* 5. Black & White Noir */}
        {effectType.includes('bw') && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              boxShadow: 'inset 0 0 80px rgba(0,0,0,0.8)',
              backdropFilter: 'grayscale(100%)',
            }}
          />
        )}

        {/* 6. Cinematic Vignette */}
        {effectType.includes('vignette') && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(circle at center, transparent ${Math.max(10, 100 - feather)}%, ${tintColor} 100%)`,
            }}
          />
        )}

        {/* 7. Golden Hour Glow */}
        {(effectType.includes('golden') || effectType.includes('sunset')) && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(${angle}deg, rgba(251, 146, 60, ${0.4 * (warmth / 100)}) 0%, rgba(245, 158, 11, ${0.25 * (warmth / 100)}) 35%, transparent 75%)`,
              boxShadow: 'inset 0 0 90px rgba(245, 158, 11, 0.25)',
              mixBlendMode: 'screen',
            }}
          />
        )}

        {/* 8. Anamorphic Lens Flare */}
        {(effectType.includes('flare') || effectType.includes('anamorphic')) && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mixBlendMode: 'screen',
            }}
          >
            <div
              style={{
                width: '100%',
                height: 3,
                background: `linear-gradient(90deg, transparent 0%, ${flareColor} 25%, #ffffff 50%, ${flareColor} 75%, transparent 100%)`,
                boxShadow: `0 0 16px ${flareColor}, 0 0 32px ${flareColor}`,
              }}
            />
            <div
              style={{
                position: 'absolute',
                width: 64,
                height: 64,
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                filter: 'blur(12px)',
                boxShadow: `0 0 40px ${flareColor}`,
              }}
            />
          </div>
        )}

        {/* 9. 8mm Vintage Film Burn */}
        {(effectType.includes('vintage') || effectType.includes('8mm') || effectType.includes('film')) && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(180, 130, 80, 0.15)',
              boxShadow: 'inset 0 0 80px rgba(70, 35, 10, 0.65)',
              backgroundImage:
                'repeating-linear-gradient(90deg, transparent 0, transparent 24px, rgba(0,0,0,0.06) 25px, transparent 26px)',
            }}
          />
        )}

        {/* 10. Strobe Flash Burst */}
        {(effectType.includes('flash') || effectType.includes('strobe')) && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: flashColor || '#ffffff',
              opacity: flashDecay,
              mixBlendMode: 'screen',
            }}
          />
        )}

        {/* 11. Radial Zoom Blur */}
        {(effectType.includes('zoom') || effectType.includes('blur')) && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(circle at center, transparent 30%, rgba(255,255,255,0.15) 70%, rgba(255,255,255,0.35) 100%), repeating-conic-gradient(from 0deg, rgba(255,255,255,0.08) 0deg 2deg, transparent 2deg ${360 / radialLines}deg)`,
              mixBlendMode: 'screen',
            }}
          />
        )}

        {/* 12. CRT Arcade Phosphor */}
        {(effectType.includes('crt') || effectType.includes('arcade')) && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `repeating-linear-gradient(0deg, ${phosphorTint}22 0, ${phosphorTint}22 1px, transparent 1px, transparent 4px)`,
              boxShadow: `inset 0 0 90px ${phosphorTint}33, inset 0 0 160px rgba(0,0,0,0.8)`,
            }}
          />
        )}

        {/* 13. Comic Pop Halftone */}
        {(effectType.includes('halftone') || effectType.includes('comic')) && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'radial-gradient(#000000 24%, transparent 25%)',
              backgroundSize: `${dotScale}px ${dotScale}px`,
              opacity: 0.35,
              mixBlendMode: 'multiply',
            }}
          />
        )}

        {/* 14. Prismatic Rainbow Bokeh */}
        {(effectType.includes('prism') || effectType.includes('bokeh')) && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              mixBlendMode: 'screen',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(135deg, rgba(244, 114, 182, 0.15) 0%, rgba(251, 191, 36, 0.15) 30%, rgba(56, 189, 248, 0.15) 70%, rgba(168, 85, 247, 0.15) 100%)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '20%',
                left: '25%',
                width: 130,
                height: 130,
                borderRadius: '50%',
                backgroundColor: 'rgba(244, 114, 182, 0.25)',
                filter: 'blur(20px)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '25%',
                right: '20%',
                width: 160,
                height: 160,
                borderRadius: '50%',
                backgroundColor: 'rgba(56, 189, 248, 0.25)',
                filter: 'blur(20px)',
              }}
            />
          </div>
        )}

        {/* 15. Tactical Night Vision */}
        {(effectType.includes('night') || effectType.includes('tactical')) && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: 24,
              fontFamily: 'monospace',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'radial-gradient(circle at center, rgba(16, 185, 129, 0.25) 30%, rgba(6, 78, 59, 0.7) 70%, rgba(2, 44, 34, 0.95) 100%)',
                mixBlendMode: 'color',
              }}
            />
            <div
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                color: '#34d399',
                fontSize: 14,
                fontWeight: 'bold',
                zIndex: 10,
              }}
            >
              <span>IR-NIGHT-VISION [ON]</span>
              <span>BAT 94%</span>
            </div>
            <div
              style={{
                alignSelf: 'center',
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                color: '#34d399',
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  border: '1px solid rgba(52, 211, 153, 0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#34d399' }} />
              </div>
              <span style={{ fontSize: 11, letterSpacing: '2px', marginTop: 4 }}>+ 0.00 MIL +</span>
            </div>
            <div
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                color: '#059669',
                fontSize: 11,
                zIndex: 10,
              }}
            >
              <span>GAIN: HIGH [AUTOLIGHT]</span>
              <span>NVD-MILSPEC-GEN3</span>
            </div>
          </div>
        )}

        {/* 16. 35mm Motion Film Grain */}
        {effectType.includes('grain') && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.15) 0%, transparent 60%), repeating-radial-gradient(circle, #fff 0, #fff 1px, transparent 1px, transparent 4px)',
              backgroundSize: '100% 100%, 6px 6px',
              mixBlendMode: 'overlay',
              opacity: 0.6,
            }}
          />
        )}

        {/* 17. Duotone Cyber Ultraviolet */}
        {effectType.includes('duotone') && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(135deg, ${props.shadowColor || '#3b0764'} 0%, ${props.highlightColor || '#06b6d4'} 100%)`,
              mixBlendMode: 'color',
            }}
          />
        )}

        {/* 18. Infrared Thermal Heatmap */}
        {effectType.includes('thermal') && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(180deg, #1e1b4b 0%, #06b6d4 25%, #22c55e 45%, #eab308 65%, #ef4444 85%, #ffffff 100%)',
              mixBlendMode: 'color',
              opacity: 0.85,
            }}
          />
        )}

        {/* 19. Dreamy Pro-Mist Bloom */}
        {(effectType.includes('dreamy') || effectType.includes('bloom')) && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(circle at center, rgba(255, 255, 255, 0.45) 0%, rgba(254, 243, 199, 0.25) 40%, transparent 75%)',
              filter: 'blur(8px)',
              mixBlendMode: 'screen',
            }}
          />
        )}

        {/* 20. RGB Party Color Strobe */}
        {(effectType.includes('party') || effectType.includes('color_strobe')) && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(135deg, rgba(217, 70, 239, 0.35) 0%, rgba(245, 158, 11, 0.35) 50%, rgba(16, 185, 129, 0.35) 100%)',
              mixBlendMode: 'screen',
              opacity: 0.8,
            }}
          />
        )}

        {/* 21. 90s Skate Fisheye Warp */}
        {effectType.includes('fisheye') && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(circle at center, transparent 45%, rgba(0, 0, 0, 0.4) 70%, rgba(0, 0, 0, 0.95) 100%)',
              boxShadow: 'inset 0 0 50px rgba(6, 182, 212, 0.4), inset 0 0 80px rgba(239, 68, 68, 0.3)',
            }}
          />
        )}

        {/* 22. 2.39:1 Anamorphic Letterbox */}
        {effectType.includes('letterbox') && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div
              style={{
                width: '100%',
                height: `${props.barHeight || 12}%`,
                backgroundColor: '#000000',
                position: 'relative',
              }}
            >
              {props.accentLine !== false && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 1,
                    backgroundColor: 'rgba(251, 191, 36, 0.4)',
                  }}
                />
              )}
            </div>
            <div
              style={{
                width: '100%',
                height: `${props.barHeight || 12}%`,
                backgroundColor: '#000000',
                position: 'relative',
              }}
            >
              {props.accentLine !== false && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 1,
                    backgroundColor: 'rgba(251, 191, 36, 0.4)',
                  }}
                />
              )}
            </div>
          </div>
        )}

        {/* 23. Earthquake Impact Camera Shake */}
        {effectType.includes('shake') && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              boxShadow: 'inset 0 0 40px rgba(255, 255, 255, 0.2)',
              mixBlendMode: 'difference',
              transform: `translate(${Math.sin(localTime * 25) * 4}px, ${Math.cos(localTime * 30) * 4}px)`,
            }}
          />
        )}

        {/* 24. Psychedelic Quad Mirror */}
        {effectType.includes('kaleidoscope') && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
            }}
          >
            <div
              style={{
                width: '50%',
                height: '100%',
                borderRight: '1px solid rgba(255,255,255,0.2)',
                background: 'linear-gradient(to top right, rgba(168, 85, 247, 0.1), transparent)',
              }}
            />
            <div
              style={{
                width: '50%',
                height: '100%',
                background: 'linear-gradient(to top left, rgba(6, 182, 212, 0.1), transparent)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: '50%',
                height: 1,
                backgroundColor: 'rgba(255,255,255,0.2)',
              }}
            />
          </div>
        )}

        {/* 25. X-Ray Solarize Invert */}
        {(effectType.includes('solarize') || effectType.includes('xray')) && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(circle at center, rgba(34, 211, 238, 0.3) 0%, rgba(15, 23, 42, 0.8) 100%)',
              boxShadow: 'inset 0 0 80px rgba(34, 211, 238, 0.5)',
              mixBlendMode: 'exclusion',
            }}
          />
        )}
      </div>
    </AbsoluteFill>
  );
};
