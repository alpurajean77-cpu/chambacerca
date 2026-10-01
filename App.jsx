import React, { useState, useEffect } from 'react';
import { 
  Briefcase, MapPin, DollarSign, Clock, Filter, Heart, X, Star, 
  MessageSquare, User, Building, ShieldCheck, ChevronRight, Search, 
  CheckCircle, AlertTriangle, PlusCircle, ArrowLeft, Send, Sparkles, Sliders
} from 'lucide-react';

// Importaciones de Firebase
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp 
} from 'firebase/firestore';

// Configuración de tu Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB9naI5Ao7-TvszmaZUI1Cia99qvQL_7Iw",
  authDomain: "chambacerca-ca0c9.firebaseapp.com",
  projectId: "chambacerca-ca0c9",
  storageBucket: "chambacerca-ca0c9.firebasestorage.app",
  messagingSenderId: "256126044044",
  appId: "1:256126044044:web:e87aefa59bb3d8b8c638a9",
  measurementId: "G-SENSF6XZ3L"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function App() {
  const [currentPage, setCurrentPage] = useState('landing');
  const [userRole, setUserRole] = useState('seeker');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matches, setMatches] = useState([]);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [lastMatchedJob, setLastMatchedJob] = useState(null);
  const [selectedJobDetail, setSelectedJobDetail] = useState(null);

  // Campos para formulario de publicar vacante
  const [newTitle, setNewTitle] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newSalary, setNewSalary] = useState('');
  const [newSchedule, setNewSchedule] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // Cargar vacantes en tiempo real desde Firebase Firestore
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

  // Publicar vacante REAL en Firebase
  const handlePostJob = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "vacantes"), {
        title: newTitle,
        company: newCompany,
        salary: newSalary,
        schedule: newSchedule,
        description: newDesc,
        distance: 'Local',
        logo: '🏪',
        verified: true,
        matchScore: 90,
        matchReasons: ['Nueva vacante publicada'],
        createdAt: serverTimestamp()
      });

      // Limpiar campos
      setNewTitle('');
      setNewCompany('');
      setNewSalary('');
      setNewSchedule('');
      setNewDesc('');

      alert('¡Vacante publicada con éxito en la base de datos real!');
      setCurrentPage('explore');
    } catch (error) {
      console.error("Error al publicar vacante: ", error);
      alert('Error al publicar. Asegúrate de haber activado Firestore en Firebase.');
    }
  };

  const handleLike = () => {
    if (jobs.length > 0 && currentIndex < jobs.length) {
      const currentJob = jobs[currentIndex];
      setMatches([...matches, currentJob]);
      setLastMatchedJob(currentJob);
      setShowMatchModal(true);
      nextCard();
    }
  };

  const handlePass = () => {
    nextCard();
  };

  const nextCard = () => {
    if (currentIndex < jobs.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(jobs.length);
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 shadow-2xl relative overflow-hidden">
      
      {/* HEADER */}
      {currentPage !== 'landing' && (
        <header className="bg-white border-b border-slate-100 px-4 py-3 flex justify-between items-center sticky top-0 z-30">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setCurrentPage('explore')}>
            <div className="bg-indigo-600 text-white p-2 rounded-xl font-bold text-lg flex items-center justify-center w-9 h-9">
              ⚡
            </div>
            <span className="font-black text-xl tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              ChambaCerca
            </span>
          </div>

          <button 
            onClick={() => setUserRole(userRole === 'seeker' ? 'business' : 'seeker')}
            className="text-xs font-semibold bg-slate-100 text-slate-600 px-2.5 py-1.5 rounded-full border border-slate-200"
          >
            {userRole === 'seeker' ? '👤 Busco Chamba' : '🏪 Soy Negocio'}
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
                Encuentra chamba <br/>cerca de ti
              </h1>
              <p className="text-indigo-100 text-sm max-w-xs mx-auto leading-relaxed">
                Plataforma real conectada en tiempo real. Descubre vacantes locales o publica empleos gratis.
              </p>

              <div className="pt-6 space-y-3 w-full max-w-xs mx-auto">
                <button 
                  onClick={() => { setUserRole('seeker'); setCurrentPage('explore'); }}
                  className="w-full bg-white text-indigo-700 font-bold py-3.5 px-6 rounded-2xl shadow-lg hover:bg-slate-100 transition active:scale-95 flex items-center justify-center space-x-2"
                >
                  <Search size={18} />
                  <span>Ver vacantes reales</span>
                </button>
                <button 
                  onClick={() => { setUserRole('business'); setCurrentPage('post-job'); }}
                  className="w-full bg-indigo-500/30 backdrop-blur-md text-white font-semibold py-3.5 px-6 rounded-2xl border border-white/30 hover:bg-white/20 transition active:scale-95 flex items-center justify-center space-x-2"
                >
                  <Building size={18} />
                  <span>Publicar un empleo real</span>
                </button>
              </div>
            </div>
            <div className="text-xs text-indigo-200/70 pb-4">Conectado con Google Firebase Cloud Database</div>
          </div>
        )}

        {/* EXPLORAR VACANTES */}
        {currentPage === 'explore' && (
          <div className="p-4 space-y-4">
            
            {loading ? (
              <div className="text-center py-20 space-y-3">
                <div className="animate-spin text-indigo-600 text-3xl">🌀</div>
                <p className="text-xs text-slate-500">Conectando a la base de datos real...</p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center space-y-4 shadow-sm border border-slate-100 my-10">
                <div className="text-4xl">🏪</div>
                <h3 className="font-bold text-lg text-slate-800">Aún no hay vacantes publicadas</h3>
                <p className="text-xs text-slate-500">Sé el primero en publicar una vacante desde la sección de negocios.</p>
                <button 
                  onClick={() => { setUserRole('business'); setCurrentPage('post-job'); }}
                  className="bg-indigo-600 text-white font-bold text-xs py-3 px-6 rounded-2xl"
                >
                  Publicar primera vacante
                </button>
              </div>
            ) : currentIndex < jobs.length ? (
              <div className="relative">
                <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden flex flex-col justify-between min-h-[480px]">
                  
                  <div className="p-5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
                          {jobs[currentIndex].logo || '💼'}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-lg leading-snug">
                            {jobs[currentIndex].title}
                          </h3>
                          <p className="text-xs font-medium text-slate-500 flex items-center space-x-1">
                            <span>{jobs[currentIndex].company}</span>
                            {jobs[currentIndex].verified && (
                              <ShieldCheck size={14} className="text-blue-500 inline" />
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-50 p-2.5 rounded-xl flex items-center space-x-2 text-slate-700">
                        <DollarSign size={14} className="text-emerald-500" />
                        <span className="font-medium">{jobs[currentIndex].salary}</span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl flex items-center space-x-2 text-slate-700">
                        <Clock size={14} className="text-amber-500" />
                        <span className="font-medium">{jobs[currentIndex].schedule}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Detalles</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {jobs[currentIndex].description}
                      </p>
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
                      onClick={handleLike}
                      className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full shadow-lg flex items-center justify-center transition"
                    >
                      <Heart size={30} className="fill-white" />
                    </button>
                  </div>

                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-8 text-center space-y-4 shadow-sm border border-slate-100 my-10">
                <div className="text-4xl">🎉</div>
                <h3 className="font-bold text-lg text-slate-800">Has visto todas las vacantes</h3>
                <button 
                  onClick={() => setCurrentIndex(0)}
                  className="bg-indigo-600 text-white font-bold text-xs py-3 px-6 rounded-2xl"
                >
                  Volver a revisar
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
              <p className="text-xs text-slate-500">Aún no has guardado intereses.</p>
            ) : (
              <div className="space-y-3">
                {matches.map((job, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-800">{job.title}</h4>
                      <p className="text-xs text-slate-500">{job.company}</p>
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

        {/* PUBLICAR EMPLEO (DESDE EL NEGOCIO HACIA LA BASE DE DATOS) */}
        {currentPage === 'post-job' && (
          <div className="p-4 space-y-4">
            <h2 className="font-black text-xl text-slate-900">Publicar vacante REAL 🏪</h2>
            <p className="text-xs text-slate-500">Esta vacante se guardará en la nube de Firebase de inmediato.</p>

            <form onSubmit={handlePostJob} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Puesto</label>
                <input 
                  type="text" 
                  placeholder="Ej. Barista, Auxiliar" 
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
                  placeholder="Ej. Café Punta del Cielo" 
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Descripción de actividades</label>
                <textarea 
                  placeholder="Detalles sobre las tareas..." 
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

      {/* NAVEGACIÓN INFERIOR */}
      {currentPage !== 'landing' && (
        <nav className="fixed bottom-0 max-w-md w-full bg-white border-t border-slate-100 px-6 py-2.5 flex justify-around items-center z-30">
          <button 
            onClick={() => setCurrentPage('explore')}
            className={`flex flex-col items-center space-y-1 ${currentPage === 'explore' ? 'text-indigo-600' : 'text-slate-400'}`}
          >
            <Search size={20} />
            <span className="text-[10px] font-bold">Vacantes</span>
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
