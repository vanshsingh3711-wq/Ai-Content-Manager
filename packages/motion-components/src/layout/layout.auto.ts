import { AutoPositionConfig, AutoPositionResult, LayoutElement, LayoutGroup, SceneLayout } from './layout.types';
import { getAnchorOffset } from './layout.utils';
import { resolveSafeZoneBounds, checkSafeZoneOverlap } from './layout.safezone';

/**
 * Automatically calculates x/y positions for elements with positionMode === 'auto'.
 * Outputs a new SceneLayout with explicit coordinates replacing the 'auto' elements.
 */
export function applyAutoPositioning(layout: SceneLayout, config: AutoPositionConfig = {}): AutoPositionResult {
  // Deep clone to avoid mutating the original layout
  const newLayout: SceneLayout = JSON.parse(JSON.stringify(layout));

  const {
    direction = 'vertical',
    alignment = 'start',
    gap = 0,
    padding = { top: 0, right: 0, bottom: 0, left: 0 }
  } = config;

  // 1. Gather all 'auto' elements by reference from the cloned tree
  const autoElements: LayoutElement[] = [];
  const gatherAuto = (elements: (LayoutElement | LayoutGroup)[]) => {
    for (const el of elements) {
      if (el.positionMode === 'auto') {
        autoElements.push(el);
      }
      if ('children' in el && Array.isArray(el.children)) {
        gatherAuto(el.children as (LayoutElement | LayoutGroup)[]);
      }
    }
  };
  gatherAuto(newLayout.elements);

  if (autoElements.length === 0) {
    return {
      layout: newLayout,
      diagnostics: { overflow: false }
    };
  }

  // 2. Resolve restricted zones
  const restrictedZones = (layout.safeZones || [])
    .filter(z => z.type === 'restricted')
    .map(z => resolveSafeZoneBounds(z, layout.width, layout.height));

  // 3. Group auto elements by their requested safeZoneId (or 'default')
  const groups: Record<string, LayoutElement[]> = {};
  for (const el of autoElements) {
    const key = el.safeZoneId || 'default';
    if (!groups[key]) groups[key] = [];
    groups[key].push(el);
  }

  let globalOverflow = false;
  let globalOverflowDirection: 'bottom' | 'right' | 'top' | 'left' | undefined;

  // 4. Process each group
  for (const [zoneId, elements] of Object.entries(groups)) {
    // Sort elements by priority descending, then by original array order (stable)
    // Wait, stable sort requires indices. For simplicity, just sort by priority.
    elements.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

    // Determine container bounds for this group
    let cX = config.container?.x ?? 0;
    let cY = config.container?.y ?? 0;
    let cW = config.container?.width ?? layout.width;
    let cH = config.container?.height ?? layout.height;

    if (zoneId !== 'default') {
      const zoneDef = layout.safeZones?.find(z => z.id === zoneId && z.type === 'safe');
      if (zoneDef) {
        const zb = resolveSafeZoneBounds(zoneDef, layout.width, layout.height);
        cX = zb.x;
        cY = zb.y;
        cW = zb.width;
        cH = zb.height;
      }
    }

    const usableX = cX + (padding.left ?? 0);
    const usableY = cY + (padding.top ?? 0);
    const usableWidth = cW - (padding.left ?? 0) - (padding.right ?? 0);
    const usableHeight = cH - (padding.top ?? 0) - (padding.bottom ?? 0);

    // Measure block size
    let totalWidth = 0;
    let totalHeight = 0;

    if (direction === 'vertical') {
      totalHeight = elements.reduce((sum, el) => sum + el.height, 0) + gap * (elements.length - 1);
      totalWidth = Math.max(...elements.map(el => el.width));
    } else {
      totalWidth = elements.reduce((sum, el) => sum + el.width, 0) + gap * (elements.length - 1);
      totalHeight = Math.max(...elements.map(el => el.height));
    }

    // Calculate starting offsets based on alignment
    let currentX = usableX;
    let currentY = usableY;

    if (alignment === 'center') {
      if (direction === 'vertical') {
        currentY += (usableHeight - totalHeight) / 2;
      } else {
        currentX += (usableWidth - totalWidth) / 2;
      }
    } else if (alignment === 'end') {
      if (direction === 'vertical') {
        currentY += usableHeight - totalHeight;
      } else {
        currentX += usableWidth - totalWidth;
      }
    }

    // Place elements
    for (const el of elements) {
      // Collision avoidance logic: check if placing here hits a restricted zone
      // We do a simple while loop. If we hit one, jump past it.
      let dodged = false;
      let iterations = 0;
      do {
        dodged = false;
        const testBox = { id: 'test', x: currentX, y: currentY, width: el.width, height: el.height };
        
        for (const rz of restrictedZones) {
          const overlap = checkSafeZoneOverlap(testBox, rz);
          if (overlap.intersecting) {
            dodged = true;
            if (direction === 'vertical') {
              currentY = rz.y + rz.height + gap; // Jump below it
            } else {
              currentX = rz.x + rz.width + gap; // Jump right of it
            }
            break; // Re-evaluate against all restricted zones from new position
          }
        }
        iterations++;
      } while (dodged && iterations < 10); // Prevent infinite loops

      // Determine cross-axis center if alignment is center
      let elTargetX = currentX;
      let elTargetY = currentY;

      if (direction === 'vertical') {
        if (alignment === 'center') {
          elTargetX = usableX + (usableWidth - el.width) / 2;
        } else if (alignment === 'end') {
          elTargetX = usableX + usableWidth - el.width;
        }
      } else {
        if (alignment === 'center') {
          elTargetY = usableY + (usableHeight - el.height) / 2;
        } else if (alignment === 'end') {
          elTargetY = usableY + usableHeight - el.height;
        }
      }

      const offset = getAnchorOffset(el.width, el.height, el.anchor);
      el.x = elTargetX - offset.x;
      el.y = elTargetY - offset.y;
      el.positionMode = 'absolute';

      if (direction === 'vertical') {
        currentY += el.height + gap;
      } else {
        currentX += el.width + gap;
      }
    }

    // Overflow check for this group
    const isOverflow = direction === 'vertical' ? currentY > (usableY + usableHeight) : currentX > (usableX + usableWidth);
    if (isOverflow) {
      globalOverflow = true;
      globalOverflowDirection = direction === 'vertical' ? 'bottom' : 'right';
    }
  }

  return {
    layout: newLayout,
    diagnostics: {
      overflow: globalOverflow,
      overflowDirection: globalOverflowDirection
    }
  };
}
