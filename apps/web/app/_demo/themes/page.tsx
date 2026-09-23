'use client';

import React from 'react';
import { AnimatedKPI } from '@ai-content-manager/motion-components/src/elements/AnimatedKPI';
import { resolveTheme } from '@ai-content-manager/motion-components/src/themes/theme.registry';
import { resolveDesignTokens } from '@ai-content-manager/motion-components/src/themes/tokens.resolver';

export default function ThemeDemo() {
  const premiumDark = resolveTheme('premium_dark');
  const premiumDarkTokens = resolveDesignTokens(premiumDark);
  
  const cleanLight = resolveTheme('clean_light');
  const cleanLightTokens = resolveDesignTokens(cleanLight);
  
  const editorial = resolveTheme('editorial');
  const editorialTokens = resolveDesignTokens(editorial);

  return (
    <div style={{ padding: 40, background: '#000', minHeight: '100vh', color: '#fff', display: 'flex', flexDirection: 'column', gap: 40 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>Theme & Style System</h1>
        <p style={{ color: '#aaa' }}>
          This demo shows the same AnimatedKPI component rendered with three completely different themes mapped into strict Design Tokens, 
          driven deterministically without modifying the component's internal styles manually.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
        {/* Premium Dark Theme */}
        <div>
          <h2 style={{ marginBottom: 16, fontSize: 18, fontWeight: 600 }}>Premium Dark</h2>
          <div style={{ 
            padding: 20, 
            background: premiumDarkTokens.colors.background, 
            borderRadius: premiumDarkTokens.radius.lg,
            border: `${premiumDarkTokens.borderWidth.thin}px solid ${premiumDarkTokens.colors.border}`,
            boxShadow: premiumDarkTokens.shadow.lg
          }}>
            <AnimatedKPI 
              title="Revenue" 
              value={4.2} 
              format="currency"
              suffix="M"
              changeValue={12.5}
              width={300}
              height={150}
              tokens={premiumDarkTokens}
              currentFrame={30} // Render fully animated state
            />
          </div>
        </div>

        {/* Clean Light Theme */}
        <div>
          <h2 style={{ marginBottom: 16, fontSize: 18, fontWeight: 600 }}>Clean Light</h2>
          <div style={{ 
            padding: 20, 
            background: cleanLightTokens.colors.background, 
            borderRadius: cleanLightTokens.radius.lg,
            border: `${cleanLightTokens.borderWidth.thin}px solid ${cleanLightTokens.colors.border}`,
            boxShadow: cleanLightTokens.shadow.lg
          }}>
            <AnimatedKPI 
              title="New Users" 
              value={12400} 
              format="number"
              changeValue={-5.2}
              width={300}
              height={150}
              tokens={cleanLightTokens}
              currentFrame={30}
            />
          </div>
        </div>

        {/* Editorial Theme */}
        <div>
          <h2 style={{ marginBottom: 16, fontSize: 18, fontWeight: 600 }}>Editorial</h2>
          <div style={{ 
            padding: 20, 
            background: editorialTokens.colors.background, 
            borderRadius: editorialTokens.radius.lg,
            border: `${editorialTokens.borderWidth.thin}px solid ${editorialTokens.colors.border}`,
            boxShadow: editorialTokens.shadow.lg
          }}>
            <AnimatedKPI 
              title="Global Reach" 
              value={87} 
              format="percentage"
              changeValue={2.1}
              width={300}
              height={150}
              tokens={editorialTokens}
              currentFrame={30}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
