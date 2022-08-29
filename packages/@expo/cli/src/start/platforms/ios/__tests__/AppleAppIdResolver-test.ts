import { getConfig } from '@expo/config';
import { IOSConfig } from '@expo/config-plugins';
import { vol } from 'memfs';

import { asMock } from '../../../../__tests__/asMock';
import { AppleAppIdResolver } from '../AppleAppIdResolver';

jest.mock('@expo/config-plugins', () => ({
  IOSConfig: {
    BundleIdentifier: {
      getBundleIdentifierFromPbxproj: jest.fn(),
    },
  },
}));

jest.mock('@expo/config', () => ({
  getConfig: jest.fn(() => ({
    pkg: {},
    exp: {
      sdkVersion: '45.0.0',
      name: 'my-app',
      slug: 'my-app',
    },
  })),
}));

// Most cases are tested in the superclass.

describe('hasNativeProjectAsync', () => {
  beforeEach(() => {
    vol.reset();
  });

  it(`returns true when the AppDelegate file exists`, async () => {
    vol.fromJSON(
      {
        '/ios/HelloWorld/AppDelegate.mm': '...',
      },
      '/'
    );

    const resolver = new AppleAppIdResolver('/');
    expect(await resolver.hasNativeProjectAsync()).toBe(true);
  });
  it(`returns false when the AppDelegate getter throws`, async () => {
    vol.fromJSON({}, '/');

    const resolver = new AppleAppIdResolver('/');
    expect(await resolver.hasNativeProjectAsync()).toBe(false);
  });
});

describe('getAppIdAsync', () => {
  it('resolves the app id from native files', async () => {
    const resolver = new AppleAppIdResolver('/');
    resolver.hasNativeProjectAsync = jest.fn(async () => true);
    resolver.getAppIdFromNativeAsync = jest.fn(resolver.getAppIdFromNativeAsync);
    asMock(IOSConfig.BundleIdentifier.getBundleIdentifierFromPbxproj).mockReturnValueOnce(
      'dev.bacon.myapp'
    );
    expect(await resolver.getAppIdAsync()).toBe('dev.bacon.myapp');
    expect(resolver.getAppIdFromNativeAsync).toBeCalledTimes(1);
    expect(resolver.hasNativeProjectAsync).toBeCalledTimes(1);
  });

  it('resolves the app id from project config', async () => {
    const resolver = new AppleAppIdResolver('/');
    resolver.hasNativeProjectAsync = jest.fn(async () => false);
    resolver.getAppIdFromConfigAsync = jest.fn(resolver.getAppIdFromConfigAsync);
    asMock(getConfig).mockReturnValueOnce({
      exp: {
        ios: {
          bundleIdentifier: 'dev.bacon.myapp',
        },
      },
    } as any);
    expect(await resolver.getAppIdAsync()).toBe('dev.bacon.myapp');
    expect(resolver.getAppIdFromConfigAsync).toBeCalledTimes(1);
    expect(resolver.hasNativeProjectAsync).toBeCalledTimes(1);
  });
});
