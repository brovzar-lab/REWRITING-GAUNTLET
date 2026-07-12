/** Canonical screenplay model. This data — never rendered HTML — is the source of truth. */

export type ElementType =
  | 'scene_heading'
  | 'action'
  | 'character'
  | 'parenthetical'
  | 'dialogue'
  | 'transition';

export interface Element {
  /** Stable identity that survives edits and drafts. */
  id: string;
  type: ElementType;
  text: string;
}

export type StoryFunction = 'plot' | 'setup' | 'opposition' | 'resolution' | 'relationship';

export interface Scene {
  id: string;
  number: number;
  act: 1 | 2 | 3;
  slug: string;
  storyFunction: StoryFunction;
  elements: Element[];
}

export interface Screenplay {
  id: string;
  title: string;
  draftLabel: string;
  scenes: Scene[];
}

/** A visible story relationship between two scenes on the board. */
export type ConnectionKind = 'setup_payoff' | 'escalation' | 'relationship';

export interface Connection {
  id: string;
  fromSceneId: string;
  toSceneId: string;
  kind: ConnectionKind;
  label: string;
}
