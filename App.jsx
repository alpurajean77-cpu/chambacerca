import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, DollarSign, Clock, Heart, X, 
  MessageSquare, User, Building, Search, 
  Sliders, Navigation, Camera, Image as ImageIcon, Upload,
  Check, Save, Loader2,
  Trash2, CheckCircle, ShieldAlert, Settings, Palette,
  Lock, Flag, EyeOff, Sparkles, Send, ArrowLeft, LogOut, Mail,
  SlidersHorizontal, RefreshCw
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
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else if (type === 'pass') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(250, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'match') {
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.2);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.2);
      });
    } else if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } else if (type === 'message') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
      osc.start();
      osc.stop(ctx.currentTime + 0.16);
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

// TRABAJOS Y CANDIDATOS DE RESPALDO INICIALES
const DEMO_JOBS = [
  {
    id: 'demo-job-1',
    title: 'Barista / Mesero Principal',
    company: 'Cafetería El Portal',
    salary: '$1,500 sem. + Propinas',
    schedule: 'Turno Matutino (8:00 AM - 4:00 PM)',
    address: 'Centro Histórico, Córdoba, Ver.',
    description: 'Buscamos barista con pasión por el café y atención cordial a clientes. Excelente ambiente laboral.',
    lat: 18.8939,
    lng: -96.9356,
    status: 'active'
  },
  {
    id: 'demo-job-2',
    title: 'Plomero / Mantenimiento Comercial',
    company: 'Servicios Integrales San José',
    salary: '$600 por servicio',
    schedule: 'Horario Flexible',
    address: 'Av. 3 y Calle 9, Córdoba, Ver.',
    description: 'Atención a tuberías residenciales y comerciales. Pago inmediato al finalizar el servicio.',
    lat: 18.8960,
    lng: -96.9320,
    status: 'active'
  },
  {
    id: 'demo-job-3',
    title: 'Auxiliar de Reparto y Almacén',
    company: 'Refaccionaria del Centro',
    salary: '$1,800 sem.',
    schedule: 'Lunes a Sábado (9:00 AM - 6:00 PM)',
    address: 'Calle 11, Córdoba, Ver.',
    description: 'Organización de inventario y entrega local de pedidos. Licencia de conducir vigente preferible.',
    lat: 18.8910,
    lng: -96.9390,
    status: 'active'
  }
];

