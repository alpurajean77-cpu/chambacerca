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
  const [geoStatus, setGeoStatus] = useState('Obteniendo GPS...');

  const [distanceFilter, setDistanceFilter] = useState(15); 
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const [activeChat, setActiveChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');

  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);
  const [reportReason, setReportReason] = useState('🚫 Perfil o empleo falso / fraude');

  // AUTENTICACIÓN SEGURA (GOOGLE Y ENLACE MÁGICO AL CORREO)
  const [showAuthModal, setShowAuthModal] = useState(false);
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

  // GEOLOCALIZACIÓN NATIVA
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserCoords(coords);
          setSelectedCoords(coords);
          setGeoStatus('GPS Activo 📍');
        },
        () => setGeoStatus('Ubicación aproximada'),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

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
    alert("Sesión cerrada.");
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

  // CAMBIAR ESTADO VACANTE
  const handleToggleJobStatus = async (jobId, currentStatus) => {
    playSound('click');
    const newStatus = currentStatus === 'filled' ? 'active' : 'filled';
    try {
      await updateDoc(doc(db, "vacantes", jobId), { status: newStatus });
    } catch (err) {
      alert("Error al actualizar la vacante");
    }
  };

  // ELIMINAR VACANTE
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

  // ENVIAR REPORTE
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

  const currentJob = filteredJobs[jobIndex];
  const currentCandidate = filteredCandidates[candidateIndex];

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

        {/* PÁGINA 1: LANDING */}
        {currentPage === 'landing' && (
          <div className="min-h-screen flex flex-col justify-between p-6 bg-gradient-to-b from-indigo-900 via-indigo-800 to-slate-900 text-white">
            <div className="pt-12 text-center space-y-4">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-3xl mx-auto flex items-center justify-center text-4xl shadow-2xl border border-white/20 animate-bounce">
                ⚡
              </div>
              <h1 className="text-4xl font-black tracking-tight">ChambaCerca</h1>
              <p className="text-indigo-200 text-sm max-w-xs mx-auto leading-relaxed">
                Encuentra empleo local o contrataciones al instante conectando por radar GPS en tiempo real.
              </p>
            </div>

            <div className="space-y-3 my-auto">
              <button 
                onClick={() => navigateTo('explore', 'seeker')}
                className="w-full bg-white text-indigo-900 font-extrabold py-4 rounded-2xl shadow-xl hover:bg-indigo-50 transition flex items-center justify-center space-x-2 text-sm"
              >
                <User size={18} />
                <span>Busco Trabajo</span>
              </button>

              <button 
                onClick={() => navigateTo('explore', 'business')}
                className="w-full bg-indigo-600/80 backdrop-blur-md text-white font-extrabold py-4 rounded-2xl border border-indigo-400/30 hover:bg-indigo-600 transition flex items-center justify-center space-x-2 text-sm"
              >
                <Building size={18} />
                <span>Soy Negocio / Contratante</span>
              </button>
            </div>

            <div className="text-center text-xs text-indigo-300/60 pb-4">
              ChambaCerca • Conexión Laboral Directa
            </div>
          </div>
        )}

        {/* PÁGINA 2: EXPLORAR (TARJETAS TINDER) */}
        {currentPage === 'explore' && (
          <div className="p-4 space-y-4">
            
            {/* BARRA DE RADAR Y DISTANCIA */}
            <div className="flex items-center justify-between bg-white/60 dark:bg-slate-900/60 backdrop-blur-md p-3 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs font-semibold">
              <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400">
                <Navigation size={14} className="animate-spin" />
                <span>{geoStatus}</span>
              </div>
              <button 
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl text-slate-700 dark:text-slate-300"
              >
                <Sliders size={12} />
                <span>Radar: {distanceFilter} km</span>
              </button>
            </div>

            {/* PANEL DESPLEGABLE DE DISTANCIA */}
            {showFilterPanel && (
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3 shadow-lg">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span>Ajustar rango del radar</span>
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

            {/* VISTA DE BUSCADOR (VACANTES) */}
            {userRole === 'seeker' && (
              <>
                {currentJob ? (
                  <div className={`rounded-3xl border overflow-hidden shadow-xl transition-all duration-300 ${getCardClasses()}`}>
                    <div className="h-48 bg-gradient-to-r from-indigo-500 to-purple-600 relative p-4 flex items-end">
                      {currentJob.logo && (
                        <img src={currentJob.logo} alt="Logo" className="w-16 h-16 rounded-2xl border-2 border-white shadow-md object-cover mr-3 bg-white" />
                      )}
                      <div className="text-white space-y-0.5">
                        <span className="bg-white/20 backdrop-blur-md text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                          Vacante Disponible
                        </span>
                        <h2 className="text-lg font-black leading-tight">{currentJob.title}</h2>
                        <p className="text-xs font-medium text-indigo-100">{currentJob.company}</p>
                      </div>

                      <button 
                        onClick={() => { setReportTarget(currentJob); setShowReportModal(true); }}
                        className="absolute top-3 right-3 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md"
                        title="Reportar publicación"
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
                            <p className="text-[10px] text-indigo-600 font-bold">
                              📍 A {calculateDistanceInKm(userCoords.lat, userCoords.lng, currentJob.lat, currentJob.lng)} km de tu ubicación
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Descripción</h4>
                        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                          {currentJob.description}
                        </p>
                      </div>

                      {/* BOTONES ACCIÓN SWIPE */}
                      <div className="flex justify-center space-x-6 pt-2">
                        <button 
                          onClick={handlePass}
                          className="w-14 h-14 rounded-full bg-rose-50 text-rose-500 border border-rose-200 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition"
                        >
                          <X size={24} />
                        </button>

                        <button 
                          onClick={() => handleLike(currentJob)}
                          className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-200 hover:scale-105 active:scale-95 transition"
                        >
                          <Heart size={24} fill="currentColor" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 space-y-3 bg-white dark:bg-slate-900 rounded-3xl border p-6">
                    <Sparkles size={36} className="mx-auto text-indigo-500 animate-pulse" />
                    <h3 className="font-bold text-slate-700 dark:text-slate-200">¡Has visto todas las vacantes cercanas!</h3>
                    <p className="text-xs text-slate-400">Prueba aumentar el rango del radar para explorar áreas más lejanas.</p>
                  </div>
                )}
              </>
            )}

            {/* VISTA DE NEGOCIO (CANDIDATOS) */}
            {userRole === 'business' && (
              <>
                {currentCandidate ? (
                  <div className={`rounded-3xl border overflow-hidden shadow-xl transition-all duration-300 ${getCardClasses()}`}>
                    <div className="h-40 bg-slate-200 relative">
                      {currentCandidate.banner ? (
                        <img src={currentCandidate.banner} alt="Banner" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-purple-500 to-indigo-600"></div>
                      )}
                      
                      <div className="absolute -bottom-8 left-6">
                        <img 
                          src={currentCandidate.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                          alt="Avatar" 
                          className="w-20 h-20 rounded-2xl border-4 border-white shadow-md object-cover bg-white"
                        />
                      </div>

                      <button 
                        onClick={() => { setReportTarget(currentCandidate); setShowReportModal(true); }}
                        className="absolute top-3 right-3 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md"
                      >
                        <Flag size={14} />
                      </button>
                    </div>

                    <div className="pt-10 p-6 space-y-4">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h2 className="text-lg font-black">{currentCandidate.name}</h2>
                          <span className="text-xs text-slate-400 font-bold">{currentCandidate.age}</span>
                        </div>
                        <p className="text-xs font-bold text-indigo-600">{currentCandidate.role}</p>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl space-y-1">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Habilidades clave</span>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{currentCandidate.skills}</p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Acerca de mi</span>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{currentCandidate.bio}</p>
                      </div>

                      {/* BOTONES ACCIÓN SWIPE */}
                      <div className="flex justify-center space-x-6 pt-2">
                        <button 
                          onClick={handlePass}
                          className="w-14 h-14 rounded-full bg-rose-50 text-rose-500 border border-rose-200 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition"
                        >
                          <X size={24} />
                        </button>

                        <button 
                          onClick={() => handleLike(currentCandidate)}
                          className="w-14 h-14 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200 hover:scale-105 active:scale-95 transition"
                        >
                          <Heart size={24} fill="currentColor" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 space-y-3 bg-white dark:bg-slate-900 rounded-3xl border p-6">
                    <User size={36} className="mx-auto text-indigo-500" />
                    <h3 className="font-bold text-slate-700 dark:text-slate-200">Sin candidatos disponibles</h3>
                    <p className="text-xs text-slate-400">Vuelve más tarde o expande tu área de búsqueda.</p>
                  </div>
                )}
              </>
            )}

          </div>
        )}

        {/* PÁGINA 3: CHAT Y MATCHES */}
        {currentPage === 'chat' && (
          <div className="p-4 space-y-4">
            {!activeChat ? (
              <div className="space-y-4">
                <h2 className="font-black text-lg">Mensajes y Conexiones</h2>
                {matches.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 space-y-2">
                    <MessageSquare size={32} className="mx-auto" />
                    <p className="text-xs font-medium">Aún no tienes matches. ¡Sigue explorando vacantes o candidatos!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {matches.map(m => (
                      <div 
                        key={m.id || m.matchDocId}
                        onClick={() => setActiveChat(m)}
                        className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center space-x-3 cursor-pointer hover:border-indigo-500 transition"
                      >
                        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center font-bold text-indigo-600 shrink-0">
                          {m.title ? '🏪' : '👤'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-xs truncate">{m.title || m.name}</h4>
                          <p className="text-[10px] text-slate-400 truncate">{m.company || m.role || 'Conexión activa'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col h-[75vh]">
                <div className="flex items-center space-x-3 pb-3 border-b">
                  <button onClick={() => setActiveChat(null)} className="p-1.5 bg-slate-100 rounded-xl">
                    <ArrowLeft size={16} />
                  </button>
                  <div>
                    <h3 className="font-bold text-xs">{activeChat.title || activeChat.name}</h3>
                    <span className="text-[10px] text-emerald-500 font-bold">● En línea</span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto py-4 space-y-3">
                  {chatMessages.map(msg => (
                    <div 
                      key={msg.id} 
                      className={`flex ${msg.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-xs font-medium ${
                        msg.senderId === currentUserId 
                          ? 'bg-indigo-600 text-white rounded-br-none' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendMessage} className="pt-2 flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Escribe un mensaje..." 
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    className="flex-1 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 rounded-2xl text-xs outline-none"
                  />
                  <button type="submit" className="bg-indigo-600 text-white p-2.5 rounded-2xl">
                    <Send size={16} />
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* PÁGINA 4: PUBLICAR VACANTE (MODO NEGOCIO) */}
        {currentPage === 'post-job' && (
          <div className="p-4 space-y-4">
            <h2 className="font-black text-lg">Publicar Nueva Vacante</h2>

            <form onSubmit={handlePostJob} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400">Título del Puesto</label>
                <input 
                  type="text" 
                  placeholder="Ej. Mesero / Barista" 
                  value={newTitle} 
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 rounded-xl text-xs outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400">Nombre del Negocio</label>
                <input 
                  type="text" 
                  placeholder="Ej. Cafetería El Portal" 
                  value={newCompany} 
                  onChange={(e) => setNewCompany(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 rounded-xl text-xs outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Sueldo / Pago</label>
                  <input 
                    type="text" 
                    placeholder="Ej. $1,200 sem." 
                    value={newSalary} 
                    onChange={(e) => setNewSalary(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 rounded-xl text-xs outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Horario</label>
                  <input 
                    type="text" 
                    placeholder="Ej. Turno Matutino" 
                    value={newSchedule} 
                    onChange={(e) => setNewSchedule(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 rounded-xl text-xs outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400">Ubicación exacta</label>
                <button 
                  type="button"
                  onClick={() => setShowMapPicker(true)}
                  className="w-full bg-slate-100 dark:bg-slate-800 text-indigo-600 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2"
                >
                  <MapPin size={14} />
                  <span>{newAddress || "Seleccionar en el Mapa 📍"}</span>
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400">Descripción de la vacante</label>
                <textarea 
                  rows="3" 
                  placeholder="Detalla requisitos y actividades..." 
                  value={newDesc} 
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 rounded-xl text-xs outline-none"
                  required
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-2xl text-xs shadow-lg shadow-indigo-200 mt-2"
              >
                Publicar Vacante
              </button>
            </form>
          </div>
        )}

        {/* PÁGINA 5: MIS VACANTES PUBLICADAS */}
        {currentPage === 'my-jobs' && (
          <div className="p-4 space-y-4">
            <h2 className="font-black text-lg">Mis Publicaciones</h2>

            {myPostedJobs.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <Building size={32} className="mx-auto" />
                <p className="text-xs">Aún no has publicado vacantes desde este usuario.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myPostedJobs.map(job => (
                  <div key={job.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${job.status === 'filled' ? 'bg-slate-100 text-slate-500' : 'bg-emerald-100 text-emerald-700'}`}>
                        {job.status === 'filled' ? 'Cubierta' : 'Activa'}
                      </span>
                      <h4 className="font-bold text-xs mt-1">{job.title}</h4>
                      <p className="text-[10px] text-slate-400">{job.company}</p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleToggleJobStatus(job.id, job.status)}
                        className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-xl text-xs font-bold"
                      >
                        {job.status === 'filled' ? 'Reabrir' : 'Cerrar'}
                      </button>

                      <button 
                        onClick={() => handleDeleteJob(job.id)}
                        className="p-2 bg-rose-50 text-rose-600 rounded-xl"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PÁGINA 6: PERFIL CANDIDATO */}
        {currentPage === 'profile' && (
          <div className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-black text-lg">Mi Perfil Profesional</h2>
              {profileSavedNotice && (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                  ✓ Guardado
                </span>
              )}
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <img 
                    src={candidateProfile.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                    alt="Foto" 
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500"
                  />
                  <label className="absolute -bottom-1 -right-1 p-1.5 bg-indigo-600 text-white rounded-full cursor-pointer">
                    <Camera size={12} />
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleProfileImageUpload(e, 'avatar')} />
                  </label>
                </div>
                <div>
                  <h4 className="font-bold text-xs">{candidateProfile.name || 'Sin nombre'}</h4>
                  <p className="text-[10px] text-slate-400">{candidateProfile.role || 'Buscador de empleo'}</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Nombre completo</label>
                  <input 
                    type="text" 
                    value={candidateProfile.name} 
                    onChange={(e) => setCandidateProfile({...candidateProfile, name: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 rounded-xl text-xs outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Puesto / Especialidad</label>
                  <input 
                    type="text" 
                    value={candidateProfile.role} 
                    onChange={(e) => setCandidateProfile({...candidateProfile, role: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 rounded-xl text-xs outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Habilidades clave</label>
                  <input 
                    type="text" 
                    value={candidateProfile.skills} 
                    onChange={(e) => setCandidateProfile({...candidateProfile, skills: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 rounded-xl text-xs outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Breve biografía</label>
                  <textarea 
                    rows="3"
                    value={candidateProfile.bio} 
                    onChange={(e) => setCandidateProfile({...candidateProfile, bio: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 rounded-xl text-xs outline-none"
                  />
                </div>

                <button 
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile}
                  className="w-full bg-indigo-600 text-white font-bold py-3 rounded-2xl text-xs flex items-center justify-center space-x-2"
                >
                  {isSavingProfile ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PÁGINA 7: AJUSTES Y TEMA */}
        {currentPage === 'settings' && (
          <div className="p-4 space-y-4">
            <h2 className="font-black text-lg">Configuración de la App</h2>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4">
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Tema de Color</span>
                <div className="grid grid-cols-2 gap-2">
                  {['indigo', 'dark', 'emerald', 'sunset'].map(t => (
                    <button 
                      key={t} 
                      onClick={() => setTheme(t)}
                      className={`p-3 rounded-2xl text-xs font-bold capitalize border ${theme === t ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'bg-slate-50'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t">
                <button 
                  onClick={() => setShowPrivacyModal(true)}
                  className="w-full text-left py-2 text-xs font-semibold text-slate-600 flex items-center justify-between"
                >
                  <span>Políticas de Privacidad y Seguridad</span>
                  <Lock size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* MODAL AUTENTICACIÓN GOOGLE Y MAGIC LINK */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 space-y-5 shadow-2xl relative">
            <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-slate-400">
              <X size={18} />
            </button>

            <div className="text-center space-y-1">
              <h3 className="font-black text-lg">Acceso a ChambaCerca</h3>
              <p className="text-xs text-slate-400">Inicia sesión para interactuar con empleos y perfiles</p>
            </div>

            <div className="space-y-3">
              <button 
                onClick={handleGoogleSignIn}
                disabled={authLoading}
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold py-3 rounded-2xl text-xs flex items-center justify-center space-x-2 border border-slate-200"
              >
                <span>🌐 Continuar con Google</span>
              </button>

              <div className="flex items-center space-x-2 my-2">
                <div className="flex-1 h-px bg-slate-200"></div>
                <span className="text-[10px] text-slate-400 font-bold">O CORREO</span>
                <div className="flex-1 h-px bg-slate-200"></div>
              </div>

              {!emailSent ? (
                <form onSubmit={handleSendMagicLink} className="space-y-2">
                  <input 
                    type="email" 
                    placeholder="tu@correo.com" 
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 rounded-xl text-xs outline-none"
                    required
                  />
                  <button 
                    type="submit"
                    disabled={authLoading}
                    className="w-full bg-indigo-600 text-white font-bold py-3 rounded-2xl text-xs"
                  >
                    Enviar Enlace de Acceso
                  </button>
                </form>
              ) : (
                <div className="bg-emerald-50 text-emerald-800 p-3 rounded-2xl text-center text-xs space-y-1">
                  <CheckCircle size={20} className="mx-auto text-emerald-600" />
                  <p className="font-bold">¡Enlace enviado!</p>
                  <p className="text-[10px]">Revisa tu bandeja de entrada para ingresar.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL MATCH CELEBRACIÓN */}
      {showMatchModal && lastMatch && (
        <div className="fixed inset-0 bg-indigo-900/90 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="text-center space-y-6 text-white max-w-sm">
            <div className="text-6xl animate-bounce">🎉</div>
            <h2 className="text-3xl font-black">¡Es un Match!</h2>
            <p className="text-xs text-indigo-200">
              Has conectado exitosamente con <strong className="text-white">{lastMatch.title || lastMatch.name}</strong>.
            </p>

            <div className="space-y-3 pt-4">
              <button 
                onClick={() => { setShowMatchModal(false); navigateTo('chat'); }}
                className="w-full bg-white text-indigo-900 font-bold py-3.5 rounded-2xl text-xs"
              >
                Enviar Mensaje Ahora
              </button>
              <button 
                onClick={() => setShowMatchModal(false)}
                className="w-full bg-indigo-800 text-indigo-200 font-bold py-3.5 rounded-2xl text-xs"
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
              <button onClick={() => setShowReportModal(false)} className="flex-1 py-2.5 bg-slate-100 rounded-xl text-xs font-bold">Cancelar</button>
              <button onClick={handleReportSubmit} className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-bold">Enviar Reporte</button>
            </div>
          </div>
        </div>
      )}

      {/* NAVEGACIÓN INFERIOR (BOTTOM NAV) */}
      {currentPage !== 'landing' && !activeChat && (
        <nav className="fixed bottom-0 max-w-md w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 flex justify-around py-2.5 z-40">
          <button 
            onClick={() => navigateTo('explore', userRole)} 
            className={`flex flex-col items-center text-[10px] font-bold ${currentPage === 'explore' ? 'text-indigo-600' : 'text-slate-400'}`}
          >
            <Search size={18} />
            <span>Explorar</span>
          </button>

          <button 
            onClick={() => navigateTo('chat')} 
            className={`flex flex-col items-center text-[10px] font-bold ${currentPage === 'chat' ? 'text-indigo-600' : 'text-slate-400'}`}
          >
            <MessageSquare size={18} />
            <span>Mensajes</span>
          </button>

          {userRole === 'business' ? (
            <button 
              onClick={() => navigateTo('post-job')} 
              className={`flex flex-col items-center text-[10px] font-bold ${currentPage === 'post-job' ? 'text-indigo-600' : 'text-slate-400'}`}
            >
              <Building size={18} />
              <span>Publicar</span>
            </button>
          ) : (
            <button 
              onClick={() => navigateTo('my-jobs')} 
              className={`flex flex-col items-center text-[10px] font-bold ${currentPage === 'my-jobs' ? 'text-indigo-600' : 'text-slate-400'}`}
            >
              <Building size={18} />
              <span>Mis Vacantes</span>
            </button>
          )}

          <button 
            onClick={() => navigateTo('profile')} 
            className={`flex flex-col items-center text-[10px] font-bold ${currentPage === 'profile' ? 'text-indigo-600' : 'text-slate-400'}`}
          >
            <User size={18} />
            <span>Perfil</span>
          </button>
        </nav>
      )}

    </div>
  );
}
