import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  updateProfile
} from 'firebase/auth';

// ===========================================================================
// 1. CONFIGURACIÓN E INICIALIZACIÓN DE FIREBASE (API KEY VALIDADA)
// ===========================================================================
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
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// ===========================================================================
// 2. BASE DE DATOS INICIAL DE TRABAJOS Y OFICIOS (MOCK EXTENDIDO)
// ===========================================================================
const INITIAL_JOBS_DATABASE = [
  {
    id: 'job-101',
    title: 'Reparación Urgente de Fuga de Agua y Plomería',
    category: 'Plomería',
    description: 'Se necesita plomero capacitado para reparar tuberia principal de PVC de 1/2 pulgada bajo la tarja de la cocina. Se requiere traer herramienta propia.',
    pay: '$450 MXN',
    numericPay: 450,
    payType: 'Por trabajo',
    urgency: 'Alta',
    authorName: 'Carlos Mendoza',
    authorPhone: '2711234567',
    authorRating: '4.8 ★',
    lat: 18.8950,
    lng: -96.9320,
    distanceKm: 1.2,
    timeAgo: 'Hace 15 min',
    status: 'Abierta',
    applicantsCount: 3
  },
  {
    id: 'job-102',
    title: 'Mantenimiento e Instalación Eléctrica Residencial',
    category: 'Electricidad',
    description: 'Instalación de 4 contactos dobles, 2 apagadores sencillos y revisión del centro de carga principal por cortocircuito ligero en recámara.',
    pay: '$800 MXN',
    numericPay: 800,
    payType: 'Por trabajo',
    urgency: 'Media',
    authorName: 'Elena Torres',
    authorPhone: '2719876543',
    authorRating: '4.9 ★',
    lat: 18.8910,
    lng: -96.9280,
    distanceKm: 2.5,
    timeAgo: 'Hace 1 hora',
    status: 'Abierta',
    applicantsCount: 1
  },
  {
    id: 'job-103',
    title: 'Pintor para Fachada Exterior de Casa de 2 Pisos',
    category: 'Pintura',
    description: 'Se requiere pintor con experiencia comprobable en fachada exterior. Nosotros proporcionamos la pintura vinílica, brochas, rodillos y andamio.',
    pay: '$1,200 MXN',
    numericPay: 1200,
    payType: 'Por día',
    urgency: 'Baja',
    authorName: 'Roberto Gómez',
    authorPhone: '2715554433',
    authorRating: '4.7 ★',
    lat: 18.8990,
    lng: -96.9400,
    distanceKm: 4.1,
    timeAgo: 'Hace 3 horas',
    status: 'Abierta',
    applicantsCount: 5
  },
  {
    id: 'job-104',
    title: 'Corte de Césped, Mantenimiento y Limpieza de Jardín',
    category: 'Jardinería',
    description: 'Jardín frontal pequeño de 50m2. Incluye podar césped, retirar maleza y embolsar residuos verdes para recolección.',
    pay: '$350 MXN',
    numericPay: 350,
    payType: 'Por trabajo',
    urgency: 'Baja',
    authorName: 'Ana Lucía Juárez',
    authorPhone: '2714443322',
    authorRating: '5.0 ★',
    lat: 18.8870,
    lng: -96.9350,
    distanceKm: 0.8,
    timeAgo: 'Hace 5 horas',
    status: 'Abierta',
    applicantsCount: 2
  },
  {
    id: 'job-105',
    title: 'Construcción de Bardita de Bloque y Cimentación',
    category: 'Albañilería',
    description: 'Levantar barda de 3 metros de largo por 2 metros de alto. Se requiere albañil con ayudante. Material ya disponible en obra.',
    pay: '$2,500 MXN',
    numericPay: 2500,
    payType: 'Por destajo',
    urgency: 'Alta',
    authorName: 'Ing. Fernando Silva',
    authorPhone: '2718889900',
    authorRating: '4.6 ★',
    lat: 18.9020,
    lng: -96.9210,
    distanceKm: 5.8,
    timeAgo: 'Hace 1 día',
    status: 'Abierta',
    applicantsCount: 8
  },
  {
    id: 'job-106',
    title: 'Limpieza Profunda de Casa y Lavado de Ventanas',
    category: 'Limpieza',
    description: 'Aseo general de departamento de 2 recámaras, 1 baño, sala y cocina. Incluye limpieza de cristales y sacudido de muebles.',
    pay: '$500 MXN',
    numericPay: 500,
    payType: 'Por día',
    urgency: 'Media',
    authorName: 'Patricia Morales',
    authorPhone: '2713332211',
    authorRating: '4.9 ★',
    lat: 18.8930,
    lng: -96.9380,
    distanceKm: 1.9,
    timeAgo: 'Hace 1 día',
    status: 'Abierta',
    applicantsCount: 4
  }
];

const CATEGORIES_LIST = [
  'Todas',
  'Plomería',
  'Electricidad',
  'Pintura',
  'Jardinería',
  'Albañilería',
  'Limpieza',
  'Carpintería',
  'Mecánica',
  'Otros'
];

