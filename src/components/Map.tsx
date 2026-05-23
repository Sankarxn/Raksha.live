'use client';

import { useEffect, useRef, useState } from 'react';
import { Incident } from '@/lib/db';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapProps {
  incidents: Incident[];
  onPinClick?: (incident: Incident) => void;
}

export default function Map({ incidents, onPinClick }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const map = useRef<any>(null);
  const [webglError, setWebglError] = useState(false);
  // Fixed initial view constants — no re-render needed on move
  const INITIAL_ZOOM = 7.0;
  const INITIAL_CENTER = { lat: 10.45, lng: 76.4 }; // Kerala geographic center

  // Color mappings
  const getColor = (type: string) => {
    switch (type) {
      case 'landslide': return '#dc2626'; // red
      case 'flood': return '#2563eb'; // blue
      case 'roadblock': return '#d97706'; // orange
      case 'rescue': return '#9333ea'; // purple
      default: return '#6b7280';
    }
  };

  useEffect(() => {
    if (!mapContainer.current) return;

    // Detect WebGL support
    try {
      const canvas = document.createElement('canvas');
      const supportsWebGL = !!(window.WebGLRenderingContext && 
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
      
      if (!supportsWebGL) {
        setWebglError(true);
        return;
      }
    } catch {
      setWebglError(true);
      return;
    }

    // Dynamic import to avoid SSR crashes
    import('maplibre-gl').then((maplibregl) => {
      if (map.current) return; // already initialized

      map.current = new maplibregl.Map({
        container: mapContainer.current!,
        style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
        center: [INITIAL_CENTER.lng, INITIAL_CENTER.lat],
        zoom: INITIAL_ZOOM,
        maxBounds: [
          [74.5, 8.0],  // Southwest bounds of Kerala (Lng, Lat)
          [77.8, 13.0]  // Northeast bounds of Kerala (Lng, Lat)
        ],
        attributionControl: false  // Attribution hidden
      });

      map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

      map.current.on('load', () => {
        if (!map.current) return;

        // Hide default place labels to highlight only Kerala districts
        try {
          const layers = map.current.getStyle().layers;
          if (layers) {
            layers.forEach((layer: any) => {
              if (layer.type === 'symbol' && (layer.id.includes('place') || layer.id.includes('airport') || layer.id.includes('station') || layer.id.includes('capital'))) {
                map.current.setLayoutProperty(layer.id, 'visibility', 'none');
              }
            });
          }
        } catch (e) {
          console.warn('Could not filter out base style layers:', e);
        }

        // Add Kerala district boundary source loaded locally
        map.current.addSource('kerala-districts', {
          type: 'geojson',
          data: '/kerala-districts.geojson'
        });

        // 1. Highlight district borders with fine, semi-transparent white lines
        map.current.addLayer({
          id: 'kerala-districts-line',
          type: 'line',
          source: 'kerala-districts',
          paint: {
            'line-color': 'rgba(255, 255, 255, 0.25)',
            'line-width': 1.0
          }
        });

        // 2. Add an elegant emerald-glow overlay casing for each district border to match RAKSHA's premium theme
        map.current.addLayer({
          id: 'kerala-districts-glow',
          type: 'line',
          source: 'kerala-districts',
          paint: {
            'line-color': '#16a34a',
            'line-width': 2.2,
            'line-opacity': 0.45
          }
        });

        // 3. Subtle background fill to highlight Kerala state relative to surrounding ocean/states
        map.current.addLayer({
          id: 'kerala-districts-fill',
          type: 'fill',
          source: 'kerala-districts',
          paint: {
            'fill-color': '#3b82f6',
            'fill-opacity': 0.03
          }
        });

        // 4. Add custom Kerala district names data source
        map.current.addSource('kerala-district-names', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [
              { type: 'Feature', properties: { name: 'Kasaragod' }, geometry: { type: 'Point', coordinates: [74.98, 12.51] } },
              { type: 'Feature', properties: { name: 'Kannur' }, geometry: { type: 'Point', coordinates: [75.37, 11.87] } },
              { type: 'Feature', properties: { name: 'Wayanad' }, geometry: { type: 'Point', coordinates: [76.08, 11.68] } },
              { type: 'Feature', properties: { name: 'Kozhikode' }, geometry: { type: 'Point', coordinates: [75.78, 11.25] } },
              { type: 'Feature', properties: { name: 'Malappuram' }, geometry: { type: 'Point', coordinates: [76.07, 11.07] } },
              { type: 'Feature', properties: { name: 'Palakkad' }, geometry: { type: 'Point', coordinates: [76.65, 10.78] } },
              { type: 'Feature', properties: { name: 'Thrissur' }, geometry: { type: 'Point', coordinates: [76.21, 10.52] } },
              { type: 'Feature', properties: { name: 'Ernakulam' }, geometry: { type: 'Point', coordinates: [76.30, 9.98] } },
              { type: 'Feature', properties: { name: 'Idukki' }, geometry: { type: 'Point', coordinates: [77.10, 9.92] } },
              { type: 'Feature', properties: { name: 'Kottayam' }, geometry: { type: 'Point', coordinates: [76.52, 9.59] } },
              { type: 'Feature', properties: { name: 'Alappuzha' }, geometry: { type: 'Point', coordinates: [76.33, 9.49] } },
              { type: 'Feature', properties: { name: 'Pathanamthitta' }, geometry: { type: 'Point', coordinates: [76.78, 9.26] } },
              { type: 'Feature', properties: { name: 'Kollam' }, geometry: { type: 'Point', coordinates: [76.59, 8.89] } },
              { type: 'Feature', properties: { name: 'Thiruvananthapuram' }, geometry: { type: 'Point', coordinates: [76.94, 8.51] } }
            ]
          }
        });

        // 5. Add custom symbols layer for highlighted Kerala district names
        map.current.addLayer({
          id: 'kerala-district-names-label',
          type: 'symbol',
          source: 'kerala-district-names',
          layout: {
            'text-field': ['get', 'name'],
            'text-font': ['Roboto Regular', 'Arial Unicode MS Regular'],
            'text-size': 11,
            'text-transform': 'uppercase',
            'text-letter-spacing': 0.08,
            'text-anchor': 'center'
          },
          paint: {
            'text-color': '#10b981', // emerald green to pop out beautifully
            'text-halo-color': '#0a0b10', // deep dark background glow match
            'text-halo-width': 2.0
          }
        });

        // 6. Add custom Kerala region/village names data source
        map.current.addSource('kerala-regions', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [
              { type: 'Feature', properties: { name: 'Kanhangad', district: 'Kasaragod' }, geometry: { type: 'Point', coordinates: [75.09, 12.31] } },
              { type: 'Feature', properties: { name: 'Thalassery', district: 'Kannur' }, geometry: { type: 'Point', coordinates: [75.49, 11.75] } },
              { type: 'Feature', properties: { name: 'Payyannur', district: 'Kannur' }, geometry: { type: 'Point', coordinates: [75.20, 12.10] } },
              { type: 'Feature', properties: { name: 'Kalpetta', district: 'Wayanad' }, geometry: { type: 'Point', coordinates: [76.08, 11.60] } },
              { type: 'Feature', properties: { name: 'Sulthan Bathery', district: 'Wayanad' }, geometry: { type: 'Point', coordinates: [76.26, 11.66] } },
              { type: 'Feature', properties: { name: 'Mananthavady', district: 'Wayanad' }, geometry: { type: 'Point', coordinates: [76.00, 11.80] } },
              { type: 'Feature', properties: { name: 'Vadakara', district: 'Kozhikode' }, geometry: { type: 'Point', coordinates: [75.58, 11.60] } },
              { type: 'Feature', properties: { name: 'Koyilandy', district: 'Kozhikode' }, geometry: { type: 'Point', coordinates: [75.69, 11.43] } },
              { type: 'Feature', properties: { name: 'Manjeri', district: 'Malappuram' }, geometry: { type: 'Point', coordinates: [76.12, 11.12] } },
              { type: 'Feature', properties: { name: 'Tirur', district: 'Malappuram' }, geometry: { type: 'Point', coordinates: [75.92, 10.90] } },
              { type: 'Feature', properties: { name: 'Ottapalam', district: 'Palakkad' }, geometry: { type: 'Point', coordinates: [76.38, 10.78] } },
              { type: 'Feature', properties: { name: 'Mannarkkad', district: 'Palakkad' }, geometry: { type: 'Point', coordinates: [76.44, 10.98] } },
              { type: 'Feature', properties: { name: 'Guruvayur', district: 'Thrissur' }, geometry: { type: 'Point', coordinates: [76.04, 10.60] } },
              { type: 'Feature', properties: { name: 'Chalakudy', district: 'Thrissur' }, geometry: { type: 'Point', coordinates: [76.33, 10.30] } },
              { type: 'Feature', properties: { name: 'Kochi', district: 'Ernakulam' }, geometry: { type: 'Point', coordinates: [76.27, 9.93] } },
              { type: 'Feature', properties: { name: 'Aluva', district: 'Ernakulam' }, geometry: { type: 'Point', coordinates: [76.35, 10.11] } },
              { type: 'Feature', properties: { name: 'Muvattupuzha', district: 'Ernakulam' }, geometry: { type: 'Point', coordinates: [76.58, 9.98] } },
              { type: 'Feature', properties: { name: 'Munnar', district: 'Idukki' }, geometry: { type: 'Point', coordinates: [77.06, 10.09] } },
              { type: 'Feature', properties: { name: 'Thodupuzha', district: 'Idukki' }, geometry: { type: 'Point', coordinates: [76.71, 9.90] } },
              { type: 'Feature', properties: { name: 'Kattappana', district: 'Idukki' }, geometry: { type: 'Point', coordinates: [77.12, 9.72] } },
              { type: 'Feature', properties: { name: 'Pala', district: 'Kottayam' }, geometry: { type: 'Point', coordinates: [76.68, 9.70] } },
              { type: 'Feature', properties: { name: 'Changanassery', district: 'Kottayam' }, geometry: { type: 'Point', coordinates: [76.54, 9.44] } },
              { type: 'Feature', properties: { name: 'Kayamkulam', district: 'Alappuzha' }, geometry: { type: 'Point', coordinates: [76.50, 9.17] } },
              { type: 'Feature', properties: { name: 'Cherthala', district: 'Alappuzha' }, geometry: { type: 'Point', coordinates: [76.34, 9.69] } },
              { type: 'Feature', properties: { name: 'Thiruvalla', district: 'Pathanamthitta' }, geometry: { type: 'Point', coordinates: [76.57, 9.38] } },
              { type: 'Feature', properties: { name: 'Adoor', district: 'Pathanamthitta' }, geometry: { type: 'Point', coordinates: [76.73, 9.15] } },
              { type: 'Feature', properties: { name: 'Karunagappally', district: 'Kollam' }, geometry: { type: 'Point', coordinates: [76.54, 9.05] } },
              { type: 'Feature', properties: { name: 'Punalur', district: 'Kollam' }, geometry: { type: 'Point', coordinates: [76.92, 9.01] } },
              { type: 'Feature', properties: { name: 'Neyyattinkara', district: 'Thiruvananthapuram' }, geometry: { type: 'Point', coordinates: [77.08, 8.40] } },
              { type: 'Feature', properties: { name: 'Nedumangad', district: 'Thiruvananthapuram' }, geometry: { type: 'Point', coordinates: [76.99, 8.60] } },
              { type: 'Feature', properties: { name: 'Varkala', district: 'Thiruvananthapuram' }, geometry: { type: 'Point', coordinates: [76.71, 8.73] } }
            ]
          }
        });

        // 7. Add circles for main villages/regions (fades in as map zooms)
        map.current.addLayer({
          id: 'kerala-regions-circle',
          type: 'circle',
          source: 'kerala-regions',
          paint: {
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 8.5, 0, 9.5, 3.5, 12, 5],
            'circle-color': '#f59e0b', // premium amber circle accent
            'circle-stroke-width': 1.2,
            'circle-stroke-color': '#ffffff',
            'circle-opacity': ['interpolate', ['linear'], ['zoom'], 8.5, 0, 9.5, 0.85, 12, 1.0]
          }
        });

        // 8. Add symbol labels for main villages/regions (fades in as map zooms)
        map.current.addLayer({
          id: 'kerala-regions-label',
          type: 'symbol',
          source: 'kerala-regions',
          layout: {
            'text-field': ['get', 'name'],
            'text-font': ['Roboto Regular', 'Arial Unicode MS Regular'],
            'text-size': ['interpolate', ['linear'], ['zoom'], 8.5, 0, 9.5, 9.5, 12, 11.5],
            'text-offset': [0, 1.0],
            'text-anchor': 'top'
          },
          paint: {
            'text-color': '#ffffff', // clean white label
            'text-halo-color': '#11131e', // matching card background
            'text-halo-width': 2.0,
            'text-opacity': ['interpolate', ['linear'], ['zoom'], 8.5, 0, 9.5, 0.85, 12, 1.0]
          }
        });
      });
    }).catch(err => {
      console.error('Failed to load MapLibre', err);
      setWebglError(true);
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);




  // Update Markers when incidents change
  useEffect(() => {
    if (!map.current || webglError) return;

    import('maplibre-gl').then((maplibregl) => {
      // Remove old markers (keep track in DOM or map instance)
      const elements = document.querySelectorAll('.mapboxgl-marker, .maplibregl-marker');
      elements.forEach(el => el.remove());

      incidents.forEach(inc => {
        const el = document.createElement('div');
        el.className = 'custom-maplibre-marker';
        el.style.width = '16px';
        el.style.height = '16px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = getColor(inc.type);
        el.style.boxShadow = `0 0 10px ${getColor(inc.type)}`;
        el.style.border = '2px solid white';
        el.style.cursor = 'pointer';

        // Add custom pulse animation
        const pulse = document.createElement('div');
        pulse.style.position = 'absolute';
        pulse.style.top = '-8px';
        pulse.style.left = '-8px';
        pulse.style.width = '28px';
        pulse.style.height = '28px';
        pulse.style.borderRadius = '50%';
        pulse.style.border = `2px solid ${getColor(inc.type)}`;
        pulse.style.opacity = '0.7';
        pulse.style.animation = 'pinPulse 2s infinite ease-out';
        el.appendChild(pulse);

        el.addEventListener('click', () => {
          if (onPinClick) onPinClick(inc);
        });

        new maplibregl.Marker(el)
          .setLngLat([inc.lng, inc.lat])
          .setPopup(new maplibregl.Popup({ offset: 25 })
            .setHTML(`
              <div style="color: black; font-family: sans-serif; padding: 4px;">
                <strong style="text-transform: capitalize;">${inc.type} (${inc.severity})</strong>
                <p style="margin: 4px 0 0; font-size: 11px;">${inc.village || 'Region'}, ${inc.district}</p>
                <p style="margin: 4px 0 0; font-size: 10px; color: gray;">Reports: ${inc.report_count}</p>
              </div>
            `))
          .addTo(map.current);
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incidents, webglError]);

  if (webglError) {
    // Premium custom vector SVG map fallback for offline/WebGL disabled states
    return (
      <div className="relative w-full h-full bg-[#11131e] overflow-hidden flex flex-col items-center justify-center border-b border-white/5">
        {/* Mock visual map terrain overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none"></div>
        <svg className="absolute w-full h-full opacity-10 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M 0,20 Q 25,60 50,30 T 100,80 L 100,100 L 0,100 Z" fill="#2563eb" />
          <path d="M 0,50 Q 30,10 60,60 T 100,20 L 100,100 L 0,100 Z" fill="#16a34a" opacity="0.5" />
        </svg>

        <div className="absolute top-3 left-3 bg-[#16a34a]/90 backdrop-filter backdrop-blur-sm border border-white/10 px-3 py-1 rounded-full text-[10px] font-semibold text-white z-10 shadow-lg">
          🗺️ Offline Map Active (Vector Mode)
        </div>

        {/* Dynamic Interactive SVG Pins */}
        <div className="relative w-full h-full">
          {incidents.map((inc) => {
            // Map Kerala coords back to percent box
            // Lat [8.0, 13.0], Lng [74.5, 77.8]
            const mapY = 100 - ((inc.lat - 8.0) / 5.0) * 100;
            const mapX = ((inc.lng - 74.5) / 3.3) * 100;
            const clampedX = Math.max(10, Math.min(90, mapX));
            const clampedY = Math.max(10, Math.min(90, mapY));
            const color = getColor(inc.type);

            return (
              <button
                key={inc.id}
                onClick={() => onPinClick && onPinClick(inc)}
                className="absolute w-4 h-4 rounded-full border-2 border-white -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 hover:scale-125 z-20 group"
                style={{
                  left: `${clampedX}%`,
                  top: `${clampedY}%`,
                  backgroundColor: color,
                  boxShadow: `0 0 12px ${color}`
                }}
              >
                <div
                  className="absolute inset-[-6px] rounded-full border animate-[pinPulse_2s_infinite_ease-out] pointer-events-none"
                  style={{ borderColor: color }}
                ></div>
                {/* Custom hover tooltip */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#0e1017] border border-white/10 text-white text-[10px] p-2 rounded shadow-xl hidden group-hover:block whitespace-nowrap z-50">
                  <strong className="capitalize">{inc.type}</strong> ({inc.village})
                </div>
              </button>
            );
          })}
        </div>

      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      

    </div>
  );
}
