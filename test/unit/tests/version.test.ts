import { getAppVersion } from '../../../src/utils/version.js';

describe('getAppVersion', () => {
  it('should return version string from package.json', async () => {
    const version = await getAppVersion();

    // The version should be a valid semver string
    expect(version).toMatch(/^\d+\.\d+\.\d+/);
    expect(typeof version).toBe('string');
    expect(version.length).toBeGreaterThan(0);
  });

  it('should handle async file reading', async () => {
    // Test that the function is properly async
    const versionPromise = getAppVersion();
    expect(versionPromise).toBeInstanceOf(Promise);

    const version = await versionPromise;
    expect(typeof version).toBe('string');
  });

  it('should return consistent version on multiple calls', async () => {
    const version1 = await getAppVersion();
    const version2 = await getAppVersion();

    expect(version1).toBe(version2);
  });
});
