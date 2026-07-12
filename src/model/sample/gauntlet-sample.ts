import type { Connection, Element, ElementType, Scene, Screenplay } from '../screenplay';
import type { EvidenceRecord } from '../evidence';

/** Original sample written for this project: LAS GARZAS, a border-town drama.
    Realistic screenplay content for demos — not from any published work. */

let elementCounter = 0;
function el(sceneId: string, type: ElementType, text: string): Element {
  elementCounter += 1;
  return { id: `${sceneId}-e${elementCounter}`, type, text };
}

function scene(
  id: string,
  number: number,
  act: 1 | 2 | 3,
  slug: string,
  storyFunction: Scene['storyFunction'],
  build: (add: (type: ElementType, text: string) => Element) => void,
): Scene {
  elementCounter = 0;
  const elements: Element[] = [];
  build((type, text) => {
    const e = el(id, type, text);
    elements.push(e);
    return e;
  });
  return { id, number, act, slug, storyFunction, elements };
}

export const sampleScreenplay: Screenplay = {
  id: 'las-garzas',
  title: 'LAS GARZAS',
  draftLabel: 'Second Draft — for rewrite',
  scenes: [
    scene('sc1', 1, 1, 'EXT. HIGHWAY 2 - SONORAN DESERT - DAY', 'setup', (add) => {
      add('scene_heading', 'EXT. HIGHWAY 2 - SONORAN DESERT - DAY');
      add('action', 'Heat ripples off two-lane blacktop. A dusty COMPACT CAR pushes north past dead cotton fields. On the passenger seat: a black funeral dress, still in its dry-cleaning bag.');
      add('action', 'Behind the wheel, MARISOL REYES (38), city clothes, desert eyes. She turns the radio off and drives in silence.');
    }),
    scene('sc2', 2, 1, 'INT. REYES FAMILY HOUSE - KITCHEN - DAY', 'setup', (add) => {
      add('scene_heading', 'INT. REYES FAMILY HOUSE - KITCHEN - DAY');
      add('action', 'A wake in a small kitchen. Mourners murmur in the living room beyond. Marisol, alone, reaches into the flour tin above the stove — her father’s old hiding place — and pulls out a LEATHER LEDGER, flour-white at the edges.');
      add('character', 'MARISOL');
      add('parenthetical', '(to herself)');
      add('dialogue', 'You never stopped keeping score, Papá.');
    }),
    scene('sc3', 3, 1, 'EXT. SAN BLAS CEMETERY - DAY', 'relationship', (add) => {
      add('scene_heading', 'EXT. SAN BLAS CEMETERY - DAY');
      add('action', 'Fresh earth. Marisol stands beside LUPITA (16), her niece, all elbows and eyeliner. The crowd thins around them.');
      add('character', 'LUPITA');
      add('dialogue', 'Everybody keeps saying he died of a tired heart. Nadie se muere de eso, tía. Nobody just gets tired.');
      add('character', 'MARISOL');
      add('dialogue', 'Some men do. This town helps.');
    }),
    scene('sc4', 4, 1, 'INT. AGUAS DEL VALLE - RAÚL’S OFFICE - DAY', 'plot', (add) => {
      add('scene_heading', 'INT. AGUAS DEL VALLE - RAÚL’S OFFICE - DAY');
      add('action', 'A water company office pretending to be modest. RAÚL REYES (60), Marisol’s uncle, linen shirt, slides a folder across the desk. A check clipped to the front.');
      add('character', 'RAÚL');
      add('dialogue', 'Your father’s share of the concession. I’m offering double what it’s worth, mija. Sign it, go back to your life.');
      add('character', 'MARISOL');
      add('parenthetical', '(not touching the folder)');
      add('dialogue', 'Double. For dirt with no water under it?');
      add('transition', 'CUT TO:');
    }),
    scene('sc5', 5, 2, 'INT. EL CAMINO MOTEL - ROOM 7 - NIGHT', 'plot', (add) => {
      add('scene_heading', 'INT. EL CAMINO MOTEL - ROOM 7 - NIGHT');
      add('action', 'Ledger pages spread across a sagging bed. Marisol works a calculator, sticky notes climbing the headboard like ivy. She circles one column twice.');
      add('character', 'MARISOL');
      add('parenthetical', '(quiet)');
      add('dialogue', 'Forty thousand cubic meters. Every dry season. Where are you going?');
    }),
    scene('sc6', 6, 2, 'EXT. CANAL SIETE - DAWN', 'opposition', (add) => {
      add('scene_heading', 'EXT. CANAL SIETE - DAWN');
      add('action', 'A concrete canal, bone dry. FARMERS wait beside empty pipes. CHUY ORTEGA (50s), Aguas del Valle foreman, padlocks the head gate under their stares.');
      add('character', 'CHUY');
      add('dialogue', 'Allotments changed. Take it up with the office.');
      add('character', 'MARISOL');
      add('dialogue', 'I am the office now, Chuy. Twelve percent of it.');
    }),
    scene('sc7', 7, 2, 'INT. MUNICIPAL ARCHIVE - DAY', 'plot', (add) => {
      add('scene_heading', 'INT. MUNICIPAL ARCHIVE - DAY');
      add('action', 'Rolling shelves of yellowed folios. A CLERK unrolls the 1962 concession map. Marisol traces the canal lines — and stops at a ragged edge where a page has been razored out.');
      add('character', 'MARISOL');
      add('dialogue', 'Who checked this volume out last?');
      add('character', 'CLERK');
      add('parenthetical', '(already regretting it)');
      add('dialogue', 'Señora... I like this job.');
    }),
    scene('sc8', 8, 2, 'EXT. REYES FAMILY HOUSE - PORCH - NIGHT', 'relationship', (add) => {
      add('scene_heading', 'EXT. REYES FAMILY HOUSE - PORCH - NIGHT');
      add('action', 'Crickets. Marisol and Lupita share a blanket and a bag of chamoy peanuts.');
      add('character', 'LUPITA');
      add('dialogue', 'When I stay at Ceci’s I hear trucks on the old ranch road. Two, three in the morning. Water trucks, tía. In a drought.');
      add('character', 'MARISOL');
      add('parenthetical', '(a long beat)');
      add('dialogue', 'You never told anyone that.');
      add('character', 'LUPITA');
      add('dialogue', 'You never asked.');
    }),
    scene('sc9', 9, 2, 'INT. EL CAMINO MOTEL - ROOM 7 - NIGHT', 'opposition', (add) => {
      add('scene_heading', 'INT. EL CAMINO MOTEL - ROOM 7 - NIGHT');
      add('action', 'The door hangs open. The room is gutted — mattress flipped, sticky notes gone, ledger pages fanned across the floor like shot birds. Headlights sweep the window. Raúl’s pickup idles outside, then rolls away, unhurried.');
      add('character', 'MARISOL');
      add('parenthetical', '(into the dark)');
      add('dialogue', 'Okay, tío. Now I know it’s real.');
    }),
    scene('sc10', 10, 3, 'EXT. OLD RANCH ROAD - WATER DEPOT - NIGHT', 'plot', (add) => {
      add('scene_heading', 'EXT. OLD RANCH ROAD - WATER DEPOT - NIGHT');
      add('action', 'Tanker trucks nose up to an unmarked standpipe like calves to a trough. From the ditch, Marisol films on her phone. A hand lands on her shoulder — CHUY. She freezes. He looks at the trucks, then at her. He angles his flashlight down, giving her the dark.');
      add('character', 'CHUY');
      add('parenthetical', '(low)');
      add('dialogue', 'My brother farms off Canal Siete. Film the plates.');
    }),
    scene('sc11', 11, 3, 'INT. TOWN HALL - EJIDO ASSEMBLY - NIGHT', 'resolution', (add) => {
      add('scene_heading', 'INT. TOWN HALL - EJIDO ASSEMBLY - NIGHT');
      add('action', 'Packed hall. Raúl at the microphone, mid-reassurance. Marisol walks the center aisle and lays the ledger — flour dust and all — on the table, her phone on top, video queued.');
      add('character', 'MARISOL');
      add('dialogue', 'My father counted every liter you stole. I finished his math.');
      add('action', 'The hall erupts. Raúl reaches for the ledger. A dozen phones rise, recording. He stops.');
      add('transition', 'CUT TO:');
    }),
    scene('sc12', 12, 3, 'EXT. REYES FAMILY HOUSE - DAWN', 'resolution', (add) => {
      add('scene_heading', 'EXT. REYES FAMILY HOUSE - DAWN');
      add('action', 'First light. Marisol pries the boards off her father’s office window. Inside: his desk, his chair, his adding machine. Lupita appears with two cups of coffee, hands her one.');
      add('character', 'LUPITA');
      add('dialogue', 'So you’re staying.');
      add('character', 'MARISOL');
      add('parenthetical', '(looking at the desk)');
      add('dialogue', 'Somebody has to keep score.');
    }),
  ],
};

