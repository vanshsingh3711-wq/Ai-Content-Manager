import { StoryPlan, StoryBeatPlan, StoryBeatType } from './story.types';

export class DeterministicScriptAnalyzer {
  /**
   * Analyzes a raw text script and breaks it down into Story Beats.
   * In a real AI implementation, this would use an LLM to assign narrative types (hook, setup, etc.)
   * For this deterministic implementation, it chunks by paragraphs or punctuation.
   */
  public analyze(script: string, topic: string): StoryPlan {
    // 1. Split script by double newlines or single newlines
    let paragraphs = script.split(/\n\n+/).map(s => s.trim()).filter(Boolean);
    
    // Fallback to sentence splitting if it's just one big block of text
    if (paragraphs.length <= 1) {
      paragraphs = script.split(/(?<=[.?!])\s+/).map(s => s.trim()).filter(Boolean);
    }

    const beats: StoryBeatPlan[] = [];
    let beatIdCounter = 1;

    paragraphs.forEach((chunk, index) => {
      let type: StoryBeatType = 'explanation';
      let importance: 'low' | 'medium' | 'high' = 'medium';

      if (index === 0) {
        type = 'hook';
        importance = 'high';
      } else if (index === paragraphs.length - 1) {
        type = 'conclusion';
        importance = 'high';
      }

      beats.push({
        id: `beat_${beatIdCounter++}`,
        type,
        purpose: `Deliver script segment ${index + 1}`,
        message: chunk,
        importance
      });
    });

    return {
      id: `script_plan_${crypto.randomUUID()}`,
      topic,
      beats
    };
  }
}
