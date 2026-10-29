/**
 * Reverse geocode coordinates to street or area in Cagayan de Oro City.
 * Combines high-speed known landmark proximity with OpenStreetMap Nominatim.
 */

// Key CDO drainage hotspots for instant zero-latency matching (<100m)
const KNOWN_CDO_ZONES = [
  { name: "USTP Engineering Drain, C.M. Recto Ave", lat: 8.4856, lng: 124.6562 },
  { name: "Limketkai Bitan-ag Creek, Lapasan", lat: 8.4835, lng: 124.6580 },
  { name: "Science Complex, C.M. Recto Ave", lat: 8.4862, lng: 124.6569 },
  { name: "C.M. Recto Ave Overpass, Lapasan", lat: 8.4850, lng: 124.6530 },
  { name: "Cogon Public Market, J.R. Borja St", lat: 8.4770, lng: 124.6495 },
  { name: "Plaza Divisoria, R.N. Abejuela St", lat: 8.4784, lng: 124.6439 },
  { name: "Xavier University Main Gate, Corrales Ave", lat: 8.4795, lng: 124.6472 },
  { name: "Provincial Capitol Grounds, Velez St", lat: 8.4815, lng: 124.6480 },
  { name: "Carmen Public Market, Vamenta Blvd", lat: 8.4812, lng: 124.6335 },
  { name: "Liceo de Cagayan Main Channel, R.N. Pelaez Blvd", lat: 8.4945, lng: 124.6410 },
  { name: "Carmen Riverwalk Outfall, Cagayan River", lat: 8.4830, lng: 124.6390 },
  { name: "Macanhan Floodway Inlet, Carmen", lat: 8.4680, lng: 124.6350 },
  { name: "Agora Public Market, Gaabucayan St", lat: 8.4905, lng: 124.6620 },
  { name: "Bitan-ag Creek Coastal Outfall, Lapasan", lat: 8.4930, lng: 124.6655 },
  { name: "Lapasan National Highway Canal", lat: 8.4880, lng: 124.6610 },
];

function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export async function reverseGeocodeCDO(lat: number, lng: number): Promise<string> {
  // 1. Fast match: Check if within 120m of known CDO drainage landmark
  for (const hotspot of KNOWN_CDO_ZONES) {
    if (getDistanceMeters(lat, lng, hotspot.lat, hotspot.lng) <= 120) {
      return hotspot.name;
    }
  }

  // 2. OpenStreetMap Nominatim reverse lookup
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      {
        headers: {
          "Accept-Language": "en",
          "User-Agent": "SubAICDO/1.0",
        },
        signal: AbortSignal.timeout(3500),
      }
    );

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};

      const road =
        addr.road ||
        addr.pedestrian ||
        addr.amenity ||
        addr.building ||
        addr.commercial ||
        addr.shop;

      const barangay =
        addr.quarter ||
        addr.suburb ||
        addr.neighbourhood ||
        addr.village ||
        addr.city_district;

      if (road && barangay) {
        const cleanBrgy = barangay.replace(/^Barangay\s+/i, "Brgy. ");
        return `${road}, ${cleanBrgy}`;
      }

      if (road) {
        return `${road}, Cagayan de Oro`;
      }

      if (barangay) {
        return `Brgy. ${barangay.replace(/^Barangay\s+/i, "")}, CDO`;
      }

      if (data.display_name) {
        return data.display_name.split(",").slice(0, 2).join(",").trim();
      }
    }
  } catch {
    // Network fallback
  }

  // 3. Fallback coordinate label
  return `Cagayan de Oro (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
}
