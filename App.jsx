import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut 
} from 'firebase/auth';

// Configuración de Firebase recuperada con la nueva clave validada
const firebaseConfig = {
  apiKey: "AIzaSyCpQ3ybA84pHSrD11KrzBeTEl-wRayZ71k",
  authDomain: "chambacerca-ca0c9.firebaseapp.com",
  projectId: "chambacerca-ca0c9",
  storageBucket: "chambacerca-ca0c9.firebasestorage.app",
  messagingSenderId: "256126044044",
  appId: "1:256126044044:web:e87aefa59bb3d8b8c638a9",
  measurementId: "G-SENSF6XZ3L"
};

// Inicialización
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState('');

  // Estados de Ubicación GPS y Filtro de Radar
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('Obteniendo ubicación GPS...');
  const [searchRadius, setSearchRadius] = useState(10); // Rango en kilometros

  // Escuchar estado de autenticación y solicitar GPS al cargar
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocationStatus('Ubicación obtenida correctamente');
        },
        (error) => {
          console.warn("Error de geolocalización:", error);
          setLocationStatus('No se otorgaron permisos de ubicación');
        },
        { enableHighAccuracy: true }
      );
    } else {
      setLocationStatus('Geolocalización no soportada por el navegador');
    }

    return () => unsubscribe();
  }, []);

  // Autenticación por Correo/Contraseña
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      console.error("Error en autenticación:", err);
      setAuthError(err.message);
    }
  };

  // Autenticación con Google
  const handleGoogleSignIn = async () => {
    setAuthError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Error con Google Auth:", err);
      setAuthError(err.message);
    }
  };

  // Cerrar Sesión
  const handleSignOut = () => {
    signOut(auth);
  };

  if (loading) {
    return (
      <div style={styles.centerContainer}>
        <h2>Cargando ChambaCerca...</h2>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>🛠️ ChambaCerca</h1>
        <p>Encuentra o publica trabajos cerca de tu ubicación</p>
      </header>

      {!user ? (
        <main style={styles.card}>
          <h2>{isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}</h2>

          {authError && <p style={styles.errorText}>{authError}</p>}

          <form onSubmit={handleEmailAuth} style={styles.form}>
            <input 
              type="email" 
              placeholder="Correo electrónico" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              style={styles.input}
            />
            <input 
              type="password" 
              placeholder="Contraseña" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              style={styles.input}
            />
            <button type="submit" style={styles.primaryBtn}>
              {isRegistering ? 'Registrarse' : 'Ingresar'}
            </button>
          </form>

          <div style={styles.divider}>o</div>

          <button onClick={handleGoogleSignIn} style={styles.googleBtn}>
            🌐 Continuar con Google
          </button>

          <p style={styles.toggleText}>
            {isRegistering ? '¿Ya tienes una cuenta?' : '¿No tienes cuenta?'}
            <span 
              onClick={() => setIsRegistering(!isRegistering)} 
              style={styles.toggleLink}
            >
              {isRegistering ? ' Inicia sesión aquí' : ' Regístrate aquí'}
            </span>
          </p>
        </main>
      ) : (
        <main style={styles.card}>
          <h2>Bienvenido, {user.displayName || user.email}</h2>
          
          <section style={styles.radarSection}>
            <h3>📡 Filtro de Radar GPS</h3>
            <p><strong>Estado:</strong> {locationStatus}</p>
            {userLocation && (
              <p>📍 Latitud: {userLocation.lat.toFixed(4)}, Longitud: {userLocation.lng.toFixed(4)}</p>
            )}

            <div style={styles.rangeContainer}>
              <label htmlFor="radius">
                <strong>Rango de búsqueda:</strong> {searchRadius} km
              </label>
              <input 
                id="radius"
                type="range" 
                min="1" 
                max="50" 
                value={searchRadius} 
                onChange={(e) => setSearchRadius(Number(e.target.value))}
                style={styles.rangeInput}
              />
            </div>
          </section>

          <button onClick={handleSignOut} style={styles.secondaryBtn}>
            Cerrar Sesión
          </button>
        </main>
      )}
    </div>
  );
}

const styles = {
  container: { fontFamily: 'sans-serif', maxWidth: '500px', margin: '0 auto', padding: '20px', textAlign: 'center' },
  centerContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif' },
  header: { marginBottom: '20px' },
  card: { background: '#f9f9f9', border: '1px solid #ddd', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' },
  form: { display: 'flex', flexDirection: 'column', gap: '10px' },
  input: { padding: '10px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ccc' },
  primaryBtn: { padding: '12px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' },
  secondaryBtn: { padding: '10px 15px', background: '#e00', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '15px' },
  googleBtn: { padding: '12px', background: '#fff', color: '#333', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', width: '100%' },
  divider: { margin: '15px 0', color: '#888' },
  errorText: { color: 'red', fontSize: '14px' },
  toggleText: { marginTop: '15px', fontSize: '14px' },
  toggleLink: { color: '#0070f3', cursor: 'pointer', fontWeight: 'bold' },
  radarSection: { marginTop: '20px', textAlign: 'left', background: '#fff', padding: '15px', borderRadius: '6px', border: '1px solid #eee' },
  rangeContainer: { marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '5px' },
  rangeInput: { width: '100%' }
};
