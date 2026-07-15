/** Jack Epps Jr.'s eleven rewrite passes, verbatim names in his book order.
    Passes are reusable lenses: they can repeat, combine, reorder, or skip;
    this order is his stated default, with Character as his recommended emphasis. */

export interface RewritePass {
  id: string;
  name: string;
  /** Compact label for the top pass strip, so long names don't smash together.
      The full `name` and objective still appear in the pass workspace panel. */
  short: string;
  order: number;
  blurb: string;
}

export const EPPS_PASSES: RewritePass[] = [
  { id: 'foundation', name: 'Foundation', short: 'Foundation', order: 1, blurb: 'Ground the story: intent, premise, and what the screenplay is actually about.' },
  { id: 'character', name: 'Character', short: 'Character', order: 2, blurb: 'Epps’s recommended starting emphasis: want, need, arc, and opposition.' },
  { id: 'story-theme', name: 'Story and Theme', short: 'Story & Theme', order: 3, blurb: 'Sharpen the story being told and the theme underneath it.' },
  { id: 'structure', name: 'Structure', short: 'Structure', order: 4, blurb: 'Acts, high points, midpoint, and escalation into Act Three.' },
  { id: 'plot', name: 'Plot', short: 'Plot', order: 5, blurb: 'Cause and effect, logic, stakes, and momentum. Interim reader feedback follows this pass.' },
  { id: 'corr', name: 'Complications, Obstacles, Reveals and Reversals', short: 'Complications', order: 6, blurb: 'Pressure the protagonist; earn surprises.' },
  { id: 'relationship', name: 'Relationship', short: 'Relationship', order: 7, blurb: 'Deepen the relationships that carry the emotion.' },
  { id: 'scene', name: 'Scene', short: 'Scene', order: 8, blurb: 'Every scene earns its place: Scene Point, in late, out early.' },
  { id: 'dialogue', name: 'Dialogue', short: 'Dialogue', order: 9, blurb: 'Voice, subtext, economy, and read-aloud rhythm.' },
  { id: 'consistency', name: 'Consistency', short: 'Consistency', order: 10, blurb: 'Holdovers, orphans, continuity, names, time, and logic.' },
  { id: 'polish', name: 'Polish', short: 'Polish', order: 11, blurb: 'Final cover-to-cover Polish Read before the script goes out.' },
];
