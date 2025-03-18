import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/global.css';
import App from './App';
import { AppContextProvider } from './context/AppContext';
import { MapContextProvider } from './context/MapContext';
import { FeatureContextProvider } from './context/FeatureContext';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <AppContextProvider>
      <MapContextProvider>
        <FeatureContextProvider>
          <App />
        </FeatureContextProvider>
      </MapContextProvider>
    </AppContextProvider>
  </React.StrictMode>
);