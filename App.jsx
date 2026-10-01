import React, { useState, useEffect } from 'react';
import { 
  Briefcase, MapPin, DollarSign, Clock, Filter, Heart, X, Star, 
  MessageSquare, User, Building, ShieldCheck, Search, 
  AlertTriangle, Sparkles, Sliders, Users, CheckCircle
} from 'lucide-react';

// Importaciones de Firebase
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp 
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

// Candidatos de prueba para el modo Negocio (Búsqueda de gente)
const SAMPLE_CANDIDATES = [
  {
    id: 'c1',
    name: 'Alex González',
    age: '20 años',
    zone: 'Col. Juárez (A 1.5 km)',
    skills: ['Atención al cliente', 'Caja / Cobro', 'Cafetería'],
    availability: 'Medio tiempo (Mañanas)',
    experience: 'Sin experiencia previa',
    bio: 'Estudiante con muchas ganas de trabajar en atención al cliente o cafeterías. Puntual y proactivo.',
    avatar: '👨‍🎓'
  },
  {
    id: 'c2',
    name: 'Mariana López',
    age: '19 años',
    zone: 'Centro (A 2.1 km)',
    skills: ['Redes sociales', 'Canva', 'Fotografía móvil'],
    availability: 'Fin de semana / Flexible',
    experience: 'Manejo de redes sociales',
    bio: 'Me apasiona crear contenido visual para negocios locales. Busco apoyo en ventas o marketing.',
    avatar: '👩‍🎨'
  },
  {
    id: 'c3',
    name: 'Carlos Mendoza',
    age: '22 años',
    zone: 'Roma Sur (A 3.0 km)',
    skills: ['Inventario', 'Acomodo de mercancía', 'Computación'],
    availability: 'Tiempo completo',
    experience: '6 meses en tienda de abarrotes',
    bio: 'Responsable y organizado. Licencia de conducir vigente y disponibilidad inmediata.',
    avatar: '🧑‍💻'
  }
];

