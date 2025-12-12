"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import { Icon } from "leaflet";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/shared/firebaseConfig";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";

const markerIcon = new Icon({
  iconUrl: "/druva-icon.png", // Custom icon for Druva vehicle (replace with actual icon)
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const DruvaTravelPage = () => {
  const router = useRouter();
  const [druvaPosition, setDruvaPosition] = useState<[number, number] | null>(null);
  const [route, setRoute] = useState<[number, number][]>([]); // Route array to track movement
  const [loading, setLoading] = useState(true);

  const mapRef = useRef(null);

  // Load Druva's position and route
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/track/login");
        return;
      }

      await loadDruvaPosition();
    });

    return () => unsub();
  }, []);

  // Load Druva's position from Firestore
  const loadDruvaPosition = async () => {
    setLoading(true);

    try {
      const druvaDoc = await getDoc(doc(db, "druvaStatus", "vehicle-1"));

      if (druvaDoc.exists()) {
        const data = druvaDoc.data();
        if (data.route && data.route.length > 0) {
          setRoute(data.route); // Set the route from Firestore
          setDruvaPosition(data.route[data.route.length - 1]); // Get the latest position
        }
      }
    } catch (error) {
      console.error("Error loading Druva position:", error);
    } finally {
      setLoading(false);
    }
  };

  // Update Druva position in Firestore (simulating movement)
  const updateDruvaPosition = async (newPosition: [number, number]) => {
    try {
      const routeCopy = [...route, newPosition]; // Add new position to route
      await updateDoc(doc(db, "druvaStatus", "vehicle-1"), {
        route: routeCopy,
        lastUpdated: serverTimestamp(),
      });
      setRoute(routeCopy); // Update local route state
      setDruvaPosition(newPosition); // Update Druva position
    } catch (error) {
      console.error("Error updating Druva position:", error);
    }
  };

  // Simulate moving Druva (you can replace this with actual GPS data)
  useEffect(() => {
    if (route.length > 0) {
      const lastPosition = route[route.length - 1];
      const movementInterval = setInterval(() => {
        const newLat = lastPosition[0] + Math.random() * 0.0001;
        const newLng = lastPosition[1] + Math.random() * 0.0001;
        updateDruvaPosition([newLat, newLng]);
      }, 2000); // Update position every 2 seconds (simulation)

      return () => clearInterval(movementInterval);
    }
  }, [route]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7E8FF]">
        <div className="h-10 w-10 border-4 border-[#A259FF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#F7E8FF]">
      <MapContainer
        center={druvaPosition || [51.505, -0.09]} // Default center if no position
        zoom={13}
        style={{ width: "100%", height: "100vh" }}
        ref={mapRef}
        scrollWheelZoom={false}
      >
        {/* Base Layer */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Druva Vehicle Marker */}
        {druvaPosition && (
          <Marker position={druvaPosition} icon={markerIcon}>
            <Popup>Druva Vehicle</Popup>
          </Marker>
        )}

        {/* Route (Polyline) */}
        {route.length > 0 && <Polyline positions={route} color="blue" weight={4} />}

      </MapContainer>
    </div>
  );
};

export default DruvaTravelPage;
