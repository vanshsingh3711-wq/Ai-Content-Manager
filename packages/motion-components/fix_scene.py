import os
import re

filepath = "src/scene/scene.resolve.ts"
with open(filepath, 'r') as f:
    content = f.read()

# Fix UpstreamDiagnostic
# Actually I will just fix this in validation.types.ts
with open("src/validation/validation.types.ts", 'r') as f:
    val_content = f.read()
val_content = val_content.replace(
    'export type UpstreamDiagnostic = PlacementDiagnostic | RelationshipDiagnostic | SafeZoneDiagnostic;',
    'export type UpstreamDiagnostic = PlacementDiagnostic | RelationshipDiagnostic | SafeZoneDiagnostic | CompositionDiagnostic;'
)
with open("src/validation/validation.types.ts", 'w') as f:
    f.write(val_content)

# Fix finalDuration used before declaration
# Move finalDuration up to the top of resolveScene (around line 20)
content = content.replace(
    'export function resolveScene(scene: SceneDefinition, context: ResolutionContext): ResolvedSceneGraph {\n  const upstreamDiagnostics: UpstreamDiagnostic[] = [];\n',
    'export function resolveScene(scene: SceneDefinition, context: ResolutionContext): ResolvedSceneGraph {\n  const upstreamDiagnostics: UpstreamDiagnostic[] = [];\n  const finalDuration = scene.durationInFrames !== undefined ? scene.durationInFrames : 0;\n'
)
# And replace the original declaration with just using it, but wait calculatedSceneEndFrame is there.
# Let's just change line 147 to use `scene.durationInFrames || 0`
content = content.replace(
    'const capRes = resolveCaptionTrack(el.captionConfig, finalDuration);',
    'const capRes = resolveCaptionTrack(el.captionConfig, scene.durationInFrames || 0);'
)

# TypographyRole fix
content = content.replace(
    'const typography = resolveTypography(resolvedTextConfig.role, resolvedTokens, resolvedTextConfig);',
    'const typography = resolveTypography(resolvedTextConfig.role as any, resolvedTokens, resolvedTextConfig as any);'
)

# assetId fix
content = content.replace(
    'assetId\n    };',
    'assetId: assetId || el.id\n    };'
)

# size width/height fix
content = content.replace(
    'if (!placementReq.size) placementReq.size = {};\n      placementReq.size.width = resolvedTextMeasurement.width;\n      placementReq.size.height = resolvedTextMeasurement.height;',
    'if (!placementReq.size) placementReq.size = { width: resolvedTextMeasurement.width, height: resolvedTextMeasurement.height }; else { placementReq.size.width = resolvedTextMeasurement.width; placementReq.size.height = resolvedTextMeasurement.height; }'
)
content = content.replace(
    'if (!placementReq.size) placementReq.size = {};\n      if (resolvedImageConfig.metadata.width && !placementReq.size.width) {\n        placementReq.size.width = resolvedImageConfig.metadata.width;\n      }\n      if (resolvedImageConfig.metadata.height && !placementReq.size.height) {\n        placementReq.size.height = resolvedImageConfig.metadata.height;\n      }',
    'if (!placementReq.size) placementReq.size = { width: resolvedImageConfig.metadata.width, height: resolvedImageConfig.metadata.height }; else { if (resolvedImageConfig.metadata.width && !placementReq.size.width) placementReq.size.width = resolvedImageConfig.metadata.width; if (resolvedImageConfig.metadata.height && !placementReq.size.height) placementReq.size.height = resolvedImageConfig.metadata.height; }'
)
content = content.replace(
    'if (!placementReq.size) placementReq.size = {};\n      if (resolvedVideoConfig.metadata.width && !placementReq.size.width) {\n        placementReq.size.width = resolvedVideoConfig.metadata.width;\n      }\n      if (resolvedVideoConfig.metadata.height && !placementReq.size.height) {\n        placementReq.size.height = resolvedVideoConfig.metadata.height;\n      }',
    'if (!placementReq.size) placementReq.size = { width: resolvedVideoConfig.metadata.width, height: resolvedVideoConfig.metadata.height }; else { if (resolvedVideoConfig.metadata.width && !placementReq.size.width) placementReq.size.width = resolvedVideoConfig.metadata.width; if (resolvedVideoConfig.metadata.height && !placementReq.size.height) placementReq.size.height = resolvedVideoConfig.metadata.height; }'
)

# Anchor fix
content = content.replace(
    'anchor: placement.anchor,',
    'anchor: placement.anchor || \'center\','
)

with open(filepath, 'w') as f:
    f.write(content)
print(f"Fixed {filepath}")
