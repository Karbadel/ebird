import { useEffect, useRef } from 'react';
import PortalHeader from './components/PortalHeader';
import PortalSidebar from './components/PortalSidebar';
import MapView from './components/MapView';
import ChipBar from './components/ChipBar';
import MapControls from './components/MapControls';
import ResultsPanel from './components/ResultsPanel';
import TabRail from './components/TabRail';
import SiteSheet from './components/SiteSheet';
import LegendPlate from './components/LegendPlate';
import MeasurePlate from './components/MeasurePlate';
import Sections from './components/Sections';
import Footer from './components/Footer';
import Loader from './components/Loader';
import QuienesPage from './components/pages/QuienesPage';
import CapasPage from './components/pages/CapasPage';
import GuiaPage from './components/pages/GuiaPage';
import ComitePage from './components/pages/ComitePage';
import { useDataStore } from './store/useDataStore';
import { initUrlSync } from './lib/urlState';
import { usePortalStore } from './store/usePortalStore';

export default function App() {
  const load = useDataStore((s) => s.load);
  // En modo cajón (pantallas angostas) los controles se corren si el panel está abierto.
  const panelOpen = usePortalStore((s) => !s.panelHidden);
  const page = usePortalStore((s) => s.page);
  useEffect(() => {
    load();
  }, [load]);
  // Enlaces compartibles: vista del visor ↔ hash de la URL (Atrás/Adelante).
  useEffect(() => initUrlSync(), []);
  // Al cambiar de página (incluido Atrás/Adelante del navegador) el foco pasa al título
  // de la página mostrada, o al inicio del documento si es el visor. No actúa en la
  // carga inicial para no robar el foco.
  const primeraPagina = useRef(true);
  useEffect(() => {
    if (primeraPagina.current) {
      primeraPagina.current = false;
      return;
    }
    const id = requestAnimationFrame(() => {
      window.scrollTo({ top: 0 });
      if (page === 'visor') {
        (document.activeElement as HTMLElement | null)?.blur();
        return;
      }
      const titulo = document.querySelector<HTMLElement>('section.page h2');
      if (titulo) {
        titulo.tabIndex = -1;
        titulo.focus({ preventScroll: true });
      }
    });
    return () => cancelAnimationFrame(id);
  }, [page]);

  return (
    <>
      <PortalHeader />
      {page === 'visor' ? (
        <section className="hero" id="visor">
          <TabRail />
          <PortalSidebar />
          <div className={`mapwrap warm${panelOpen ? ' panel-open' : ''}`}>
            <MapView />
            <ChipBar />
            <MapControls />
            <MeasurePlate />
            <ResultsPanel />
            <SiteSheet />
            <LegendPlate />
          </div>
        </section>
      ) : (
        <>
          {page === 'quienes' && <QuienesPage />}
          {page === 'capas' && <CapasPage />}
          {page === 'guia' && <GuiaPage />}
          {page === 'comite' && <ComitePage />}
        </>
      )}
      <Sections />
      <Footer />
      <Loader />
    </>
  );
}
