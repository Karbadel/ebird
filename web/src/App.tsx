import { useEffect } from 'react';
import PortalHeader from './components/PortalHeader';
import PortalSidebar from './components/PortalSidebar';
import MapView from './components/MapView';
import TitlePlate from './components/TitlePlate';
import ChipBar from './components/ChipBar';
import StatPlate from './components/StatPlate';
import MapControls from './components/MapControls';
import ResultsPanel from './components/ResultsPanel';
import SpeciesSheet from './components/SpeciesSheet';
import Sections from './components/Sections';
import Footer from './components/Footer';
import Loader from './components/Loader';
import { useDataStore } from './store/useDataStore';

export default function App() {
  const load = useDataStore((s) => s.load);
  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <PortalHeader />
      <section className="hero">
        <PortalSidebar />
        <div className="mapwrap">
          <MapView />
          <TitlePlate />
          <ChipBar />
          <StatPlate />
          <MapControls />
          <ResultsPanel />
          <SpeciesSheet />
        </div>
      </section>
      <Sections />
      <Footer />
      <Loader />
    </>
  );
}
