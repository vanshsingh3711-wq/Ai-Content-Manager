import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';

export interface SvgCharacterProps {
  isTalking?: boolean;
}

export const SvgCharacter: React.FC<SvgCharacterProps> = ({ isTalking = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Simple animation: rotate the right arm back and forth
  const armRotation = interpolate(
    Math.sin(frame / 5),
    [-1, 1],
    [-5, 15]
  );
  
  // Mouth opening and closing if talking
  const mouthScaleY = isTalking 
    ? interpolate(Math.sin(frame / 2), [-1, 1], [0.5, 1.5]) 
    : 1;

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 700" width="600" height="1400">
        <defs>
          <clipPath id="tieClipF">
            <path d="M138,206 L162,206 L172,260 L150,290 L128,260 Z"/>
          </clipPath>
          <clipPath id="jacketClipF">
            <path d="M120,216 C 95,222 78,236 72,258 L 62,420 C 62,428 68,433 78,433 L 222,433 C 232,433 238,428 238,420 L 228,258 C 222,236 205,222 180,216 L 165,232 L 150,222 L 135,232 Z"/>
          </clipPath>
        </defs>

        <g id="shoes">
          <path d="M104,592 L150,592 L150,612 C150,622 142,628 130,628 L94,628 C86,628 82,622 86,614 Z" fill="#161616" stroke="#050505" strokeWidth="2"/>
          <path d="M150,592 L196,592 L214,614 C218,622 214,628 206,628 L170,628 C158,628 150,622 150,612 Z" fill="#161616" stroke="#050505" strokeWidth="2"/>
        </g>

        <g id="legs">
          <path d="M112,432 L148,432 L150,596 L106,596 Z" fill="#34323f" stroke="#1c1b24" strokeWidth="2"/>
          <path d="M152,432 L188,432 L194,596 L150,596 Z" fill="#34323f" stroke="#1c1b24" strokeWidth="2"/>
          <path d="M148,432 L152,432 L150,470 Z" fill="#1c1b24"/>
        </g>

        <g id="body">
          <rect x="134" y="200" width="32" height="34" rx="8" fill="#e3a876"/>
          <path d="M120,216 C 95,222 78,236 72,258 L 62,420 C 62,428 68,433 78,433 L 222,433 C 232,433 238,428 238,420 L 228,258 C 222,236 205,222 180,216 L 165,232 L 150,222 L 135,232 Z" fill="#34323f" stroke="#1c1b24" strokeWidth="2.5"/>
          <g clipPath="url(#jacketClipF)" opacity="0.4">
            <path d="M80,220 L76,432 M100,220 L97,432 M120,220 L118,432 M180,220 L182,432 M200,220 L203,432 M220,220 L224,432" stroke="#8a889a" strokeWidth="1.5"/>
          </g>
          <path d="M128,214 L150,246 L172,214 L180,220 L154,296 L150,300 L146,296 L120,220 Z" fill="#ffffff" stroke="#dedede" strokeWidth="1"/>
          <path d="M138,208 L162,208 L174,262 L150,296 L126,262 Z" fill="#b8860b" stroke="#1c1b24" strokeWidth="1.5"/>
          <g clipPath="url(#tieClipF)" opacity="0.55">
            <path d="M118,215 L132,235 M128,215 L142,235 M138,215 L152,235 M148,215 L162,235 M158,215 L172,235 M168,215 L182,235 M178,215 L192,235" stroke="#f2e2b8" strokeWidth="6"/>
          </g>
          <path d="M96,248 L114,248 L105,268 Z" fill="#ffffff" stroke="#dedede" strokeWidth="1"/>
        </g>

        {/* Right Arm rigged with rotation */}
        <g 
          id="rightArmGroup" 
          style={{ transformOrigin: '96px 222px', transform: `rotate(${armRotation}deg)` }}
        >
          <g id="rightArm">
            <path d="M96,222 C 74,226 58,244 54,270 L48,336 C 47,344 53,350 61,349 L82,347 C 89,346 94,340 94,332 L92,262 Z" fill="#34323f" stroke="#1c1b24" strokeWidth="2.5"/>
          </g>
          <g id="rightForearm">
            <path d="M52,334 C 50,344 52,354 60,360 L 118,398 C 128,404 138,398 138,388 L 138,378 C 138,370 133,364 126,360 L 76,332 C 66,326 55,328 52,334 Z" fill="#34323f" stroke="#1c1b24" strokeWidth="2.5"/>
            <path d="M108,392 L138,380 L138,392 C 138,400 132,406 124,406 L 112,404 Z" fill="#ffffff" stroke="#dedede" strokeWidth="1.5"/>
          </g>
          <g id="rightHand">
            <ellipse cx="132" cy="396" rx="16" ry="13" fill="#e3a876" stroke="#c48350" strokeWidth="1.5"/>
          </g>
        </g>

        <g id="leftArmGroup">
          <g id="leftArm">
            <path d="M204,222 C 226,226 242,244 246,270 L252,336 C253,344 247,350 239,349 L218,347 C211,346 206,340 206,332 L208,262 Z" fill="#34323f" stroke="#1c1b24" strokeWidth="2.5"/>
          </g>
          <g id="leftForearm">
            <path d="M248,334 C 250,344 248,354 240,360 L 182,398 C 172,404 162,398 162,388 L 162,378 C 162,370 167,364 174,360 L 224,332 C 234,326 245,328 248,334 Z" fill="#34323f" stroke="#1c1b24" strokeWidth="2.5"/>
            <path d="M192,392 L162,380 L162,392 C 162,400 168,406 176,406 L 188,404 Z" fill="#ffffff" stroke="#dedede" strokeWidth="1.5"/>
          </g>
          <g id="leftHand">
            <ellipse cx="168" cy="398" rx="16" ry="13" fill="#e3a876" stroke="#c48350" strokeWidth="1.5"/>
            <path d="M148,392 C150,386 158,384 162,388 C168,392 168,400 162,404 C156,408 148,404 146,398 Z" fill="#e3a876" stroke="#c48350" strokeWidth="1.5"/>
          </g>
        </g>

        <g id="head">
          <circle cx="150" cy="128" r="86" fill="#e3a876" stroke="#c48350" strokeWidth="2"/>
          <ellipse cx="150" cy="185" rx="20" ry="10" fill="#e3a876"/>
        </g>

        <g id="hair">
          <path d="M66,118 C 60,60 100,26 152,26 C 206,28 240,62 234,118 C 227,86 207,58 174,48 C 160,44 152,52 144,58 L 120,76 C 100,60 80,82 66,118 Z" fill="#1b1b1f" stroke="#0a0a0c" strokeWidth="2"/>
          <path d="M64,116 C 61,134 63,148 70,160 C 65,146 66,130 70,120 Z" fill="#1b1b1f" stroke="#0a0a0c" strokeWidth="2"/>
          <path d="M236,116 C 239,134 237,148 230,160 C 235,146 234,130 230,120 Z" fill="#1b1b1f" stroke="#0a0a0c" strokeWidth="2"/>
          <path d="M124,72 C 150,54 180,50 208,66" fill="none" stroke="#3f3f47" strokeWidth="2.5" strokeLinecap="round" opacity="0.6"/>
        </g>

        <g id="eyebrows">
          <path d="M112,110 C 120,102 134,102 142,108" fill="none" stroke="#241812" strokeWidth="5" strokeLinecap="round"/>
          <path d="M158,108 C 166,102 180,102 188,110" fill="none" stroke="#241812" strokeWidth="5" strokeLinecap="round"/>
        </g>

        <g id="eyes">
          <circle cx="126" cy="128" r="7" fill="#201a16"/>
          <circle cx="174" cy="128" r="7" fill="#201a16"/>
        </g>

        <g id="glasses">
          <rect x="106" y="115" width="38" height="27" rx="8" fill="#dbe7ec" fillOpacity="0.18" stroke="#1b1b1f" strokeWidth="3"/>
          <rect x="156" y="115" width="38" height="27" rx="8" fill="#dbe7ec" fillOpacity="0.18" stroke="#1b1b1f" strokeWidth="3"/>
          <path d="M144,127 L156,127" fill="none" stroke="#1b1b1f" strokeWidth="3"/>
          <path d="M106,120 L94,116" fill="none" stroke="#1b1b1f" strokeWidth="3" strokeLinecap="round"/>
          <path d="M194,120 L206,116" fill="none" stroke="#1b1b1f" strokeWidth="3" strokeLinecap="round"/>
        </g>

        {/* Rigged Mouth */}
        <g 
          id="mouth"
          style={{ transformOrigin: '150px 158px', transform: `scaleY(${mouthScaleY})` }}
        >
          <path d="M122,158 Q150,172 178,158" fill="none" stroke="#241812" strokeWidth="4" strokeLinecap="round"/>
          <path d="M181,157 L188,153" fill="none" stroke="#241812" strokeWidth="2.5" strokeLinecap="round"/>
        </g>
      </svg>
    </AbsoluteFill>
  );
};
