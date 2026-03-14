"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";
import type {
  LayerGroup as LeafletLayerGroup,
  Map as LeafletMap,
  Marker as LeafletMarker,
} from "leaflet";
import { useIndustry } from "@/components/IndustryContext";

interface IndustryLayerProps {
  map: LeafletMap | null;
}

function markerHtml(status: string, color: string) {
  const animation = status === "Violation" ? "industry-violation-pulse 1.8s ease-in-out infinite" : "none";
  return `
    <div style="position:relative;display:flex;height:30px;width:30px;align-items:center;justify-content:center;">
      <div style="position:absolute;inset:2px;transform:rotate(45deg);border:1px solid rgba(255,255,255,0.65);background:${color};box-shadow:0 0 18px ${color};animation:${animation};border-radius:4px;"></div>
      <span style="position:relative;font-size:14px;line-height:1;">🏭</span>
    </div>
  `;
}

function popupHtml(marker: {
  id: string;
  name: string;
  category: string;
  city: string;
  state: string;
  status: string;
  color: string;
  lastDataTime: string;
  locationSource: string;
}) {
  return `
    <div style="min-width:220px;padding:2px 0;color:#111827;">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;">
        <div>
          <p style="margin:0;font-size:14px;font-weight:700;">${marker.name}</p>
          <p style="margin:2px 0 0;font-size:12px;color:#52525b;">${marker.city}, ${marker.state}</p>
        </div>
        <span style="border-radius:9999px;background:${marker.color};padding:3px 8px;font-size:11px;font-weight:700;color:white;">${marker.status}</span>
      </div>
      <p style="margin:10px 0 0;font-size:12px;color:#18181b;">Category: ${marker.category || "Unknown"}</p>
      <p style="margin:4px 0 0;font-size:11px;color:#52525b;">Last data: ${marker.lastDataTime || "Not available"}</p>
      <p style="margin:4px 0 0;font-size:11px;color:#52525b;">Location: ${marker.locationSource}</p>
      <button id="industry-popup-${marker.id}" style="margin-top:12px;width:100%;border:none;border-radius:10px;background:#0f766e;padding:9px 12px;color:white;font-size:12px;font-weight:700;cursor:pointer;">View Details</button>
    </div>
  `;
}

export default function IndustryLayer({ map }: IndustryLayerProps) {
  const {
    apiError,
    layerVisible,
    loadingMarkers,
    mapMarkers,
    selectedIndustryId,
    selectIndustry,
    toggleLayer,
  } = useIndustry();

  const markerLookupRef = useRef<Map<string, LeafletMarker>>(new Map());
  const layerRef = useRef<LeafletLayerGroup | null>(null);
  const selectIndustryRef = useRef(selectIndustry);

  useEffect(() => {
    selectIndustryRef.current = selectIndustry;
  }, [selectIndustry]);

  useEffect(() => {
    let mounted = true;

    const renderMarkers = async () => {
      if (!map) {
        return;
      }

      const L = await import("leaflet");
      if (!mounted) {
        return;
      }

      if (!layerRef.current) {
        layerRef.current = L.layerGroup();
      }

      const layer = layerRef.current;
      layer.clearLayers();
      markerLookupRef.current.clear();

      if (!layerVisible) {
        if (map.hasLayer(layer)) {
          map.removeLayer(layer);
        }
        return;
      }

      if (!map.hasLayer(layer)) {
        layer.addTo(map);
      }

      mapMarkers.forEach((marker) => {
        const nextMarker = L.marker([marker.lat, marker.lng], {
          icon: L.divIcon({
            className: "industry-marker-icon",
            html: markerHtml(marker.status, marker.color),
            iconSize: [30, 30],
            iconAnchor: [15, 15],
          }),
          title: marker.name,
        });

        nextMarker.bindPopup(
          popupHtml({
            id: marker.id,
            name: marker.name,
            category: marker.category,
            city: marker.city,
            state: marker.state,
            status: marker.status,
            color: marker.color,
            lastDataTime: marker.lastDataTime,
            locationSource: marker.locationSource,
          })
        );

        nextMarker.on("popupopen", () => {
          const button = document.getElementById(`industry-popup-${marker.id}`);
          if (button) {
            button.onclick = () => {
              void selectIndustryRef.current(marker.id);
            };
          }
        });

        layer.addLayer(nextMarker);
        markerLookupRef.current.set(marker.id, nextMarker);
      });
    };

    void renderMarkers();

    return () => {
      mounted = false;
      if (map && layerRef.current && map.hasLayer(layerRef.current)) {
        map.removeLayer(layerRef.current);
      }
    };
  }, [layerVisible, map, mapMarkers]);

  useEffect(() => {
    if (!map || !selectedIndustryId || !layerVisible) {
      return;
    }

    const marker = markerLookupRef.current.get(selectedIndustryId);
    if (!marker) {
      return;
    }

    const currentZoom = typeof map.getZoom === "function" ? map.getZoom() : 5;
    map.flyTo(marker.getLatLng(), Math.max(currentZoom, 6), { duration: 0.6 });
    marker.openPopup();
  }, [layerVisible, map, selectedIndustryId]);

  return (
    <div className="pointer-events-none absolute right-4 top-4 z-[1000] flex max-w-[280px] flex-col items-end gap-2">
      <button
        type="button"
        onClick={toggleLayer}
        className="pointer-events-auto inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-[#06111c]/90 px-4 py-2.5 text-sm font-medium text-white shadow-2xl backdrop-blur-xl transition hover:border-emerald-400/30 hover:bg-[#0a1a2a]"
      >
        {loadingMarkers ? <Loader2 size={16} className="animate-spin text-emerald-300" /> : <span>🏭</span>}
        <span>{layerVisible ? "Hide industries" : "Show industries"}</span>
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-zinc-200">{mapMarkers.length}</span>
      </button>

      {apiError ? (
        <div className="pointer-events-auto rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-right text-[11px] text-amber-100 backdrop-blur">
          {apiError}
        </div>
      ) : null}
    </div>
  );
}