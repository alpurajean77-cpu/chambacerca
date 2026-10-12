import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, DollarSign, Clock, Heart, X, 
  MessageSquare, User, Building, Search, 
  Sliders, Navigation, Camera, Image as ImageIcon, Upload,
  Check, Save, Loader2,
  Trash2, CheckCircle, ShieldAlert, Settings, Palette,
  Lock, Flag, EyeOff, Sparkles, Send, ArrowLeft, LogOut, Mail
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

// TRABAJOS DE DEMOSTRACIÓN INICIALES (PARA EVITAR PANTALLA EN BLANCO)
const DEMO_JOBS = [
  {
    id: 'demo-job-1',
    title: 'Mesero / Atención a Clientes',
    company: 'Cafetería El Portal',
    salary: '$1,400 sem.',
    schedule: 'Turno Matutino',
    address: 'Centro, Córdoba, Ver.',
    description: 'Se busca mesero con buena actitud y disponibilidad inmediata para atención a mesas.',
    lat: 18.8939,
    lng: -96.9356,
    status: 'active'
  },
  {
    id: 'demo-job-2',
    title: 'Reparación e Instalación de Plomería',
    company: 'Plomería San José',
    salary: '$500 por trabajo',
    schedule: 'Horario flexible',
    address: 'Av. 3 y Calle 9, Córdoba, Ver.',
    description: 'Reparación urgente de fuga de agua e instalación de mezcladora.',
    lat: 18.8960,
    lng: -96.9320,
    status: 'active'
  },
  {
    id: 'demo-job-3',
    title: 'Auxiliar General / Repartidor',
    company: 'Refaccionaria del Centro',
    salary: '$1,600 sem.',
    schedule: 'Lunes a Sábado',
    address: 'Calle 11, Córdoba, Ver.',
    description: 'Reparto local de refacciones en motocicleta o camioneta pequeña.',
    lat: 18.8910,
    lng: -96.9390,
    status: 'active'
  }
];

