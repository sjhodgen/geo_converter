# GeoConverter

A web-based GIS file converter application that enables users to:
- Import GIS data in Shapefile (.zip) format
- Visualize geographic data on an interactive map
- Edit feature properties with multi-select capability
- Export data to GeoJSON

## Architecture

This application follows a modern React architecture with TypeScript, implementing:
- Three-panel design (left: file operations, center: map view, right: properties)
- Material UI for consistent styling
- Leaflet for map visualization
- ShpJS for parsing Shapefiles
- Context-based state management

## Development

### Prerequisites
- Node.js 14.0 or higher
- npm 6.0 or higher

### Installation
```bash
# Install dependencies
npm install
```

### Running the app
```bash
# Start the development server
npm start
```

### Building for production
```bash
# Create a production build
npm run build
```

## Features

- **Import**: Upload Shapefile (.zip) 
- **Map Visualization**: View and interact with geographic data
- **Property Editing**: View and edit feature properties
- **Feature Selection**: Select features from map or list
- **Bulk Operations**: Edit and manage multiple features simultaneously
- **Styling Options**: Customize colors and appearance
- **Export**: Download in GeoJSON format

## Project Structure

```
geo_converter/
├── public/                # Static assets
├── src/
│   ├── components/        # React components
│   │   ├── Header/
│   │   ├── LeftPanel/
│   │   ├── MapPanel/
│   │   ├── RightPanel/
│   │   └── common/
│   ├── context/           # State management
│   ├── services/          # Core functionality
│   ├── styles/            # Global styles
│   ├── config/            # Configuration
│   └── utils/             # Helper functions
├── package.json
└── README.md