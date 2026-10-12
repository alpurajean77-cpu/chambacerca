import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, DollarSign, Clock, Heart, X, 
  MessageSquare, User, Building, Search, 
  SlidersHorizontal, Navigation, Camera, ImageIcon,
  Check, Save, Loader2, Trash2, CheckCircle,
  Settings, Palette, Flag, Send, ArrowLeft, LogOut,
  Sparkles, Briefcase, ChevronDown, ChevronUp, Star, Zap
} from 'lucide-react';

// Importaciones de Firebase
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider,
  signInWithPopup,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  onAuthStateChanged,
  signOut 
} from 'firebase/auth';
import { 
  getFirestore, collection, addDoc, onSnapshot, query,
  doc, setDoc, getDoc, updateDoc, deleteDoc, serverTimestamp, where, getDocs 
} from 'firebase/firestore';

// Configuración de Firebase con la API Key limpia validada
const firebaseConfig = {
  apiKey: "AIzaSyCpQ3ybA84pHSrD11KrzBeTEl-wRayZ71k",
  authDomain: "chambacerca-ca0c9.firebaseapp.com",
  projectId: "chambacerca-ca0c9",
  storageBucket: "chambacerca-ca0c9.firebasestorage.app",
  messagingSenderId: "256126044044",
  appId: "1:256126044044:web:e87aefa59bb3d8b8c638a9",
  measurementId: "G-SENSF6XZ3L"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// SINTETIZADOR DE SONIDOS NATIVO (Web Audio API)
const playSound = (type) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'like') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(420, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(840, ctx.currentTime + 0.14);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.14);
      osc.start();
      osc.stop(ctx.currentTime + 0.14);
    } else if (type === 'pass') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(260, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else if (type === 'match') {
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.22);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.22);
      });
    } else if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(650, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    }
  } catch (e) {
    console.log("Audio no disponible", e);
  }
};

function calculateDistanceInKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const nLat1 = Number(lat1), nLon1 = Number(lon1), nLat2 = Number(lat2), nLon2 = Number(lon2);
  if (isNaN(nLat1) || isNaN(nLon1) || isNaN(nLat2) || isNaN(nLon2)) return null;

  const R = 6371;
  const dLat = (nLat2 - nLat1) * (Math.PI / 180);
  const dLon = (nLon2 - nLon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(nLat1 * (Math.PI / 180)) * Math.cos(nLat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return c.toFixed(1);
}

const convertFileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

// VACANTES DE DEMOSTRACIÓN CON DISEÑO ENRIQUECIDO
const DEMO_JOBS = [
  {
    id: 'demo-job-1',
    title: 'Barista Principal / Atención',
    company: 'Cafetería El Portal',
    salary: '$1,600 sem. + Propinas',
    schedule: 'Matutino (8:00 AM - 4:00 PM)',
    address: 'Centro Histórico, Córdoba, Ver.',
    description: 'Buscamos barista con actitud proactiva para preparación de café de especialidad y atención cálida al cliente en barra.',
    tags: ['Barista', 'Cafetería', 'Inmediato'],
    urgency: 'Alta',
    lat: 18.8939,
    lng: -96.9356,
    status: 'active'
  },
  {
    id: 'demo-job-2',
    title: 'Técnico en Plomería Comercial',
    company: 'Servicios Integrales San José',
    salary: '$700 por trabajo',
    schedule: 'Horario Flexible',
    address: 'Av. 3 y Calle 9, Córdoba, Ver.',
    description: 'Mantenimiento preventivo e instalación de sistemas hidráulicos en comercios locales. Pago al instante al terminar.',
    tags: ['Plomería', 'Por trabajo', 'Urgente'],
    urgency: 'Urgente',
    lat: 18.8960,
    lng: -96.9320,
    status: 'active'
  },
  {
    id: 'demo-job-3',
    title: 'Auxiliar de Reparto y Almacén',
    company: 'Refaccionaria del Centro',
    salary: '$1,850 sem.',
    schedule: 'Lunes a Sábado (9:00 AM - 6:00 PM)',
    address: 'Calle 11, Córdoba, Ver.',
    description: 'Control de inventario básico y entrega de pedidos locales en motocicleta o camioneta. Prestaciones de ley.',
    tags: ['Almacén', 'Reparto', 'Licencia B'],
    urgency: 'Normal',
    lat: 18.8910,
    lng: -96.9390,
    status: 'active'
  }
];

// CANDIDATOS DE DEMOSTRACIÓN CON MÁS ATRIBUTOS
const DEMO_CANDIDATES = [
  {
    id: 'cand-1',
    name: 'Sofía Martínez',
    age: '21 años',
    role: 'Atención a Clientes / Barista',
    desiredRole: 'Barista / Mesera / Recepción',
    expectedSalary: '$1,600 - $2,200 sem.',
    availableSchedule: 'Medio Tiempo / Mañanas',
    skills: ['Manejo de Caja', 'Espresso', 'Atención Cálida', 'Inglés Básico'],
    bio: 'Estudiante universitaria de comunicación. 1 año de experiencia en barra de café. Me apasiona el servicio al cliente y aprender rápido.',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
    banner: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600',
    lat: 18.8950,
    lng: -96.9320
  },
  {
    id: 'cand-2',
    name: 'Carlos Mendoza',
    age: '23 años',
    role: 'Auxiliar General / Repartidor',
    desiredRole: 'Repartidor / Almacenista / Chófer',
    expectedSalary: '$1,900 sem.',
    availableSchedule: 'Tiempo Completo',
    skills: ['Licencia Vigente', 'Puntualidad', 'Rutas Locales', 'Carga Pesada'],
    bio: 'Joven responsable con excelente conocimiento de las calles de la ciudad. Experiencia en reparto y mensajería rápida.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
    banner: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=600',
    lat: 18.8910,
    lng: -96.9280
  }
];

// MODAL MAPA INTERACTIVO (LEAFLET)
const MapPickerModal = ({ initialCoords, userCoords, onConfirm, onClose }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCoords, setSelectedCoords] = useState(
    initialCoords || userCoords || { lat: 18.8939, lng: -96.9356 }
  );
  const [addressName, setAddressName] = useState('Obteniendo dirección...');

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
        setAddressName(parts.slice(0, 3).join(','));
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
    const map = L.map(mapContainerRef.current).setView([selectedCoords.lat, selectedCoords.lng], 16);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map);

    const customIcon = L.divIcon({
      className: 'custom-pin',
      html: `<div style="background: linear-gradient(135deg, #6366f1, #a855f7); width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 6px 14px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: 13px;">📍</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    const marker = L.marker([selectedCoords.lat, selectedCoords.lng], { draggable: true, icon: customIcon }).addTo(map);
    markerRef.current = marker;

    reverseGeocode(selectedCoords.lat, selectedCoords.lng);

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
        alert("Ubicación no encontrada.");
      }
    } catch {
      alert("Error al buscar dirección.");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex flex-col justify-end sm:justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-md mx-auto rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[85vh]">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Selecciona ubicación exacta</h3>
            <p className="text-[10px] text-slate-500">Arrastra el marcador o pulsa sobre el mapa</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-full transition">
            <X size={16} />
          </button>
        </div>

        <div className="p-3 bg-white border-b border-slate-100">
          <form onSubmit={handleSearchOnMap} className="flex gap-2">
            <input 
              type="text" 
              placeholder="Buscar colonia, calle o referencia..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-slate-100 px-3 py-2 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition">
              Buscar
            </button>
          </form>
        </div>

        <div className="flex-1 relative w-full bg-slate-100">
          <div ref={mapContainerRef} className="w-full h-full z-10"></div>
        </div>

        <div className="p-4 bg-white border-t border-slate-100 space-y-3">
          <div className="bg-slate-50 p-3 rounded-2xl border flex items-start space-x-2">
            <MapPin size={18} className="text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Ubicación elegida:</p>
              <p className="text-xs font-medium text-slate-700">{addressName}</p>
            </div>
          </div>

          <button 
            type="button"
            onClick={() => onConfirm({ coords: selectedCoords, address: addressName })}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3.5 rounded-2xl text-xs flex items-center justify-center space-x-2 shadow-lg hover:opacity-95 transition active:scale-98"
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
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserId, setCurrentUserId] = useState('');

  const [currentPage, setCurrentPage] = useState('landing'); 
  const [userRole, setUserRole] = useState('seeker'); // 'seeker' | 'business'
  const [theme, setTheme] = useState('indigo');

  const [jobs, setJobs] = useState(DEMO_JOBS);
  const [candidates, setCandidates] = useState(DEMO_CANDIDATES);
  
  const [jobIndex, setJobIndex] = useState(0);
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [showJobDetails, setShowJobDetails] = useState(false);
  
  const [matches, setMatches] = useState([]);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [lastMatch, setLastMatch] = useState(null);

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSavedNotice, setProfileSavedNotice] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Ubicación por defecto inicial (Córdoba)
  const [userCoords, setUserCoords] = useState({ lat: 18.8939, lng: -96.9356 });
  const [geoStatus, setGeoStatus] = useState('Obteniendo GPS...');

  // RADAR DE RANGO DUAL (DESDE PUNTO A HASTA PUNTO B)
  const [minDistance, setMinDistance] = useState(0);
  const [maxDistance, setMaxDistance] = useState(25);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);
  const [reportReason, setReportReason] = useState('🚫 Perfil o empleo falso / fraude');

  // AUTENTICACIÓN GOOGLE
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // PERFIL COMPLETO DE CANDIDATO
  const [candidateProfile, setCandidateProfile] = useState({
    name: '',
    age: '21 años',
    role: 'Atención a Clientes',
    desiredRole: 'Barista / Mesera / Recepcionista',
    expectedSalary: '$1,600 - $2,200 sem.',
    availableSchedule: 'Medio Tiempo / Vespertino',
    skills: ['Atención Cálida', 'Manejo de Caja', 'Espresso', 'Trabajo en equipo'],
    skillsText: 'Atención Cálida, Manejo de Caja, Espresso, Trabajo en equipo',
    bio: 'Joven entusiasta buscando oportunidades laborales formales o de medio tiempo cerca de mi zona.',
    avatar: null,
    banner: null
  });

  // DATOS PARA NUEVA VACANTE
  const [newTitle, setNewTitle] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [showMapPicker, setShowMapPicker] = useState(false);

  const [newSalary, setNewSalary] = useState('');
  const [newSchedule, setNewSchedule] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // PETICIÓN GEOLOCALIZACIÓN GPS
  const requestLocation = () => {
    if ("geolocation" in navigator) {
      setGeoStatus('Solicitando GPS...');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserCoords(coords);
          setSelectedCoords(coords);
          setGeoStatus('GPS Activo 📍');
        },
        (err) => {
          console.warn("GPS denegado:", err);
          setGeoStatus('Ubicación fija');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setGeoStatus('GPS no soportado');
    }
  };

  useEffect(() => {
    requestLocation();
  }, []);

  // FIRESTORE Y AUTH LISTENERS
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        setCurrentUserId(user.uid);
      } else {
        setCurrentUser(null);
        setCurrentUserId('');
      }
    });
    return () => unsubscribe();
  }, []);

  const navigateTo = (page, role = userRole) => {
    playSound('click');
    setIsTransitioning(true);
    setTimeout(() => {
      setUserRole(role);
      setCurrentPage(page);
      setJobIndex(0);
      setCandidateIndex(0);
      setShowJobDetails(false);
      setIsTransitioning(false);
    }, 180);
  };

  // VACANTES DE FIRESTORE
  useEffect(() => {
    const q = query(collection(db, "vacantes"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const realJobs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        realJobs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setJobs(realJobs);
      }
    }, (err) => console.warn(err));
    return () => unsubscribe();
  }, []);

  // PERFILES DE FIRESTORE
  useEffect(() => {
    const q = query(collection(db, "perfiles"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const realProfiles = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setCandidates([...realProfiles, ...DEMO_CANDIDATES]);
      }
    }, (err) => console.warn(err));
    return () => unsubscribe();
  }, []);

  // MI PERFIL EN FIRESTORE
  useEffect(() => {
    if (!currentUserId) return;
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, "perfiles", currentUserId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCandidateProfile(prev => ({ 
            ...prev, 
            ...data,
            skillsText: Array.isArray(data.skills) ? data.skills.join(', ') : (data.skillsText || data.skills || '')
          }));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchProfile();
  }, [currentUserId]);

  // MATCHES RECÍPROCOS EN TIEMPO REAL
  useEffect(() => {
    if (!currentUserId) return;
    const q = query(collection(db, "matches"), where("userId", "==", currentUserId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const matchDocs = snapshot.docs.map(d => ({ id: d.id, ...d.data().item, matchDocId: d.id }));
      setMatches(matchDocs);
    }, (err) => console.error(err));

    return () => unsubscribe();
  }, [currentUserId]);

  // INICIO DE SESIÓN CON GOOGLE
  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setCurrentUser(result.user);
      setCurrentUserId(result.user.uid);
      setShowAuthModal(false);
      setAuthLoading(false);
      playSound('match');
    } catch (error) {
      console.error("Error Google Auth:", error);
      alert("Error al ingresar con Google.");
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setCurrentUserId('');
    playSound('click');
  };

  // GUARDAR PERFIL
  const handleSaveProfile = async () => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    playSound('click');
    setIsSavingProfile(true);
    try {
      const skillsArray = candidateProfile.skillsText
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const updatedData = {
        ...candidateProfile,
        skills: skillsArray,
        updatedAt: serverTimestamp()
      };

      const docRef = doc(db, "perfiles", currentUserId);
      await setDoc(docRef, updatedData, { merge: true });
      setCandidateProfile(prev => ({ ...prev, skills: skillsArray }));
      setIsSavingProfile(false);
      setProfileSavedNotice(true);
      setTimeout(() => setProfileSavedNotice(false), 3000);
    } catch (err) {
      console.error(err);
      setIsSavingProfile(false);
    }
  };

  const handleImageUpload = async (e, field) => {
    const file = e.target.files[0];
    if (file) {
      const base64 = await convertFileToBase64(file);
      setCandidateProfile(prev => ({ ...prev, [field]: base64 }));
    }
  };

  // LÓGICA ESTRICTA DE MATCH DE DOBLE VÍA
  const handleLike = async (item) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    playSound('like');
    const targetUserId = userRole === 'seeker' ? (item.ownerId || item.id) : item.id;

    try {
      await addDoc(collection(db, "likes"), {
        fromUserId: currentUserId,
        toUserId: targetUserId,
        createdAt: serverTimestamp()
      });

      const reciprocalQuery = query(
        collection(db, "likes"),
        where("fromUserId", "==", targetUserId),
        where("toUserId", "==", currentUserId)
      );

      const reciprocalSnap = await getDocs(reciprocalQuery);

      if (!reciprocalSnap.empty) {
        setLastMatch(item);
        setShowMatchModal(true);
        playSound('match');

        await addDoc(collection(db, "matches"), {
          userId: currentUserId,
          item: item,
          role: userRole,
          createdAt: serverTimestamp()
        });

        await addDoc(collection(db, "matches"), {
          userId: targetUserId,
          item: candidateProfile,
          role: userRole === 'seeker' ? 'business' : 'seeker',
          createdAt: serverTimestamp()
        });
      }
    } catch (err) {
      console.error("Error en Like:", err);
    }

    setShowJobDetails(false);
    if (userRole === 'seeker') setJobIndex(jobIndex + 1);
    else setCandidateIndex(candidateIndex + 1);
  };

  const handlePass = () => {
    playSound('pass');
    setShowJobDetails(false);
    if (userRole === 'seeker') setJobIndex(jobIndex + 1);
    else setCandidateIndex(candidateIndex + 1);
  };

  // FILTRADO DE RADAR GPS DUAL (PUNTO A A PUNTO B)
  const filteredJobs = jobs.filter(job => {
    if (job.status === 'filled') return false;
    if (!userCoords || !job.lat || !job.lng) return true;
    const dist = calculateDistanceInKm(userCoords.lat, userCoords.lng, job.lat, job.lng);
    if (dist === null) return true;
    const numDist = parseFloat(dist);
    return numDist >= minDistance && numDist <= maxDistance;
  });

  const filteredCandidates = candidates.filter(cand => {
    if (!userCoords || !cand.lat || !cand.lng) return true;
    const dist = calculateDistanceInKm(userCoords.lat, userCoords.lng, cand.lat, cand.lng);
    if (dist === null) return true;
    const numDist = parseFloat(dist);
    return numDist >= minDistance && numDist <= maxDistance;
  });

  const currentJob = filteredJobs[jobIndex];
  const currentCandidate = filteredCandidates[candidateIndex];

  const getThemeClasses = () => {
    switch (theme) {
      case 'dark':
        return 'bg-slate-950 text-slate-100';
      case 'emerald':
        return 'bg-emerald-950 text-emerald-50';
      case 'sunset':
        return 'bg-amber-950 text-amber-50';
      default:
        return 'bg-slate-50 text-slate-900';
    }
  };

  const getCardTheme = () => {
    if (theme === 'dark') return 'bg-slate-900 border-slate-800 text-white';
    if (theme === 'emerald') return 'bg-emerald-900 border-emerald-800 text-white';
    if (theme === 'sunset') return 'bg-amber-900 border-amber-800 text-white';
    return 'bg-white border-slate-100 text-slate-800';
  };

  return (
    <div className={`max-w-md mx-auto min-h-screen flex flex-col font-sans shadow-2xl relative overflow-hidden transition-colors duration-300 ${getThemeClasses()}`}>

      {/* OVERLAY DE TRANSICIÓN ANIMADA */}
      <div className={`fixed inset-0 pointer-events-none z-50 transition-opacity duration-200 flex items-center justify-center ${isTransitioning ? 'opacity-100' : 'opacity-0'}`}>
        <div className="w-20 h-20 bg-indigo-500/30 backdrop-blur-md rounded-full animate-ping"></div>
      </div>

      {showMapPicker && (
        <MapPickerModal 
          initialCoords={selectedCoords}
          userCoords={userCoords}
          onConfirm={({ coords, address }) => {
            setSelectedCoords(coords);
            setNewAddress(address);
            setShowMapPicker(false);
          }}
          onClose={() => setShowMapPicker(false)}
        />
      )}

      {/* HEADER PRINCIPAL CON DETECCIÓN DE ROL */}
      {currentPage !== 'landing' && (
        <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-4 py-3 flex justify-between items-center sticky top-0 z-30 shadow-sm">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigateTo('explore', userRole)}>
            <div className="bg-gradient-to-tr from-indigo-600 to-purple-600 text-white p-2 rounded-xl font-bold text-lg flex items-center justify-center w-9 h-9 shadow-md shadow-indigo-200 dark:shadow-none">
              ⚡
            </div>
            <div>
              <span className="font-black text-lg tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent block leading-none">
                ChambaCerca
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                {userRole === 'seeker' ? 'Modo Buscador' : 'Modo Negocio'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!currentUser ? (
              <button 
                onClick={() => setShowAuthModal(true)}
                className="text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-full shadow-sm transition active:scale-95"
              >
                Ingresar
              </button>
            ) : (
              <button 
                onClick={handleLogout}
                className="text-[10px] font-bold bg-rose-50 text-rose-600 px-2.5 py-1.5 rounded-full border border-rose-200 flex items-center space-x-1 hover:bg-rose-100 transition"
                title="Cerrar sesión"
              >
                <LogOut size={12} />
                <span>Salir</span>
              </button>
            )}

            <button 
              onClick={() => navigateTo('settings')}
              className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition"
              title="Ajustes y Tema"
            >
              <Palette size={16} />
            </button>

            {/* CONMUTADOR DE ROL RÁPIDO */}
            <button 
              onClick={() => {
                const nextRole = userRole === 'seeker' ? 'business' : 'seeker';
                navigateTo('explore', nextRole);
              }}
              className="text-xs font-bold bg-indigo-50 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 px-3 py-1.5 rounded-full border border-indigo-100 dark:border-slate-700 shadow-sm hover:scale-105 transition flex items-center space-x-1"
            >
              <Zap size={13} className="text-amber-500 fill-amber-500" />
              <span>{userRole === 'seeker' ? 'Cambiar a Negocio' : 'Cambiar a Buscador'}</span>
            </button>
          </div>
        </header>
      )}

      <main className="flex-1 pb-20">

        {/* PÁGINA 1: LANDING */}
        {currentPage === 'landing' && (
          <div className="min-h-screen flex flex-col justify-between p-6 bg-gradient-to-b from-indigo-900 via-indigo-800 to-slate-950 text-white">
            <div className="pt-10 text-center space-y-3">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-3xl mx-auto flex items-center justify-center text-4xl shadow-2xl border border-white/20 animate-bounce">
                ⚡
              </div>
              <h1 className="text-4xl font-black tracking-tight">ChambaCerca</h1>
              <p className="text-indigo-200 text-xs max-w-xs mx-auto leading-relaxed">
                Descubre empleos o contrataciones al instante por radar GPS nativo.
              </p>

              <button 
                onClick={requestLocation}
                className="mt-2 bg-white/10 hover:bg-white/20 text-indigo-100 text-xs px-3.5 py-1.5 rounded-full border border-white/20 inline-flex items-center space-x-1.5 transition"
              >
                <Navigation size={12} className="animate-pulse text-indigo-300" />
                <span>{geoStatus}</span>
              </button>
            </div>

            <div className="space-y-3 my-auto">
              {!currentUser && (
                <button 
                  onClick={handleGoogleSignIn}
                  className="w-full bg-white hover:bg-slate-100 text-slate-900 font-extrabold py-3.5 rounded-2xl shadow-xl flex items-center justify-center space-x-2 text-xs transition active:scale-98"
                >
                  <span>🌐 Continuar con Google</span>
                </button>
              )}

              <button 
                onClick={() => navigateTo('explore', 'seeker')}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-extrabold py-3.5 rounded-2xl shadow-xl hover:opacity-95 transition flex items-center justify-center space-x-2 text-xs active:scale-98"
              >
                <User size={16} />
                <span>Busco Trabajo (Ver Vacantes Cerca)</span>
              </button>

              <button 
                onClick={() => navigateTo('explore', 'business')}
                className="w-full bg-indigo-950/80 backdrop-blur-md text-indigo-200 font-extrabold py-3.5 rounded-2xl border border-indigo-400/30 hover:bg-indigo-900 transition flex items-center justify-center space-x-2 text-xs active:scale-98"
              >
                <Building size={16} />
                <span>Soy Negocio (Buscar Candidatos / Publicar)</span>
              </button>
            </div>

            <div className="text-center text-[10px] text-indigo-300/60 pb-2">
              ChambaCerca • Conexión Laboral Directa por Radar
            </div>
          </div>
        )}

        {/* PÁGINA 2: EXPLORAR TARJETAS TINDER CON DISEÑO DINÁMICO */}
        {currentPage === 'explore' && (
          <div className="p-4 space-y-4">
            
            {/* BARRA DE RADAR DE RANGO DUAL */}
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs font-semibold shadow-sm">
              <button onClick={requestLocation} className="flex items-center space-x-1.5 text-indigo-600 dark:text-indigo-400">
                <Navigation size={14} />
                <span>{geoStatus}</span>
              </button>
              <button 
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition"
              >
                <SlidersHorizontal size={12} />
                <span>Radar: {minDistance} - {maxDistance} km</span>
              </button>
            </div>

            {/* PANEL DESPLEGABLE DUAL */}
            {showFilterPanel && (
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4 shadow-xl animate-fadeIn">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span>Rango del Radar GPS (Punto A ➔ Punto B)</span>
                  <span className="text-indigo-600 dark:text-indigo-400">{minDistance} km a {maxDistance} km</span>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Distancia Mínima (Punto A): {minDistance} km</label>
                    <input 
                      type="range" 
                      min="0" 
                      max={maxDistance - 1} 
                      value={minDistance}
                      onChange={(e) => setMinDistance(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Distancia Máxima (Punto B): {maxDistance} km</label>
                    <input 
                      type="range" 
                      min={minDistance + 1} 
                      max="50" 
                      value={maxDistance}
                      onChange={(e) => setMaxDistance(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* --- TARJETA DE VACANTE (SI EL ROL ES BUSCADOR) --- */}
            {userRole === 'seeker' && (
              <>
                {currentJob ? (
                  <div className={`rounded-3xl border overflow-hidden shadow-2xl transition-all duration-300 animate-fadeIn ${getCardTheme()}`}>
                    
                    {/* ENCABEZADO DE TARJETA ESTILO TINDER */}
                    <div className="h-48 bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 relative p-5 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider border border-white/20">
                          ⚡ Vacante Activa
                        </span>

                        <button 
                          onClick={() => { setReportTarget(currentJob); setShowReportModal(true); }}
                          className="p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition"
                        >
                          <Flag size={14} />
                        </button>
                      </div>

                      <div className="text-white space-y-1 z-10">
                        <h2 className="text-xl font-black leading-tight drop-shadow-sm">{currentJob.title}</h2>
                        <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-100">
                          <Building size={14} />
                          <span>{currentJob.company}</span>
                        </div>
                      </div>
                    </div>

                    {/* CUERPO DE TARJETA CON ETIQUETAS Y SUELDO HIGHLIGHT */}
                    <div className="p-5 space-y-4">
                      
                      {/* HIGHLIGHT DE SUELDO Y HORARIO */}
                      <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-3.5 rounded-2xl">
                        <div>
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Sueldo Ofrecido</span>
                          <span className="text-base font-black text-emerald-700 dark:text-emerald-300">{currentJob.salary || 'A convenir'}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Horario</span>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{currentJob.schedule || 'Flexible'}</span>
                        </div>
                      </div>

                      {/* UBICACIÓN CON CALCULADORA GPS */}
                      <div className="flex items-start space-x-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
                        <MapPin size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-slate-700 dark:text-slate-300">{currentJob.address}</p>
                          {userCoords && currentJob.lat && (
                            <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold mt-0.5">
                              📍 Distancia del radar: {calculateDistanceInKm(userCoords.lat, userCoords.lng, currentJob.lat, currentJob.lng)} km de ti
                            </p>
                          )}
                        </div>
                      </div>

                      {/* ETIQUETAS / TAGS VIBRANTES */}
                      {currentJob.tags && currentJob.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {currentJob.tags.map((tag, idx) => (
                            <span key={idx} className="text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 px-2.5 py-1 rounded-lg border border-indigo-100 dark:border-indigo-800">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* DESCRIPCIÓN CON BOTÓN EXPANDIBLE */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold uppercase text-slate-400">Descripción del Puesto</span>
                          <button 
                            onClick={() => setShowJobDetails(!showJobDetails)}
                            className="text-[10px] font-bold text-indigo-600 flex items-center space-x-0.5"
                          >
                            <span>{showJobDetails ? 'Ver menos' : 'Ver todo'}</span>
                            {showJobDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </button>
                        </div>

                        <p className={`text-xs text-slate-600 dark:text-slate-300 leading-relaxed ${showJobDetails ? '' : 'line-clamp-2'}`}>
                          {currentJob.description}
                        </p>
                      </div>

                      {/* BOTONES ACCIÓN TINDER (PASS / LIKE) */}
                      <div className="flex justify-center space-x-6 pt-3">
                        <button 
                          onClick={handlePass}
                          className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 border border-rose-200 flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition"
                          title="Pasar"
                        >
                          <X size={28} />
                        </button>

                        <button 
                          onClick={() => handleLike(currentJob)}
                          className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-xl shadow-emerald-200 dark:shadow-none hover:scale-110 active:scale-95 transition"
                          title="Me interesa (Like)"
                        >
                          <Heart size={28} fill="currentColor" />
                        </button>
                      </div>

                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 space-y-3 bg-white dark:bg-slate-900 rounded-3xl border p-6">
                    <Sparkles size={36} className="mx-auto text-indigo-500 animate-pulse" />
                    <h3 className="font-bold text-slate-700 dark:text-slate-200">¡Has visto todas las vacantes en este rango!</h3>
                    <p className="text-xs text-slate-400">Amplía la distancia del radar arriba para encontrar empleos en municipios vecinos.</p>
                  </div>
                )}
              </>
            )}

            {/* --- TARJETA DE CANDIDATO (SI EL ROL ES NEGOCIO) --- */}
            {userRole === 'business' && (
              <>
                {currentCandidate ? (
                  <div className={`rounded-3xl border overflow-hidden shadow-2xl transition-all duration-300 animate-fadeIn ${getCardTheme()}`}>
                    
                    {/* FOTO DE PORTADA Y AVATAR SOBREPUESTO */}
                    <div className="h-40 bg-slate-200 relative">
                      {currentCandidate.banner ? (
                        <img src={currentCandidate.banner} alt="Portada" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-purple-600 to-indigo-600"></div>
                      )}

                      <div className="absolute -bottom-9 left-6">
                        <img 
                          src={currentCandidate.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'} 
                          alt="Avatar" 
                          className="w-20 h-20 rounded-2xl border-4 border-white dark:border-slate-900 shadow-md object-cover bg-white"
                        />
                      </div>

                      <button 
                        onClick={() => { setReportTarget(currentCandidate); setShowReportModal(true); }}
                        className="absolute top-3 right-3 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition"
                      >
                        <Flag size={14} />
                      </button>
                    </div>

                    <div className="pt-11 p-6 space-y-4">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h2 className="text-xl font-black">{currentCandidate.name}</h2>
                          <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{currentCandidate.age}</span>
                        </div>
                        <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">{currentCandidate.role}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Puesto Buscado</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">{currentCandidate.desiredRole || 'General'}</span>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Sueldo Pretendido</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">{currentCandidate.expectedSalary || 'A convenir'}</span>
                        </div>
                      </div>

                      {/* CHIPS DE HABILIDADES */}
                      {currentCandidate.skills && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase text-slate-400">Habilidades Destacadas</span>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {(Array.isArray(currentCandidate.skills) ? currentCandidate.skills : String(currentCandidate.skills).split(',')).map((sk, idx) => (
                              <span key={idx} className="text-[10px] font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 px-2.5 py-1 rounded-lg border border-purple-100 dark:border-purple-800">
                                ✓ {String(sk).trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="space-y-1 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Sobre mí</span>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">"{currentCandidate.bio}"</p>
                      </div>

                      {/* BOTONES ACCIÓN TINDER */}
                      <div className="flex justify-center space-x-6 pt-2">
                        <button 
                          onClick={handlePass}
                          className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 border border-rose-200 flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition"
                          title="Pasar"
                        >
                          <X size={28} />
                        </button>

                        <button 
                          onClick={() => handleLike(currentCandidate)}
                          className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-xl shadow-indigo-200 dark:shadow-none hover:scale-110 active:scale-95 transition"
                          title="Me interesa (Like)"
                        >
                          <Heart size={28} fill="currentColor" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 space-y-3 bg-white dark:bg-slate-900 rounded-3xl border p-6">
                    <User size={36} className="mx-auto text-indigo-500" />
                    <h3 className="font-bold text-slate-700 dark:text-slate-200">No hay más candidatos en este rango</h3>
                    <p className="text-xs text-slate-400">Aumenta la distancia en el filtro para encontrar candidatos más alejados.</p>
                  </div>
                )}
              </>
            )}

          </div>
        )}

        {/* PÁGINA 3: CHAT Y CONEXIONES (SÓLO MATCHES REALES) */}
        {currentPage === 'chat' && (
          <div className="p-4 space-y-4">
            <h2 className="font-black text-lg">Mensajes y Matches Reales</h2>
            {matches.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2 bg-white dark:bg-slate-900 rounded-3xl border p-6">
                <MessageSquare size={32} className="mx-auto text-indigo-500" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Aún no tienes conexiones recíprocas.</p>
                <p className="text-[11px] text-slate-400">Cuando le des "Like" a una persona o empleo que también te dio "Like", aparecerán aquí.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {matches.map(m => (
                  <div key={m.id || m.matchDocId} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center space-x-3 shadow-sm hover:border-indigo-500 transition">
                    <div className="w-11 h-11 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center font-bold text-white text-lg shrink-0 shadow-md">
                      {m.title ? '🏪' : '👤'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs truncate">{m.title || m.name}</h4>
                      <p className="text-[10px] text-slate-400 truncate">{m.company || m.role}</p>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                      Match Activo
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PÁGINA 4: PUBLICACIÓN DE VACANTE (SÓLO PARA ROL NEGOCIO) */}
        {currentPage === 'post-job' && userRole === 'business' && (
          <div className="p-4 space-y-4">
            <h2 className="font-black text-lg">Publicar Vacante de Empleo</h2>

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!currentUser) { setShowAuthModal(true); return; }
              try {
                await addDoc(collection(db, "vacantes"), {
                  title: newTitle, company: newCompany, address: newAddress || "Centro",
                  salary: newSalary, schedule: newSchedule, description: newDesc,
                  lat: userCoords.lat, lng: userCoords.lng, status: 'active',
                  ownerId: currentUserId, createdAt: serverTimestamp()
                });
                alert('¡Vacante publicada con éxito en el radar!');
                navigateTo('explore', 'seeker');
              } catch (err) { console.error(err); }
            }} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-3 shadow-md">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400">Título del Puesto *</label>
                <input type="text" placeholder="Ej. Barista / Mesero Principal" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500" required />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400">Nombre del Negocio *</label>
                <input type="text" placeholder="Ej. Cafetería El Portal" value={newCompany} onChange={(e) => setNewCompany(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500" required />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Sueldo / Pago</label>
                  <input type="text" placeholder="Ej. $1,600 sem." value={newSalary} onChange={(e) => setNewSalary(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 rounded-xl text-xs outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Horario</label>
                  <input type="text" placeholder="Ej. Turno Matutino" value={newSchedule} onChange={(e) => setNewSchedule(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 rounded-xl text-xs outline-none" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400">Ubicación GPS</label>
                <button 
                  type="button" 
                  onClick={() => setShowMapPicker(true)} 
                  className="w-full bg-slate-100 dark:bg-slate-800 text-indigo-600 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2"
                >
                  <MapPin size={14} />
                  <span>{newAddress || "Seleccionar ubicación en el mapa 📍"}</span>
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400">Descripción detallada *</label>
                <textarea rows="3" placeholder="Requisitos, actividades y beneficios..." value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 rounded-xl text-xs outline-none" required />
              </div>

              <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3.5 rounded-2xl text-xs shadow-lg shadow-indigo-200 dark:shadow-none active:scale-98 transition">
                Publicar Vacante
              </button>
            </form>
          </div>
        )}

        {/* PÁGINA 5: PERFIL EXTENDIDO PARA BUSCADORES */}
        {currentPage === 'profile' && (
          <div className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-black text-lg">Mi Perfil Profesional / CV</h2>
              {profileSavedNotice && (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                  ✓ Guardado
                </span>
              )}
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4 shadow-md">
              
              {/* EDICIÓN FOTO Y PORTADA */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-slate-400">Fotografías de Perfil</label>
                
                <div className="h-28 bg-slate-100 dark:bg-slate-800 rounded-2xl relative overflow-hidden border border-slate-200 dark:border-slate-700">
                  {candidateProfile.banner ? (
                    <img src={candidateProfile.banner} alt="Portada" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-semibold">Cargar foto de portada</div>
                  )}

                  <label className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full cursor-pointer hover:bg-black/70 transition">
                    <Camera size={12} />
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'banner')} />
                  </label>

                  <div className="absolute bottom-2 left-3 flex items-center space-x-2">
                    <img 
                      src={candidateProfile.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                      alt="Avatar" 
                      className="w-12 h-12 rounded-xl object-cover border-2 border-white bg-white"
                    />
                    <label className="p-1.5 bg-indigo-600 text-white rounded-full cursor-pointer hover:bg-indigo-700 transition">
                      <Camera size={12} />
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'avatar')} />
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Nombre Completo</label>
                  <input type="text" value={candidateProfile.name} onChange={(e) => setCandidateProfile({...candidateProfile, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 rounded-xl text-xs outline-none" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400">Edad</label>
                    <input type="text" value={candidateProfile.age} onChange={(e) => setCandidateProfile({...candidateProfile, age: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 rounded-xl text-xs outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400">Puesto Pretendido</label>
                    <input type="text" value={candidateProfile.desiredRole} onChange={(e) => setCandidateProfile({...candidateProfile, desiredRole: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 rounded-xl text-xs outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400">Sueldo Esperado</label>
                    <input type="text" value={candidateProfile.expectedSalary} onChange={(e) => setCandidateProfile({...candidateProfile, expectedSalary: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 rounded-xl text-xs outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400">Horarios Disponibles</label>
                    <input type="text" value={candidateProfile.availableSchedule} onChange={(e) => setCandidateProfile({...candidateProfile, availableSchedule: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 rounded-xl text-xs outline-none" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Habilidades Clave (separadas por coma)</label>
                  <input type="text" value={candidateProfile.skillsText || ''} onChange={(e) => setCandidateProfile({...candidateProfile, skillsText: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 rounded-xl text-xs outline-none" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Sobre mí (Bio)</label>
                  <textarea rows="3" value={candidateProfile.bio} onChange={(e) => setCandidateProfile({...candidateProfile, bio: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 rounded-xl text-xs outline-none" />
                </div>

                <button onClick={handleSaveProfile} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-2xl text-xs shadow-lg shadow-indigo-200 dark:shadow-none transition active:scale-98">
                  {isSavingProfile ? 'Guardando...' : 'Guardar Perfil / CV'}
                </button>
              </div>

            </div>
          </div>
        )}

        {/* PÁGINA 6: CONFIGURACIÓN */}
        {currentPage === 'settings' && (
          <div className="p-4 space-y-4">
            <h2 className="font-black text-lg">Configuración de la App</h2>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4 shadow-md">
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Tema de Apariencia</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'indigo', name: '🟣 Indigo Pro' },
                    { id: 'dark', name: '🌙 Modo Oscuro' },
                    { id: 'emerald', name: '🟢 Esmeralda' },
                    { id: 'sunset', name: '🟠 Atardecer' }
                  ].map(t => (
                    <button 
                      key={t.id} 
                      onClick={() => setTheme(t.id)}
                      className={`p-3 rounded-2xl text-xs font-bold border transition ${theme === t.id ? 'border-indigo-600 bg-indigo-50 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300' : 'bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400'}`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* MODAL CELEBRACIÓN DE MATCH DE DOBLE VÍA */}
      {showMatchModal && lastMatch && (
        <div className="fixed inset-0 bg-indigo-900/90 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-fadeIn">
          <div className="text-center space-y-6 text-white max-w-sm">
            <div className="text-6xl animate-bounce">🎉</div>
            <h2 className="text-3xl font-black">¡Es un Match Real!</h2>
            <p className="text-xs text-indigo-200 leading-relaxed">
              Ambas partes han mostrado interés recíproco por <strong className="text-white">{lastMatch.title || lastMatch.name}</strong>.
            </p>

            <div className="space-y-3 pt-4">
              <button 
                onClick={() => { setShowMatchModal(false); navigateTo('chat'); }}
                className="w-full bg-white text-indigo-900 font-bold py-3.5 rounded-2xl text-xs shadow-xl active:scale-98 transition"
              >
                Ir a Mensajes
              </button>
              <button 
                onClick={() => setShowMatchModal(false)}
                className="w-full bg-indigo-800 text-indigo-200 font-bold py-3.5 rounded-2xl text-xs active:scale-98 transition"
              >
                Seguir Explorando
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REPORTE */}
      {showReportModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-sm">Reportar Publicación</h3>
            <select 
              value={reportReason} 
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl text-xs outline-none"
            >
              <option value="🚫 Perfil o empleo falso / fraude">🚫 Perfil o empleo falso / fraude</option>
              <option value="⚠️ Contenido inapropiado">⚠️ Contenido inapropiado</option>
              <option value="📩 Spam o acoso">📩 Spam o acoso</option>
            </select>
            <div className="flex gap-2">
              <button onClick={() => setShowReportModal(false)} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">Cancelar</button>
              <button onClick={() => { alert("Reporte enviado"); setShowReportModal(false); }} className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-bold">Enviar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AUTENTICACIÓN GOOGLE */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 space-y-4 shadow-2xl relative">
            <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-slate-400">
              <X size={18} />
            </button>

            <div className="text-center space-y-1">
              <h3 className="font-black text-lg">Ingresar a ChambaCerca</h3>
              <p className="text-xs text-slate-400">Inicia sesión para guardar tu perfil o dar Likes</p>
            </div>

            <button 
              onClick={handleGoogleSignIn}
              disabled={authLoading}
              className="w-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold py-3.5 rounded-2xl text-xs flex items-center justify-center space-x-2 border transition active:scale-98"
            >
              <span>🌐 Continuar con Google</span>
            </button>
          </div>
        </div>
      )}

      {/* NAVEGACIÓN INFERIOR DINÁMICA SEGÚN ROL */}
      {currentPage !== 'landing' && (
        <nav className="fixed bottom-0 max-w-md w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 flex justify-around py-2.5 z-40">
          
          <button 
            onClick={() => navigateTo('explore', userRole)} 
            className={`flex flex-col items-center text-[10px] font-bold ${currentPage === 'explore' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}
          >
            <Search size={18} />
            <span>{userRole === 'seeker' ? 'Explorar' : 'Candidatos'}</span>
          </button>

          <button 
            onClick={() => navigateTo('chat')} 
            className={`flex flex-col items-center text-[10px] font-bold ${currentPage === 'chat' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}
          >
            <MessageSquare size={18} />
            <span>Mensajes</span>
          </button>

          {/* SÓLO MOSTRAR 'PUBLICAR' SI EL ROL ES NEGOCIO */}
          {userRole === 'business' && (
            <button 
              onClick={() => navigateTo('post-job')} 
              className={`flex flex-col items-center text-[10px] font-bold ${currentPage === 'post-job' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}
            >
              <Building size={18} />
              <span>Publicar</span>
            </button>
          )}

          <button 
            onClick={() => navigateTo('profile')} 
            className={`flex flex-col items-center text-[10px] font-bold ${currentPage === 'profile' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}
          >
            <User size={18} />
            <span>{userRole === 'seeker' ? 'Mi CV' : 'Mi Perfil'}</span>
          </button>

        </nav>
      )}

    </div>
  );
}
