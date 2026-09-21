import os
import re

filepath = "src/scene/scene.resolve.ts"
with open(filepath, 'r') as f:
    content = f.read()

# Fix the size unknown and {} types by casting to number
content = content.replace(
    'if (!placementReq.size) placementReq.size = { width: resolvedImageConfig.metadata.width, height: resolvedImageConfig.metadata.height }; else { if (resolvedImageConfig.metadata.width && !placementReq.size.width) placementReq.size.width = resolvedImageConfig.metadata.width; if (resolvedImageConfig.metadata.height && !placementReq.size.height) placementReq.size.height = resolvedImageConfig.metadata.height; }',
    'if (!placementReq.size) placementReq.size = { width: resolvedImageConfig.metadata.width as number, height: resolvedImageConfig.metadata.height as number }; else { if (resolvedImageConfig.metadata.width && !placementReq.size.width) placementReq.size.width = resolvedImageConfig.metadata.width as number; if (resolvedImageConfig.metadata.height && !placementReq.size.height) placementReq.size.height = resolvedImageConfig.metadata.height as number; }'
)

content = content.replace(
    'if (!placementReq.size) placementReq.size = { width: resolvedVideoConfig.metadata.width, height: resolvedVideoConfig.metadata.height }; else { if (resolvedVideoConfig.metadata.width && !placementReq.size.width) placementReq.size.width = resolvedVideoConfig.metadata.width; if (resolvedVideoConfig.metadata.height && !placementReq.size.height) placementReq.size.height = resolvedVideoConfig.metadata.height; }',
    'if (!placementReq.size) placementReq.size = { width: resolvedVideoConfig.metadata.width as number, height: resolvedVideoConfig.metadata.height as number }; else { if (resolvedVideoConfig.metadata.width && !placementReq.size.width) placementReq.size.width = resolvedVideoConfig.metadata.width as number; if (resolvedVideoConfig.metadata.height && !placementReq.size.height) placementReq.size.height = resolvedVideoConfig.metadata.height as number; }'
)

with open(filepath, 'w') as f:
    f.write(content)

# Now fix the anchor in core.templates.ts
filepath = "src/templates/core.templates.ts"
with open(filepath, 'r') as f:
    content = f.read()

content = content.replace(
    "anchor: 'center'",
    "anchor: 'center' as any"
)
content = content.replace(
    "anchor: 'top-center'",
    "anchor: 'top-center' as any"
)
content = content.replace(
    "anchor: 'bottom-center'",
    "anchor: 'bottom-center' as any"
)

with open(filepath, 'w') as f:
    f.write(content)

print("Fixed")
