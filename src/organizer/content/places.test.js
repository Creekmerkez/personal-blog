import { describe, it, expect } from 'vitest';
import { mapsUrl, PLACE_GROUPS, PLACES } from './places';

describe('built-in places', () => {
  it('every place is complete: id, emoji, name, area, known group, description', () => {
    const groups = new Set(PLACE_GROUPS.map((g) => g.id));
    for (const place of PLACES) {
      expect(place.id, JSON.stringify(place)).toMatch(/^[a-z0-9-]+$/);
      expect(place.emoji).toBeTruthy();
      expect(place.name).toBeTruthy();
      expect(place.area).toBeTruthy();
      expect(groups.has(place.group), place.id).toBe(true);
      expect(place.what).toBeTruthy();
      if (place.site) expect(place.site).toMatch(/^https:\/\//);
    }
  });

  it('ids are unique and every group has places (negative)', () => {
    expect(new Set(PLACES.map((p) => p.id)).size).toBe(PLACES.length);
    for (const group of PLACE_GROUPS) expect(PLACES.some((p) => p.group === group.id), group.id).toBe(true);
  });

  it('builds a Google Maps search link from the name and area', () => {
    expect(mapsUrl({ name: 'Zoo Praha', area: 'Praha 7 – Troja' })).toBe('https://www.google.com/maps/search/?api=1&query=Zoo%20Praha%2C%20Praha%207%20%E2%80%93%20Troja');
    expect(mapsUrl({ name: 'Maj', area: '?' })).toBe('https://www.google.com/maps/search/?api=1&query=Maj%2C%20');
  });
});
