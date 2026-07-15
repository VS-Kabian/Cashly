import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), 'utf8');
}

test('maintenance content is rendered as readable plain text instead of active HTML', async () => {
  const [maintenanceMode, adminSettings] = await Promise.all([
    source('src/components/MaintenanceMode.tsx'),
    source('src/pages/admin/AdminSettings.tsx'),
  ]);

  for (const component of [maintenanceMode, adminSettings]) {
    assert.doesNotMatch(component, /dangerouslySetInnerHTML/);
    assert.doesNotMatch(component, /DOMPurify/);
    assert.match(component, /whitespace-pre-line/);
  }

  assert.doesNotMatch(adminSettings, /HTML\/CSS Supported/);
  assert.doesNotMatch(adminSettings, /inline CSS|style="|onerror=/i);
});
