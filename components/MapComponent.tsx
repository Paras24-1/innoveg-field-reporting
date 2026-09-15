'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Visit } from '@/lib/types';

// Custom SVG icon generator for Leaflet
const createCustomIcon = (type: string, isRepeat: boolean) => {
  let bgColor = '#16a34a'; // default green (farmer)
  if (type === 'Dealer Visit') bgColor = '#2563eb'; // blue
  if (type === 'Distributor Visit') bgColor = '#7c3aed'; // purple
  if (type === 'Field Program') bgColor = '#ea580c'; // orange
  if (type === 'Field Visit') bgColor = '#059669'; // emerald

  const svg = `
    <svg width="32" height="38" viewBox="0 0 32 38" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0C7.16344 0 0 7.16344 0 16C0 26 16 38 16 38C16 38 32 26 32 16C32 7.16344 24.8366 0 16 0Z" fill="${bgColor}"/>
      <circle cx="16" cy="16" r="8" fill="white"/>
      ${isRepeat ? '<circle cx="16" cy="16" r="4" fill="#ef4444"/>' : `<circle cx="16" cy="16" r="4" fill="${bgColor}"/>`}
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: 'custom-map-marker',
    iconSize: [32, 38],
    iconAnchor: [16, 38],
    popupAnchor: [0, -38],
  });
};

interface MapComponentProps {
  visits: Visit[];
  selectedEmployeeId?: string;
  onSelectVisit?: (visit: Visit) => void;
}

// Helper to auto-fit bounds
const AutoFitBounds: React.FC<{ visits: Visit[] }> = ({ visits }) => {
  const map = useMap();

  useEffect(() => {
    if (visits.length > 0) {
      const bounds = L.latLngBounds(visits.map((v) => [v.latitude, v.longitude]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [visits, map]);

  return null;
};

export default function MapComponent({
  visits,
  selectedEmployeeId,
  onSelectVisit,
}: MapComponentProps) {
  // Center around Betul / Multai / Chhindwara area
  const defaultCenter: [number, number] = [21.7709, 78.2575];

  // If employee selected, filter their visits in chronological order for polyline
  const employeeRouteVisits = selectedEmployeeId
    ? visits
        .filter((v) => v.employeeId === selectedEmployeeId)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    : [];

  const routePolylinePoints: [number, number][] = employeeRouteVisits.map((v) => [
    v.latitude,
    v.longitude,
  ]);

  return (
    <div className="w-full h-full min-h-[420px] rounded-xl overflow-hidden border border-slate-200 shadow-sm relative z-0">
      <MapContainer
        center={defaultCenter}
        zoom={9}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <AutoFitBounds visits={visits} />

        {/* Route Polyline when filtering by officer */}
        {routePolylinePoints.length > 1 && (
          <Polyline
            positions={routePolylinePoints}
            color="#2563eb"
            weight={4}
            opacity={0.8}
            dashArray="6, 8"
          />
        )}

        {/* Visit Markers */}
        {visits.map((visit) => (
          <Marker
            key={visit.id}
            position={[visit.latitude, visit.longitude]}
            icon={createCustomIcon(visit.visitType, visit.isRepeatLocation)}
            eventHandlers={{
              click: () => onSelectVisit && onSelectVisit(visit),
            }}
          >
            <Popup className="custom-leaflet-popup">
              <div className="p-1 max-w-[240px]">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-800">
                    {visit.visitType}
                  </span>
                  {visit.isRepeatLocation && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                      Repeat Visit
                    </span>
                  )}
                </div>

                <p className="font-bold text-slate-900 text-sm leading-snug">{visit.entityName}</p>
                <p className="text-xs text-slate-600 mt-0.5">📍 {visit.village || visit.locationName}</p>
                <p className="text-[11px] text-emerald-700 font-medium mt-1">
                  👤 {visit.employeeName} ({visit.district})
                </p>

                {visit.photoUrl && (
                  <div className="mt-2 rounded-md overflow-hidden border border-slate-200 h-24 bg-slate-100">
                    <img
                      src={visit.photoUrl}
                      alt={visit.entityName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-100">
                  <span>AI Score: <strong className="text-emerald-600">{visit.aiAnalysis.qualityScore}/100</strong></span>
                  <span>{new Date(visit.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map Legend */}
      <div className="absolute bottom-3 left-3 z-[400] bg-white/95 backdrop-blur px-3 py-2 rounded-lg border border-slate-200 shadow-md text-[11px] space-y-1">
        <p className="font-semibold text-slate-700">Visit Legend:</p>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#16a34a]"></span>
          <span>Farmer Visit</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#2563eb]"></span>
          <span>Dealer Visit</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ea580c]"></span>
          <span>Field Program</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></span>
          <span>Repeat Location (&lt;150m)</span>
        </div>
      </div>
    </div>
  );
}
