import { test as playwrightTest, mergeTests, expect as playwrightExpect, mergeExpects } from '@playwright/test';
import { test as mapGrabTest, expect as mapGrabExpect } from '@mapgrab/playwright';

export const test = mergeTests(playwrightTest, mapGrabTest);
export const expect = mergeExpects(playwrightExpect, mapGrabExpect);