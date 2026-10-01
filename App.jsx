import React, { useState } from 'react';
import { 
  Briefcase, MapPin, DollarSign, Clock, Filter, Heart, X, Star, 
  MessageSquare, User, Building, ShieldCheck, ChevronRight, Search, 
  CheckCircle, AlertTriangle, PlusCircle, ArrowLeft, Send, Sparkles, Sliders
} from 'lucide-react';

// Datos iniciales de demostración
const INITIAL_JOBS = [
  {
    id: 1,
    title: 'Barista / Ayudante de Barra',
    company: 'Café Punta del Cielo - Centro',
    logo: '☕',
    distance: '1.2 km',
    salary: '$7,000 - $8,500 / mes',
    schedule: 'Medio Tiempo (Mañana)',
    type: 'Medio tiempo',
    experience: 'Sin experiencia',
    matchScore: 95,
    matchReasons: ['A 1.2 km de tu zona', 'Acepta principiantes', 'Horario flexible'],
    description: 'Buscamos joven dinámico para preparación de bebidas, atención en barra y manejo de caja. Ambiente relajado y juvenil.',
    requirements: ['Mayor de 18 años', 'Gusto por el servicio al cliente', 'Disponibilidad matutina'],
    verified: true,
    category: 'Alimentos y Bebidas'
  },
  {
    id: 2,
    title: 'Auxiliar de Tienda / Cajero',
    company: 'MiniSuper El Roble',
    logo: '🛒',
    distance: '2.5 km',
    salary: '$8,000 / mes',
    schedule: 'Tarde / Fin de semana',
    type: 'Fin de semana',
    experience: 'Sin experiencia',
    matchScore: 88,
    matchReasons: ['Excelente para estudiantes', 'Cerca de ti', 'Pago semanal'],
    description: 'Atención a clientes, acomodo de mercancía y cobro en caja. Ideal para estudiantes que buscan ingresos extra.',
    requirements: ['Secundaria concluida', 'Puntualidad y honestidad'],
    verified: true,
    category: 'Ventas / Comercio'
  },
  {
    id: 3,
    title: 'Creador de Contenido & Redes',
    company: 'Estudio Creativo MKT',
    logo: '📱',
    distance: '3.8 km',
    salary: '$9,500 / mes',
    schedule: 'Flexible / Híbrido',
    type: 'Temporal',
    experience: 'Sin experiencia',
    matchScore: 92,
    matchReasons: ['Coincide con tus habilidades', 'Horario súper flexible'],
    description: 'Apoyo en grabación de Reels/TikToks para negocios locales y edición básica en CapCut/Canva.',
    requirements: ['Manejo de celular inteligente', 'Creatividad', 'Gusto por las redes sociales'],
    verified: false,
    category: 'Diseño y Redes'
  }
];

