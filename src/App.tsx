// App — top bar, navigation, and view switching for the Crochet Catalogue.
import { useEffect, useState } from 'react';
import { store } from './store';
import { ToastProvider } from './components/Toast';
import { Catalogue } from './components/Catalogue';
import { Categories } from './components/Categories';
import { ShareBuilder } from './components/ShareBuilder';
import { SettingsView } from './components/SettingsView';
import logoMark from './assets/logo-mark.svg';

type View = 'catalogue' | 'categories' | 'share' | 'settings';

const NAV: { view: View; label: string }[] = [
  { view: 'catalogue', label: 'Catalogue' },
  { view: 'categories', label: 'Categories' },
  { view: 'share', label: 'Create a Share' },
  { view: 'settings', label: 'Settings' },
];

function App() {
  const [view, setView] = useState<View>('catalogue');
  // Bump to force a remount of the current view (e.g. after a restore).
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    store.seedIfEmpty().catch((err) => console.error(err));
  }, []);

  function goCatalogue() {
    setReloadKey((k) => k + 1);
    setView('catalogue');
  }

  return (
    <ToastProvider>
      <div id="app">
        <header className="topbar">
          <div className="brand">
            <img className="brand-mark" src={logoMark} alt="" />
            <span className="brand-text">Charming Yarns</span>
          </div>
          <nav className="nav">
            {NAV.map((n) => (
              <button
                key={n.view}
                className={'nav-btn' + (view === n.view ? ' active' : '')}
                onClick={() => setView(n.view)}
              >
                {n.label}
              </button>
            ))}
          </nav>
        </header>

        <main id="main" className="main" key={view + '-' + reloadKey}>
          {view === 'catalogue' && <Catalogue />}
          {view === 'categories' && <Categories />}
          {view === 'share' && <ShareBuilder />}
          {view === 'settings' && <SettingsView onRestored={goCatalogue} />}
        </main>
      </div>

      {/* Print surface — filled by the share module, visible only when printing. */}
      <div id="print-area" />
    </ToastProvider>
  );
}

export default App;
