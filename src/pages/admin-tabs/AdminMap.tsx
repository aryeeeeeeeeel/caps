import React, { useState, useEffect, useRef } from 'react';
import { 
  IonContent, 
  IonHeader, 
  IonPage, 
  IonTitle, 
  IonToolbar,
  IonButton,
  IonIcon,
  IonLoading
} from '@ionic/react';
import { layersOutline, refreshOutline } from 'ionicons/icons';
import L from 'leaflet';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const AdminMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState(false);
  const [mapView, setMapView] = useState<'roadmap' | 'satellite' | 'terrain' | 'hybrid'>('roadmap');
  const [tileLayer, setTileLayer] = useState<L.TileLayer | null>(null);

  useEffect(() => {
    initializeLeafletMap();
    
    // Cleanup function to remove the map when component unmounts
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current && tileLayer) {
      changeMapType(mapView);
    }
  }, [mapView]);

  const initializeLeafletMap = () => {
    // Check if map is already initialized
    if (mapInstanceRef.current) {
      console.log('Map already initialized');
      return;
    }
    
    if (!mapRef.current) {
      console.error('Map container ref not available');
      return;
    }

    // Check if map container already has a Leaflet instance
    if (mapRef.current && (mapRef.current as any)._leaflet_id) {
      console.log('Map container already has a Leaflet instance');
      return;
    }

    try {
      console.log('Initializing Leaflet Map...');
      setIsLoading(true);

      // Initialize the map
      const map = L.map(mapRef.current).setView([8.3830, 124.8500], 13); // Default center

      // Add the initial tile layer
      const initialTileLayer = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19
        }
      ).addTo(map);

      setTileLayer(initialTileLayer);
      mapInstanceRef.current = map;

      // Add event listener for map load
      map.whenReady(() => {
        console.log('Map loaded and ready');
        setMapLoaded(true);
        setMapError(false);
        setIsLoading(false);
        
        // Add any admin-specific map features here
      });

    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError(true);
      setIsLoading(false);
    }
  };

  const changeMapType = (type: string) => {
    if (!mapInstanceRef.current || !tileLayer) return;

    // Remove the current tile layer
    mapInstanceRef.current.removeLayer(tileLayer);

    let newTileLayer: L.TileLayer;

    switch (type) {
      case 'satellite':
        newTileLayer = L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          {
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
            maxZoom: 19
          }
        );
        break;
      case 'terrain':
        newTileLayer = L.tileLayer(
          'https://{s}.tile.openttopomap.org/{z}/{x}/{y}.png',
          {
            attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
            maxZoom: 17
          }
        );
        break;
      case 'hybrid':
        newTileLayer = L.tileLayer(
          'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
          }
        );
        break;
      default: // roadmap
        newTileLayer = L.tileLayer(
          'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
          }
        );
    }

    newTileLayer.addTo(mapInstanceRef.current);
    setTileLayer(newTileLayer);
  };

  const changeMapViewType = (newType: string) => {
    setMapView(newType as any);
  };

  const reloadMap = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
    setIsLoading(true);
    setMapLoaded(false);
    initializeLeafletMap();
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Admin Map</IonTitle>
          <IonButton 
            slot="end" 
            fill="clear" 
            onClick={reloadMap}
            style={{ marginRight: '10px' }}
          >
            <IonIcon icon={refreshOutline} />
          </IonButton>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {/* Inline Leaflet CSS */}
        <style>
          {`
            @import url('https://unpkg.com/leaflet@1.7.1/dist/leaflet.css');
            .leaflet-container {
              height: 100%;
              width: 100%;
            }
            .map-container {
              height: 100%;
              position: relative;
            }
          `}
        </style>

        <IonLoading isOpen={isLoading} message="Loading Map..." />

        {/* Map controls */}
        <div style={{ 
          position: 'absolute', 
          top: '10px', 
          right: '10px', 
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: '5px'
        }}>
          <IonButton 
            size="small" 
            onClick={() => changeMapViewType('roadmap')}
            color={mapView === 'roadmap' ? 'primary' : 'medium'}
          >
            <IonIcon icon={layersOutline} slot="start" />
            Street
          </IonButton>
          <IonButton 
            size="small" 
            onClick={() => changeMapViewType('satellite')}
            color={mapView === 'satellite' ? 'primary' : 'medium'}
          >
            <IonIcon icon={layersOutline} slot="start" />
            Satellite
          </IonButton>
          <IonButton 
            size="small" 
            onClick={() => changeMapViewType('terrain')}
            color={mapView === 'terrain' ? 'primary' : 'medium'}
          >
            <IonIcon icon={layersOutline} slot="start" />
            Terrain
          </IonButton>
        </div>

        {/* Map Container */}
        <div className="map-container">
          <div
            ref={mapRef}
            style={{
              width: '100%',
              height: '100%',
              background: '#f1f5f9'
            }}
          >
            {/* Fallback content if Leaflet doesn't load */}
            {(!mapLoaded || mapError) && !isLoading && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                flexDirection: 'column',
                padding: '20px'
              }}>
                <h3 style={{ color: '#9ca3af', marginTop: '16px', marginBottom: '8px' }}>
                  {mapError ? 'Map failed to load' : 'Initializing map...'}
                </h3>
                <IonButton fill="outline" onClick={reloadMap}>
                  <IonIcon icon={refreshOutline} slot="start" />
                  Reload Map
                </IonButton>
              </div>
            )}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AdminMap;