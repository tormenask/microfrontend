import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Phone, Clock, Package, CheckCircle, Navigation } from 'lucide-react';

// Corrección para iconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Coordenadas
const RESTAURANT_COORD = [40.7128, -74.0060];
const INITIAL_COORDS = [40.7600, -73.9800];

const SIMULATED_ROUTE = [
    [40.7600, -73.9800],
    [40.7500, -73.9700],
    [40.7400, -73.9600],
    [40.7300, -73.9500],
    [40.7200, -73.9400],
    RESTAURANT_COORD,
];

const orderStatusMap = {
    0: { text: "En camino hacia ti", icon: "🚗", color: "blue" },
    1: { text: "¡Muy cerca!", icon: "🚨", color: "orange" },
    2: { text: "¡Entregado!", icon: "🎉", color: "green" }
};

const OrderTracker = () => {
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const mapInstance = useRef(null);
    const polylineRef = useRef(null);
    const [currentPositionIndex, setCurrentPositionIndex] = useState(0);
    const [statusKey, setStatusKey] = useState(0);
    const [isDelivered, setIsDelivered] = useState(false);
    const [progress, setProgress] = useState(0);
    const [estimatedTime, setEstimatedTime] = useState(8);

    // Inicializar el mapa
    useEffect(() => {
        const map = L.map(mapRef.current, {
            zoomControl: false,
            attributionControl: false
        }).setView(INITIAL_COORDS, 13);

        mapInstance.current = map;

        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '© CartoDB, © OpenStreetMap contributors',
            maxZoom: 19,
        }).addTo(map);

        // Agregar controles de zoom con estilo personalizado
        L.control.zoom({ position: 'bottomright' }).addTo(map);

        // Crear la polilínea de la ruta
        const polyline = L.polyline(SIMULATED_ROUTE, {
            color: '#6366f1',
            weight: 5,
            opacity: 0.7,
            dashArray: '10, 10',
            dashOffset: '0'
        }).addTo(map);

        polylineRef.current = polyline;

        // Ajustar vista a la ruta
        map.fitBounds(polyline.getBounds(), { padding: [50, 50] });

        // Marcador del RESTAURANTE (punto inicial)
        const restaurantIcon = L.divIcon({
            className: 'custom-restaurant-marker',
            html: `
                <div class="relative">
                    <div class="absolute -inset-2 bg-orange-400 rounded-full animate-ping opacity-75"></div>
                    <div class="relative bg-gradient-to-br from-orange-400 to-red-500 rounded-full w-12 h-12 flex items-center justify-center text-white font-bold shadow-lg ring-4 ring-orange-200">
                        <span class="text-xl">🍔</span>
                    </div>
                </div>
            `,
            iconSize: [48, 48],
            iconAnchor: [24, 24]
        });

        L.marker(INITIAL_COORDS, { icon: restaurantIcon })
            .addTo(map)
            .bindPopup("<strong>🍔 Restaurante</strong><br/>Punto de origen");

        // Marcador del destino (cliente - punto final)
        const destinationIcon = L.divIcon({
            className: 'custom-destination-marker',
            html: `
                <div class="relative">
                    <div class="absolute -inset-2 bg-green-400 rounded-full animate-ping opacity-75"></div>
                    <div class="relative bg-gradient-to-br from-green-400 to-emerald-500 rounded-full w-12 h-12 flex items-center justify-center text-white font-bold shadow-lg ring-4 ring-green-200">
                        <span class="text-xl">🏠</span>
                    </div>
                </div>
            `,
            iconSize: [48, 48],
            iconAnchor: [24, 24]
        });

        L.marker(RESTAURANT_COORD, { icon: destinationIcon })
            .addTo(map)
            .bindPopup("<strong>🏠 Tu Ubicación</strong><br/>Destino de entrega");

        // Marcador del repartidor
        const deliveryIcon = L.divIcon({
            className: 'custom-delivery-marker',
            html: `
                <div class="relative">
                    <div class="absolute -inset-2 bg-indigo-400 rounded-full animate-pulse opacity-75"></div>
                    <div class="relative bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full w-14 h-14 flex items-center justify-center text-white font-bold shadow-2xl ring-4 ring-indigo-200">
                        <span class="text-2xl">🛵</span>
                    </div>
                </div>
            `,
            iconSize: [56, 56],
            iconAnchor: [28, 28]
        });

        const initialMarker = L.marker(INITIAL_COORDS, { icon: deliveryIcon })
            .addTo(map)
            .bindPopup("<strong>🛵 Repartidor</strong><br/>En camino");

        markerRef.current = initialMarker;

        return () => {
            map.remove();
        };
    }, []);

    // Simulación de actualización de ubicación
    useEffect(() => {
        if (isDelivered) return;

        const intervalId = setInterval(() => {
            setCurrentPositionIndex(prevIndex => {
                const nextIndex = prevIndex + 1;

                if (nextIndex >= SIMULATED_ROUTE.length) {
                    clearInterval(intervalId);
                    setIsDelivered(true);
                    setStatusKey(2);
                    setProgress(100);
                    setEstimatedTime(0);
                    return prevIndex;
                }

                // Actualizar progreso
                const newProgress = (nextIndex / (SIMULATED_ROUTE.length - 1)) * 100;
                setProgress(newProgress);

                // Actualizar tiempo estimado
                const remainingSteps = SIMULATED_ROUTE.length - 1 - nextIndex;
                setEstimatedTime(Math.max(1, remainingSteps * 1.5));

                if (nextIndex === SIMULATED_ROUTE.length - 1) {
                    setStatusKey(1);
                } else {
                    setStatusKey(0);
                }

                return nextIndex;
            });
        }, 3000);

        return () => clearInterval(intervalId);
    }, [isDelivered]);

    // Mover el marcador
    useEffect(() => {
        if (!markerRef.current || !mapInstance.current) return;

        const newCoords = SIMULATED_ROUTE[currentPositionIndex];
        markerRef.current.setLatLng(newCoords);

        // Centrar suavemente en el marcador
        mapInstance.current.panTo(newCoords, { animate: true, duration: 1 });

    }, [currentPositionIndex]);

    const currentStatus = orderStatusMap[statusKey];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">

                {/* Header Principal */}
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-6 border border-indigo-100">
                    <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 md:p-8 text-white relative overflow-hidden">
                        <div className="absolute inset-0 bg-black opacity-10"></div>
                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex items-center gap-4">
                                <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl">
                                    <Package className="w-8 h-8" />
                                </div>
                                <div>
                                    <h1 className="text-3xl md:text-4xl font-bold mb-1">Seguimiento en Vivo</h1>
                                    <p className="text-indigo-100 text-sm">Pedido #000123456</p>
                                </div>
                            </div>
                            <div className={`px-6 py-3 rounded-full font-bold text-sm shadow-lg ${isDelivered
                                    ? 'bg-green-500 animate-pulse'
                                    : 'bg-white/20 backdrop-blur-sm border-2 border-white/30'
                                }`}>
                                {isDelivered ? '✓ FINALIZADO' : '● EN VIVO'}
                            </div>
                        </div>
                    </div>

                    {/* Barra de Progreso */}
                    <div className="bg-gradient-to-r from-gray-100 to-gray-50 px-6 py-4">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-semibold text-gray-600">Progreso de Entrega</span>
                            <span className="text-sm font-bold text-indigo-600">{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                            <div
                                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-1000 ease-out shadow-lg"
                                style={{ width: `${progress}%` }}
                            >
                                <div className="h-full w-full bg-white/30 animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Grid de Información */}
                <div className="grid md:grid-cols-3 gap-6 mb-6">

                    {/* Card Estado */}
                    <div className={`bg-white rounded-2xl shadow-xl p-6 border-2 transition-all duration-500 transform hover:scale-105 ${currentStatus.color === 'green' ? 'border-green-300 bg-gradient-to-br from-green-50 to-emerald-50' :
                            currentStatus.color === 'orange' ? 'border-orange-300 bg-gradient-to-br from-orange-50 to-amber-50' :
                                'border-indigo-300 bg-gradient-to-br from-indigo-50 to-purple-50'
                        }`}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`p-3 rounded-xl ${currentStatus.color === 'green' ? 'bg-green-500' :
                                    currentStatus.color === 'orange' ? 'bg-orange-500' :
                                        'bg-indigo-500'
                                }`}>
                                <MapPin className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="font-bold text-lg text-gray-800">Estado</h3>
                        </div>
                        <div className="text-3xl font-bold mb-2">{currentStatus.icon}</div>
                        <p className="text-xl font-semibold text-gray-800">{currentStatus.text}</p>
                        <p className="text-sm text-gray-500 mt-2">Actualización en tiempo real</p>
                    </div>

                    {/* Card Tiempo Estimado */}
                    <div className="bg-white rounded-2xl shadow-xl p-6 border border-blue-100 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-gradient-to-br from-blue-400 to-cyan-500 p-3 rounded-xl">
                                <Clock className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="font-bold text-lg text-gray-800">Tiempo Estimado</h3>
                        </div>
                        <div className="text-4xl font-bold text-blue-600 mb-1">
                            {estimatedTime} min
                        </div>
                        <p className="text-sm text-gray-500">
                            {isDelivered ? '¡Ya llegó!' : 'Tiempo restante aproximado'}
                        </p>
                        <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                            <Navigation className="w-4 h-4" />
                            <span>Actualización cada 3 seg</span>
                        </div>
                    </div>

                    {/* Card Repartidor */}
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl shadow-xl p-6 text-white hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                                <Phone className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-lg">Repartidor</h3>
                        </div>
                        <div className="text-2xl font-bold mb-1">Juan Pérez</div>
                        <p className="text-indigo-100 text-sm mb-4">⭐ 4.9 • 1,234 entregas</p>
                        <button
                            className="w-full bg-white text-indigo-600 font-bold py-3 px-4 rounded-xl shadow-lg hover:bg-indigo-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            disabled={isDelivered}
                        >
                            <Phone className="w-4 h-4" />
                            {isDelivered ? '¡Disfruta!' : 'Llamar Ahora'}
                        </button>
                    </div>
                </div>

                {/* Mapa */}
                <div className="bg-white rounded-3xl shadow-2xl p-4 border border-indigo-100">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-indigo-600" />
                            Ubicación en Tiempo Real
                        </h2>
                        {!isDelivered && (
                            <div className="flex items-center gap-2 bg-red-50 px-3 py-1 rounded-full">
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                <span className="text-xs font-semibold text-red-600">EN VIVO</span>
                            </div>
                        )}
                    </div>

                    <div
                        ref={mapRef}
                        className="w-full h-[500px] rounded-2xl overflow-hidden shadow-inner border-2 border-gray-100"
                        id="leaflet-map-container"
                    />

                    <div className="mt-4 flex items-center justify-center gap-6 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                            <span>Ruta del repartidor</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xl">🍔</span>
                            <span>Restaurante (Inicio)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xl">🛵</span>
                            <span>Posición actual</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xl">🏠</span>
                            <span>Tu ubicación (Destino)</span>
                        </div>
                    </div>
                </div>

                {/* Footer con Confirmación */}
                {isDelivered && (
                    <div className="mt-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-3xl shadow-2xl p-8 text-white text-center animate-fade-in">
                        <CheckCircle className="w-16 h-16 mx-auto mb-4" />
                        <h2 className="text-3xl font-bold mb-2">¡Pedido Entregado!</h2>
                        <p className="text-green-100 mb-6">Esperamos que disfrutes tu comida 🎉</p>
                        <button className="bg-white text-green-600 font-bold py-3 px-8 rounded-xl shadow-lg hover:bg-green-50 transition-all duration-200">
                            Calificar Experiencia
                        </button>
                    </div>
                )}
            </div>

            <style jsx>{`
                @keyframes fade-in {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fade-in {
                    animation: fade-in 0.6s ease-out;
                }
            `}</style>
        </div>
    );
};

export default OrderTracker;