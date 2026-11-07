import { useEffect, useState } from 'react';

export function useRoute(): string[] {
  const parse = () => (location.hash.replace(/^#\/?/, '') || 'today').split('/').map(decodeURIComponent);
  const [route, setRoute] = useState(parse);
  useEffect(() => {
    const on = () => { setRoute(parse()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export const go = (path: string) => { location.hash = '#/' + path; };