// CANDIDATOS DE DEMOSTRACIÓN INICIALES
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
    lat: 18.8950,
    lng: -96.9320
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
      html: `<div style="background-color: #4f46e5; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: 10px;">📍</div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
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
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex flex-col justify-end sm:justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-md mx-auto rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[85vh]">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Selecciona la ubicación exacta</h3>
            <p className="text-[10px] text-slate-500">Haz clic en el mapa o arrastra el pin</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-200 text-slate-600 rounded-full">
            <X size={16} />
          </button>
        </div>

        <div className="p-3 bg-white border-b border-slate-100 space-y-2">
          <form onSubmit={handleSearchOnMap} className="flex gap-2">
            <input 
              type="text" 
              placeholder="Buscar calle o colonia..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-slate-100 px-3 py-2 rounded-xl text-xs outline-none"
            />
            <button type="submit" className="bg-indigo-600 text-white px-3 py-2 rounded-xl text-xs font-bold">
              Buscar
            </button>
          </form>
        </div>

        <div className="flex-1 relative w-full bg-slate-100">
          <div ref={mapContainerRef} className="w-full h-full z-10"></div>
        </div>

        <div className="p-4 bg-white border-t border-slate-100 space-y-3">
          <div className="bg-slate-50 p-2.5 rounded-2xl border flex items-start space-x-2">
            <MapPin size={18} className="text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Dirección seleccionada:</p>
              <p className="text-xs font-medium text-slate-700">{addressName}</p>
            </div>
          </div>

          <button 
            type="button"
            onClick={() => onConfirm({ coords: selectedCoords, address: addressName })}
            className="w-full bg-indigo-600 text-white font-bold py-3 rounded-2xl text-xs flex items-center justify-center space-x-2 shadow-lg"
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
  const [theme, setTheme] = useState('indigo');

  // Inicialización garantizada con datos de prueba para evitar pantallas en blanco
  const [jobs, setJobs] = useState(DEMO_JOBS);
  const [candidates, setCandidates] = useState(DEMO_CANDIDATES);
  
  const [jobIndex, setJobIndex] = useState(0);
  const [candidateIndex, setCandidateIndex] = useState(0);
  
  const [matches, setMatches] = useState([]);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [lastMatch, setLastMatch] = useState(null);

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSavedNotice, setProfileSavedNotice] = useState(false);

  // Ubicación por defecto inicial (Córdoba)
  const [userCoords, setUserCoords] = useState({ lat: 18.8939, lng: -96.9356 });
  const [geoStatus, setGeoStatus] = useState('Obteniendo GPS...');

  const [distanceFilter, setDistanceFilter] = useState(15); 
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const [activeChat, setActiveChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);
  const [reportReason, setReportReason] = useState('🚫 Perfil o empleo falso / fraude');

  // AUTENTICACIÓN SEGURA (GOOGLE Y ENLACE MÁGICO)
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // Perfil Candidato
  const [candidateProfile, setCandidateProfile] = useState({
    name: '',
    age: '20 años',
    role: 'Buscador de empleo',
    skills: 'Atención al cliente, Puntualidad',
    bio: 'Perfil en ChambaCerca.',
    avatar: null,
    banner: null
  });

  const [newTitle, setNewTitle] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [showMapPicker, setShowMapPicker] = useState(false);

  const [newSalary, setNewSalary] = useState('');
  const [newSchedule, setNewSchedule] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [businessLogo, setBusinessLogo] = useState(null);

  // SOLICITUD DIRECTA DE GEOLOCALIZACIÓN NATIVA
  const requestLocation = () => {
    if ("geolocation" in navigator) {
      setGeoStatus('Solicitando permiso...');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserCoords(coords);
          setSelectedCoords(coords);
          setGeoStatus('GPS Activo 📍');
        },
        (err) => {
          console.warn("GPS denegado:", err);
          setGeoStatus('Ubicación aproximada');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setGeoStatus('GPS no disponible');
    }
  };

  // Solicitar ubicación al cargar
  useEffect(() => {
    requestLocation();
  }, []);

  // VERIFICAR ENLACE MÁGICO Y SESIÓN DE FIRESTORE
  useEffect(() => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let email = window.localStorage.getItem('emailForSignIn');
      if (!email) {
        email = window.prompt('Por favor ingresa tu correo para confirmar el acceso:');
      }
      if (email) {
        setAuthLoading(true);
        signInWithEmailLink(auth, email, window.location.href)
          .then((result) => {
            window.localStorage.removeItem('emailForSignIn');
            setCurrentUser(result.user);
            setCurrentUserId(result.user.uid);
            setAuthLoading(false);
            alert("¡Correo verificado con éxito! Bienvenido a ChambaCerca.");
          })
          .catch((error) => {
            console.error("Error link:", error);
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

  const navigateTo = (page, role = userRole) => {
    playSound('click');
    setUserRole(role);
    setCurrentPage(page);
    setJobIndex(0);
    setCandidateIndex(0);
  };

  // ESCUCHAR VACANTES EN FIRESTORE (SI ESTÁ VACÍO, MANTIENE DEMO_JOBS)
  useEffect(() => {
    const q = query(collection(db, "vacantes"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const realJobs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        realJobs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setJobs(realJobs);
      }
    }, (err) => {
      console.warn("Usando datos de demostración para vacantes:", err);
    });
    return () => unsubscribe();
  }, []);

  // ESCUCHAR PERFILES EN FIRESTORE
  useEffect(() => {
    const q = query(collection(db, "perfiles"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const realProfiles = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setCandidates([...realProfiles, ...DEMO_CANDIDATES]);
      }
    }, (err) => {
      console.warn("Usando datos de demostración para perfiles:", err);
    });

    return () => unsubscribe();
  }, []);

  // ESCUCHAR MATCHES EN TIEMPO REAL
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
      alert("Error al iniciar sesión con Google.");
      setAuthLoading(false);
    }
  };

  // ENVIAR ENLACE MÁGICO AL CORREO
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
      console.error("Error correo:", error);
      alert("No se pudo enviar el enlace al correo.");
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

  // SISTEMA DE LIKE Y MATCH
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
      }
    } catch (err) {
      console.error(err);
    }

    if (userRole === 'seeker') setJobIndex(jobIndex + 1);
    else setCandidateIndex(candidateIndex + 1);
  };

  const handlePass = () => {
    playSound('pass');
    if (userRole === 'seeker') setJobIndex(jobIndex + 1);
    else setCandidateIndex(candidateIndex + 1);
  };

  const filteredJobs = jobs.filter(job => {
    if (job.status === 'filled') return false;
    if (!userCoords || !job.lat || !job.lng) return true;
    const dist = calculateDistanceInKm(userCoords.lat, userCoords.lng, job.lat, job.lng);
    return dist === null || parseFloat(dist) <= distanceFilter;
  });

  const filteredCandidates = candidates.filter(cand => {
    if (!userCoords || !cand.lat || !cand.lng) return true;
    const dist = calculateDistanceInKm(userCoords.lat, userCoords.lng, cand.lat, cand.lng);
    return dist === null || parseFloat(dist) <= distanceFilter;
  });

  const currentJob = filteredJobs[jobIndex];
  const currentCandidate = filteredCandidates[candidateIndex];

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col font-sans shadow-2xl relative overflow-hidden bg-slate-50 text-slate-800">

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

      {/* HEADER SUPERIOR */}
      {currentPage !== 'landing' && !activeChat && (
        <header className="bg-white/90 backdrop-blur-md border-b border-slate-100 px-4 py-3 flex justify-between items-center sticky top-0 z-30">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigateTo('explore', userRole)}>
            <div className="bg-indigo-600 text-white p-2 rounded-xl font-bold text-lg flex items-center justify-center w-9 h-9 shadow-md shadow-indigo-200">
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
                className="text-xs font-bold bg-indigo-600 text-white px-3 py-1.5 rounded-full shadow-sm"
              >
                Ingresar
              </button>
            ) : (
              <button 
                onClick={handleLogout}
                className="text-[10px] font-bold bg-rose-50 text-rose-600 px-2.5 py-1.5 rounded-full border border-rose-200 flex items-center space-x-1"
              >
                <LogOut size={12} />
                <span>Salir</span>
              </button>
            )}

            <button 
              onClick={() => {
                const nextRole = userRole === 'seeker' ? 'business' : 'seeker';
                navigateTo('explore', nextRole);
              }}
              className="text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full border border-indigo-100 shadow-sm"
            >
              {userRole === 'seeker' ? '👤 Buscador' : '🏪 Negocio'}
            </button>
          </div>
        </header>
      )}

      <main className="flex-1 pb-20">

        {/* PÁGINA 1: LANDING */}
        {currentPage === 'landing' && (
          <div className="min-h-screen flex flex-col justify-between p-6 bg-gradient-to-b from-indigo-900 via-indigo-800 to-slate-900 text-white">
            <div className="pt-10 text-center space-y-3">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-3xl mx-auto flex items-center justify-center text-4xl shadow-2xl border border-white/20 animate-bounce">
                ⚡
              </div>
              <h1 className="text-4xl font-black tracking-tight">ChambaCerca</h1>
              <p className="text-indigo-200 text-xs max-w-xs mx-auto">
                Empleos locales y servicios cerca de tu ubicación por radar GPS.
              </p>

              {/* Botón de estado GPS directo */}
              <button 
                onClick={requestLocation}
                className="mt-2 bg-white/10 hover:bg-white/20 text-indigo-100 text-xs px-3 py-1.5 rounded-full border border-white/20 inline-flex items-center space-x-1"
              >
                <Navigation size={12} className="animate-pulse" />
                <span>{geoStatus}</span>
              </button>
            </div>

            <div className="space-y-3 my-auto">
              {/* Botón de Inicio de Sesión Google */}
              {!currentUser && (
                <button 
                  onClick={handleGoogleSignIn}
                  className="w-full bg-white text-slate-800 font-extrabold py-3.5 rounded-2xl shadow-xl flex items-center justify-center space-x-2 text-xs"
                >
                  <span>🌐 Continuar con Google</span>
                </button>
              )}

              <button 
                onClick={() => navigateTo('explore', 'seeker')}
                className="w-full bg-indigo-500 text-white font-extrabold py-3.5 rounded-2xl shadow-xl hover:bg-indigo-400 transition flex items-center justify-center space-x-2 text-xs"
              >
                <User size={16} />
                <span>Busco Trabajo (Explorar Vacantes)</span>
              </button>

              <button 
                onClick={() => navigateTo('explore', 'business')}
                className="w-full bg-indigo-950/80 backdrop-blur-md text-indigo-200 font-extrabold py-3.5 rounded-2xl border border-indigo-400/30 hover:bg-indigo-900 transition flex items-center justify-center space-x-2 text-xs"
              >
                <Building size={16} />
                <span>Soy Negocio / Contratante</span>
              </button>
            </div>

            <div className="text-center text-[10px] text-indigo-300/60 pb-2">
              ChambaCerca • Conexión Laboral GPS
            </div>
          </div>
        )}

        {/* PÁGINA 2: EXPLORAR (TARJETAS RADAR) */}
        {currentPage === 'explore' && (
          <div className="p-4 space-y-4">
            
            {/* Control del Radar GPS */}
            <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-100 text-xs font-semibold shadow-sm">
              <button onClick={requestLocation} className="flex items-center space-x-2 text-indigo-600">
                <Navigation size={14} />
                <span>{geoStatus}</span>
              </button>
              <button 
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                className="flex items-center space-x-1 bg-slate-100 px-3 py-1.5 rounded-xl text-slate-700"
              >
                <Sliders size={12} />
                <span>Radar: {distanceFilter} km</span>
              </button>
            </div>

            {showFilterPanel && (
              <div className="bg-white p-4 rounded-2xl border space-y-3 shadow-lg">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span>Rango del radar GPS</span>
                  <span className="text-indigo-600">{distanceFilter} km</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="50" 
                  value={distanceFilter}
                  onChange={(e) => setDistanceFilter(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>
            )}

            {/* MODO BUSCADOR */}
            {userRole === 'seeker' && (
              <>
                {currentJob ? (
                  <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-xl">
                    <div className="h-44 bg-gradient-to-r from-indigo-500 to-purple-600 relative p-4 flex items-end">
                      <div className="text-white space-y-0.5">
                        <span className="bg-white/20 backdrop-blur-md text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                          Vacante
                        </span>
                        <h2 className="text-lg font-black leading-tight">{currentJob.title}</h2>
                        <p className="text-xs font-medium text-indigo-100">{currentJob.company}</p>
                      </div>
                    </div>

                    <div className="p-5 space-y-4">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-slate-50 p-2.5 rounded-xl flex items-center space-x-2">
                          <DollarSign size={16} className="text-emerald-500 shrink-0" />
                          <span className="font-bold">{currentJob.salary || 'A tratar'}</span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl flex items-center space-x-2">
                          <Clock size={16} className="text-indigo-500 shrink-0" />
                          <span className="font-bold">{currentJob.schedule || 'Flexible'}</span>
                        </div>
                      </div>

                      <div className="flex items-start space-x-2 text-xs text-slate-500">
                        <MapPin size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-slate-700">{currentJob.address}</p>
                          {userCoords && currentJob.lat && (
                            <p className="text-[10px] text-indigo-600 font-bold">
                              📍 A {calculateDistanceInKm(userCoords.lat, userCoords.lng, currentJob.lat, currentJob.lng)} km
                            </p>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">{currentJob.description}</p>

                      <div className="flex justify-center space-x-6 pt-2">
                        <button 
                          onClick={handlePass}
                          className="w-14 h-14 rounded-full bg-rose-50 text-rose-500 border border-rose-200 flex items-center justify-center shadow-lg"
                        >
                          <X size={24} />
                        </button>

                        <button 
                          onClick={() => handleLike(currentJob)}
                          className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-200"
                        >
                          <Heart size={24} fill="currentColor" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 space-y-3 bg-white rounded-3xl border p-6">
                    <Sparkles size={36} className="mx-auto text-indigo-500 animate-pulse" />
                    <h3 className="font-bold text-slate-700">¡Has visto todas las vacantes en este rango!</h3>
                    <p className="text-xs text-slate-400">Aumenta los kilómetros del radar arriba para ver más vacantes.</p>
                  </div>
                )}
              </>
            )}

            {/* MODO NEGOCIO */}
            {userRole === 'business' && (
              <>
                {currentCandidate ? (
                  <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-xl">
                    <div className="h-32 bg-indigo-600 relative">
                      <div className="absolute -bottom-6 left-6">
                        <img 
                          src={currentCandidate.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                          alt="Avatar" 
                          className="w-16 h-16 rounded-2xl border-4 border-white shadow-md object-cover bg-white"
                        />
                      </div>
                    </div>

                    <div className="pt-8 p-6 space-y-3">
                      <div>
                        <h2 className="text-lg font-black">{currentCandidate.name}</h2>
                        <p className="text-xs font-bold text-indigo-600">{currentCandidate.role}</p>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-2xl">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Habilidades</span>
                        <p className="text-xs font-semibold text-slate-700">{currentCandidate.skills}</p>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">{currentCandidate.bio}</p>

                      <div className="flex justify-center space-x-6 pt-2">
                        <button 
                          onClick={handlePass}
                          className="w-14 h-14 rounded-full bg-rose-50 text-rose-500 border border-rose-200 flex items-center justify-center shadow-lg"
                        >
                          <X size={24} />
                        </button>

                        <button 
                          onClick={() => handleLike(currentCandidate)}
                          className="w-14 h-14 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200"
                        >
                          <Heart size={24} fill="currentColor" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 space-y-3 bg-white rounded-3xl border p-6">
                    <User size={36} className="mx-auto text-indigo-500" />
                    <h3 className="font-bold text-slate-700">Sin candidatos disponibles</h3>
                  </div>
                )}
              </>
            )}

          </div>
        )}

        {/* PÁGINA 3: CHAT Y MATCHES */}
        {currentPage === 'chat' && (
          <div className="p-4 space-y-4">
            <h2 className="font-black text-lg">Mensajes y Conexiones</h2>
            {matches.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <MessageSquare size={32} className="mx-auto" />
                <p className="text-xs">Aún no tienes matches. ¡Explora y conecta!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {matches.map(m => (
                  <div key={m.id || m.matchDocId} className="bg-white p-3 rounded-2xl border flex items-center space-x-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center font-bold text-indigo-600">
                      {m.title ? '🏪' : '👤'}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs">{m.title || m.name}</h4>
                      <p className="text-[10px] text-slate-400">{m.company || m.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PÁGINA 4: PUBLICAR VACANTE */}
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
                alert('¡Vacante publicada!');
                navigateTo('explore', 'seeker');
              } catch (err) { console.error(err); }
            }} className="bg-white p-5 rounded-3xl border space-y-3">
              <input type="text" placeholder="Título del Puesto" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl text-xs outline-none" required />
              <input type="text" placeholder="Nombre del Negocio" value={newCompany} onChange={(e) => setNewCompany(e.target.value)} className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl text-xs outline-none" required />
              <input type="text" placeholder="Sueldo" value={newSalary} onChange={(e) => setNewSalary(e.target.value)} className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl text-xs outline-none" />
              <input type="text" placeholder="Horario" value={newSchedule} onChange={(e) => setNewSchedule(e.target.value)} className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl text-xs outline-none" />
              <textarea placeholder="Descripción..." value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl text-xs outline-none" required />
              <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-2xl text-xs">Publicar</button>
            </form>
          </div>
        )}

        {/* PÁGINA 5: PERFIL */}
        {currentPage === 'profile' && (
          <div className="p-4 space-y-4">
            <h2 className="font-black text-lg">Mi Perfil</h2>
            <div className="bg-white p-5 rounded-3xl border space-y-3">
              <input type="text" placeholder="Tu Nombre" value={candidateProfile.name} onChange={(e) => setCandidateProfile({...candidateProfile, name: e.target.value})} className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl text-xs outline-none" />
              <input type="text" placeholder="Especialidad / Puesto" value={candidateProfile.role} onChange={(e) => setCandidateProfile({...candidateProfile, role: e.target.value})} className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl text-xs outline-none" />
              <button onClick={handleSaveProfile} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-2xl text-xs">Guardar Cambios</button>
            </div>
          </div>
        )}

      </main>

      {/* MODAL AUTENTICACIÓN GOOGLE */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 space-y-4 shadow-2xl relative">
            <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-slate-400">
              <X size={18} />
            </button>

            <div className="text-center space-y-1">
              <h3 className="font-black text-lg">Ingresar a ChambaCerca</h3>
              <p className="text-xs text-slate-400">Inicia sesión para guardar tu progreso</p>
            </div>

            <button 
              onClick={handleGoogleSignIn}
              disabled={authLoading}
              className="w-full bg-slate-100 text-slate-800 font-bold py-3.5 rounded-2xl text-xs flex items-center justify-center space-x-2 border"
            >
              <span>🌐 Continuar con Google</span>
            </button>
          </div>
        </div>
      )}

      {/* NAVEGACIÓN INFERIOR */}
      {currentPage !== 'landing' && (
        <nav className="fixed bottom-0 max-w-md w-full bg-white border-t border-slate-100 flex justify-around py-2.5 z-40">
          <button onClick={() => navigateTo('explore', userRole)} className={`flex flex-col items-center text-[10px] font-bold ${currentPage === 'explore' ? 'text-indigo-600' : 'text-slate-400'}`}>
            <Search size={18} />
            <span>Explorar</span>
          </button>
          <button onClick={() => navigateTo('chat')} className={`flex flex-col items-center text-[10px] font-bold ${currentPage === 'chat' ? 'text-indigo-600' : 'text-slate-400'}`}>
            <MessageSquare size={18} />
            <span>Mensajes</span>
          </button>
          <button onClick={() => navigateTo('post-job')} className={`flex flex-col items-center text-[10px] font-bold ${currentPage === 'post-job' ? 'text-indigo-600' : 'text-slate-400'}`}>
            <Building size={18} />
            <span>Publicar</span>
          </button>
          <button onClick={() => navigateTo('profile')} className={`flex flex-col items-center text-[10px] font-bold ${currentPage === 'profile' ? 'text-indigo-600' : 'text-slate-400'}`}>
            <User size={18} />
            <span>Perfil</span>
          </button>
        </nav>
      )}

    </div>
  );
}