export default function App() {
  const [currentPage, setCurrentPage] = useState('landing'); // landing, explore, matches, profile, post-job
  const [userRole, setUserRole] = useState('seeker'); // seeker, business
  const [jobs, setJobs] = useState(INITIAL_JOBS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matches, setMatches] = useState([]);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [lastMatchedJob, setLastMatchedJob] = useState(null);
  const [selectedJobDetail, setSelectedJobDetail] = useState(null);
  const [filterDistance, setFilterDistance] = useState(5);

  // Perfil del usuario
  const [userProfile, setUserProfile] = useState({
    name: 'Alex González',
    age: '20',
    zone: 'Col. Juárez / Centro',
    skills: ['Atención al cliente', 'Redes sociales', 'Computación'],
    type: 'Medio tiempo',
    expectedSalary: '$8,000 / mes'
  });

  // Manejo de Swipe / Interés
  const handleLike = () => {
    const currentJob = jobs[currentIndex];
    // Simulación de Match
    if (Math.random() > 0.3) {
      setMatches([...matches, currentJob]);
      setLastMatchedJob(currentJob);
      setShowMatchModal(true);
    }
    nextCard();
  };

  const handlePass = () => {
    nextCard();
  };

  const nextCard = () => {
    if (currentIndex < jobs.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(jobs.length); // Fin de las tarjetas
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 shadow-2xl relative overflow-hidden">
      
      {/* HEADER PRINCIPAL */}
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

          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setUserRole(userRole === 'seeker' ? 'business' : 'seeker')}
              className="text-xs font-semibold bg-slate-100 text-slate-600 px-2.5 py-1.5 rounded-full border border-slate-200"
            >
              {userRole === 'seeker' ? '👤 Busco Chamba' : '🏪 Soy Negocio'}
            </button>
          </div>
        </header>
      )}

      {/* CONTENIDO SEGÚN LA PÁGINA */}
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
                Sin currículums aburridos. Conecta directamente con negocios de tu zona y haz Match en segundos.
              </p>

              <div className="pt-6 space-y-3 w-full max-w-xs mx-auto">
                <button 
                  onClick={() => { setUserRole('seeker'); setCurrentPage('explore'); }}
                  className="w-full bg-white text-indigo-700 font-bold py-3.5 px-6 rounded-2xl shadow-lg hover:bg-slate-100 transition active:scale-95 flex items-center justify-center space-x-2"
                >
                  <Search size={18} />
                  <span>Quiero buscar trabajo</span>
                </button>
                <button 
                  onClick={() => { setUserRole('business'); setCurrentPage('post-job'); }}
                  className="w-full bg-indigo-500/30 backdrop-blur-md text-white font-semibold py-3.5 px-6 rounded-2xl border border-white/30 hover:bg-white/20 transition active:scale-95 flex items-center justify-center space-x-2"
                >
                  <Building size={18} />
                  <span>Soy un negocio local</span>
                </button>
              </div>
            </div>

            <div className="text-xs text-indigo-200/70 pb-4">
              Protección para menores • Negocios verificados
            </div>
          </div>
        )}

        {/* EXPLORACIÓN DE EMPLEOS (DESLIZADOR) */}
        {currentPage === 'explore' && (
          <div className="p-4 space-y-4">
            
            {/* BARRA DE FILTROS RÁPIDOS */}
            <div className="flex justify-between items-center bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center space-x-2 text-xs font-medium text-slate-600">
                <MapPin size={14} className="text-indigo-600" />
                <span>A menos de {filterDistance} km</span>
              </div>
              <button className="text-xs font-semibold text-indigo-600 flex items-center space-x-1 bg-indigo-50 px-3 py-1.5 rounded-xl">
                <Sliders size={12} />
                <span>Filtros</span>
              </button>
            </div>

            {/* TARJETA PRINCIPAL */}
            {currentIndex < jobs.length ? (
              <div className="relative">
                <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden flex flex-col justify-between min-h-[500px]">
                  
                  {/* Encabezado de la Tarjeta */}
                  <div className="p-5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
                          {jobs[currentIndex].logo}
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

                    {/* Badge de Compatibilidad */}
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3 flex items-center space-x-3">
                      <div className="bg-emerald-500 text-white font-black text-xs px-2 py-1 rounded-lg flex items-center space-x-1">
                        <Sparkles size={12} />
                        <span>{jobs[currentIndex].matchScore}%</span>
                      </div>
                      <div className="text-xs text-emerald-800 font-medium">
                        {jobs[currentIndex].matchReasons[0]}
                      </div>
                    </div>

                    {/* Detalle rápido */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-50 p-2.5 rounded-xl flex items-center space-x-2 text-slate-700">
                        <MapPin size={14} className="text-indigo-500" />
                        <span className="font-medium">{jobs[currentIndex].distance}</span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl flex items-center space-x-2 text-slate-700">
                        <DollarSign size={14} className="text-emerald-500" />
                        <span className="font-medium">{jobs[currentIndex].salary}</span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl flex items-center space-x-2 text-slate-700">
                        <Clock size={14} className="text-amber-500" />
                        <span className="font-medium">{jobs[currentIndex].schedule}</span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl flex items-center space-x-2 text-slate-700">
                        <Briefcase size={14} className="text-purple-500" />
                        <span className="font-medium">{jobs[currentIndex].experience}</span>
                      </div>
                    </div>

                    {/* Descripción */}
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sobre el puesto</h4>
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                        {jobs[currentIndex].description}
                      </p>
                    </div>
                  </div>

                  {/* Botón Ver Más detalles */}
                  <div className="px-5 pb-3">
                    <button 
                      onClick={() => setSelectedJobDetail(jobs[currentIndex])}
                      className="w-full text-center text-xs font-semibold text-indigo-600 bg-indigo-50/50 py-2 rounded-xl hover:bg-indigo-50"
                    >
                      Ver todos los detalles ➔
                    </button>
                  </div>

                  {/* BOTONES DE ACCIÓN (SWIPE) */}
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-around items-center">
                    <button 
                      onClick={handlePass}
                      className="w-14 h-14 bg-white text-slate-400 rounded-full shadow-md flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition active:scale-90 border border-slate-100"
                    >
                      <X size={26} />
                    </button>

                    <button 
                      onClick={handleLike}
                      className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full shadow-lg shadow-emerald-200 flex items-center justify-center transition active:scale-90"
                    >
                      <Heart size={30} className="fill-white" />
                    </button>
                  </div>

                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-8 text-center space-y-4 shadow-sm border border-slate-100 my-10">
                <div className="text-4xl">🎉</div>
                <h3 className="font-bold text-lg text-slate-800">¡Has visto todas las vacantes cercanas!</h3>
                <p className="text-xs text-slate-500">Prueba ampliar la distancia en los filtros para ver más empleos disponibles en tu ciudad.</p>
                <button 
                  onClick={() => setCurrentIndex(0)}
                  className="bg-indigo-600 text-white font-bold text-xs py-3 px-6 rounded-2xl"
                >
                  Volver a cargar
                </button>
              </div>
            )}

          </div>
        )}

        {/* LISTA DE MATCHES */}
        {currentPage === 'matches' && (
          <div className="p-4 space-y-4">
            <h2 className="font-black text-xl text-slate-900">Tus Matches 🎉</h2>
            <p className="text-xs text-slate-500">Negocios interesados en ponerse en contacto contigo.</p>

            {matches.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <div className="text-4xl">💬</div>
                <p className="text-xs text-slate-500">Aún no tienes matches. ¡Sigue interactuando con vacantes!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {matches.map((job, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-xl">
                        {job.logo}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-800">{job.title}</h4>
                        <p className="text-xs text-slate-500">{job.company}</p>
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

        {/* PERFIL */}
        {currentPage === 'profile' && (
          <div className="p-4 space-y-4">
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 text-center space-y-3">
              <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full mx-auto flex items-center justify-center text-2xl font-bold border-4 border-white shadow-md">
                AG
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">{userProfile.name}</h3>
                <p className="text-xs text-slate-500">{userProfile.zone} • {userProfile.age} años</p>
              </div>
              <span className="inline-block bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-100">
                Buscando: {userProfile.type}
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 space-y-3">
              <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Habilidades e Intereses</h4>
              <div className="flex flex-wrap gap-2">
                {userProfile.skills.map((skill, i) => (
                  <span key={i} className="bg-slate-100 text-slate-700 text-xs font-medium px-3 py-1.5 rounded-xl">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* RECOMENDACIONES DE SEGURIDAD */}
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200/60 space-y-2">
              <div className="flex items-center space-x-2 text-amber-800 font-bold text-xs">
                <AlertTriangle size={16} />
                <span>Consejos de Seguridad</span>
              </div>
              <p className="text-xs text-amber-700 leading-relaxed">
                Nunca realices pagos por solicitudes de empleo o capacitaciones. Asiste a entrevistas en lugares públicos y concurridos.
              </p>
            </div>
          </div>
        )}

        {/* PUBLICAR EMPLEO (MODO NEGOCIO) */}
        {currentPage === 'post-job' && (
          <div className="p-4 space-y-4">
            <h2 className="font-black text-xl text-slate-900">Publicar nueva vacante 🏪</h2>
            <p className="text-xs text-slate-500">Encuentra personal local en cuestión de horas.</p>

            <form onSubmit={(e) => { e.preventDefault(); alert('¡Vacante publicada con éxito!'); setCurrentPage('explore'); }} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del puesto</label>
                <input type="text" placeholder="Ej. Mesero, Auxiliar, Cajero" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-indigo-500" required />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre de tu negocio</label>
                <input type="text" placeholder="Ej. Cafetería La Esquina" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-indigo-500" required />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Salario mensual</label>
                  <input type="text" placeholder="Ej. $7,500" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-indigo-500" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Horario</label>
                  <input type="text" placeholder="Ej. Medio tiempo" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-indigo-500" required />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descripción corta</label>
                <textarea placeholder="¿Qué actividades realizará?" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-indigo-500 h-20" required></textarea>
              </div>

              <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-2xl shadow-lg hover:bg-indigo-700 transition">
                Publicar Vacante Gratis
              </button>
            </form>
          </div>
        )}

      </main>

      {/* MODAL MATCH (POPUP CELEBRACIÓN) */}
      {showMatchModal && lastMatchedJob && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 text-center space-y-5 max-w-xs w-full shadow-2xl">
            <div className="text-5xl">🎉</div>
            <div>
              <h3 className="font-black text-2xl text-slate-900">¡Hicieron Match!</h3>
              <p className="text-xs text-slate-500 mt-1">
                A <span className="font-bold text-indigo-600">{lastMatchedJob.company}</span> también le interesó tu perfil.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl flex items-center space-x-3">
              <div className="text-2xl">{lastMatchedJob.logo}</div>
              <div className="text-left">
                <div className="font-bold text-xs text-slate-800">{lastMatchedJob.title}</div>
                <div className="text-[10px] text-slate-500">{lastMatchedJob.salary}</div>
              </div>
            </div>

            <div className="space-y-2">
              <button 
                onClick={() => { setShowMatchModal(false); setCurrentPage('matches'); }}
                className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl text-xs shadow-md"
              >
                Enviar Mensaje
              </button>
              <button 
                onClick={() => setShowMatchModal(false)}
                className="w-full bg-slate-100 text-slate-600 font-semibold py-2.5 rounded-xl text-xs"
              >
                Seguir viendo vacantes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NAVEGACIÓN INFERIOR (TAB BAR) */}
      {currentPage !== 'landing' && (
        <nav className="fixed bottom-0 max-w-md w-full bg-white border-t border-slate-100 px-6 py-2.5 flex justify-around items-center z-30">
          <button 
            onClick={() => setCurrentPage('explore')}
            className={`flex flex-col items-center space-y-1 ${currentPage === 'explore' ? 'text-indigo-600' : 'text-slate-400'}`}
          >
            <Search size={20} />
            <span className="text-[10px] font-bold">Explorar</span>
          </button>

          <button 
            onClick={() => setCurrentPage('matches')}
            className={`flex flex-col items-center space-y-1 relative ${currentPage === 'matches' ? 'text-indigo-600' : 'text-slate-400'}`}
          >
            <MessageSquare size={20} />
            <span className="text-[10px] font-bold">Matches</span>
            {matches.length > 0 && (
              <span className="absolute -top-1 right-2 w-2 h-2 bg-rose-500 rounded-full"></span>
            )}
          </button>

          <button 
            onClick={() => setCurrentPage('profile')}
            className={`flex flex-col items-center space-y-1 ${currentPage === 'profile' ? 'text-indigo-600' : 'text-slate-400'}`}
          >
            <User size={20} />
            <span className="text-[10px] font-bold">Mi Perfil</span>
          </button>
        </nav>
      )}

    </div>
  );
}
