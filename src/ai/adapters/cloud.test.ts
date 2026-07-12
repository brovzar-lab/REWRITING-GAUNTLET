import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCloudProvider } from './cloud';
import { EPPS_PASSES } from '../../model/passes';
import type { DiagnoseRequest } from '../provider';
import type { Screenplay } from '../../model/screenplay';

const screenplay: Screenplay = {
  id: 'cx',
  title: 'CLOUD FIXTURE',
  draftLabel: 'Test',
  scenes: [
    {
      id: 'cx-s1',
      number: 1,
      act: 1,
      slug: 'INT. OFFICE - DAY',
      storyFunction: 'plot',
      elements: [
        { id: 'cx-s1-e1', type: 'scene_heading', text: 'INT. OFFICE - DAY' },
        { id: 'cx-s1-e2', type: 'action', text: 'A desk. A dying plant.' },
      ],
    },
  ],
};

function req(): DiagnoseRequest {
  return {
    screenplay,
    connections: [],
    pass: EPPS_PASSES.find((p) => p.id === 'scene')!,
    passRunId: 'run-cloud',
    now: 1700000000000,
  };
}

function apiResponse(findings: unknown, wrap = (s: string) => s) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ content: [{ type: 'text', text: wrap(JSON.stringify(findings)) }] }),
  } as Response;
}

const VALID = [
  {
    summary: 'The office scene may start too early.',
    status: 'uncertain',
    citations: [{ sceneId: 'cx-s1', elementId: 'cx-s1-e2' }],
    proposal: {
      sceneId: 'cx-s1',
      elementId: 'cx-s1-e2',
      newText: 'A dying plant on an empty desk.',
      rationale: 'Enter on the image that matters.',
    },
  },
];

describe('cloud adapter', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('calls the API with the key, version, and direct-browser-access headers', async () => {
    const fetchFn = vi.fn(async () => apiResponse(VALID));
    const provider = createCloudProvider({ apiKey: 'sk-test-123', fetchFn });
    await provider.diagnose(req());
    expect(fetchFn).toHaveBeenCalledTimes(1);
    const [url, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toMatch(/^https:\/\/api\./);
    const headers = init.headers as Record<string, string>;
    expect(headers['x-api-key']).toBe('sk-test-123');
    expect(headers['anthropic-dangerous-direct-browser-access']).toBe('true');
    expect(headers['anthropic-version']).toBeTruthy();
    const body = JSON.parse(String(init.body));
    expect(body.model).toBe('claude-sonnet-5');
    // The screenplay text goes with the request — that is exactly what consent discloses.
    expect(JSON.stringify(body)).toContain('A desk. A dying plant.');
  });

  it('maps a valid response to findings, taking oldText from the document itself', async () => {
    const provider = createCloudProvider({ apiKey: 'k', fetchFn: vi.fn(async () => apiResponse(VALID)) });
    const findings = await provider.diagnose(req());
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      provider: 'cloud',
      claimType: 'ai_hypothesis',
      resolution: 'open',
      passId: 'scene',
      status: 'uncertain',
    });
    expect(findings[0].proposal!.oldText).toBe('A desk. A dying plant.');
    expect(findings[0].proposal!.newText).toBe('A dying plant on an empty desk.');
  });

  it('tolerates code-fenced JSON', async () => {
    const provider = createCloudProvider({
      apiKey: 'k',
      fetchFn: vi.fn(async () => apiResponse(VALID, (s) => '```json\n' + s + '\n```')),
    });
    expect(await provider.diagnose(req())).toHaveLength(1);
  });

  it('drops findings whose citations do not resolve to real elements', async () => {
    const bogus = [
      { summary: 'Ghost citation.', status: 'uncertain', citations: [{ sceneId: 'nope', elementId: 'nope-e1' }] },
      { summary: 'No citations at all.', status: 'clear', citations: [] },
      ...VALID,
    ];
    const provider = createCloudProvider({ apiKey: 'k', fetchFn: vi.fn(async () => apiResponse(bogus)) });
    const findings = await provider.diagnose(req());
    expect(findings).toHaveLength(1);
    expect(findings[0].summary).toBe('The office scene may start too early.');
  });

  it('drops a proposal that targets an uncited element but keeps the finding', async () => {
    const sneaky = [
      {
        summary: 'Valid citation, rogue proposal.',
        status: 'uncertain',
        citations: [{ sceneId: 'cx-s1', elementId: 'cx-s1-e1' }],
        proposal: { sceneId: 'cx-s1', elementId: 'cx-s1-e2', newText: 'HACKED', rationale: 'no' },
      },
    ];
    const provider = createCloudProvider({ apiKey: 'k', fetchFn: vi.fn(async () => apiResponse(sneaky)) });
    const findings = await provider.diagnose(req());
    expect(findings).toHaveLength(1);
    expect(findings[0].proposal).toBeUndefined();
  });

  it('throws a readable error when the API refuses', async () => {
    const provider = createCloudProvider({
      apiKey: 'bad',
      fetchFn: vi.fn(async () => ({ ok: false, status: 401, json: async () => ({}) }) as Response),
    });
    await expect(provider.diagnose(req())).rejects.toThrow(/401/);
  });
});
