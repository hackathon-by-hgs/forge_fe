/**
 * Toggles for the mock data layer. Read by the typed API client wrappers
 * (added in a later phase) and by direct consumers in development.
 *
 * In dev, a hidden `/dev/mock-controls` page or keyboard shortcut should flip
 * these without code changes.
 */
export interface MockConfig {
  artificialDelayMs: number;
  forceLoadingState: boolean;
  forceErrorState: boolean;
  forceEmptyState: boolean;
  forceOfflineState: boolean;
}

export const defaultMockConfig: MockConfig = {
  artificialDelayMs: 400,
  forceLoadingState: false,
  forceErrorState: false,
  forceEmptyState: false,
  forceOfflineState: false,
};

/** Mutable singleton. Write through `setMockConfig`, never reassign. */
const state: MockConfig = { ...defaultMockConfig };

export function getMockConfig(): Readonly<MockConfig> {
  return state;
}

export function setMockConfig(patch: Partial<MockConfig>): void {
  Object.assign(state, patch);
}

export function resetMockConfig(): void {
  Object.assign(state, defaultMockConfig);
}
