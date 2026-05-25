import { useIsMobile } from './use-is-mobile';

export function useSheetPlacement(desktop: 'right' | 'left' = 'right') {
  const isMobile = useIsMobile();
  return isMobile ? 'bottom' : desktop;
}