// ===========================================================================
// 3. COMPONENTE PRINCIPAL APP
// ===========================================================================
export default function App() {
  // Estados Globales de Autenticación
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  
  // Estados del Formulario Login/Registro
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [isSignUpMode, setIsSignUpMode] = useState(false);

  // Estados de Navegación de Vistas
  const [currentTab, setCurrentTab] = useState('feed'); // 'feed' | 'map' | 'publish' | 'my-jobs' | 'profile'
  
  // Estados de Ubicación GPS
  const [userCoords, setUserCoords] = useState({ lat: 18.8939, lng: -96.9356 }); // Coordenadas Córdoba, Ver.
  const [gpsStatusText, setGpsStatusText] = useState('Obteniendo ubicación GPS...');
  const [hasGpsPermission, setHasGpsPermission] = useState(false);

  // Estados de Filtro y Radar
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCat, setSelectedCat] = useState('Todas');
  const [radarDistanceKm, setRadarDistanceKm] = useState(15);
  const [filterUrgency, setFilterUrgency] = useState('Todas');
  const [sortByPay, setSortByPay] = useState('none'); // 'none' | 'asc' | 'desc'

  // Estados de Gestión de Datos
  const [jobsList, setJobsList] = useState(INITIAL_JOBS_DATABASE);
  const [selectedJobModal, setSelectedJobModal] = useState(null);
  const [toastNotification, setToastNotification] = useState(null);

  // Estados para Publicar Trabajo
  const [publishForm, setPublishForm] = useState({
    title: '',
    category: 'Plomería',
    description: '',
    payAmount: '',
    payType: 'Por trabajo',
    urgency: 'Media',
    phone: ''
  });

  // ---------------------------------------------------------------------------
  // EFECTO: Escuchar Estado de Autenticación y Solicitar GPS al inicio
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });

    // Petición automática de Geolocalización
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setGpsStatusText('Ubicación obtenida en tiempo real');
          setHasGpsPermission(true);
        },
        (error) => {
          console.warn("Geolocalización rechazada:", error);
          setGpsStatusText('Ubicación aproximada predeterminada');
          setHasGpsPermission(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setGpsStatusText('GPS no soportado en este navegador');
    }

    return () => unsubscribe();
  }, []);

  // ---------------------------------------------------------------------------
  // MANEJADORES DE AUTENTICACIÓN
  // ---------------------------------------------------------------------------
  const handleEmailAuthentication = async (e) => {
    e.preventDefault();
    setAuthError('');

    if (!emailInput || !passwordInput) {
      setAuthError('Por favor completa todos los campos requeridos.');
      return;
    }

    try {
      if (isSignUpMode) {
        const userCredential = await createUserWithEmailAndPassword(auth, emailInput, passwordInput);
        if (nameInput) {
          await updateProfile(userCredential.user, { displayName: nameInput });
        }
        showToast('¡Cuenta creada con éxito! Bienvenido a ChambaCerca.');
      } else {
        await signInWithEmailAndPassword(auth, emailInput, passwordInput);
        showToast('¡Sesión iniciada correctamente!');
      }
    } catch (err) {
      console.error("Error Auth Firebase:", err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setAuthError('Correo o contraseña incorrectos.');
      } else if (err.code === 'auth/email-already-in-use') {
        setAuthError('Este correo electrónico ya está registrado.');
      } else if (err.code === 'auth/weak-password') {
        setAuthError('La contraseña debe tener al menos 6 caracteres.');
      } else {
        setAuthError('Error de autenticación: ' + err.message);
      }
    }
  };

  const handleGoogleAuthentication = async () => {
    setAuthError('');
    try {
      await signInWithPopup(auth, googleProvider);
      showToast('¡Sesión iniciada con Google!');
    } catch (err) {
      console.error("Error Google Auth:", err);
      setAuthError('Error al autenticar con Google: ' + err.message);
    }
  };

  const handleSignOutUser = async () => {
    try {
      await signOut(auth);
      showToast('Sesión cerrada correctamente');
      setCurrentTab('feed');
    } catch (err) {
      console.error("Error al salir:", err);
    }
  };

  // ---------------------------------------------------------------------------
  // MANEJADOR DE PUBLICACIÓN DE NUEVAS CHAMBAS
  // ---------------------------------------------------------------------------
  const handlePublishJobSubmit = (e) => {
    e.preventDefault();
    
    if (!publishForm.title || !publishForm.description || !publishForm.payAmount) {
      showToast('Por favor completa los campos obligatorios del formulario');
      return;
    }

    const newCreatedJob = {
      id: `job-${Date.now()}`,
      title: publishForm.title,
      category: publishForm.category,
      description: publishForm.description,
      pay: `$${publishForm.payAmount} MXN`,
      numericPay: parseFloat(publishForm.payAmount) || 0,
      payType: publishForm.payType,
      urgency: publishForm.urgency,
      authorName: user?.displayName || user?.email?.split('@')[0] || 'Usuario ChambaCerca',
      authorPhone: publishForm.phone || '2710000000',
      authorRating: '5.0 ★',
      lat: userCoords.lat + (Math.random() - 0.5) * 0.015,
      lng: userCoords.lng + (Math.random() - 0.5) * 0.015,
      distanceKm: parseFloat((Math.random() * 2 + 0.2).toFixed(1)),
      timeAgo: 'Hace unos momentos',
      status: 'Abierta',
      applicantsCount: 0,
      isOwner: true
    };

    setJobsList([newCreatedJob, ...jobsList]);
    setPublishForm({
      title: '',
      category: 'Plomería',
      description: '',
      payAmount: '',
      payType: 'Por trabajo',
      urgency: 'Media',
      phone: ''
    });
    
    showToast('¡Chamba publicada con éxito en el radar!');
    setCurrentTab('feed');
  };

  // ---------------------------------------------------------------------------
  // SISTEMA DE NOTIFICACIONES TOAST
  // ---------------------------------------------------------------------------
  const showToast = (message) => {
    setToastNotification(message);
    setTimeout(() => {
      setToastNotification(null);
    }, 4000);
  };

  // ---------------------------------------------------------------------------
  // ALGORITMO DE FILTRADO Y ORDENAMIENTO DINÁMICO DE TRABAJOS
  // ---------------------------------------------------------------------------
  const processedJobsList = jobsList.filter(job => {
    const matchesCategory = selectedCat === 'Todas' || job.category === selectedCat;
    const matchesSearch = job.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
                          job.description.toLowerCase().includes(searchKeyword.toLowerCase()) ||
                          job.authorName.toLowerCase().includes(searchKeyword.toLowerCase());
    const matchesDistance = job.distanceKm <= radarDistanceKm;
    const matchesUrgency = filterUrgency === 'Todas' || job.urgency === filterUrgency;

    return matchesCategory && matchesSearch && matchesDistance && matchesUrgency;
  }).sort((a, b) => {
    if (sortByPay === 'asc') return a.numericPay - b.numericPay;
    if (sortByPay === 'desc') return b.numericPay - a.numericPay;
    return 0;
  });

  // Pantalla de Carga Global
  if (isAuthLoading) {
    return (
      <div style={expandedStyles.loadingScreen}>
        <div style={expandedStyles.spinnerIcon}></div>
        <h3 style={{ color: '#0070f3', marginTop: '20px', fontFamily: 'sans-serif' }}>ChambaCerca</h3>
        <p style={{ color: '#666', fontSize: '14px', fontFamily: 'sans-serif' }}>Iniciando servicios y conexión GPS...</p>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDERIZADO 1: PANTALLA DE ACCESO / REGISTRO (SI NO HAY SESIÓN)
  // ---------------------------------------------------------------------------
  if (!user) {
    return (
      <div style={expandedStyles.authBackground}>
        <div style={expandedStyles.authContainerBox}>
          
          <div style={expandedStyles.authBrandHeader}>
            <div style={expandedStyles.authLogoCircle}>🛠️</div>
            <h1 style={expandedStyles.authTitleText}>ChambaCerca</h1>
            <p style={expandedStyles.authSubtitleText}>
              Encuentra oficios y contrataciones rápidas cerca de tu ubicación
            </p>
          </div>

          {authError && (
            <div style={expandedStyles.authErrorBanner}>
              ⚠️ {authError}
            </div>
          )}

          <form onSubmit={handleEmailAuthentication} style={expandedStyles.authForm}>
            {isSignUpMode && (
              <div style={expandedStyles.inputFieldGroup}>
                <label style={expandedStyles.inputLabel}>Nombre y Apellidos</label>
                <input 
                  type="text" 
                  placeholder="Ej. Juan Pérez" 
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  style={expandedStyles.textInput}
                  required={isSignUpMode}
                />
              </div>
            )}

            <div style={expandedStyles.inputFieldGroup}>
              <label style={expandedStyles.inputLabel}>Correo Electrónico</label>
              <input 
                type="email" 
                placeholder="tu@correo.com" 
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                style={expandedStyles.textInput}
                required
              />
            </div>

            <div style={expandedStyles.inputFieldGroup}>
              <label style={expandedStyles.inputLabel}>Contraseña</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                style={expandedStyles.textInput}
                required
              />
            </div>

            <button type="submit" style={expandedStyles.submitPrimaryButton}>
              {isSignUpMode ? 'Crear Cuenta Gratis' : 'Iniciar Sesión'}
            </button>
          </form>

          <div style={expandedStyles.dividerSeparator}>
            <span style={expandedStyles.dividerLineSpan}></span>
            <span style={expandedStyles.dividerLabelSpan}>o continúa con</span>
            <span style={expandedStyles.dividerLineSpan}></span>
          </div>

          <button onClick={handleGoogleAuthentication} style={expandedStyles.googleSocialButton}>
            <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: '10px' }}>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            Ingresar con cuenta de Google
          </button>

          <div style={expandedStyles.switchModeFooter}>
            {isSignUpMode ? '¿Ya tienes una cuenta registrada?' : '¿No tienes cuenta en ChambaCerca?'}
            <button 
              onClick={() => { setIsSignUpMode(!isSignUpMode); setAuthError(''); }}
              style={expandedStyles.switchModeLinkButton}
            >
              {isSignUpMode ? ' Inicia sesión' : ' Regístrate aquí'}
            </button>
          </div>

        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDERIZADO 2: APLICACIÓN PRINCIPAL (USUARIO CON SESIÓN ACTIVA)
  // ---------------------------------------------------------------------------
  return (
    <div style={expandedStyles.appShellLayout}>
      
      {/* Toast de Notificaciones */}
      {toastNotification && (
        <div style={expandedStyles.toastFloatingNotification}>
          🔔 {toastNotification}
        </div>
      )}

      {/* Header Superior Principal */}
      <header style={expandedStyles.mainTopHeader}>
        <div style={expandedStyles.topHeaderContentWrapper}>
          <div style={expandedStyles.brandTitleGroup}>
            <span style={{ fontSize: '26px' }}>🛠️</span>
            <div>
              <h2 style={expandedStyles.brandMainTitle}>ChambaCerca</h2>
              <span style={expandedStyles.brandSubTag}>Radar de empleos locales</span>
            </div>
          </div>

          <div style={expandedStyles.headerUserActions}>
            <div style={expandedStyles.gpsStatusBadge} title={gpsStatusText}>
              <span style={{ color: hasGpsPermission ? '#137333' : '#d93025' }}>●</span>
              {hasGpsPermission ? ` Radar GPS (${radarDistanceKm}km)` : ' GPS Fijo'}
            </div>
            <button onClick={handleSignOutUser} style={expandedStyles.headerLogoutButton}>
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Dinámico Según la Pestaña Activa */}
      <main style={expandedStyles.appMainContainer}>

        {/* -----------------------------------------------------------------
            PESTAÑA 1: NOVEDADES / LISTADO DE TRABAJOS Y FILTROS
            ----------------------------------------------------------------- */}
        {currentTab === 'feed' && (
          <div style={expandedStyles.tabContentContainer}>
            
            {/* Tarjeta de Búsqueda y Control de Radar */}
            <div style={expandedStyles.radarFilterControlCard}>
              <div style={expandedStyles.searchBarInputWrapper}>
                <span style={{ fontSize: '18px' }}>🔍</span>
                <input 
                  type="text" 
                  placeholder="Buscar por oficio, plomero, pintor, electricista..." 
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  style={expandedStyles.searchInnerInput}
                />
                {searchKeyword && (
                  <button onClick={() => setSearchKeyword('')} style={expandedStyles.clearSearchButton}>✕</button>
                )}
              </div>

              {/* Slider de Categorías Horizontal */}
              <div style={expandedStyles.horizontalCategoriesScroll}>
                {CATEGORIES_LIST.map(category => (
                  <button 
                    key={category}
                    onClick={() => setSelectedCat(category)}
                    style={{
                      ...expandedStyles.categoryChipButton,
                      ...(selectedCat === category ? expandedStyles.categoryChipButtonActive : {})
                    }}
                  >
                    {category}
                  </button>
                ))}
              </div>

              {/* Control del Rango del Radar GPS */}
              <div style={expandedStyles.radarDistanceSliderContainer}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={expandedStyles.sliderTitleLabel}>📡 Distancia Máxima del Radar:</span>
                  <span style={expandedStyles.sliderValueHighlight}><strong>{radarDistanceKm} km</strong> a la redonda</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="50" 
                  value={radarDistanceKm}
                  onChange={(e) => setRadarDistanceKm(Number(e.target.value))}
                  style={expandedStyles.sliderInputElement}
                />
              </div>

              {/* Filtros Secundarios: Urgencia y Ordenamiento */}
              <div style={expandedStyles.secondaryFiltersRow}>
                <div style={{ flex: 1 }}>
                  <label style={expandedStyles.smallFilterLabel}>Urgencia:</label>
                  <select 
                    value={filterUrgency} 
                    onChange={(e) => setFilterUrgency(e.target.value)}
                    style={expandedStyles.filterSelectDropdown}
                  >
                    <option value="Todas">Todas las urgencias</option>
                    <option value="Alta">Urgencia Alta 🔥</option>
                    <option value="Media">Urgencia Media ⚡</option>
                    <option value="Baja">Urgencia Baja 🌱</option>
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={expandedStyles.smallFilterLabel}>Ordenar Pago:</label>
                  <select 
                    value={sortByPay} 
                    onChange={(e) => setSortByPay(e.target.value)}
                    style={expandedStyles.filterSelectDropdown}
                  >
                    <option value="none">Por defecto</option>
                    <option value="desc">Mayor pago a menor</option>
                    <option value="asc">Menor pago a mayor</option>
                  </select>
                </div>
              </div>

            </div>

            {/* Listado de Tarjetas de Trabajo (ChambaCards) */}
            <div style={expandedStyles.jobCardsGridList}>
              {processedJobsList.length === 0 ? (
                <div style={expandedStyles.emptyResultsStateBox}>
                  <div style={{ fontSize: '40px' }}>🔎</div>
                  <h4 style={{ margin: '10px 0 5px 0', color: '#333' }}>No se encontraron trabajos en tu radar</h4>
                  <p style={{ color: '#777', fontSize: '13px', margin: 0 }}>
                    Prueba aumentando la distancia del radar en kilometros o seleccionando otra categoría.
                  </p>
                </div>
              ) : (
                processedJobsList.map(jobItem => (
                  <article key={jobItem.id} style={expandedStyles.chambaCardArticle}>
                    
                    <div style={expandedStyles.chambaCardTopBar}>
                      <span style={expandedStyles.chambaCategoryTag}>{jobItem.category}</span>
                      <span style={{
                        ...expandedStyles.chambaUrgencyBadge,
                        backgroundColor: jobItem.urgency === 'Alta' ? '#ffebee' : '#f1f3f4',
                        color: jobItem.urgency === 'Alta' ? '#c62828' : '#555'
                      }}>
                        {jobItem.urgency === 'Alta' ? '🔥 Alta Urgencia' : `⚡ ${jobItem.urgency}`}
                      </span>
                    </div>

                    <h3 style={expandedStyles.chambaCardTitleText}>{jobItem.title}</h3>
                    <p style={expandedStyles.chambaCardDescriptionText}>{jobItem.description}</p>

                    <div style={expandedStyles.chambaPriceRow}>
                      <div>
                        <span style={expandedStyles.priceAmountText}>{jobItem.pay}</span>
                        <span style={expandedStyles.priceTypeSubtext}> ({jobItem.payType})</span>
                      </div>
                      <span style={expandedStyles.applicantsCountBadge}>👥 {jobItem.applicantsCount} postulados</span>
                    </div>

                    <div style={expandedStyles.chambaCardFooterMeta}>
                      <span>👤 {jobItem.authorName}</span>
                      <span>📍 A {jobItem.distanceKm} km</span>
                      <span>⏱️ {jobItem.timeAgo}</span>
                    </div>

                    <button 
                      onClick={() => setSelectedJobModal(jobItem)}
                      style={expandedStyles.chambaApplyCardButton}
                    >
                      Ver Detalle y Postularme
                    </button>

                  </article>
                ))
              )}
            </div>

          </div>
        )}

        {/* -----------------------------------------------------------------
            PESTAÑA 2: MAPA DE RADAR INTERACTIVO
            ----------------------------------------------------------------- */}
        {currentTab === 'map' && (
          <div style={expandedStyles.tabContentContainer}>
            <div style={expandedStyles.mapHeaderBanner}>
              <h3 style={{ margin: 0, fontSize: '16px' }}>🗺️ Radar de Coordenadas GPS</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', opacity: 0.9 }}>
                Visualizando {processedJobsList.length} publicaciones activas cerca de ti ({userCoords.lat.toFixed(4)}, {userCoords.lng.toFixed(4)})
              </p>
            </div>

            <div style={expandedStyles.interactiveMapCanvasContainer}>
              <div style={expandedStyles.mapGridCanvasBackground}>
                
                {/* Pin de Ubicación Actual del Usuario */}
                <div style={expandedStyles.userCenterGpsPin}>
                  <div style={expandedStyles.userGpsPulseRing}></div>
                  📍 <span style={expandedStyles.userGpsPinLabel}>Tu Ubicación Actual</span>
                </div>

                {/* Pins de Trabajos en el Mapa */}
                {processedJobsList.map((jobPin, index) => (
                  <div 
                    key={jobPin.id}
                    style={{
                      ...expandedStyles.jobMapPinBubble,
                      top: `${25 + ((index * 17) % 55)}%`,
                      left: `${15 + ((index * 23) % 65)}%`
                    }}
                    onClick={() => setSelectedJobModal(jobPin)}
                  >
                    🛠️ <strong>{jobPin.category}</strong>: {jobPin.pay}
                  </div>
                ))}

              </div>
            </div>
          </div>
        )}

        {/* -----------------------------------------------------------------
            PESTAÑA 3: FORMULARIO DE PUBLICACIÓN DE CHAMBA
            ----------------------------------------------------------------- */}
        {currentTab === 'publish' && (
          <div style={expandedStyles.tabContentContainer}>
            <div style={expandedStyles.publishFormCardBox}>
              
              <div style={expandedStyles.formCardHeader}>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#111' }}>📢 Publicar un Trabajo u Oficio</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#666' }}>
                  Llega a trabajadores y especialistas cerca de tu ubicación
                </p>
              </div>

              <form onSubmit={handlePublishJobSubmit} style={expandedStyles.publishFormContainer}>
                
                <div style={expandedStyles.inputFieldGroup}>
                  <label style={expandedStyles.inputLabel}>Título breve del trabajo o servicio *</label>
                  <input 
                    type="text" 
                    placeholder="Ej. Se busca plomero para instalar lavabo" 
                    value={publishForm.title}
                    onChange={(e) => setPublishForm({...publishForm, title: e.target.value})}
                    style={expandedStyles.textInput}
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ ...expandedStyles.inputFieldGroup, flex: 1 }}>
                    <label style={expandedStyles.inputLabel}>Categoría *</label>
                    <select 
                      value={publishForm.category}
                      onChange={(e) => setPublishForm({...publishForm, category: e.target.value})}
                      style={expandedStyles.textInput}
                    >
                      {CATEGORIES_LIST.filter(c => c !== 'Todas').map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ ...expandedStyles.inputFieldGroup, flex: 1 }}>
                    <label style={expandedStyles.inputLabel}>Nivel de Urgencia *</label>
                    <select 
                      value={publishForm.urgency}
                      onChange={(e) => setPublishForm({...publishForm, urgency: e.target.value})}
                      style={expandedStyles.textInput}
                    >
                      <option value="Alta">Alta 🔥</option>
                      <option value="Media">Media ⚡</option>
                      <option value="Baja">Baja 🌱</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ ...expandedStyles.inputFieldGroup, flex: 1 }}>
                    <label style={expandedStyles.inputLabel}>Pago Estimado (MXN) *</label>
                    <input 
                      type="number" 
                      placeholder="Ej. 500" 
                      value={publishForm.payAmount}
                      onChange={(e) => setPublishForm({...publishForm, payAmount: e.target.value})}
                      style={expandedStyles.textInput}
                      required
                    />
                  </div>

                  <div style={{ ...expandedStyles.inputFieldGroup, flex: 1 }}>
                    <label style={expandedStyles.inputLabel}>Modalidad de Pago</label>
                    <select 
                      value={publishForm.payType}
                      onChange={(e) => setPublishForm({...publishForm, payType: e.target.value})}
                      style={expandedStyles.textInput}
                    >
                      <option value="Por trabajo">Por trabajo terminado</option>
                      <option value="Por día">Por día completo</option>

                      <option value="Por hora">Por hora</option>
                    </select>
                  </div>
                </div>

                <div style={expandedStyles.inputFieldGroup}>
                  <label style={expandedStyles.inputLabel}>Teléfono / WhatsApp de contacto</label>
                  <input 
                    type="tel" 
                    placeholder="Ej. 2711234567" 
                    value={publishForm.phone}
                    onChange={(e) => setPublishForm({...publishForm, phone: e.target.value})}
                    style={expandedStyles.textInput}
                  />
                </div>

                <div style={expandedStyles.inputFieldGroup}>
                  <label style={expandedStyles.inputLabel}>Descripción detallada *</label>
                  <textarea 
                    rows="4" 
                    placeholder="Explica qué se necesita hacer, herramientas requeridas, dirección aproximada y horarios..." 
                    value={publishForm.description}
                    onChange={(e) => setPublishForm({...publishForm, description: e.target.value})}
                    style={{ ...expandedStyles.textInput, resize: 'vertical' }}
                    required
                  />
                </div>

                <button type="submit" style={expandedStyles.submitPrimaryButton}>
                  🚀 Publicar Chamba en el Radar
                </button>

              </form>

            </div>
          </div>
        )}

        {/* -----------------------------------------------------------------
            PESTAÑA 4: MIS PUBLICACIONES ACTIVAS
            ----------------------------------------------------------------- */}
        {currentTab === 'my-jobs' && (
          <div style={expandedStyles.tabContentContainer}>
            <div style={expandedStyles.sectionCardBox}>
              <h3 style={{ margin: '0 0 10px 0' }}>📂 Mis Publicaciones Activas</h3>
              {jobsList.filter(j => j.isOwner).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#666' }}>
                  <p>Aún no has publicado ningún trabajo.</p>
                  <button onClick={() => setCurrentTab('publish')} style={expandedStyles.smallActionButton}>
                    Publicar mi primera chamba
                  </button>
                </div>
              ) : (
                jobsList.filter(j => j.isOwner).map(myJob => (
                  <div key={myJob.id} style={expandedStyles.myJobRowItem}>
                    <div>
                      <h4 style={{ margin: 0 }}>{myJob.title}</h4>
                      <span style={{ fontSize: '12px', color: '#666' }}>{myJob.pay} • {myJob.applicantsCount} postulados</span>
                    </div>
                    <span style={expandedStyles.activeStatusTag}>Activa</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* -----------------------------------------------------------------
            PESTAÑA 5: PERFIL DE USUARIO Y CONFIGURACIÓN
            ----------------------------------------------------------------- */}
        {currentTab === 'profile' && (
          <div style={expandedStyles.tabContentContainer}>
            <div style={expandedStyles.profileCenterCard}>
              
              <div style={expandedStyles.profileLargeAvatarCircle}>
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                ) : (
                  <span>{(user.displayName || user.email || 'U')[0].toUpperCase()}</span>
                )}
              </div>

              <h3 style={expandedStyles.profileUserNameText}>{user.displayName || 'Usuario de ChambaCerca'}</h3>
              <p style={expandedStyles.profileUserEmailText}>{user.email}</p>

              <div style={expandedStyles.profileStatsRowGrid}>
                <div style={expandedStyles.statGridItem}>
                  <strong style={{ fontSize: '18px', color: '#0070f3' }}>4.9 ★</strong>
                  <span style={expandedStyles.statGridLabel}>Reputación</span>
                </div>
                <div style={expandedStyles.statGridItem}>
                  <strong style={{ fontSize: '18px', color: '#137333' }}>{jobsList.filter(j => j.isOwner).length}</strong>
                  <span style={expandedStyles.statGridLabel}>Publicaciones</span>
                </div>
                <div style={expandedStyles.statGridItem}>
                  <strong style={{ fontSize: '18px', color: '#333' }}>Verificado</strong>
                  <span style={expandedStyles.statGridLabel}>Estado GPS</span>
                </div>
              </div>

              <button onClick={handleSignOutUser} style={expandedStyles.fullWidthLogoutButton}>
                Cerrar Sesión
              </button>

            </div>
          </div>
        )}

      </main>

      {/* -------------------------------------------------------------------
          MODAL DETALLADO DE TRABAJO Y POSTULACIÓN
          ------------------------------------------------------------------- */}
      {selectedJobModal && (
        <div style={expandedStyles.modalOverlayBackground}>
          <div style={expandedStyles.jobModalCardContent}>
            
            <div style={expandedStyles.modalHeaderBar}>
              <span style={expandedStyles.chambaCategoryTag}>{selectedJobModal.category}</span>
              <button onClick={() => setSelectedJobModal(null)} style={expandedStyles.closeModalXButton}>✕</button>
            </div>

            <h2 style={{ fontSize: '18px', margin: '10px 0', color: '#111' }}>{selectedJobModal.title}</h2>
            <p style={{ fontSize: '14px', color: '#444', lineHeight: '1.5' }}>{selectedJobModal.description}</p>

            <div style={expandedStyles.modalPriceHighlightBox}>
              <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#137333' }}>{selectedJobModal.pay}</span>
              <span style={{ fontSize: '13px', color: '#555' }}> Modalidad: {selectedJobModal.payType}</span>
            </div>

            <div style={expandedStyles.modalAuthorInfoBox}>
              <p style={{ margin: '3px 0', fontSize: '13px' }}><strong>Publicado por:</strong> {selectedJobModal.authorName} ({selectedJobModal.authorRating})</p>
              <p style={{ margin: '3px 0', fontSize: '13px' }}><strong>Distancia GPS:</strong> A {selectedJobModal.distanceKm} km de ti</p>
              <p style={{ margin: '3px 0', fontSize: '13px' }}><strong>Teléfono:</strong> {selectedJobModal.authorPhone}</p>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button 
                onClick={() => {
                  showToast(`¡Te has postulado a "${selectedJobModal.title}"! El anunciante recibirá tu perfil.`);
                  setSelectedJobModal(null);
                }}
                style={expandedStyles.submitPrimaryButton}
              >
                ✅ Confirmar Postulación
              </button>
              
              <button 
                onClick={() => {
                  window.open(`https://wa.me/52${selectedJobModal.authorPhone}?text=Hola,%20vi%20tu%20publicación%20en%20ChambaCerca:%20${encodeURIComponent(selectedJobModal.title)}`, '_blank');
                }}
                style={expandedStyles.whatsappActionButton}
              >
                💬 WhatsApp
              </button>
            </div>

          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------
          NAVEGACIÓN FLOTANTE INFERIOR (BOTTOM NAV BAR)
          ------------------------------------------------------------------- */}
      <nav style={expandedStyles.bottomNavigationBar}>
        <button 
          onClick={() => setCurrentTab('feed')} 
          style={{ ...expandedStyles.bottomNavItem, ...(currentTab === 'feed' ? expandedStyles.bottomNavItemActive : {}) }}
        >
          <span style={{ fontSize: '20px' }}>📋</span>
          <span style={expandedStyles.bottomNavLabel}>Novedades</span>
        </button>

        <button 
          onClick={() => setCurrentTab('map')} 
          style={{ ...expandedStyles.bottomNavItem, ...(currentTab === 'map' ? expandedStyles.bottomNavItemActive : {}) }}
        >
          <span style={{ fontSize: '20px' }}>🗺️</span>
          <span style={expandedStyles.bottomNavLabel}>Mapa</span>
        </button>

        <button 
          onClick={() => setCurrentTab('publish')} 
          style={{ ...expandedStyles.bottomNavItem, ...(currentTab === 'publish' ? expandedStyles.bottomNavItemActive : {}) }}
        >
          <span style={{ fontSize: '20px' }}>➕</span>
          <span style={expandedStyles.bottomNavLabel}>Publicar</span>
        </button>

        <button 
          onClick={() => setCurrentTab('my-jobs')} 
          style={{ ...expandedStyles.bottomNavItem, ...(currentTab === 'my-jobs' ? expandedStyles.bottomNavItemActive : {}) }}
        >
          <span style={{ fontSize: '20px' }}>📂</span>
          <span style={expandedStyles.bottomNavLabel}>Mis Chambas</span>
        </button>

        <button 
          onClick={() => setCurrentTab('profile')} 
          style={{ ...expandedStyles.bottomNavItem, ...(currentTab === 'profile' ? expandedStyles.bottomNavItemActive : {}) }}
        >
          <span style={{ fontSize: '20px' }}>👤</span>
          <span style={expandedStyles.bottomNavLabel}>Perfil</span>
        </button>
      </nav>

    </div>
  );
}

// ===========================================================================
// 4. HOJA DE ESTILOS PROFESIONALES COMPLETA Y DENSAMENTE ESTRUCTURADA
// ===========================================================================
const expandedStyles = {
  loadingScreen: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f8f9fa' },
  spinnerIcon: { width: '45px', height: '45px', border: '4px solid #e0e0e0', borderTop: '4px solid #0070f3', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },

  // Auth Styles
  authBackground: { minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4f6f8', padding: '16px', fontFamily: 'system-ui, -apple-system, sans-serif' },
  authContainerBox: { background: '#ffffff', width: '100%', maxWidth: '420px', borderRadius: '20px', padding: '32px', boxShadow: '0 12px 30px rgba(0,0,0,0.08)', border: '1px solid #eaeaea' },
  authBrandHeader: { textAlign: 'center', marginBottom: '24px' },
  authLogoCircle: { width: '60px', height: '60px', background: '#eef6ff', borderRadius: '16px', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', fontSize: '30px', marginBottom: '10px' },
  authTitleText: { fontSize: '26px', fontWeight: '800', color: '#111', margin: 0 },
  authSubtitleText: { fontSize: '14px', color: '#666', marginTop: '6px', lineHeight: '1.4' },
  authForm: { display: 'flex', flexDirection: 'column', gap: '16px' },
  inputFieldGroup: { display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' },
  inputLabel: { fontSize: '13px', fontWeight: '600', color: '#444' },
  textInput: { padding: '12px 14px', fontSize: '15px', borderRadius: '10px', border: '1px solid #ddd', outline: 'none', fontFamily: 'inherit' },
  submitPrimaryButton: { width: '100%', padding: '14px', background: '#0070f3', color: '#ffffff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s' },
  googleSocialButton: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '12px', background: '#ffffff', border: '1px solid #ddd', borderRadius: '10px', fontSize: '14px', fontWeight: '600', color: '#333', cursor: 'pointer' },
  dividerSeparator: { display: 'flex', alignItems: 'center', margin: '20px 0' },
  dividerLineSpan: { flex: 1, height: '1px', background: '#eee' },
  dividerLabelSpan: { padding: '0 12px', fontSize: '12px', color: '#aaa' },
  authErrorBanner: { background: '#ffebee', color: '#c62828', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', marginBottom: '16px', textAlign: 'center' },
  switchModeFooter: { textAlign: 'center', fontSize: '14px', color: '#555', marginTop: '22px' },
  switchModeLinkButton: { background: 'none', border: 'none', color: '#0070f3', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' },

  // App Layout
  appShellLayout: { minHeight: '100vh', backgroundColor: '#f8f9fa', paddingBottom: '75px', fontFamily: 'system-ui, -apple-system, sans-serif' },
  mainTopHeader: { background: '#ffffff', borderBottom: '1px solid #eaeaea', position: 'sticky', top: 0, zIndex: 100, padding: '12px 20px' },
  topHeaderContentWrapper: { maxWidth: '650px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  brandTitleGroup: { display: 'flex', alignItems: 'center', gap: '10px' },
  brandMainTitle: { fontSize: '18px', fontWeight: '800', margin: 0, color: '#111' },
  brandSubTag: { fontSize: '10px', color: '#777', textTransform: 'uppercase', letterSpacing: '0.5px' },
  headerUserActions: { display: 'flex', alignItems: 'center', gap: '10px' },
  gpsStatusBadge: { fontSize: '12px', background: '#f1f3f4', padding: '5px 10px', borderRadius: '15px', fontWeight: '600', color: '#333' },
  headerLogoutButton: { background: '#ffebee', color: '#c62828', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' },
  
  appMainContainer: { maxWidth: '650px', margin: '0 auto', padding: '16px' },
  tabContentContainer: { display: 'flex', flexDirection: 'column', gap: '16px' },

  // Filters & Controls
  radarFilterControlCard: { background: '#ffffff', borderRadius: '14px', padding: '16px', border: '1px solid #eaeaea', display: 'flex', flexDirection: 'column', gap: '14px' },
  searchBarInputWrapper: { display: 'flex', alignItems: 'center', background: '#f5f5f5', borderRadius: '10px', padding: '0 12px', border: '1px solid #e0e0e0' },
  searchInnerInput: { flex: 1, padding: '12px 8px', border: 'none', background: 'transparent', outline: 'none', fontSize: '14px' },
  clearSearchButton: { background: 'none', border: 'none', fontSize: '14px', color: '#888', cursor: 'pointer' },
  horizontalCategoriesScroll: { display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' },
  categoryChipButton: { whiteSpace: 'nowrap', padding: '6px 14px', borderRadius: '20px', border: '1px solid #e0e0e0', background: '#f8f9fa', fontSize: '13px', cursor: 'pointer', color: '#444' },
  categoryChipButtonActive: { background: '#0070f3', color: '#ffffff', borderColor: '#0070f3', fontWeight: 'bold' },
  radarDistanceSliderContainer: { display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '10px', borderTop: '1px solid #f0f0f0' },
  sliderTitleLabel: { fontSize: '12px', color: '#666' },
  sliderValueHighlight: { fontSize: '12px', color: '#111' },
  sliderInputElement: { width: '100%', accentColor: '#0070f3' },
  secondaryFiltersRow: { display: 'flex', gap: '12px' },
  smallFilterLabel: { fontSize: '11px', color: '#666', display: 'block', marginBottom: '4px' },
  filterSelectDropdown: { width: '100%', padding: '8px', fontSize: '12px', borderRadius: '8px', border: '1px solid #ddd', background: '#fff' },

  // Chamba Cards
  jobCardsGridList: { display: 'flex', flexDirection: 'column', gap: '14px' },
  chambaCardArticle: { background: '#ffffff', borderRadius: '14px', padding: '18px', border: '1px solid #eaeaea', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' },
  chambaCardTopBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  chambaCategoryTag: { fontSize: '11px', background: '#eef6ff', color: '#0070f3', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold', textTransform: 'uppercase' },
  chambaUrgencyBadge: { fontSize: '11px', padding: '4px 8px', borderRadius: '6px', fontWeight: '600' },
  chambaCardTitleText: { fontSize: '16px', fontWeight: '700', margin: '6px 0', color: '#111' },
  chambaCardDescriptionText: { fontSize: '14px', color: '#555', lineHeight: '1.4', margin: '0 0 12px 0' },
  chambaPriceRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', background: '#f8f9fa', padding: '10px 12px', borderRadius: '8px' },
  priceAmountText: { fontSize: '18px', fontWeight: 'bold', color: '#137333' },
  priceTypeSubtext: { fontSize: '12px', color: '#666' },
  applicantsCountBadge: { fontSize: '12px', color: '#555', fontWeight: '500' },
  chambaCardFooterMeta: { display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#777', marginBottom: '14px' },
  chambaApplyCardButton: { width: '100%', padding: '12px', background: '#111111', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' },
  emptyResultsStateBox: { textAlign: 'center', padding: '40px 20px', background: '#ffffff', borderRadius: '14px', border: '1px dashed #ddd' },

  // Map
  mapHeaderBanner: { background: '#0070f3', color: '#ffffff', padding: '16px', borderRadius: '12px', marginBottom: '12px' },
  interactiveMapCanvasContainer: { height: '380px', background: '#e5e3df', borderRadius: '14px', position: 'relative', overflow: 'hidden', border: '1px solid #ccc' },
  mapGridCanvasBackground: { width: '100%', height: '100%', position: 'relative', backgroundImage: 'radial-gradient(#bbb 1px, transparent 1px)', backgroundSize: '24px 24px' },
  userCenterGpsPin: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#0070f3', color: '#fff', padding: '8px 14px', borderRadius: '20px', fontWeight: 'bold', fontSize: '13px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', zIndex: 10 },
  userGpsPulseRing: { position: 'absolute', width: '100%', height: '100%', borderRadius: '20px', border: '2px solid #0070f3', animation: 'pulse 1.5s infinite', top: 0, left: 0 },
  userGpsPinLabel: { marginLeft: '4px', fontSize: '11px' },
  jobMapPinBubble: { position: 'absolute', background: '#ffffff', border: '2px solid #137333', padding: '6px 10px', borderRadius: '12px', cursor: 'pointer', fontSize: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' },

  // Forms & Modals
  publishFormCardBox: { background: '#ffffff', borderRadius: '14px', padding: '22px', border: '1px solid #eaeaea' },
  formCardHeader: { marginBottom: '18px' },
  publishFormContainer: { display: 'flex', flexDirection: 'column', gap: '14px' },
  sectionCardBox: { background: '#ffffff', borderRadius: '14px', padding: '20px', border: '1px solid #eaeaea' },
  myJobRowItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f0f0f0' },
  activeStatusTag: { fontSize: '11px', background: '#e6f4ea', color: '#137333', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold' },
  smallActionButton: { background: '#0070f3', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', fontSize: '13px', marginTop: '10px', cursor: 'pointer' },

  // Profile
  profileCenterCard: { background: '#ffffff', borderRadius: '14px', padding: '30px 20px', border: '1px solid #eaeaea', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  profileLargeAvatarCircle: { width: '85px', height: '85px', borderRadius: '50%', background: '#0070f3', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '36px', fontWeight: 'bold', marginBottom: '14px' },
  profileUserNameText: { margin: '0 0 4px 0', fontSize: '20px', color: '#111' },
  profileUserEmailText: { color: '#666', fontSize: '14px', margin: 0 },
  profileStatsRowGrid: { display: 'flex', gap: '16px', margin: '24px 0', width: '100%', justifyContent: 'center' },
  statGridItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#f8f9fa', padding: '14px 18px', borderRadius: '10px', flex: 1 },
  statGridLabel: { fontSize: '11px', color: '#777', marginTop: '4px' },
  fullWidthLogoutButton: { width: '100%', padding: '14px', background: '#ffebee', color: '#c62828', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' },

  // Toast & Modals
  toastFloatingNotification: { position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', background: '#323232', color: '#fff', padding: '12px 24px', borderRadius: '25px', fontSize: '13px', fontWeight: '600', boxShadow: '0 6px 20px rgba(0,0,0,0.2)', zIndex: 1000 },
  modalOverlayBackground: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 200, padding: '20px' },
  jobModalCardContent: { background: '#fff', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto' },
  modalHeaderBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  closeModalXButton: { background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#888' },
  modalPriceHighlightBox: { background: '#e6f4ea', padding: '14px', borderRadius: '10px', margin: '14px 0' },
  modalAuthorInfoBox: { background: '#f8f9fa', padding: '12px', borderRadius: '10px', marginTop: '10px' },
  whatsappActionButton: { flex: 1, padding: '14px', background: '#25D366', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },

  // Bottom Nav
  bottomNavigationBar: { position: 'fixed', bottom: 0, left: 0, right: 0, background: '#ffffff', borderTop: '1px solid #eaeaea', display: 'flex', justifyContent: 'space-around', padding: '10px 0', zIndex: 100 },
  bottomNavItem: { background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#888', cursor: 'pointer', flex: 1 },
  bottomNavItemActive: { color: '#0070f3' },
  bottomNavLabel: { fontSize: '10px', marginTop: '2px', fontWeight: '600' }
};
