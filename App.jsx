import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, DollarSign, Clock, Heart, X, 
  MessageSquare, User, Building, Search, 
  Sliders, Navigation, Camera, Image as ImageIcon, Upload,
  UserCheck, Crosshair, Map as MapIcon, Check, Save, Loader2
} from 'lucide-react';

// Importaciones de Firebase
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, addDoc, onSnapshot, query, where,
  doc, setDoc, getDoc, serverTimestamp 
} from 'firebase/firestore';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB9naI5Ao7-TvszmaZUI1Cia99qvQL_7Iw",
  authDomain: "chambacerca-ca0c9.firebaseapp.com",
  projectId: "chambacerca-ca0c9",
  storageBucket: "chambacerca-ca0c9.firebasestorage.app",
  messagingSenderId: "256126044044",
  appId: "1:256126044044:web:e87aefa59bb3d8b8c638a9",
  measurementId: "G-SENSF6XZ3L"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Obtener o generar ID único de usuario persistente
const getUserId = () => {
  let uid = localStorage.getItem('chamba_user_id');
  if (!uid) {
    uid = 'usr_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    localStorage.setItem('chamba_user_id', uid);
  }
  return uid;
};

// Haversine para distancia exacta en Km
function calculateDistanceInKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return c.toFixed(1);
}

// Convertir archivo de imagen a Base64
const convertFileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

// Candidatos demo de respaldo
const DEMO_CANDIDATES = [
  {
    id: 'cand-1',
    name: 'Sofía Martínez',
    age: '21 años',
    role: 'Atención a Clientes / Barista',
    skills: 'Manejo de caja, Preparación de café, Trabajo en equipo',
    bio: 'Estudiante universitaria buscando empleo de medio tiempo. Experiencia previa de 1 año en cafeterías.',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    banner: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=500',
    lat: 19.4326,
    lng: -99.1332
  },
  {
    id: 'cand-2',
    name: 'Carlos Mendoza',
    age: '19 años',
    role: 'Auxiliar General / Repartidor',
    skills: 'Licencia de conducir, Puntualidad, Proactivo',
    bio: 'Disponibilidad inmediata para turnos matutinos o vespertinos. Excelente actitud de servicio.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    banner: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=500',
    lat: 19.4350,
    lng: -99.1400
  }
];

