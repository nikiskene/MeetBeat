// src/features/admin/components/CommunityMap.tsx

import { useEffect } from 'react';
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet';
import type { LatLngBoundsExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';

export type CommunityPoint = {
  city: string | null;
  region: string | null;
  country: string | null;
  latitude: number;
  longitude: number;
  member_count: number;
};

export type LocationCoverage = {
  total: number;
  mapped: number;
  country_only: number;
  missing: number;
  ambiguous: number;
};

type Props = {
  points: CommunityPoint[];
  coverage: LocationCoverage;
};

export default function CommunityMap({
  points,
  coverage,
}: Props) {
  const validPoints = points.filter(
    point =>
      Number.isFinite(point.latitude) &&
      Number.isFinite(point.longitude) &&
      point.latitude >= -90 &&
      point.latitude <= 90 &&
      point.longitude >= -180 &&
      point.longitude <= 180,
  );

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-5">
        <h2 className="text-lg font-semibold text-slate-900">
          Community map
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          City-level aggregates only. Individual member locations are
          never shown.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Coverage
            label="Mapped"
            value={coverage.mapped}
            tone="bg-emerald-50 text-emerald-700"
          />

          <Coverage
            label="Country only"
            value={coverage.country_only}
            tone="bg-blue-50 text-blue-700"
          />

          <Coverage
            label="Needs review"
            value={coverage.ambiguous}
            tone="bg-amber-50 text-amber-700"
          />

          <Coverage
            label="Missing"
            value={coverage.missing}
            tone="bg-slate-100 text-slate-700"
          />
        </div>
      </div>

      {validPoints.length > 0 ? (
        <MapContainer
          center={[48.5, 12]}
          zoom={4}
          scrollWheelZoom={false}
          className="h-80 w-full sm:h-96"
          aria-label="BEAT community locations"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapViewport points={validPoints} />

          {validPoints.map(point => {
            const location =
              point.city ??
              point.region ??
              point.country ??
              'Location';

            const key = [
              point.country,
              point.region,
              point.city,
              point.latitude,
              point.longitude,
            ].join(':');

            return (
              <CircleMarker
                key={key}
                center={[point.latitude, point.longitude]}
                radius={Math.max(
                  9,
                  Math.min(22, 8 + point.member_count * 2),
                )}
                pathOptions={{
                  color: '#be185d',
                  fillColor: '#ec4899',
                  fillOpacity: 0.78,
                  weight: 2,
                }}
              >
                <Popup>
                  <strong>{location}</strong>

                  {point.country && location !== point.country && (
                    <>
                      <br />
                      {point.country}
                    </>
                  )}

                  <br />
                  {point.member_count}{' '}
                  {point.member_count === 1 ? 'member' : 'members'}
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      ) : (
        <div className="flex h-64 items-center justify-center p-6 text-center text-sm text-slate-500">
          No map-ready member locations yet.
        </div>
      )}

      <div className="border-t border-slate-100 bg-slate-50 px-5 py-3 text-xs text-slate-500">
        {coverage.mapped} of {coverage.total} active profiles currently
        have map-ready location data.
      </div>
    </section>
  );
}

function MapViewport({
  points,
}: {
  points: CommunityPoint[];
}) {
  const map = useMap();

  useEffect(() => {
    window.setTimeout(() => {
      map.invalidateSize();

      if (points.length === 1) {
        map.setView(
          [points[0].latitude, points[0].longitude],
          7,
        );
        return;
      }

      const bounds = points.map(
        point =>
          [point.latitude, point.longitude] as [number, number],
      ) as LatLngBoundsExpression;

      map.fitBounds(bounds, {
        padding: [32, 32],
        maxZoom: 7,
      });
    }, 0);
  }, [map, points]);

  return null;
}

function Coverage({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className={`rounded-xl px-3 py-2 ${tone}`}>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs font-medium">{label}</p>
    </div>
  );
}