import React from 'react';
import Header from './components/Header/Header';
import LeftPanel from './components/LeftPanel/LeftPanel';
import MapPanel from './components/MapPanel/MapPanel';
import RightPanel from './components/RightPanel/RightPanel';
import { useAppContext } from './context/AppContext';

const App: React.FC = () => {
  const { version } = useAppContext();

  return (
    <div className="app-container">
      <Header version={version} />
      <div className="main-content">
        <LeftPanel />
        <MapPanel />
        <RightPanel />
      </div>
    </div>
  );
};

export default App;