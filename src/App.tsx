import { useEffect } from 'react';
import { useRoute } from './lib/router';
import { Shell } from './components/Shell';
import { Today } from './pages/Today';
import { Roadmap } from './pages/Roadmap';
import { LessonPage } from './pages/Lesson';
import { ProblemList, ProblemPage } from './pages/Problems';
import { ConsolePage } from './pages/Console';
import { DrillPage } from './pages/Drill';
import { MockPage } from './pages/Mock';
import { StoriesPage } from './pages/Stories';
import { SettingsPage } from './pages/Settings';
import { py } from './lib/py';

export default function App() {
  const [page, arg] = useRoute();
  useEffect(() => { py.warmUp(); }, []);
  let view;
  switch (page) {
    case 'roadmap': view = <Roadmap />; break;
    case 'lesson': view = <LessonPage key={arg} id={arg} />; break;
    case 'problems': view = <ProblemList />; break;
    case 'problem': view = <ProblemPage id={arg} />; break;
    case 'console': view = <ConsolePage />; break;
    case 'drill': view = <DrillPage />; break;
    case 'mock': view = <MockPage />; break;
    case 'stories': view = <StoriesPage />; break;
    case 'settings': view = <SettingsPage />; break;
    default: view = <Today />;
  }
  return <Shell route={page}>{view}</Shell>;
}
