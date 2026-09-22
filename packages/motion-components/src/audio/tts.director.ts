import { StoryPlan } from '../story/story.types';
import { AudioTimeline } from '../generation/generation.types';

export class DeterministicTTSDirector {
  /**
   * Reads the story beats and estimates exact timestamps for every word.
   * In a real implementation, this would call ElevenLabs/OpenAI TTS and return the real
   * audio file along with alignment timestamps.
   * 
   * For this mock, we assume exactly 3 words per second (10 frames per word at 30fps).
   */
  public generateAudioTimeline(storyPlan: StoryPlan, fps: number = 30): AudioTimeline {
    const words: { word: string; startFrame: number; endFrame: number; beatId?: string }[] = [];
    let currentFrame = 0;
    const framesPerWord = Math.round(fps / 3); // 3 words per sec = 10 frames @ 30fps

    for (const beat of storyPlan.beats) {
      // Small pause between beats (e.g. 15 frames = 0.5s)
      if (currentFrame > 0) {
        currentFrame += Math.round(fps * 0.5); 
      }

      // Record the beat's start frame for reference if needed
      const beatStartFrame = currentFrame;

      // Extract words roughly (ignoring punctuation for this mock)
      const tokens = beat.message.split(/\s+/).filter(Boolean);

      for (const token of tokens) {
        const startFrame = currentFrame;
        const endFrame = startFrame + framesPerWord;
        
        words.push({
          word: token,
          startFrame,
          endFrame,
          beatId: beat.id
        });

        currentFrame = endFrame;
      }
      
      // Update beat's exact duration based on TTS
      beat.suggestedDurationInFrames = currentFrame - beatStartFrame;
      
      // Store exact start frame in metadata
      if (!beat.metadata) beat.metadata = {};
      beat.metadata.startFrame = beatStartFrame;
      beat.metadata.endFrame = currentFrame;
    }

    return {
      durationInFrames: currentFrame,
      words
    };
  }
}
