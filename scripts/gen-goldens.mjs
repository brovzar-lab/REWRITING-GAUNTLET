// Regenerates the golden pagination fixtures. Run only after intentionally
// changing the engine or the fixtures, then hand-review the JSON diff:
//   node scripts/gen-goldens.mjs
import { writeFileSync } from 'node:fs';
import { createServer } from 'vite';

const vite = await createServer({ server: { middlewareMode: true }, optimizeDeps: { noDiscovery: true } });
const fp = await vite.ssrLoadModule('/src/pagination/fingerprint.ts');
const sample = await vite.ssrLoadModule('/src/model/sample/gauntlet-sample.ts');

writeFileSync(
  'src/pagination/fixtures/rules-golden.json',
  JSON.stringify(fp.fingerprint(fp.rulesGoldenScreenplay()), null, 2) + '\n',
);
writeFileSync(
  'src/pagination/fixtures/las-garzas-golden.json',
  JSON.stringify(fp.fingerprint(sample.sampleScreenplay), null, 2) + '\n',
);
await vite.close();
console.log('goldens written');
