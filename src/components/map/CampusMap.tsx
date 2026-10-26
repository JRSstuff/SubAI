"use client";

import React, { useEffect, useRef, useState } from "react";
import { Loader2, Navigation } from "lucide-react";

export interface MapReportPin {
  id: string;
  reference_no: string;
  location_name: string;
  latitude: number;
  longitude: number;
  review_state: string;
  priority_band?: "Low" | "Medium" | "High";
  description?: string;
  photo_url?: string;
}

interface CampusMapProps {
  pins?: MapReportPin[];
  selectable?: boolean;
  selectedCoords?: { lat: number; lng: number } | null;
  onLocationSelect?: (coords: { lat: number; lng: number }) => void;
  className?: string;
}

export function CampusMap({
  pins = [],
  selectable = false,
  selectedCoords = null,
  onLocationSelect,
  className = "h-[450px] w-full rounded-2xl",
}: CampusMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerGroupRef = useRef<any>(null);
  const selectedMarkerRef = useRef<any>(null);
  const onLocationSelectRef = useRef(onLocationSelect);

  // Keep callback ref fresh without triggering effects
  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect;
  }, [onLocationSelect]);

  const [isLoading, setIsLoading] = useState(true);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Default center: Cagayan de Oro City (Central C.M. Recto / Bitan-ag corridor)
  const defaultCenter = { lat: 8.4858, lng: 124.6565 };

  useEffect(() => {
    let isMounted = true;
    let localMap: any = null;

    async function initMap() {
      if (!mapContainerRef.current) return;

      // Clean up previous instance or lingering Leaflet container metadata
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {
          // ignore
        }
        mapInstanceRef.current = null;
      }

      if (mapContainerRef.current && (mapContainerRef.current as any)._leaflet_id != null) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }

      const L = (await import("leaflet")).default;
      if (!isMounted || !mapContainerRef.current) return;

      // Check again after dynamic import
      if ((mapContainerRef.current as any)._leaflet_id != null) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }

      // Configure default marker icons
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const initialCenter = selectedCoords || defaultCenter;

      try {
        localMap = L.map(mapContainerRef.current, {
          center: [initialCenter.lat, initialCenter.lng],
          zoom: 16,
          zoomControl: false,
        });
      } catch (err) {
        console.warn("Leaflet init handled:", err);
        return;
      }

      if (!isMounted) {
        localMap.remove();
        return;
      }

      mapInstanceRef.current = localMap;

      L.control.zoom({ position: "topright" }).addTo(localMap);

      // OpenStreetMap clean raster tiles with official attribution
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(localMap);

      const markerGroup = L.layerGroup().addTo(localMap);
      markerGroupRef.current = markerGroup;

      // Handle click for location selection
      if (selectable) {
        localMap.on("click", (e: any) => {
          const { lat, lng } = e.latlng;
          if (onLocationSelectRef.current) {
            onLocationSelectRef.current({
              lat: Number(lat.toFixed(6)),
              lng: Number(lng.toFixed(6)),
            });
          }
        });
      }

      setIsLoading(false);

      setTimeout(() => {
        if (localMap) {
          localMap.invalidateSize();
        }
      }, 100);
    }

    initMap();

    // Automatically recalculate map dimensions if container resizes (e.g. fullscreen)
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      isMounted = false;
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (localMap) {
        try {
          localMap.remove();
        } catch {
          // ignore
        }
      }
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {
          // ignore
        }
        mapInstanceRef.current = null;
      }
      if (mapContainerRef.current && (mapContainerRef.current as any)._leaflet_id != null) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }
    };
  }, []);

  // Update existing report pins
  useEffect(() => {
    if (!mapInstanceRef.current || !markerGroupRef.current) return;

    import("leaflet").then((LModule) => {
      if (!mapInstanceRef.current || !markerGroupRef.current) return;
      const L = LModule.default;
      markerGroupRef.current.clearLayers();

      pins.forEach((pin) => {
        let pinColor = "#30AFFF"; // Default Tubig Blue
        if (pin.priority_band === "High" || pin.review_state === "Needs inspection") {
          pinColor = "#EF4444"; // Red for high blockage
        } else if (pin.priority_band === "Low" || pin.review_state === "Verified") {
          pinColor = "#10B981"; // Green for verified/low
        }

        const customSvg = `
          <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 0C7.16344 0 0 7.16344 0 16C0 27.5 16 42 16 42C16 42 32 27.5 32 16C32 7.16344 24.8366 0 16 0Z" fill="${pinColor}"/>
            <circle cx="16" cy="16" r="7" fill="white"/>
          </svg>
        `;

        const icon = L.divIcon({
          className: "custom-map-marker",
          html: customSvg,
          iconSize: [32, 42],
          iconAnchor: [16, 42],
          popupAnchor: [0, -38],
        });

        const popupContent = `
          <div style="font-family: inherit; min-width: 180px; padding: 4px;">
            <div style="font-size: 11px; font-weight: 800; color: #64748B; text-transform: uppercase;">
              ${pin.reference_no} &bull; ${pin.review_state}
            </div>
            <div style="font-size: 14px; font-weight: 700; color: #0F172A; margin-top: 2px;">
              ${pin.location_name}
            </div>
            ${
              pin.description
                ? `<div style="font-size: 12px; color: #475569; margin-top: 4px;">${pin.description}</div>`
                : ""
            }
            <div style="margin-top: 8px; display: flex; align-items: center; justify-content: space-between;">
              <span style="font-size: 11px; font-weight: 700; background: ${pinColor}20; color: ${pinColor}; padding: 2px 8px; border-radius: 9999px;">
                ${pin.priority_band || "Medium"} Priority
              </span>
            </div>
          </div>
        `;

        L.marker([pin.latitude, pin.longitude], { icon })
          .bindPopup(popupContent)
          .addTo(markerGroupRef.current);
      });
    });
  }, [pins]);

  // Update selected coordinates pin (for report form)
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedCoords) return;

    import("leaflet").then((LModule) => {
      if (!mapInstanceRef.current) return;
      const L = LModule.default;

      if (selectedMarkerRef.current) {
        try {
          selectedMarkerRef.current.remove();
        } catch {
          // ignore
        }
      }

      const activePinSvg = `
        <svg width="36" height="48" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 0C7.16344 0 0 7.16344 0 16C0 27.5 16 42 16 42C16 42 32 27.5 32 16C32 7.16344 24.8366 0 16 0Z" fill="#30AFFF"/>
          <circle cx="16" cy="16" r="6" fill="#92EEFF"/>
        </svg>
      `;

      const icon = L.divIcon({
        className: "active-pin-marker",
        html: activePinSvg,
        iconSize: [36, 48],
        iconAnchor: [18, 48],
      });

      const marker = L.marker([selectedCoords.lat, selectedCoords.lng], {
        icon,
        draggable: selectable,
      }).addTo(mapInstanceRef.current);

      if (selectable) {
        marker.on("dragend", (e: any) => {
          const pos = e.target.getLatLng();
          if (onLocationSelectRef.current) {
            onLocationSelectRef.current({
              lat: Number(pos.lat.toFixed(6)),
              lng: Number(pos.lng.toFixed(6)),
            });
          }
        });
      }

      selectedMarkerRef.current = marker;
      mapInstanceRef.current.panTo([selectedCoords.lat, selectedCoords.lng], {
        animate: true,
      });
    });
  }, [selectedCoords, selectable]);

  // Handle GPS Auto-Locate
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser.");
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const coords = {
          lat: Number(latitude.toFixed(6)),
          lng: Number(longitude.toFixed(6)),
        };

        if (onLocationSelectRef.current) {
          onLocationSelectRef.current(coords);
        }

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([coords.lat, coords.lng], 18, {
            animate: true,
          });
        }
        setGpsLoading(false);
      },
      () => {
        setGpsLoading(false);
        setGpsError("Unable to retrieve GPS. Please select pin on map.");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className={`relative overflow-hidden border border-[#E2E8F0] shadow-sm ${className}`}>
      {/* MAP CANVAS */}
      <div ref={mapContainerRef} className="w-full h-full z-0 bg-[#F1F5F9]" />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#F8FAFC]/80 backdrop-blur-xs">
          <Loader2 className="w-6 h-6 animate-spin text-[#30AFFF]" />
          <span className="text-xs font-semibold text-[#475569] mt-2">
            Loading Campus Tiles...
          </span>
        </div>
      )}

      {/* Floating GPS Button */}
      <div className="absolute bottom-3 right-3 z-10 flex flex-col items-end gap-1.5">
        {gpsError && (
          <div className="px-2.5 py-1 bg-white border border-[#FCA5A5] text-[#DC2626] rounded-xl text-[11px] font-bold shadow-md">
            {gpsError}
          </div>
        )}
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={gpsLoading}
          className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-[#F8FAFC] text-[#0F172A] border border-[#E2E8F0] rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all cursor-pointer"
        >
          {gpsLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#30AFFF]" />
          ) : (
            <Navigation className="w-3.5 h-3.5 text-[#30AFFF]" />
          )}
          <span>{gpsLoading ? "Locating..." : "Locate"}</span>
        </button>
      </div>
    </div>
  );
}
