import { test, expect } from './setup';

const pageUrl = 'http://127.0.0.1:8000/tests/fixtures/mercator.html';

test('renders grid: zl: 0', async ({ page, mapController }) => {
  const controller = () => mapController('mainMap');
  await page.goto(pageUrl);
  
  await controller().setView({ zoom: 0, center: [0, 0] });
  await controller().waitToMapLoaded();

  await expect(page).toHaveScreenshot();
});

test('renders grid: zl: 10', async ({ page, mapController }) => {
  const controller = () => mapController('mainMap');
  await page.goto(pageUrl);
  
  await controller().setView({ zoom: 10, center: [0, 0] });
  await controller().waitToMapLoaded();

  await expect(page).toHaveScreenshot();
});