// COMPONENTE DE MAPA INTERACTIVO (LEAFLET DYNAMIC LOAD)
const MapPickerModal = ({ initialCoords, userCoords, onConfirm, onClose }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCoords, setSelectedCoords] = useState(
    initialCoords || userCoords || { lat: 19.4326, lng: -99.1332 }
  );
  const [addressName, setAddressName] = useState('Cargando dirección...');

  useEffect(() => {
    const loadLeaflet = async () => {
      if (!window.L) {
        const css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(css);

        await new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = resolve;
          document.body.appendChild(script);
        });
      }
      initMap();
    };

    loadLeaflet();
  }, []);

  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      if (data && data.display_name) {
        const parts = data.display_name.split(',');
        const shortAddress = parts.slice(0, 3).join(',');
        setAddressName(shortAddress);
      } else {
        setAddressName(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
      }
    } catch {
      setAddressName(`Ubicación seleccionada (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
    }
  };

  const initMap = () => {
    if (!mapContainerRef.current || mapInstanceRef.current || !window.L) return;

    const L = window.L;
    const initialLat = selectedCoords.lat;
    const initialLng = selectedCoords.lng;

    const map = L.map(mapContainerRef.current).setView([initialLat, initialLng], 16);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map);

    const customIcon = L.divIcon({
      className: 'custom-pin',
      html: `<div style="background-color: #4f46e5; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: 10px;">📍</div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const marker = L.marker([initialLat, initialLng], { draggable: true, icon: customIcon }).addTo(map);
    markerRef.current = marker;

    reverseGeocode(initialLat, initialLng);

    marker.on('dragend', (e) => {
      const pos = e.target.getLatLng();
      setSelectedCoords({ lat: pos.lat, lng: pos.lng });
      reverseGeocode(pos.lat, pos.lng);
    });

    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      setSelectedCoords({ lat, lng });
      reverseGeocode(lat, lng);
    });
  };

  const handleSearchOnMap = async (e) => {
    e.preventDefault();
    if (!searchQuery) return;

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const newLat = parseFloat(data[0].lat);
        const newLng = parseFloat(data[0].lon);

        setSelectedCoords({ lat: newLat, lng: newLng });
        setAddressName(data[0].display_name);

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([newLat, newLng], 16);
          markerRef.current.setLatLng([newLat, newLng]);
        }
      } else {
        alert("Ubicación no encontrada. Intenta con más detalles.");
      }
    } catch {
      alert("Error al buscar dirección.");
    }
  };

  const handleUseCurrentGps = () => {
    if (userCoords && mapInstanceRef.current && markerRef.current) {
      setSelectedCoords(userCoords);
      mapInstanceRef.current.setView([userCoords.lat, userCoords.lng], 16);
      markerRef.current.setLatLng([userCoords.lat, userCoords.lng]);
      reverseGeocode(userCoords.lat, userCoords.lng);
    } else {
      alert("Obteniendo GPS...");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex flex-col justify-end sm:justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-md mx-auto rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[85vh]">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Selecciona la ubicación exacta</h3>
            <p className="text-[10px] text-slate-500">Haz clic en el mapa o arrastra el pin hasta tu local</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-200 text-slate-600 rounded-full">
            <X size={16} />
          </button>
        </div>

        <div className="p-3 bg-white border-b border-slate-100 space-y-2">
          <form onSubmit={handleSearchOnMap} className="flex gap-2">
            <input 
              type="text" 
              placeholder="Buscar colonia, calle o ciudad..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-slate-100 px-3 py-2 rounded-xl text-xs outline-none"
            />
            <button type="submit" className="bg-indigo-600 text-white px-3 py-2 rounded-xl text-xs font-bold">
              Buscar
            </button>
          </form>

          <button 
            type="button" 
            onClick={handleUseCurrentGps}
            className="w-full bg-indigo-50 text-indigo-700 text-xs font-semibold py-1.5 rounded-xl flex items-center justify-center space-x-1"
          >
            <Crosshair size={14} />
            <span>Centrar en mi posición GPS actual</span>
          </button>
        </div>

        <div className="flex-1 relative w-full bg-slate-100">
          <div ref={mapContainerRef} className="w-full h-full z-10"></div>
        </div>

        <div className="p-4 bg-white border-t border-slate-100 space-y-3">
          <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 flex items-start space-x-2">
            <MapPin size={18} className="text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Dirección seleccionada:</p>
              <p className="text-xs font-medium text-slate-700 leading-tight">{addressName}</p>
            </div>
          </div>

          <button 
            type="button"
            onClick={() => onConfirm({ coords: selectedCoords, address: addressName })}
            className="w-full bg-indigo-600 text-white font-bold py-3 rounded-2xl text-xs flex items-center justify-center space-x-2 shadow-lg hover:bg-indigo-700 transition"
          >
            <Check size={16} />
            <span>Confirmar esta ubicación</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const currentUserId = getUserId();

  const [currentPage, setCurrentPage] = useState('landing'); 
  const [userRole, setUserRole] = useState('seeker'); // 'seeker' o 'business'
  
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [jobIndex, setJobIndex] = useState(0);
  const [candidateIndex, setCandidateIndex] = useState(0);
  
  const [matches, setMatches] = useState([]);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [lastMatch, setLastMatch] = useState(null);

  // Estado de guardado de perfil
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSavedNotice, setProfileSavedNotice] = useState(false);

  // Animación de transición
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Geolocalización real
  const [userCoords, setUserCoords] = useState(null);
  const [geoStatus, setGeoStatus] = useState('Obteniendo GPS...');

  // Filtros
  const [showFilters, setShowFilters] = useState(false);
  const [filterDistance, setFilterDistance] = useState(15);
  const [filterType, setFilterType] = useState('Todos');

  // Perfil Candidato Persistente
  const [candidateProfile, setCandidateProfile] = useState({
    name: '',
    age: '',
    skills: '',
    bio: '',
    avatar: null,
    banner: null
  });

  // Campos para formulario de publicar vacante
  const [newTitle, setNewTitle] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [showMapPicker, setShowMapPicker] = useState(false);

  const [newSalary, setNewSalary] = useState('');
  const [newSchedule, setNewSchedule] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [businessLogo, setBusinessLogo] = useState(null);

  // Navegación animada
  const navigateTo = (page, role = userRole) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setUserRole(role);
      setCurrentPage(page);
      setJobIndex(0);
      setCandidateIndex(0);
      setIsTransitioning(false);
    }, 280);
  };

  // Obtener GPS del navegador
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserCoords(coords);
          setSelectedCoords(coords);
          setGeoStatus('GPS Activo 📍');
        },
        (err) => {
          console.warn(err);
          setGeoStatus('Ubicación aproximada');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  // 1. CARGAR O INICIALIZAR PERFIL PROPIO DESDE FIREBASE
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, "perfiles", currentUserId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setCandidateProfile(docSnap.data());
        } else {
          const initialData = {
            name: 'Alex González',
            age: '20 años',
            skills: 'Atención al cliente, Caja, Cafetería',
            bio: 'Estudiante enfocado en atención al cliente con disponibilidad inmediata.',
            avatar: null,
            banner: null
          };
          await setDoc(docRef, initialData);
          setCandidateProfile(initialData);
        }
      } catch (err) {
        console.error("Error al cargar perfil de Firebase:", err);
      }
    };

    fetchProfile();
  }, [currentUserId]);

  // 2. CARGAR TODOS LOS PERFILES REALES DE CANDIDATOS PARA LOS NEGOCIOS
  useEffect(() => {
    const q = query(collection(db, "perfiles"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const realProfiles = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));

      // Unir perfiles reales guardados con los de demo como respaldo
      const combined = [
        ...realProfiles,
        ...DEMO_CANDIDATES.filter(demo => !realProfiles.some(real => real.id === demo.id))
      ];

      setCandidates(combined);
    }, (err) => {
      console.error("Error al obtener candidatos:", err);
      setCandidates(DEMO_CANDIDATES);
    });

    return () => unsubscribe();
  }, []);

  // 3. CARGAR MATCHES EN TIEMPO REAL
  useEffect(() => {
    const q = query(collection(db, "matches"), where("userId", "==", currentUserId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const matchDocs = snapshot.docs.map(d => ({ id: d.id, ...d.data().item }));
      setMatches(matchDocs);
    }, (err) => console.error("Error al obtener matches:", err));

    return () => unsubscribe();
  }, [currentUserId]);

  // 4. CARGAR VACANTES EN TIEMPO REAL
  useEffect(() => {
    const q = query(collection(db, "vacantes"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const jobList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      jobList.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setJobs(jobList);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // GUARDAR PERFIL EN FIREBASE CLOUD
  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      const docRef = doc(db, "perfiles", currentUserId);
      await setDoc(docRef, {
        ...candidateProfile,
        updatedAt: serverTimestamp()
      }, { merge: true });

      setIsSavingProfile(false);
      setProfileSavedNotice(true);
      setTimeout(() => setProfileSavedNotice(false), 3000);
    } catch (err) {
      console.error("Error al guardar perfil:", err);
      setIsSavingProfile(false);
      alert(`Error al guardar perfil: ${err.message}`);
    }
  };

  // Subir fotos
  const handleProfileImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const base64 = await convertFileToBase64(file);
      setCandidateProfile(prev => ({ ...prev, [type]: base64 }));
    }
  };

  const handleBusinessLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const base64 = await convertFileToBase64(file);
      setBusinessLogo(base64);
    }
  };

  // Confirmar selección del mapa
  const handleConfirmLocation = ({ coords, address }) => {
    setSelectedCoords(coords);
    setNewAddress(address);
    setShowMapPicker(false);
  };

  // Publicar vacante
  const handlePostJob = async (e) => {
    e.preventDefault();
    
    if (!selectedCoords) {
      alert("Por favor selecciona la ubicación en el mapa.");
      return;
    }

    try {
      await addDoc(collection(db, "vacantes"), {
        title: newTitle,
        company: newCompany,
        address: newAddress || "Ubicación confirmada en mapa",
        salary: newSalary,
        schedule: newSchedule,
        description: newDesc,
        lat: selectedCoords.lat,
        lng: selectedCoords.lng,
        logo: businessLogo || null,
        ownerId: currentUserId,
        createdAt: serverTimestamp()
      });

      // Limpiar campos
      setNewTitle(''); setNewCompany(''); setNewAddress('');
      setNewSalary(''); setNewSchedule(''); setNewDesc('');
      setBusinessLogo(null);

      alert('¡Vacante publicada exitosamente!');
      navigateTo('explore', 'seeker');
    } catch (err) {
      console.error(err);
      alert('Error al publicar vacante.');
    }
  };

  // GUARDAR MATCH EN FIREBASE
  const handleLike = async (item) => {
    setLastMatch(item);
    setShowMatchModal(true);

    try {
      await addDoc(collection(db, "matches"), {
        userId: currentUserId,
        item: item,
        role: userRole,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Error al registrar match en Firebase:", err);
    }

    if (userRole === 'seeker') setJobIndex(jobIndex + 1);
    else setCandidateIndex(candidateIndex + 1);
  };

  const handlePass = () => {
    if (userRole === 'seeker') setJobIndex(jobIndex + 1);
    else setCandidateIndex(candidateIndex + 1);
  };

  // Filtrado de vacantes
  const filteredJobs = jobs.filter(job => {
    if (filterType !== 'Todos' && job.schedule && !job.schedule.toLowerCase().includes(filterType.toLowerCase())) return false;
    if (userCoords && job.lat && job.lng && filterDistance < 20) {
      const dist = calculateDistanceInKm(userCoords.lat, userCoords.lng, job.lat, job.lng);
      if (dist && parseFloat(dist) > filterDistance) return false;
    }
    return true;
  });

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 shadow-2xl relative overflow-hidden">
      
      {/* MODAL PICKER DE MAPA */}
      {showMapPicker && (
        <MapPickerModal 
          initialCoords={selectedCoords}
          userCoords={userCoords}
          onConfirm={handleConfirmLocation}
          onClose={() => setShowMapPicker(false)}
        />
      )}

      {/* ANIMACIÓN DE TRANSICIÓN */}
      <div 
        className={`fixed inset-0 pointer-events-none z-50 transition-all duration-300 ease-out flex items-center justify-center ${
          isTransitioning ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
        }`}
      >
        <div className="w-96 h-96 bg-gradient-to-tr from-indigo-500/30 to-violet-500/30 backdrop-blur-xl rounded-full animate-ping"></div>
      </div>

      {/* HEADER */}
      {currentPage !== 'landing' && (
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 py-3 flex justify-between items-center sticky top-0 z-30">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigateTo('explore', userRole)}>
            <div className="bg-indigo-600 text-white p-2 rounded-xl font-bold text-lg flex items-center justify-center w-9 h-9 shadow-md shadow-indigo-200">
              ⚡
            </div>
            <span className="font-black text-xl tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              ChambaCerca
            </span>
          </div>

          <button 
            onClick={() => {
              const nextRole = userRole === 'seeker' ? 'business' : 'seeker';
              navigateTo('explore', nextRole);
            }}
            className="text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full border border-indigo-100 hover:scale-105 transition active:scale-95 flex items-center space-x-1 shadow-sm"
          >
            {userRole === 'seeker' ? <span>👤 Soy Buscador</span> : <span>🏪 Modo Negocio</span>}
          </button>
        </header>
      )}

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 pb-20">
        
        {/* LANDING PAGE */}
        {currentPage === 'landing' && (
          <div className="p-6 flex flex-col items-center justify-between min-h-screen bg-gradient-to-b from-indigo-600 via-indigo-700 to-violet-800 text-white text-center relative overflow-hidden">
            <div className="absolute top-10 left-5 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
            <div className="absolute bottom-20 right-5 w-40 h-40 bg-violet-400/20 rounded-full blur-3xl animate-pulse"></div>

            <div className="my-auto space-y-6 pt-10 z-10">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-3xl mx-auto flex items-center justify-center text-4xl shadow-inner border border-white/20">
                ⚡
              </div>
              <h1 className="text-4xl font-black tracking-tight leading-tight">ChambaCerca</h1>
              <p className="text-indigo-100 text-sm max-w-xs mx-auto leading-relaxed">
                Empleos e interactividad local en tiempo real con datos persistentes en la nube.
              </p>

              <div className="pt-6 space-y-3 w-full max-w-xs mx-auto">
                <button 
                  onClick={() => navigateTo('explore', 'seeker')}
                  className="w-full bg-white text-indigo-700 font-bold py-3.5 px-6 rounded-2xl shadow-lg hover:scale-105 transition active:scale-95 flex items-center justify-center space-x-2"
                >
                  <Search size={18} />
                  <span>Busco Empleo</span>
                </button>
                <button 
                  onClick={() => navigateTo('explore', 'business')}
                  className="w-full bg-indigo-500/30 backdrop-blur-md text-white font-semibold py-3.5 px-6 rounded-2xl border border-white/30 hover:bg-white/20 transition active:scale-95 flex items-center justify-center space-x-2"
                >
                  <Building size={18} />
                  <span>Soy Negocio (Ver Candidatos)</span>
                </button>
              </div>
            </div>
            <div className="text-xs text-indigo-200/70 pb-4 z-10">ChambaCerca 2026 • Datos Persistentes</div>
          </div>
        )}

        {/* EXPLORAR */}
        {currentPage === 'explore' && (
          <div className="p-4 space-y-4">
            
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600">
                  <Navigation size={14} className="text-indigo-600 animate-pulse" />
                  <span>{geoStatus}</span>
                  <span className="bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-md text-[10px]">
                    {userRole === 'seeker' ? 'Viendo Vacantes' : 'Viendo Candidatos Reales'}
                  </span>
                </div>
                {userRole === 'seeker' && (
                  <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className="text-xs font-semibold text-indigo-600 flex items-center space-x-1 bg-indigo-50 px-3 py-1.5 rounded-xl"
                  >
                    <Sliders size={12} />
                    <span>Filtros</span>
                  </button>
                )}
              </div>

              {showFilters && userRole === 'seeker' && (
                <div className="pt-3 border-t border-slate-100 space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Radio máximo: {filterDistance} km</label>
                    <input 
                      type="range" min="1" max="20" value={filterDistance} 
                      onChange={(e) => setFilterDistance(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                </div>
              )}
            </div>

            {userRole === 'seeker' ? (
              loading ? (
                <div className="text-center py-20 text-xs text-slate-500 animate-pulse">Cargando vacantes... 🌀</div>
              ) : jobIndex < filteredJobs.length ? (
                <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden flex flex-col justify-between min-h-[480px]">
                  <div>
                    <div className="h-32 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                      {filteredJobs[jobIndex].logo ? (
                        <img src={filteredJobs[jobIndex].logo} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-4xl">🏪</div>
                      )}
                      <div className="absolute top-3 right-3 bg-emerald-500 text-white font-bold text-[10px] px-2.5 py-1 rounded-full shadow-md flex items-center space-x-1">
                        <MapPin size={10} />
                        <span>
                          {userCoords && filteredJobs[jobIndex].lat && filteredJobs[jobIndex].lng
                            ? `${calculateDistanceInKm(userCoords.lat, userCoords.lng, filteredJobs[jobIndex].lat, filteredJobs[jobIndex].lng)} km`
                            : 'Cerca de ti'}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 space-y-3">
                      <h3 className="font-bold text-slate-900 text-xl">{filteredJobs[jobIndex].title}</h3>
                      <p className="text-xs font-semibold text-indigo-600">{filteredJobs[jobIndex].company}</p>
                      
                      <p className="text-[11px] text-slate-400 flex items-center space-x-1">
                        <MapPin size={12} />
                        <span className="truncate">{filteredJobs[jobIndex].address}</span>
                      </p>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                        <div className="bg-slate-50 p-2 rounded-xl flex items-center space-x-2">
                          <DollarSign size={14} className="text-emerald-500" />
                          <span>{filteredJobs[jobIndex].salary}</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-xl flex items-center space-x-2">
                          <Clock size={14} className="text-amber-500" />
                          <span>{filteredJobs[jobIndex].schedule}</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">{filteredJobs[jobIndex].description}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-around">
                    <button onClick={handlePass} className="w-14 h-14 bg-white text-slate-400 rounded-full shadow-md flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition border">
                      <X size={26} />
                    </button>
                    <button onClick={() => handleLike(filteredJobs[jobIndex])} className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition">
                      <Heart size={30} className="fill-white" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-8 text-center space-y-4 shadow-sm my-10">
                  <div className="text-4xl">🎉</div>
                  <h3 className="font-bold text-slate-800">Has visto todas las vacantes</h3>
                  <button onClick={() => setJobIndex(0)} className="bg-indigo-600 text-white font-bold text-xs py-3 px-6 rounded-2xl">Reiniciar Lista</button>
                </div>
              )
            ) : (
              candidateIndex < candidates.length ? (
                <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden flex flex-col justify-between min-h-[480px]">
                  <div>
                    <div className="h-28 bg-indigo-100 relative overflow-hidden flex items-center justify-center">
                      {candidates[candidateIndex].banner ? (
                        <img src={candidates[candidateIndex].banner} alt="Portada" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white/50 text-xs">
                          Sin Foto de Portada
                        </div>
                      )}
                      <div className="absolute top-3 right-3 bg-indigo-600 text-white font-bold text-[10px] px-2.5 py-1 rounded-full shadow-md flex items-center space-x-1">
                        <UserCheck size={10} />
                        <span>Candidato Disponible</span>
                      </div>
                    </div>

                    <div className="px-5 relative flex justify-between items-end -mt-10 mb-3">
                      <div className="w-18 h-18 rounded-2xl bg-white p-1 shadow-md">
                        {candidates[candidateIndex].avatar ? (
                          <img src={candidates[candidateIndex].avatar} alt="Perfil" className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          <div className="w-full h-full bg-slate-100 rounded-xl flex items-center justify-center text-2xl">👨‍🎓</div>
                        )}
                      </div>
                    </div>

                    <div className="p-5 pt-0 space-y-3">
                      <div>
                        <h3 className="font-bold text-slate-900 text-xl">
                          {candidates[candidateIndex].name || 'Candidato sin Nombre'}
                        </h3>
                        <p className="text-xs font-semibold text-indigo-600">
                          {candidates[candidateIndex].role || 'Buscando Empleo'} • {candidates[candidateIndex].age || 'Edad no especificada'}
                        </p>
                      </div>

                      <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/50 space-y-1">
                        <h4 className="text-[10px] font-bold text-indigo-400 uppercase">Habilidades</h4>
                        <p className="text-xs font-medium text-indigo-900">
                          {candidates[candidateIndex].skills || 'No especificadas'}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase">Sobre mí</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {candidates[candidateIndex].bio || 'Sin descripción disponible.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-around">
                    <button onClick={handlePass} className="w-14 h-14 bg-white text-slate-400 rounded-full shadow-md flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition border">
                      <X size={26} />
                    </button>
                    <button onClick={() => handleLike(candidates[candidateIndex])} className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition">
                      <Heart size={30} className="fill-white" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-8 text-center space-y-4 shadow-sm my-10">
                  <div className="text-4xl">👨‍🎓</div>
                  <h3 className="font-bold text-slate-800">Has visto todos los prospectos</h3>
                  <button onClick={() => setCandidateIndex(0)} className="bg-indigo-600 text-white font-bold text-xs py-3 px-6 rounded-2xl">Volver a revisar prospectos</button>
                </div>
              )
            )}

          </div>
        )}

        {/* PERFIL CANDIDATO (GUARDADO EN LA NUBE) */}
        {currentPage === 'profile' && (
          <div className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-black text-xl text-slate-900">Tu Perfil 👤</h2>
              {profileSavedNotice && (
                <span className="text-xs text-emerald-600 font-bold flex items-center space-x-1 animate-bounce">
                  <Check size={14} />
                  <span>¡Guardado en la nube!</span>
                </span>
              )}
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden space-y-4 pb-5">
              <div className="h-28 bg-indigo-100 relative flex items-center justify-center overflow-hidden">
                {candidateProfile.banner ? (
                  <img src={candidateProfile.banner} alt="Banner" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs text-indigo-400">Sin foto de portada</span>
                )}
                <label className="absolute bottom-2 right-2 bg-slate-900/70 text-white p-2 rounded-xl cursor-pointer">
                  <Camera size={14} />
                  <input type="file" accept="image/*" onChange={(e) => handleProfileImageUpload(e, 'banner')} className="hidden" />
                </label>
              </div>

              <div className="px-5 relative flex justify-between items-end -mt-12">
                <div className="relative w-20 h-20 rounded-2xl bg-white p-1 shadow-md">
                  <div className="w-full h-full rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center">
                    {candidateProfile.avatar ? (
                      <img src={candidateProfile.avatar} alt="Perfil" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl">👨‍🎓</span>
                    )}
                  </div>
                  <label className="absolute -bottom-1 -right-1 bg-indigo-600 text-white p-1.5 rounded-lg cursor-pointer shadow">
                    <Camera size={12} />
                    <input type="file" accept="image/*" onChange={(e) => handleProfileImageUpload(e, 'avatar')} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="px-5 space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Nombre Completo</label>
                  <input 
                    type="text" 
                    value={candidateProfile.name || ''} 
                    onChange={(e) => setCandidateProfile({...candidateProfile, name: e.target.value})} 
                    className="w-full font-bold text-slate-800 text-sm border-b py-1 focus:outline-none focus:border-indigo-600" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Edad / Años</label>
                  <input 
                    type="text" 
                    value={candidateProfile.age || ''} 
                    onChange={(e) => setCandidateProfile({...candidateProfile, age: e.target.value})} 
                    className="w-full text-xs text-slate-600 border-b py-1 focus:outline-none focus:border-indigo-600" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Habilidades Clave</label>
                  <input 
                    type="text" 
                    value={candidateProfile.skills || ''} 
                    onChange={(e) => setCandidateProfile({...candidateProfile, skills: e.target.value})} 
                    className="w-full text-xs text-slate-600 border-b py-1 focus:outline-none focus:border-indigo-600" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Sobre ti</label>
                  <textarea 
                    value={candidateProfile.bio || ''} 
                    onChange={(e) => setCandidateProfile({...candidateProfile, bio: e.target.value})} 
                    className="w-full text-xs text-slate-600 border rounded-xl p-2 h-20 mt-1 focus:outline-none focus:border-indigo-600"
                  ></textarea>
                </div>

                <button 
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile}
                  className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-2xl text-xs flex items-center justify-center space-x-2 shadow-md transition"
                >
                  {isSavingProfile ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  <span>{isSavingProfile ? 'Guardando...' : 'Guardar Perfil'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MATCHES EN TIEMPO REAL */}
        {currentPage === 'matches' && (
          <div className="p-4 space-y-4">
            <h2 className="font-black text-xl text-slate-900">Tus Matches 🎉</h2>
            {matches.length === 0 ? (
              <p className="text-xs text-slate-500 py-10 text-center">Aún no tienes contactos guardados.</p>
            ) : (
              <div className="space-y-3">
                {matches.map((item, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center text-xl">
                        {item.logo || item.avatar ? <img src={item.logo || item.avatar} alt="Logo" className="w-full h-full object-cover" /> : '💼'}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-800">{item.title || item.name}</h4>
                        <p className="text-xs text-slate-500">{item.company || item.role || item.skills}</p>
                      </div>
                    </div>
                    <button className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-md">
                      <MessageSquare size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PUBLICAR VACANTE (NEGOCIO) */}
        {currentPage === 'post-job' && (
          <div className="p-4 space-y-4">
            <h2 className="font-black text-xl text-slate-900">Publicar vacante de tu Negocio 🏪</h2>
            <form onSubmit={handlePostJob} className="bg-white p-5 rounded-3xl shadow-sm border space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Imagen o Logo del Negocio</label>
                <div className="flex items-center space-x-3">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 border overflow-hidden flex items-center justify-center">
                    {businessLogo ? <img src={businessLogo} alt="Preview" className="w-full h-full object-cover" /> : <ImageIcon className="text-slate-400" size={24} />}
                  </div>
                  <label className="bg-indigo-50 text-indigo-600 text-xs font-bold px-3 py-2 rounded-xl cursor-pointer flex items-center space-x-1">
                    <Upload size={14} />
                    <span>{businessLogo ? 'Cambiar Foto' : 'Subir Foto'}</span>
                    <input type="file" accept="image/*" onChange={handleBusinessLogoUpload} className="hidden" />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Puesto</label>
                <input type="text" placeholder="Ej. Barista" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full bg-slate-50 border rounded-xl p-3 text-xs" required />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del Negocio</label>
                <input type="text" placeholder="Ej. Café El Roble" value={newCompany} onChange={(e) => setNewCompany(e.target.value)} className="w-full bg-slate-50 border rounded-xl p-3 text-xs" required />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ubicación del Negocio</label>
                
                <div className="space-y-2">
                  <button 
                    type="button"
                    onClick={() => setShowMapPicker(true)}
                    className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 p-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition"
                  >
                    <MapIcon size={16} />
                    <span>{selectedCoords ? '📌 Cambiar punto exacto en el mapa' : '🗺️ Seleccionar en el mapa'}</span>
                  </button>

                  <input 
                    type="text" 
                    placeholder="Dirección o referencia corta" 
                    value={newAddress} 
                    onChange={(e) => setNewAddress(e.target.value)} 
                    className="w-full bg-slate-50 border rounded-xl p-3 text-xs" 
                    required 
                  />
                  
                  {selectedCoords && (
                    <p className="text-[10px] text-emerald-600 font-semibold flex items-center space-x-1">
                      <Check size={12} />
                      <span>Coordenadas fijadas: {selectedCoords.lat.toFixed(4)}, {selectedCoords.lng.toFixed(4)}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Salario</label>
                  <input type="text" placeholder="Ej. $8,000/mes" value={newSalary} onChange={(e) => setNewSalary(e.target.value)} className="w-full bg-slate-50 border rounded-xl p-3 text-xs" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Horario</label>
                  <input type="text" placeholder="Ej. Medio Tiempo" value={newSchedule} onChange={(e) => setNewSchedule(e.target.value)} className="w-full bg-slate-50 border rounded-xl p-3 text-xs" required />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descripción</label>
                <textarea placeholder="Descripción del puesto..." value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="w-full bg-slate-50 border rounded-xl p-3 text-xs h-20" required></textarea>
              </div>

              <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-2xl shadow-lg hover:bg-indigo-700 transition">
                Publicar Vacante
              </button>
            </form>
          </div>
        )}

      </main>

      {/* POPUP DE MATCH */}
      {showMatchModal && lastMatch && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 text-center space-y-4 max-w-xs w-full shadow-2xl">
            <div className="text-5xl">🎉</div>
            <h3 className="font-black text-2xl text-slate-900">¡Hicieron Match!</h3>
            <p className="text-xs text-slate-500">
              Interés mutuo guardado en <span className="font-bold text-indigo-600">{lastMatch.title || lastMatch.name}</span>.
            </p>
            <button onClick={() => setShowMatchModal(false)} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl text-xs">Continuar</button>
          </div>
        </div>
      )}

      {/* BARRA INFERIOR DE NAVEGACIÓN */}
      {currentPage !== 'landing' && (
        <nav className="fixed bottom-0 max-w-md w-full bg-white/90 backdrop-blur-md border-t border-slate-100 px-6 py-2.5 flex justify-around items-center z-30">
          <button onClick={() => navigateTo('explore')} className={`flex flex-col items-center space-y-1 ${currentPage === 'explore' ? 'text-indigo-600 scale-110' : 'text-slate-400'} transition`}>
            <Search size={20} />
            <span className="text-[10px] font-bold">Explorar</span>
          </button>

          {userRole === 'business' ? (
            <button onClick={() => navigateTo('post-job')} className={`flex flex-col items-center space-y-1 ${currentPage === 'post-job' ? 'text-indigo-600 scale-110' : 'text-slate-400'} transition`}>
              <Building size={20} />
              <span className="text-[10px] font-bold">Publicar</span>
            </button>
          ) : (
            <button onClick={() => navigateTo('profile')} className={`flex flex-col items-center space-y-1 ${currentPage === 'profile' ? 'text-indigo-600 scale-110' : 'text-slate-400'} transition`}>
              <User size={20} />
              <span className="text-[10px] font-bold">Perfil</span>
            </button>
          )}

          <button onClick={() => navigateTo('matches')} className={`flex flex-col items-center space-y-1 ${currentPage === 'matches' ? 'text-indigo-600 scale-110' : 'text-slate-400'} transition`}>
            <MessageSquare size={20} />
            <span className="text-[10px] font-bold">Matches</span>
          </button>
        </nav>
      )}

    </div>
  );
}
