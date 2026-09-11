import { useEffect, useState } from 'react';

export type TabName = 'today' | 'week' | 'progress' | 'schedule' | 'profile';

export type Route =
  { name: TabName } | { name: 'protocol'; blockId: string } | { name: 'focus'; blockId: string };

const TABS: TabName[] = ['today', 'week', 'progress', 'schedule', 'profile'];

export function toPath(route: Route): string {
  if (route.name === 'protocol' || route.name === 'focus') {
    return `#/${route.name}/${route.blockId}`;
  }
  return `#/${route.name}`;
}

export function parseRoute(hash: string): Route {
  const [head, param] = hash.replace(/^#\/?/, '').split('/');
  if (head === 'protocol' && param) return { name: 'protocol', blockId: decodeURIComponent(param) };
  if (head === 'focus' && param) return { name: 'focus', blockId: decodeURIComponent(param) };
  const tab = TABS.find((name) => name === head);
  return { name: tab ?? 'today' };
}

export function navigate(route: Route): void {
  window.location.hash = toPath(route);
}

export function goBack(): void {
  window.history.back();
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash));

  useEffect(() => {
    const onChange = (): void => setRoute(parseRoute(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  return route;
}
