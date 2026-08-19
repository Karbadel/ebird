import { useEffect } from 'react';
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
import { useDataStore } from './store/useDataStore';

export default function App() {
  const load = useDataStore((s) => s.load);
  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <PortalHeader />
      <section className="hero" id="visor">
        <TabRail />
        <PortalSidebar />
        <div className="mapwrap warm">
          <MapView />
          <ChipBar />
          <MapControls />
          <MeasurePlate />
          <ResultsPanel />
          <SiteSheet />
          <LegendPlate />
        </div>
      </section>
      <Sections />
      <Footer />
      <Loader />
    </>
  );
}