const DEMO_CANDIDATES = [
  {
    id: 'cand-1',
    name: 'Sofía Martínez',
    age: '21 años',
    role: 'Atención a Clientes / Barista',
    desiredRole: 'Barista / Mesera',
    expectedSalary: '$1,500 - $2,000 sem.',
    availableSchedule: 'Medio Tiempo / Mañanas',
    skills: 'Manejo de caja, Preparación de café espresso, Trabajo en equipo',
    bio: 'Estudiante universitaria proactiva con 1 año de experiencia en cafeterías. Apasionada del buen trato al cliente.',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=250',
    banner: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600',
    lat: 18.8950,
    lng: -96.9320
  },
  {
    id: 'cand-2',
    name: 'Carlos Mendoza',
    age: '22 años',
    role: 'Auxiliar General / Repartidor',
    desiredRole: 'Repartidor / Almacenista',
    expectedSalary: '$1,800 sem.',
    availableSchedule: 'Tiempo Completo',
    skills: 'Licencia de conducir vigente, Puntualidad, Orientación GPS',
    bio: 'Disponibilidad inmediata para turnos matutinos o vespertinos. Responsable y con ganas de trabajar.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=250',
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
      html: `<div style="background-color: #4f46e5; width: 26px; height: 26px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: 12px;">📍</div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13]
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
            <h3 className="font-bold text-slate-800 text-sm">Selecciona la ubicación exacta</h3>
            <p className="text-[10px] text-slate-500">Arrastra el pin o haz clic en el punto deseado</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-full transition">
            <X size={16} />
          </button>
        </div>

        <div className="p-3 bg-white border-b border-slate-100">
          <form onSubmit={handleSearchOnMap} className="flex gap-2">
            <input 
              type="text" 
              placeholder="Buscar colonia, calle o ciudad..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-slate-100 px-3 py-2 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-xl text-xs font-bold transition">
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
              <p className="text-[10px] font-bold text-slate-400 uppercase">Dirección seleccionada:</p>
              <p className="text-xs font-medium text-slate-700">{addressName}</p>
            </div>
          </div>

          <button 
            type="button"
            onClick={() => onConfirm({ coords: selectedCoords, address: addressName })}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-2xl text-xs flex items-center justify-center space-x-2 shadow-lg transition active:scale-98"
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
  const [userRole, setUserRole] = useState('seeker'); 
  const [theme, setTheme] = useState('indigo'); // 'indigo' | 'dark' | 'emerald' | 'sunset'

  const [jobs, setJobs] = useState(DEMO_JOBS);
  const [candidates, setCandidates] = useState(DEMO_CANDIDATES);
  
  const [jobIndex, setJobIndex] = useState(0);
  const [candidateIndex, setCandidateIndex] = useState(0);
  
  const [matches, setMatches] = useState([]);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [lastMatch, setLastMatch] = useState(null);

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSavedNotice, setProfileSavedNotice] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Ubicación por defecto inicial (Córdoba)
  const [userCoords, setUserCoords] = useState({ lat: 18.8939, lng: -96.9356 });
  const [geoStatus, setGeoStatus] = useState('Obteniendo GPS...');

  // FILTRO DE RADAR DUAL (PUNTO A A PUNTO B EN KILÓMETROS)
  const [minDistance, setMinDistance] = useState(0);
  const [maxDistance, setMaxDistance] = useState(25);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const [activeChat, setActiveChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);
  const [reportReason, setReportReason] = useState('🚫 Perfil o empleo falso / fraude');

  // AUTENTICACIÓN GOOGLE & ENLACE MÁGICO
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // PERFIL COMPLETO DE CANDIDATO
  const [candidateProfile, setCandidateProfile] = useState({
    name: '',
    age: '21 años',
    role: 'Atención a Clientes',
    desiredRole: 'Barista / Mesera / Recepcionista',
    expectedSalary: '$1,500 - $2,200 sem.',
    availableSchedule: 'Medio Tiempo / Vespertino',
    skills: 'Puntualidad, Trabajo en equipo, Manejo de caja',
    bio: 'Joven entusiasta buscando oportunidades laborales formales o de medio tiempo.',
    avatar: null,
    banner: null
  });

  // DATOS PUBLICACIÓN DE VACANTE
  const [newTitle, setNewTitle] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [showMapPicker, setShowMapPicker] = useState(false);

  const [newSalary, setNewSalary] = useState('');
  const [newSchedule, setNewSchedule] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [businessLogo, setBusinessLogo] = useState(null);

  // PETICIÓN DE NAVEGADOR PARA GEOLOCALIZACIÓN
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
      setGeoStatus('GPS no disponible');
    }
  };

  useEffect(() => {
    requestLocation();
  }, []);

  // ESCUCHAR ENLACE MÁGICO Y ESTADO DE FIRESTORE
  useEffect(() => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let email = window.localStorage.getItem('emailForSignIn');
      if (!email) {
        email = window.prompt('Confirma tu correo electrónico:');
      }
      if (email) {
        setAuthLoading(true);
        signInWithEmailLink(auth, email, window.location.href)
          .then((result) => {
            window.localStorage.removeItem('emailForSignIn');
            setCurrentUser(result.user);
            setCurrentUserId(result.user.uid);
            setAuthLoading(false);
            alert("¡Correo verificado! Bienvenido a ChambaCerca.");
          })
          .catch((error) => {
            console.error(error);
            setAuthLoading(false);
          });
      }
    }

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

  // TRANSICIÓN ANIMADA DE PÁGINAS Y MODOS
  const navigateTo = (page, role = userRole) => {
    playSound('click');
    setIsTransitioning(true);
    setTimeout(() => {
      setUserRole(role);
      setCurrentPage(page);
      setJobIndex(0);
      setCandidateIndex(0);
      setIsTransitioning(false);
    }, 200);
  };

  // ESCUCHAR VACANTES DESDE FIRESTORE
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

  // ESCUCHAR PERFILES DESDE FIRESTORE
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

  // CARGAR MI PERFIL
  useEffect(() => {
    if (!currentUserId) return;
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, "perfiles", currentUserId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCandidateProfile(prev => ({ ...prev, ...docSnap.data() }));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchProfile();
  }, [currentUserId]);

  // ESCUCHAR MATCHES REALES EN TIEMPO REAL
  useEffect(() => {
    if (!currentUserId) return;
    const q = query(collection(db, "matches"), where("userId", "==", currentUserId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const matchDocs = snapshot.docs.map(d => ({ id: d.id, ...d.data().item, matchDocId: d.id }));
      setMatches(matchDocs);
    }, (err) => console.error(err));

    return () => unsubscribe();
  }, [currentUserId]);

  // INICIO DE SESIÓN GOOGLE
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

  // ENVIAR ENLACE MÁGICO
  const handleSendMagicLink = async (e) => {
    e.preventDefault();
    if (!emailInput) return;

    setAuthLoading(true);
    const actionCodeSettings = {
      url: window.location.href,
      handleCodeInApp: true,
    };

    try {
      await sendSignInLinkToEmail(auth, emailInput, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', emailInput);
      setEmailSent(true);
      setAuthLoading(false);
      playSound('message');
    } catch (error) {
      console.error(error);
      alert("No se pudo enviar el enlace.");
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setCurrentUserId('');
    playSound('click');
  };

  // GUARDAR PERFIL EN FIRESTORE
  const handleSaveProfile = async () => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    playSound('click');
    setIsSavingProfile(true);
    try {
      const docRef = doc(db, "perfiles", currentUserId);
      await setDoc(docRef, { ...candidateProfile, updatedAt: serverTimestamp() }, { merge: true });
      setIsSavingProfile(false);
      setProfileSavedNotice(true);
      setTimeout(() => setProfileSavedNotice(false), 3000);
    } catch (err) {
      console.error(err);
      setIsSavingProfile(false);
    }
  };

  // MANEJO DE IMÁGENES BASE64 DE PORTADA Y AVATAR
  const handleImageUpload = async (e, field) => {
    const file = e.target.files[0];
    if (file) {
      const base64 = await convertFileToBase64(file);
      setCandidateProfile(prev => ({ ...prev, [field]: base64 }));
    }
  };

  // =========================================================================
  // LÓGICA DE MATCH DE DOBLE VÍA (SIN MATCHES FALSOS)
  // =========================================================================
  const handleLike = async (item) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    playSound('like');
    const targetUserId = userRole === 'seeker' ? (item.ownerId || item.id) : item.id;

    try {
      // 1. Guardar el "like" emitido en la colección de Likes
      await addDoc(collection(db, "likes"), {
        fromUserId: currentUserId,
        toUserId: targetUserId,
        createdAt: serverTimestamp()
      });

      // 2. Consultar en Firestore si el usuario destino YA habia dado Like previamente al usuario actual
      const reciprocalQuery = query(
        collection(db, "likes"),
        where("fromUserId", "==", targetUserId),
        where("toUserId", "==", currentUserId)
      );

      const reciprocalSnap = await getDocs(reciprocalQuery);

      // ÚNICAMENTE SI EXISTE EL LIKE RECÍPROCO SE DESENCADENA EL MATCH
      if (!reciprocalSnap.empty) {
        setLastMatch(item);
        setShowMatchModal(true);
        playSound('match');

        // Crear registros de Match para ambos usuarios
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
      console.error("Error en procesamiento de Like:", err);
    }

    if (userRole === 'seeker') setJobIndex(jobIndex + 1);
    else setCandidateIndex(candidateIndex + 1);
  };

  const handlePass = () => {
    playSound('pass');
    if (userRole === 'seeker') setJobIndex(jobIndex + 1);
    else setCandidateIndex(candidateIndex + 1);
  };

  // FILTRADO DE RADAR GPS DUAL (DESDE PUNTO A HASTA PUNTO B)
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

  // CONFIGURACIÓN DE CLASES Y TEMAS
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
        <div className="w-24 h-24 bg-indigo-500/30 backdrop-blur-md rounded-full animate-ping"></div>
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

      {/* HEADER PRINCIPAL */}
      {currentPage !== 'landing' && !activeChat && (
        <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-4 py-3 flex justify-between items-center sticky top-0 z-30 shadow-sm">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigateTo('explore', userRole)}>
            <div className="bg-gradient-to-tr from-indigo-600 to-purple-600 text-white p-2 rounded-xl font-bold text-lg flex items-center justify-center w-9 h-9 shadow-md shadow-indigo-200 dark:shadow-none">
              ⚡
            </div>
            <span className="font-black text-xl tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              ChambaCerca
            </span>
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
              >
                <LogOut size={12} />
                <span>Salir</span>
              </button>
            )}

            <button 
              onClick={() => navigateTo('settings')}
              className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition"
              title="Ajustes y temas"
            >
              <Palette size={16} />
            </button>

            <button 
              onClick={() => {
                const nextRole = userRole === 'seeker' ? 'business' : 'seeker';
                navigateTo('explore', nextRole);
              }}
              className="text-xs font-bold bg-indigo-50 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 px-3 py-1.5 rounded-full border border-indigo-100 dark:border-slate-700 shadow-sm hover:scale-105 transition"
            >
              {userRole === 'seeker' ? '👤 Buscador' : '🏪 Negocio'}
            </button>
          </div>
        </header>
      )}

      <main className="flex-1 pb-20">

        {/* PÁGINA 1: LANDING CON ESTILO TINDER */}
        {currentPage === 'landing' && (
          <div className="min-h-screen flex flex-col justify-between p-6 bg-gradient-to-b from-indigo-900 via-indigo-800 to-slate-950 text-white">
            <div className="pt-10 text-center space-y-3">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-3xl mx-auto flex items-center justify-center text-4xl shadow-2xl border border-white/20 animate-bounce">
                ⚡
              </div>
              <h1 className="text-4xl font-black tracking-tight">ChambaCerca</h1>
              <p className="text-indigo-200 text-xs max-w-xs mx-auto leading-relaxed">
                Emparejamiento laboral dinámico y rápido por proximidad GPS.
              </p>

              <button 
                onClick={requestLocation}
                className="mt-2 bg-white/10 hover:bg-white/20 text-indigo-100 text-xs px-3.5 py-1.5 rounded-full border border-white/20 inline-flex items-center space-x-1.5 transition"
              >
                <Navigation size={12} className="animate-pulse" />
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
                <span>Busco Trabajo (Explorar Vacantes)</span>
              </button>

              <button 
                onClick={() => navigateTo('explore', 'business')}
                className="w-full bg-indigo-950/80 backdrop-blur-md text-indigo-200 font-extrabold py-3.5 rounded-2xl border border-indigo-400/30 hover:bg-indigo-900 transition flex items-center justify-center space-x-2 text-xs active:scale-98"
              >
                <Building size={16} />
                <span>Soy Negocio / Contratante</span>
              </button>
            </div>

            <div className="text-center text-[10px] text-indigo-300/60 pb-2">
              ChambaCerca • Conexión Directa GPS
            </div>
          </div>
        )}

        {/* PÁGINA 2: EXPLORAR CON RADAR DE RANGO DUAL */}
        {currentPage === 'explore' && (
          <div className="p-4 space-y-4">
            
            {/* Control de Radar GPS con Rango de Punto A a Punto B */}
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

            {/* Panel Desplegable con Controles Duales de Rango */}
            {showFilterPanel && (
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4 shadow-xl animate-fadeIn">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span>Rango del Radar GPS (Punto A ➔ Punto B)</span>
                  <span className="text-indigo-600">{minDistance} km a {maxDistance} km</span>
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

            {/* MODO BUSCADOR (VACANTES) */}
            {userRole === 'seeker' && (
              <>
                {currentJob ? (
                  <div className={`rounded-3xl border overflow-hidden shadow-2xl transition-all duration-300 animate-fadeIn ${getCardTheme()}`}>
                    <div className="h-44 bg-gradient-to-tr from-indigo-600 to-purple-600 relative p-4 flex items-end">
                      <div className="text-white space-y-0.5">
                        <span className="bg-white/20 backdrop-blur-md text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Vacante Activa
                        </span>
                        <h2 className="text-lg font-black leading-tight">{currentJob.title}</h2>
                        <p className="text-xs font-medium text-indigo-100">{currentJob.company}</p>
                      </div>

                      <button 
                        onClick={() => { setReportTarget(currentJob); setShowReportModal(true); }}
                        className="absolute top-3 right-3 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition"
                      >
                        <Flag size={14} />
                      </button>
                    </div>

                    <div className="p-5 space-y-4">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl flex items-center space-x-2">
                          <DollarSign size={16} className="text-emerald-500 shrink-0" />
                          <span className="font-bold">{currentJob.salary || 'Sueldo a tratar'}</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl flex items-center space-x-2">
                          <Clock size={16} className="text-indigo-500 shrink-0" />
                          <span className="font-bold">{currentJob.schedule || 'Horario flexible'}</span>
                        </div>
                      </div>

                      <div className="flex items-start space-x-2 text-xs text-slate-500 dark:text-slate-400">
                        <MapPin size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-slate-700 dark:text-slate-300">{currentJob.address}</p>
                          {userCoords && currentJob.lat && (
                            <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                              📍 A {calculateDistanceInKm(userCoords.lat, userCoords.lng, currentJob.lat, currentJob.lng)} km de ti
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Descripción</span>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{currentJob.description}</p>
                      </div>

                      {/* BOTONES DE ACCIÓN LIKES / PASS */}
                      <div className="flex justify-center space-x-6 pt-2">
                        <button 
                          onClick={handlePass}
                          className="w-14 h-14 rounded-full bg-rose-50 text-rose-500 border border-rose-200 flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition"
                        >
                          <X size={24} />
                        </button>

                        <button 
                          onClick={() => handleLike(currentJob)}
                          className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-200 hover:scale-110 active:scale-95 transition"
                        >
                          <Heart size={24} fill="currentColor" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 space-y-3 bg-white dark:bg-slate-900 rounded-3xl border p-6">
                    <Sparkles size={36} className="mx-auto text-indigo-500 animate-pulse" />
                    <h3 className="font-bold text-slate-700 dark:text-slate-200">¡Has visto todas las vacantes en este rango!</h3>
                    <p className="text-xs text-slate-400">Ajusta el rango de kilómetros en el radar para ver más empleos.</p>
                  </div>
                )}
              </>
            )}

            {/* MODO NEGOCIO (CANDIDATOS) */}
            {userRole === 'business' && (
              <>
                {currentCandidate ? (
                  <div className={`rounded-3xl border overflow-hidden shadow-2xl transition-all duration-300 animate-fadeIn ${getCardTheme()}`}>
                    
                    {/* BANNER DE FOTO DE PORTADA */}
                    <div className="h-36 bg-slate-200 relative">
                      {currentCandidate.banner ? (
                        <img src={currentCandidate.banner} alt="Portada" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-purple-500 to-indigo-600"></div>
                      )}

                      {/* AVATAR DE CANDIDATO */}
                      <div className="absolute -bottom-8 left-6">
                        <img 
                          src={currentCandidate.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                          alt="Avatar" 
                          className="w-20 h-20 rounded-2xl border-4 border-white shadow-md object-cover bg-white"
                        />
                      </div>

                      <button 
                        onClick={() => { setReportTarget(currentCandidate); setShowReportModal(true); }}
                        className="absolute top-3 right-3 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition"
                      >
                        <Flag size={14} />
                      </button>
                    </div>

                    <div className="pt-10 p-6 space-y-4">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h2 className="text-lg font-black">{currentCandidate.name}</h2>
                          <span className="text-xs font-bold text-slate-400">{currentCandidate.age}</span>
                        </div>
                        <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{currentCandidate.role}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Puesto Buscado</span>
                          <span className="font-semibold">{currentCandidate.desiredRole || 'General'}</span>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Sueldo Esperado</span>
                          <span className="font-semibold">{currentCandidate.expectedSalary || 'A convenir'}</span>
                        </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl space-y-1">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Habilidades clave</span>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{currentCandidate.skills}</p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Sobre mí</span>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{currentCandidate.bio}</p>
                      </div>

                      <div className="flex justify-center space-x-6 pt-2">
                        <button 
                          onClick={handlePass}
                          className="w-14 h-14 rounded-full bg-rose-50 text-rose-500 border border-rose-200 flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition"
                        >
                          <X size={24} />
                        </button>

                        <button 
                          onClick={() => handleLike(currentCandidate)}
                          className="w-14 h-14 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200 hover:scale-110 active:scale-95 transition"
                        >
                          <Heart size={24} fill="currentColor" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 space-y-3 bg-white dark:bg-slate-900 rounded-3xl border p-6">
                    <User size={36} className="mx-auto text-indigo-500" />
                    <h3 className="font-bold text-slate-700 dark:text-slate-200">Sin candidatos en este rango</h3>
                  </div>
                )}
              </>
            )}

          </div>
        )}

        {/* PÁGINA 3: CHAT Y CONEXIONES (MATCHES REALES) */}
        {currentPage === 'chat' && (
          <div className="p-4 space-y-4">
            <h2 className="font-black text-lg">Mensajes y Conexiones</h2>
            {matches.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <MessageSquare size={32} className="mx-auto" />
                <p className="text-xs">Aún no tienes matches recíprocos. ¡Explora vacantes o candidatos para conectar!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {matches.map(m => (
                  <div key={m.id || m.matchDocId} className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center space-x-3 shadow-sm hover:border-indigo-500 transition">
                    <div className="w-11 h-11 bg-indigo-100 rounded-xl flex items-center justify-center font-bold text-indigo-600 shrink-0">
                      {m.title ? '🏪' : '👤'}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-xs">{m.title || m.name}</h4>
                      <p className="text-[10px] text-slate-400">{m.company || m.role}</p>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Match Activo
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PÁGINA 4: PUBLICACIÓN DE VACANTE */}
        {currentPage === 'post-job' && (
          <div className="p-4 space-y-4">
            <h2 className="font-black text-lg">Publicar Nueva Vacante</h2>

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!currentUser) { setShowAuthModal(true); return; }
              try {
                await addDoc(collection(db, "vacantes"), {
                  title: newTitle, company: newCompany, address: newAddress || "Centro",
                  salary: newSalary, schedule: newSchedule, description: newDesc,
                  lat: userCoords.lat, lng: userCoords.lng, status: 'active', createdAt: serverTimestamp()
                });
                alert('¡Vacante publicada con éxito!');
                navigateTo('explore', 'seeker');
              } catch (err) { console.error(err); }
            }} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-3 shadow-md">
              <input type="text" placeholder="Título del Puesto" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 rounded-xl text-xs outline-none" required />
              <input type="text" placeholder="Nombre del Negocio" value={newCompany} onChange={(e) => setNewCompany(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 rounded-xl text-xs outline-none" required />
              <input type="text" placeholder="Sueldo (Ej. $1,500 sem.)" value={newSalary} onChange={(e) => setNewSalary(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 rounded-xl text-xs outline-none" />
              <input type="text" placeholder="Horario" value={newSchedule} onChange={(e) => setNewSchedule(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 rounded-xl text-xs outline-none" />
              <textarea placeholder="Descripción..." value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 rounded-xl text-xs outline-none" required />
              <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-2xl text-xs shadow-lg shadow-indigo-200 dark:shadow-none">Publicar Vacante</button>
            </form>
          </div>
        )}

        {/* PÁGINA 5: PERFIL EXTENDIDO (TIPO TINDER) */}
        {currentPage === 'profile' && (
          <div className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-black text-lg">Mi Perfil y Preferencias</h2>
              {profileSavedNotice && (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                  ✓ Guardado
                </span>
              )}
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4 shadow-md">
              
              {/* EDICIÓN DE FOTO DE AVATAR Y PORTADA */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-slate-400">Fotos de Perfil y Portada</label>
                
                <div className="h-28 bg-slate-100 dark:bg-slate-800 rounded-2xl relative overflow-hidden border">
                  {candidateProfile.banner ? (
                    <img src={candidateProfile.banner} alt="Portada" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">Sin portada</div>
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
                    <label className="text-[10px] font-bold uppercase text-slate-400">Puesto Buscado</label>
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
                  <label className="text-[10px] font-bold uppercase text-slate-400">Habilidades Clave</label>
                  <input type="text" value={candidateProfile.skills} onChange={(e) => setCandidateProfile({...candidateProfile, skills: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 rounded-xl text-xs outline-none" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Sobre Mí (Bio)</label>
                  <textarea rows="3" value={candidateProfile.bio} onChange={(e) => setCandidateProfile({...candidateProfile, bio: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 rounded-xl text-xs outline-none" />
                </div>

                <button onClick={handleSaveProfile} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-2xl text-xs shadow-lg shadow-indigo-200 dark:shadow-none transition active:scale-98">
                  {isSavingProfile ? 'Guardando...' : 'Guardar Perfil'}
                </button>
              </div>

            </div>
          </div>
        )}

        {/* PÁGINA 6: CONFIGURACIÓN Y TEMAS */}
        {currentPage === 'settings' && (
          <div className="p-4 space-y-4">
            <h2 className="font-black text-lg">Configuración de la App</h2>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4 shadow-md">
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Tema de Apariencia</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'indigo', name: '🟣 Indigo' },
                    { id: 'dark', name: '🌙 Oscuro' },
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
            <p className="text-xs text-indigo-200">
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

      {/* MODAL AUTENTICACIÓN GOOGLE */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 space-y-4 shadow-2xl relative">
            <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-slate-400">
              <X size={18} />
            </button>

            <div className="text-center space-y-1">
              <h3 className="font-black text-lg">Ingresar a ChambaCerca</h3>
              <p className="text-xs text-slate-400">Inicia sesión para interactuar y conectar</p>
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

      {/* NAVEGACIÓN INFERIOR (BOTTOM NAV) */}
      {currentPage !== 'landing' && (
        <nav className="fixed bottom-0 max-w-md w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 flex justify-around py-2.5 z-40">
          <button onClick={() => navigateTo('explore', userRole)} className={`flex flex-col items-center text-[10px] font-bold ${currentPage === 'explore' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
            <Search size={18} />
            <span>Explorar</span>
          </button>
          <button onClick={() => navigateTo('chat')} className={`flex flex-col items-center text-[10px] font-bold ${currentPage === 'chat' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
            <MessageSquare size={18} />
            <span>Mensajes</span>
          </button>
          <button onClick={() => navigateTo('post-job')} className={`flex flex-col items-center text-[10px] font-bold ${currentPage === 'post-job' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
            <Building size={18} />
            <span>Publicar</span>
          </button>
          <button onClick={() => navigateTo('profile')} className={`flex flex-col items-center text-[10px] font-bold ${currentPage === 'profile' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
            <User size={18} />
            <span>Perfil</span>
          </button>
        </nav>
      )}

    </div>
  );
}
