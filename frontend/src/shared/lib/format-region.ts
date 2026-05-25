export function formatRegion(region: string | null | undefined, allLabel = 'Все регионы') {
  return region ?? allLabel;
}
