import { StoryPlanner, StoryPlanRequest, StoryPlan, StoryBeatPlan, StoryBeatType } from './story.types';
import { validateStoryPlan } from './story.validation';

/**
 * A deterministic Story Planner that simulates the semantic mapping 
 * of topics to narrative structures without an AI provider.
 */
export class DeterministicStoryPlanner implements StoryPlanner {
  plan(request: StoryPlanRequest): StoryPlan {
    const topicStr = request.topic.toLowerCase();
    
    // We deterministically build the story beats
    const beats: StoryBeatPlan[] = [];
    let beatIdCounter = 1;
    const addBeat = (type: StoryBeatType, purpose: string, message: string, importance: 'low'|'medium'|'high' = 'medium') => {
      beats.push({
        id: `beat_${beatIdCounter++}`,
        type,
        purpose,
        message,
        importance
      });
    };

    // 1. Every story starts with a hook
    addBeat(
      'hook', 
      `Grab attention regarding: ${request.topic}`, 
      `Did you ever wonder about ${request.topic}?`, 
      'high'
    );

    // 2. Map structural logic based on deterministic keywords
    if (topicStr.includes('why')) {
      addBeat('problem', 'Establish the central tension', 'There is a common misunderstanding or underlying problem here.', 'high');
      addBeat('explanation', 'Explain the mechanism', 'Here is why this happens mechanically.', 'high');
      addBeat('reveal', 'Provide the core insight', 'The real reason might surprise you.', 'high');
    } else if (topicStr.includes('how')) {
      addBeat('setup', 'Provide the necessary context', 'To understand this, we first need to look at the basics.', 'medium');
      addBeat('explanation', 'Break down the process', 'This works through a specific sequence of actions.', 'high');
      addBeat('example', 'Make it concrete', 'For instance, imagine you are trying to do this yourself.', 'medium');
    } else if (topicStr.includes('compare') || topicStr.includes('vs') || topicStr.includes('difference')) {
      addBeat('comparison', 'Draw a clear distinction', 'Let us compare the two main approaches.', 'high');
      addBeat('evidence', 'Provide supporting facts', 'The data shows a clear winner in most scenarios.', 'medium');
    } else {
      // Generic fallback
      addBeat('setup', 'Introduce the subject', `Let's talk about ${request.topic}.`, 'medium');
      addBeat('explanation', 'Discuss the details', 'Here are the key points you need to know.', 'high');
      addBeat('example', 'Provide an illustration', 'Consider this common scenario as an example.', 'low');
    }

    // 3. Every story needs a conclusion
    addBeat(
      'conclusion',
      'Summarize the takeaway',
      'Ultimately, understanding this gives you an advantage.',
      'high'
    );

    // Apply constraints: Max Beats
    let finalBeats = [...beats];
    if (request.constraints?.maxBeats && finalBeats.length > request.constraints.maxBeats) {
      const allowed = request.constraints.maxBeats;
      // Heuristic: keep hook and conclusion, remove 'low' importance first, then 'medium'
      const hook = finalBeats[0];
      const conclusion = finalBeats[finalBeats.length - 1];
      let middle = finalBeats.slice(1, -1);
      
      // Filter out low
      if (hook && conclusion && 2 + middle.length > allowed) {
        middle = middle.filter(b => b.importance !== 'low');
      }
      // Filter out medium if still too big
      if (hook && conclusion && 2 + middle.length > allowed) {
        middle = middle.filter(b => b.importance !== 'medium');
      }
      // Truncate if STILL too big
      if (hook && conclusion && 2 + middle.length > allowed) {
        middle = middle.slice(0, allowed - 2);
      }

      finalBeats = [hook, ...middle, conclusion];
    }

    // Allocate time if duration is requested
    if (request.durationInFrames && finalBeats.length > 0) {
      const totalFrames = request.durationInFrames;
      // Simple allocation: high = 2 parts, medium = 1 part, low = 0.5 parts
      let totalParts = 0;
      finalBeats.forEach(b => {
        if (b.importance === 'high') totalParts += 2;
        else if (b.importance === 'medium') totalParts += 1;
        else totalParts += 0.5;
      });

      const framePerPart = totalFrames / totalParts;
      finalBeats.forEach(b => {
        let parts = 1;
        if (b.importance === 'high') parts = 2;
        else if (b.importance === 'low') parts = 0.5;
        b.suggestedDurationInFrames = Math.floor(framePerPart * parts);
      });
    }

    const cleanId = topicStr.replace(/[^a-z0-9]/g, '_').substring(0, 20);
    const plan: StoryPlan = {
      id: `story_plan_${cleanId}`,
      topic: request.topic,
      objective: request.objective,
      audience: request.audience,
      durationInFrames: request.durationInFrames,
      beats: finalBeats
    };

    // Sanity check
    const diagnostics = validateStoryPlan(plan);
    if (diagnostics.some(d => d.severity === 'error')) {
      throw new Error(`Generated invalid story plan: ${diagnostics.map(d => d.message).join(', ')}`);
    }

    return plan;
  }
}
