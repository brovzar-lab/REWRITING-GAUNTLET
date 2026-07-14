/** Best-effort PDF text extraction, dependency-free. It reads text-based PDFs
    (the kind Final Draft and most tools export) by pulling the strings out of
    content streams. It cannot read scanned/image PDFs or exotic encodings, and
    it does not reconstruct indentation — so the result is fed to the ordinary
    screenplay parser and the UI is explicit that PDF import is best effort. */

/** Latin1 view so byte offsets and text offsets line up 1:1. */
function toBinaryString(bytes: Uint8Array): string {
  let s = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    s += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return s;
}

const OCTAL = /^[0-7]{1,3}/;

/** Unescape a PDF string literal body (already stripped of its outer parens). */
function decodePdfString(body: string): string {
  let out = '';
  for (let i = 0; i < body.length; i++) {
    if (body[i] !== '\\') {
      out += body[i];
      continue;
    }
    const next = body[i + 1];
    if (next === 'n') { out += '\n'; i++; }
    else if (next === 'r') { out += '\r'; i++; }
    else if (next === 't') { out += '\t'; i++; }
    else if (next === 'b') { out += '\b'; i++; }
    else if (next === 'f') { out += '\f'; i++; }
    else if (next === '(' || next === ')' || next === '\\') { out += next; i++; }
    else if (next === '\n') { i++; } // line continuation
    else {
      const m = body.slice(i + 1).match(OCTAL);
      if (m) {
        out += String.fromCharCode(parseInt(m[0], 8));
        i += m[0].length;
      } else {
        // Unknown escape: keep the next char literally.
        out += next ?? '';
        i++;
      }
    }
  }
  return out;
}

/** Pull visible text out of one decoded content stream. Each Tj, quote, or
    double-quote operator ends a line; TJ array parts join on one line; the
    Td, TD, T-star, and ET operators also break lines. */
function extractFromContent(content: string): string {
  const lines: string[] = [];
  let line = '';
  const flush = () => {
    if (line.trim().length) lines.push(line.replace(/\s+$/, ''));
    line = '';
  };

  for (let i = 0; i < content.length; ) {
    const c = content[i];
    if (c === '(') {
      let depth = 1;
      let j = i + 1;
      let buf = '';
      while (j < content.length && depth > 0) {
        const ch = content[j];
        if (ch === '\\') {
          buf += ch + (content[j + 1] ?? '');
          j += 2;
          continue;
        }
        if (ch === '(') depth++;
        else if (ch === ')') {
          depth--;
          if (depth === 0) {
            j++;
            break;
          }
        }
        buf += ch;
        j++;
      }
      line += decodePdfString(buf);
      i = j;
      continue;
    }
    // Line-breaking operators (word-boundary so we don't match inside names).
    if (
      content.startsWith('Tj', i) ||
      content.startsWith('Td', i) ||
      content.startsWith('TD', i) ||
      content.startsWith('T*', i) ||
      content.startsWith('ET', i)
    ) {
      flush();
      i += 2;
      continue;
    }
    if (c === "'" || c === '"') {
      flush();
      i++;
      continue;
    }
    i++;
  }
  flush();
  return lines.join('\n');
}

/** Inflate a zlib/deflate stream. Uses the platform DecompressionStream when
    present; returns null on any failure (best effort — skip that stream). */
async function inflate(bytes: Uint8Array): Promise<Uint8Array | null> {
  const DS = (globalThis as { DecompressionStream?: typeof DecompressionStream }).DecompressionStream;
  if (!DS) return null;
  for (const fmt of ['deflate', 'deflate-raw'] as const) {
    try {
      const stream = new Blob([bytes]).stream().pipeThrough(new DS(fmt));
      return new Uint8Array(await new Response(stream).arrayBuffer());
    } catch {
      /* try the next format */
    }
  }
  return null;
}

export async function extractPdfText(bytes: Uint8Array): Promise<string> {
  const bin = toBinaryString(bytes);
  const parts: string[] = [];
  let searchFrom = 0;

  while (true) {
    const streamAt = bin.indexOf('stream', searchFrom);
    if (streamAt === -1) break;
    const endAt = bin.indexOf('endstream', streamAt);
    if (endAt === -1) break;

    // Skip the EOL right after the `stream` keyword.
    let dataStart = streamAt + 'stream'.length;
    if (bin[dataStart] === '\r') dataStart++;
    if (bin[dataStart] === '\n') dataStart++;
    const raw = bin.slice(dataStart, endAt);
    searchFrom = endAt + 'endstream'.length;

    // Is this stream Flate-compressed? Look at the object dict just before it.
    const dict = bin.slice(Math.max(0, streamAt - 400), streamAt);
    let content = raw;
    if (/\/FlateDecode/.test(dict)) {
      const rawBytes = Uint8Array.from(raw, (ch) => ch.charCodeAt(0) & 0xff);
      const inflated = await inflate(rawBytes);
      if (!inflated) continue; // can't decode — skip, best effort
      content = toBinaryString(inflated);
    }
    if (!/\b(Tj|TJ)\b/.test(content)) continue; // not a text stream
    const text = extractFromContent(content);
    if (text.trim().length) parts.push(text);
  }

  return parts.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}
