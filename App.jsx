import React, { useState, useEffect } from 'react';
import { 
  Briefcase, MapPin, DollarSign, Clock, Filter, Heart, X, Star, 
  MessageSquare, User, Building, ShieldCheck, Search, 
  AlertTriangle, Sparkles, Sliders, Users, CheckCircle, Navigation,
  Camera, Image as ImageIcon, Upload
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

// Función de Haversine para calcular la distancia precisa en Km entre 2 coordenadas
function calculateDistanceInKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance.toFixed(1); // Devuelve distancia con 1 decimal (Ej. 1.4)
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

export default function App() {
  const [currentPage, setCurrentPage] = useState('landing'); 
  const [userRole, setUserRole] = useState('seeker'); 
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [jobIndex, setJobIndex] = useState(0);
  const [matches, setMatches] = useState([]);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [lastMatch, setLastMatch] = useState(null);

  // Geolocalización del usuario que busca empleo
  const [userCoords, setUserCoords] = useState(null);
  const [geoStatus, setGeoStatus] = useState('Obteniendo tu ubicación GPS...');

  // Estados de Filtro
  const [showFilters, setShowFilters] = useState(false);
  const [filterDistance, setFilterDistance] = useState(15);
  const [filterType, setFilterType] = useState('Todos');

  // Perfil del Candidato (con Fotos)
  const [candidateProfile, setCandidateProfile] = useState({
    name: 'Alex González',
    age: '20 años',
    skills: 'Atención al cliente, Caja, Cafetería',
    bio: 'Estudiante enfocado en atención al cliente con disponibilidad inmediata.',
    avatar: null,
    banner: null
  });

  // Campos para formulario de publicar vacante (Del Negocio)
  const [newTitle, setNewTitle] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newSalary, setNewSalary] = useState('');
  const [newSchedule, setNewSchedule] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [businessLogo, setBusinessLogo] = useState(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Obtenemos la ubicación GPS en tiempo real del candidato
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setGeoStatus('GPS Activo 📍');
        },
        (error) => {
          console.warn("Geolocalización no otorgada:", error);
          setGeoStatus('Ubicación general');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setGeoStatus('GPS no soportado');
    }
  }, []);

  // Cargar vacantes en tiempo real desde Firebase (Ordenadas localmente)
  useEffect(() => {
    const q = query(collection(db, "vacantes"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const jobList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Ordenar las vacantes más recientes primero
      jobList.sort((a, b) => {
        const timeA = a.createdAt?.seconds || Date.now() / 1000;
        const timeB = b.createdAt?.seconds || Date.now() / 1000;
        return timeB - timeA;
      });

      setJobs(jobList);
      setLoading(false);
    }, (error) => {
      console.error("Error al cargar vacantes: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Subir fotos del perfil de candidato
  const handleProfileImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const base64 = await convertFileToBase64(file);
        setCandidateProfile(prev => ({ ...prev, [type]: base64 }));
      } catch (err) {
        alert("Error al procesar la imagen.");
      }
    }
  };

  // Subir foto/logo del negocio
  const handleBusinessLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const base64 = await convertFileToBase64(file);
        setBusinessLogo(base64);
      } catch (err) {
        alert("Error al cargar el logo del negocio.");
      }
    }
  };

  // Convertir dirección a coordenadas GPS con timeout rápido
  const geocodeAddress = async (addressText) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressText)}`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      const data = await response.json();
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }
    } catch (error) {
      console.warn("Geocodificación omitida/fallida:", error);
    }
    // Si no encuentra la dirección o tarda mucho, usa las coordenadas del usuario o centro por defecto
    return userCoords || { lat: 19.4326, lng: -99.1332 };
  };

  // Guardar vacante en Firebase
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
        verified: true,
        createdAt: serverTimestamp()
      });

      // Limpiar campos del formulario
      setNewTitle('');
      setNewCompany('');
      setNewAddress('');
      setNewSalary('');
      setNewSchedule('');
      setNewDesc('');
      setBusinessLogo(null);
      setIsGeocoding(false);

      alert('¡Vacante publicada y guardada exitosamente!');
      
      // Reiniciar índice y navegar a la sección de explorar para verla al momento
      setJobIndex(0);
      setUserRole('seeker');
      setCurrentPage('explore');
    } catch (error) {
      console.error("Error al publicar vacante: ", error);
      setIsGeocoding(false);
      alert('Error al publicar vacante.');
    }
  };

  const handleLike = (item) => {
    setMatches([...matches, item]);
    setLastMatch(item);
    setShowMatchModal(true);
    setJobIndex(jobIndex + 1);
  };

  const handlePass = () => {
    setJobIndex(jobIndex + 1);
  };

  // Filtrado de vacantes por distancia y horario
  const filteredJobs = jobs.filter(job => {
    if (filterType !== 'Todos' && job.schedule && !job.schedule.toLowerCase().includes(filterType.toLowerCase())) {
      return false;
    }
    if (userCoords && job.lat && job.lng && filterDistance < 20) {
      const dist = calculateDistanceInKm(userCoords.lat, userCoords.lng, job.lat, job.lng);
      if (dist && parseFloat(dist) > filterDistance) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 shadow-2xl relative overflow-hidden">
      
      {/* HEADER */}
      {currentPage !== 'landing' && (
        <header className="bg-white border-b border-slate-100 px-4 py-3 flex justify-between items-center sticky top-0 z-30">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => { setJobIndex(0); setCurrentPage('explore'); }}>
            <div className="bg-indigo-600 text-white p-2 rounded-xl font-bold text-lg flex items-center justify-center w-9 h-9">
              ⚡
            </div>
            <span className="font-black text-xl tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              ChambaCerca
            </span>
          </div>

          <button 
            onClick={() => {
              const newRole = userRole === 'seeker' ? 'business' : 'seeker';
              setUserRole(newRole);
              setJobIndex(0); // Reinicia el visor a la primera vacante al cambiar
              setCurrentPage(newRole === 'seeker' ? 'explore' : 'post-job');
            }}
            className="text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full border border-indigo-100 flex items-center space-x-1"
          >
            {userRole === 'seeker' ? <span>👤 Busco Chamba</span> : <span>🏪 Soy Negocio</span>}
          </button>
        </header>
      )}

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 pb-20">
        
        {/* LANDING PAGE */}
        {currentPage === 'landing' && (
          <div className="p-6 flex flex-col items-center justify-between min-h-screen bg-gradient-to-b from-indigo-600 via-indigo-700 to-violet-800 text-white text-center">
            <div className="my-auto space-y-6 pt-10">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-3xl mx-auto flex items-center justify-center text-4xl shadow-inner border border-white/20">
                ⚡
              </div>
              <h1 className="text-4xl font-black tracking-tight leading-tight">
                ChambaCerca
              </h1>
              <p className="text-indigo-100 text-sm max-w-xs mx-auto leading-relaxed">
                Empleos locales geolocalizados con fotos de perfil y coincidencia instantánea.
              </p>

              <div className="pt-6 space-y-3 w-full max-w-xs mx-auto">
                <button 
                  onClick={() => { setUserRole('seeker'); setJobIndex(0); setCurrentPage('explore'); }}
                  className="w-full bg-white text-indigo-700 font-bold py-3.5 px-6 rounded-2xl shadow-lg hover:bg-slate-100 transition active:scale-95 flex items-center justify-center space-x-2"
                >
                  <Search size={18} />
                  <span>Buscar Empleo (Jóvenes)</span>
                </button>
                <button 
                  onClick={() => { setUserRole('business'); setCurrentPage('post-job'); }}
                  className="w-full bg-indigo-500/30 backdrop-blur-md text-white font-semibold py-3.5 px-6 rounded-2xl border border-white/30 hover:bg-white/20 transition active:scale-95 flex items-center justify-center space-x-2"
                >
                  <Building size={18} />
                  <span>Soy Negocio (Publicar)</span>
                </button>
              </div>
            </div>
            <div className="text-xs text-indigo-200/70 pb-4">ChambaCerca 2026 • Ultra-Proximidad</div>
          </div>
        )}

        {/* EXPLORAR VACANTES */}
        {currentPage === 'explore' && (
          <div className="p-4 space-y-4">
            
            {/* BARRA DE UBICACIÓN Y FILTROS */}
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600">
                  <Navigation size={14} className="text-indigo-600 animate-pulse" />
                  <span>{geoStatus}</span>
                </div>
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className="text-xs font-semibold text-indigo-600 flex items-center space-x-1 bg-indigo-50 px-3 py-1.5 rounded-xl"
                >
                  <Sliders size={12} />
                  <span>{showFilters ? 'Ocultar' : 'Filtros'}</span>
                </button>
              </div>

              {showFilters && (
                <div className="pt-3 border-t border-slate-100 space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Radio máximo: {filterDistance} km</label>
                    <input 
                      type="range" 
                      min="1" 
                      max="20" 
                      value={filterDistance} 
                      onChange={(e) => setFilterDistance(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tipo de jornada:</label>
                    <div className="flex space-x-2">
                      {['Todos', 'Medio tiempo', 'Tiempo Completo'].map((type) => (
                        <button
                          key={type}
                          onClick={() => setFilterType(type)}
                          className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium ${
                            filterType === type ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* TARJETAS DE VACANTES */}
            {loading ? (
              <div className="text-center py-20 space-y-3">
                <div className="animate-spin text-indigo-600 text-3xl mx-auto">🌀</div>
                <p className="text-xs text-slate-500">Cargando vacantes reales...</p>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center space-y-4 shadow-sm border border-slate-100 my-10">
                <div className="text-4xl">🏪</div>
                <h3 className="font-bold text-lg text-slate-800">No hay vacantes en este rango</h3>
                <p className="text-xs text-slate-500">Aumenta el radio en los filtros para explorar más zona.</p>
              </div>
            ) : jobIndex < filteredJobs.length ? (
              <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden flex flex-col justify-between min-h-[480px]">
                <div>
                  {/* IMAGEN DE BANNER/LOGO DEL NEGOCIO */}
                  <div className="h-32 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                    {filteredJobs[jobIndex].logo ? (
                      <img 
                        src={filteredJobs[jobIndex].logo} 
                        alt="Logo del negocio" 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="text-4xl">🏪</div>
                    )}
                    <div className="absolute top-3 right-3 bg-emerald-500 text-white font-bold text-[10px] px-2.5 py-1 rounded-full shadow-md flex items-center space-x-1">
                      <MapPin size={10} />
                      <span>
                        {userCoords && filteredJobs[jobIndex].lat && filteredJobs[jobIndex].lng
                          ? `${calculateDistanceInKm(userCoords.lat, userCoords.lng, filteredJobs[jobIndex].lat, filteredJobs[jobIndex].lng)} km de ti`
                          : 'Ubicación local'}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    <div>
                      <h3 className="font-bold text-slate-900 text-xl leading-snug">
                        {filteredJobs[jobIndex].title}
                      </h3>
                      <p className="text-xs font-semibold text-indigo-600">
                        {filteredJobs[jobIndex].company}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-50 p-2.5 rounded-xl flex items-center space-x-2 text-slate-700">
                        <DollarSign size={14} className="text-emerald-500" />
                        <span className="font-medium">{filteredJobs[jobIndex].salary}</span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl flex items-center space-x-2 text-slate-700">
                        <Clock size={14} className="text-amber-500" />
                        <span className="font-medium">{filteredJobs[jobIndex].schedule}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dirección física</h4>
                      <p className="text-xs text-slate-700 font-medium">
                        📍 {filteredJobs[jobIndex].address || 'Dirección registrada'}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Descripción</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {filteredJobs[jobIndex].description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-around items-center">
                  <button 
                    onClick={handlePass}
                    className="w-14 h-14 bg-white text-slate-400 rounded-full shadow-md flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition border border-slate-100"
                  >
                    <X size={26} />
                  </button>
                  <button 
                    onClick={() => handleLike(filteredJobs[jobIndex])}
                    className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full shadow-lg flex items-center justify-center transition"
                  >
                    <Heart size={30} className="fill-white" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-8 text-center space-y-4 shadow-sm border border-slate-100 my-10">
                <div className="text-4xl">🎉</div>
                <h3 className="font-bold text-lg text-slate-800">¡Has visto todas las vacantes cercanas!</h3>
                <button 
                  onClick={() => setJobIndex(0)}
                  className="bg-indigo-600 text-white font-bold text-xs py-3 px-6 rounded-2xl"
                >
                  Volver a revisar
                </button>
              </div>
            )}
          </div>
        )}

        {/* PERFIL DEL CANDIDATO CON FOTOS */}
        {currentPage === 'profile' && (
          <div className="p-4 space-y-4">
            <h2 className="font-black text-xl text-slate-900">Tu Perfil de Candidato 👤</h2>
            
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden space-y-4 pb-5">
              {/* BANNER DE PORTADA */}
              <div className="h-28 bg-indigo-100 relative flex items-center justify-center overflow-hidden group">
                {candidateProfile.banner ? (
                  <img src={candidateProfile.banner} alt="Banner" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs text-indigo-400 font-medium">Sin foto de portada</span>
                )}
                <label className="absolute bottom-2 right-2 bg-slate-900/70 text-white p-2 rounded-xl cursor-pointer hover:bg-slate-900 transition">
                  <Camera size={14} />
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => handleProfileImageUpload(e, 'banner')} 
                    className="hidden" 
                  />
                </label>
              </div>

              {/* FOTO DE PERFIL */}
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
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleProfileImageUpload(e, 'avatar')} 
                      className="hidden" 
                    />
                  </label>
                </div>
              </div>

              {/* DATOS DEL PERFIL */}
              <div className="px-5 space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Nombre Completo</label>
                  <input 
                    type="text" 
                    value={candidateProfile.name} 
                    onChange={(e) => setCandidateProfile({...candidateProfile, name: e.target.value})}
                    className="w-full font-bold text-slate-800 text-sm border-b border-slate-100 focus:outline-none py-1"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Habilidades Clave</label>
                  <input 
                    type="text" 
                    value={candidateProfile.skills} 
                    onChange={(e) => setCandidateProfile({...candidateProfile, skills: e.target.value})}
                    className="w-full text-xs text-slate-600 border-b border-slate-100 focus:outline-none py-1"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Sobre ti</label>
                  <textarea 
                    value={candidateProfile.bio} 
                    onChange={(e) => setCandidateProfile({...candidateProfile, bio: e.target.value})}
                    className="w-full text-xs text-slate-600 border border-slate-100 rounded-xl p-2 focus:outline-none h-16 mt-1"
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MATCHES */}
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
                        {item.logo ? <img src={item.logo} alt="Logo" className="w-full h-full object-cover" /> : '💼'}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-800">{item.title}</h4>
                        <p className="text-xs text-slate-500">{item.company}</p>
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

        {/* FORMULARIO PUBLICAR VACANTE */}
        {currentPage === 'post-job' && (
          <div className="p-4 space-y-4">
            <h2 className="font-black text-xl text-slate-900">Publicar vacante de tu Negocio 🏪</h2>
            <form onSubmit={handlePostJob} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 space-y-4">
              
              {/* SUBIR FOTO/LOGO DEL NEGOCIO */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Imagen o Logo del Negocio</label>
                <div className="flex items-center space-x-3">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                    {businessLogo ? (
                      <img src={businessLogo} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="text-slate-400" size={24} />
                    )}
                  </div>
                  <label className="bg-indigo-50 text-indigo-600 text-xs font-bold px-3 py-2 rounded-xl border border-indigo-100 cursor-pointer flex items-center space-x-1">
                    <Upload size={14} />
                    <span>{businessLogo ? 'Cambiar Foto' : 'Subir Foto'}</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleBusinessLogoUpload} 
                      className="hidden" 
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del puesto</label>
                <input 
                  type="text" 
                  placeholder="Ej. Barista, Auxiliar de Tienda" 
                  value={newTitle} 
                  onChange={(e) => setNewTitle(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs" 
                  required 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre de tu negocio</label>
                <input 
                  type="text" 
                  placeholder="Ej. Café El Roble" 
                  value={newCompany} 
                  onChange={(e) => setNewCompany(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs" 
                  required 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Calle, Número y Colonia exacta</label>
                <input 
                  type="text" 
                  placeholder="Ej. Calle Morelos 123, Centro" 
                  value={newAddress} 
                  onChange={(e) => setNewAddress(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs" 
                  required 
                />
                <span className="text-[10px] text-slate-400">Calcularemos las coordenadas geográficas automáticamente.</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Salario</label>
                  <input 
                    type="text" 
                    placeholder="Ej. $8,000 / mes" 
                    value={newSalary} 
                    onChange={(e) => setNewSalary(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Horario</label>
                  <input 
                    type="text" 
                    placeholder="Ej. Medio Tiempo" 
                    value={newSchedule} 
                    onChange={(e) => setNewSchedule(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs" 
                    required 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descripción</label>
                <textarea 
                  placeholder="Descripción de actividades..." 
                  value={newDesc} 
                  onChange={(e) => setNewDesc(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs h-20" 
                  required
                ></textarea>
              </div>

              <button 
                type="submit" 
                disabled={isGeocoding}
                className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-2xl shadow-lg hover:bg-indigo-700 transition flex items-center justify-center space-x-2"
              >
                {isGeocoding ? (
                  <span>Guardando y Calculando GPS... 🌀</span>
                ) : (
                  <span>Publicar Vacante Instantáneamente</span>
                )}
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
              Interés guardado en <span className="font-bold text-indigo-600">{lastMatch.title}</span>.
            </p>
            <button 
              onClick={() => setShowMatchModal(false)}
              className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl text-xs"
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {/* BARRA INFERIOR DE NAVEGACIÓN */}
      {currentPage !== 'landing' && (
        <nav className="fixed bottom-0 max-w-md w-full bg-white border-t border-slate-100 px-6 py-2.5 flex justify-around items-center z-30">
          <button 
            onClick={() => { setJobIndex(0); setCurrentPage('explore'); }}
            className={`flex flex-col items-center space-y-1 ${currentPage === 'explore' ? 'text-indigo-600' : 'text-slate-400'}`}
          >
            <Search size={20} />
            <span className="text-[10px] font-bold">Explorar</span>
          </button>

          <button 
            onClick={() => setCurrentPage('profile')}
            className={`flex flex-col items-center space-y-1 ${currentPage === 'profile' ? 'text-indigo-600' : 'text-slate-400'}`}
          >
            <User size={20} />
            <span className="text-[10px] font-bold">Mi Perfil</span>
          </button>

          <button 
            onClick={() => setCurrentPage('matches')}
            className={`flex flex-col items-center space-y-1 ${currentPage === 'matches' ? 'text-indigo-600' : 'text-slate-400'}`}
          >
            <MessageSquare size={20} />
            <span className="text-[10px] font-bold">Matches</span>
          </button>
        </nav>
      )}

    </div>
  );
}
