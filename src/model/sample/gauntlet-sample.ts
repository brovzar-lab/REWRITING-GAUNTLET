import type { Connection, Element, ElementType, Scene, Screenplay } from '../screenplay';
import type { EvidenceRecord } from '../evidence';

/** Original sample written for this project: LAS GARZAS, a border-town drama.
    Realistic screenplay content for demos — not from any published work.
    IMPORTANT: existing element ids (sc1-e1 …) are stable references used by
    evidence records and tests. New material is only appended after existing
    elements (or before a scene's trailing transition, whose id is unreferenced). */

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
      add('action', 'A road sign staggers past: SAN BLAS 12. Beneath the town name, someone has spray-painted two words in dripping white: SIN AGUA.');
      add('action', 'She passes a line of parked farm trucks on the shoulder. Men stand in the thin shade of their own flatbeds, watching her city plates go by. Nobody waves.');
      add('action', 'Far off, where the river used to run, a heron lifts out of the dry bed and beats its way north. Marisol watches it go until the road curves.');
    }),
    scene('sc2', 2, 1, 'INT. REYES FAMILY HOUSE - KITCHEN - DAY', 'setup', (add) => {
      add('scene_heading', 'INT. REYES FAMILY HOUSE - KITCHEN - DAY');
      add('action', 'A wake in a small kitchen. Mourners murmur in the living room beyond. Marisol, alone, reaches into the flour tin above the stove — her father’s old hiding place — and pulls out a LEATHER LEDGER, flour-white at the edges.');
      add('character', 'MARISOL');
      add('parenthetical', '(to herself)');
      add('dialogue', 'You never stopped keeping score, Papá.');
      add('action', 'The kitchen door swings. Marisol slides the ledger into her purse in one practiced motion. TÍA CARMEN (70s), small and iron-spined, sets down a tower of borrowed folding chairs.');
      add('character', 'CARMEN');
      add('dialogue', 'Your uncle is telling the governor story again. Third time. Each time the governor gets taller.');
      add('character', 'MARISOL');
      add('dialogue', 'And Papá gets smaller.');
      add('action', 'Through the doorway: RAÚL REYES (60) holds court among the mourners, linen shirt, easy laughter. He catches Marisol’s eye and raises his coffee to her like a toast.');
      add('character', 'CARMEN');
      add('parenthetical', '(low, not looking at her)');
      add('dialogue', 'Whatever your father hid from that man, mija — decide fast what you are going to do with it. Grief makes the house easy to search.');
    }),
    scene('sc3', 3, 1, 'EXT. SAN BLAS CEMETERY - DAY', 'relationship', (add) => {
      add('scene_heading', 'EXT. SAN BLAS CEMETERY - DAY');
      add('action', 'Fresh earth. Marisol stands beside LUPITA (16), her niece, all elbows and eyeliner. The crowd thins around them.');
      add('character', 'LUPITA');
      add('dialogue', 'Everybody keeps saying he died of a tired heart. Nadie se muere de eso, tía. Nobody just gets tired.');
      add('character', 'MARISOL');
      add('dialogue', 'Some men do. This town helps.');
      add('action', 'Beyond the low wall, a rented backhoe waits with its engine running. The operator checks his phone. The mourners drift toward their trucks.');
      add('character', 'LUPITA');
      add('dialogue', 'Is it true you audit narcos in the city?');
      add('character', 'MARISOL');
      add('dialogue', 'Banks. Which is narcos with better lawyers.');
      add('action', 'Raúl arrives, sets a warm hand on Marisol’s shoulder. She doesn’t turn.');
      add('character', 'RAÚL');
      add('dialogue', 'Come by the office tomorrow, mija. Family should not talk business over a grave.');
      add('action', 'He goes. Lupita watches Marisol watch him. The backhoe drops into gear.');
    }),
    scene('sc4', 4, 1, 'INT. AGUAS DEL VALLE - RAÚL’S OFFICE - DAY', 'plot', (add) => {
      add('scene_heading', 'INT. AGUAS DEL VALLE - RAÚL’S OFFICE - DAY');
      add('action', 'A water company office pretending to be modest. RAÚL REYES (60), Marisol’s uncle, linen shirt, slides a folder across the desk. A check clipped to the front.');
      add('character', 'RAÚL');
      add('dialogue', 'Your father’s share of the concession. I’m offering double what it’s worth, mija. Sign it, go back to your life.');
      add('character', 'MARISOL');
      add('parenthetical', '(not touching the folder)');
      add('dialogue', 'Double. For dirt with no water under it?');
      add('action', 'Raúl leans back. On the wall behind him: sixty years of framed photographs. Canals full. Cotton high. Men shaking hands.');
      add('character', 'RAÚL');
      add('dialogue', 'This valley was dying before you were born. Your grandfather knew it. Your father pretended not to. Somebody had to keep the water moving where it still grows something. That somebody eats last and gets blamed first. I have kept this family fed for forty years.');
      add('character', 'MARISOL');
      add('dialogue', 'Then the books will show exactly that, tío. Feeding.');
      add('action', 'A long moment. The air conditioner hums like a held breath. Raúl smiles, unclips the check, and puts it in his shirt pocket.');
      add('character', 'RAÚL');
      add('dialogue', 'Your father also thought he was an accountant first and a Reyes second. Ask Carmen how that ended.');
      add('transition', 'CUT TO:');
    }),
    scene('sc5', 5, 2, 'INT. EL CAMINO MOTEL - ROOM 7 - NIGHT', 'plot', (add) => {
      add('scene_heading', 'INT. EL CAMINO MOTEL - ROOM 7 - NIGHT');
      add('action', 'Ledger pages spread across a sagging bed. Marisol works a calculator, sticky notes climbing the headboard like ivy. She circles one column twice.');
      add('character', 'MARISOL');
      add('parenthetical', '(quiet)');
      add('dialogue', 'Forty thousand cubic meters. Every dry season. Where are you going?');
      add('action', 'She tapes ledger pages to the mirror in a grid, connects entries with eyeliner pencil. A pattern forms: the same initials beside the same canal, year after year. EL P.');
      add('character', 'MARISOL');
      add('parenthetical', '(into phone)');
      add('dialogue', 'I need two more weeks. Unpaid, fine. Family matter. No — a numbers matter. With my family attached.');
      add('action', 'She hangs up. Looks at the mirror: her own face behind the taped arithmetic, divided into columns. She circles one entry so hard the pencil snaps. CANAL SIETE — 40,000 M3 — EL PATRÓN.');
    }),
    scene('sc6', 6, 2, 'EXT. CANAL SIETE - DAWN', 'opposition', (add) => {
      add('scene_heading', 'EXT. CANAL SIETE - DAWN');
      add('action', 'A concrete canal, bone dry. FARMERS wait beside empty pipes. CHUY ORTEGA (50s), Aguas del Valle foreman, padlocks the head gate under their stares.');
      add('character', 'CHUY');
      add('dialogue', 'Allotments changed. Take it up with the office.');
      add('character', 'MARISOL');
      add('dialogue', 'I am the office now, Chuy. Twelve percent of it.');
      add('action', 'The oldest farmer, DON ESTEBAN (80), doesn’t raise his voice. He doesn’t have to. The others go still to hear him.');
      add('character', 'DON ESTEBAN');
      add('dialogue', 'Your father walked this canal every Friday of his life, señora. He wrote in his little book and the water came. He stopped walking in March. You do the mathematics.');
      add('character', 'MARISOL');
      add('dialogue', 'Who changed the allotments, Chuy? A name.');
      add('character', 'CHUY');
      add('parenthetical', '(clicking the padlock shut)');
      add('dialogue', 'Paper changes. Water obeys. That is all I know since March.');
      add('action', 'He walks away down the dry bed, boots loud on the cracked concrete. The farmers watch Marisol now. All of them.');
    }),
    scene('sc14', 7, 2, 'EXT. EJIDO SAN BLAS - WELL FIELD - DAY', 'opposition', (add) => {
      add('scene_heading', 'EXT. EJIDO SAN BLAS - WELL FIELD - DAY');
      add('action', 'A municipal water tanker, mobbed politely. Families queue with every container they own: drums, buckets, a pink piñata bucket. A MUNICIPAL DEPUTY manages the line with a clipboard he never writes on.');
      add('action', 'Fifty meters off, a drilling rig grinds into the earth and coughs up nothing but pale dust. Lupita, phone out, films the rig, the line, the deputy.');
      add('character', 'DEPUTY');
      add('dialogue', 'No filming, señorita. Municipal operation.');
      add('character', 'LUPITA');
      add('dialogue', 'It’s a public well. On public land. With public nothing coming out of it.');
      add('action', 'Marisol arrives on foot, takes in the line, the rig, her niece already in the deputy’s face. The WELL FOREMAN (40s), dust to the eyebrows, kills the rig motor.');
      add('character', 'MARISOL');
      add('dialogue', 'How deep are you?');
      add('character', 'WELL FOREMAN');
      add('dialogue', 'Ninety meters. Two years ago this field hit water at sixty. The aquifer is not dropping, señora. It is being spent. Somewhere it is coming out of a pipe with pressure behind it. Not here.');
      add('action', 'Down the line, the piñata bucket reaches the tanker. The kid holding it gets it half filled. The deputy finally writes something: the time.');
    }),
    scene('sc7', 8, 2, 'INT. MUNICIPAL ARCHIVE - DAY', 'plot', (add) => {
      add('scene_heading', 'INT. MUNICIPAL ARCHIVE - DAY');
      add('action', 'Rolling shelves of yellowed folios. A CLERK unrolls the 1962 concession map. Marisol traces the canal lines — and stops at a ragged edge where a page has been razored out.');
      add('character', 'MARISOL');
      add('dialogue', 'Who checked this volume out last?');
      add('character', 'CLERK');
      add('parenthetical', '(already regretting it)');
      add('dialogue', 'Señora... I like this job.');
      add('action', 'She waits. The clerk glances at the door, then rolls the map tighter, voice dropping under the ceiling fan.');
      add('character', 'CLERK');
      add('dialogue', 'The volume was whole in March. I know because the survey team for the new bottling permit used it. Ask instead who commissioned that survey. Ask what the permit annexes say.');
      add('action', 'He slides a photocopy across the desk, stamped: AGUAS DEL VALLE — SOLICITUD — ANEXO B. Marisol reads. Her jaw sets.');
      add('character', 'MARISOL');
      add('dialogue', 'Thank you. This job — you should keep liking it. Loudly. Where people can hear you.');
    }),
    scene('sc13', 9, 2, 'INT. MUNICIPAL ARCHIVE - DAY (LATER THAT WEEK)', 'opposition', (add) => {
      add('scene_heading', 'INT. MUNICIPAL ARCHIVE - DAY (LATER THAT WEEK)');
      add('action', 'A new padlock on the archive door. The Clerk stands outside it with a cardboard box of his things: a mug, a desk fan, a framed diploma. A bus idles at the corner.');
      add('character', 'CLERK');
      add('dialogue', 'Transferred. Hermosillo. Effective yesterday, which is a very fast kind of paperwork for this municipio.');
      add('character', 'MARISOL');
      add('dialogue', 'I’m sorry. I did this.');
      add('character', 'CLERK');
      add('parenthetical', '(handing her the desk fan)');
      add('dialogue', 'Don’t be sorry. Be fast. Anexo B has a twin brother. Anexo C. Volumes, buyer, price per cubic meter. It never touched this archive. He keeps it where he keeps the check he almost gave you.');
      add('action', 'He boards the bus with his box. It pulls away past the town fountain — dry, of course. Marisol stands holding a stranger’s desk fan in the heat.');
    }),
    scene('sc8', 10, 2, 'EXT. REYES FAMILY HOUSE - PORCH - NIGHT', 'relationship', (add) => {
      add('scene_heading', 'EXT. REYES FAMILY HOUSE - PORCH - NIGHT');
      add('action', 'Crickets. Marisol and Lupita share a blanket and a bag of chamoy peanuts.');
      add('character', 'LUPITA');
      add('dialogue', 'When I stay at Ceci’s I hear trucks on the old ranch road. Two, three in the morning. Water trucks, tía. In a drought.');
      add('character', 'MARISOL');
      add('parenthetical', '(a long beat)');
      add('dialogue', 'You never told anyone that.');
      add('character', 'LUPITA');
      add('dialogue', 'You never asked.');
      add('action', 'Headlights sweep the porch — a truck passing on the far road, big engine under load. They both track it until the dark takes it back.');
      add('character', 'LUPITA');
      add('dialogue', 'That’s the third one tonight. I count them like sheep now.');
      add('action', 'Marisol checks her watch: 2:41 AM. She takes Lupita’s eyeliner from the peanut bag and writes a plate number on the inside of her own wrist.');
    }),
    scene('sc9', 11, 2, 'INT. EL CAMINO MOTEL - ROOM 7 - NIGHT', 'opposition', (add) => {
      add('scene_heading', 'INT. EL CAMINO MOTEL - ROOM 7 - NIGHT');
      add('action', 'The door hangs open. The room is gutted — mattress flipped, sticky notes gone, ledger pages fanned across the floor like shot birds. Headlights sweep the window. Raúl’s pickup idles outside, then rolls away, unhurried.');
      add('character', 'MARISOL');
      add('parenthetical', '(into the dark)');
      add('dialogue', 'Okay, tío. Now I know it’s real.');
      add('action', 'She rights the mattress. Under it, cracked underfoot by whoever searched: a small framed photo of her father at the canal gate, forty years younger, laughing.');
      add('action', 'Her hands stop shaking. They start folding, stacking, packing instead — fast and neat, an auditor closing a site. The ledger pages go back in order. All but one. She holds up a page the searchers stepped on and missed: the eyeliner grid from the mirror, folded small.');
    }),
    scene('sc15', 12, 2, 'EXT. SAN BLAS - PLAZA PRINCIPAL - DAY', 'opposition', (add) => {
      add('scene_heading', 'EXT. SAN BLAS - PLAZA PRINCIPAL - DAY');
      add('action', 'Banners across the kiosk: AGUAS DEL VALLE — 60 AÑOS SIRVIENDO A SAN BLAS. The plaza loudspeakers crackle with a live radio remote. Raúl’s voice pours out warm as syrup over the dry fountain.');
      add('character', 'RAÚL');
      add('parenthetical', '(over speakers)');
      add('dialogue', 'This Friday, the Reyes family answers the drought the way we always have — with works, not words. A community water trust. Free tanker service for every colonia, twice a week, starting now, paid from my own pocket.');
      add('action', 'Scattered applause from the shade. In a parked car at the plaza’s edge, Marisol listens, knuckles white on the wheel.');
      add('character', 'RAÚL');
      add('parenthetical', '(over speakers)');
      add('dialogue', 'And if you hear wild stories these days — forgive them. My brother’s daughter came home to bury her father. Grief does strange arithmetic, friends. In this family we answer it with love. And with water.');
      add('action', 'Laughter, applause. Marisol looks down at the plate number inked on her wrist, faded to a bruise-blue smear but legible. She starts the engine.');
      add('character', 'MARISOL');
      add('parenthetical', '(to the radio)');
      add('dialogue', 'Then let’s do arithmetic, tío.');
    }),
    scene('sc10', 13, 3, 'EXT. OLD RANCH ROAD - WATER DEPOT - NIGHT', 'plot', (add) => {
      add('scene_heading', 'EXT. OLD RANCH ROAD - WATER DEPOT - NIGHT');
      add('action', 'Tanker trucks nose up to an unmarked standpipe like calves to a trough. From the ditch, Marisol films on her phone. A hand lands on her shoulder — CHUY. She freezes. He looks at the trucks, then at her. He angles his flashlight down, giving her the dark.');
      add('character', 'CHUY');
      add('parenthetical', '(low)');
      add('dialogue', 'My brother farms off Canal Siete. Film the plates.');
      add('action', 'She films. In frame: a tanker’s plate — RV-04-771 — the number on her wrist. The standpipe valve opens with a groan and somewhere under their feet the aquifer leaves home.');
      add('character', 'MARISOL');
      add('parenthetical', '(whispering)');
      add('dialogue', 'Where does it cross? There’s a buyer. Anexo C has the buyer.');
      add('character', 'CHUY');
      add('dialogue', 'Friday. The trust tankers roll the same night these do. One kind of truck for the radio. One kind for the border. Same water. He is generous with what is not his.');
      add('action', 'Chuy reaches into his jacket. A folded paper, soft from being carried a long time. He doesn’t hand it over. Not yet.');
      add('character', 'CHUY');
      add('dialogue', 'He trusted me to burn the office copies in March. I burned paper. Not this paper. You walk it in front of everyone, señora — or you give it back and we never stood here.');
      add('action', 'She takes it. ANEXO C. Volumes. Price per cubic meter. And a buyer’s signature line she reads twice.');
    }),
    scene('sc11', 14, 3, 'INT. TOWN HALL - EJIDO ASSEMBLY - NIGHT', 'resolution', (add) => {
      add('scene_heading', 'INT. TOWN HALL - EJIDO ASSEMBLY - NIGHT');
      add('action', 'Packed hall. Raúl at the microphone, mid-reassurance. Marisol walks the center aisle and lays the ledger — flour dust and all — on the table, her phone on top, video queued.');
      add('character', 'MARISOL');
      add('dialogue', 'My father counted every liter you stole. I finished his math.');
      add('action', 'The hall erupts. Raúl reaches for the ledger. A dozen phones rise, recording. He stops.');
      add('character', 'RAÚL');
      add('parenthetical', '(to the hall, smiling)');
      add('dialogue', 'Friends. Grief is standing at a microphone. What you are looking at is a sad woman with her father’s scribbles. San Blas knows me. Sixty years, San Blas knows this family.');
      add('action', 'Marisol presses play. The speakers carry the depot: water roaring into tankers in the dark, the plate RV-04-771 filling the projection wall. The roar of the hall dies to nothing. Just the recorded water, pouring and pouring.');
      add('character', 'MARISOL');
      add('dialogue', 'Anexo C. Forty thousand cubic meters a season, priced per cubic meter, signed for the buyer with your own pen, tío. The trust tankers and the border tankers drink from the same pipe. San Blas is the pipe.');
      add('action', 'She unfolds Chuy’s paper and lays it beside the ledger. The EJIDO PRESIDENT looks at Raúl. Raúl looks at the paper. For the first time all night, he has no arithmetic. The president reaches for the gavel like a man reaching for high ground.');
      add('transition', 'CUT TO:');
    }),
    scene('sc16', 15, 3, 'EXT. REYES FAMILY HOUSE - PORCH - NIGHT', 'relationship', (add) => {
      add('scene_heading', 'EXT. REYES FAMILY HOUSE - PORCH - NIGHT');
      add('action', 'Later. The house behind them finally quiet. Lupita’s phone will not stop buzzing on the step like a beetle on its back.');
      add('character', 'LUPITA');
      add('dialogue', 'Forty thousand views, tía. A reporter from the capital wants the video. Two reporters. Ceci says we’re trending in Hermosillo.');
      add('character', 'MARISOL');
      add('dialogue', 'Views don’t refill an aquifer.');
      add('character', 'LUPITA');
      add('dialogue', 'No. But now everybody watches the water. Todos, tía. That’s what your numbers needed. Witnesses.');
      add('action', 'Far off on the highway, a truck engine. They both look up, trained now. It passes, ordinary, headed somewhere with nothing to hide. They breathe. The crickets take the night back.');
    }),
    scene('sc12', 16, 3, 'EXT. REYES FAMILY HOUSE - DAWN', 'resolution', (add) => {
      add('scene_heading', 'EXT. REYES FAMILY HOUSE - DAWN');
      add('action', 'First light. Marisol pries the boards off her father’s office window. Inside: his desk, his chair, his adding machine. Lupita appears with two cups of coffee, hands her one.');
      add('character', 'LUPITA');
      add('dialogue', 'So you’re staying.');
      add('character', 'MARISOL');
      add('parenthetical', '(looking at the desk)');
      add('dialogue', 'Somebody has to keep score.');
      add('action', 'She sets the ledger on the desk and opens it to the first blank page her father never filled. Uncaps his pen. Lupita drags a second chair to the desk’s far side and sits like she means to be there a long time. Beyond the window, the sun clears the ridge and lays a stripe of light across the empty column where the water goes next.');
    }),
  ],
};

