import type { Node as PMNode } from 'prosemirror-model';
import { screenplaySchema } from './schema';
import type { ElementType, Scene, Screenplay } from '../model/screenplay';

/** Build a ProseMirror document from the canonical model. */
export function buildDoc(screenplay: Screenplay): PMNode {
  const blocks = screenplay.scenes.flatMap((scene) =>
    scene.elements.map((element) =>
      screenplaySchema.nodes[element.type].create(
        { elementId: element.id, sceneId: scene.id },
        element.text ? screenplaySchema.text(element.text) : null,
      ),
    ),
  );
  return screenplaySchema.nodes.doc.create(null, blocks);
}

/** Parse the ProseMirror document back into the canonical model.
    Scene metadata (act, story function, number) is carried over from the
    previous model by scene id; the slug follows the scene heading text. */
export function parseDoc(doc: PMNode, previous: Screenplay): Screenplay {
  const previousScenes = new Map(previous.scenes.map((s) => [s.id, s]));
  const scenes: Scene[] = [];
  let current: Scene | null = null;

  doc.forEach((node) => {
    const type = node.type.name as ElementType;
    const sceneId = node.attrs.sceneId as string;
    const elementId = node.attrs.elementId as string;
    if (!current || current.id !== sceneId) {
      const prev = previousScenes.get(sceneId);
      current = {
        id: sceneId,
        number: scenes.length + 1,
        act: prev?.act ?? 1,
        slug: prev?.slug ?? '',
        storyFunction: prev?.storyFunction ?? 'plot',
        elements: [],
      };
      scenes.push(current);
    }
    current.elements.push({ id: elementId, type, text: node.textContent });
    if (type === 'scene_heading') current.slug = node.textContent;
  });

  return { ...previous, scenes };
}
