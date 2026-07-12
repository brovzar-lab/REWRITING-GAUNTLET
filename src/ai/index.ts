import { localAnalyzer } from './localAnalyzer';
import { createCloudProvider } from './adapters/cloud';
import { keyStore } from './keyStore';
import type { AIProvider } from './provider';

export type { AIProvider, DiagnoseRequest } from './provider';
export { localAnalyzer } from './localAnalyzer';
export { keyStore } from './keyStore';

/** Pick the provider for a diagnosis run. The local analyzer is the default;
    the cloud provider only ever runs with explicit consent AND a stored key. */
export function resolveProvider(cloudConsent: boolean): AIProvider {
  const apiKey = keyStore.get();
  if (cloudConsent && apiKey) return createCloudProvider({ apiKey });
  return localAnalyzer;
}