export const sampleConnections: Connection[] = [
  { id: 'c1', fromSceneId: 'sc2', toSceneId: 'sc11', kind: 'setup_payoff', label: 'Ledger set-up pays off at the assembly' },
  { id: 'c2', fromSceneId: 'sc5', toSceneId: 'sc9', kind: 'escalation', label: 'Audit discovery escalates to the ransacked room' },
  { id: 'c3', fromSceneId: 'sc3', toSceneId: 'sc8', kind: 'relationship', label: 'Marisol and Lupita learn to ask' },
  { id: 'c4', fromSceneId: 'sc8', toSceneId: 'sc10', kind: 'setup_payoff', label: 'Night trucks rumor pays off at the depot' },
  { id: 'c5', fromSceneId: 'sc9', toSceneId: 'sc11', kind: 'escalation', label: 'Low point forces the assembly gamble' },
  { id: 'c6', fromSceneId: 'sc13', toSceneId: 'sc11', kind: 'setup_payoff', label: 'Anexo C travels from the archive to the assembly' },
  { id: 'c7', fromSceneId: 'sc15', toSceneId: 'sc11', kind: 'escalation', label: 'The radio smear raises the cost of going public' },
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
  {
    id: 'ev11',
    source: 'reader',
    claimType: 'reader_reaction',
    status: 'uncertain',
    summary: 'The radio remote plays fully in Raúl’s favor; one dissenting voice in the plaza would keep the town from feeling naive.',
    sceneId: 'sc15',
    elementId: 'sc15-e9',
    readerName: 'Ana P.',
  },
  {
    id: 'ev12',
    source: 'writer',
    claimType: 'textual_fact',
    status: 'clear',
    summary: 'Anexo C is named and located here, one act before it is produced at the assembly.',
    sceneId: 'sc13',
    elementId: 'sc13-e9',
  },
];
