// Keep shared prefecture boundaries identical while removing coastline noise.
// npm install && npm run build:map
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { topology } from 'topojson-server';
import { presimplify, simplify } from 'topojson-simplify';
import { feature } from 'topojson-client';

const source = JSON.parse(await readFile(new URL('../gadm41_JPN_1.json', import.meta.url)));
// Effective triangle area in square degrees. This removes sub-pixel detail at
// the map's 1000-unit viewBox size without altering major bays or peninsulas.
const MIN_TRIANGLE_AREA = 0.0001;
const weighted = presimplify(topology({ prefectures: source }, 100000));
const result = feature(simplify(weighted, MIN_TRIANGLE_AREA), weighted.objects.prefectures);
await mkdir(new URL('../data/', import.meta.url), { recursive: true });
await writeFile(new URL('../data/japan-map.json', import.meta.url), JSON.stringify(result, (key, value) => typeof value === 'number' ? Math.round(value * 1e6) / 1e6 : value));

function countPoints(value) {
    if (!Array.isArray(value)) return 0;
    return typeof value[0] === 'number' ? 1 : value.reduce((total, item) => total + countPoints(item), 0);
}
const count = collection => collection.features.reduce((total, item) => total + countPoints(item.geometry.coordinates), 0);
console.log(`Map: ${result.features.length} prefectures; ${count(source)} → ${count(result)} points.`);
