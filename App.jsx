import React, { useState, useEffect } from 'react';
import { 
  MapPin, DollarSign, Clock, Heart, X, 
  MessageSquare, User, Building, Search, 
  Sliders, Navigation, Camera, Image as ImageIcon, Upload,
  Briefcase, Sparkles, UserCheck
} from 'lucide-react';

// Importaciones de Firebase
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, addDoc, onSnapshot, query, serverTimestamp 
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

// Haversine para distancia en Km
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
  return (R * c).toFixed(1);
}

// Convertir archivo a Base64
const convertFileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

// Candidatos demo para cuando el Negocio explora prospectos
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

export default function App() {
  const [currentPage, setCurrentPage] = useState('landing'); 
  const [userRole, setUserRole] = useState('seeker'); // 'seeker' (Candidato) o 'business' (Negocio)
  
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState(DEMO_CANDIDATES);
  const [loading, setLoading] = useState(true);
  
  const [jobIndex, setJobIndex] = useState(0);
  const [candidateIndex, setCandidateIndex] = useState(0);
  
  const [matches, setMatches] = useState([]);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [lastMatch, setLastMatch] = useState(null);

  // Animación de burbuja/transición
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Geolocalización
  const [userCoords, setUserCoords] = useState(null);
  const [geoStatus, setGeoStatus] = useState('Buscando GPS...');

  // Filtros
  const [showFilters, setShowFilters] = useState(false);
  const [filterDistance, setFilterDistance] = useState(15);
  const [filterType, setFilterType] = useState('Todos');

  // Perfil Candidato
  const [candidateProfile, setCandidateProfile] = useState({
    name: 'Alex González',
    age: '20 años',
    skills: 'Atención al cliente, Caja, Cafetería',
    bio: 'Estudiante enfocado en atención al cliente con disponibilidad inmediata.',
    avatar: null,
    banner: null
  });

  // Campos para publicar vacante
  const [newTitle, setNewTitle] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newSalary, setNewSalary] = useState('');
  const [newSchedule, setNewSchedule] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [businessLogo, setBusinessLogo] = useState(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Navegación animada con efecto burbuja
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

  // GPS
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setGeoStatus('GPS Activo 📍');
        },
        () => setGeoStatus('Ubicación aproximada'),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  // Cargar Vacantes desde Firestore
  useEffect(() => {
    const q = query(collection(db, "vacantes"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const jobList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      jobList.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setJobs(jobList);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Handlers para imágenes
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

  // Geocodificación rápida
  const geocodeAddress = async (addressText) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressText)}`, { signal: controller.signal });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (data && data.length > 0) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    } catch (e) {
      console.warn("Geo fallback", e);
    }
    return userCoords || { lat: 19.4326, lng: -99.1332 };
  };

  // Guardar Vacante
  const handlePostJob = async (e) => {
    e.preventDefault();
    setIsGeocoding(true);
    try {
      const coords = await geocodeAddress(newAddress);
      await addDoc(collection(db, "vacantes"), {
        title: newTitle,
        company: newCompany,
        address: newAddress,
        salary: newSalary,
        schedule: newSchedule,
        description: newDesc,
        lat: coords.lat,
        lng: coords.lng,
        logo: businessLogo || null,
        createdAt: serverTimestamp()
      });

      setNewTitle(''); setNewCompany(''); setNewAddress('');
      setNewSalary(''); setNewSchedule(''); setNewDesc('');
      setBusinessLogo(null);
      setIsGeocoding(false);

      alert('¡Vacante publicada con éxito!');
      navigateTo('explore', 'seeker'); // Redirige a explorar como candidato para verla de inmediato
    } catch (err) {
      setIsGeocoding(false);
      alert('Error al publicar vacante.');
    }
  };

  const handleLike = (item) => {
    setMatches([...matches, item]);
    setLastMatch(item);
    setShowMatchModal(true);
    if (userRole === 'seeker') setJobIndex(jobIndex + 1);
    else setCandidateIndex(candidateIndex + 1);
  };

  const handlePass = () => {
    if (userRole === 'seeker') setJobIndex(jobIndex + 1);
    else setCandidateIndex(candidateIndex + 1);
  };

  // Filtrado de vacantes por distancia
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
      
      {/* EFECTO BURBUJA / TRANSICIÓN FLUIDA */}
      <div 
        className={`fixed inset-0 pointer-events-none z-50 transition-all duration-300 ease-out flex items-center justify-center ${
          isTransitioning ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
        }`}
      >
        <div className="w-96 h-96 bg-gradient-to-tr from-indigo-500/30 to-violet-500/30 backdrop-blur-xl rounded-full animate-ping"></div>
      </div>

      {/* HEADER */}
      {currentPage !== 'landing' && (
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 py-3 flex justify-between items-center sticky top-0 z-30 transition-all">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigateTo('explore', userRole)}>
            <div className="bg-indigo-600 text-white p-2 rounded-xl font-bold text-lg flex items-center justify-center w-9 h-9 shadow-md shadow-indigo-200 animate-bounce">
              ⚡
            </div>
            <span className="font-black text-xl tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              ChambaCerca
            </span>
          </div>

          <button 
            onClick={() => {
              const nextRole = userRole === 'seeker' ? 'business' : 'seeker';
              navigateTo(nextRole === 'seeker' ? 'explore' : 'explore', nextRole);
            }}
            className="text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full border border-indigo-100 hover:scale-105 transition active:scale-95 flex items-center space-x-1 shadow-sm"
          >
            {userRole === 'seeker' ? <span>👤 Soy Buscador</span> : <span>🏪 Modo Negocio</span>}
          </button>
        </header>
      )}

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 pb-20 transition-all duration-300 transform">
        
        {/* LANDING PAGE */}
        {currentPage === 'landing' && (
          <div className="p-6 flex flex-col items-center justify-between min-h-screen bg-gradient-to-b from-indigo-600 via-indigo-700 to-violet-800 text-white text-center relative overflow-hidden">
            {/* Burbujas decorativas de fondo */}
            <div className="absolute top-10 left-5 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
            <div className="absolute bottom-20 right-5 w-40 h-40 bg-violet-400/20 rounded-full blur-3xl animate-pulse"></div>

            <div className="my-auto space-y-6 pt-10 z-10">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-3xl mx-auto flex items-center justify-center text-4xl shadow-inner border border-white/20">
                ⚡
              </div>
              <h1 className="text-4xl font-black tracking-tight leading-tight">ChambaCerca</h1>
              <p className="text-indigo-100 text-sm max-w-xs mx-auto leading-relaxed">
                Empleos e interactividad local en tiempo real con dinámicas de match directo.
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
            <div className="text-xs text-indigo-200/70 pb-4 z-10">ChambaCerca 2026 • Ultra-Proximidad</div>
          </div>
        )}

        {/* EXPLORAR (DINÁMICO SEGÚN ROL) */}
        {currentPage === 'explore' && (
          <div className="p-4 space-y-4">
            
            {/* BARRA DE ESTADO / GPS */}
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600">
                  <Navigation size={14} className="text-indigo-600 animate-pulse" />
                  <span>{geoStatus}</span>
                  <span className="bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-md text-[10px]">
                    {userRole === 'seeker' ? 'Viendo Vacantes' : 'Viendo Candidatos'}
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
                    <label className="block font-bold text-slate-700 mb-1">Radio: {filterDistance} km</label>
                    <input 
                      type="range" min="1" max="20" value={filterDistance} 
                      onChange={(e) => setFilterDistance(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* VISTA PARA CANDIDATOS (BUSCAR TRABAJO) */}
            {userRole === 'seeker' ? (
              loading ? (
                <div className="text-center py-20 text-xs text-slate-500 animate-pulse">Buscando empleo local... 🌀</div>
              ) : jobIndex < filteredJobs.length ? (
                <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden flex flex-col justify-between min-h-[480px] animate-fadeIn">
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

                      <div className="grid grid-cols-2 gap-2 text-xs">
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

              /* VISTA PARA NEGOCIOS (BUSCAR PROSPECTOS / CANDIDATOS) */
              candidateIndex < candidates.length ? (
                <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden flex flex-col justify-between min-h-[480px] animate-fadeIn">
                  <div>
                    <div className="h-28 bg-indigo-100 relative overflow-hidden flex items-center justify-center">
                      <img src={candidates[candidateIndex].banner} alt="Portada" className="w-full h-full object-cover" />
                      <div className="absolute top-3 right-3 bg-indigo-600 text-white font-bold text-[10px] px-2.5 py-1 rounded-full shadow-md flex items-center space-x-1">
                        <UserCheck size={10} />
                        <span>Candidato Disponible</span>
                      </div>
                    </div>

                    <div className="px-5 relative flex justify-between items-end -mt-10 mb-3">
                      <div className="w-18 h-18 rounded-2xl bg-white p-1 shadow-md">
                        <img src={candidates[candidateIndex].avatar} alt="Perfil" className="w-full h-full object-cover rounded-xl" />
                      </div>
                    </div>

                    <div className="p-5 pt-0 space-y-3">
                      <div>
                        <h3 className="font-bold text-slate-900 text-xl">{candidates[candidateIndex].name}</h3>
                        <p className="text-xs font-semibold text-indigo-600">{candidates[candidateIndex].role} • {candidates[candidateIndex].age}</p>
                      </div>

                      <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/50 space-y-1">
                        <h4 className="text-[10px] font-bold text-indigo-400 uppercase">Habilidades</h4>
                        <p className="text-xs font-medium text-indigo-900">{candidates[candidateIndex].skills}</p>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase">Sobre mí</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">{candidates[candidateIndex].bio}</p>
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
                  <h3 className="font-bold text-slate-800">Has visto todos los prospectos disponibles</h3>
                  <button onClick={() => setCandidateIndex(0)} className="bg-indigo-600 text-white font-bold text-xs py-3 px-6 rounded-2xl">Volver a revisar prospectos</button>
                </div>
              )
            )}

          </div>
        )}

        {/* PERFIL CANDIDATO */}
        {currentPage === 'profile' && (
          <div className="p-4 space-y-4 animate-fadeIn">
            <h2 className="font-black text-xl text-slate-900">Tu Perfil de Candidato 👤</h2>
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
                  <input type="text" value={candidateProfile.name} onChange={(e) => setCandidateProfile({...candidateProfile, name: e.target.value})} className="w-full font-bold text-slate-800 text-sm border-b py-1" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Habilidades Clave</label>
                  <input type="text" value={candidateProfile.skills} onChange={(e) => setCandidateProfile({...candidateProfile, skills: e.target.value})} className="w-full text-xs text-slate-600 border-b py-1" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Sobre ti</label>
                  <textarea value={candidateProfile.bio} onChange={(e) => setCandidateProfile({...candidateProfile, bio: e.target.value})} className="w-full text-xs text-slate-600 border rounded-xl p-2 h-16 mt-1"></textarea>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MATCHES */}
        {currentPage === 'matches' && (
          <div className="p-4 space-y-4 animate-fadeIn">
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
                        <p className="text-xs text-slate-500">{item.company || item.role}</p>
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

        {/* PUBLICAR VACANTE */}
        {currentPage === 'post-job' && (
          <div className="p-4 space-y-4 animate-fadeIn">
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

              <input type="text" placeholder="Ej. Barista" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full bg-slate-50 border rounded-xl p-3 text-xs" required />
              <input type="text" placeholder="Ej. Café El Roble" value={newCompany} onChange={(e) => setNewCompany(e.target.value)} className="w-full bg-slate-50 border rounded-xl p-3 text-xs" required />
              <input type="text" placeholder="Calle, Número y Colonia" value={newAddress} onChange={(e) => setNewAddress(e.target.value)} className="w-full bg-slate-50 border rounded-xl p-3 text-xs" required />

              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="Ej. $8,000/mes" value={newSalary} onChange={(e) => setNewSalary(e.target.value)} className="w-full bg-slate-50 border rounded-xl p-3 text-xs" required />
                <input type="text" placeholder="Ej. Medio Tiempo" value={newSchedule} onChange={(e) => setNewSchedule(e.target.value)} className="w-full bg-slate-50 border rounded-xl p-3 text-xs" required />
              </div>

              <textarea placeholder="Descripción del puesto..." value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="w-full bg-slate-50 border rounded-xl p-3 text-xs h-20" required></textarea>

              <button type="submit" disabled={isGeocoding} className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-2xl shadow-lg hover:bg-indigo-700 transition">
                {isGeocoding ? 'Guardando...' : 'Publicar Vacante'}
              </button>
            </form>
          </div>
        )}

      </main>

      {/* POPUP DE MATCH */}
      {showMatchModal && lastMatch && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 text-center space-y-4 max-w-xs w-full shadow-2xl animate-bounce">
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