export const sampleConnections: Connection[] = [
  { id: 'c1', fromSceneId: 'sc2', toSceneId: 'sc11', kind: 'setup_payoff', label: 'Ledger set-up pays off at the assembly' },
  { id: 'c2', fromSceneId: 'sc5', toSceneId: 'sc9', kind: 'escalation', label: 'Audit discovery escalates to the ransacked room' },
  { id: 'c3', fromSceneId: 'sc3', toSceneId: 'sc8', kind: 'relationship', label: 'Marisol and Lupita learn to ask' },
  { id: 'c4', fromSceneId: 'sc8', toSceneId: 'sc10', kind: 'setup_payoff', label: 'Night trucks rumor pays off at the depot' },
  { id: 'c5', fromSceneId: 'sc9', toSceneId: 'sc11', kind: 'escalation', label: 'Low point forces the assembly gamble' },
];

export const sampleEvidence: EvidenceRecord[] = [
  {
    id: 'ev1',
    source: 'writer',
    claimType: 'textual_fact',
    status: 'clear',
    summary: 'The ledger is physically established in the flour tin in Scene 2 before any plot use.',
    sceneId: 'sc2',
    elementId: 'sc2-e2',
  },
  {
    id: 'ev2',
    source: 'reader',
    claimType: 'reader_reaction',
    status: 'priority_concern',
    summary: 'Raúl’s buyout offer lands before I understand what the concession is worth, so the "double" means nothing yet.',
    sceneId: 'sc4',
    elementId: 'sc4-e4',
    readerName: 'Ana P.',
  },
  {
    id: 'ev3',
    source: 'ai',
    claimType: 'ai_hypothesis',
    status: 'uncertain',
    summary: 'The audit beat may read as busywork: the discovery ("forty thousand cubic meters") arrives in dialogue rather than action.',
    sceneId: 'sc5',
    elementId: 'sc5-e5',
  },
  {
    id: 'ev4',
    source: 'producer_executive',
    claimType: 'reader_reaction',
    status: 'uncertain',
    summary: 'Opening drive is atmospheric but slow; consider cutting into the wake.',
    sceneId: 'sc1',
    elementId: 'sc1-e2',
  },
  {
    id: 'ev5',
    source: 'interim_reader',
    claimType: 'reader_reaction',
    status: 'clear',
    summary: 'The porch scene is the emotional center of the middle; "You never asked" landed hard.',
    sceneId: 'sc8',
    elementId: 'sc8-e9',
    readerName: 'Diego M.',
  },
  {
    id: 'ev6',
    source: 'writer',
    claimType: 'writer_confirmed',
    status: 'clear',
    summary: 'Lupita’s bilingual line is intentional: she code-switches when she talks about death.',
    sceneId: 'sc3',
    elementId: 'sc3-e4',
  },
  {
    id: 'ev7',
    source: 'ai',
    claimType: 'unresolved_hypothesis',
    status: 'uncertain',
    summary: 'Who searched the motel room is never confirmed on the page; the pickup implies Raúl but no scene establishes it.',
    sceneId: 'sc9',
    elementId: 'sc9-e2',
  },
  {
    id: 'ev8',
    source: 'reader',
    claimType: 'reader_reaction',
    status: 'priority_concern',
    summary: 'The assembly flips from Raúl’s control to Marisol’s win in half a page; the turn feels unearned.',
    sceneId: 'sc11',
    elementId: 'sc11-e4',
    readerName: 'Tomás V.',
  },
  {
    id: 'ev9',
    source: 'writer',
    claimType: 'textual_fact',
    status: 'clear',
    summary: 'The depot scene pays off Lupita’s night-trucks line from the porch scene.',
    sceneId: 'sc10',
    elementId: 'sc10-e2',
  },
  {
    id: 'ev10',
    source: 'ai',
    claimType: 'ai_hypothesis',
    status: 'priority_concern',
    summary: 'Chuy’s turn at the depot needs a visible seed here: he padlocks the gate with no flicker of conflict.',
    sceneId: 'sc6',
    elementId: 'sc6-e2',
  },
];