export default function App() {
  const [currentPage, setCurrentPage] = useState('landing'); // landing, explore, candidates, matches, profile, post-job
  const [userRole, setUserRole] = useState('seeker'); // seeker (busca trabajo), business (busca gente)
  const [jobs, setJobs] = useState([]);
  const [candidates] = useState(SAMPLE_CANDIDATES);
  const [loading, setLoading] = useState(true);
  
  const [jobIndex, setJobIndex] = useState(0);
  const [candidateIndex, setCandidateIndex] = useState(0);
  
  const [matches, setMatches] = useState([]);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [lastMatch, setLastMatch] = useState(null);

  // Estados de Filtro
  const [showFilters, setShowFilters] = useState(false);
  const [filterDistance, setFilterDistance] = useState(10);
  const [filterType, setFilterType] = useState('Todos');

  // Campos para formulario de publicar vacante
  const [newTitle, setNewTitle] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newSalary, setNewSalary] = useState('');
  const [newSchedule, setNewSchedule] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // Cargar vacantes en tiempo real desde Firebase
  useEffect(() => {
    const q = query(collection(db, "vacantes"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const jobList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setJobs(jobList);
      setLoading(false);
    }, (error) => {
      console.error("Error al cargar vacantes: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Guardar vacante en Firebase
  const handlePostJob = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "vacantes"), {
        title: newTitle,
        company: newCompany,
        salary: newSalary,
        schedule: newSchedule,
        description: newDesc,
        distance: 'A 2 km de ti',
        logo: '🏪',
        verified: true,
        matchScore: 92,
        createdAt: serverTimestamp()
      });

      setNewTitle('');
      setNewCompany('');
      setNewSalary('');
      setNewSchedule('');
      setNewDesc('');

      alert('¡Vacante publicada con éxito en la base de datos!');
      setCurrentPage('explore');
    } catch (error) {
      console.error("Error al publicar vacante: ", error);
      alert('Error al publicar. Verifica la configuración de Firestore.');
    }
  };

  // Manejo de Interés / Swipe
  const handleLike = (item, type) => {
    setMatches([...matches, { ...item, type }]);
    setLastMatch({ ...item, type });
    setShowMatchModal(true);

    if (type === 'job') {
      setJobIndex(jobIndex + 1);
    } else {
      setCandidateIndex(candidateIndex + 1);
    }
  };

  const handlePass = (type) => {
    if (type === 'job') {
      setJobIndex(jobIndex + 1);
    } else {
      setCandidateIndex(candidateIndex + 1);
    }
  };

  // Filtrado de vacantes
  const filteredJobs = jobs.filter(job => {
    if (filterType !== 'Todos' && job.schedule && !job.schedule.toLowerCase().includes(filterType.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 shadow-2xl relative overflow-hidden">
      
      {/* HEADER */}
      {currentPage !== 'landing' && (
        <header className="bg-white border-b border-slate-100 px-4 py-3 flex justify-between items-center sticky top-0 z-30">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setCurrentPage(userRole === 'seeker' ? 'explore' : 'candidates')}>
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
              setCurrentPage(newRole === 'seeker' ? 'explore' : 'candidates');
            }}
            className="text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full border border-indigo-100 flex items-center space-x-1"
          >
            {userRole === 'seeker' ? (
              <><span>👤 Busco Chamba</span></>
            ) : (
              <><span>🏪 Busco Personal</span></>
            )}
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
                Conecta empleos locales y candidatos en tiempo real con un solo swipe.
              </p>

              <div className="pt-6 space-y-3 w-full max-w-xs mx-auto">
                <button 
                  onClick={() => { setUserRole('seeker'); setCurrentPage('explore'); }}
                  className="w-full bg-white text-indigo-700 font-bold py-3.5 px-6 rounded-2xl shadow-lg hover:bg-slate-100 transition active:scale-95 flex items-center justify-center space-x-2"
                >
                  <Search size={18} />
                  <span>Buscar Empleo (Jóvenes)</span>
                </button>
                <button 
                  onClick={() => { setUserRole('business'); setCurrentPage('candidates'); }}
                  className="w-full bg-indigo-500/30 backdrop-blur-md text-white font-semibold py-3.5 px-6 rounded-2xl border border-white/30 hover:bg-white/20 transition active:scale-95 flex items-center justify-center space-x-2"
                >
                  <Building size={18} />
                  <span>Soy Negocio (Buscar Personal)</span>
                </button>
              </div>
            </div>
            <div className="text-xs text-indigo-200/70 pb-4">Conectado a Firestore Cloud Data</div>
          </div>
        )}

        {/* MODO BUSCO CHAMBA: EXPLORAR VACANTES */}
        {currentPage === 'explore' && (
          <div className="p-4 space-y-4">
            
            {/* PANEL DE FILTROS */}
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600">
                  <MapPin size={14} className="text-indigo-600" />
                  <span>Radio: Múltiples zonas (&lt; {filterDistance} km)</span>
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
                    <label className="block font-bold text-slate-700 mb-1">Distancia máxima: {filterDistance} km</label>
                    <input 
                      type="range" 
                      min="1" 
                      max="20" 
                      value={filterDistance} 
                      onChange={(e) => setFilterDistance(e.target.value)}
                      className="w-full accent-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tipo de jornada:</label>
                    <div className="flex space-x-2">
                      {['Todos', 'Medio tiempo', 'Fin de semana'].map((type) => (
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
                <p className="text-xs text-slate-500">Buscando vacantes en tiempo real...</p>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center space-y-4 shadow-sm border border-slate-100 my-10">
                <div className="text-4xl">🏪</div>
                <h3 className="font-bold text-lg text-slate-800">No hay vacantes disponibles</h3>
                <p className="text-xs text-slate-500">Publica la primera desde el modo Negocio.</p>
              </div>
            ) : jobIndex < filteredJobs.length ? (
              <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden flex flex-col justify-between min-h-[460px]">
                <div className="p-5 space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
                      {filteredJobs[jobIndex].logo || '💼'}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg leading-snug">
                        {filteredJobs[jobIndex].title}
                      </h3>
                      <p className="text-xs font-medium text-slate-500">
                        {filteredJobs[jobIndex].company}
                      </p>
                    </div>
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
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Descripción</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {filteredJobs[jobIndex].description}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-around items-center">
                  <button 
                    onClick={() => handlePass('job')}
                    className="w-14 h-14 bg-white text-slate-400 rounded-full shadow-md flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition border border-slate-100"
                  >
                    <X size={26} />
                  </button>
                  <button 
                    onClick={() => handleLike(filteredJobs[jobIndex], 'job')}
                    className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full shadow-lg flex items-center justify-center transition"
                  >
                    <Heart size={30} className="fill-white" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-8 text-center space-y-4 shadow-sm border border-slate-100 my-10">
                <div className="text-4xl">🎉</div>
                <h3 className="font-bold text-lg text-slate-800">¡Has visto todas las vacantes!</h3>
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

        {/* MODO BUSCO PERSONAL: EXPLORAR CANDIDATOS / GENTE */}
        {currentPage === 'candidates' && (
          <div className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-black text-xl text-slate-900">Buscar Personal 👥</h2>
                <p className="text-xs text-slate-500">Jóvenes cerca de tu negocio buscando oportunidad.</p>
              </div>
              <button 
                onClick={() => setCurrentPage('post-job')}
                className="bg-indigo-600 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center space-x-1"
              >
                <span>+ Publicar Vacante</span>
              </button>
            </div>

            {candidateIndex < candidates.length ? (
              <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden flex flex-col justify-between min-h-[460px]">
                <div className="p-5 space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-3xl shadow-inner">
                      {candidates[candidateIndex].avatar}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">
                        {candidates[candidateIndex].name}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        {candidates[candidateIndex].age} • {candidates[candidateIndex].zone}
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Habilidades:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {candidates[candidateIndex].skills.map((skill, i) => (
                        <span key={i} className="bg-white text-indigo-600 text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-slate-200">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <p><span className="font-bold text-slate-700">Disponibilidad:</span> {candidates[candidateIndex].availability}</p>
                    <p><span className="font-bold text-slate-700">Experiencia:</span> {candidates[candidateIndex].experience}</p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sobre el candidato</h4>
                    <p className="text-xs text-slate-600 leading-relaxed italic">
                      "{candidates[candidateIndex].bio}"
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-around items-center">
                  <button 
                    onClick={() => handlePass('candidate')}
                    className="w-14 h-14 bg-white text-slate-400 rounded-full shadow-md flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition border border-slate-100"
                  >
                    <X size={26} />
                  </button>
                  <button 
                    onClick={() => handleLike(candidates[candidateIndex], 'candidate')}
                    className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-full shadow-lg flex items-center justify-center transition"
                  >
                    <Heart size={30} className="fill-white" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-8 text-center space-y-4 shadow-sm border border-slate-100 my-10">
                <div className="text-4xl">👥</div>
                <h3 className="font-bold text-lg text-slate-800">No hay más candidatos cercanos</h3>
                <button 
                  onClick={() => setCandidateIndex(0)}
                  className="bg-indigo-600 text-white font-bold text-xs py-3 px-6 rounded-2xl"
                >
                  Volver a cargar candidatos
                </button>
              </div>
            )}
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
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-xl">
                        {item.logo || item.avatar || '💼'}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-800">{item.title || item.name}</h4>
                        <p className="text-xs text-slate-500">{item.company || item.zone}</p>
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
          <div className="p-4 space-y-4">
            <h2 className="font-black text-xl text-slate-900">Publicar vacante REAL 🏪</h2>
            <form onSubmit={handlePostJob} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 space-y-4">
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
                  placeholder="Descripción del trabajo..." 
                  value={newDesc} 
                  onChange={(e) => setNewDesc(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs h-20" 
                  required
                ></textarea>
              </div>

              <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-2xl shadow-lg hover:bg-indigo-700 transition">
                Guardar en la Base de Datos
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
              Interés guardado con <span className="font-bold text-indigo-600">{lastMatch.title || lastMatch.name}</span>.
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
          {userRole === 'seeker' ? (
            <button 
              onClick={() => setCurrentPage('explore')}
              className={`flex flex-col items-center space-y-1 ${currentPage === 'explore' ? 'text-indigo-600' : 'text-slate-400'}`}
            >
              <Search size={20} />
              <span className="text-[10px] font-bold">Buscar Vacantes</span>
            </button>
          ) : (
            <button 
              onClick={() => setCurrentPage('candidates')}
              className={`flex flex-col items-center space-y-1 ${currentPage === 'candidates' ? 'text-indigo-600' : 'text-slate-400'}`}
            >
              <Users size={20} />
              <span className="text-[10px] font-bold">Buscar Candidatos</span>
            </button>
          )}

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
