/// <reference types="react-scripts" />

declare module 'shpjs' {
  function parseZip(data: ArrayBuffer): Promise<any>;
  function parseShp(data: ArrayBuffer): Promise<any>;
  function parseDbf(data: ArrayBuffer): Promise<any>;
  
  export { parseZip, parseShp, parseDbf };
}

// Declare Leaflet on window for MapControls.tsx
interface Window {
  L: typeof import('leaflet');
}