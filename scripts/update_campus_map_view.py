with open('src/components/map/CampusMap.tsx', 'r', encoding='utf-8') as f:
    text = f.read().replace('\r\n', '\n')

old_props = """interface CampusMapProps {
  pins?: MapReportPin[];
  selectable?: boolean;
  selectedCoords?: { lat: number; lng: number } | null;
  onLocationSelect?: (coords: { lat: number; lng: number }) => void;
  onPinSelect?: (pin: MapReportPin) => void;
  className?: string;
}"""

new_props = """interface CampusMapProps {
  pins?: MapReportPin[];
  selectable?: boolean;
  selectedCoords?: { lat: number; lng: number } | null;
  onLocationSelect?: (coords: { lat: number; lng: number }) => void;
  onPinSelect?: (pin: MapReportPin) => void;
  focusedPinId?: string | null;
  onVisiblePinsChange?: (visibleIds: string[]) => void;
  className?: string;
}"""

text = text.replace(old_props, new_props)

old_fn = """export function CampusMap({
  pins = [],
  selectable = false,
  selectedCoords = null,
  onLocationSelect,
  onPinSelect,
  className = "h-[450px] w-full rounded-2xl",
}: CampusMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerGroupRef = useRef<any>(null);
  const selectedMarkerRef = useRef<any>(null);
  const onLocationSelectRef = useRef(onLocationSelect);
  const onPinSelectRef = useRef(onPinSelect);"""

new_fn = """export function CampusMap({
  pins = [],
  selectable = false,
  selectedCoords = null,
  onLocationSelect,
  onPinSelect,
  focusedPinId = null,
  onVisiblePinsChange,
  className = "h-[450px] w-full rounded-2xl",
}: CampusMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerGroupRef = useRef<any>(null);
  const selectedMarkerRef = useRef<any>(null);
  const markersMapRef = useRef<Record<string, any>>({});
  const onLocationSelectRef = useRef(onLocationSelect);
  const onPinSelectRef = useRef(onPinSelect);
  const onVisiblePinsChangeRef = useRef(onVisiblePinsChange);"""

text = text.replace(old_fn, new_fn)

# Keep onVisiblePinsChangeRef updated
old_refs = """  useEffect(() => {
    onPinSelectRef.current = onPinSelect;
  }, [onPinSelect]);"""

new_refs = """  useEffect(() => {
    onPinSelectRef.current = onPinSelect;
  }, [onPinSelect]);

  useEffect(() => {
    onVisiblePinsChangeRef.current = onVisiblePinsChange;
  }, [onVisiblePinsChange]);"""

text = text.replace(old_refs, new_refs)

# Track markers in markersMapRef
old_marker_add = """        const marker = L.marker([pin.latitude, pin.longitude], { icon })
          .bindPopup(popupContent, {
            maxWidth: 280,
            minWidth: 230,
            className: "tubig-map-custom-popup",
          })
          .addTo(markerGroupRef.current);

        marker.on("click", () => {
          if (onPinSelectRef.current) {
            onPinSelectRef.current(pin);
          }
        });"""

new_marker_add = """        const marker = L.marker([pin.latitude, pin.longitude], { icon })
          .bindPopup(popupContent, {
            maxWidth: 280,
            minWidth: 230,
            className: "tubig-map-custom-popup",
          })
          .addTo(markerGroupRef.current);

        markersMapRef.current[pin.id] = marker;

        marker.on("click", () => {
          if (onPinSelectRef.current) {
            onPinSelectRef.current(pin);
          }
        });"""

text = text.replace(old_marker_add, new_marker_add)

# Clear markersMapRef before populating
old_clear = """      markerGroupRef.current.clearLayers();"""
new_clear = """      markerGroupRef.current.clearLayers();
      markersMapRef.current = {};"""

text = text.replace(old_clear, new_clear)

# Add FlyTo effect for focusedPinId & bounds change listener
fly_effect = """
  // Smoothly pan & zoom to focused pin from side panel
  useEffect(() => {
    if (!mapInstanceRef.current || !focusedPinId) return;
    const targetPin = pins.find((p) => p.id === focusedPinId);
    const targetMarker = markersMapRef.current[focusedPinId];

    if (targetPin && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([targetPin.latitude, targetPin.longitude], 17, {
        animate: true,
        duration: 0.8,
      });
      if (targetMarker) {
        setTimeout(() => {
          try {
            targetMarker.openPopup();
          } catch {
            // ignore
          }
        }, 400);
      }
    }
  }, [focusedPinId, pins]);

  // Track which pins are currently within map view bounds
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const checkVisible = () => {
      if (!mapInstanceRef.current || !onVisiblePinsChangeRef.current) return;
      try {
        const bounds = mapInstanceRef.current.getBounds();
        const visibleIds = pins
          .filter((p) => bounds.contains([p.latitude, p.longitude]))
          .map((p) => p.id);
        onVisiblePinsChangeRef.current(visibleIds);
      } catch {
        // ignore
      }
    };

    mapInstanceRef.current.on("moveend", checkVisible);
    // Initial check after short delay
    const timer = setTimeout(checkVisible, 300);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.off("moveend", checkVisible);
      }
    };
  }, [pins]);
"""

# Insert before handleLocateMe
text = text.replace("  // Handle GPS Auto-Locate", fly_effect + "\n  // Handle GPS Auto-Locate")

with open('src/components/map/CampusMap.tsx', 'w', encoding='utf-8', newline='\r\n') as f:
    f.write(text)

print('Updated CampusMap.tsx with focusedPinId and visible bounds tracking!')
