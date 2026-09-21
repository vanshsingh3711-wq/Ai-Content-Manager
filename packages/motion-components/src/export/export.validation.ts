import { ResolvedSequence } from '../sequence/sequence.types';
import { CompositionDiagnostic } from '../validation/validation.types';
import { ExportConfig } from './export.types';

export function validateExport(
  sequence: ResolvedSequence, 
  config: ExportConfig
): CompositionDiagnostic[] {
  const diagnostics: CompositionDiagnostic[] = [];

  // Check dimensions
  if (!sequence.width || sequence.width <= 0) {
    diagnostics.push({ severity: 'error', type: 'invalid-bounds', message: 'Project width must be greater than 0' });
  }
  if (!sequence.height || sequence.height <= 0) {
    diagnostics.push({ severity: 'error', type: 'invalid-bounds', message: 'Project height must be greater than 0' });
  }

  // Check FPS
  if (!sequence.fps || sequence.fps <= 0) {
    diagnostics.push({ severity: 'error', type: 'invalid-bounds', message: 'Project FPS must be greater than 0' });
  }

  // Check duration
  if (!sequence.durationInFrames || sequence.durationInFrames <= 0) {
    diagnostics.push({ severity: 'error', type: 'invalid-bounds', message: 'Project duration must be greater than 0' });
  }

  // Ensure scenes exist
  if (!sequence.scenes || sequence.scenes.length === 0) {
    diagnostics.push({ severity: 'error', type: 'missing-metadata', message: 'Project must contain at least one scene' });
  }

  // Pass through any existing sequence errors
  if (sequence.diagnostics) {
    for (const diag of sequence.diagnostics) {
      if (diag.severity === 'error') {
        diagnostics.push(diag);
      }
    }
  }

  // Check format support
  if (config.format !== 'mp4') {
    diagnostics.push({ severity: 'error', type: 'missing-metadata', message: `Unsupported export format: ${config.format}` });
  }

  return diagnostics;
}
