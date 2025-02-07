import "./App.css";
import { useState } from "react";
import {
  GoogleMap,
  LoadScript,
  Marker,
  DirectionsRenderer,
} from "@react-google-maps/api";

const GOOGLE_MAPS_API_KEY = process.env.VITE_GOOGLEMAPS_API_KEY as string;

const center = {
  // Default center if no data is available yet
  lat: 39.8097343,
  lng: -98.5556199,
};

const mapContainerStyle = { width: "100vw", height: "650px" };

function App() {
  const [origin, setOrigin] = useState<google.maps.LatLngLiteral | null>(null);
  const [destination, setDestination] =
    useState<google.maps.LatLngLiteral | null>(null);
  const [directions, setDirections] =
    useState<google.maps.DirectionsResult | null>(null);

  const [routeData, setRouteData] = useState<any>(null);
  // Handle click to set origin/destination
  const handleMapClick = (event: google.maps.MapMouseEvent) => {
    if (!event.latLng) return;
    const location = { lat: event.latLng.lat(), lng: event.latLng.lng() };

    if (!origin) {
      setOrigin(location);
    } else if (!destination) {
      setDestination(location);
    }
  };

  // Call your API to get optimized route
  const fetchRoute = async () => {
    if (!origin || !destination) return;
    console.log(origin, destination);
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/get_route/?start_lat=${origin.lat}&start_lng=${origin.lng}&end_lat=${destination.lat}&end_lng=${destination.lng}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          // body: JSON.stringify({ origin, destination }),
        }
      );

      const data = await response.json(); // Expected to return waypoints including gas stations
      console.log(data);
      setRouteData(data);
      if (data.routes) {
        // Extract waypoints from the response
        const waypoints = data.routes
          .filter((point: any) => point.fuel_to_buy && point.fuel_to_buy > 0) // Optional: Exclude truck stops if needed
          .map((point: any) => ({
            location: { lat: point.lat, lng: point.lng },
            stopover: true,
          }));
        console.log(waypoints);
        renderRoute(waypoints);
      }
    } catch (error) {
      console.error("Error fetching route:", error);
    }
  };

  // Use Google Maps Directions API to draw the route
  const renderRoute = (waypoints: { lat: number; lng: number }[]) => {
    if (!origin || !destination) return;
    const directionsService = new google.maps.DirectionsService();
    directionsService.route(
      {
        origin,
        destination,
        waypoints: waypoints as google.maps.DirectionsWaypoint[],
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
          setDirections(result);
        } else {
          console.error("Directions request failed:", status);
        }
      }
    );
  };

  return (
    <>
      <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={5}
          onClick={handleMapClick}
        >
          {origin && <Marker position={origin} label="A" />}
          {destination && <Marker position={destination} label="B" />}
          {directions && <DirectionsRenderer directions={directions} />}
        </GoogleMap>
        <button
          onClick={fetchRoute}
          disabled={!origin || !destination}
          style={{ marginTop: 10 }}
        >
          Get Route
        </button>
        {directions && (
          <p style={{ padding: 10 }}>
            Cost:{" "}
            <span style={{ fontWeight: "bold" }}>
              {Math.round(routeData?.cum_cost * 100) / 100} $
            </span>
          </p>
        )}
      </LoadScript>
    </>
  );
}

export default App;
