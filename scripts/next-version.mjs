import { readFile, writeFile } from 'node:fs/promises';

const registryVersion = process.argv[2];
const releaseType = process.argv[3] || 'patch';

if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(registryVersion || '')) {
  throw new Error(`Invalid npm version: ${registryVersion || '(empty)'}`);
}
if (!['patch', 'minor', 'major'].includes(releaseType)) {
  throw new Error(`Invalid release type: ${releaseType}`);
}

const [major, minor, patch] = registryVersion.split('-')[0].split('.').map(Number);
const next =
  releaseType === 'major'
    ? `${major + 1}.0.0`
    : releaseType === 'minor'
      ? `${major}.${minor + 1}.0`
      : `${major}.${minor}.${patch + 1}`;

const packagePath = new URL('../package.json', import.meta.url);
const packageJson = JSON.parse(await readFile(packagePath, 'utf8'));
packageJson.version = next;
if (process.env.DRY_RUN !== 'true') {
  await writeFile(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);
}
process.stdout.write(next);
