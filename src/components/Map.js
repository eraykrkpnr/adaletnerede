import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from 'leaflet';
import { createPortal } from 'react-dom';

const defaultIcon = new L.Icon({
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});

// Component to handle map click events for location selection
function LocationPicker({ onLocationSelect, isActive }) {
    useMapEvents({
        click: (e) => {
            if (isActive) {
                onLocationSelect(e.latlng);
            }
        }
    });
    return null;
}

// Custom button in bottom-right corner
function AddEventControl({ onClick }) {
    return (
        <div className="leaflet-bottom leaflet-right" style={{ zIndex: 1000 }}>
            <div className="leaflet-control leaflet-bar">
                <button
                    className="bg-blue-600 text-white px-6 py-3 rounded-md shadow-lg hover:bg-blue-700 transition-colors text-lg font-medium cursor-pointer"
                    onClick={onClick}
                >
                    Olay ekle
                </button>
            </div>
        </div>
    );
}
export default function Map({ protests }) {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [pickingLocation, setPickingLocation] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        date: new Date().toISOString().slice(0, 16),
        location: { lat: null, lng: null }
    });
    const [portalContainer, setPortalContainer] = useState(null);

    useEffect(() => {
        // Set the portal container to be the document body
        setPortalContainer(document.body);
    }, []);

    const handleLocationSelect = (latlng) => {
        setFormData(prev => ({
            ...prev,
            location: { lat: latlng.lat, lng: latlng.lng }
        }));
        setPickingLocation(false);
        // After selecting location, re-open the form
        setIsFormOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/protests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                window.location.reload();
            } else {
                alert('Olay eklerken bir hata oluştu.');
            }
        } catch (error) {
            console.error("Error submitting protest:", error);
        }
        setIsFormOpen(false);
    };

    // Function to handle button click
    const handleAddEventClick = () => {
        console.log("Add event button clicked");  // Add this for debugging
        setIsFormOpen(true);
    };

    return (
        <>
            <MapContainer
                center={[39.9208, 32.8541]}
                zoom={6}
                className="w-full h-full"
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                {protests.map((protest) => (
                    protest.location &&
                    typeof protest.location.lat === 'number' &&
                    typeof protest.location.lng === 'number' ? (
                        <Marker
                            key={protest.id}
                            position={[protest.location.lat, protest.location.lng]}
                            icon={defaultIcon}
                        >
                            <Popup>
                                <h3>{protest.name}</h3>
                                <p>{protest.description}</p>
                                <small>{new Date(protest.date).toLocaleString()}</small>
                            </Popup>
                        </Marker>
                    ) : null
                ))}

                <LocationPicker onLocationSelect={handleLocationSelect} isActive={pickingLocation} />
                <AddEventControl onClick={handleAddEventClick} />
            </MapContainer>

            {/* Render modals outside of MapContainer using portal */}
            {portalContainer && isFormOpen && createPortal(
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000]">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full text-black" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold mb-4 text-black">Yeni Olay Ekle</h2>

                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1 text-black">İsim</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    className="w-full border rounded px-3 py-2 text-black"
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1 text-black">Açıklama</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({...formData, description: e.target.value})}
                                    className="w-full border rounded px-3 py-2 text-black"
                                    rows="3"
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1 text-black">Tarih</label>
                                <input
                                    type="datetime-local"
                                    value={formData.date}
                                    onChange={e => setFormData({...formData, date: e.target.value})}
                                    className="w-full border rounded px-3 py-2 text-black"
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1 text-black">Konum</label>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsFormOpen(false);
                                            setPickingLocation(true);
                                        }}
                                        className="bg-white text-blue-600 border border-blue-600 px-3 py-1 rounded"
                                    >
                                        Haritada Seç
                                    </button>
                                    <span className={formData.location.lat ? "text-green-600" : "text-red-600"}>
                            {formData.location.lat
                                ? `${formData.location.lat.toFixed(4)}, ${formData.location.lng.toFixed(4)}`
                                : "Konum seçilmedi"}
                        </span>
                                </div>
                            </div>

                            <div className="flex justify-between mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsFormOpen(false)}
                                    className="bg-white text-blue-600 border border-blue-600 px-4 py-2 rounded"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    className="bg-blue-600 text-white border-blue-600 px-4 py-2 rounded"
                                    disabled={!formData.location.lat}
                                >
                                    Kaydet
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                portalContainer
            )}

            {portalContainer && pickingLocation && createPortal(
                <div className="fixed top-0 inset-x-0 bg-blue-600 text-white p-2 text-center z-[2000]">
                    Konum seçmek için haritaya tıklayın
                    <button
                        className="ml-4 bg-white text-blue-600 px-2 py-1 rounded text-sm"
                        onClick={() => setPickingLocation(false)}
                    >
                        İptal
                    </button>
                </div>,
                portalContainer
            )}
        </>
    );
}