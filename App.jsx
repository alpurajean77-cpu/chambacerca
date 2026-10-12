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

const convertFileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

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

// MODAL MAPA INTERACTIVO (LEAFLET)
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

  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [jobIndex, setJobIndex] = useState(0);
  const [candidateIndex, setCandidateIndex] = useState(0);
  
  const [matches, setMatches] = useState([]);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [lastMatch, setLastMatch] = useState(null);

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSavedNotice, setProfileSavedNotice] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const [userCoords, setUserCoords] = useState(null);
  const [geoStatus, setGeoStatus] = useState('Solicitando GPS...');

  // INTERVALO DE DISTANCIA (MÍNIMO Y MÁXIMO EN KM)
  const [minDistanceFilter, setMinDistanceFilter] = useState(0); 
  const [maxDistanceFilter, setMaxDistanceFilter] = useState(20); 
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const [activeChat, setActiveChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');

  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);
  const [reportReason, setReportReason] = useState('🚫 Perfil o empleo falso / fraude');

  // AUTENTICACIÓN: MODAL VISIBLE DE FORMA AUTOMÁTICA AL ABRIR LA APP
  const [showAuthModal, setShowAuthModal] = useState(true);
  const [emailInput, setEmailInput] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // Perfil Candidato
  const [candidateProfile, setCandidateProfile] = useState({
    name: '',
    age: '',
    role: '',
    skills: '',
    bio: '',
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

  // GEOLOCALIZACIÓN NATIVA CON SOLICITUD DE PERMISOS ACTIVA
  const requestGPSLocation = () => {
    setGeoStatus('Obteniendo ubicación GPS...');
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserCoords(coords);
          setSelectedCoords(coords);
          setGeoStatus('GPS Activo 📍');
        },
        (err) => {
          console.warn("Error GPS:", err);
          setGeoStatus('Ubicación no permitida ⚠️');
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    } else {
      setGeoStatus('GPS no soportado');
    }
  };

  useEffect(() => {
    requestGPSLocation();
  }, []);

  // VERIFICAR ENLACE MÁGICO DE CORREO Y SESIÓN DE USUARIO
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
            setShowAuthModal(false);
            setAuthLoading(false);
            alert("¡Correo verificado con éxito! Bienvenido a ChambaCerca.");
          })
          .catch((error) => {
            console.error("Error al ingresar con link:", error);
            setAuthLoading(false);
            alert("El enlace ha expirado o es inválido.");
          });
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        setCurrentUserId(user.uid);
        setShowAuthModal(false); // Ocultar modal si ya hay sesión iniciada
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
      setIsTransitioning(false);
    }, 250);
  };

  // CARGAR MI PERFIL DESDE FIREBASE
  useEffect(() => {
    if (!currentUserId) return;
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, "perfiles", currentUserId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setCandidateProfile(docSnap.data());
        } else {
          const initialData = {
            name: currentUser?.displayName || 'Usuario ChambaCerca',
            age: '20 años',
            role: 'Buscando Empleo',
            skills: 'Atención al cliente, Puntualidad',
            bio: 'Perfil verificado en ChambaCerca.',
            avatar: currentUser?.photoURL || null,
            banner: null
          };
          await setDoc(docRef, initialData);
          setCandidateProfile(initialData);
        }
      } catch (err) {
        console.error("Error al cargar perfil:", err);
      }
    };

    fetchProfile();
  }, [currentUserId, currentUser]);

  // ESCUCHAR PERFILES EN TIEMPO REAL
  useEffect(() => {
    const q = query(collection(db, "perfiles"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const realProfiles = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

      realProfiles.sort((a, b) => {
        const timeA = a.updatedAt?.seconds || 0;
        const timeB = b.updatedAt?.seconds || 0;
        return timeB - timeA;
      });

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

  // MATCHES EN TIEMPO REAL
  useEffect(() => {
    if (!currentUserId) return;
    const q = query(collection(db, "matches"), where("userId", "==", currentUserId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const matchDocs = snapshot.docs.map(d => ({ id: d.id, ...d.data().item, matchDocId: d.id }));
      setMatches(matchDocs);
    }, (err) => console.error("Error al obtener matches:", err));

    return () => unsubscribe();
  }, [currentUserId]);

  // ESCUCHAR VACANTES
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

  // ESCUCHAR CHAT ACTIVO
  useEffect(() => {
    if (!activeChat) return;

    const chatId = activeChat.matchDocId || activeChat.id;
    const q = query(
      collection(db, "chats", chatId, "mensajes")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      msgs.sort((a,b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
      setChatMessages(msgs);
    }, (err) => {
      console.error("Error al obtener mensajes:", err);
    });

    return () => unsubscribe();
  }, [activeChat]);

  // INICIO DE SESIÓN CON GOOGLE (GMAIL)
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
      console.error("Error enlace mágico:", error);
      alert("No se pudo enviar el enlace al correo.");
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setCurrentUserId('');
    playSound('click');
    setShowAuthModal(true);
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
      const dataToSave = {
        ...candidateProfile,
        updatedAt: serverTimestamp()
      };
      await setDoc(docRef, dataToSave, { merge: true });

      setIsSavingProfile(false);
      setProfileSavedNotice(true);
      setTimeout(() => setProfileSavedNotice(false), 3000);
    } catch (err) {
      console.error("Error al guardar perfil:", err);
      setIsSavingProfile(false);
      alert(`Error al guardar perfil: ${err.message}`);
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
      console.error("Error al procesar Like/Match:", err);
    }

    if (userRole === 'seeker') setJobIndex(jobIndex + 1);
    else setCandidateIndex(candidateIndex + 1);
  };

  const handlePass = () => {
    playSound('pass');
    if (userRole === 'seeker') setJobIndex(jobIndex + 1);
    else setCandidateIndex(candidateIndex + 1);
  };

  // ENVIAR MENSAJE
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessageText.trim() || !activeChat || !currentUser) return;

    const textToSend = newMessageText;
    setNewMessageText('');
    playSound('message');

    const chatId = activeChat.matchDocId || activeChat.id;

    try {
      await addDoc(collection(db, "chats", chatId, "mensajes"), {
        senderId: currentUserId,
        text: textToSend,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Error al enviar mensaje:", err);
    }
  };

  const handleToggleJobStatus = async (jobId, currentStatus) => {
    playSound('click');
    const newStatus = currentStatus === 'filled' ? 'active' : 'filled';
    try {
      await updateDoc(doc(db, "vacantes", jobId), { status: newStatus });
    } catch (err) {
      alert("Error al actualizar la vacante");
    }
  };

  const handleDeleteJob = async (jobId) => {
    playSound('pass');
    if (confirm("¿Seguro que deseas eliminar esta vacante permanentemente?")) {
      try {
        await deleteDoc(doc(db, "vacantes", jobId));
      } catch (err) {
        alert("Error al eliminar la vacante");
      }
    }
  };

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

  const handleConfirmLocation = ({ coords, address }) => {
    setSelectedCoords(coords);
    setNewAddress(address);
    setShowMapPicker(false);
  };

  const handlePostJob = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    if (!selectedCoords) {
      alert("Por favor selecciona la ubicación en el mapa.");
      return;
    }

    try {
      await addDoc(collection(db, "vacantes"), {
        title: newTitle,
        company: newCompany,
        address: newAddress || "Ubicación confirmada",
        salary: newSalary,
        schedule: newSchedule,
        description: newDesc,
        lat: selectedCoords.lat,
        lng: selectedCoords.lng,
        logo: businessLogo || null,
        ownerId: currentUserId,
        status: 'active',
        createdAt: serverTimestamp()
      });

      setNewTitle(''); setNewCompany(''); setNewAddress('');
      setNewSalary(''); setNewSchedule(''); setNewDesc('');
      setBusinessLogo(null);

      playSound('match');
      alert('¡Vacante publicada exitosamente!');
      navigateTo('explore', 'seeker');
    } catch (err) {
      console.error(err);
      alert('Error al publicar vacante.');
    }
  };

  const handleReportSubmit = async () => {
    if (!reportTarget) return;

    try {
      await addDoc(collection(db, "reportes"), {
        targetId: reportTarget.id,
        targetTitle: reportTarget.title || reportTarget.name || 'Sin nombre',
        targetType: userRole === 'seeker' ? 'vacante' : 'candidato',
        reason: reportReason,
        reporterId: currentUserId || 'anonimo',
        status: 'pendiente',
        createdAt: serverTimestamp()
      });

      playSound('click');
      alert("🚩 Reporte registrado. El equipo revisará esta alerta.");
      setShowReportModal(false);
    } catch (err) {
      console.error("Error al reportar:", err);
      alert("No se pudo enviar el reporte.");
    }
  };

  // FILTRADO DE DISTANCIA ESTRICTO CON RANGO MÍNIMO Y MÁXIMO
  const filteredJobs = jobs.filter(job => {
    if (job.status === 'filled') return false;
    if (!userCoords || !job.lat || !job.lng) return true;
    const dist = calculateDistanceInKm(userCoords.lat, userCoords.lng, job.lat, job.lng);
    if (dist === null) return true;
    const distNum = parseFloat(dist);
    return distNum >= minDistanceFilter && distNum <= maxDistanceFilter;
  });

  const filteredCandidates = candidates.filter(cand => {
    if (!userCoords || !cand.lat || !cand.lng) return true;
    const dist = calculateDistanceInKm(userCoords.lat, userCoords.lng, cand.lat, cand.lng);
    if (dist === null) return true;
    const distNum = parseFloat(dist);
    return distNum >= minDistanceFilter && distNum <= maxDistanceFilter;
  });

  const myPostedJobs = jobs.filter(job => job.ownerId === currentUserId);

  const getThemeClasses = () => {
    switch (theme) {
      case 'dark':
        return 'bg-slate-950 text-slate-100';
      case 'emerald':
        return 'bg-emerald-50 text-slate-800';
      case 'sunset':
        return 'bg-amber-50 text-slate-800';
      default:
        return 'bg-slate-50 text-slate-800';
    }
  };

  const getCardClasses = () => {
    if (theme === 'dark') return 'bg-slate-900 border-slate-800 text-white';
    return 'bg-white border-slate-100 text-slate-800';
  };

  return (
    <div className={`max-w-md mx-auto min-h-screen flex flex-col font-sans shadow-2xl relative overflow-hidden transition-colors duration-300 ${getThemeClasses()}`}>

      {showMapPicker && (
        <MapPickerModal 
          initialCoords={selectedCoords}
          userCoords={userCoords}
          onConfirm={handleConfirmLocation}
          onClose={() => setShowMapPicker(false)}
        />
      )}

      {/* TRANSICIÓN DINÁMICA */}
      <div className={`fixed inset-0 pointer-events-none z-50 transition-all duration-300 ease-out flex items-center justify-center ${isTransitioning ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
        <div className="w-96 h-96 bg-indigo-500/30 backdrop-blur-xl rounded-full animate-ping"></div>
      </div>

      {currentPage !== 'landing' && !activeChat && (
        <header className={`${theme === 'dark' ? 'bg-slate-900/90 border-slate-800' : 'bg-white/80 border-slate-100'} backdrop-blur-md border-b px-4 py-3 flex justify-between items-center sticky top-0 z-30`}>
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
                title="Cerrar sesión"
              >
                <LogOut size={12} />
                <span>Salir</span>
              </button>
            )}

            <button 
              onClick={() => navigateTo('settings')}
              className={`p-2 rounded-full border transition ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'}`}
            >
              <Settings size={16} />
            </button>

            <button 
              onClick={() => {
                const nextRole = userRole === 'seeker' ? 'business' : 'seeker';
                navigateTo('explore', nextRole);
              }}
              className="text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full border border-indigo-100 flex items-center space-x-1 shadow-sm"
            >
              {userRole === 'seeker' ? <span>👤 Buscador</span> : <span>🏪 Modo Negocio</span>}
            </button>
          </div>
        </header>
      )}

      <main className="flex-1 pb-20">
        
        {/* LANDING PAGE */}
        {currentPage === 'landing' && (
          <div className="p-6 flex flex-col items-center justify-between min-h-screen bg-gradient-to-b from-indigo-600 via-indigo-700 to-violet-800 text-white text-center relative overflow-hidden">
            <div className="my-auto space-y-6 pt-10 z-10">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-3xl mx-auto flex items-center justify-center text-4xl shadow-inner border border-white/20 animate-bounce">
                ⚡
              </div>
              <h1 className="text-4xl font-black tracking-tight leading-tight">ChambaCerca</h1>
              <p className="text-indigo-100 text-sm max-w-xs mx-auto leading-relaxed">
                El Tinder de los trabajos locales. Rápido, seguro y cerca de ti. 🚀
              </p>

              <div className="pt-6 space-y-3 w-full max-w-xs mx-auto">
                <button 
                  onClick={() => navigateTo('explore', 'seeker')}
                  className="w-full bg-white text-indigo-700 font-bold py-3.5 px-6 rounded-2xl shadow-lg hover:scale-105 transition flex items-center justify-center space-x-2"
                >
                  <Search size={18} />
                  <span>Busco Empleo</span>
                </button>
                <button 
                  onClick={() => navigateTo('explore', 'business')}
                  className="w-full bg-indigo-500/30 backdrop-blur-md text-white font-semibold py-3.5 px-6 rounded-2xl border border-white/30 hover:bg-white/20 transition flex items-center justify-center space-x-2"
                >
                  <Building size={18} />
                  <span>Soy Negocio</span>
                </button>
              </div>
            </div>

            <button 
              onClick={() => setShowPrivacyModal(true)} 
              className="text-[11px] text-indigo-200 underline pb-4 flex items-center justify-center space-x-1"
            >
              <Lock size={12} />
              <span>Políticas de Seguridad y Privacidad</span>
            </button>
          </div>
        )}

        {/* EXPLORAR / MATCHING CON RADAR DE INTERVALO DE DISTANCIA (MIN - MAX) */}
        {currentPage === 'explore' && (
          <div className="p-4 space-y-4">
            
            <div className={`p-3 rounded-2xl shadow-sm border space-y-2 ${getCardClasses()}`}>
              <div className="flex justify-between items-center text-xs font-semibold">
                <button 
                  onClick={requestGPSLocation}
                  className="flex items-center space-x-1.5 hover:text-indigo-600 transition"
                  title="Haz clic para actualizar tu GPS"
                >
                  <Navigation size={14} className="text-indigo-500 animate-pulse" />
                  <span>{geoStatus}</span>
                </button>

                <div className="flex items-center space-x-2">
                  <span className="bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-md text-[10px]">
                    {userRole === 'seeker' ? `${filteredJobs.length} Vacantes` : `${filteredCandidates.length} Candidatos`}
                  </span>

                  <button 
                    onClick={() => setShowFilterPanel(!showFilterPanel)}
                    className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[11px] font-bold flex items-center space-x-1 border border-indigo-100"
                  >
                    <Sliders size={12} />
                    <span>Radar: {minDistanceFilter} - {maxDistanceFilter} km</span>
                  </button>
                </div>
              </div>

              {/* PANEL DE DOS BARRAS DESLIZANTES PARA RANGO DE DISTANCIA */}
              {showFilterPanel && (
                <div className="pt-3 border-t space-y-3">
                  <div className="flex justify-between text-[11px] font-bold opacity-80">
                    <span>Margen de distancia seleccionado:</span>
                    <span className="text-indigo-600 font-extrabold">{minDistanceFilter} km  a  {maxDistanceFilter} km</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 block">Mínimo: {minDistanceFilter} km</label>
                      <input 
                        type="range" 
                        min="0" 
                        max={maxDistanceFilter} 
                        value={minDistanceFilter}
                        onChange={(e) => setMinDistanceFilter(Number(e.target.value))}
                        className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 block">Máximo: {maxDistanceFilter} km</label>
                      <input 
                        type="range" 
                        min={minDistanceFilter} 
                        max="100" 
                        value={maxDistanceFilter}
                        onChange={(e) => setMaxDistanceFilter(Number(e.target.value))}
                        className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {userRole === 'seeker' ? (
              loading ? (
                <div className="text-center py-20 text-xs text-slate-500 animate-pulse">Cargando vacantes cercanas... 🌀</div>
              ) : jobIndex < filteredJobs.length ? (
                <div className={`rounded-3xl shadow-xl border overflow-hidden flex flex-col justify-between min-h-[480px] relative ${getCardClasses()}`}>
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
                            : 'Distancia desconocida'}
                        </span>
                      </div>

                      <button 
                        onClick={() => { setReportTarget(filteredJobs[jobIndex]); setShowReportModal(true); }}
                        className="absolute top-3 left-3 bg-slate-900/60 text-white p-1.5 rounded-full backdrop-blur-md"
                        title="Reportar vacante falsa"
                      >
                        <Flag size={12} />
                      </button>
                    </div>

                    <div className="p-5 space-y-3">
                      <h3 className="font-bold text-xl">{filteredJobs[jobIndex].title}</h3>
                      <p className="text-xs font-semibold text-indigo-500">{filteredJobs[jobIndex].company}</p>
                      
                      <p className="text-[11px] opacity-60 flex items-center space-x-1">
                        <MapPin size={12} />
                        <span className="truncate">{filteredJobs[jobIndex].address}</span>
                      </p>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                        <div className="bg-slate-50 border p-2 rounded-xl flex items-center space-x-2 text-slate-700">
                          <DollarSign size={14} className="text-emerald-500" />
                          <span>{filteredJobs[jobIndex].salary}</span>
                        </div>
                        <div className="bg-slate-50 border p-2 rounded-xl flex items-center space-x-2 text-slate-700">
                          <Clock size={14} className="text-amber-500" />
                          <span>{filteredJobs[jobIndex].schedule}</span>
                        </div>
                      </div>

                      <p className="text-xs opacity-80 leading-relaxed">{filteredJobs[jobIndex].description}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-500/5 border-t flex justify-around">
                    <button onClick={handlePass} className="w-14 h-14 bg-white text-slate-400 rounded-full shadow-md flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition border">
                      <X size={26} />
                    </button>
                    <button onClick={() => handleLike(filteredJobs[jobIndex])} className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition">
                      <Heart size={30} className="fill-white" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className={`rounded-3xl p-8 text-center space-y-4 shadow-sm my-10 ${getCardClasses()}`}>
                  <div className="text-4xl">📍</div>
                  <h3 className="font-bold">No hay vacantes en el margen de {minDistanceFilter} km a {maxDistanceFilter} km</h3>
                  <p className="text-xs text-slate-400">Intenta ampliar tu margen de búsqueda en el botón de Radar.</p>
                  <button onClick={() => setJobIndex(0)} className="bg-indigo-600 text-white font-bold text-xs py-3 px-6 rounded-2xl">Reiniciar Lista</button>
                </div>
              )
            ) : (
              candidateIndex < filteredCandidates.length ? (
                <div className={`rounded-3xl shadow-xl border overflow-hidden flex flex-col justify-between min-h-[480px] relative ${getCardClasses()}`}>
                  <div>
                    <div className="h-28 bg-indigo-100 relative overflow-hidden flex items-center justify-center">
                      {filteredCandidates[candidateIndex].banner ? (
                        <img src={filteredCandidates[candidateIndex].banner} alt="Portada" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white/50 text-xs">
                          Sin Foto de Portada
                        </div>
                      )}
                      
                      <button 
                        onClick={() => { setReportTarget(filteredCandidates[candidateIndex]); setShowReportModal(true); }}
                        className="absolute top-3 left-3 bg-slate-900/60 text-white p-1.5 rounded-full backdrop-blur-md"
                        title="Reportar candidato"
                      >
                        <Flag size={12} />
                      </button>
                    </div>

                    <div className="px-5 relative flex justify-between items-end -mt-10 mb-3">
                      <div className="w-18 h-18 rounded-2xl bg-white p-1 shadow-md">
                        {filteredCandidates[candidateIndex].avatar ? (
                          <img src={filteredCandidates[candidateIndex].avatar} alt="Perfil" className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          <div className="w-full h-full bg-slate-100 rounded-xl flex items-center justify-center text-2xl">👨‍🎓</div>
                        )}
                      </div>
                    </div>

                    <div className="p-5 pt-0 space-y-3">
                      <div>
                        <h3 className="font-bold text-xl">
                          {filteredCandidates[candidateIndex].name || 'Candidato sin Nombre'}
                        </h3>
                        <p className="text-xs font-bold text-indigo-500">
                          {filteredCandidates[candidateIndex].role || 'Buscando Empleo'} • {filteredCandidates[candidateIndex].age || 'Sin edad'}
                        </p>
                      </div>

                      <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/50 space-y-1">
                        <h4 className="text-[10px] font-bold text-indigo-400 uppercase">Habilidades</h4>
                        <p className="text-xs font-medium text-indigo-900">
                          {filteredCandidates[candidateIndex].skills || 'No especificadas'}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-[10px] font-bold opacity-40 uppercase">Sobre mí</h4>
                        <p className="text-xs opacity-80 leading-relaxed">
                          {filteredCandidates[candidateIndex].bio || 'Sin descripción disponible.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-500/5 border-t flex justify-around">
                    <button onClick={handlePass} className="w-14 h-14 bg-white text-slate-400 rounded-full shadow-md flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition border">
                      <X size={26} />
                    </button>
                    <button onClick={() => handleLike(filteredCandidates[candidateIndex])} className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition">
                      <Heart size={30} className="fill-white" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className={`rounded-3xl p-8 text-center space-y-4 shadow-sm my-10 ${getCardClasses()}`}>
                  <div className="text-4xl">👨‍🎓</div>
                  <h3 className="font-bold">No hay prospectos en el rango de {minDistanceFilter} km a {maxDistanceFilter} km</h3>
                  <button onClick={() => setCandidateIndex(0)} className="bg-indigo-600 text-white font-bold text-xs py-3 px-6 rounded-2xl">Volver a revisar</button>
                </div>
              )
            )}

          </div>
        )}

        {/* CHAT DIRECTO EN TIEMPO REAL */}
        {activeChat ? (
          <div className="flex flex-col h-[85vh] bg-slate-50">
            <div className="p-3 bg-white border-b flex items-center justify-between sticky top-0 z-20 shadow-sm">
              <div className="flex items-center space-x-3">
                <button onClick={() => setActiveChat(null)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-full">
                  <ArrowLeft size={18} />
                </button>

                <div className="w-9 h-9 rounded-full bg-indigo-100 overflow-hidden flex items-center justify-center border">
                  {activeChat.logo || activeChat.avatar ? (
                    <img src={activeChat.logo || activeChat.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm">💬</span>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-xs text-slate-800">{activeChat.title || activeChat.name}</h3>
                  <p className="text-[10px] text-emerald-600 font-semibold flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                    <span>En línea</span>
                  </p>
                </div>
              </div>

              <button 
                onClick={() => { setReportTarget(activeChat); setShowReportModal(true); }}
                className="p-2 text-slate-400 hover:text-rose-500"
                title="Reportar conversación"
              >
                <Flag size={16} />
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {chatMessages.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <div className="text-3xl">👋</div>
                  <p className="text-xs font-bold text-slate-600">¡Inicia la conversación!</p>
                  <p className="text-[11px] text-slate-400">Pregunta sobre horarios, requisitos o agenda una cita.</p>
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isMe = msg.senderId === currentUserId;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] p-3 rounded-2xl text-xs leading-relaxed shadow-sm ${
                        isMe 
                          ? 'bg-indigo-600 text-white rounded-br-none' 
                          : 'bg-white text-slate-800 border rounded-bl-none'
                      }`}>
                        <p>{msg.text}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t flex items-center space-x-2">
              <input 
                type="text" 
                placeholder="Escribe un mensaje..."
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                className="flex-1 bg-slate-100 border-none px-4 py-2.5 rounded-full text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button 
                type="submit" 
                className="p-2.5 bg-indigo-600 text-white rounded-full shadow-md hover:bg-indigo-700 transition"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        ) : null}

        {/* PERFIL CANDIDATO */}
        {currentPage === 'profile' && !activeChat && (
          <div className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-black text-xl">Tu Perfil 👤</h2>
              {profileSavedNotice && (
                <span className="text-xs text-emerald-600 font-bold flex items-center space-x-1 animate-bounce">
                  <Check size={14} />
                  <span>¡Sincronizado!</span>
                </span>
              )}
            </div>

            <div className={`rounded-3xl shadow-sm border overflow-hidden space-y-4 pb-5 ${getCardClasses()}`}>
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
                  <label className="block text-[10px] font-bold opacity-40 uppercase">Nombre Completo</label>
                  <input 
                    type="text" 
                    value={candidateProfile.name || ''} 
                    onChange={(e) => setCandidateProfile({...candidateProfile, name: e.target.value})} 
                    className="w-full font-bold text-sm border-b py-1 bg-transparent focus:outline-none focus:border-indigo-600" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold opacity-40 uppercase">Puesto Deseado / Título</label>
                  <input 
                    type="text" 
                    placeholder="Ej. Barista / Cajero"
                    value={candidateProfile.role || ''} 
                    onChange={(e) => setCandidateProfile({...candidateProfile, role: e.target.value})} 
                    className="w-full text-xs font-semibold text-indigo-500 border-b py-1 bg-transparent focus:outline-none focus:border-indigo-600" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold opacity-40 uppercase">Edad</label>
                  <input 
                    type="text" 
                    value={candidateProfile.age || ''} 
                    onChange={(e) => setCandidateProfile({...candidateProfile, age: e.target.value})} 
                    className="w-full text-xs border-b py-1 bg-transparent focus:outline-none focus:border-indigo-600" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold opacity-40 uppercase">Habilidades Clave</label>
                  <input 
                    type="text" 
                    value={candidateProfile.skills || ''} 
                    onChange={(e) => setCandidateProfile({...candidateProfile, skills: e.target.value})} 
                    className="w-full text-xs border-b py-1 bg-transparent focus:outline-none focus:border-indigo-600" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold opacity-40 uppercase">Sobre ti</label>
                  <textarea 
                    value={candidateProfile.bio || ''} 
                    onChange={(e) => setCandidateProfile({...candidateProfile, bio: e.target.value})} 
                    className="w-full text-xs border rounded-xl p-2 h-20 mt-1 bg-transparent focus:outline-none focus:border-indigo-600"
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

        {/* SECCIÓN MIS VACANTES */}
        {currentPage === 'my-jobs' && !activeChat && (
          <div className="p-4 space-y-4">
            <h2 className="font-black text-xl">Mis Vacantes Publicadas 🏪</h2>

            {myPostedJobs.length === 0 ? (
              <div className={`p-8 text-center rounded-3xl border space-y-3 ${getCardClasses()}`}>
                <p className="text-xs">No has publicado vacantes aún.</p>
                <button onClick={() => navigateTo('post-job')} className="bg-indigo-600 text-white font-bold text-xs py-2.5 px-4 rounded-xl">Publicar Vacante</button>
              </div>
            ) : (
              <div className="space-y-3">
                {myPostedJobs.map((job) => (
                  <div key={job.id} className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 ${getCardClasses()}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-sm">{job.title}</h4>
                        <p className="text-xs text-indigo-500 font-medium">{job.company}</p>
                        <p className="text-[10px] opacity-50 mt-1">{job.salary} • {job.schedule}</p>
                      </div>
                      
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${job.status === 'filled' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {job.status === 'filled' ? 'Ocupada / Oculta' : 'Activa'}
                      </span>
                    </div>

                    <div className="flex gap-2 pt-2 border-t">
                      <button 
                        onClick={() => handleToggleJobStatus(job.id, job.status)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1 ${job.status === 'filled' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}
                      >
                        {job.status === 'filled' ? <CheckCircle size={14} /> : <EyeOff size={14} />}
                        <span>{job.status === 'filled' ? 'Marcar Activa' : 'Marcar Ocupada'}</span>
                      </button>

                      <button 
                        onClick={() => handleDeleteJob(job.id)}
                        className="bg-rose-50 text-rose-600 border border-rose-200 p-2 rounded-xl text-xs font-bold"
                        title="Eliminar vacante"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CONFIGURACIÓN Y APARIENCIA */}
        {currentPage === 'settings' && !activeChat && (
          <div className="p-4 space-y-5">
            <h2 className="font-black text-xl">Configuración y Seguridad ⚙️</h2>

            <div className={`p-4 rounded-3xl border space-y-3 ${getCardClasses()}`}>
              <div className="flex items-center space-x-2">
                <Palette size={18} className="text-indigo-500" />
                <h3 className="font-bold text-sm">Apariencia y Colores</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button 
                  onClick={() => setTheme('indigo')} 
                  className={`p-3 rounded-2xl text-xs font-bold border flex items-center justify-between ${theme === 'indigo' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200'}`}
                >
                  <span> Indigo Classic</span>
                  <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                </button>

                <button 
                  onClick={() => setTheme('dark')} 
                  className={`p-3 rounded-2xl text-xs font-bold border flex items-center justify-between ${theme === 'dark' ? 'border-purple-500 bg-slate-800 text-white' : 'border-slate-200'}`}
                >
                  <span> Modo Oscuro 🌙</span>
                  <div className="w-3 h-3 rounded-full bg-slate-900 border"></div>
                </button>

                <button 
                  onClick={() => setTheme('emerald')} 
                  className={`p-3 rounded-2xl text-xs font-bold border flex items-center justify-between ${theme === 'emerald' ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-200'}`}
                >
                  <span> Esmeralda 🌿</span>
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                </button>

                <button 
                  onClick={() => setTheme('sunset')} 
                  className={`p-3 rounded-2xl text-xs font-bold border flex items-center justify-between ${theme === 'sunset' ? 'border-amber-600 bg-amber-50 text-amber-700' : 'border-slate-200'}`}
                >
                  <span> Atardecer 🌅</span>
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                </button>
              </div>
            </div>

            <div className={`p-4 rounded-3xl border space-y-2 ${getCardClasses()}`}>
              <button 
                onClick={() => setShowPrivacyModal(true)}
                className="w-full flex items-center justify-between text-xs font-bold py-2"
              >
                <div className="flex items-center space-x-2">
                  <ShieldAlert size={16} className="text-indigo-500" />
                  <span>Política Antifraude y Perfiles Falsos</span>
                </div>
                <span>→</span>
              </button>
            </div>

          </div>
        )}

        {/* MATCHES Y LISTA DE CHATS */}
        {currentPage === 'matches' && !activeChat && (
          <div className="p-4 space-y-4">
            <h2 className="font-black text-xl">Tus Matches y Chats 🎉</h2>
            {matches.length === 0 ? (
              <p className="text-xs opacity-50 py-10 text-center">Aún no tienes contactos guardados. ¡Sigue explorando!</p>
            ) : (
              <div className="space-y-3">
                {matches.map((item, idx) => (
                  <div key={idx} className={`p-4 rounded-2xl border flex items-center justify-between ${getCardClasses()}`}>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center text-xl">
                        {item.logo || item.avatar ? <img src={item.logo || item.avatar} alt="Logo" className="w-full h-full object-cover" /> : '💼'}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">{item.title || item.name}</h4>
                        <p className="text-xs opacity-60">{item.company || item.role || item.skills}</p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => { playSound('click'); setActiveChat(item); }} 
                      className="bg-indigo-600 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1 shadow-md hover:bg-indigo-700"
                    >
                      <MessageSquare size={14} />
                      <span>Chat</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PUBLICAR VACANTE */}
        {currentPage === 'post-job' && !activeChat && (
          <div className="p-4 space-y-4">
            <h2 className="font-black text-xl">Publicar vacante 🏪</h2>
            <form onSubmit={handlePostJob} className={`p-5 rounded-3xl border space-y-4 ${getCardClasses()}`}>
              <div>
                <label className="block text-xs font-bold mb-1 opacity-70">Imagen / Logo</label>
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
                <label className="block text-xs font-bold mb-1 opacity-70">Puesto</label>
                <input type="text" placeholder="Ej. Barista" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full border rounded-xl p-3 text-xs bg-slate-500/5 outline-none" required />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1 opacity-70">Nombre del Negocio</label>
                <input type="text" placeholder="Ej. Café El Roble" value={newCompany} onChange={(e) => setNewCompany(e.target.value)} className="w-full border rounded-xl p-3 text-xs bg-slate-500/5 outline-none" required />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1 opacity-70">Ubicación del Negocio</label>
                <div className="space-y-2">
                  <button 
                    type="button"
                    onClick={() => setShowMapPicker(true)}
                    className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 p-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition"
                  >
                    <span>{selectedCoords ? '📌 Cambiar punto en el mapa' : '🗺 Seleccionar en el mapa'}</span>
                  </button>

                  <input 
                    type="text" 
                    placeholder="Dirección o referencia" 
                    value={newAddress} 
                    onChange={(e) => setNewAddress(e.target.value)} 
                    className="w-full border rounded-xl p-3 text-xs bg-slate-500/5 outline-none" 
                    required 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold mb-1 opacity-70">Salario</label>
                  <input type="text" placeholder="Ej. $8,000/mes" value={newSalary} onChange={(e) => setNewSalary(e.target.value)} className="w-full border rounded-xl p-3 text-xs bg-slate-500/5 outline-none" required />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 opacity-70">Horario</label>
                  <input type="text" placeholder="Ej. Medio Tiempo" value={newSchedule} onChange={(e) => setNewSchedule(e.target.value)} className="w-full border rounded-xl p-3 text-xs bg-slate-500/5 outline-none" required />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1 opacity-70">Descripción</label>
                <textarea placeholder="Descripción del puesto..." value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="w-full border rounded-xl p-3 text-xs h-20 bg-slate-500/5 outline-none" required></textarea>
              </div>

              <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-2xl shadow-lg hover:bg-indigo-700 transition">
                Publicar Vacante
              </button>
            </form>
          </div>
        )}

      </main>

      {/* MODAL REGISTRO AUTOMÁTICO AL ENTRAR A LA PÁGINA */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-800 rounded-3xl p-6 space-y-4 max-w-xs w-full shadow-2xl">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-sm text-indigo-600 flex items-center space-x-2">
                <Lock size={16} />
                <span>Ingresa a ChambaCerca</span>
              </h3>
              {currentUser && (
                <button onClick={() => setShowAuthModal(false)} className="text-slate-400"><X size={16} /></button>
              )}
            </div>

            <p className="text-xs text-slate-500">
              Registrate con un clic o verifica tu correo con un enlace seguro para usar la app.
            </p>

            {/* BOTÓN GOOGLE / GMAIL */}
            <button 
              onClick={handleGoogleSignIn}
              disabled={authLoading}
              className="w-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-3 px-4 rounded-2xl text-xs flex items-center justify-center space-x-2 shadow-sm transition"
            >
              <span className="text-lg">🌐</span>
              <span>Continuar con Google (Gmail)</span>
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-2 text-[10px] text-slate-400 font-bold uppercase">o por correo</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* FORMULARIO ENLACE MÁGICO A CORREO */}
            {emailSent ? (
              <div className="bg-emerald-50 text-emerald-800 p-3 rounded-2xl text-xs space-y-1 text-center border border-emerald-200">
                <p className="font-bold">📩 ¡Enlace enviado!</p>
                <p className="text-[11px] text-emerald-600">Revisa tu correo y haz clic en el botón enviado para ingresar automáticamente.</p>
              </div>
            ) : (
              <form onSubmit={handleSendMagicLink} className="space-y-2">
                <input 
                  type="email" 
                  placeholder="tu-correo@gmail.com" 
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full bg-slate-100 border p-2.5 rounded-xl text-xs outline-none text-slate-800 focus:ring-2 focus:ring-indigo-600"
                  required
                />
                <button 
                  type="submit" 
                  disabled={authLoading}
                  className="w-full bg-indigo-600 text-white text-xs font-bold py-2.5 rounded-xl shadow-md hover:bg-indigo-700 flex items-center justify-center space-x-1"
                >
                  <Mail size={14} />
                  <span>{authLoading ? 'Enviando...' : 'Enviar enlace de acceso'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* POPUP DE REPORTE DE SEGURIDAD */}
      {showReportModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-800 rounded-3xl p-5 space-y-4 max-w-xs w-full shadow-2xl">
            <div className="flex items-center space-x-2 text-rose-600 font-bold text-sm">
              <Flag size={18} />
              <span>Reportar Infracción</span>
            </div>
            <p className="text-xs text-slate-500">
              ¿Por qué deseas reportar a <span className="font-bold">{reportTarget?.title || reportTarget?.name}</span>?
            </p>
            <div className="space-y-2 text-xs">
              <button onClick={() => { setReportReason("🚫 Perfil o empleo falso / fraude"); handleReportSubmit(); }} className="w-full text-left p-2.5 rounded-xl border hover:bg-slate-50">🚫 Perfil o empleo falso / fraude</button>
              <button onClick={() => { setReportReason("🔞 Contenido inapropiado"); handleReportSubmit(); }} className="w-full text-left p-2.5 rounded-xl border hover:bg-slate-50">🔞 Contenido inapropiado</button>
              <button onClick={() => { setReportReason("⚠️ Spam o información engañosa"); handleReportSubmit(); }} className="w-full text-left p-2.5 rounded-xl border hover:bg-slate-50">⚠️ Spam o información engañosa</button>
            </div>
            <button onClick={() => setShowReportModal(false)} className="w-full bg-slate-200 text-slate-700 font-bold py-2 rounded-xl text-xs">Cancelar</button>
          </div>
        </div>
      )}

      {/* MODAL POLITICA DE SEGURIDAD Y PRIVACIDAD */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-800 rounded-3xl p-6 space-y-4 max-w-sm w-full shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-sm flex items-center space-x-2 text-indigo-600">
                <ShieldAlert size={18} />
                <span>Políticas de Seguridad</span>
              </h3>
              <button onClick={() => setShowPrivacyModal(false)} className="p-1 text-slate-400"><X size={18} /></button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <p><strong>1. Tolerancia Cero a Perfiles Falsos:</strong> Queda strictly prohibida la creación de vacantes de trabajo fantasma o perfiles engañosos. Todo perfil reportado será suspendido.</p>
              <p><strong>2. Protección de Datos Personales:</strong> ChambaCerca no comparte tu número de teléfono ni tus coordenadas exactas sin tu consentimiento directo al hacer match.</p>
              <p><strong>3. Verificación de Negocios:</strong> Los negocios deben utilizar direcciones geolocalizadas reales para garantizar ofertas de trabajo seguras para los jóvenes.</p>
            </div>

            <button onClick={() => setShowPrivacyModal(false)} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl text-xs">Entendido</button>
          </div>
        </div>
      )}

      {/* POPUP MATCH VERDADERO */}
      {showMatchModal && lastMatch && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white text-slate-800 rounded-3xl p-6 text-center space-y-4 max-w-xs w-full shadow-2xl">
            <div className="text-5xl animate-bounce">🎉</div>
            <h3 className="font-black text-2xl bg-gradient-to-r from-indigo-600 to-pink-500 bg-clip-text text-transparent">¡Hicieron Match Mutuo!</h3>
            <p className="text-xs text-slate-500">
              ¡Interés recíproco confirmado con <span className="font-bold text-indigo-600">{lastMatch.title || lastMatch.name}</span>! Se ha abierto la sala de chat.
            </p>
            <button 
              onClick={() => {
                setShowMatchModal(false);
                setActiveChat(lastMatch);
                navigateTo('matches');
              }} 
              className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl text-xs shadow-lg"
            >
              Iniciar Chat
            </button>
          </div>
        </div>
      )}

      {/* NAVEGACIÓN INFERIOR */}
      {currentPage !== 'landing' && !activeChat && (
        <nav className={`fixed bottom-0 max-w-md w-full border-t px-4 py-2.5 flex justify-around items-center z-30 transition-colors ${theme === 'dark' ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-100'}`}>
          <button onClick={() => navigateTo('explore')} className={`flex flex-col items-center space-y-1 ${currentPage === 'explore' ? 'text-indigo-500 scale-110' : 'opacity-40'} transition`}>
            <Search size={20} />
            <span className="text-[10px] font-bold">Explorar</span>
          </button>

          {userRole === 'business' ? (
            <>
              <button onClick={() => navigateTo('my-jobs')} className={`flex flex-col items-center space-y-1 ${currentPage === 'my-jobs' ? 'text-indigo-500 scale-110' : 'opacity-40'} transition`}>
                <Building size={20} />
                <span className="text-[10px] font-bold">Mis Vacantes</span>
              </button>

              <button onClick={() => navigateTo('post-job')} className={`flex flex-col items-center space-y-1 ${currentPage === 'post-job' ? 'text-indigo-500 scale-110' : 'opacity-40'} transition`}>
                <Sparkles size={20} />
                <span className="text-[10px] font-bold">Publicar</span>
              </button>
            </>
          ) : (
            <button onClick={() => navigateTo('profile')} className={`flex flex-col items-center space-y-1 ${currentPage === 'profile' ? 'text-indigo-500 scale-110' : 'opacity-40'} transition`}>
              <User size={20} />
              <span className="text-[10px] font-bold">Perfil</span>
            </button>
          )}

          <button onClick={() => navigateTo('matches')} className={`flex flex-col items-center space-y-1 ${currentPage === 'matches' ? 'text-indigo-500 scale-110' : 'opacity-40'} transition`}>
            <MessageSquare size={20} />
            <span className="text-[10px] font-bold">Matches</span>
          </button>
        </nav>
      )}

    </div>
  );
}
