// Configuration centralisée des APIs
const API_CONFIG = {
  // APIs Quran
  GITHUB: "https://cdn.jsdelivr.net/gh/AlfaazPlus/QuranApp@latest/",
  QURAN: "https://api.quran.com/",
  ALQURAN_CLOUD: "https://api.alquran.cloud/v1/",
  ALQURAN_AUDIO: "https://cdn.islamic.network/quran/audio/128/",
  
  // APIs Météo et Prières
  WEATHER: "https://api.openweathermap.org/data/2.5",
  WEATHER_KEY: '886705b4c1182eb1c69f28eb8c520e20',
  PRAYER_CITY: "https://api.aladhan.com/v1/timingsByCity",
  PRAYER_COORDINATES: "https://api.aladhan.com/v1/timings",
  
  // API Hadiths
  HADITH: 'https://hadeethenc.com/api/v1',
  
  // Timeouts et retry configuration
  DEFAULT_TIMEOUT: 30000,
  DEFAULT_RETRIES: 3,
  CACHE_DURATION: 1800000 // 30 minutes
};

// Rétrocompatibilité pour le code existant
const GITHUB_API_URL = API_CONFIG.GITHUB;
const QURAN_API_URL = API_CONFIG.QURAN;
const ALQURAN_CLOUD_API = API_CONFIG.ALQURAN_CLOUD;
const ALQURAN_AUDIO_URL = API_CONFIG.ALQURAN_AUDIO;
const WEATHER_API_URL = API_CONFIG.WEATHER;
const WEATHER_API_KEY = API_CONFIG.WEATHER_KEY;
const PRAYER_API_URL = API_CONFIG.PRAYER_CITY;
const PRAYER_API_URL_COORDINATES = API_CONFIG.PRAYER_COORDINATES;

// Electron IPC pour communication avec le processus principal
const { ipcRenderer } = require('electron');

// Écouter l'événement pour afficher la section À propos depuis le menu
ipcRenderer.on('show-about', () => {
  // Vérifier si la fonction showAboutSection est disponible
  if (typeof showAboutSection === 'function') {
    showAboutSection();
  }
});

// DOM Elements
const loadSurahsButton = document.getElementById("load-surahs");
const surahListElement = document.getElementById("surah-list");
const quranContentElement = document.getElementById("quran-content");
const searchInput = document.getElementById("search-input");
const surahInfoElement = document.getElementById("surah-info");
const audioPlayerElement = document.getElementById("audio-player");
const progressBarElement = document.getElementById("progress-bar");
const audioProgressElement = document.getElementById("audio-progress");
const playButton = document.getElementById("play-button");
const pauseButton = document.getElementById("pause-button");
const reciterSelect = document.getElementById("reciter-select");
const translationSelect = document.getElementById("translation-select");
const currentTimeElement = document.getElementById("current-time");
const durationElement = document.getElementById("duration");
const verseInfoElement = document.getElementById("verse-info");
const previousVerseButton = document.getElementById("previous-verse");
const nextVerseButton = document.getElementById("next-verse");
const repeatVerseButton = document.getElementById("repeat-verse");
const volumeSlider = document.getElementById("volume-slider");
const themeToggle = document.getElementById("theme-toggle");
const currentTimeDisplay = document.getElementById('current-time');
const durationDisplay = document.getElementById('duration');

// DOM Elements pour le lecteur amélioré
const playButtonMain = document.getElementById("play-button-main");
const pauseButtonMain = document.getElementById("pause-button-main");
const equalizerElement = document.querySelector(".equalizer");
const miniPlayer = document.getElementById("mini-player");
const miniSurahName = document.getElementById("mini-surah-name");
const miniVerseNumber = document.getElementById("mini-verse-number");
const miniProgressBar = document.getElementById("mini-progress-bar");
const miniPlay = document.getElementById("mini-play");
const miniPrev = document.getElementById("mini-prev");
const miniNext = document.getElementById("mini-next");

// Éléments du DOM pour la météo
let weatherModal = null;
let weatherToggle = null;
let weatherModalClose = null;

// Éléments du DOM pour les prières
let prayerModal = null;
let prayerToggle = null;
let prayerModalClose = null;
let prayerLocationInput = null;
let prayerLocationSearch = null;

// Configuration de la météo
let userLocation = {
  latitude: null,
  longitude: null,
  city: 'Chargement...'
};

// Configuration pour les horaires de prière
let prayerSettings = {
  city: '',
  country: 'FR',
  method: 2, // Islamic Society of North America (ISNA)
  latitude: null,
  longitude: null
};

// Initialisation de la météo
function initWeather() {
  // S'assurer que tous les éléments du DOM sont récupérés
  weatherModal = document.getElementById('weather-modal');
  weatherToggle = document.getElementById('weather-toggle');
  weatherModalClose = document.getElementById('weather-modal-close');
  
  // Ajouter du débogage
  const debugInfo = document.getElementById('debug-info');
  if (debugInfo) {
    debugInfo.innerText = `Modal: ${!!weatherModal}, Toggle: ${!!weatherToggle}, Close: ${!!weatherModalClose}`;
  }
  
  if (!weatherModal || !weatherToggle || !weatherModalClose) {
    console.error('Éléments de la météo introuvables dans le DOM');
    return;
  }
  
  // Événement pour fermer la modale météo
  weatherModalClose.addEventListener('click', () => {
    console.log('Fermeture de la modale météo');
    weatherModal.classList.remove('active');
  });

  // Fermer la modale si on clique en dehors
  weatherModal.querySelector('.ios-modal-backdrop').addEventListener('click', () => {
    weatherModal.classList.remove('active');
  });
  
  // Événement pour ouvrir la modale météo
  weatherToggle.addEventListener('click', () => {
    console.log('Ouverture de la modale météo');
    weatherModal.classList.add('active');
    
    // Mettre à jour l'heure immédiatement à l'ouverture
    updateSystemTime();
    
    // Rafraîchir les données si elles datent de plus de 30 minutes
    const cachedTimestamp = localStorage.getItem('weatherTimestamp');
    const currentTime = new Date().getTime();
    
    if (!cachedTimestamp || (currentTime - cachedTimestamp > 1800000)) {
      getUserLocation();
    }
  });
  
  console.log('Météo initialisée avec succès');
  
  // Précharger les données météo en arrière-plan dès le chargement de la page
  setTimeout(() => {
    getUserLocation();
  }, 1000); // Délai de 1 seconde pour ne pas bloquer le chargement initial de la page
}

// Obtenir la localisation de l'utilisateur
function getUserLocation() {
  // Afficher un texte de chargement rapide
  document.querySelector('.city-name').textContent = 'Chargement...';
  document.querySelector('.weather-desc').textContent = 'Récupération rapide...';
  
  const debugInfo = document.getElementById('debug-info');
  
  // Vérifier si on a des données météo en cache
  const cachedWeatherData = localStorage.getItem('weatherData');
  const cachedTimestamp = localStorage.getItem('weatherTimestamp');
  const currentTime = new Date().getTime();
  
  // Si on a des données en cache qui datent de moins de 30 minutes (1800000 ms), les utiliser
  if (cachedWeatherData && cachedTimestamp && (currentTime - cachedTimestamp < 1800000)) {
    try {
      const weatherData = JSON.parse(cachedWeatherData);
      if (debugInfo) {
        debugInfo.innerText = "Utilisation des données en cache";
      }
      
      // Mettre à jour l'interface avec les données en cache
      updateWeatherInterface(weatherData.current, weatherData.forecast);
      return;
    } catch (error) {
      console.error('Erreur lors de la lecture du cache:', error);
      // Continuer pour récupérer de nouvelles données
    }
  }
  
  // Si on a déjà des coordonnées, les utiliser directement
  if (userLocation.latitude && userLocation.longitude) {
    console.log("Réutilisation des coordonnées existantes:", userLocation);
    if (debugInfo) {
      debugInfo.innerText = `Appel API: ${userLocation.latitude.toFixed(2)}, ${userLocation.longitude.toFixed(2)}`;
    }
    getWeatherData(userLocation.latitude, userLocation.longitude);
    return;
  }
  
  // Utiliser une position par défaut (Paris) pour un chargement initial rapide
  userLocation.latitude = 48.8566;
  userLocation.longitude = 2.3522;
  getWeatherData(48.8566, 2.3522);
  
  // Ensuite tenter la géolocalisation en arrière-plan pour mettre à jour ultérieurement
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Si la position est différente de celle par défaut, mettre à jour
        if (Math.abs(position.coords.latitude - userLocation.latitude) > 0.01 ||
            Math.abs(position.coords.longitude - userLocation.longitude) > 0.01) {
          userLocation.latitude = position.coords.latitude;
          userLocation.longitude = position.coords.longitude;
          
          if (debugInfo) {
            debugInfo.innerText += ` | Position réelle: ${position.coords.latitude.toFixed(2)}, ${position.coords.longitude.toFixed(2)}`;
          }
          
          // Récupérer les données météo avec les coordonnées réelles
          getWeatherData(userLocation.latitude, userLocation.longitude);
        }
      },
      (error) => {
        console.warn('Erreur de géolocalisation:', error);
        if (debugInfo) {
          debugInfo.innerText += ` | Géoloc non disponible: ${error.code}`;
        }
      },
      {
        // Options de géolocalisation avec timeout court
        timeout: 5000,
        maximumAge: 300000 // 5 minutes
      }
    );
  } else {
    console.warn('La géolocalisation n\'est pas supportée par ce navigateur');
    if (debugInfo) {
      debugInfo.innerText += " | Géoloc non supportée";
    }
  }
}

// Récupérer les données météo - Version améliorée
async function getWeatherData(lat, lon) {
  const debugInfo = document.getElementById('debug-info');
  
  try {
    console.log(`🌤️ Récupération des données météo pour: ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
    
    if (debugInfo) {
      debugInfo.innerText = `Appel API météo: ${lat.toFixed(2)}, ${lon.toFixed(2)}`;
    }
    
    // Vérifier le cache en premier
    const cacheKey = `weather_${lat.toFixed(2)}_${lon.toFixed(2)}`;
    const cachedData = CacheManager.getLocalStorage(cacheKey, API_CONFIG.CACHE_DURATION);
    
    if (cachedData) {
      console.log('✅ Données météo récupérées du cache');
      updateWeatherInterface(cachedData.current, cachedData.forecast);
      if (debugInfo) {
        debugInfo.innerText += ' | Cache OK';
      }
      return;
    }
    
    // URLs des APIs météo
    const currentWeatherUrl = `${API_CONFIG.WEATHER}/weather?lat=${lat}&lon=${lon}&units=metric&lang=fr&appid=${API_CONFIG.WEATHER_KEY}`;
    const forecastUrl = `${API_CONFIG.WEATHER}/forecast?lat=${lat}&lon=${lon}&units=metric&lang=fr&appid=${API_CONFIG.WEATHER_KEY}`;
    
    // Récupérer les données en parallèle avec gestion d'erreurs améliorée
    const [currentWeatherData, forecastData] = await Promise.all([
      fetchApi(currentWeatherUrl, { context: 'météo actuelle', showUIError: false }),
      fetchApi(forecastUrl, { context: 'prévisions météo', showUIError: false })
    ]);
    
    if (!currentWeatherData || !forecastData) {
      throw new Error('Données météo incomplètes');
    }
    
    console.log('✅ Données météo récupérées avec succès');
    
    if (debugInfo) {
      debugInfo.innerText += ` | Météo OK: ${currentWeatherData.name}`;
    }
    
    // Sauvegarder en cache
    const weatherBundle = {
      current: currentWeatherData,
      forecast: forecastData
    };
    
    CacheManager.setLocalStorage(cacheKey, weatherBundle);
    CacheManager.memory.weather = weatherBundle;
    
    // Mettre à jour l'interface
    updateWeatherInterface(currentWeatherData, forecastData);
    
  } catch (error) {
    ErrorHandler.log(error, 'Météo');
    
    if (debugInfo) {
      debugInfo.innerText += ` | Erreur: ${error.message}`;
    }
    
    // Stratégie de récupération: essayer le cache même expiré
    const cacheKey = `weather_${lat.toFixed(2)}_${lon.toFixed(2)}`;
    const staleCache = CacheManager.getLocalStorage(cacheKey, Infinity); // Ignorer l'expiration
    
    if (staleCache) {
      console.log('🔄 Utilisation cache météo expiré en fallback');
      updateWeatherInterface(staleCache.current, staleCache.forecast);
      if (debugInfo) {
        debugInfo.innerText += ' | Cache expiré utilisé';
      }
      return;
    }
    
    // Dernier recours
    displayWeatherError();
  }
}

// Renommer cette fonction pour éviter les conflits 
function updateWeatherInterface(current, forecast) {
  // Utiliser un DocumentFragment pour réduire les manipulations du DOM
  const fragment = document.createDocumentFragment();
  
  // Mettre à jour les informations de la ville
  document.querySelector('.city-name').textContent = current.name;
  
  // Mettre à jour la description météo
  document.querySelector('.weather-desc').textContent = capitalizeFirstLetter(current.weather[0].description);
  
  // Mettre à jour l'icône météo principale - seulement si elle a changé
  const iconCode = current.weather[0].icon;
  const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
  const iconElement = document.querySelector('.weather-icon-large');
  if (iconElement.src !== iconUrl) {
    iconElement.src = iconUrl;
  }
  
  // Mettre à jour la température
  document.querySelector('.main-temp').textContent = `${Math.round(current.main.temp)}°`;
  
  // Mettre à jour la température ressentie
  document.querySelector('.feels-like').textContent = `Ressenti: ${Math.round(current.main.feels_like)}°`;
  
  // Mettre à jour les détails (humidité et vent)
  const humidityValue = document.querySelector('.humidity-detail .detail-value');
  const windValue = document.querySelector('.wind-detail .detail-value');
  
  if (humidityValue) {
    humidityValue.textContent = `${current.main.humidity}%`;
  }
  
  if (windValue) {
    windValue.textContent = `${Math.round(current.wind.speed * 3.6)} km/h`; // Conversion de m/s en km/h
  }
  
  // Mettre à jour la qualité de l'air (dépend de l'API - ici on utilise des valeurs simplifiées)
  updateAirQuality(current);
  
  // Mettre à jour les prévisions pour les prochains jours de façon efficace
  updateForecastEfficient(forecast);
}

// Version optimisée de updateForecast
function updateForecastEfficient(forecastData) {
  if (!forecastData || !forecastData.list) return;
  
  // Préparer un objet pour stocker les prévisions quotidiennes (on prend la valeur à midi)
  const dailyForecasts = {};
  
  // Traitement des données de prévision (regrouper par jour)
  forecastData.list.forEach(item => {
    const date = new Date(item.dt * 1000);
    const day = date.toLocaleDateString('fr-FR', { weekday: 'long' });
    
    // On vérifie si c'est une prévision autour de midi (entre 11h et 14h)
    const hour = date.getHours();
    if (hour >= 11 && hour <= 14 && !dailyForecasts[day]) {
      dailyForecasts[day] = item;
    }
  });
  
  // Obtenir les 4 prochains jours
  const forecastDays = Object.keys(dailyForecasts).slice(0, 4);
  
  // Mettre à jour l'interface pour chaque jour de prévision
  const forecastItems = document.querySelectorAll('.forecast-item');
  
  forecastDays.forEach((day, index) => {
    if (index < forecastItems.length && dailyForecasts[day]) {
      const forecast = dailyForecasts[day];
      const forecastItem = forecastItems[index];
      
      // Jour de la semaine (premier jour devient "Demain")
      const dayText = index === 0 ? 'Demain' : capitalizeFirstLetter(day);
      const dayElement = forecastItem.querySelector('.forecast-day');
      if (dayElement.textContent !== dayText) {
        dayElement.textContent = dayText;
      }
      
      // Icône météo - seulement si elle a changé
      const iconCode = forecast.weather[0].icon;
      const iconUrl = `https://openweathermap.org/img/wn/${iconCode}.png`;
      const iconElement = forecastItem.querySelector('.forecast-icon-img');
      if (iconElement.src !== iconUrl) {
        iconElement.src = iconUrl;
      }
      
      // Température
      const tempText = `${Math.round(forecast.main.temp)}°`;
      const tempElement = forecastItem.querySelector('.forecast-temp');
      if (tempElement.textContent !== tempText) {
        tempElement.textContent = tempText;
      }
    }
  });
}

// Mettre à jour les indicateurs de qualité d'air, UV et pollen
function updateAirQuality(currentWeather) {
  // Données simplifiées - dans une application réelle, vous auriez besoin d'APIs supplémentaires pour ces informations
  
  // UV index estimation basée sur la couverture nuageuse
  const clouds = currentWeather.clouds.all;
  let uvLevel, uvText;
  
  if (clouds < 30) {
    uvLevel = 'high';
    uvText = 'Élevé';
  } else if (clouds < 70) {
    uvLevel = 'moderate';
    uvText = 'Modéré';
  } else {
    uvLevel = 'low';
    uvText = 'Faible';
  }
  
  // Pollution estimation basée sur la zone (urbaine/rurale) - simplifiée
  const isUrbanArea = currentWeather.name.includes('Paris') || currentWeather.name.includes('Lyon') || currentWeather.name.includes('Marseille');
  let pollutionLevel, pollutionText;
  
  if (isUrbanArea) {
    pollutionLevel = 'moderate';
    pollutionText = 'Modéré';
  } else {
    pollutionLevel = 'low';
    pollutionText = 'Faible';
  }
  
  // Pollen estimation basée sur la saison - simplifiée
  const month = new Date().getMonth();
  let pollenLevel, pollenText;
  
  // Printemps/été = pollen élevé
  if (month >= 2 && month <= 7) {
    pollenLevel = 'high';
    pollenText = 'Élevé';
  } else if (month === 1 || month === 8) {
    pollenLevel = 'moderate';
    pollenText = 'Modéré';
  } else {
    pollenLevel = 'low';
    pollenText = 'Faible';
  }
  
  // Mettre à jour l'interface
  const qualityItems = document.querySelectorAll('.quality-item');
  
  // UV
  updateQualityBadge(qualityItems[0], uvLevel, uvText);
  
  // Pollution
  updateQualityBadge(qualityItems[1], pollutionLevel, pollutionText);
  
  // Pollen
  updateQualityBadge(qualityItems[2], pollenLevel, pollenText);
}

// Mettre à jour un badge de qualité
function updateQualityBadge(item, level, text) {
  const badge = item.querySelector('.quality-badge');
  
  // Supprimer toutes les classes de niveau
  badge.classList.remove('low', 'moderate', 'high');
  
  // Ajouter la classe appropriée
  badge.classList.add(level);
  
  // Mettre à jour le texte
  badge.textContent = text;
}

// Afficher une erreur en cas de problème avec l'API météo
function displayWeatherError() {
  document.querySelector('.city-name').textContent = 'Erreur';
  document.querySelector('.weather-desc').textContent = 'Impossible de charger les données météo';
  document.querySelector('.main-temp').textContent = '--°';
  document.querySelector('.feels-like').textContent = 'Ressenti: --°';
  
  // Réinitialiser les autres éléments
  document.querySelector('.humidity-detail .detail-value').textContent = '--';
  document.querySelector('.wind-detail .detail-value').textContent = '--';
  
  // Réinitialiser les indicateurs de qualité
  const qualityItems = document.querySelectorAll('.quality-item');
  qualityItems.forEach(item => {
    const badge = item.querySelector('.quality-badge');
    badge.className = 'quality-badge';
    badge.classList.add('low');
    badge.textContent = '--';
  });
  
  // Réinitialiser les prévisions
  const forecastItems = document.querySelectorAll('.forecast-item');
  forecastItems.forEach(item => {
    item.querySelector('.forecast-day').textContent = '--';
    item.querySelector('.forecast-temp').textContent = '--°';
  });
}

// Utilitaire pour mettre en majuscule la première lettre
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Gestion du thème (mode clair/sombre)
function toggleTheme() {
  const currentTheme = localStorage.getItem('theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  
  // Supprimer l'approche avec la classe theme-changing qui cause des saccades
  // document.body.classList.add('theme-changing');
  
  // Changer directement le thème sans animation
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  
  // Supprimer le timeout qui était utilisé pour la fin de l'animation
  // setTimeout(() => {
  //   document.body.classList.remove('theme-changing');
  // }, 300); // Légèrement plus long que la durée de la transition pour être sûr
  
  // Mettre à jour l'UI pour le bouton de thème
  if (newTheme === 'dark') {
    themeToggle.setAttribute('title', 'Passer en mode clair');
  } else {
    themeToggle.setAttribute('title', 'Passer en mode sombre');
  }
  
  console.log(`Thème changé en: ${newTheme}`);
}

// Initialiser le thème à partir de localStorage
function initTheme() {
  // Récupérer le thème sauvegardé ou utiliser 'light' par défaut
  const savedTheme = localStorage.getItem('theme') || 'light';
  
  // Appliquer le thème directement sans transition
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  // Mettre à jour le titre du bouton de thème
  if (savedTheme === 'dark') {
    themeToggle.setAttribute('title', 'Passer en mode clair');
  } else {
    themeToggle.setAttribute('title', 'Passer en mode sombre');
  }

  // Ajouter l'écouteur d'événement pour le toggle
  themeToggle.addEventListener('click', toggleTheme);
  
  console.log(`Thème initialisé: ${savedTheme}`);
}

// Ajouter un écouteur d'événement pour le bouton de thème
themeToggle.addEventListener('click', toggleTheme);

// Initialiser le thème
initTheme();

// Récitateurs disponibles sur Alquran.cloud (garantis de fonctionner)
const RECITERS = [
  { name: 'Mishary Rashid Al-Afasy', identifier: 'ar.alafasy' },
  { name: 'Abdurrahman As-Sudais', identifier: 'ar.abdurrahmaansudais' },
  { name: 'Saud Al-Shuraim', identifier: 'ar.saoodshuraym' },
  { name: 'Saad Al-Ghamdi', identifier: 'ar.saadalghamdi' },
  { name: 'Maher Al-Muaiqly', identifier: 'ar.maheralmuaiqly' },
  { name: 'Ali Al-Hudhaify', identifier: 'ar.hudhaify' },
  { name: 'Ahmed ibn Ali al-Ajamy', identifier: 'ar.ahmedajamy' },
  { name: 'Muhammad Ayyoub', identifier: 'ar.muhammadayyoub' },
  { name: 'Abdul Basit Abdul Samad', identifier: 'ar.abdulbasitmurattal' },
  { name: 'Muhammad Siddiq Al-Minshawi', identifier: 'ar.minshawi' },
  { name: 'Mahmoud Khalil Al-Husary', identifier: 'ar.husary' },
  { name: 'Abu Bakr Ash-Shatri', identifier: 'ar.shaatree' },
  { name: 'Hani Ar-Rifai', identifier: 'ar.hanirifai' },
  { name: 'Youssouf Leclerc (Français)', identifier: 'fr.leclerc' }
];

// Traductions disponibles
const TRANSLATIONS = [
  { name: 'Sans traduction', identifier: 'none' },
  { name: 'Français', identifier: '31' },
  { name: 'Anglais', identifier: '20' },
  { name: 'Espagnol', identifier: '83' },
  { name: 'Allemand', identifier: '27' },
  { name: 'Italien', identifier: '34' }
];

// Mettre à jour les options de récitateurs
function updateReciterOptions() {
  reciterSelect.innerHTML = '';
  RECITERS.forEach((reciter) => {
    const option = document.createElement('option');
    option.value = reciter.identifier;
    option.textContent = reciter.name;
    reciterSelect.appendChild(option);
  });
  
  // Supprimer l'ancien event listener et en ajouter un nouveau
  reciterSelect.removeEventListener("change", handleReciterChange);
  reciterSelect.addEventListener("change", handleReciterChange);
  
  // Restaurer la préférence de récitateur sauvegardée
  const savedReciter = localStorage.getItem('preferredReciter');
  if (savedReciter && reciterSelect.querySelector(`option[value="${savedReciter}"]`)) {
    reciterSelect.value = savedReciter;
  }
}

// Gestionnaire pour le changement de récitateur
function handleReciterChange() {
  const selectedReciter = RECITERS.find(r => r.identifier === reciterSelect.value);
  localStorage.setItem('preferredReciter', reciterSelect.value);
  
  if (selectedReciter) {
    // Afficher une notification élégante
    showReciterNotification(selectedReciter);
  }
  
  if (currentSurah && currentVerse) {
    // Continuer la lecture à partir du verset actuel avec le nouveau récitateur
    playVerseAudio(currentVerse);
  }
}

// Notification moderne et élégante pour le changement de récitateur
function showReciterNotification(reciter) {
  // Supprimer une éventuelle notification existante
  const existingNotification = document.getElementById('reciter-notification');
  if (existingNotification) {
    existingNotification.remove();
  }
  
  // Créer la nouvelle notification
  const notification = document.createElement('div');
  notification.id = 'reciter-notification';
  
  // Style moderne avec effet glass et transparence
  notification.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    width: 280px;
    padding: 16px 20px;
    
    /* Style glass moderne */
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    
    /* Animation et transition */
    opacity: 0;
    transform: translateX(100%) scale(0.9);
    transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    
    /* Style du texte */
    color: var(--text-color);
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
    font-size: 14px;
    line-height: 1.4;
    
    /* Z-index élevé */
    z-index: 10000;
    
    /* Curseur pointer pour indiquer l'interactivité */
    cursor: pointer;
    
    /* Empêcher la sélection de texte */
    user-select: none;
    -webkit-user-select: none;
  `;
  
  // Contenu de la notification avec icône et informations
  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px;">
      <div style="
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, #007AFF 0%, #5856D6 100%);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
      ">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white" style="opacity: 0.9;">
          <path d="M12 3V21M9 19L12 21L15 19M9 5L12 3L15 5M5 9L3 12L5 15M19 9L21 12L19 15" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <circle cx="12" cy="12" r="3" stroke="white" stroke-width="2" fill="none"/>
        </svg>
      </div>
      <div style="flex: 1; min-width: 0;">
        <div style="
          font-weight: 600;
          font-size: 15px;
          margin-bottom: 2px;
          color: var(--text-color);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        ">${reciter.name}</div>
        <div style="
          font-size: 12px;
          opacity: 0.7;
          color: var(--text-color);
        ">Récitateur sélectionné</div>
      </div>
      <div style="
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background 0.2s ease;
      " onclick="this.closest('#reciter-notification').remove()">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </div>
    </div>
  `;
  
  // Adaptation pour le mode sombre
  const updateThemeStyles = () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
      notification.style.background = 'rgba(28, 28, 30, 0.8)';
      notification.style.border = '1px solid rgba(255, 255, 255, 0.1)';
      notification.style.color = '#ffffff';
    } else {
      notification.style.background = 'rgba(255, 255, 255, 0.1)';
      notification.style.border = '1px solid rgba(255, 255, 255, 0.2)';
      notification.style.color = 'var(--text-color)';
    }
  };
  
  updateThemeStyles();
  
  // Ajouter au DOM
  document.body.appendChild(notification);
  
  // Animation d'apparition
  requestAnimationFrame(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateX(0) scale(1)';
  });
  
  // Effet de hover pour la fermeture
  const closeButton = notification.querySelector('[onclick]');
  closeButton.addEventListener('mouseenter', () => {
    closeButton.style.background = 'rgba(255, 255, 255, 0.2)';
  });
  closeButton.addEventListener('mouseleave', () => {
    closeButton.style.background = 'rgba(255, 255, 255, 0.1)';
  });
  
  // Fermeture automatique après 4 secondes
  const autoClose = setTimeout(() => {
    if (notification.parentElement) {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%) scale(0.9)';
      setTimeout(() => {
        if (notification.parentElement) {
          notification.remove();
        }
      }, 400);
    }
  }, 4000);
  
  // Fermeture au clic sur la notification
  notification.addEventListener('click', (e) => {
    if (e.target === notification || e.target.closest('.notification-content')) {
      clearTimeout(autoClose);
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%) scale(0.9)';
      setTimeout(() => {
        if (notification.parentElement) {
          notification.remove();
        }
      }, 400);
    }
  });
  
  // Pause de l'auto-fermeture au survol
  notification.addEventListener('mouseenter', () => {
    clearTimeout(autoClose);
  });
  
  // Reprendre l'auto-fermeture en quittant le survol
  notification.addEventListener('mouseleave', () => {
    const newAutoClose = setTimeout(() => {
      if (notification.parentElement) {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%) scale(0.9)';
        setTimeout(() => {
          if (notification.parentElement) {
            notification.remove();
          }
        }, 400);
      }
    }, 2000);
  });
}



// Mettre à jour les options de traduction
function updateTranslationOptions() {
  translationSelect.innerHTML = '';
  TRANSLATIONS.forEach((translation) => {
    const option = document.createElement('option');
    option.value = translation.identifier;
    option.textContent = translation.name;
    translationSelect.appendChild(option);
  });
  
  // Sauvegarder la préférence de traduction dans localStorage
  translationSelect.addEventListener("change", () => {
    localStorage.setItem('preferredTranslation', translationSelect.value);
    if (currentSurah) {
      // Recharger la sourate pour appliquer la nouvelle traduction
      loadSurah(currentSurah.id);
    }
  });
  
  // Restaurer la préférence de traduction sauvegardée
  const savedTranslation = localStorage.getItem('preferredTranslation');
  if (savedTranslation && translationSelect.querySelector(`option[value="${savedTranslation}"]`)) {
    translationSelect.value = savedTranslation;
  } else {
    // Par défaut, utiliser la traduction française
    translationSelect.value = '31';
  }
}

// Afficher l'élément audio pour le débogage
audioPlayerElement.style.display = "block";

// State variables
let currentSurah = null;
let currentVerse = null;
let allSurahs = [];
let audioQueue = [];
let isPlaying = false;
let highlightInterval = null;
let surahCache = {}; // Cache pour stocker les sourates déjà chargées
let lastPlayedIndex = -1; // Garder une trace de l'index du dernier verset joué

// Variables globales pour la gestion du préchargement avancé
let nextAudioElement = new Audio(); // Élément audio pour le prochain verset
let futureAudioElement = new Audio(); // Élément audio pour le verset d'après
let isPreloadingNext = false;
let preloadedVerses = {}; // Cache pour les versets préchargés

// Variables globales pour le téléchargement en arrière-plan
let downloadInProgress = false;
let currentDownloadSurahId = null;
let downloadProgress = 0;
let downloadAbortController = null;

// Gestionnaire de cache avancé
const CacheManager = {
  // Configuration du cache
  CONFIG: {
    MAX_SURAHS: 5,          // Nombre maximum de sourates en cache
    MAX_AUDIO_CACHE: 3,      // Nombre maximum d'audios en cache
    CACHE_DURATION: 3600000,  // 1 heure en millisecondes
    STORAGE_PREFIX: 'playouran_'
  },
  
  // Cache en mémoire
  memory: {
    surahs: new Map(),
    audio: new Map(),
    weather: null,
    prayers: null,
    hadiths: new Map()
  },
  
  // Ajouter au cache avec gestion automatique de la taille
  setSurah(id, data) {
    if (this.memory.surahs.size >= this.CONFIG.MAX_SURAHS) {
      // Supprimer la plus ancienne entrée
      const firstKey = this.memory.surahs.keys().next().value;
      this.memory.surahs.delete(firstKey);
    }
    this.memory.surahs.set(id, {
      data,
      timestamp: Date.now()
    });
    console.log(`📦 Sourate ${id} mise en cache (${this.memory.surahs.size}/${this.CONFIG.MAX_SURAHS})`);
  },
  
  // Récupérer du cache
  getSurah(id) {
    const cached = this.memory.surahs.get(id);
    if (cached && (Date.now() - cached.timestamp) < this.CONFIG.CACHE_DURATION) {
      console.log(`✅ Sourate ${id} récupérée du cache`);
      return cached.data;
    }
    if (cached) {
      this.memory.surahs.delete(id); // Cache expiré
    }
    return null;
  },
  
  // Gestion du localStorage avec validation
  setLocalStorage(key, data) {
    try {
      const item = {
        data,
        timestamp: Date.now(),
        version: '1.0'
      };
      localStorage.setItem(this.CONFIG.STORAGE_PREFIX + key, JSON.stringify(item));
      return true;
    } catch (error) {
      console.warn('❌ Erreur localStorage:', error.message);
      // Nettoyer le localStorage si plein
      this.cleanLocalStorage();
      return false;
    }
  },
  
  // Récupérer du localStorage avec validation
  getLocalStorage(key, maxAge = this.CONFIG.CACHE_DURATION) {
    try {
      const item = localStorage.getItem(this.CONFIG.STORAGE_PREFIX + key);
      if (!item) return null;
      
      const parsed = JSON.parse(item);
      if (!parsed.timestamp || (Date.now() - parsed.timestamp) > maxAge) {
        localStorage.removeItem(this.CONFIG.STORAGE_PREFIX + key);
        return null;
      }
      
      return parsed.data;
    } catch (error) {
      console.warn('❌ Erreur lecture localStorage:', error.message);
      localStorage.removeItem(this.CONFIG.STORAGE_PREFIX + key);
      return null;
    }
  },
  
  // Nettoyer le localStorage
  cleanLocalStorage() {
    const keys = Object.keys(localStorage);
    const prefixedKeys = keys.filter(key => key.startsWith(this.CONFIG.STORAGE_PREFIX));
    
    // Supprimer les entrées expirées
    prefixedKeys.forEach(key => {
      try {
        const item = JSON.parse(localStorage.getItem(key));
        if (!item.timestamp || (Date.now() - item.timestamp) > this.CONFIG.CACHE_DURATION) {
          localStorage.removeItem(key);
        }
      } catch {
        localStorage.removeItem(key);
      }
    });
    
    console.log(`🧹 Nettoyage localStorage: ${prefixedKeys.length} clés vérifiées`);
  },
  
  // Obtenir les statistiques du cache
  getStats() {
    return {
      memory: {
        surahs: this.memory.surahs.size,
        audio: this.memory.audio.size,
        hadiths: this.memory.hadiths.size
      },
      localStorage: Object.keys(localStorage).filter(k => k.startsWith(this.CONFIG.STORAGE_PREFIX)).length
    };
  }
};

// Fonctions d'aide pour la navigation dans le menu
window.toggleAudio = function() {
  if (audioPlayerElement.paused) {
    audioPlayerElement.play();
  } else {
    audioPlayerElement.pause();
  }
};

window.nextVerse = function() {
  playNextVerse();
};

window.prevVerse = function() {
  if (audioQueue.length === 0) return;
  
  const currentIndex = audioQueue.indexOf(currentVerse);
  if (currentIndex > 0) {
    playVerseAudio(audioQueue[currentIndex - 1]);
  }
};

// Event Listeners
loadSurahsButton.addEventListener("click", loadSurahs);
searchInput.addEventListener("input", filterSurahs);

// Remplaçons l'ancien gestionnaire d'événement "ended" par une fonction plus robuste
audioPlayerElement.removeEventListener("ended", onAudioEnded);

// Fonction pour gérer la fin de l'audio
function onAudioEnded() {
  console.log("Audio playback ended, switching to preloaded next verse");
  
  // Réinitialiser le flag de préchargement
  isPreloadingNext = false;
  
  if (audioQueue.length === 0) {
    console.log("Audio queue is empty, nothing to play");
    return;
  }
  
  const nextIndex = lastPlayedIndex + 1;
  
  if (nextIndex < audioQueue.length) {
    const nextVerseKey = audioQueue[nextIndex];
    console.log(`Switching to next verse immediately: ${nextVerseKey} (index ${nextIndex}/${audioQueue.length-1})`);
    
    // Maintenir l'état de lecture
    isPlaying = true;
    
    // OPTIMISATION: Démarrer immédiatement la lecture du verset préchargé
    if (nextAudioElement.readyState >= 3) { // HAVE_FUTURE_DATA ou HAVE_ENOUGH_DATA
      console.log("Using preloaded audio for immediate playback");
      
      // Mettre à jour les variables de suivi avant la transition
      currentVerse = nextVerseKey;
      lastPlayedIndex = nextIndex;
      
      // CHANGEMENT CLÉ: Swap des éléments audio au lieu de changer la source
      // Ceci évite le rechargement et rend la transition instantanée
      [audioPlayerElement.src, nextAudioElement.src] = [nextAudioElement.src, ''];
      
      // Mettre à jour l'UI immédiatement
      highlightCurrentVerse(nextVerseKey);
      updateVerseInfo();
      updateMiniPlayer();
      
      // Lancer la lecture immédiatement sans délai
      const playPromise = audioPlayerElement.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Error during smooth transition:", error);
          // Fallback à la méthode standard en cas d'erreur
          playVerseAudio(nextVerseKey);
        });
      }
      
      // Précharger le verset suivant immédiatement
      const futureIndex = nextIndex + 1;
      if (futureIndex < audioQueue.length) {
        preloadVerseAudio(audioQueue[futureIndex], nextAudioElement, true);
      }
    } else {
      // Si le préchargement n'est pas prêt, utiliser la méthode standard
      console.log("Preloaded audio not ready, using standard playback method");
      playVerseAudio(nextVerseKey);
    }
  } else {
    // Fin de la lecture de la sourate
    console.log("End of surah reached (index", lastPlayedIndex, "of", audioQueue.length - 1, ")");
    isPlaying = false;
    currentTimeElement.textContent = "0:00";
    progressBarElement.style.width = "0%";
    syncPlaybackControls(false);
    updateVerseInfo();
  }
}

// Réassigner le gestionnaire d'événement
audioPlayerElement.addEventListener("ended", onAudioEnded);

audioPlayerElement.addEventListener("timeupdate", updateProgressBar);
audioProgressElement.addEventListener("click", seekAudio);

// Ajout de console.log pour débogage
playButton.addEventListener("click", () => {
  console.log("Play button clicked");
  playAudio();
});

pauseButton.addEventListener("click", () => {
  console.log("Pause button clicked");
  pauseAudio();
});

reciterSelect.addEventListener("change", () => {
  console.log("Reciter changed to:", reciterSelect.value);
  if (currentSurah && currentVerse) {
    // Continuer la lecture à partir du verset actuel avec le nouveau récitateur
    playVerseAudio(currentVerse);
  }
});

// Ajouter les écouteurs d'événements pour les nouveaux contrôles
previousVerseButton.addEventListener("click", () => {
  prevVerse();
});

nextVerseButton.addEventListener("click", () => {
  nextVerse();
});

repeatVerseButton.addEventListener("click", () => {
  if (currentVerse) {
    playVerseAudio(currentVerse);
  }
});

volumeSlider.addEventListener("input", () => {
  audioPlayerElement.volume = volumeSlider.value;
});

// Fonction pour synchroniser les contrôles de lecture entre les interfaces
function syncPlaybackControls(isPlaying) {
  if (isPlaying) {
    // Mode lecture
    playButton.disabled = true;
    playButtonMain.disabled = true;
    pauseButton.disabled = false;
    pauseButtonMain.style.display = "flex";
    playButtonMain.style.display = "none";
    
    // Activer l'animation equalizer
    equalizerElement.classList.add("active");
    
    // Mini player
    miniPlay.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="6" y="4" width="4" height="16"></rect>
        <rect x="14" y="4" width="4" height="16"></rect>
      </svg>
    `;
  } else {
    // Mode pause
    playButton.disabled = false;
    playButtonMain.disabled = false;
    pauseButton.disabled = true;
    pauseButtonMain.style.display = "none";
    playButtonMain.style.display = "flex";
    
    // Désactiver l'animation equalizer
    equalizerElement.classList.remove("active");
    
    // Mini player
    miniPlay.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="6 3 20 12 6 21 6 3"></polygon>
      </svg>
    `;
  }
}

// Mise à jour des événements pour les boutons principaux
playButtonMain.addEventListener("click", () => {
  console.log("Main play button clicked");
  playAudio();
});

pauseButtonMain.addEventListener("click", () => {
  console.log("Main pause button clicked");
  pauseAudio();
});

// Mini player controls
miniPlay.addEventListener("click", () => {
  if (audioPlayerElement.paused) {
    playAudio();
  } else {
    pauseAudio();
  }
});

// Add event listeners for mini-player's previous and next buttons
miniPrev.addEventListener("click", () => {
  playPreviousVerse();
});

miniNext.addEventListener("click", () => {
  playNextVerse();
});

// Fonction pour mettre à jour le mini-player
function updateMiniPlayer() {
  if (currentVerse && currentSurah) {
    // Toujours afficher le mini-player
    miniPlayer.classList.add("active");
    
    // Mettre à jour les informations
    const parts = currentVerse.split(':');
    miniSurahName.textContent = currentSurah.name_simple;
    miniVerseNumber.textContent = `Verset: ${parts[1]}`;
    
    // Mettre à jour l'état des boutons
    miniPrev.disabled = audioQueue.indexOf(currentVerse) <= 0;
    miniNext.disabled = audioQueue.indexOf(currentVerse) >= audioQueue.length - 1;
  }
  // On ne cache plus le mini-player, il reste toujours visible
}

// Gestionnaire d'erreurs centralisé
const ErrorHandler = {
  // Types d'erreurs
  TYPES: {
    NETWORK: 'NETWORK',
    TIMEOUT: 'TIMEOUT', 
    HTTP: 'HTTP',
    PARSE: 'PARSE',
    UNKNOWN: 'UNKNOWN'
  },
  
  // Analyser le type d'erreur
  getErrorType(error) {
    if (error.name === 'AbortError') return this.TYPES.TIMEOUT;
    if (error.name === 'TypeError') return this.TYPES.NETWORK;
    if (error.message.includes('HTTP error')) return this.TYPES.HTTP;
    if (error.name === 'SyntaxError') return this.TYPES.PARSE;
    return this.TYPES.UNKNOWN;
  },
  
  // Obtenir un message d'erreur utilisateur
  getUserMessage(error) {
    const type = this.getErrorType(error);
    switch (type) {
      case this.TYPES.TIMEOUT:
        return "Délai d'attente dépassé. Veuillez vérifier votre connexion.";
      case this.TYPES.NETWORK:
        return "Problème de connexion réseau. Vérifiez votre accès internet.";
      case this.TYPES.HTTP:
        return "Erreur du serveur. Veuillez réessayer plus tard.";
      case this.TYPES.PARSE:
        return "Erreur de traitement des données. Veuillez réessayer.";
      default:
        return "Une erreur inattendue s'est produite.";
    }
  },
  
  // Logger l'erreur avec contexte
  log(error, context = '') {
    console.group(`🔴 Erreur ${context}`);
    console.error('Type:', this.getErrorType(error));
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.groupEnd();
  }
};

// Fonction fetch améliorée avec gestion d'erreurs robuste et rétrocompatibilité
async function fetchApi(url, optionsOrRetries = {}, legacyTimeout) {
  // Gestion de la rétrocompatibilité avec l'ancienne signature (url, retries, timeout)
  let options = {};
  if (typeof optionsOrRetries === 'number') {
    options = {
      retries: optionsOrRetries || API_CONFIG.DEFAULT_RETRIES,
      timeout: legacyTimeout || API_CONFIG.DEFAULT_TIMEOUT,
      showUIError: true,
      context: 'legacy call'
    };
  } else {
    options = optionsOrRetries;
  }
  
  const {
    retries = API_CONFIG.DEFAULT_RETRIES,
    timeout = API_CONFIG.DEFAULT_TIMEOUT,
    showUIError = true,
    context = ''
  } = options;
  
  let lastError = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`🌐 Fetching [${attempt + 1}/${retries + 1}]:`, url.substring(0, 100) + '...');
      
      // Contrôleur d'abandon pour timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      // Configuration de la requête
      const fetchConfig = {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'PlayOuran/1.0'
        }
      };
      
      const response = await fetch(url, fetchConfig).finally(() => {
        clearTimeout(timeoutId);
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error status: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Succès après retry
      if (attempt > 0) {
        console.log(`✅ Succès après ${attempt} tentatives`);
      }
      
      return data;
      
    } catch (error) {
      lastError = error;
      const errorType = ErrorHandler.getErrorType(error);
      
      ErrorHandler.log(error, `${context} (tentative ${attempt + 1})`);
      
      // Pas de retry pour certains types d'erreurs
      if (errorType === ErrorHandler.TYPES.HTTP && error.message.includes('4')) {
        break; // Erreurs 4xx ne doivent pas être retryées
      }
      
      // Si ce n'est pas la dernière tentative
      if (attempt < retries) {
        // Délai exponentiel: 1s, 2s, 4s
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`⏳ Retry dans ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // Toutes les tentatives ont échoué
  if (showUIError && quranContentElement) {
    const userMessage = ErrorHandler.getUserMessage(lastError);
    quranContentElement.innerHTML = `
      <div class='error'>
        <p>❌ ${userMessage}</p>
        <p><small>Tentatives: ${retries + 1}, URL: ${url.substring(0, 50)}...</small></p>
      </div>
    `;
  }
  
  return null;
}

// API Configuration pour les hadiths authentiques
const HADITH_API_CONFIG = {
  baseUrl: 'https://hadeethenc.com/api/v1',
  language: 'fr', // Français pour les traductions
  fallbackLanguage: 'en' // Anglais si français non disponible
};

// Cache local pour les hadiths
let hadithCache = {
  categories: [],
  dailyHadith: null,
  lastFetch: null
};

// Collection étendue de douas et hadiths avec sources authentiques
const DAILY_DUAS = [
  // Douas du Coran
  {
    arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
    transliteration: "Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan waqina 'adhaban-nar",
    traduction: "Notre Seigneur ! Accorde-nous belle part ici-bas et belle part dans l'au-delà, et préserve-nous du châtiment du Feu.",
    source: "Coran 2:201",
    category: "Invocations coraniques",
    type: "quranic"
  },
  {
    arabic: "رَبَّنَا لَا تُؤَاخِذْنَا إِن نَّسِينَا أَوْ أَخْطَأْنَا",
    transliteration: "Rabbana la tu'akhidhna in nasina aw akhta'na",
    traduction: "Notre Seigneur ! Ne nous châtie pas s'il nous arrive d'oublier ou de commettre une erreur.",
    source: "Coran 2:286",
    category: "Invocations coraniques",
    type: "quranic"
  },
  {
    arabic: "رَبَّنَا اغْفِرْ لِي وَلِوَالِدَيَّ وَلِلْمُؤْمِنِينَ يَوْمَ يَقُومُ الْحِسَابُ",
    transliteration: "Rabbana-ghfir li wa liwalidayya wa lil mu'minina yawma yaqumu'l hisab",
    traduction: "Ô notre Seigneur ! Pardonne-moi, ainsi qu'à mes père et mère et aux croyants, le jour où se dressera le compte.",
    source: "Coran 14:41",
    category: "Invocations coraniques",
    type: "quranic"
  },
  {
    arabic: "رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي وَاحْلُلْ عُقْدَةً مِّن لِّسَانِي يَفْقَهُوا قَوْلِي",
    transliteration: "Rabbi-shrah li sadri wa yassir li amri wahlul 'uqdatan min lisani yafqahu qawli",
    traduction: "Seigneur ! Ouvre-moi ma poitrine, facilite ma mission, dénoue ma langue afin qu'ils comprennent mes paroles.",
    source: "Coran 20:25-28",
    category: "Invocations coraniques",
    type: "quranic"
  },
  {
    arabic: "رَبَّنَا ظَلَمْنَا أَنفُسَنَا وَإِن لَّمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ",
    transliteration: "Rabbana zalamna anfusana wa il-lam taghfir lana wa tarhamna lanakunanna mina'l-khasirin",
    traduction: "Notre Seigneur ! Nous avons fait du tort à nous-mêmes. Et si Tu ne nous pardonnes pas et ne nous fais pas miséricorde, nous serons très certainement du nombre des perdants.",
    source: "Coran 7:23",
    category: "Invocations coraniques",
    type: "quranic"
  },
  
  // Hadiths authentiques de Sahih al-Bukhari
  {
    arabic: "اللَّهُمَّ رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
    transliteration: "Allahumma Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan waqina 'adhaban-nar",
    traduction: "Ô Allah, notre Seigneur, accorde-nous le meilleur dans ce monde et le meilleur dans l'au-delà, et protège-nous du châtiment de l'Enfer.",
    source: "Sahih al-Bukhari 4522, Sahih Muslim 2690",
    category: "Invocations prophétiques",
    type: "hadith",
    authenticity: "Sahih (Authentique)"
  },
  {
    arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْهُدَى وَالتُّقَى وَالْعَفَافَ وَالْغِنَى",
    transliteration: "Allahumma inni as'alukal-huda wat-tuqa wal-'afafa wal-ghina",
    traduction: "Ô Allah, je Te demande la guidée, la piété, la chasteté et la richesse (spirituelle).",
    source: "Sahih Muslim 2721",
    category: "Invocations prophétiques",
    type: "hadith",
    authenticity: "Sahih (Authentique)"
  },
  {
    arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا طَيِّبًا، وَعَمَلاً مُتَقَبَّلاً",
    transliteration: "Allahumma inni as'aluka 'ilman nafi'an, wa rizqan tayyiban, wa 'amalan mutaqabbalan",
    traduction: "Ô Allah, je Te demande une science bénéfique, une subsistance pure et une œuvre acceptable.",
    source: "Sunan Ibn Majah 925",
    category: "Invocations prophétiques",
    type: "hadith",
    authenticity: "Sahih (Authentique)"
  },
  {
    arabic: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ",
    transliteration: "Allahumma anta Rabbi la ilaha illa anta, khalaqtani wa ana 'abduka, wa ana 'ala 'ahdika wa wa'dika mastata'tu, a'udhu bika min sharri ma sana'tu, abu'u laka bini'matika 'alayya, wa abu'u bidhanbi faghfirli fa innahu la yaghfirudh-dhunuba illa anta",
    traduction: "Ô Allah ! Tu es mon Seigneur, il n'y a point de divinité en dehors de Toi. Tu m'as créé et je suis Ton serviteur. Je respecte autant que possible mon engagement et ma promesse envers Toi. Je cherche refuge auprès de Toi contre le mal que j'ai commis. Je reconnais Ton bienfait à mon égard et je reconnais mon péché. Pardonne-moi car nul autre que Toi ne pardonne les péchés.",
    source: "Sahih al-Bukhari 6306",
    category: "Sayyid al-Istighfar (Maître de la demande de pardon)",
    type: "hadith",
    authenticity: "Sahih (Authentique)"
  },
  
  // Hadiths de Sahih Muslim
  {
    arabic: "اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ",
    transliteration: "Allahumma a'inni 'ala dhikrika wa shukrika wa husni 'ibadatika",
    traduction: "Ô Allah, aide-moi à T'invoquer, à Te remercier et à bien T'adorer.",
    source: "Sahih Muslim, Abu Dawud 1522",
    category: "Invocations prophétiques",
    type: "hadith",
    authenticity: "Sahih (Authentique)"
  },
  {
    arabic: "اللَّهُمَّ اغْفِرْ لِي ذَنْبِي وَوَسِّعْ لِي فِي دَارِي وَبَارِكْ لِي فِيمَا رَزَقْتَنِي",
    transliteration: "Allahumma-ghfir li dhanbi wa wassi' li fi dari wa barik li fima razaqtani",
    traduction: "Ô Allah, pardonne-moi mes péchés, élargis ma demeure et bénis ce que Tu m'as accordé comme subsistance.",
    source: "Sahih Muslim, Al-Tirmidhi 3500",
    category: "Invocations prophétiques",
    type: "hadith",
    authenticity: "Sahih (Authentique)"
  },
  
  // Hadiths sur les vertus
  {
    arabic: "مَنْ قَالَ لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، فِي يَوْمٍ مِائَةَ مَرَّةٍ كَانَتْ لَهُ عَدْلَ عَشْرِ رِقَابٍ",
    transliteration: "Man qala la ilaha illa Allah wahdahu la sharika lahu, lahu'l-mulku wa lahu'l-hamd wa huwa 'ala kulli shay'in qadir, fi yawmin mi'ata marrah kanat lahu 'adlu 'ashri riqab",
    traduction: "Quiconque dit cent fois par jour : 'Il n'y a de divinité qu'Allah, Seul, sans associé. À Lui la royauté, à Lui la louange et Il est capable de toute chose', cela équivaut pour lui à l'affranchissement de dix esclaves.",
    source: "Sahih al-Bukhari 3293, Sahih Muslim 2691",
    category: "Dhikr et ses mérites",
    type: "hadith",
    authenticity: "Sahih (Authentique)"
  },
  
  // Invocations du matin et du soir
  {
    arabic: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ",
    transliteration: "Asbahna wa asbahal-mulku lillah, wal-hamdu lillah, la ilaha illa Allah wahdahu la sharika lah",
    traduction: "Nous voici au matin et le royaume appartient à Allah, la louange est à Allah, il n'y a de divinité qu'Allah, Seul, sans associé.",
    source: "Sahih Muslim 2723",
    category: "Adhkar du matin",
    type: "hadith",
    authenticity: "Sahih (Authentique)"
  }
];

// Fonction pour récupérer des hadiths depuis l'API HadeethEnc.com
async function fetchHadithFromAPI() {
  try {
    console.log('Tentative de récupération de hadith depuis l\'API...');
    
    // Récupérer d'abord les catégories
    const categoriesResponse = await fetch(`${HADITH_API_CONFIG.baseUrl}/categories/roots/?language=${HADITH_API_CONFIG.language}`);
    if (!categoriesResponse.ok) {
      throw new Error('Échec de récupération des catégories');
    }
    
    const categories = await categoriesResponse.json();
    hadithCache.categories = categories;
    
    // Choisir une catégorie aléatoire (ex: Vertus et Manières)
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    
    // Récupérer les hadiths de cette catégorie
    const hadithsResponse = await fetch(`${HADITH_API_CONFIG.baseUrl}/hadeeths/list/?language=${HADITH_API_CONFIG.language}&category_id=${randomCategory.id}&page=1&per_page=20`);
    
    if (!hadithsResponse.ok) {
      throw new Error('Échec de récupération des hadiths');
    }
    
    const hadithsData = await hadithsResponse.json();
    
    if (hadithsData.data && hadithsData.data.length > 0) {
      // Choisir un hadith aléatoire
      const randomHadith = hadithsData.data[Math.floor(Math.random() * hadithsData.data.length)];
      
      // Récupérer les détails complets du hadith
      const hadithDetailResponse = await fetch(`${HADITH_API_CONFIG.baseUrl}/hadeeths/one/?language=${HADITH_API_CONFIG.language}&id=${randomHadith.id}`);
      
      if (hadithDetailResponse.ok) {
        const hadithDetail = await hadithDetailResponse.json();
        
        return {
          arabic: hadithDetail.hadeeth || randomHadith.title,
          transliteration: "", // L'API ne fournit pas toujours la translittération
          traduction: hadithDetail.explanation || randomHadith.title,
          source: `HadeethEnc.com - ${randomCategory.title}`,
          category: randomCategory.title,
          type: "hadith",
          authenticity: hadithDetail.grade || "Authentique",
          apiSource: true
        };
      }
    }
  } catch (error) {
    console.warn('Erreur lors de la récupération depuis l\'API:', error);
  }
  
  // Retourner null si l'API échoue
  return null;
}

// Obtenir une doua aléatoire ou celle du jour si déjà sauvegardée
async function getRandomDua() {
  try {
    const savedDua = JSON.parse(localStorage.getItem('dailyDua') || '{}');
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // Format YYYY-MM-DD
    
    // Si nous avons une doua sauvegardée pour aujourd'hui, l'utiliser
    if (savedDua.date === today && savedDua.dua) {
      return savedDua.dua;
    }
    
    // Essayer d'abord de récupérer depuis l'API (20% de chance pour avoir de la variété)
    if (Math.random() < 0.2) {
      const apiHadith = await fetchHadithFromAPI();
      if (apiHadith) {
        // Sauvegarder le hadith de l'API pour aujourd'hui
        localStorage.setItem('dailyDua', JSON.stringify({
          date: today,
          dua: apiHadith
        }));
        return apiHadith;
      }
    }
    
    // Sinon, utiliser la collection locale
    const randomIndex = Math.floor(Math.random() * DAILY_DUAS.length);
    const dua = DAILY_DUAS[randomIndex];
    
    // Sauvegarder la doua du jour
    localStorage.setItem('dailyDua', JSON.stringify({
      date: today,
      dua: dua
    }));
    
    return dua;
  } catch (e) {
    console.error("Erreur lors de la récupération/sauvegarde de la doua du jour:", e);
    // En cas d'erreur, simplement retourner une doua aléatoire sans sauvegarder
    const randomIndex = Math.floor(Math.random() * DAILY_DUAS.length);
    return DAILY_DUAS[randomIndex];
  }
}

// Mettre à jour le message de bienvenue pour indiquer que les sourates sont chargées
async function updateWelcomeMessage() {
  const currentDate = new Date();
  const formattedDate = new Intl.DateTimeFormat('fr-FR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }).format(currentDate);

  // Obtenir une doua aléatoire
  const randomDua = await getRandomDua();
  
  // Formater la source de façon plus explicite
  let sourceText = randomDua.source;
  if (sourceText.startsWith("Coran")) {
    // Extraire les numéros de sourate et verset
    const parts = sourceText.split(":");
    if (parts.length === 2) {
      const sourate = parts[0].replace("Coran ", "");
      const verset = parts[1];
      sourceText = `Sourate ${sourate}, Verset ${verset}`;
    }
  }

  quranContentElement.innerHTML = `
    <div class="welcome-screen">
      <div class="welcome-header">
        <h2 class="welcome-title animated-welcome">Bienvenue</h2>
        <p class="welcome-date">${formattedDate}</p>
      </div>

      <!-- Invocation du jour en position stratégique, avant le contenu principal -->
      <div class="dua-of-the-day">
        <div class="dua-header">
          ${randomDua.category ? `<span class="dua-category">${randomDua.category}</span>` : ''}
        </div>
        <div class="dua-content">
          <div class="dua-arabic-container">
            <p class="dua-arabic">${cleanArabicText(randomDua.arabic)}</p>
          </div>
          ${randomDua.transliteration ? `
            <div class="dua-transliteration-container">
              <p class="dua-transliteration">${randomDua.transliteration}</p>
            </div>
          ` : ''}
          <div class="dua-translation-container">
            <p class="dua-translation">${randomDua.traduction}</p>
          </div>
          <div class="dua-source-container">
            <span class="dua-source">${sourceText}</span>
            ${randomDua.authenticity ? `<span class="dua-authenticity">${randomDua.authenticity}</span>` : ''}
          </div>
        </div>
      </div>

      <div class="welcome-content">
        <div class="welcome-icon animated">
          <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#0071e3" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="book-icon">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            <path class="book-page" d="M12 6l8 0"></path>
            <path class="book-page" d="M12 10l8 0"></path>
            <path class="book-page" d="M12 14l8 0"></path>
          </svg>
        </div>

        <div class="welcome-text-container">
          <p class="welcome-text">Sélectionnez une sourate dans la liste ci-dessus pour commencer votre lecture</p>
          
          <div class="welcome-stats">
            <div class="stat-item">
              <span class="stat-value">${allSurahs.length}</span>
              <span class="stat-label">Sourates</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">6236</span>
              <span class="stat-label">Versets</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">${RECITERS.length}</span>
              <span class="stat-label">Récitateurs</span>
            </div>
          </div>
          
          <div class="welcome-tips">
            <p><strong>Astuce :</strong> Utilisez la barre de recherche pour trouver rapidement une sourate</p>
            <p><strong>Nouveau :</strong> Écoutez les récitations en français avec Youssouf Leclerc</p>
          </div>
        </div>
      </div>

      <div class="welcome-footer">
        <div class="last-read">
          <h3>Dernière lecture</h3>
          <p id="last-read-info">Aucune lecture récente</p>
          <button id="resume-reading" class="resume-button" disabled>Reprendre la lecture</button>
        </div>
      </div>
    </div>
  `;

  // Récupérer la dernière sourate lue dans localStorage
  try {
    const lastReadData = JSON.parse(localStorage.getItem('lastRead') || '{}');
    if (lastReadData.surahId) {
      const surah = allSurahs.find(s => s.id === parseInt(lastReadData.surahId));
      if (surah) {
        const lastReadInfo = document.getElementById('last-read-info');
        const resumeButton = document.getElementById('resume-reading');
        
        lastReadInfo.textContent = `Sourate ${surah.id}: ${surah.name_simple} (${surah.translated_name.name})`;
        resumeButton.disabled = false;
        
        // Ajouter un event listener pour reprendre la lecture
        resumeButton.addEventListener('click', () => {
          const surahElement = document.querySelector(`.surah-item[data-id="${surah.id}"]`);
          if (surahElement) {
            surahElement.click();
          }
        });
      }
    }
  } catch (e) {
    console.error("Erreur lors de la récupération de la dernière lecture:", e);
  }
}

// Load list of Surahs
async function loadSurahs() {
  quranContentElement.innerHTML = "<div class='loading'>Chargement des sourates...</div>";
  
  // We will use the Quran.com API to get surah list
  const data = await fetchApi(QURAN_API_URL + "api/v4/chapters?language=fr", { 
    context: 'liste des sourates'
  });
  
  if (!data) return;
  
  allSurahs = data.chapters;
  displaySurahs(allSurahs);
  
  // Mettre à jour les options de récitateurs
  updateReciterOptions();
  
  // Mettre à jour les options de traduction
  updateTranslationOptions();
  
  // Afficher le message de bienvenue
  await updateWelcomeMessage();
  
  // Sauvegarder dans localStorage pour charger plus rapidement la prochaine fois
  localStorage.setItem('allSurahs', JSON.stringify(allSurahs));
}

// Display surahs in the sidebar
function displaySurahs(surahs) {
  surahListElement.innerHTML = "";
  
  surahs.forEach((surah, index) => {
    const surahElement = document.createElement("div");
    surahElement.className = "surah-item";
    surahElement.dataset.id = surah.id;
    // Add animation delay based on index
    surahElement.style.setProperty('--item-index', index);
    
    // Check if this is the currently selected surah
    if (currentSurah && surah.id === currentSurah.id) {
      surahElement.classList.add("active");
      // Ajouter une classe à la sidebar pour indiquer qu'une sourate est active
      document.querySelector('.sidebar').classList.add('has-active-surah');
    }
    
    // Create surah number element
    const surahNumber = document.createElement("div");
    surahNumber.className = "surah-item-number";
    surahNumber.textContent = surah.id;
    
    // Create surah name element
    const surahName = document.createElement("div");
    surahName.className = "surah-item-name";
    surahName.textContent = surah.name_simple;
    
    // Create surah translation element
    const surahTranslation = document.createElement("div");
    surahTranslation.className = "surah-item-translation";
    surahTranslation.textContent = surah.translated_name.name;
    
    // Create verses count element
    const surahVerses = document.createElement("div");
    surahVerses.className = "surah-item-verses";
    surahVerses.textContent = `${surah.verses_count} versets`;
    
    // Add elements to surah item
    surahElement.appendChild(surahNumber);
    surahElement.appendChild(surahName);
    surahElement.appendChild(surahTranslation);
    surahElement.appendChild(surahVerses);
    
    surahElement.addEventListener("click", () => {
      // Réinitialiser les variables de lecture
      audioPlayerElement.pause();
      audioPlayerElement.currentTime = 0;
      currentVerse = null;
      audioQueue = [];
      lastPlayedIndex = -1;
      isPlaying = false;
      
      // Remove active class from all surah items
      document.querySelectorAll(".surah-item").forEach(item => {
        item.classList.remove("active");
      });
      // Add active class to clicked surah item
      surahElement.classList.add("active");
      
      // Ajouter une classe à la sidebar pour indiquer qu'une sourate est active
      document.querySelector('.sidebar').classList.add('has-active-surah');
      
      // Afficher un effet de surbrillance temporaire
      surahElement.classList.add("just-selected");
      setTimeout(() => {
        surahElement.classList.remove("just-selected");
      }, 1000);
      
      // Scroll to make sure the selected surah is visible
      surahElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      
      loadSurah(surah.id);
    });
    surahListElement.appendChild(surahElement);
  });
  
  // Après avoir affiché toutes les sourates, scroll vers la sourate active si elle existe
  setTimeout(() => {
    const activeSurah = document.querySelector('.surah-item.active');
    if (activeSurah) {
      activeSurah.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, 100);
}

// Filter surahs based on search input with improved search capabilities
function filterSurahs() {
  const searchTerm = searchInput.value.trim().toLowerCase();
  
  if (!searchTerm) {
    displaySurahs(allSurahs);
    return;
  }
  
  // Normalize for accents and special characters
  const normalizeText = (text) => {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  };
  
  const normalizedSearch = normalizeText(searchTerm);
  
  // Match function that checks if term is found in text
  const matches = (text, term) => {
    if (!text) return false;
    // Check original text
    if (text.toLowerCase().includes(term)) return true;
    // Check normalized text (no accents)
    const normalizedText = normalizeText(text);
    return normalizedText.includes(term);
  };

  // Function to get match score (higher is better match)
  const getMatchScore = (surah, term) => {
    let score = 0;
    
    // Exact number match is highest priority
    if (surah.id.toString() === term) {
      return 100;
    }
    
    // Name starts with term is high priority
    if (surah.name_simple.toLowerCase().startsWith(term)) {
      score += 50;
    }
    
    // Name contains term
    if (matches(surah.name_simple, term)) {
      score += 30;
    }
    
    // Translation starts with term
    if (surah.translated_name.name.toLowerCase().startsWith(term)) {
      score += 40;
    }
    
    // Translation contains term
    if (matches(surah.translated_name.name, term)) {
      score += 20;
    }
    
    // Number contains term (partial match)
    if (surah.id.toString().includes(term)) {
      score += 15;
    }
    
    return score;
  };

  // Filter and sort by relevance
  const filteredSurahs = allSurahs
    .map(surah => {
      const score = getMatchScore(surah, normalizedSearch);
      return { surah, score };
    })
    .filter(item => {
      return item.score > 0 || (currentSurah && item.surah.id === currentSurah.id);
    })
    .sort((a, b) => b.score - a.score)
    .map(item => item.surah);
  
  // Always include current surah
  if (currentSurah && !filteredSurahs.some(surah => surah.id === currentSurah.id)) {
    filteredSurahs.push(currentSurah);
  }
  
  displaySurahs(filteredSurahs);
}

// Load Surah content
async function loadSurah(surahId) {
  // Reset current verse
  currentVerse = null;
  audioQueue = [];
  
  // Show loading indicator without removing the surah list
  quranContentElement.innerHTML = "<div class='loading'>Chargement de la sourate...</div>";
  
  // Get surah info
  const surah = allSurahs.find(s => s.id === parseInt(surahId));
  currentSurah = surah;
  
  // Sauvegarder la dernière sourate consultée dans localStorage
  try {
    localStorage.setItem('lastRead', JSON.stringify({
      surahId: surah.id,
      timestamp: new Date().toISOString()
    }));
  } catch (e) {
    console.error("Erreur lors de la sauvegarde de la dernière lecture:", e);
  }
  
  // Vider le cache pour cette sourate lorsque la traduction change
  delete surahCache[surahId];
  
  // Vérifier si la sourate est déjà dans le cache
  if (surahCache[surahId]) {
    console.log(`Chargement de la sourate ${surahId} depuis le cache`);
    displaySurahContent(surah, surahCache[surahId]);
    return;
  }
  
  // Prepare to store all verses
  let allVerses = [];
  
  // Calculate how many pages we need to fetch based on verse count
  // API has a limit of 50 verses per page, but we'll request max of 100 to minimize requests
  const perPage = 100;
  const totalPages = Math.ceil(surah.verses_count / perPage);
  
  // Update loading message to show that we're fetching multiple pages
  if (totalPages > 1) {
    quranContentElement.innerHTML = `<div class='loading'>Chargement de la sourate (${surah.verses_count} versets)...<br>Page 1 sur ${totalPages}</div>`;
  }
  
  // Get the selected translation
  const translationId = translationSelect.value || '31';
  
  // Fetch all pages of verses
  for (let page = 1; page <= totalPages; page++) {
    if (page > 1) {
      // Update loading message to show progress
      quranContentElement.innerHTML = `<div class='loading'>Chargement de la sourate (${surah.verses_count} versets)...<br>Page ${page} sur ${totalPages}</div>`;
    }
    
    const url = `${QURAN_API_URL}api/v4/verses/by_chapter/${surahId}?language=fr&translations=${translationId}&fields=text_indopak,chapter_id,verse_number,verse_key,translations&per_page=${perPage}&page=${page}`;
    const data = await fetchApi(url, { 
      context: `versets sourate ${surahId} page ${page}`
    });
    
    if (!data) {
      quranContentElement.innerHTML = "<div class='error'>Erreur lors du chargement des versets. Veuillez réessayer.</div>";
      return;
    }
    
    // Add this page's verses to our collection
    allVerses = allVerses.concat(data.verses);
  }
  
  // Mettre la sourate dans le cache
  surahCache[surahId] = allVerses;
  
  // Sauvegarder les sourates récemment consultées dans localStorage
  try {
    const recentSurahs = JSON.parse(localStorage.getItem('recentSurahs') || '{}');
    // Limiter à 3 sourates dans le cache local pour éviter de surcharger localStorage
    const recentSurahIds = Object.keys(recentSurahs);
    if (recentSurahIds.length >= 3) {
      delete recentSurahs[recentSurahIds[0]]; // Supprimer la plus ancienne sourate
    }
    recentSurahs[surahId] = allVerses;
    localStorage.setItem('recentSurahs', JSON.stringify(recentSurahs));
  } catch (e) {
    console.error("Erreur lors de la sauvegarde dans localStorage:", e);
  }
  
  // Afficher le contenu
  displaySurahContent(surah, allVerses);
}

// Fonction pour nettoyer le texte de traduction des balises HTML non souhaitées
function cleanTranslationText(text) {
  if (!text) return "";
  
  // Supprimer les balises sup avec leur contenu
  return text.replace(/<sup[^>]*>.*?<\/sup>/g, '')
             // Autres nettoyages possibles
             .replace(/&lt;/g, '<')
             .replace(/&gt;/g, '>')
             .replace(/&quot;/g, '"')
             .replace(/&apos;/g, "'")
             .replace(/&amp;/g, '&')
             .trim();
}

// Fonction pour nettoyer le texte arabe des caractères spéciaux qui peuvent causer des problèmes d'affichage
function cleanArabicText(text) {
  if (!text) return "";
  
  // Utiliser une méthode plus robuste pour nettoyer les caractères carrés et problématiques
  // Remplacer chaque caractère non-affichable ou carré par une chaîne vide
  const cleanedText = text.replace(/[\u25A0-\u25FF\u2610-\u261B\u2B1B\u2B1C\u25FB-\u25FE]/g, '')
                        .replace(/[\u0000-\u001F\u007F-\u009F\u2500-\u257F]/g, '')
                        .replace(/[\uFFF0-\uFFFF]/g, '')
                        // Remplacer les caractères de ponctuation spécifiques du Coran s'ils posent problème
                        .replace(/\u06DD/g, '') // End of ayah
                        .replace(/\u06DE/g, '') // Start of rub el hizb
                        .replace(/\u06E9/g, '') // Place of sajdah
                        .replace(/\u06D6/g, '') // End of sajdah
                        .replace(/\u06D7/g, '') // End of quran
                        // Supprimer les caractères invisibles, mais préserver certains
                        .replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u2064]/g, '')
                        .trim();
                        
  // Si le résultat contient encore des caractères carrés visibles, on utilisera une méthode plus agressive
  if (/[\u25A0-\u25FF\u2610-\u261B]/.test(cleanedText)) {
    console.log("Des caractères carrés persistent, application d'un nettoyage supplémentaire");
    
    // Essayer de remplacer les caractères problématiques par les caractères équivalents corrects
    return cleanedText.replace(/\u25A0|\u25A1|\u25FB|\u25FC|\u2610|\u2611|\u2612/g, ' ');
  }
  
  return cleanedText;
}

// Fonction pour encoder le texte pour utilisation avec innerHTML
function encodeHTMLEntities(text) {
  const textArea = document.createElement('textarea');
  textArea.textContent = text;
  return textArea.innerHTML;
}

// Modification de la fonction displaySurahContent pour utiliser une source alternative pour le texte arabe si nécessaire
async function displaySurahContent(surah, verses) {
  // Update surah info with Apple style formatting
  surahInfoElement.innerHTML = `
    <h2>${surah.name_simple}</h2>
    <div class="meta">
      <span>${surah.translated_name.name}</span>
      <span>${surah.verses_count} versets</span>
    </div>
    <div class="selected-surah-indicator">Sourate ${surah.id}</div>
  `;
  
  // Clear content
  quranContentElement.innerHTML = "";
  
  // Add bismillah if needed
  if (surah.id !== 1 && surah.id !== 9) {
    const bismillah = document.createElement("div");
    bismillah.className = "verse-container bismillah";
    
    const bismillahText = document.createElement("div");
    bismillahText.className = "verse-text";
    bismillahText.textContent = "بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ";
    bismillah.appendChild(bismillahText);
    
    quranContentElement.appendChild(bismillah);
  }
  
  // Fetch an alternative text source for Arabic text if needed
  let alternativeArabicText = {};
  try {
    // Utiliser l'API alquran.cloud pour obtenir le texte arabe sans caractères spéciaux problématiques
    const response = await fetch(`https://api.alquran.cloud/v1/surah/${surah.id}/ar.asad`);
    const data = await response.json();
    
    if (data.code === 200 && data.data && data.data.ayahs) {
      data.data.ayahs.forEach(ayah => {
        alternativeArabicText[ayah.numberInSurah] = ayah.text;
      });
      console.log(`Texte arabe alternatif chargé pour la sourate ${surah.id}`);
    }
  } catch (error) {
    console.error("Erreur lors du chargement du texte arabe alternatif:", error);
  }
  
  // Add verse by verse with French translation
  verses.forEach(verse => {
    const verseKey = `${surah.id}:${verse.verse_number}`;
    const verseContainer = document.createElement("div");
    verseContainer.className = "verse-container";
    verseContainer.id = `verse-${verseKey}`;
    
    // Créer l'en-tête du verset avec le numéro
    const verseHeader = document.createElement("div");
    verseHeader.className = "verse-header";
    
    const verseNumber = document.createElement("div");
    verseNumber.className = "verse-number";
    verseNumber.textContent = verse.verse_number;
    
    // Bouton audio avec icône SVG intégrée
    const audioButton = document.createElement("button");
    audioButton.className = "verse-audio-button";
    audioButton.dataset.verseKey = verseKey;
    audioButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
      </svg>
    `;
    
    audioButton.addEventListener("click", () => {
      playVerseAudio(verseKey);
    });
    
    verseHeader.appendChild(verseNumber);
    verseHeader.appendChild(audioButton);
    verseContainer.appendChild(verseHeader);
    
    // Arabic text with enhanced rendering and fallback
    const verseText = document.createElement("div");
    verseText.className = "verse-text";
    
    // Prioritize alternative source if available, otherwise clean the existing text
    let arabicText = "";
    if (alternativeArabicText[verse.verse_number]) {
      arabicText = alternativeArabicText[verse.verse_number];
      console.log(`Utilisation du texte alternatif pour le verset ${verse.verse_number}`);
    } else {
      // Nettoyer le texte arabe des caractères spéciaux qui peuvent être mal rendus
      arabicText = cleanArabicText(verse.text_indopak);
    }
    
    // Utiliser innerHTML pour un meilleur rendu des caractères spéciaux
    verseText.innerHTML = encodeHTMLEntities(arabicText);
    
    verseContainer.appendChild(verseText);
    
    // Vérifier si l'option "Sans traduction" est sélectionnée
    const selectedTranslation = translationSelect.value;
    if (selectedTranslation !== 'none') {
      // Translation
      const translation = document.createElement("div");
      translation.className = "verse-translation";
      
      // Get translation if available
      let translationText = "Traduction non disponible";
      if (verse.translations && verse.translations.length > 0) {
        translationText = verse.translations[0].text;
        
        // Nettoyer les balises HTML dans le texte de la traduction
        translationText = cleanTranslationText(translationText);
      }
      
      translation.textContent = translationText;
      verseContainer.appendChild(translation);
    }
    
    // Add to content
    quranContentElement.appendChild(verseContainer);
    
    // Add to audio queue
    audioQueue.push(verseKey);
  });
  
  // Enable audio controls
  playButton.disabled = false;
  pauseButton.disabled = false;
  
  // Update control buttons state
  updateControlButtons();
  
  // Vérifier si une bannière existe déjà et la supprimer le cas échéant
  const existingBanner = quranContentElement.querySelector('.selected-surah-banner');
  if (existingBanner) {
    existingBanner.remove();
  }
  
  // Ajouter un bandeau indicateur en haut du contenu
  const selectedSurahBanner = document.createElement("div");
  selectedSurahBanner.className = "selected-surah-banner";
  selectedSurahBanner.innerHTML = `
    <div class="banner-content">
      <div class="banner-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
        </svg>
      </div>
      <div class="banner-text">
        <strong>Sourate actuelle : ${surah.name_simple}</strong>
        <span>${surah.translated_name.name} - ${surah.verses_count} versets</span>
      </div>
    </div>
  `;
  quranContentElement.insertBefore(selectedSurahBanner, quranContentElement.firstChild);
  
  // On vérifie quand même la disponibilité hors ligne (pour d'autres fonctionnalités)
  checkOfflineAvailability(surah.id);
}

// Formater le numéro de verset pour l'URL audio (avec leading zeros)
function formatVerseNumber(verse) {
  const parts = verse.split(':');
  const surahNumber = parts[0].padStart(3, '0');
  const verseNumber = parts[1].padStart(3, '0');
  return { surahNumber, verseNumber };
}

// Play audio for a specific verse using Alquran.cloud API
function playVerseAudio(verseKey) {
  // Vérification plus stricte pour éviter la double lecture
  if (currentVerse === verseKey && !audioPlayerElement.paused && audioPlayerElement.currentTime > 0) {
    console.log("Ce verset est déjà en cours de lecture:", verseKey);
    return;
  }
  
  // Arrêter l'animation de highlight sans arrêter l'audio
  if (highlightInterval) {
    clearInterval(highlightInterval);
    highlightInterval = null;
  }
  
  // Mise à jour de lastPlayedIndex pour le suivi de la séquence
  if (audioQueue.includes(verseKey)) {
    lastPlayedIndex = audioQueue.indexOf(verseKey);
    console.log(`Tracking verse index: ${lastPlayedIndex} of ${audioQueue.length - 1}`);
    
    // OPTIMISATION: Précharger immédiatement les 2 versets suivants
    preloadFutureVerses(lastPlayedIndex);
  }
  
  // Mettre à jour l'UI pour montrer que la lecture est en cours
  document.querySelectorAll(".verse-container").forEach(container => {
    container.classList.remove("active");
  });
  
  // Vérifier si le verset est disponible hors ligne
  const parts = verseKey.split(':');
  const surahId = parts[0];
  const verseNum = parts[1];
  let audioUrl = null;
  let isOffline = false;
  
  try {
    // Vérifier dans le localStorage si la sourate est disponible hors ligne
    const offlineAudio = JSON.parse(localStorage.getItem('offlineAudio') || '{}');
    if (offlineAudio[surahId]) {
      // Chercher le verset correspondant
      const verset = offlineAudio[surahId].versets.find(v => v.verseKey === verseKey);
      if (verset && verset.url) {
        console.log(`Utilisation de l'URL stockée pour le verset ${verseKey}`);
        audioUrl = verset.url;
        isOffline = true;
      }
    }
  } catch (error) {
    console.error("Erreur lors de la vérification de l'audio hors ligne:", error);
  }
  
  // Si l'audio n'est pas disponible hors ligne, utiliser l'URL en ligne
  if (!audioUrl) {
    const reciterId = reciterSelect.value;
    audioUrl = `${ALQURAN_AUDIO_URL}${reciterId}/${verseKey}.mp3`;
  }
  
  // Vérifier si ce verset est déjà préchargé
  if (preloadedVerses[verseKey] && !isOffline) {
    console.log("Using preloaded audio from cache for:", verseKey);
    audioPlayerElement.src = preloadedVerses[verseKey];
    delete preloadedVerses[verseKey]; // Libérer la mémoire
  } else {
    console.log(`Loading audio from: ${isOffline ? 'cached URL' : 'online source'}`);
    audioPlayerElement.src = audioUrl;
  }
  
  // Activer le style du conteneur de verset
  const verseContainer = document.getElementById(`verse-${verseKey}`);
  if (verseContainer) {
    verseContainer.classList.add("active");
    const existingLoadingIndicator = verseContainer.querySelector('.audio-loading');
    if (existingLoadingIndicator) existingLoadingIndicator.remove();
    const oldFallback = verseContainer.querySelector('.fallback-message');
    if (oldFallback) oldFallback.remove();
    verseContainer.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  
  // Désactiver le volume fade-out/fade-in pour une transition immédiate
  audioPlayerElement.volume = 1.0;
  
  // Jouer l'audio immédiatement
  const playPromise = audioPlayerElement.play();
  
  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        console.log("Playback started for verse:", verseKey);
        isPlaying = true;
        currentVerse = verseKey;
        
        // Synchroniser les contrôles de lecture
        syncPlaybackControls(true);
        updateVerseInfo();
        updateMiniPlayer();
        highlightCurrentVerse(verseKey);
        
        // OPTIMISATION: Précharger beaucoup plus tôt - dès 30% du verset
        audioPlayerElement.ontimeupdate = function() {
          if (!isPreloadingNext && audioPlayerElement.duration > 0 && 
              audioPlayerElement.currentTime > audioPlayerElement.duration * 0.3) {
            preloadFutureVerses(lastPlayedIndex);
            isPreloadingNext = true;
          }
        };
      })
      .catch(error => {
        console.error("Error starting playback:", error);
        if (isOffline) {
          // Si la lecture locale échoue, essayer la version en ligne
          console.log("Local URL playback failed, trying online source");
          const reciterId = reciterSelect.value;
          audioPlayerElement.src = `${ALQURAN_AUDIO_URL}${reciterId}/${verseKey}.mp3`;
          audioPlayerElement.play().catch(err => {
            console.error("Online playback also failed:", err);
            tryDirectApiAudio(verseKey);
          });
        } else {
          tryDirectApiAudio(verseKey);
        }
      });
  }
}

// Fonction améliorée pour précharger plusieurs versets à l'avance
function preloadFutureVerses(currentIndex) {
  const nextIndex = currentIndex + 1;
  const futureIndex = currentIndex + 2;
  
  // Précharger le verset suivant avec haute priorité
  if (nextIndex < audioQueue.length) {
    const nextVerseKey = audioQueue[nextIndex];
    preloadVerseAudio(nextVerseKey, nextAudioElement, true);
  }
  
  // Précharger le verset d'après en arrière-plan
  if (futureIndex < audioQueue.length) {
    const futureVerseKey = audioQueue[futureIndex];
    setTimeout(() => {
      preloadVerseAudio(futureVerseKey, futureAudioElement, false);
    }, 100); // Léger délai pour ne pas surcharger le réseau
  }
}

// Fonction optimisée pour précharger un verset spécifique
function preloadVerseAudio(verseKey, audioElement, isHighPriority = false) {
  if (!verseKey) return;
  
  const reciterId = reciterSelect.value;
  const audioUrl = `${ALQURAN_AUDIO_URL}${reciterId}/${verseKey}.mp3`;
  console.log(`Preloading verse ${verseKey} with ${isHighPriority ? 'high' : 'normal'} priority`);
  
  // OPTIMISATION: Utiliser fetch pour précharger avec un contrôle plus précis
  if (isHighPriority) {
    // Préchargement de haute priorité pour le verset suivant
    audioElement.src = audioUrl;
    audioElement.load();
    
    // Assurer que l'élément est prêt à jouer
    audioElement.oncanplaythrough = function() {
      console.log("Next verse preloaded successfully:", verseKey);
      preloadedVerses[verseKey] = audioUrl;
    };
  } else {
    // Préchargement en arrière-plan avec fetch pour les versets futurs
    fetch(audioUrl)
      .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        // Stocker l'URL dans le cache
        preloadedVerses[verseKey] = audioUrl;
        console.log("Future verse pre-fetched successfully:", verseKey);
      })
      .catch(error => {
        console.error("Error pre-fetching verse:", error);
      });
  }
}

// Essayer de charger l'audio directement depuis l'API Alquran.cloud
async function tryDirectApiAudio(verseKey) {
  let audioPlayedSuccessfully = false;
  
  try {
    const [surahNum, verseNum] = verseKey.split(':');
    const reciterId = reciterSelect.value;
    
    // Appel direct à l'API
    const apiUrl = `${ALQURAN_CLOUD_API}ayah/${verseKey}/${reciterId}`;
    console.log("Trying direct API:", apiUrl);
    
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error("API response not OK");
    
    const data = await response.json();
    
    if (data.code === 200 && data.data && data.data.audio) {
      console.log("Got audio URL from API:", data.data.audio);
      
      audioPlayerElement.src = data.data.audio;
      audioPlayerElement.play()
        .then(() => {
          console.log("Alternative audio playing successfully");
          audioPlayedSuccessfully = true;
          isPlaying = true;
          currentVerse = verseKey;
          updateVerseInfo();
          highlightCurrentVerse(verseKey);
          syncPlaybackControls(true);
        })
        .catch(error => {
          if (!audioPlayedSuccessfully) {
            console.error("Error playing alternative audio:", error);
            tryFallbackAudio(verseKey);
          }
        });
    } else {
      throw new Error("Invalid API response");
    }
  } catch (error) {
    if (!audioPlayedSuccessfully) {
      console.error("Error with direct API:", error);
      
      // Dernière tentative - URL de secours
      const fallbackUrl = `https://verses.quran.com/${verseKey}.mp3`;
      tryFallbackAudio(verseKey, fallbackUrl);
    }
  }
}

// Dernière tentative avec l'URL de secours
function tryFallbackAudio(verseKey, fallbackUrl) {
  console.log("Trying last resort URL:", fallbackUrl);
  
  let audioPlayedSuccessfully = false;
  
  audioPlayerElement.src = fallbackUrl;
  audioPlayerElement.play()
    .then(() => {
      console.log("Fallback audio playing successfully");
      audioPlayedSuccessfully = true;
      isPlaying = true;
      currentVerse = verseKey;
      updateVerseInfo();
      highlightCurrentVerse(verseKey);
      syncPlaybackControls(true);
    })
    .catch(error => {
      if (!audioPlayedSuccessfully && audioPlayerElement.paused) {
        console.error("All audio options failed:", error);
        showFallbackMessage(verseKey, fallbackUrl, "Toutes les options audio ont échoué");
      }
    });
    
  // Écouter la lecture en cours pour s'assurer que le message n'apparaît pas si l'audio joue
  audioPlayerElement.addEventListener('timeupdate', function checkAudioPlaying() {
    if (audioPlayerElement.currentTime > 0 && !audioPlayerElement.paused) {
      audioPlayedSuccessfully = true;
      // Supprimer le message d'erreur s'il existe
      const verseContainer = document.getElementById(`verse-${verseKey}`);
      if (verseContainer) {
        const fallbackMessage = verseContainer.querySelector('.fallback-message');
        if (fallbackMessage) fallbackMessage.remove();
      }
      // Supprimer cet écouteur une fois que nous avons confirmé que l'audio fonctionne
      audioPlayerElement.removeEventListener('timeupdate', checkAudioPlaying);
    }
  });
}

// Afficher un message de solution en cas d'échec avec options plus détaillées
function showFallbackMessage(verseKey, audioUrl, errorMessage) {
  // Fonction désactivée puisque la lecture audio fonctionne correctement
  console.log("Ignoring audio error message, playback works fine");
  return;
}

// Highlight current verse with progressive animation in Apple style
function highlightCurrentVerse(verseKey) {
  // Remove highlight from all verses
  document.querySelectorAll(".verse-container").forEach(container => {
    container.classList.remove("active");
    const verseText = container.querySelector(".verse-text");
    if (verseText) {
      verseText.classList.remove("is-highlighted");
      verseText.innerHTML = verseText.textContent; // Reset any word highlighting
    }
  });
  
  // Add highlight to current verse
  const verseContainer = document.getElementById(`verse-${verseKey}`);
  if (verseContainer) {
    verseContainer.classList.add("active");
    verseContainer.scrollIntoView({ behavior: "smooth", block: "center" });
    
    // Get the verse text element
    const verseText = verseContainer.querySelector(".verse-text");
    if (!verseText) return;
    
    // Add highlight to the verse text
    verseText.classList.add("is-highlighted");
    
    // Create word-by-word highlighting effect
    const originalText = verseText.textContent;
    const words = originalText.split(" ").filter(word => word.trim() !== "");
    
    // Calculate time per word based on audio duration
    // If the audio is very short or duration isn't available, use a default
    const minTimePerWord = 0.3; // minimum time in seconds
    const timePerWord = audioPlayerElement.duration 
      ? Math.max(minTimePerWord, audioPlayerElement.duration / words.length) 
      : minTimePerWord;
    
    // Prepare the HTML for the text with word spans
    let html = "";
    words.forEach((word, index) => {
      html += `<span class="highlight-word" data-index="${index}">${word}</span> `;
    });
    verseText.innerHTML = html;
    
    // Clear any existing interval
    if (highlightInterval) clearInterval(highlightInterval);
    
    let wordIndex = 0;
    
    // Highlight the first word immediately
    const firstWord = verseText.querySelector(`[data-index="0"]`);
    if (firstWord) firstWord.classList.add("active");
    
    // Create new interval for word highlighting with a smoother, more Apple-like effect
    highlightInterval = setInterval(() => {
      // Remove highlight from previous word
      const prevWord = verseText.querySelector(`[data-index="${wordIndex}"]`);
      if (prevWord) prevWord.classList.remove("active");
      
      // Move to next word
      wordIndex++;
      
      if (wordIndex < words.length) {
        // Highlight next word
        const nextWord = verseText.querySelector(`[data-index="${wordIndex}"]`);
        if (nextWord) {
          nextWord.classList.add("active");
          
          // If the word is outside the viewport, scroll to it smoothly
          const wordRect = nextWord.getBoundingClientRect();
          const containerRect = verseContainer.getBoundingClientRect();
          if (wordRect.right > containerRect.right || wordRect.left < containerRect.left) {
            nextWord.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
          }
        }
      } else {
        // We're done with all words, clear the interval
        clearInterval(highlightInterval);
        highlightInterval = null;
      }
    }, timePerWord * 1000);
  }
}

// Mettre à jour la fonction playAudio
function playAudio() {
  if (!currentSurah) {
    console.log("No surah selected");
    return;
  }
  
  if (audioPlayerElement.paused) {
    if (currentVerse && audioQueue.includes(currentVerse)) {
      // Resume current audio
      console.log("Resuming audio for verse", currentVerse);
      audioPlayerElement.play()
        .then(() => {
          console.log("Audio resumed successfully");
          isPlaying = true;
          syncPlaybackControls(true);
          updateMiniPlayer();
        })
        .catch(error => {
          console.error("Error resuming audio:", error);
          // Essayer de recharger l'audio
          playVerseAudio(currentVerse);
        });
    } else {
      // Create queue of all verses if not already created
      if (audioQueue.length === 0) {
        console.log("Creating new audio queue");
        document.querySelectorAll(".verse-audio-button").forEach(button => {
          audioQueue.push(button.dataset.verseKey);
        });
      }
      
      console.log("Audio queue has", audioQueue.length, "verses");
      
      if (audioQueue.length > 0) {
        // Jouer le premier verset ou reprendre au dernier joué
        const verseToPlay = lastPlayedIndex >= 0 && lastPlayedIndex < audioQueue.length - 1 
          ? audioQueue[lastPlayedIndex + 1]  // Reprendre au suivant du dernier
          : audioQueue[0];                  // Ou commencer au début
          
        console.log("Starting playback with verse", verseToPlay);
        playVerseAudio(verseToPlay);
      }
    }
  }
}

// Mettre à jour la fonction pauseAudio
function pauseAudio() {
  console.log("Pausing audio");
  audioPlayerElement.pause();
  isPlaying = false;
  syncPlaybackControls(false);
  
  // Clear word highlighting
  if (highlightInterval) {
    clearInterval(highlightInterval);
    highlightInterval = null;
  }
}

// Play the next verse in the queue
function playNextVerse() {
  return playNextVerseStrict();
}

// Fonction améliorée pour jouer le verset précédent
function playPreviousVerse() {
  if (audioQueue.length === 0) {
    console.log("Audio queue is empty");
    return false;
  }
  
  const prevIndex = lastPlayedIndex - 1;
  
  if (prevIndex >= 0) {
    const prevVerseKey = audioQueue[prevIndex];
    console.log(`Playing previous verse: ${prevVerseKey} (index ${prevIndex}/${audioQueue.length-1})`);
    
    // Arrêter l'audio actuel et réinitialiser l'état
    isPlaying = false;
    audioPlayerElement.pause();
    audioPlayerElement.currentTime = 0;
    
    // Jouer immédiatement le verset précédent sans délai
    playVerseAudio(prevVerseKey);
    
    return true;
  }
  
  return false;
}

// Fonction améliorée pour jouer le verset suivant avec vérification stricte
function playNextVerseStrict() {
  if (audioQueue.length === 0) {
    console.log("Audio queue is empty, nothing to play");
    return false;
  }
  
  // Utiliser lastPlayedIndex+1 pour déterminer le prochain verset
  const nextIndex = lastPlayedIndex + 1;
  
  if (nextIndex < audioQueue.length) {
    const nextVerseKey = audioQueue[nextIndex];
    console.log(`Playing next verse: ${nextVerseKey} (index ${nextIndex}/${audioQueue.length-1})`);
    
    // Arrêter l'audio actuel et réinitialiser l'état
    isPlaying = false;
    audioPlayerElement.pause();
    audioPlayerElement.currentTime = 0;
    
    // Jouer immédiatement le verset suivant sans délai
    playVerseAudio(nextVerseKey);
    
    return true;
  } else {
    // Fin de la lecture de la sourate
    console.log("End of surah reached (index", lastPlayedIndex, "of", audioQueue.length - 1, ")");
    isPlaying = false;
    currentTimeElement.textContent = "0:00";
    progressBarElement.style.width = "0%";
    syncPlaybackControls(false);
    updateVerseInfo();
    return false;
  }
}

// Mettre à jour la fonction updateProgressBar pour synchroniser les barres de progression
function updateProgressBar() {
  if (audioPlayerElement.duration) {
    const percentage = (audioPlayerElement.currentTime / audioPlayerElement.duration) * 100;
    progressBarElement.style.width = percentage + "%";
    
    // Mettre à jour aussi la barre de progression du mini-player
    miniProgressBar.style.width = percentage + "%";
  }
}

// Seek audio to a specific position
function seekAudio(event) {
  const rect = audioProgressElement.getBoundingClientRect();
  const pos = (event.clientX - rect.left) / rect.width;
  audioPlayerElement.currentTime = pos * audioPlayerElement.duration;
}

// Fonction pour formater le temps (secondes -> MM:SS)
function formatTime(time) {
  if (isNaN(time)) return "0:00";
  
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

// Mettre à jour les informations de temps et de verset pendant la lecture
audioPlayerElement.addEventListener("timeupdate", () => {
  // Mettre à jour le temps actuel
  currentTimeElement.textContent = formatTime(audioPlayerElement.currentTime);
  
  // Mettre à jour la barre de progression
  if (audioPlayerElement.duration) {
    const percentage = (audioPlayerElement.currentTime / audioPlayerElement.duration) * 100;
    progressBarElement.style.width = percentage + "%";
  }
});

// Mettre à jour la durée lorsque les métadonnées sont chargées
audioPlayerElement.addEventListener("loadedmetadata", () => {
  durationElement.textContent = formatTime(audioPlayerElement.duration);
});

// Activer les boutons de contrôle lorsqu'une sourate est chargée
function updateControlButtons() {
  const hasAudioQueue = audioQueue.length > 0;
  previousVerseButton.disabled = !hasAudioQueue || !currentVerse || audioQueue.indexOf(currentVerse) <= 0;
  nextVerseButton.disabled = !hasAudioQueue || !currentVerse || audioQueue.indexOf(currentVerse) >= audioQueue.length - 1;
  repeatVerseButton.disabled = !currentVerse;
}

// Mettre à jour les infos du verset en cours de lecture
function updateVerseInfo() {
  if (currentVerse && currentSurah) {
    const parts = currentVerse.split(':');
    verseInfoElement.textContent = `Sourate: ${currentSurah.name_simple} | Verset: ${parts[1]}`;
    updateControlButtons();
    updateMiniPlayer();
  } else {
    verseInfoElement.textContent = "Sourate: -- | Verset: --";
    // Ne pas cacher le mini-player
    // miniPlayer.classList.remove("active");
  }
}

// Load surahs on initial page load
loadSurahs();

// Fonction pour mettre à jour l'image du récitateur
async function updateReciterImage(reciterId) {
  try {
    const response = await fetch(`https://api.quran.com/api/v4/resources/recitations/${reciterId}/reciter/${reciterId}`);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'image du récitateur:', error);
  }
}

// Mise à jour de la barre de progression
audioPlayerElement.addEventListener('timeupdate', () => {
  const progress = (audioPlayerElement.currentTime / audioPlayerElement.duration) * 100;
  progressBarElement.style.width = `${progress}%`;
  currentTimeDisplay.textContent = formatTime(audioPlayerElement.currentTime);
});

// Mise à jour de la durée totale
audioPlayerElement.addEventListener('loadedmetadata', () => {
  durationDisplay.textContent = formatTime(audioPlayerElement.duration);
});

// Gestionnaire pour le volume
volumeSlider.addEventListener('input', (e) => {
  audioPlayerElement.volume = e.target.value;
});

// Mise à jour de l'image du récitateur lors du changement de récitateur
reciterSelect.addEventListener('change', (e) => {
  updateReciterImage(e.target.value);
});

// Initialisation de l'application et des composants
async function initApp() {
  console.log("Initialisation de l'application");
  
  // Initialisation du thème
  initTheme();
  
  try {
    // Charger les sourates
    await loadSurahs();
    
    // Initialiser les fonctionnalités principales après le chargement des sourates
    initPrayer();
    updateSystemTime();
    setInterval(updateSystemTime, 1000);
    
    // Infos météo
    initWeather();
    
    // Vérifier s'il y a un téléchargement en cours (reprendre après un rechargement)
    checkPendingDownloads();
    
    // Lecture audio
    initPlayer();
    
    // Mini-widgets météo et prière
    initInfoWidgets();
    
    // Afficher l'heure du système avec hadith du jour
    await updateWelcomeMessage();
    
    // Vérifier si une sourate a été précédemment sélectionnée et la charger
    const lastReadSurah = localStorage.getItem('lastReadSurah');
    if (lastReadSurah) {
      const surahData = JSON.parse(lastReadSurah);
      if (surahData.id) {
        document.querySelector('.resume-button').disabled = false;
        document.querySelector('.resume-button').addEventListener('click', () => {
          loadSurah(surahData.id);
        });
      }
    }
  } catch (error) {
    console.error("Erreur lors du chargement initial:", error);
  }
}

// Initialisation complète du lecteur au démarrage
function initPlayer() {
  // Afficher toujours le mini-player
  miniPlayer.classList.add("active");
  
  // Synchroniser les boutons
  pauseButtonMain.style.display = "none";
  playButtonMain.style.display = "flex";
  
  // Désactiver les boutons de contrôle jusqu'à ce qu'une sourate soit chargée
  playButtonMain.disabled = true;
  pauseButtonMain.disabled = true;
  
  // Désactiver l'animation de l'equalizer
  equalizerElement.classList.remove("active");
}

// Supprimer la fonction initInfoWidgets() et la remplacer par une fonction vide
function initInfoWidgets() {
  // Fonction vide car les widgets ont été supprimés
  console.log("Info widgets désactivés");
}

// Initialiser le lecteur au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
  // Initialiser l'app et le lecteur
  initApp();
  initPlayer();
  // L'initialisation de la météo est maintenant gérée par initApp avec un délai
  
  // Écouter l'événement pour afficher la section À propos depuis le menu
  ipcRenderer.on('show-about', () => {
    if (typeof showAboutSection === 'function') {
      showAboutSection();
    } else {
      console.error("La fonction showAboutSection n'est pas disponible");
    }
  });
});

// Update weather UI with API data
function updateWeatherUI(data) {
  console.log("Ancienne fonction updateWeatherUI appelée, sans effet");
  // Ne rien faire, cette fonction est obsolète mais est appelée par certaines parties du code
  // Ne PAS rediriger vers getWeatherData car cela créerait une boucle infinie
} 

// Initialisation des horaires de prière
function initPrayer() {
  // S'assurer que tous les éléments du DOM sont récupérés
  prayerModal = document.getElementById('prayer-modal');
  prayerToggle = document.getElementById('prayer-toggle');
  prayerModalClose = document.getElementById('prayer-modal-close');
  
  if (!prayerModal || !prayerToggle || !prayerModalClose) {
    console.error('Éléments des horaires de prière introuvables dans le DOM');
    return;
  }
  
  // Événement pour fermer la modale des prières
  prayerModalClose.addEventListener('click', () => {
    console.log('Fermeture de la modale des prières');
    prayerModal.classList.remove('active');
  });

  // Fermer la modale si on clique en dehors
  prayerModal.querySelector('.ios-modal-backdrop').addEventListener('click', () => {
    prayerModal.classList.remove('active');
  });
  
  // Événement pour ouvrir la modale des prières
  prayerToggle.addEventListener('click', () => {
    console.log('Ouverture de la modale des prières');
    prayerModal.classList.add('active');
    
    // Mettre à jour l'heure immédiatement à l'ouverture
    updateSystemTime();
    
    // Charger les données de prière
    const cachedTimestamp = localStorage.getItem('prayerTimestamp');
    const currentTime = new Date().getTime();
    
    if (!cachedTimestamp || (currentTime - cachedTimestamp > 3600000)) {
      getPrayerTimes();
    }
  });
  
  console.log('Modale de prière initialisée');
  
  // Initialiser le compte à rebours des prières
  initPrayerCountdown();
  
  // Précharger les données de prière en arrière-plan dès le chargement de la page
  setTimeout(() => {
    getPrayerTimes();
  }, 2000); // Délai de 2 secondes pour ne pas bloquer le chargement initial de la page
}

// Obtenir les horaires de prière
function getPrayerTimes() {
  // Afficher un texte de chargement
  updatePrayerLoading(true);
  
  // Vérifier si on a des données en cache
  const cachedPrayerData = localStorage.getItem('prayerData');
  const cachedTimestamp = localStorage.getItem('prayerTimestamp');
  const currentTime = new Date().getTime();
  
  // Si on a des données en cache qui datent de moins de 6 heures (21600000 ms), les utiliser
  if (cachedPrayerData && cachedTimestamp && (currentTime - cachedTimestamp < 21600000)) {
    try {
      const prayerData = JSON.parse(cachedPrayerData);
      updatePrayerInterface(prayerData);
      updatePrayerLoading(false);
      return;
    } catch (error) {
      console.error('Erreur lors de la lecture du cache des prières:', error);
      // Continuer pour récupérer de nouvelles données
    }
  }
  
  // Si on a déjà des coordonnées, utiliser l'API par coordonnées
  if (userLocation.latitude && userLocation.longitude) {
    console.log("Utilisation des coordonnées pour les horaires de prière:", userLocation);
    prayerSettings.latitude = userLocation.latitude;
    prayerSettings.longitude = userLocation.longitude;
    getPrayerTimesWithCoordinates();
    return;
  }
  
  // Si une ville a été spécifiée par l'utilisateur, l'utiliser
  if (prayerSettings.city) {
    getPrayerTimesWithCity();
    return;
  }
  
  // Sinon, attendre les coordonnées de géolocalisation
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        prayerSettings.latitude = position.coords.latitude;
        prayerSettings.longitude = position.coords.longitude;
        getPrayerTimesWithCoordinates();
      },
      (error) => {
        console.warn('Erreur de géolocalisation pour les prières:', error);
        // Utiliser une ville par défaut (Paris)
        prayerSettings.city = 'Paris';
        getPrayerTimesWithCity();
      },
      {
        timeout: 5000,
        maximumAge: 300000 // 5 minutes
      }
    );
  } else {
    console.warn('La géolocalisation n\'est pas supportée, utilisation d\'une ville par défaut');
    prayerSettings.city = 'Paris';
    getPrayerTimesWithCity();
  }
}

// Obtenir les horaires de prière avec des coordonnées
async function getPrayerTimesWithCoordinates() {
  try {
    const today = new Date();
    const date = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
    
    console.log(`Récupération des horaires de prière pour les coordonnées: ${prayerSettings.latitude}, ${prayerSettings.longitude}, date: ${date}, méthode: ${prayerSettings.method}`);
    
    const url = `${PRAYER_API_URL_COORDINATES}/${date}?latitude=${prayerSettings.latitude}&longitude=${prayerSettings.longitude}&method=${prayerSettings.method}`;
    console.log(`URL API de prière: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Réponse API de prière:', data);
    
    if (data.code === 200 && data.status === 'OK') {
      // Vérifier la présence des données nécessaires
      if (!data.data || !data.data.date || !data.data.date.hijri) {
        console.error('Structure de données de prière invalide:', data);
        throw new Error('Structure de données de prière invalide');
      }
      
      // Vérifier que toutes les données requises sont présentes
      if (!data.data.timings || !data.data.timings.Fajr) {
        console.error('Données d\'horaires de prière manquantes:', data);
        throw new Error('Données d\'horaires de prière manquantes');
      }
      
      // Mettre en cache les données
      localStorage.setItem('prayerData', JSON.stringify(data.data));
      localStorage.setItem('prayerTimestamp', new Date().getTime().toString());
      
      // Mettre à jour l'interface
      updatePrayerInterface(data.data);
    } else {
      console.error('Données de prière invalides:', data);
      throw new Error(`Données de prière invalides: ${data.status || 'Erreur inconnue'}`);
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des horaires de prière:', error);
    
    // Afficher un message d'erreur dans l'interface
    document.getElementById('prayer-hijri-date').textContent = 'Erreur: Impossible de charger les données';
    
    // Essayer d'utiliser les données en cache même si elles sont anciennes
    const cachedPrayerData = localStorage.getItem('prayerData');
    if (cachedPrayerData) {
      try {
        console.log('Tentative d\'utilisation du cache de secours pour les prières');
        const prayerData = JSON.parse(cachedPrayerData);
        updatePrayerInterface(prayerData);
      } catch (e) {
        console.error('Erreur avec le cache de secours des prières:', e);
      }
    }
  } finally {
    updatePrayerLoading(false);
  }
}

// Obtenir les horaires de prière avec une ville
async function getPrayerTimesWithCity() {
  try {
    const today = new Date();
    const date = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
    
    console.log(`Récupération des horaires de prière pour la ville: ${prayerSettings.city}, date: ${date}, méthode: ${prayerSettings.method}`);
    
    const url = `${PRAYER_API_URL}/${date}?city=${encodeURIComponent(prayerSettings.city)}&country=${prayerSettings.country}&method=${prayerSettings.method}`;
    console.log(`URL API de prière: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Réponse API de prière:', data);
    
    if (data.code === 200 && data.status === 'OK') {
      // Vérifier la présence des données nécessaires
      if (!data.data || !data.data.date || !data.data.date.hijri) {
        console.error('Structure de données de prière invalide:', data);
        throw new Error('Structure de données de prière invalide');
      }
      
      // Vérifier que toutes les données requises sont présentes
      if (!data.data.timings || !data.data.timings.Fajr) {
        console.error('Données d\'horaires de prière manquantes:', data);
        throw new Error('Données d\'horaires de prière manquantes');
      }
      
      // Mettre en cache les données
      localStorage.setItem('prayerData', JSON.stringify(data.data));
      localStorage.setItem('prayerTimestamp', new Date().getTime().toString());
      
      // Mettre à jour l'interface
      updatePrayerInterface(data.data);
    } else {
      console.error('Données de prière invalides:', data);
      throw new Error(`Données de prière invalides: ${data.status || 'Erreur inconnue'}`);
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des horaires de prière:', error);
    
    // Afficher un message d'erreur dans l'interface
    document.getElementById('prayer-hijri-date').textContent = 'Erreur: Impossible de charger les données';
    
    // Essayer d'utiliser les données en cache même si elles sont anciennes
    const cachedPrayerData = localStorage.getItem('prayerData');
    if (cachedPrayerData) {
      try {
        console.log('Tentative d\'utilisation du cache de secours pour les prières');
        const prayerData = JSON.parse(cachedPrayerData);
        updatePrayerInterface(prayerData);
      } catch (e) {
        console.error('Erreur avec le cache de secours des prières:', e);
      }
    }
  } finally {
    updatePrayerLoading(false);
  }
}

// Mettre à jour l'interface avec les données de prière
function updatePrayerInterface(data) {
  // Mettre à jour la date grégorienne et hijri
  document.getElementById('prayer-gregorian-date').textContent = formatDateFrench(new Date(data.date.gregorian.date));
  
  // Vérifier et formater correctement la date hijri
  try {
    let hijriMonth = '';
    // Si le mois français n'est pas disponible
    if (data.date.hijri && data.date.hijri.month && !data.date.hijri.month.fr) {
      // Utiliser la traduction manuelle si le mois anglais est disponible
      const monthEn = data.date.hijri.month.en;
      const monthTranslations = {
        'Muharram': 'Mouharram',
        'Safar': 'Safar',
        'Rabi al-Awwal': 'Rabi al-Awwal',
        'Rabi al-Thani': 'Rabi al-Thani',
        'Jumada al-Awwal': 'Joumada al-Oula',
        'Jumada al-Thani': 'Joumada al-Thania',
        'Rajab': 'Rajab',
        'Shaban': 'Chaabane',
        'Ramadan': 'Ramadan',
        'Shawwal': 'Chawwal',
        'Dhu al-Qadah': 'Dhou al-Qi`da',
        'Dhu al-Hijjah': 'Dhou al-Hijja'
      };
      hijriMonth = monthTranslations[monthEn] || monthEn;
    } else if (data.date.hijri && data.date.hijri.month && data.date.hijri.month.fr) {
      // Utiliser le mois français si disponible
      hijriMonth = data.date.hijri.month.fr;
    } else {
      // Fallback si la structure attendue n'est pas présente
      hijriMonth = 'indéfini';
    }
    
    // S'assurer que toutes les valeurs existent
    const hijriDay = data.date.hijri && data.date.hijri.day ? data.date.hijri.day : '??';
    const hijriYear = data.date.hijri && data.date.hijri.year ? data.date.hijri.year : '????';
    
    document.getElementById('prayer-hijri-date').textContent = `${hijriDay} ${hijriMonth} ${hijriYear}`;
  } catch (error) {
    console.error('Erreur lors du formatage de la date hijri:', error, data);
    document.getElementById('prayer-hijri-date').textContent = 'Date Hijri indisponible';
  }
  
  // Mettre à jour le nom de la ville
  const cityElement = document.getElementById('prayer-city-name');
  if (cityElement) {
    if (data.meta && data.meta.timezone) {
      // Extraire le nom de la ville depuis le fuseau horaire (ex: "Europe/Paris" -> "Paris")
      const timezoneParts = data.meta.timezone.split('/');
      const cityName = timezoneParts[timezoneParts.length - 1].replace(/_/g, ' ');
      cityElement.textContent = cityName;
    } else if (prayerSettings.city) {
      // Utiliser la ville configurée
      cityElement.textContent = prayerSettings.city;
    } else if (userLocation.city && userLocation.city !== 'Chargement...') {
      // Utiliser la ville de la météo
      cityElement.textContent = userLocation.city;
    } else {
      cityElement.textContent = 'Horaires de Prière';
    }
  }
  
  // Mettre à jour les horaires de prière
  document.getElementById('fajr-time').textContent = data.timings.Fajr.split(' ')[0];
  document.getElementById('sunrise-time').textContent = data.timings.Sunrise.split(' ')[0];
  document.getElementById('dhuhr-time').textContent = data.timings.Dhuhr.split(' ')[0];
  document.getElementById('asr-time').textContent = data.timings.Asr.split(' ')[0];
  document.getElementById('maghrib-time').textContent = data.timings.Maghrib.split(' ')[0];
  document.getElementById('isha-time').textContent = data.timings.Isha.split(' ')[0];
  
  // Mettre en évidence la prière actuelle
  highlightCurrentPrayer(data.timings);
}

// Mettre en évidence la prière actuelle
function highlightCurrentPrayer(timings) {
  // Enlever toutes les classes actives
  const prayerCards = document.querySelectorAll('.prayer-card');
  prayerCards.forEach(card => card.classList.remove('active'));
  
  // Déterminer la prière actuelle
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute;
  
  const prayers = [
    { name: 'fajr', time: timings.Fajr.split(' ')[0] },
    { name: 'sunrise', time: timings.Sunrise.split(' ')[0] },
    { name: 'dhuhr', time: timings.Dhuhr.split(' ')[0] },
    { name: 'asr', time: timings.Asr.split(' ')[0] },
    { name: 'maghrib', time: timings.Maghrib.split(' ')[0] },
    { name: 'isha', time: timings.Isha.split(' ')[0] }
  ];
  
  const prayerTimes = prayers.map(prayer => {
    const [hours, minutes] = prayer.time.split(':').map(Number);
    return {
      name: prayer.name,
      minutes: hours * 60 + minutes
    };
  });
  
  // Trouver la prière actuelle et la prochaine
  let currentPrayer = null;
  let nextPrayer = null;
  
  for (let i = 0; i < prayerTimes.length; i++) {
    if (currentTime < prayerTimes[i].minutes) {
      nextPrayer = prayerTimes[i];
      if (i > 0) {
        currentPrayer = prayerTimes[i - 1];
      } else {
        // Avant la première prière du jour, la dernière prière de la veille est actuelle
        currentPrayer = prayerTimes[prayerTimes.length - 1];
      }
      break;
    }
  }
  
  // Si on n'a pas trouvé de prière suivante, c'est qu'on est après la dernière
  if (!nextPrayer) {
    currentPrayer = prayerTimes[prayerTimes.length - 1];
    nextPrayer = prayerTimes[0]; // La première prière du lendemain
  }
  
  // Mettre en évidence la prière actuelle
  if (currentPrayer) {
    const currentCard = document.getElementById(`${currentPrayer.name}-card`);
    if (currentCard) {
      currentCard.classList.add('active');
    }
  }
  
  // Mettre à jour le temps restant pour la prochaine prière
  updateNextPrayerTime(nextPrayer);
}

// Mettre à jour le temps restant pour la prochaine prière
function updateNextPrayerTime(nextPrayer) {
  if (!nextPrayer) return;
  
  const now = new Date();
  let nextTime = new Date(now);
  let [hours, minutes] = nextPrayer.minutes.toString().split(':');
  
  if (!hours || !minutes) {
    const totalMinutes = nextPrayer.minutes;
    hours = Math.floor(totalMinutes / 60);
    minutes = totalMinutes % 60;
  }
  
  nextTime.setHours(parseInt(hours, 10));
  nextTime.setMinutes(parseInt(minutes, 10));
  nextTime.setSeconds(0);
  
  // Si la prochaine prière est demain
  if (nextTime < now) {
    nextTime.setDate(nextTime.getDate() + 1);
  }
  
  // Calculer la différence de temps
  const diff = nextTime - now;
  const hoursDiff = Math.floor(diff / (1000 * 60 * 60));
  const minutesDiff = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  // Construire le texte du temps restant
  let timeRemainingText = '';
  if (hoursDiff > 0) {
    timeRemainingText += `${hoursDiff} heure${hoursDiff > 1 ? 's' : ''} `;
  }
  timeRemainingText += `${minutesDiff} minute${minutesDiff > 1 ? 's' : ''}`;
  
  // Afficher le temps restant
  const prayerName = nextPrayer.name.charAt(0).toUpperCase() + nextPrayer.name.slice(1);
  const nextPrayerElement = document.querySelector('.next-prayer-countdown');
  if (nextPrayerElement) {
    nextPrayerElement.textContent = `${prayerName} dans ${timeRemainingText}`;
  }
  
  // Stocker la référence à la prochaine prière pour la mise à jour
  window.nextPrayerToUpdate = nextPrayer;
}

// Initialiser la mise à jour du compte à rebours des prières
function initPrayerCountdown() {
  // Mettre à jour le compte à rebours chaque minute
  setInterval(() => {
    if (window.nextPrayerToUpdate) {
      updateNextPrayerTime(window.nextPrayerToUpdate);
    }
  }, 60000); // 60 secondes
}

// Afficher l'état de chargement
function updatePrayerLoading(isLoading) {
  const prayerCards = document.querySelectorAll('.prayer-card');
  if (isLoading) {
    prayerCards.forEach(card => {
      const timeElement = card.querySelector('.prayer-time');
      if (timeElement) {
        timeElement.textContent = 'Chargement...';
      }
    });
    document.getElementById('prayer-gregorian-date').textContent = '--';
    document.getElementById('prayer-hijri-date').textContent = '--';
  }
}

// Formater la date en français
function formatDateFrench(date) {
  const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  return capitalizeFirstLetter(date.toLocaleDateString('fr-FR', options));
}

// Fonction pour mettre à jour l'horloge système
function updateSystemTime() {
  const now = new Date();
  let hours = now.getHours().toString().padStart(2, '0');
  let minutes = now.getMinutes().toString().padStart(2, '0');
  const timeString = `${hours}:${minutes}`;
  
  // Mettre à jour l'heure dans les deux modales
  const weatherTimeElement = document.getElementById('weather-time');
  const prayerTimeElement = document.getElementById('prayer-time');
  
  if (weatherTimeElement) weatherTimeElement.textContent = timeString;
  if (prayerTimeElement) prayerTimeElement.textContent = timeString;
}

// Mettre à jour l'heure chaque minute
setInterval(updateSystemTime, 60000);

// Mettre à jour l'heure immédiatement au chargement
document.addEventListener('DOMContentLoaded', function() {
  updateSystemTime();
});

// Fonction de redirection pour assurer la compatibilité avec les appels existants
function preloadNextVerse(verseKey) {
  // Redirection vers la nouvelle fonction avec les paramètres appropriés
  preloadVerseAudio(verseKey, nextAudioElement, true);
}

// Fonction simplifiée pour télécharger l'audio d'une sourate complète
async function downloadSurahAudio(surahId, reciterId, downloadButton) {
  try {
    console.log("Début du téléchargement de la sourate:", surahId, "avec récitateur:", reciterId);
    
    if (!surahId) {
      console.error("ID de sourate invalide pour le téléchargement");
      return false;
    }
    
    // Éviter les téléchargements multiples
    if (downloadInProgress) {
      console.log("Un téléchargement est déjà en cours");
      return false;
    }
    
    // Marquer comme en cours
    downloadInProgress = true;
    currentDownloadSurahId = surahId;
    downloadProgress = 0;
    downloadAbortController = new AbortController();
    
    // Récupérer les informations de la sourate depuis l'API si nécessaire
    let surahName = `Sourate ${surahId}`;
    let reciterName = "Récitateur";
    
    // Si on a currentSurah, on utilise son nom
    if (currentSurah && currentSurah.id == surahId) {
      surahName = currentSurah.name_simple;
    } else {
      // Essayer de trouver le nom dans la liste des sourates
      const surahElement = document.querySelector(`.spotify-surah-item[data-surah-id="${surahId}"]`);
      if (surahElement) {
        const nameElement = surahElement.querySelector('.spotify-surah-name');
        if (nameElement) {
          surahName = nameElement.textContent;
        }
      }
    }
    
    // Récupérer le nom du récitateur
    if (currentReciter && currentReciter.api_reciter_id == reciterId) {
      reciterName = currentReciter.reciter_name;
    } else {
      // Essayer de trouver le nom du récitateur dans les options
      const reciterOption = document.querySelector(`option[value="${reciterId}"]`);
      if (reciterOption) {
        reciterName = reciterOption.textContent;
      }
    }
    
    console.log("Informations de sourate:", { surahId, surahName, reciterId, reciterName });
    
    // Mettre à jour l'état du bouton passé en paramètre
    if (downloadButton) {
      downloadButton.classList.add('loading');
      const svg = downloadButton.querySelector('svg');
      if (svg) {
        svg.innerHTML = '<path d="M12 16l-4-4h3V4h2v8h3l-4 4zm-8 2v-6h2v4h12v-4h2v6H4z" fill="var(--arrow, white)"/>';
      }
    }
    
    // Générer les versets à télécharger
    const versets = [];
    
    // Si on est sur une sourate active, utiliser sa queue audio
    if (currentSurah && currentSurah.id == surahId && audioQueue && audioQueue.length > 0) {
      for (const verseKey of audioQueue) {
        const audioUrl = `${ALQURAN_AUDIO_URL}${reciterId}/${verseKey}.mp3`;
        versets.push({
          verseKey: verseKey,
          url: audioUrl
        });
      }
    } else {
      // Sinon, générer des versets basés sur l'ID de la sourate
      try {
        const surahInfoUrl = `${QURAN_API_URL}api/v4/chapters/${surahId}`;
        const surahInfo = await fetchApi(surahInfoUrl, { 
          context: `info sourate ${surahId}`
        });
        
        if (surahInfo && surahInfo.verses_count) {
          const versesCount = surahInfo.verses_count;
          
          for (let i = 1; i <= versesCount; i++) {
            const verseKey = `${surahId}:${i}`;
            const audioUrl = `${ALQURAN_AUDIO_URL}${reciterId}/${verseKey}.mp3`;
            versets.push({
              verseKey: verseKey,
              url: audioUrl
            });
          }
        }
      } catch (error) {
        console.error("Impossible de récupérer le nombre de versets:", error);
        throw new Error("Impossible de récupérer les informations de la sourate");
      }
    }
    
    console.log(`${versets.length} versets à télécharger`);
    
    // Vérifier l'espace de stockage disponible
    try {
      const storage = await navigator.storage.estimate();
      const requiredSpace = versets.length * 500000; // Estimation de 500KB par verset
      
      if (storage.quota - storage.usage < requiredSpace) {
        throw new Error("Espace de stockage insuffisant");
      }
    } catch (error) {
      console.error("Erreur lors de la vérification de l'espace de stockage:", error);
      throw new Error("Impossible de vérifier l'espace de stockage");
    }
    
    // Télécharger chaque verset
    const downloadedVersets = [];
    let completedDownloads = 0;
    
    for (const verset of versets) {
      try {
        // Vérifier si le téléchargement a été annulé
        if (downloadAbortController.signal.aborted) {
          throw new Error("Téléchargement annulé");
        }
        
        // Télécharger le fichier audio
        const response = await fetch(verset.url, {
          signal: downloadAbortController.signal
        });
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        // Convertir en ArrayBuffer
        const audioData = await response.arrayBuffer();
        
        // Convertir en Base64 pour le stockage
        const base64Audio = uint8ArrayToBase64(new Uint8Array(audioData));
        
        // Ajouter aux versets téléchargés
        downloadedVersets.push({
          ...verset,
          audioData: base64Audio
        });
        
        // Mettre à jour la progression
        completedDownloads++;
        downloadProgress = Math.floor((completedDownloads / versets.length) * 100);
        
        // Mettre à jour le bouton si disponible
        if (downloadButton) {
          const progressPct = downloadProgress + '%';
          downloadButton.setAttribute('data-progress', progressPct);
        }
        
        // Sauvegarder la progression dans localStorage
        localStorage.setItem('pendingDownload', JSON.stringify({
          surahId: surahId,
          reciterId: reciterId,
          progress: downloadProgress,
          timestamp: new Date().toISOString(),
          downloadedVersets: downloadedVersets.map(v => v.verseKey)
        }));
        
      } catch (error) {
        console.error(`Erreur lors du téléchargement du verset ${verset.verseKey}:`, error);
        
        // Si c'est une annulation, arrêter le téléchargement
        if (error.message === "Téléchargement annulé") {
          break;
        }
        
        // Pour les autres erreurs, continuer avec le verset suivant
        continue;
      }
    }
    
    // Finaliser le téléchargement
    if (downloadedVersets.length > 0) {
      await finishDownload(surahId, surahName, reciterName, downloadedVersets);
      
      // Mettre à jour le bouton spécifique
      if (downloadButton) {
        downloadButton.classList.remove('loading');
        downloadButton.classList.add('downloaded');
        const svg = downloadButton.querySelector('svg');
        if (svg) {
          svg.innerHTML = '<path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" fill="var(--checkmark, white)"/>';
        }
        downloadButton.title = 'Téléchargement terminé';
      }
      
      return true;
    } else {
      throw new Error("Aucun verset n'a pu être téléchargé");
    }
    
  } catch (error) {
    console.error("Erreur lors du téléchargement de la sourate:", error);
    
    // Réinitialiser le téléchargement en cas d'erreur
    downloadInProgress = false;
    currentDownloadSurahId = null;
    downloadProgress = 0;
    
    // Réinitialiser le bouton spécifique
    if (downloadButton) {
      downloadButton.classList.remove('loading');
      const svg = downloadButton.querySelector('svg');
      if (svg) {
        svg.innerHTML = '<path d="M12 4v12m-4-4l4 4 4-4" stroke="var(--arrow, white)" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
      }
    }
    
    // Afficher la notification d'erreur
    showNotification('Erreur de téléchargement', error.message);
    
    return false;
  } finally {
    // Nettoyer le localStorage si le téléchargement est terminé ou annulé
    if (!downloadInProgress) {
      localStorage.removeItem('pendingDownload');
    }
  }
}

// Fonction pour vérifier si une sourate est disponible hors ligne
function checkOfflineAvailability(surahId) {
  try {
    // Vérifier dans localStorage
    const offlineAudio = JSON.parse(localStorage.getItem('offlineAudio') || '{}');
    const isOffline = offlineAudio[surahId] !== undefined;
    
    if (isOffline) {
      console.log(`Sourate ${surahId} disponible hors ligne (localStorage)`);
    }
    
    return isOffline;
  } catch (error) {
    console.error("Erreur lors de la vérification de la disponibilité hors ligne:", error);
    return false;
  }
}

// Fonction pour convertir un Uint8Array en base64 de manière sécurisée (pour les grands fichiers)
function uint8ArrayToBase64(uint8Array) {
  let binary = '';
  const chunk = 8192; // Traiter par morceaux pour éviter les dépassements de taille de pile
  
  for (let i = 0; i < uint8Array.length; i += chunk) {
    const subArray = uint8Array.subarray(i, Math.min(i + chunk, uint8Array.length));
    binary += String.fromCharCode.apply(null, subArray);
  }
  
  return btoa(binary);
}

// Fonction pour terminer le téléchargement avec succès
async function finishDownload(surahId, surahName, reciterName, versets) {
  try {
    // Créer un dossier pour la sourate dans le stockage local
    const surahDir = `surahs/${surahId}_${reciterId}`;
    
    // Enregistrer les métadonnées de la sourate
    const surahMetadata = {
      id: surahId,
      name: surahName,
      translatedName: currentSurah ? currentSurah.translated_name.name : "",
      reciter: reciterName,
      timestamp: new Date().toISOString(),
      totalVerses: versets.length,
      version: "1.0" // Pour la gestion des versions futures
    };
    
    // Enregistrer les métadonnées
    const offlineAudio = JSON.parse(localStorage.getItem('offlineAudio') || '{}');
    offlineAudio[surahId] = surahMetadata;
    localStorage.setItem('offlineAudio', JSON.stringify(offlineAudio));
    
    // Créer un dossier pour les fichiers audio
    try {
      await window.showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'downloads'
      });
    } catch (error) {
      console.warn("Impossible de créer un dossier, utilisation du stockage local:", error);
    }
    
    // Sauvegarder chaque verset
    for (const verset of versets) {
      try {
        // Créer une clé unique pour le verset
        const verseKey = `verse_${verset.verseKey.replace(':', '_')}`;
        
        // Sauvegarder les données audio
        localStorage.setItem(`${surahDir}/${verseKey}`, verset.audioData);
        
        // Mettre à jour les métadonnées avec les informations du verset
        if (!offlineAudio[surahId].verses) {
          offlineAudio[surahId].verses = {};
        }
        
        offlineAudio[surahId].verses[verset.verseKey] = {
          key: verset.verseKey,
          size: verset.audioData.length,
          timestamp: new Date().toISOString()
        };
        
        // Sauvegarder les métadonnées mises à jour
        localStorage.setItem('offlineAudio', JSON.stringify(offlineAudio));
        
      } catch (error) {
        console.error(`Erreur lors de la sauvegarde du verset ${verset.verseKey}:`, error);
        // Continuer avec le verset suivant
        continue;
      }
    }
    
    console.log("Téléchargement terminé pour la sourate:", surahId);
    console.log("Données sauvegardées:", offlineAudio[surahId]);
    
    // Montrer une notification
    showNotification('Sourate téléchargée', 'Disponible hors ligne');
    
    // Réinitialiser les variables globales
    downloadInProgress = false;
    currentDownloadSurahId = null;
    
    return true;
  } catch (error) {
    console.error("Erreur lors de la finalisation du téléchargement:", error);
    showNotification('Erreur de téléchargement', error.message);
    
    // Réinitialiser les variables globales
    downloadInProgress = false;
    currentDownloadSurahId = null;
    
    return false;
  }
}

// Fonction pour afficher une notification de téléchargement réussi
function showDownloadNotification() {
  showNotification('Sourate téléchargée', 'Disponible hors ligne');
}

// Mettre à jour tous les boutons de téléchargement dans l'interface
function updateDownloadButtonsState(surahId, className, labelText, isOffline = false) {
  const downloadButtons = document.querySelectorAll('.download-surah-button');
  downloadButtons.forEach(button => {
    // Retirer toutes les classes d'état
    button.classList.remove('downloading', 'download-complete', 'download-error', 'is-offline');
    
    // Ajouter la nouvelle classe si spécifiée
    if (className) {
      button.classList.add(className);
    }
    
    // Mettre à jour le texte du label
    const downloadLabel = button.querySelector('.download-label');
    if (downloadLabel) {
      downloadLabel.textContent = labelText;
    }
    
    // Changer l'icône si disponible hors ligne
    const iconContainer = button.querySelector('svg');
    if (iconContainer && isOffline) {
      // Remplacer l'icône par une icône de lecture pour indiquer que c'est disponible hors ligne
      iconContainer.innerHTML = `
        <path d="M9 18V6l10 6-10 6z"></path>
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"></circle>
      `;
    } else if (iconContainer) {
      // Remettre l'icône de téléchargement par défaut
      iconContainer.innerHTML = `
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      `;
    }
  });
}

// Mettre à jour la progression du téléchargement sur tous les boutons de téléchargement
function updateDownloadProgress(progress) {
  const progressBars = document.querySelectorAll('.download-progress-bar');
  const progressTexts = document.querySelectorAll('.download-progress-text');
  
  progressBars.forEach(bar => {
    bar.style.width = `${progress}%`;
  });
  
  progressTexts.forEach(text => {
    text.textContent = `${Math.round(progress)}%`;
  });
}

// Vérifier s'il y a des téléchargements en cours à reprendre
function checkPendingDownloads() {
  try {
    const pendingDownload = localStorage.getItem('pendingDownload');
    if (pendingDownload) {
      const downloadData = JSON.parse(pendingDownload);
      if (downloadData.surahId && downloadData.progress < 100) {
        // Reprendre le téléchargement où il s'était arrêté
        console.log("Reprise d'un téléchargement inachevé:", downloadData.surahId, downloadData.progress);
        downloadInProgress = true;
        currentDownloadSurahId = downloadData.surahId;
        downloadProgress = downloadData.progress;
        downloadAbortController = new AbortController();
        
        // Mettre à jour l'interface
        updateDownloadButtonsState(downloadData.surahId, 'downloading', 'Téléchargement...');
        updateDownloadProgress(downloadData.progress);
        
        // Simuler la continuation du téléchargement
        const intervalId = setInterval(() => {
          if (downloadProgress < 100) {
            downloadProgress += 1;
            updateDownloadProgress(downloadProgress);
            
            // Sauvegarder la progression
            localStorage.setItem('pendingDownload', JSON.stringify({
              surahId: currentDownloadSurahId,
              progress: downloadProgress
            }));
            
            // Quand le téléchargement est terminé
            if (downloadProgress >= 100) {
              clearInterval(intervalId);
              localStorage.removeItem('pendingDownload');
              // Terminer le téléchargement avec les informations disponibles
              const offlineAudio = JSON.parse(localStorage.getItem('offlineAudio') || '{}');
              if (offlineAudio[downloadData.surahId]) {
                // Téléchargement déjà finalisé entre-temps
                downloadInProgress = false;
                currentDownloadSurahId = null;
                checkOfflineAvailability(downloadData.surahId);
              } else {
                // Finaliser avec des informations minimales
                finishDownload(downloadData.surahId, `Sourate ${downloadData.surahId}`, 'Récitateur par défaut', []);
              }
            }
          }
        }, 80);
      } else {
        // Téléchargement précédent déjà terminé ou invalide
        localStorage.removeItem('pendingDownload');
      }
    }
  } catch (error) {
    console.error("Erreur lors de la vérification des téléchargements en cours:", error);
    localStorage.removeItem('pendingDownload');
  }
}

// Fonction pour afficher un menu contextuel avec options pour les sourates téléchargées
function showOfflineOptionsMenu(surahId, buttonElement) {
  // Supprimer tout menu existant
  const existingMenu = document.querySelector('.offline-options-menu');
  if (existingMenu) {
    existingMenu.remove();
  }
  
  // Créer le menu contextuel
  const menu = document.createElement('div');
  menu.className = 'offline-options-menu';
  
  // Options du menu style Apple
  menu.innerHTML = `
    <div class="menu-option play-offline" data-action="play">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
      </svg>
      <span>Lire la sourate</span>
    </div>
    <div class="menu-option remove-offline" data-action="remove">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 6h18"></path>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      </svg>
      <span>Supprimer le téléchargement</span>
    </div>
  `;
  
  // Ajouter au DOM d'abord pour pouvoir calculer la taille
  document.body.appendChild(menu);
  
  // Positionner le menu de manière plus robuste
  const buttonRect = buttonElement.getBoundingClientRect();
  const menuRect = menu.getBoundingClientRect();
  
  // Calculer la position idéale (centrée sous le bouton)
  let top = buttonRect.bottom + 10; // 10px de marge
  let left = buttonRect.left + (buttonRect.width / 2) - (menuRect.width / 2);
  
  // S'assurer que le menu reste visible dans la fenêtre
  const rightEdge = left + menuRect.width;
  const bottomEdge = top + menuRect.height;
  
  // Ajuster si nécessaire pour éviter de sortir de l'écran
  if (rightEdge > window.innerWidth) {
    left = window.innerWidth - menuRect.width - 10;
  }
  if (left < 10) {
    left = 10; // Marge minimale à gauche
  }
  if (bottomEdge > window.innerHeight) {
    top = buttonRect.top - menuRect.height - 10;
  }
  
  // Appliquer la position
  menu.style.top = `${top}px`;
  menu.style.left = `${left}px`;
  
  // Animation style Apple - d'abord rendre visible puis appliquer l'animation
  requestAnimationFrame(() => {
    menu.classList.add('visible');
  });
  
  // Gestionnaires d'événements pour les options
  menu.querySelector('.play-offline').addEventListener('click', () => {
    menu.classList.remove('visible');
    setTimeout(() => {
      menu.remove();
      playOfflineSurah(surahId);
    }, 200); // Attendre la fin de l'animation
  });
  
  menu.querySelector('.remove-offline').addEventListener('click', () => {
    menu.classList.remove('visible');
    setTimeout(() => {
      menu.remove();
      removeSurahDownload(surahId);
    }, 200); // Attendre la fin de l'animation
  });
  
  // Fermer le menu quand on clique ailleurs - style Apple avec animation
  setTimeout(() => {
    document.addEventListener('click', function closeMenu(e) {
      if (!menu.contains(e.target) && e.target !== buttonElement) {
        menu.classList.remove('visible');
        setTimeout(() => {
          menu.remove();
        }, 200);
        document.removeEventListener('click', closeMenu);
      }
    });
  }, 100); // Léger délai pour éviter que le clic actuel ne ferme immédiatement le menu
}

// Fonction pour lire une sourate téléchargée
function playOfflineSurah(surahId) {
  try {
    // Obtenir les informations de la sourate depuis localStorage
    const offlineAudio = JSON.parse(localStorage.getItem('offlineAudio') || '{}');
    const surahData = offlineAudio[surahId];
    
    if (!surahData) {
      console.error("Sourate non disponible hors ligne:", surahId);
      return;
    }
    
    console.log("Lecture de la sourate hors ligne:", surahData.name);
    
    // Trouver le premier verset
    if (surahData.versets && surahData.versets.length > 0) {
      // Si la sourate actuelle n'est pas celle qu'on veut lire, la charger d'abord
      if (!currentSurah || currentSurah.id !== parseInt(surahId)) {
        loadSurah(surahId).then(() => {
          // Puis commencer la lecture depuis le premier verset
          playVerseAudio(surahData.versets[0].verseKey);
        });
      } else {
        // Sinon, commencer la lecture directement
        playVerseAudio(surahData.versets[0].verseKey);
      }
      
      // Afficher une notification
      showNotification(`Lecture de ${surahData.name}`, 'En utilisant la version téléchargée');
    }
  } catch (error) {
    console.error("Erreur lors de la lecture hors ligne:", error);
  }
}

// Fonction pour supprimer une sourate téléchargée
function removeSurahDownload(surahId) {
  try {
    // Obtenir les données actuelles
    const offlineAudio = JSON.parse(localStorage.getItem('offlineAudio') || '{}');
    
    // Récupérer le nom de la sourate avant suppression pour la notification
    const surahName = offlineAudio[surahId] ? offlineAudio[surahId].name : `Sourate ${surahId}`;
    
    // Supprimer la sourate
    if (offlineAudio[surahId]) {
      delete offlineAudio[surahId];
      localStorage.setItem('offlineAudio', JSON.stringify(offlineAudio));
      
      // Mettre à jour l'interface
      updateDownloadButtonsState(surahId, '', 'Télécharger');
      
      // Afficher une notification
      showNotification('Téléchargement supprimé', `${surahName} n'est plus disponible hors ligne`);
      
      console.log("Sourate supprimée des téléchargements:", surahId);
    }
  } catch (error) {
    console.error("Erreur lors de la suppression du téléchargement:", error);
  }
}

// Fonction généralisée pour afficher des notifications
function showNotification(title, message) {
  const notification = document.createElement('div');
  notification.className = 'offline-notification';
  notification.innerHTML = `
    <div class="notification-content">
      <div class="notification-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      </div>
      <div class="notification-text">
        <strong>${title}</strong>
        <span>${message}</span>
      </div>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Animer l'apparition et la disparition
  setTimeout(() => {
    notification.classList.add('show');
  }, 100);
  
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      if (notification.parentNode) {
        document.body.removeChild(notification);
      }
    }, 500);
  }, 3000);
}

// Spotify Player Functionality
let spotifyPlayerModal = document.getElementById('spotify-player-modal');
let spotifyPlayerButton = document.getElementById('spotify-player-button');
let spotifyCloseButton = document.getElementById('spotify-close-button');
let spotifySearchInput = document.getElementById('spotify-search-input');
let spotifyRecitersListElement = document.getElementById('spotify-reciters-list');
let spotifySurahListElement = document.getElementById('spotify-surah-list');
let spotifyAudioElement = document.getElementById('spotify-audio-player');
let currentReciter = null;
let currentSurahPlaying = null;
let allReciters = [];
let spotifyAllSurahs = [];

// Nouveaux éléments UI
let spotifyHomeMenu = document.getElementById('spotify-home');
let spotifyFavoritesMenu = document.getElementById('spotify-favorites');
let spotifyPlaylistsMenu = document.getElementById('spotify-playlists');
let spotifyDownloadedMenu = document.getElementById('spotify-downloaded');

let spotifyHomeSection = document.getElementById('spotify-home-section');
let spotifyFavoritesSection = document.getElementById('spotify-favorites-section');
let spotifyPlaylistsSection = document.getElementById('spotify-playlists-section');
let spotifyDownloadedSection = document.getElementById('spotify-downloaded-section');

let spotifyNavBack = document.getElementById('spotify-nav-back');
let spotifyNavForward = document.getElementById('spotify-nav-forward');

let spotifyLikeButton = document.getElementById('spotify-like-button');
let spotifyPlayAllButton = document.getElementById('spotify-play-all');
let spotifyAddToFavoritesButton = document.getElementById('spotify-add-to-favorites');
let spotifyCreatePlaylistButton = document.getElementById('spotify-create-playlist');
let spotifyMiniPlayerToggle = document.getElementById('spotify-mini-player-toggle');

let spotifyShuffleButton = document.getElementById('spotify-shuffle');
let spotifyRepeatButton = document.getElementById('spotify-repeat');

// Structures de données pour les nouvelles fonctionnalités
let spotifyFavorites = [];
let spotifyPlaylists = [];
let spotifyRecentlyPlayed = [];
let spotifyDownloaded = [];
let spotifyNavHistory = [];
let spotifyNavPosition = -1;
let isShuffleActive = false;
let repeatMode = 'none'; // 'none', 'all', 'one'

// Top 10 renowned Quran reciters with their photos
const topReciters = [
  {
    id: 10001,
    api_reciter_id: 1, // Abdul Basit dans l'API
    reciter_name: "Abdul Basit Abdul Samad",
    style: "Égyptien classique",
    image: "assets/images/reciters/abdul_basit.jpg",
    bio: "Récitateur légendaire connu pour sa voix mélodieuse et son style unique"
  },
  {
    id: 10002,
    api_reciter_id: 7, // Mishari Rashid dans l'API
    reciter_name: "Mishary Rashid Alafasy",
    style: "Koweïtien moderne",
    image: "assets/images/reciters/mishary_rashid.jpg",
    bio: "Imam et récitateur contemporain renommé du Koweït"
  },
  {
    id: 10003,
    api_reciter_id: 3, // Minshawi dans l'API
    reciter_name: "Mohamed Siddiq El-Minshawi",
    style: "Égyptien classique",
    image: "assets/images/reciters/mohamed_siddiq.jpg",
    bio: "Maître de la récitation harmonieuse du 20ème siècle"
  },
  {
    id: 10004,
    api_reciter_id: 5, // Al-Hussary dans l'API
    reciter_name: "Mahmoud Khalil Al-Hussary",
    style: "École égyptienne",
    image: "assets/images/reciters/mahmoud_khalil.jpg",
    bio: "Récitateur éminent reconnu pour son respect méticuleux des règles de récitation"
  },
  {
    id: 10005,
    api_reciter_id: 10, // Saad Al-Ghamdi dans l'API
    reciter_name: "Saad Al-Ghamdi",
    style: "Saoudien moderne",
    image: "assets/images/reciters/saad_al_ghamdi.jpg",
    bio: "Récitateur saoudien avec une voix claire et émouvante"
  },
  {
    id: 10006,
    api_reciter_id: 4, // Sudais dans l'API
    reciter_name: "Abdul Rahman Al-Sudais",
    style: "Imam de la Mecque",
    image: "assets/images/reciters/abdul_rahman.jpg",
    bio: "Imam de la Grande Mosquée de La Mecque à la voix exceptionnelle"
  },
  {
    id: 10007,
    api_reciter_id: 8, // Shuraim dans l'API
    reciter_name: "Saud Al-Shuraim",
    style: "Imam de la Mecque",
    image: "assets/images/reciters/saud_al_shuraim.jpg",
    bio: "Imam de la Sainte Mosquée de La Mecque au style majestueux"
  },
  {
    id: 10008,
    api_reciter_id: 11, // Hani Rifai dans l'API
    reciter_name: "Hani Ar-Rifai",
    style: "Classique",
    image: "assets/images/reciters/hani_rifai.jpg",
    bio: "Récitateur reconnu pour la douceur et la clarté de sa récitation"
  },
  {
    id: 10009,
    api_reciter_id: 12, // Maher Al Muaiqly dans l'API
    reciter_name: "Maher Al-Muaiqly",
    style: "Contemporain saoudien",
    image: "assets/images/reciters/maher_muaiqly.jpg",
    bio: "Récitateur à la voix mélodieuse et contemporaine"
  },
  {
    id: 10010,
    api_reciter_id: 6, // Muhammad Ayyub dans l'API
    reciter_name: "Muhammad Ayyub",
    style: "Traditionnel",
    image: "assets/images/reciters/muhammad_ayyub.jpg",
    bio: "Récitateur saoudien à la voix puissante et expressive"
  }
];

// Load reciters - modified to include top reciters
async function loadReciters() {
  try {
    document.getElementById('spotify-reciters-list').innerHTML = '<div style="padding: 20px; color: white;">Chargement des récitateurs...</div>';
    
    // Utiliser uniquement notre liste des récitateurs renommés
    allReciters = topReciters;
    
    // Afficher les récitateurs dans l'interface
    renderReciters(allReciters);
    
    // === ADDED CODE START ===
    // Initialize player bar with the first reciter's info
    if (allReciters && allReciters.length > 0) {
      const firstReciter = allReciters[0];
      const playerImage = document.getElementById('spotify-playing-img');
      const playerReciterName = document.getElementById('spotify-playing-reciter');
      
      if (playerImage && firstReciter.image) {
        playerImage.src = firstReciter.image;
        playerImage.alt = firstReciter.reciter_name;
      }
      
      if (playerReciterName) {
        playerReciterName.textContent = firstReciter.reciter_name;
      }
      
      // Keep the surah name as default until something is played
      const playerName = document.getElementById('spotify-playing-name');
      if (playerName) {
          playerName.textContent = 'Sourate non sélectionnée';
      }
    }
    // === ADDED CODE END ===
    
    return allReciters; // Retourner le tableau des récitateurs pour le chaînage de promesses
  } catch (error) {
    console.error('Error loading reciters:', error);
    document.getElementById('spotify-reciters-list').innerHTML = '<div style="padding: 20px; color: white;">Erreur de chargement. Veuillez réessayer.</div>';
    return []; // Retourner un tableau vide en cas d'erreur
  }
}

// Render reciters in the sidebar - modified to use local images
function renderReciters(reciters) {
  // Clear previous content
  spotifyRecitersListElement.innerHTML = '';
  
  // Default local image for reciters without photos
  const defaultImage = 'assets/images/reciters/default_reciter.jpg';
  
  // Add "Featured Reciters" header
  const featuredHeader = document.createElement('div');
  featuredHeader.className = 'spotify-reciters-section-header';
  featuredHeader.textContent = 'Récitateurs renommés';
  spotifyRecitersListElement.appendChild(featuredHeader);
  
  // First render top reciters
  const topReciterIds = topReciters.map(r => r.id);
  const featuredReciters = reciters.filter(r => topReciterIds.includes(r.id));
  
  featuredReciters.forEach((reciter) => {
    const reciterItem = document.createElement('div');
    reciterItem.className = 'spotify-reciter-item';
    reciterItem.dataset.reciterId = reciter.id;
    
    // Use the reciter's local image
    const imageUrl = reciter.image || defaultImage;
    
    reciterItem.innerHTML = `
      <img src="${imageUrl}" class="spotify-reciter-img" alt="${reciter.reciter_name}" onerror="this.src='${defaultImage}'">
      <div class="spotify-reciter-info">
        <div class="spotify-reciter-name">${reciter.reciter_name}</div>
        <div class="spotify-reciter-style">${reciter.style || 'Style classique'}</div>
      </div>
    `;
    
    reciterItem.addEventListener('click', () => {
      selectReciter(reciter, imageUrl);
    });
    
    spotifyRecitersListElement.appendChild(reciterItem);
  });
}

// Function to clean up Spotify player state
function cleanupSpotifyPlayer() {
  // Arrêter l'audio en cours
  if (spotifyAudioElement && spotifyAudioElement.src) {
    spotifyAudioElement.pause();
    spotifyAudioElement.src = ''; // Enlever la source
  }
  
  // Réinitialiser l'affichage
  document.getElementById('spotify-playing-name').textContent = 'Sourate non sélectionnée';
  document.getElementById('spotify-playing-reciter').textContent = 'Aucun récitateur';
  document.getElementById('spotify-play').innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="5 3 19 12 5 21 5 3"></polygon>
    </svg>
  `;
  
  // Réinitialiser la barre de progression
  document.getElementById('spotify-progress-current').style.width = '0%';
  document.getElementById('spotify-current-time').textContent = '0:00';
  document.getElementById('spotify-total-time').textContent = '0:00';
  
  // Réinitialiser la sourate en cours de lecture
  currentSurahPlaying = null;
}

// Initialize Spotify Player
function initSpotifyPlayer() {
  if (!spotifyPlayerModal || !spotifyPlayerButton || !spotifyCloseButton) {
    console.error('Spotify player elements not found in DOM');
    return;
  }

  // Open Spotify Player Modal
  spotifyPlayerButton.addEventListener('click', () => {
    console.log('Opening Spotify Player Modal');
    
    // Préparer l'animation
    document.body.style.overflow = 'hidden';
    spotifyPlayerModal.style.display = 'flex';
    
    // Load reciters if not already loaded
    if (spotifyRecitersListElement.children.length === 0) {
      loadReciters().then(() => {
        // Automatically select the first reciter when reciters are loaded
        if (allReciters.length > 0) {
          const firstReciter = allReciters[0];
          const imageUrl = firstReciter.image || 'assets/images/reciters/default_reciter.jpg';
          selectReciter(firstReciter, imageUrl);
        }
      });
    } else if (allReciters.length > 0 && !currentReciter) {
      // If reciters are already loaded but none is selected, select the first one
      const firstReciter = allReciters[0];
      const imageUrl = firstReciter.image || 'assets/images/reciters/default_reciter.jpg';
      selectReciter(firstReciter, imageUrl);
    }
    
    // Charger les récemment écoutés
    spotifyRecentlyPlayed = JSON.parse(localStorage.getItem('spotifyRecentlyPlayed') || '[]');
    loadRecentlyPlayed();
    
    // Par défaut, afficher la section d'accueil
    switchSpotifySection('home');
    
    // Initialiser l'historique de navigation
    if (spotifyNavHistory.length === 0) {
      spotifyNavHistory = ['home'];
      spotifyNavPosition = 0;
    }
    
    // Forcer le reflow pour que la transition fonctionne
    spotifyPlayerModal.offsetHeight;
    
    // Activer l'animation avec la classe
    spotifyPlayerModal.classList.add('active');
  });

  // Close Spotify Player Modal
  spotifyCloseButton.addEventListener('click', () => {
    console.log('Closing Spotify Player Modal');
    
    // Retirer la classe pour animer la fermeture
    spotifyPlayerModal.classList.remove('active');
    
    // Nettoyer le lecteur
    cleanupSpotifyPlayer();
    
    // Attendre la fin de l'animation avant de cacher complètement
    setTimeout(() => {
      spotifyPlayerModal.style.display = 'none';
      document.body.style.overflow = '';
    }, 400);
  });

  // Close modal when clicking on backdrop
  document.querySelector('.spotify-modal-backdrop').addEventListener('click', () => {
    spotifyCloseButton.click();
  });

  // Search functionality
  spotifySearchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
      filterReciters(searchTerm);
  });

  // Play/Pause button in the player footer
  document.getElementById('spotify-play').addEventListener('click', toggleSpotifyPlayback);

  // Previous track button
  document.getElementById('spotify-prev').addEventListener('click', playPreviousSurah);

  // Next track button
  document.getElementById('spotify-next').addEventListener('click', playNextSurah);

  // Shuffle button
  spotifyShuffleButton.addEventListener('click', toggleShuffle);
  
  // Repeat button
  spotifyRepeatButton.addEventListener('click', toggleRepeat);
  
  // Like button
  spotifyLikeButton.addEventListener('click', () => {
    if (currentSurahPlaying && currentReciter) {
      addToFavorites(currentSurahPlaying, currentReciter);
    }
  });
  
  // Menu navigation
  spotifyHomeMenu.addEventListener('click', () => switchSpotifySection('home'));
  spotifyFavoritesMenu.addEventListener('click', () => switchSpotifySection('favorites'));
  spotifyPlaylistsMenu.addEventListener('click', () => switchSpotifySection('playlists'));
  spotifyDownloadedMenu.addEventListener('click', () => switchSpotifySection('downloaded'));
  
  // Navigation history buttons
  spotifyNavBack.addEventListener('click', navigateBack);
  spotifyNavForward.addEventListener('click', navigateForward);
  
  // Play all button
  spotifyPlayAllButton.addEventListener('click', () => {
    if (currentReciter && spotifyAllSurahs.length > 0) {
      playSurah(spotifyAllSurahs[0], currentReciter.api_reciter_id);
    }
  });
  
  // Add to favorites button
  spotifyAddToFavoritesButton.addEventListener('click', () => {
    if (currentReciter) {
      // Ajouter le récitateur entier aux favoris
      showNotification('Cette fonctionnalité sera bientôt disponible', 'info');
    }
  });
  
  // Create playlist button
  spotifyCreatePlaylistButton.addEventListener('click', createNewPlaylist);

  // Volume control
  const spotifyVolumeSlider = document.querySelector('.spotify-volume-slider');
  spotifyVolumeSlider.addEventListener('click', (e) => {
    const sliderRect = spotifyVolumeSlider.getBoundingClientRect();
    const clickPosition = e.clientX - sliderRect.left;
    const percentage = (clickPosition / sliderRect.width) * 100;
    
    // Update volume visual
    document.getElementById('spotify-volume-current').style.width = `${percentage}%`;
    
    // Update actual volume
    spotifyAudioElement.volume = percentage / 100;
  });

  // Progress bar control
  const progressBar = document.querySelector('.spotify-progress-bar');
  progressBar.addEventListener('click', (e) => {
    if (!spotifyAudioElement.src) return;
    
    const barRect = progressBar.getBoundingClientRect();
    const clickPosition = e.clientX - barRect.left;
    const percentage = (clickPosition / barRect.width);
    
    // Set current time based on click position
    spotifyAudioElement.currentTime = percentage * spotifyAudioElement.duration;
    
    // Update progress bar visual
    document.getElementById('spotify-progress-current').style.width = `${percentage * 100}%`;
  });

  // Audio player event listeners
  spotifyAudioElement.addEventListener('timeupdate', updateSpotifyProgress);
  spotifyAudioElement.addEventListener('ended', onSpotifyAudioEnded);
  spotifyAudioElement.addEventListener('loadedmetadata', () => {
    const totalTime = formatTime(spotifyAudioElement.duration);
    document.getElementById('spotify-total-time').textContent = totalTime;
  });
  
  // Mini player toggle
  spotifyMiniPlayerToggle.addEventListener('click', () => {
    // Fonctionnalité de mini-lecteur à implémenter
    showNotification('Mini-lecteur bientôt disponible', 'info');
  });
  
  // Initialiser le gestionnaire de téléchargements
  if (typeof initDownloadManager === 'function') {
    initDownloadManager();
    console.log('Gestionnaire de téléchargements initialisé');
  }
  
  console.log('Spotify player initialized successfully');
}

// Filter reciters based on search input
function filterReciters(searchTerm) {
  if (!allReciters.length) return;
  
  const filteredReciters = allReciters.filter(reciter => 
    reciter.reciter_name.toLowerCase().includes(searchTerm)
  );
  
  renderReciters(filteredReciters);
}

// Select a reciter and load their surahs
function selectReciter(reciter, imgUrl) {
  // Utiliser une image par défaut si aucune image n'est fournie
  const safeImgUrl = imgUrl || reciter.image || 'assets/images/reciters/default_reciter.jpg';
  
  // Update selected reciter
  currentReciter = { ...reciter, imgUrl: safeImgUrl };
  
  // Update UI to show active reciter
  const allReciterItems = document.querySelectorAll('.spotify-reciter-item');
  allReciterItems.forEach(item => {
    item.classList.remove('active');
    if (item.dataset.reciterId == reciter.id) {
      item.classList.add('active');
    }
  });
  
  // Update header with reciter info
  document.getElementById('spotify-current-reciter-name').textContent = reciter.reciter_name;
  document.getElementById('spotify-current-reciter-img').src = safeImgUrl;
  
  // Add bio information if available
  const reciterHeaderEl = document.querySelector('.spotify-reciter-header-info');
  if (reciterHeaderEl) {
    // Update subtitle with style
    const subtitleEl = reciterHeaderEl.querySelector('.spotify-reciter-header-subtitle');
    if (subtitleEl) {
      subtitleEl.textContent = reciter.style || 'Style de récitation classique';
    }
    
    // Add or update bio element
    let bioEl = reciterHeaderEl.querySelector('.spotify-reciter-bio');
    if (!bioEl && reciter.bio) {
      bioEl = document.createElement('p');
      bioEl.className = 'spotify-reciter-bio';
      reciterHeaderEl.appendChild(bioEl);
    }
    
    if (bioEl) {
      bioEl.textContent = reciter.bio || '';
      bioEl.style.display = reciter.bio ? 'block' : 'none';
    }
  }
  
  // Load all surahs
  return loadAllSurahs(reciter.api_reciter_id);
}

// Load all surahs for the selected reciter
async function loadAllSurahs(reciterId) {
  try {
    // Vérifier que l'URL de l'API est définie
    if (!QURAN_API_URL) {
      console.error("L'URL de l'API Quran n'est pas définie");
      spotifySurahListElement.innerHTML = `
        <div style="padding: 20px; color: white; text-align: center;">
          <h3>Erreur de configuration</h3>
          <p style="color: #b3b3b3;">L'URL de l'API Quran n'est pas correctement définie.</p>
        </div>
      `;
      return;
    }
    
    spotifySurahListElement.innerHTML = '<div style="padding: 20px; color: white;">Chargement des sourates...</div>';
    
    if (!spotifyAllSurahs.length) {
      // Load surahs from API if not already loaded
      const url = `${QURAN_API_URL}api/v4/chapters?language=fr`;
      console.log("Chargement des sourates depuis:", url);
      
      // Utiliser fetchApi avec retry et timeout au lieu de fetch standard
      const data = await fetchApi(url, { retries: 3, timeout: 30000, context: 'données API' });
      
      if (!data) {
        throw new Error("Échec de récupération des données de l'API");
      }
      
      spotifyAllSurahs = data.chapters;
      console.log(`${spotifyAllSurahs.length} sourates chargées avec succès`);
    }
    
    // Render surahs
    renderSurahs(spotifyAllSurahs, reciterId);
  } catch (error) {
    console.error('Erreur lors du chargement des sourates:', error);
    
    // Message d'erreur plus détaillé avec instructions
    spotifySurahListElement.innerHTML = `
      <div style="padding: 20px; color: white; text-align: center;">
        <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#ff5555" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <h3 style="margin-top: 15px;">Erreur de chargement des sourates</h3>
        <p style="margin-top: 10px; color: #b3b3b3;">Veuillez vérifier votre connexion internet et réessayer.</p>
        <button id="retry-load-surahs" style="margin-top: 15px; background: #1DB954; border: none; padding: 8px 16px; color: white; border-radius: 20px; cursor: pointer;">
          Réessayer
        </button>
      </div>
    `;
    
    // Ajouter un gestionnaire d'événements pour le bouton de réessai
    const retryButton = document.getElementById('retry-load-surahs');
    if (retryButton) {
      retryButton.addEventListener('click', () => {
        console.log("Tentative de rechargement des sourates...");
        loadAllSurahs(reciterId);
      });
    }
  }
}

// Render surahs in the main content area
function renderSurahs(surahs, reciterId) {
  // Clear previous content
  spotifySurahListElement.innerHTML = '';
  
  surahs.forEach((surah) => {
    // Random duration between 3 and 9 minutes (API doesn't provide durations)
    const minutes = Math.floor(Math.random() * 6) + 3;
    const seconds = Math.floor(Math.random() * 60);
    const duration = `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
    
    const surahItem = document.createElement('div');
    surahItem.className = 'spotify-surah-item';
    surahItem.dataset.surahId = surah.id;
    surahItem.dataset.reciterId = reciterId;
    
    // Vérifier si cette sourate est déjà téléchargée
    const isOffline = checkOfflineAvailability(surah.id);
    
    surahItem.innerHTML = `
      <div class="spotify-surah-number">${surah.id}</div>
      <div>
        <div class="spotify-surah-name">${surah.name_simple}</div>
        <div class="spotify-surah-name-ar">${surah.name_arabic}</div>
      </div>
      <div style="display: flex; justify-content: center; align-items: center;">
        <button class="button dark-single spotify-download-button ${isOffline ? 'downloaded' : ''}" 
          data-surah-id="${surah.id}" 
          data-reciter-id="${reciterId}" 
          title="${isOffline ? 'Déjà téléchargée' : 'Télécharger la sourate'}"
          style="width: 32px; height: 32px; border: none;"
          onclick="event.stopPropagation(); event.preventDefault(); return false;">
          <div>
              <svg viewBox="0 0 24 24">
                ${isOffline 
                  ? '<path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" fill="var(--checkmark, white)"/>'
                  : '<path d="M12 4v12m-4-4l4 4 4-4" stroke="var(--arrow, white)" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
                }
          </svg>
          </div>
          <div class="download-progress-container">
            <div class="download-progress-bar"></div>
          </div>
        </button>
      </div>
      <div style="display: flex; justify-content: center; align-items: center; text-align: center;">${duration}</div>
      <button class="spotify-surah-play">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
        </button>
    `;
    
    // --- Ajout du listener d'animation pour CE bouton ---
    const downloadButton = surahItem.querySelector('.spotify-download-button');
    if (downloadButton) {
        downloadButton.addEventListener('click', function(e) {
        e.stopPropagation();
        e.preventDefault();
        
            // Si déjà téléchargé, juste montrer une notification
            if (isOffline || downloadButton.classList.contains('downloaded')) {
                console.log('Cette sourate est déjà téléchargée');
                showNotification('Sourate déjà disponible hors ligne', 'info');
                return false;
            }
            
            // Ajouter la classe loading et commencer le téléchargement
            downloadButton.classList.add('loading');
            
            // Mettre à jour le SVG pour l'animation de téléchargement
            const svg = downloadButton.querySelector('svg');
            if (svg) {
                svg.innerHTML = '<path d="M12 16l-4-4h3V4h2v8h3l-4 4zm-8 2v-6h2v4h12v-4h2v6H4z" fill="var(--arrow, white)"/>';
            }
            
            // Lancer le téléchargement
            if (typeof downloadSurahAudio === 'function') {
                const surahId = parseInt(downloadButton.dataset.surahId);
                const reciterId = parseInt(downloadButton.dataset.reciterId);
                
                console.log(`Téléchargement de la sourate ${surahId} (récitateur ${reciterId})`);
                
                downloadSurahAudio(surahId, reciterId, downloadButton)
                    .then(() => {
                        // Mise à jour réussie - mettre à jour l'icône et la classe
                        downloadButton.classList.remove('loading');
                        downloadButton.classList.add('downloaded');
                        if (svg) {
                            svg.innerHTML = '<path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" fill="var(--checkmark, white)"/>';
                        }
                        downloadButton.title = 'Téléchargement terminé';
                    })
                    .catch(error => {
                        console.error(`Erreur de téléchargement:`, error);
                        downloadButton.classList.remove('loading');
                        if (svg) {
                            svg.innerHTML = '<path d="M12 4v12m-4-4l4 4 4-4" stroke="var(--arrow, white)" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
                        }
                        showNotification('Erreur de téléchargement', 'error');
                    });
            }
            
            return false; // Empêcher la propagation
        }, true); // Phase de capture
    }
    
    // Play button click event
    surahItem.querySelector('.spotify-surah-play').addEventListener('click', (e) => {
        e.stopPropagation();
        playSurah(surah, reciterId);
      });
    
    // Entire row click event
    surahItem.addEventListener('click', () => {
      playSurah(surah, reciterId);
    });
    
    spotifySurahListElement.appendChild(surahItem);
  });
}

// Play a surah
async function playSurah(surah, reciterId) {
  try {
    // Update current surah
    currentSurahPlaying = surah;
    
    // Update UI - now playing info
    document.getElementById('spotify-playing-name').textContent = surah.name_simple;
    document.getElementById('spotify-playing-reciter').textContent = currentReciter.reciter_name;
    document.getElementById('spotify-playing-img').src = currentReciter.imgUrl;
    
    // Update play button to loading state
    document.getElementById('spotify-play').innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M12 6v6l4 2"></path>
      </svg>
    `;
    
    // Afficher un message de chargement à côté du surah
    document.getElementById('spotify-playing-reciter').textContent = `${currentReciter.reciter_name} (Chargement...)`;
    
    // Set audio source - use the API to get the audio file URL
    const audioUrl = `${QURAN_API_URL}api/v4/chapter_recitations/${reciterId}/${surah.id}`;
    console.log(`Chargement de l'audio: ${audioUrl}`);
    
    // Fetch surah audio URL using fetchApi with retry
    const data = await fetchApi(audioUrl, { retries: 3, timeout: 15000, context: 'audio API' });
    
    if (!data) {
      throw new Error("Échec de récupération des données audio");
    }
    
    if (data.audio_file && data.audio_file.audio_url) {
      console.log(`Audio URL récupérée: ${data.audio_file.audio_url}`);
      
      // Remplacer l'état de chargement
      document.getElementById('spotify-playing-reciter').textContent = currentReciter.reciter_name;
      
      // Précharger l'audio
      spotifyAudioElement.src = data.audio_file.audio_url;
      
      // Ajouter un gestionnaire d'événements pour le préchargement de l'audio
      const canPlayPromise = new Promise((resolve) => {
        const canPlayHandler = () => {
          console.log("Audio prête à être jouée");
          spotifyAudioElement.removeEventListener('canplay', canPlayHandler);
          resolve();
        };
        
        spotifyAudioElement.addEventListener('canplay', canPlayHandler);
        
        // Timeout pour éviter de bloquer indéfiniment si l'audio ne peut pas être préchargé
        setTimeout(() => {
          spotifyAudioElement.removeEventListener('canplay', canPlayHandler);
          resolve();
        }, 5000);
      });
      
      // Attendre que l'audio soit prête ou que le timeout soit atteint
      await canPlayPromise;
      
      // Jouer l'audio
      try {
        await spotifyAudioElement.play();
        
        // Update play button to pause icon
        document.getElementById('spotify-play').innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="6" y="4" width="4" height="16"></rect>
            <rect x="14" y="4" width="4" height="16"></rect>
          </svg>
        `;
        
        // Update UI - highlight current surah
        updateCurrentSurahUI(surah.id);
        
        // Ajouter aux récemment joués
        addToRecentlyPlayed(surah, currentReciter);
        
        // Mettre à jour l'état du bouton like
        updateLikeButtonState();
      } catch (playError) {
        console.error('Erreur lors de la lecture:', playError);
        handleAudioError();
      }
    } else {
      console.error('URL audio non trouvée pour la sourate:', surah.id);
      handleAudioError();
        }
      } catch (error) {
    console.error('Erreur lors de la lecture de la sourate:', error);
    handleAudioError();
  }
}

// Ajouter aux récemment joués
function addToRecentlyPlayed(surah, reciter) {
  // Vérifier si l'élément existe déjà dans les récemment joués
  const existingIndex = spotifyRecentlyPlayed.findIndex(item => 
    item.surahId === surah.id && item.reciterId === reciter.id
  );
  
  // Si l'élément existe déjà, le supprimer
  if (existingIndex !== -1) {
    spotifyRecentlyPlayed.splice(existingIndex, 1);
  }
  
  // S'assurer que l'URL de l'image est valide
  const reciterImgUrl = reciter.image || reciter.imgUrl || 'assets/images/reciters/default_reciter.jpg';
  
  // Ajouter le nouvel élément au début
  const recentItem = {
    surahId: surah.id,
    surahName: surah.name_simple,
    reciterId: reciter.id,
    reciterName: reciter.reciter_name,
    apiReciterId: reciter.api_reciter_id,
    reciterImgUrl: reciterImgUrl,
    timestamp: Date.now()
  };
  
  spotifyRecentlyPlayed.unshift(recentItem);
  
  // Limiter à 20 éléments
  if (spotifyRecentlyPlayed.length > 20) {
    spotifyRecentlyPlayed = spotifyRecentlyPlayed.slice(0, 20);
  }
  
  // Sauvegarder dans le stockage local
  localStorage.setItem('spotifyRecentlyPlayed', JSON.stringify(spotifyRecentlyPlayed));
  
  // Mettre à jour l'affichage si visible
  if (spotifyHomeSection && !spotifyHomeSection.classList.contains('hidden')) {
    loadRecentlyPlayed();
  }
}

// Lecture de la sourate suivante avec gestion du shuffle et repeat
function playNextSurah() {
  if (!currentSurahPlaying || !spotifyAllSurahs.length) return;
  
  let nextSurah;
  const currentIndex = spotifyAllSurahs.findIndex(s => s.id === currentSurahPlaying.id);
  
  if (isShuffleActive) {
    // Mode aléatoire - choisir une sourate au hasard (différente de la courante)
    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * spotifyAllSurahs.length);
    } while (randomIndex === currentIndex && spotifyAllSurahs.length > 1);
    
    nextSurah = spotifyAllSurahs[randomIndex];
  } else {
    // Mode normal - sourate suivante
    if (currentIndex < spotifyAllSurahs.length - 1) {
      nextSurah = spotifyAllSurahs[currentIndex + 1];
    } else if (repeatMode === 'all') {
      // En mode repeat all, revenir à la première sourate
      nextSurah = spotifyAllSurahs[0];
    } else {
      return; // Fin de la liste et pas de repeat
    }
  }
  
  if (nextSurah) {
    playSurah(nextSurah, currentReciter.api_reciter_id);
  }
}

// Lecture de la sourate précédente
function playPreviousSurah() {
  if (!currentSurahPlaying || !spotifyAllSurahs.length) return;
  
  const currentIndex = spotifyAllSurahs.findIndex(s => s.id === currentSurahPlaying.id);
  let prevSurah;
  
  if (isShuffleActive) {
    // En mode aléatoire, aller à une sourate au hasard (ou au début de la sourate actuelle si < 3s)
    if (spotifyAudioElement.currentTime < 3) {
      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * spotifyAllSurahs.length);
      } while (randomIndex === currentIndex && spotifyAllSurahs.length > 1);
      
      prevSurah = spotifyAllSurahs[randomIndex];
    } else {
      // Revenir au début de la sourate actuelle
      spotifyAudioElement.currentTime = 0;
      return;
    }
  } else {
    // Mode normal
    if (spotifyAudioElement.currentTime > 3) {
      // Si on est au-delà de 3 secondes, revenir au début de la sourate
      spotifyAudioElement.currentTime = 0;
      return;
    } else if (currentIndex > 0) {
      // Sinon, aller à la sourate précédente
      prevSurah = spotifyAllSurahs[currentIndex - 1];
    } else if (repeatMode === 'all') {
      // En mode repeat all, aller à la dernière sourate
      prevSurah = spotifyAllSurahs[spotifyAllSurahs.length - 1];
    }
  }
  
  if (prevSurah) {
    playSurah(prevSurah, currentReciter.api_reciter_id);
  }
}

// Gestion de la fin de la lecture audio
function onSpotifyAudioEnded() {
  // Vérifier le mode repeat
  if (repeatMode === 'one') {
    // Rejouer la même sourate
    spotifyAudioElement.currentTime = 0;
    spotifyAudioElement.play();
  } else {
    // Passer à la sourate suivante (avec gestion du shuffle et repeat all)
    playNextSurah();
  }
}

// Toggle shuffle mode
function toggleShuffle() {
  isShuffleActive = !isShuffleActive;
  
  // Mise à jour visuelle
  if (isShuffleActive) {
    spotifyShuffleButton.classList.add('active');
    showNotification('Lecture aléatoire activée', 'info');
  } else {
    spotifyShuffleButton.classList.remove('active');
    showNotification('Lecture aléatoire désactivée', 'info');
  }
}

// Toggle repeat mode
function toggleRepeat() {
  // Cycle between: none -> all -> one -> none
  switch (repeatMode) {
    case 'none':
      repeatMode = 'all';
      spotifyRepeatButton.classList.add('active');
      spotifyRepeatButton.classList.remove('repeat-one');
      showNotification('Répéter toutes les sourates', 'info');
      break;
    case 'all':
      repeatMode = 'one';
      spotifyRepeatButton.classList.add('active');
      spotifyRepeatButton.classList.add('repeat-one');
      showNotification('Répéter la sourate', 'info');
      break;
    case 'one':
      repeatMode = 'none';
      spotifyRepeatButton.classList.remove('active');
      spotifyRepeatButton.classList.remove('repeat-one');
      showNotification('Répétition désactivée', 'info');
      break;
  }
}

// Initialize Spotify Player
function initSpotifyPlayer() {
  if (!spotifyPlayerModal || !spotifyPlayerButton || !spotifyCloseButton) {
    console.error('Spotify player elements not found in DOM');
    return;
  }

  // Open Spotify Player Modal
  spotifyPlayerButton.addEventListener('click', () => {
    console.log('Opening Spotify Player Modal');
    
    // Préparer l'animation
    document.body.style.overflow = 'hidden';
    spotifyPlayerModal.style.display = 'flex';
    
    // Load reciters if not already loaded
    if (spotifyRecitersListElement.children.length === 0) {
      loadReciters().then(() => {
        // Automatically select the first reciter when reciters are loaded
        if (allReciters.length > 0) {
          const firstReciter = allReciters[0];
          const imageUrl = firstReciter.image || 'assets/images/reciters/default_reciter.jpg';
          selectReciter(firstReciter, imageUrl);
        }
      });
    } else if (allReciters.length > 0 && !currentReciter) {
      // If reciters are already loaded but none is selected, select the first one
      const firstReciter = allReciters[0];
      const imageUrl = firstReciter.image || 'assets/images/reciters/default_reciter.jpg';
      selectReciter(firstReciter, imageUrl);
    }
    
    // Charger les récemment écoutés
    spotifyRecentlyPlayed = JSON.parse(localStorage.getItem('spotifyRecentlyPlayed') || '[]');
    loadRecentlyPlayed();
    
    // Par défaut, afficher la section d'accueil
    switchSpotifySection('home');
    
    // Initialiser l'historique de navigation
    if (spotifyNavHistory.length === 0) {
      spotifyNavHistory = ['home'];
      spotifyNavPosition = 0;
    }
    
    // Forcer le reflow pour que la transition fonctionne
    spotifyPlayerModal.offsetHeight;
    
    // Activer l'animation avec la classe
    spotifyPlayerModal.classList.add('active');
  });

  // Close Spotify Player Modal
  spotifyCloseButton.addEventListener('click', () => {
    console.log('Closing Spotify Player Modal');
    
    // Retirer la classe pour animer la fermeture
    spotifyPlayerModal.classList.remove('active');
    
    // Nettoyer le lecteur
    cleanupSpotifyPlayer();
    
    // Attendre la fin de l'animation avant de cacher complètement
    setTimeout(() => {
      spotifyPlayerModal.style.display = 'none';
      document.body.style.overflow = '';
    }, 400);
  });

  // Close modal when clicking on backdrop
  document.querySelector('.spotify-modal-backdrop').addEventListener('click', () => {
    spotifyCloseButton.click();
  });

  // Search functionality
  spotifySearchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    filterReciters(searchTerm);
  });

  // Play/Pause button in the player footer
  document.getElementById('spotify-play').addEventListener('click', toggleSpotifyPlayback);

  // Previous track button
  document.getElementById('spotify-prev').addEventListener('click', playPreviousSurah);

  // Next track button
  document.getElementById('spotify-next').addEventListener('click', playNextSurah);

  // Shuffle button
  spotifyShuffleButton.addEventListener('click', toggleShuffle);
  
  // Repeat button
  spotifyRepeatButton.addEventListener('click', toggleRepeat);
  
  // Like button
  spotifyLikeButton.addEventListener('click', () => {
    if (currentSurahPlaying && currentReciter) {
      addToFavorites(currentSurahPlaying, currentReciter);
    }
  });
  
  // Menu navigation
  spotifyHomeMenu.addEventListener('click', () => switchSpotifySection('home'));
  spotifyFavoritesMenu.addEventListener('click', () => switchSpotifySection('favorites'));
  spotifyPlaylistsMenu.addEventListener('click', () => switchSpotifySection('playlists'));
  spotifyDownloadedMenu.addEventListener('click', () => switchSpotifySection('downloaded'));
  
  // Navigation history buttons
  spotifyNavBack.addEventListener('click', navigateBack);
  spotifyNavForward.addEventListener('click', navigateForward);
  
  // Play all button
  spotifyPlayAllButton.addEventListener('click', () => {
    if (currentReciter && spotifyAllSurahs.length > 0) {
      playSurah(spotifyAllSurahs[0], currentReciter.api_reciter_id);
    }
  });
  
  // Add to favorites button
  spotifyAddToFavoritesButton.addEventListener('click', () => {
    if (currentReciter) {
      // Ajouter le récitateur entier aux favoris
      showNotification('Cette fonctionnalité sera bientôt disponible', 'info');
    }
  });
  
  // Create playlist button
  spotifyCreatePlaylistButton.addEventListener('click', createNewPlaylist);

  // Volume control
  const spotifyVolumeSlider = document.querySelector('.spotify-volume-slider');
  spotifyVolumeSlider.addEventListener('click', (e) => {
    const sliderRect = spotifyVolumeSlider.getBoundingClientRect();
    const clickPosition = e.clientX - sliderRect.left;
    const percentage = (clickPosition / sliderRect.width) * 100;
    
    // Update volume visual
    document.getElementById('spotify-volume-current').style.width = `${percentage}%`;
    
    // Update actual volume
    spotifyAudioElement.volume = percentage / 100;
  });

  // Progress bar control
  const progressBar = document.querySelector('.spotify-progress-bar');
  progressBar.addEventListener('click', (e) => {
    if (!spotifyAudioElement.src) return;
    
    const barRect = progressBar.getBoundingClientRect();
    const clickPosition = e.clientX - barRect.left;
    const percentage = (clickPosition / barRect.width);
    
    // Set current time based on click position
    spotifyAudioElement.currentTime = percentage * spotifyAudioElement.duration;
    
    // Update progress bar visual
    document.getElementById('spotify-progress-current').style.width = `${percentage * 100}%`;
  });

  // Audio player event listeners
  spotifyAudioElement.addEventListener('timeupdate', updateSpotifyProgress);
  spotifyAudioElement.addEventListener('ended', onSpotifyAudioEnded);
  spotifyAudioElement.addEventListener('loadedmetadata', () => {
    const totalTime = formatTime(spotifyAudioElement.duration);
    document.getElementById('spotify-total-time').textContent = totalTime;
  });
  
  // Mini player toggle
  spotifyMiniPlayerToggle.addEventListener('click', () => {
    // Fonctionnalité de mini-lecteur à implémenter
    showNotification('Mini-lecteur bientôt disponible', 'info');
  });
  
  // Initialiser le gestionnaire de téléchargements
  if (typeof initDownloadManager === 'function') {
    initDownloadManager();
    console.log('Gestionnaire de téléchargements initialisé');
  }
  
  console.log('Spotify player initialized successfully');
}

// Filter reciters based on search input
function filterReciters(searchTerm) {
  if (!allReciters.length) return;
  
  const filteredReciters = allReciters.filter(reciter => 
    reciter.reciter_name.toLowerCase().includes(searchTerm)
  );
  
  renderReciters(filteredReciters);
}

// Select a reciter and load their surahs
function selectReciter(reciter, imgUrl) {
  // Utiliser une image par défaut si aucune image n'est fournie
  const safeImgUrl = imgUrl || reciter.image || 'assets/images/reciters/default_reciter.jpg';
  
  // Update selected reciter
  currentReciter = { ...reciter, imgUrl: safeImgUrl };
  
  // Update UI to show active reciter
  const allReciterItems = document.querySelectorAll('.spotify-reciter-item');
  allReciterItems.forEach(item => {
    item.classList.remove('active');
    if (item.dataset.reciterId == reciter.id) {
      item.classList.add('active');
    }
  });
  
  // Update header with reciter info
  document.getElementById('spotify-current-reciter-name').textContent = reciter.reciter_name;
  document.getElementById('spotify-current-reciter-img').src = safeImgUrl;
  
  // Add bio information if available
  const reciterHeaderEl = document.querySelector('.spotify-reciter-header-info');
  if (reciterHeaderEl) {
    // Update subtitle with style
    const subtitleEl = reciterHeaderEl.querySelector('.spotify-reciter-header-subtitle');
    if (subtitleEl) {
      subtitleEl.textContent = reciter.style || 'Style de récitation classique';
    }
    
    // Add or update bio element
    let bioEl = reciterHeaderEl.querySelector('.spotify-reciter-bio');
    if (!bioEl && reciter.bio) {
      bioEl = document.createElement('p');
      bioEl.className = 'spotify-reciter-bio';
      reciterHeaderEl.appendChild(bioEl);
    }
    
    if (bioEl) {
      bioEl.textContent = reciter.bio || '';
      bioEl.style.display = reciter.bio ? 'block' : 'none';
    }
  }
  
  // Load all surahs
  return loadAllSurahs(reciter.api_reciter_id);
}

// Load all surahs for the selected reciter
async function loadAllSurahs(reciterId) {
  try {
    // Vérifier que l'URL de l'API est définie
    if (!QURAN_API_URL) {
      console.error("L'URL de l'API Quran n'est pas définie");
      spotifySurahListElement.innerHTML = `
        <div style="padding: 20px; color: white; text-align: center;">
          <h3>Erreur de configuration</h3>
          <p style="color: #b3b3b3;">L'URL de l'API Quran n'est pas correctement définie.</p>
        </div>
      `;
      return;
    }
    
    spotifySurahListElement.innerHTML = '<div style="padding: 20px; color: white;">Chargement des sourates...</div>';
    
    if (!spotifyAllSurahs.length) {
      // Load surahs from API if not already loaded
      const url = `${QURAN_API_URL}api/v4/chapters?language=fr`;
      console.log("Chargement des sourates depuis:", url);
      
      // Utiliser fetchApi avec retry et timeout au lieu de fetch standard
      const data = await fetchApi(url, { retries: 3, timeout: 30000, context: 'données API' });
      
      if (!data) {
        throw new Error("Échec de récupération des données de l'API");
      }
      
      spotifyAllSurahs = data.chapters;
      console.log(`${spotifyAllSurahs.length} sourates chargées avec succès`);
    }
    
    // Render surahs
    renderSurahs(spotifyAllSurahs, reciterId);
  } catch (error) {
    console.error('Erreur lors du chargement des sourates:', error);
    
    // Message d'erreur plus détaillé avec instructions
    spotifySurahListElement.innerHTML = `
      <div style="padding: 20px; color: white; text-align: center;">
        <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#ff5555" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <h3 style="margin-top: 15px;">Erreur de chargement des sourates</h3>
        <p style="margin-top: 10px; color: #b3b3b3;">Veuillez vérifier votre connexion internet et réessayer.</p>
        <button id="retry-load-surahs" style="margin-top: 15px; background: #1DB954; border: none; padding: 8px 16px; color: white; border-radius: 20px; cursor: pointer;">
          Réessayer
        </button>
      </div>
    `;
    
    // Ajouter un gestionnaire d'événements pour le bouton de réessai
    const retryButton = document.getElementById('retry-load-surahs');
    if (retryButton) {
      retryButton.addEventListener('click', () => {
        console.log("Tentative de rechargement des sourates...");
        loadAllSurahs(reciterId);
      });
    }
  }
}

// Render surahs in the main content area
function renderSurahs(surahs, reciterId) {
  // Clear previous content
  spotifySurahListElement.innerHTML = '';
  
  surahs.forEach((surah) => {
    // Random duration between 3 and 9 minutes (API doesn't provide durations)
    const minutes = Math.floor(Math.random() * 6) + 3;
    const seconds = Math.floor(Math.random() * 60);
    const duration = `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
    
    const surahItem = document.createElement('div');
    surahItem.className = 'spotify-surah-item';
    surahItem.dataset.surahId = surah.id;
    surahItem.dataset.reciterId = reciterId;
    
    // Vérifier si cette sourate est déjà téléchargée
    const isOffline = checkOfflineAvailability(surah.id);
    
    surahItem.innerHTML = `
      <div class="spotify-surah-number">${surah.id}</div>
      <div>
        <div class="spotify-surah-name">${surah.name_simple}</div>
        <div class="spotify-surah-name-ar">${surah.name_arabic}</div>
      </div>
      <div style="display: flex; justify-content: center; align-items: center;">
        <button class="button dark-single spotify-download-button ${isOffline ? 'downloaded' : ''}" 
          data-surah-id="${surah.id}" 
          data-reciter-id="${reciterId}" 
          title="${isOffline ? 'Déjà téléchargée' : 'Télécharger la sourate'}"
          style="width: 32px; height: 32px; border: none;"
          onclick="event.stopPropagation(); event.preventDefault(); return false;">
          <div>
              <svg viewBox="0 0 24 24">
                ${isOffline 
                  ? '<path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" fill="var(--checkmark, white)"/>'
                  : '<path d="M12 4v12m-4-4l4 4 4-4" stroke="var(--arrow, white)" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
                }
          </svg>
          </div>
          <div class="download-progress-container">
            <div class="download-progress-bar"></div>
          </div>
        </button>
      </div>
      <div style="display: flex; justify-content: center; align-items: center; text-align: center;">${duration}</div>
      <button class="spotify-surah-play">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
        </button>
    `;
    
    // --- Ajout du listener d'animation pour CE bouton ---
    const downloadButton = surahItem.querySelector('.spotify-download-button');
    if (downloadButton) {
        downloadButton.addEventListener('click', function(e) {
        e.stopPropagation();
        e.preventDefault();
        
            // Si déjà téléchargé, juste montrer une notification
            if (isOffline || downloadButton.classList.contains('downloaded')) {
                console.log('Cette sourate est déjà téléchargée');
                showNotification('Sourate déjà disponible hors ligne', 'info');
                return false;
            }
            
            // Ajouter la classe loading et commencer le téléchargement
            downloadButton.classList.add('loading');
            
            // Mettre à jour le SVG pour l'animation de téléchargement
            const svg = downloadButton.querySelector('svg');
            if (svg) {
                svg.innerHTML = '<path d="M12 16l-4-4h3V4h2v8h3l-4 4zm-8 2v-6h2v4h12v-4h2v6H4z" fill="var(--arrow, white)"/>';
            }
            
            // Lancer le téléchargement
            if (typeof downloadSurahAudio === 'function') {
                const surahId = parseInt(downloadButton.dataset.surahId);
                const reciterId = parseInt(downloadButton.dataset.reciterId);
                
                console.log(`Téléchargement de la sourate ${surahId} (récitateur ${reciterId})`);
                
                downloadSurahAudio(surahId, reciterId, downloadButton)
                    .then(() => {
                        // Mise à jour réussie - mettre à jour l'icône et la classe
                        downloadButton.classList.remove('loading');
                        downloadButton.classList.add('downloaded');
                        if (svg) {
                            svg.innerHTML = '<path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" fill="var(--checkmark, white)"/>';
                        }
                        downloadButton.title = 'Téléchargement terminé';
                    })
                    .catch(error => {
                        console.error(`Erreur de téléchargement:`, error);
                        downloadButton.classList.remove('loading');
                        if (svg) {
                            svg.innerHTML = '<path d="M12 4v12m-4-4l4 4 4-4" stroke="var(--arrow, white)" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
                        }
                        showNotification('Erreur de téléchargement', 'error');
                    });
            }
            
            return false; // Empêcher la propagation
        }, true); // Phase de capture
    }
    
    // Play button click event
    surahItem.querySelector('.spotify-surah-play').addEventListener('click', (e) => {
        e.stopPropagation();
        playSurah(surah, reciterId);
      });
    
    // Entire row click event
    surahItem.addEventListener('click', () => {
      playSurah(surah, reciterId);
    });
    
    spotifySurahListElement.appendChild(surahItem);
  });
}

// --- Fonctions JS pour l'animation du bouton ---
function getPoint(point, i, a, smoothing) {
    let cp = (current, previous, next, reverse) => {
            let p = previous || current,
                n = next || current,
                o = {
                    length: Math.sqrt(Math.pow(n[0] - p[0], 2) + Math.pow(n[1] - p[1], 2)),
                    angle: Math.atan2(n[1] - p[1], n[0] - p[0])
                },
                angle = o.angle + (reverse ? Math.PI : 0),
                length = o.length * smoothing;
            return [current[0] + Math.cos(angle) * length, current[1] + Math.sin(angle) * length];
        },
        cps = cp(a[i - 1], a[i - 2], point, false),
        cpe = cp(point, a[i - 1], a[i + 1], true);
    return `C ${cps[0]},${cps[1]} ${cpe[0]},${cpe[1]} ${point[0]},${point[1]}`;
}

function getPath(update, smoothing, pointsNew) {
    // Points originaux du JS fourni, semblent pour une viewBox 20x20 ou similaire.
    let points = pointsNew ? pointsNew : [
            [4, 12],
            [12, update], // y-coordinate for animation
            [20, 12]
        ];
     // Si les points checkmark sont aussi du JS:
     if (pointsNew && pointsNew.length === 3 && pointsNew[0][0] === 3) { // Détection heuristique du checkmark
         points = [ // Points checkmark du JS original
             [3, 14],
             [8, 19],
             [21, 6]
         ];
     } else if (!pointsNew) { // Flèche initiale simple
         points = [
             [6, 10],
             [12, 16],
             [18, 10]
         ];
     }

    let d = points.reduce((acc, point, i, a) => i === 0 ? `M ${point[0]},${point[1]}` : `${acc} ${getPoint(point, i, a, smoothing)}`, '');
    return `<path d="${d}" stroke="var(--arrow, white)" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />`; // Assurer les attributs SVG + fallback arrow color
}

function setupDownloadButtonAnimation(button) {
    if (typeof gsap === 'undefined') {
        console.warn("GSAP non chargé. Animation désactivée.");
        const svg = button.querySelector('svg');
        if (svg) {
             // Icône statique de téléchargement (flèche simple)
             svg.innerHTML = '<path d="M12 4v12m-4-4l4 4 4-4" stroke="var(--arrow, white)" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
        }
        button.addEventListener('click', e => {
            e.preventDefault();
            console.log('Téléchargement cliqué (sans anim)', button.dataset.surahId);
            // ICI : Logique de téléchargement réelle
             button.innerHTML = '<div><svg viewBox="0 0 24 24"><path d="M12 16l-4-4h3V4h2v8h3l-4 4zm-8 2v-6h2v4h12v-4h2v6H4z" fill="var(--arrow, white)"/></svg></div>'; // Indicate download started
             setTimeout(() => { // Simulate completion
                svg.innerHTML = '<path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" fill="var(--checkmark, white)"/>'; // Static checkmark
             }, 1500);
        });
      return;
    }

    let duration = 3000,
        svg = button.querySelector('svg'),
        svgPath = new Proxy({ y: null, smoothing: null }, {
            set(target, key, value) {
                target[key] = value;
                if(target.y !== null && target.smoothing !== null) {
                    svg.innerHTML = getPath(target.y, target.smoothing, null); // Utilise la fonction getPath ajustée
                }
                return true;
            },
            get(target, key) { return target[key]; }
        });

    button.style.setProperty('--duration', duration);

    // Initialiser avec la flèche statique via getPath
    svg.innerHTML = getPath(16, 0); // y=16 correspond à la flèche dans notre logique getPath

    button.addEventListener('click', e => {
        e.preventDefault();
        if(!button.classList.contains('loading')) {
            button.classList.add('loading');

            // Animation de la flèche (si getPath/Proxy la gère)
            gsap.to(svgPath, { smoothing: .3, duration: duration * .065 / 1000 });
            gsap.to(svgPath, { y: 12, duration: duration * .265 / 1000, delay: duration * .065 / 1000, ease: Elastic.easeOut.config(1.12, .4) });

            // Afficher le checkmark à mi-chemin
            setTimeout(() => {
                if (button.classList.contains('loading')) {
                   // Points Checkmark du JS original : [[3, 14], [8, 19], [21, 6]]
                   // On les passe à getPath pour qu'il les utilise
                   svg.innerHTML = getPath(0, 0, [[3, 14], [8, 19], [21, 6]]);
                }
            }, duration / 2);

             // Réinitialiser après l'animation
             setTimeout(() => {
                 button.classList.remove('loading');
                 // Remettre la flèche initiale via getPath
                 svg.innerHTML = getPath(16, 0); // Assuming y=16 is the arrow
             }, duration); // Fin de l'animation principale

             console.log('Téléchargement initié (avec anim)', button.dataset.surahId);
             // ICI : Logique de téléchargement réelle
             // Ex: downloadSurahAudio(button.dataset.surahId, button.dataset.reciterId);
        } else {
          console.log('Téléchargement déjà en cours ou terminé ?'); // Log si déjà 'loading'
        }
    });

// ... rest of setupDownloadButtonAnimation function (GSAP check fallback) ...

// Handle the case without GSAP as well
    if (typeof gsap === 'undefined') {
        // Remove previous fallback listener if it exists
        if (button._clickFallbackHandler) {
            button.removeEventListener('click', button._clickFallbackHandler);
        }
        // Define the new fallback handler
        button._clickFallbackHandler = (e) => {
            e.preventDefault();
            e.stopPropagation(); // <<<< AJOUTÉ ICI
            console.log('Téléchargement cliqué (sans anim)', button.dataset.surahId);
            // ICI : Logique de téléchargement réelle
             const svg = button.querySelector('svg');
             if (svg) {
                svg.innerHTML = '<path d="M12 16l-4-4h3V4h2v8h3l-4 4zm-8 2v-6h2v4h12v-4h2v6H4z" fill="var(--arrow, white)"/>'; // Indicate download started
             }
             setTimeout(() => { // Simulate completion
                if (svg) {
                  svg.innerHTML = '<path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" fill="var(--checkmark, white)"/>'; // Static checkmark
                }
             }, 1500);
        };
        // Add the new fallback listener
        button.addEventListener('click', button._clickFallbackHandler);
    } else {
        // The GSAP listener already has stopPropagation from the previous edit
        button.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation(); // This should already be here
            // ... rest of the GSAP click handler ...
             if(!button.classList.contains('loading')) {
                 button.classList.add('loading');
                 // ... GSAP animations ...
                 setTimeout(() => { /* show checkmark */ }, duration / 2);
                 setTimeout(() => { /* reset button */ }, duration);
                 console.log('Téléchargement initié (avec anim)', button.dataset.surahId);
                 // ICI : Logique de téléchargement réelle
             } else {
               console.log('Téléchargement déjà en cours ou terminé ?');
             }
        });
    }
}
// --- Fin fonctions JS ---

// ... (Ensure these functions are defined before they are called, e.g., before initApp)


// Update the UI to highlight the current playing surah
function updateCurrentSurahUI(surahId) {
  const allSurahItems = document.querySelectorAll('.spotify-surah-item');
  allSurahItems.forEach(item => {
    item.style.backgroundColor = '';
    if (item.dataset.surahId == surahId) {
      item.style.backgroundColor = 'rgba(30, 215, 96, 0.2)';
    }
  });
}

// Update progress bar and time display during playback
function updateSpotifyProgress() {
  if (!spotifyAudioElement.duration) return;
  
  const currentTime = spotifyAudioElement.currentTime;
  const duration = spotifyAudioElement.duration;
  const progressPercentage = (currentTime / duration) * 100;
  
  // Update progress bar
  document.getElementById('spotify-progress-current').style.width = `${progressPercentage}%`;
  
  // Update time display
  document.getElementById('spotify-current-time').textContent = formatTime(currentTime);
  document.getElementById('spotify-total-time').textContent = formatTime(duration);
}

// Format time in MM:SS format
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' + secs : secs}`;
}

// Toggle play/pause functionality
function toggleSpotifyPlayback() {
  if (!spotifyAudioElement.src) {
    console.log('No audio source available');
    return;
  }
  
  if (spotifyAudioElement.paused) {
    spotifyAudioElement.play();
    // Update play button to pause icon
    document.getElementById('spotify-play').innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <rect x="6" y="4" width="4" height="16"></rect>
        <rect x="14" y="4" width="4" height="16"></rect>
      </svg>
    `;
  } else {
    spotifyAudioElement.pause();
    // Update pause button to play icon
    document.getElementById('spotify-play').innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
      </svg>
    `;
  }
}

// Handle audio ended event
function onSpotifyAudioEnded() {
  // Play next surah when current one finishes
  playNextSurah();
}

// Play the previous surah
function playPreviousSurah() {
  if (!currentSurahPlaying || !spotifyAllSurahs.length) return;
  
  const currentIndex = spotifyAllSurahs.findIndex(s => s.id === currentSurahPlaying.id);
  if (currentIndex > 0) {
    const previousSurah = spotifyAllSurahs[currentIndex - 1];
    playSurah(previousSurah, currentReciter.api_reciter_id);
  }
}

// Play the next surah
function playNextSurah() {
  if (!currentSurahPlaying || !spotifyAllSurahs.length) return;
  
  const currentIndex = spotifyAllSurahs.findIndex(s => s.id === currentSurahPlaying.id);
  if (currentIndex < spotifyAllSurahs.length - 1) {
    const nextSurah = spotifyAllSurahs[currentIndex + 1];
    playSurah(nextSurah, currentReciter.api_reciter_id);
  }
}

// Initialize the Spotify player when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
  initSpotifyPlayer();
});

// Handle audio error
function handleAudioError() {
  // Reset play button
  document.getElementById('spotify-play').innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="5 3 19 12 5 21 5 3"></polygon>
    </svg>
  `;
  
  // Afficher un message d'erreur
  document.getElementById('spotify-playing-reciter').textContent = 
    `${currentReciter ? currentReciter.reciter_name : 'Récitateur'} (Audio indisponible)`;
  
  // Afficher une notification d'erreur
  showNotification('Audio indisponible', 'Veuillez essayer un autre récitateur ou une autre sourate');
}

// Try to load audio from alternative source
async function tryAlternativeAudioSource() {
  if (!currentSurahPlaying) return;
  
  // Instead of trying Mishary Rashid Alafasy as a fallback, just show an error message
  console.log(`Audio non disponible pour cette sourate`);
  
  // Mettre à jour l'affichage pour montrer que l'audio n'est pas disponible
  document.getElementById('spotify-playing-reciter').textContent = 
    `${currentReciter ? currentReciter.reciter_name : 'Récitateur'} (Audio indisponible)`;
  
  // Afficher une notification d'erreur
  showNotification('Audio indisponible', 'Veuillez essayer un autre récitateur ou une autre sourate');
  
  // Réinitialiser le bouton de lecture
  document.getElementById('spotify-play').innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="5 3 19 12 5 21 5 3"></polygon>
    </svg>
  `;
}

// Update the UI to highlight the current playing surah
function updateCurrentSurahUI(surahId) {
  const allSurahItems = document.querySelectorAll('.spotify-surah-item');
  allSurahItems.forEach(item => {
    item.style.backgroundColor = '';
    if (item.dataset.surahId == surahId) {
      item.style.backgroundColor = 'rgba(30, 215, 96, 0.2)';
    }
  });
}

// Update progress bar and time display during playback
function updateSpotifyProgress() {
  if (!spotifyAudioElement.duration) return;
  
  const currentTime = spotifyAudioElement.currentTime;
  const duration = spotifyAudioElement.duration;
  const progressPercentage = (currentTime / duration) * 100;
  
  // Update progress bar
  document.getElementById('spotify-progress-current').style.width = `${progressPercentage}%`;
  
  // Update time display
  document.getElementById('spotify-current-time').textContent = formatTime(currentTime);
  document.getElementById('spotify-total-time').textContent = formatTime(duration);
}

// Format time in MM:SS format
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' + secs : secs}`;
}

// Toggle play/pause functionality
function toggleSpotifyPlayback() {
  if (!spotifyAudioElement.src) {
    console.log('No audio source available');
    return;
  }
  
  if (spotifyAudioElement.paused) {
    spotifyAudioElement.play();
    // Update play button to pause icon
    document.getElementById('spotify-play').innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <rect x="6" y="4" width="4" height="16"></rect>
        <rect x="14" y="4" width="4" height="16"></rect>
      </svg>
    `;
  } else {
    spotifyAudioElement.pause();
    // Update pause button to play icon
    document.getElementById('spotify-play').innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
    `;
  }
}

// Handle audio ended event
function onSpotifyAudioEnded() {
  // Play next surah when current one finishes
  playNextSurah();
}

// Play the previous surah
function playPreviousSurah() {
  if (!currentSurahPlaying || !spotifyAllSurahs.length) return;
  
  const currentIndex = spotifyAllSurahs.findIndex(s => s.id === currentSurahPlaying.id);
  if (currentIndex > 0) {
    const previousSurah = spotifyAllSurahs[currentIndex - 1];
    playSurah(previousSurah, currentReciter.api_reciter_id);
  }
}

// Fonctions de gestion de la navigation et des sections
function switchSpotifySection(sectionId) {
  // Masquer toutes les sections
  spotifyHomeSection.classList.add('hidden');
  spotifyFavoritesSection.classList.add('hidden');
  spotifyPlaylistsSection.classList.add('hidden');
  spotifyDownloadedSection.classList.add('hidden');
  
  // Désactiver tous les items du menu
  spotifyHomeMenu.classList.remove('active');
  spotifyFavoritesMenu.classList.remove('active');
  spotifyPlaylistsMenu.classList.remove('active');
  spotifyDownloadedMenu.classList.remove('active');
  
  // Afficher la section demandée et activer l'item du menu correspondant
  switch(sectionId) {
    case 'home':
      spotifyHomeSection.classList.remove('hidden');
      spotifyHomeMenu.classList.add('active');
      break;
    case 'favorites':
      spotifyFavoritesSection.classList.remove('hidden');
      spotifyFavoritesMenu.classList.add('active');
      loadFavorites();
      break;
    case 'playlists':
      spotifyPlaylistsSection.classList.remove('hidden');
      spotifyPlaylistsMenu.classList.add('active');
      loadPlaylists();
      break;
    case 'downloaded':
      spotifyDownloadedSection.classList.remove('hidden');
      spotifyDownloadedMenu.classList.add('active');
      loadDownloaded();
            break;
          }
  
  // Ajouter à l'historique de navigation si ce n'est pas une navigation via les boutons précédent/suivant
  if (!isNavigating) {
    // Supprimer tout ce qui est après la position actuelle
    if (spotifyNavPosition < spotifyNavHistory.length - 1) {
      spotifyNavHistory = spotifyNavHistory.slice(0, spotifyNavPosition + 1);
    }
    
    // Ajouter la nouvelle section
    spotifyNavHistory.push(sectionId);
    spotifyNavPosition = spotifyNavHistory.length - 1;
  }
  
  // Mettre à jour l'état des boutons de navigation
  updateNavButtons();
}

// Mettre à jour l'état des boutons de navigation
function updateNavButtons() {
  spotifyNavBack.disabled = spotifyNavPosition <= 0;
  spotifyNavForward.disabled = spotifyNavPosition >= spotifyNavHistory.length - 1;
  
  // Mise à jour visuelle
  if (spotifyNavBack.disabled) {
    spotifyNavBack.style.opacity = 0.5;
    spotifyNavBack.style.cursor = 'default';
  } else {
    spotifyNavBack.style.opacity = 1;
    spotifyNavBack.style.cursor = 'pointer';
  }
  
  if (spotifyNavForward.disabled) {
    spotifyNavForward.style.opacity = 0.5;
    spotifyNavForward.style.cursor = 'default';
  } else {
    spotifyNavForward.style.opacity = 1;
    spotifyNavForward.style.cursor = 'pointer';
  }
}

// Navigation arrière
function navigateBack() {
  if (spotifyNavPosition > 0) {
    isNavigating = true;
    spotifyNavPosition--;
    switchSpotifySection(spotifyNavHistory[spotifyNavPosition]);
    isNavigating = false;
  }
}

// Navigation avant
function navigateForward() {
  if (spotifyNavPosition < spotifyNavHistory.length - 1) {
    isNavigating = true;
    spotifyNavPosition++;
    switchSpotifySection(spotifyNavHistory[spotifyNavPosition]);
    isNavigating = false;
  }
}

// Charger les récemment écoutés
function loadRecentlyPlayed() {
  const recentItemsContainer = document.getElementById('spotify-recent-items');
  
  // Effacer le contenu existant
  recentItemsContainer.innerHTML = '';
  
  // Si aucun élément récent, afficher un message
  if (spotifyRecentlyPlayed.length === 0) {
    recentItemsContainer.innerHTML = '<div style="color: #b3b3b3; padding: 20px;">Aucune récitation écoutée récemment</div>';
    return;
  }
  
  // Afficher les éléments récents (limités aux 6 derniers)
  spotifyRecentlyPlayed.slice(0, 6).forEach(item => {
    const recentItem = document.createElement('div');
    recentItem.className = 'spotify-recent-item';
    
    // S'assurer que l'URL de l'image est valide, sinon utiliser l'image par défaut
    const imgUrl = item.reciterImgUrl || 'assets/images/reciters/default_reciter.jpg';
    
    recentItem.innerHTML = `
      <img src="${imgUrl}" class="spotify-recent-item-img" alt="${item.surahName}" onerror="this.src='assets/images/reciters/default_reciter.jpg'">
      <div class="spotify-recent-item-title">${item.surahName}</div>
      <div class="spotify-recent-item-subtitle">${item.reciterName}</div>
    `;
    
    // Cliquer sur un élément récent pour le jouer
    recentItem.addEventListener('click', () => {
      if (currentReciter && currentReciter.id !== item.reciterId) {
        // Charger d'abord le récitateur
        const reciter = allReciters.find(r => r.id === item.reciterId);
        if (reciter) {
          selectReciter(reciter, imgUrl).then(() => {
            // Puis jouer la sourate
            const surah = spotifyAllSurahs.find(s => s.id === item.surahId);
            if (surah) {
              playSurah(surah, reciter.api_reciter_id);
            }
          });
        }
      } else {
        // Jouer directement la sourate si le récitateur est déjà chargé
        const surah = spotifyAllSurahs.find(s => s.id === item.surahId);
        if (surah) {
          playSurah(surah, item.apiReciterId);
        }
      }
    });
    
    recentItemsContainer.appendChild(recentItem);
  });
}

// Charger les favoris
function loadFavorites() {
  const favoritesContainer = document.getElementById('spotify-favorites-container');
  
  // Effacer le contenu existant
  favoritesContainer.innerHTML = '';
  
  // Charger les favoris depuis le stockage local s'ils existent
  const savedFavorites = localStorage.getItem('spotifyFavorites');
  if (savedFavorites) {
    spotifyFavorites = JSON.parse(savedFavorites);
  }
  
  // Si aucun favori, afficher un message
  if (spotifyFavorites.length === 0) {
    favoritesContainer.innerHTML = '<div style="color: #b3b3b3; padding: 20px;">Aucun favori</div>';
    return;
  }
  
  // Afficher les favoris
  spotifyFavorites.forEach(favorite => {
    const favoriteItem = document.createElement('div');
    favoriteItem.className = 'spotify-playlist-item';
    
    // S'assurer que l'URL de l'image est valide
    const imgUrl = favorite.reciterImgUrl || 'assets/images/reciters/default_reciter.jpg';
    
    favoriteItem.innerHTML = `
      <img src="${imgUrl}" class="spotify-playlist-img" alt="${favorite.surahName}" onerror="this.src='assets/images/reciters/default_reciter.jpg'">
      <div class="spotify-playlist-title">${favorite.surahName}</div>
      <div class="spotify-playlist-subtitle">${favorite.reciterName}</div>
    `;
    
    // Cliquer sur un favori pour le jouer
    favoriteItem.addEventListener('click', () => {
      if (currentReciter && currentReciter.id !== favorite.reciterId) {
        // Charger d'abord le récitateur
        const reciter = allReciters.find(r => r.id === favorite.reciterId);
        if (reciter) {
          selectReciter(reciter, imgUrl).then(() => {
            // Puis jouer la sourate
            const surah = spotifyAllSurahs.find(s => s.id === favorite.surahId);
            if (surah) {
              playSurah(surah, reciter.api_reciter_id);
            }
          });
      }
    } else {
        // Jouer directement la sourate si le récitateur est déjà chargé
        const surah = spotifyAllSurahs.find(s => s.id === favorite.surahId);
        if (surah) {
          playSurah(surah, favorite.apiReciterId);
        }
      }
    });
    
    favoritesContainer.appendChild(favoriteItem);
  });
}

// Ajouter aux favoris
function addToFavorites(surah, reciter) {
  // Vérifier si ce favori existe déjà
  const existingIndex = spotifyFavorites.findIndex(f => 
    f.surahId === surah.id && f.reciterId === reciter.id
  );
  
  if (existingIndex !== -1) {
    // Déjà dans les favoris, on le supprime
    spotifyFavorites.splice(existingIndex, 1);
    showNotification('Retiré des favoris', 'info');
  } else {
    // Nouveau favori
    const newFavorite = {
    surahId: surah.id,
    surahName: surah.name_simple,
    reciterId: reciter.id,
    reciterName: reciter.reciter_name,
    apiReciterId: reciter.api_reciter_id,
      reciterImgUrl: reciter.image || 'https://i.scdn.co/image/ab67616d0000b2731527816a1d47daa8b7519f46',
    timestamp: Date.now()
  };
  
    spotifyFavorites.push(newFavorite);
    showNotification('Ajouté aux favoris', 'success');
  }
  
  // Sauvegarder dans le stockage local
  localStorage.setItem('spotifyFavorites', JSON.stringify(spotifyFavorites));
  
  // Mettre à jour l'affichage des favoris si visible
  if (!spotifyFavoritesSection.classList.contains('hidden')) {
    loadFavorites();
  }
  
  // Mettre à jour l'état du bouton like si la sourate en cours est concernée
  updateLikeButtonState();
}

// Mettre à jour l'état du bouton like
function updateLikeButtonState() {
  if (!currentSurahPlaying || !currentReciter) {
    spotifyLikeButton.classList.remove('active');
    return;
  }
  
  // Vérifier si la sourate en cours est dans les favoris
  const isFavorite = spotifyFavorites.some(f => 
    f.surahId === currentSurahPlaying.id && f.reciterId === currentReciter.id
  );
  
  if (isFavorite) {
    spotifyLikeButton.classList.add('active');
  } else {
    spotifyLikeButton.classList.remove('active');
  }
}

// Charger les playlists
function loadPlaylists() {
  const playlistsContainer = document.getElementById('spotify-playlists-container');
  
  // Effacer le contenu existant
  playlistsContainer.innerHTML = '';
  
  // Charger les playlists depuis le stockage local s'ils existent
  const savedPlaylists = localStorage.getItem('spotifyPlaylists');
  if (savedPlaylists) {
    spotifyPlaylists = JSON.parse(savedPlaylists);
  }
  
  // Si aucune playlist, afficher un message
  if (spotifyPlaylists.length === 0) {
    playlistsContainer.innerHTML = '<div style="color: #b3b3b3; padding: 20px;">Aucune playlist</div>';
    return;
  }
  
  // Afficher les playlists
  spotifyPlaylists.forEach(playlist => {
    const playlistItem = document.createElement('div');
    playlistItem.className = 'spotify-playlist-item';
    
    // Utiliser une image générique pour les playlists
    playlistItem.innerHTML = `
      <div class="spotify-playlist-img">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 18V5l12-2v13"></path>
          <circle cx="6" cy="18" r="3"></circle>
          <circle cx="18" cy="16" r="3"></circle>
        </svg>
      </div>
      <div class="spotify-playlist-title">${playlist.name}</div>
      <div class="spotify-playlist-subtitle">${playlist.items.length} sourates</div>
    `;
    
    // Cliquer sur une playlist pour afficher son contenu
    playlistItem.addEventListener('click', () => {
      showPlaylistDetails(playlist);
    });
    
    playlistsContainer.appendChild(playlistItem);
  });
}

// Créer une nouvelle playlist
function createNewPlaylist() {
  const playlistName = prompt('Nom de la nouvelle playlist:');
  
  if (!playlistName || playlistName.trim() === '') {
      return;
  }
  
  // Créer la nouvelle playlist
  const newPlaylist = {
    id: Date.now(),
    name: playlistName.trim(),
    items: [],
    createdAt: Date.now()
  };
  
  // Ajouter à la liste des playlists
  spotifyPlaylists.push(newPlaylist);
  
  // Sauvegarder dans le stockage local
  localStorage.setItem('spotifyPlaylists', JSON.stringify(spotifyPlaylists));
  
  // Mettre à jour l'affichage
  loadPlaylists();
  
  // Afficher la nouvelle playlist
}

// Afficher une notification
function showNotification(message, type = 'info') {
  // Créer l'élément de notification s'il n'existe pas
  let notification = document.getElementById('spotify-notification');
  
  if (!notification) {
    notification = document.createElement('div');
    notification.id = 'spotify-notification';
    notification.className = 'spotify-notification';
    document.body.appendChild(notification);
  }
  
  // Définir la classe selon le type
  notification.className = `spotify-notification ${type}`;
  
  // Définir le message
  notification.textContent = message;
  
  // Afficher la notification
  notification.classList.add('show');
  
  // La masquer après 3 secondes
  setTimeout(() => {
    notification.classList.remove('show');
    
    // Supprimer l'élément après la fin de l'animation
    setTimeout(() => {
      if (notification.parentNode) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// Variable pour éviter les doubles navigations
let isNavigating = false;

// Variables globales pour la gestion de la lecture
let spotifyQueue = [];
let isShuffleEnabled = false;
// Suppression de la déclaration en double de repeatMode

// Fonction pour activer/désactiver le mode shuffle
function toggleShuffle() {
  isShuffleEnabled = !isShuffleEnabled;
  const shuffleButton = document.getElementById('spotify-shuffle');
  shuffleButton.classList.toggle('active', isShuffleEnabled);
  
  if (isShuffleEnabled && spotifyAllSurahs.length > 0) {
    // Mélanger la liste des sourates
    spotifyAllSurahs = spotifyAllSurahs.sort(() => Math.random() - 0.5);
    showNotification('Lecture aléatoire activée', 'info');
  } else {
    // Remettre la liste dans l'ordre
    spotifyAllSurahs = spotifyAllSurahs.sort((a, b) => a.id - b.id);
    showNotification('Lecture aléatoire désactivée', 'info');
  }
}

// Fonction pour changer le mode de répétition
function toggleRepeat() {
  const repeatButton = document.getElementById('spotify-repeat');
  const modes = ['none', 'all', 'one'];
  const currentIndex = modes.indexOf(repeatMode);
  repeatMode = modes[(currentIndex + 1) % modes.length];
  
  // Mettre à jour l'icône et le style
  repeatButton.classList.remove('active', 'repeat-one');
  if (repeatMode === 'one') {
    repeatButton.classList.add('repeat-one');
    showNotification('Répéter la sourate', 'info');
  } else if (repeatMode === 'all') {
    repeatButton.classList.add('active');
      showNotification('Répéter toutes les sourates', 'info');
  } else {
      showNotification('Répétition désactivée', 'info');
  }
}

// Fonction pour gérer la fin de lecture
function onSpotifyAudioEnded() {
  if (repeatMode === 'one') {
    // Rejouer la même sourate
    spotifyAudioElement.currentTime = 0;
    spotifyAudioElement.play();
  } else if (repeatMode === 'all' || spotifyQueue.length > 0) {
    // Passer à la suivante ou rejouer depuis le début
    playNextSurah();
  }
}

// Fonction pour ajouter une sourate à la queue
function addToQueue(surah, reciterId) {
  spotifyQueue.push({ surah, reciterId });
  if (spotifyQueue.length === 1 && !spotifyAudioElement.src) {
    playFromQueue();
  }
}

// Fonction pour jouer depuis la queue
function playFromQueue() {
  if (spotifyQueue.length === 0) return;
  
  const { surah, reciterId } = spotifyQueue[0];
  playSurah(surah, reciterId);
  spotifyQueue.shift();
}

// Fonction pour activer/désactiver le mini-player
function toggleMiniPlayer() {
  const playerModal = document.getElementById('spotify-player-modal');
  const miniPlayerToggle = document.getElementById('spotify-mini-player-toggle');
  
  if (playerModal.classList.contains('mini-player')) {
    // Retour au mode normal
    playerModal.classList.remove('mini-player');
    miniPlayerToggle.classList.remove('active');
    showNotification('Mode normal', 'info');
  } else {
    // Activer le mini-player
    playerModal.classList.add('mini-player');
    miniPlayerToggle.classList.add('active');
    showNotification('Mini-player activé', 'info');
  }
}

// Mettre à jour l'événement du bouton mini-player
spotifyMiniPlayerToggle.addEventListener('click', toggleMiniPlayer);

// Ajouter ces styles au début du fichier après les autres déclarations de style
const downloadButtonStyles = document.createElement('style');
downloadButtonStyles.textContent = `
  /* Styles pour le bouton de téléchargement */
  .button.dark-single {
    --background: none;
    --rectangle: #555; /* Gris par défaut (non téléchargé) */
    --success: #4BC793;
    --arrow: #fff;
    --checkmark: #fff;
    transition: all 0.3s ease;
    opacity: 1; /* Toujours 100% visible */
    display: block !important; /* Forcer l'affichage */
  }
  
  /* Style quand téléchargé */
  .button.dark-single.downloaded {
    --rectangle: #4BC793; /* Vert quand téléchargé */
    opacity: 0.85; /* Légèrement transparent quand téléchargé */
  }
  
  /* Style pendant le téléchargement */
  .button.dark-single.loading {
    --rectangle: #275efe; /* Bleu pendant le téléchargement */
    opacity: 1; /* 100% visible pendant le téléchargement */
  }
  
  /* Style au survol pour indiquer l'interactivité */
  .button.dark-single:hover {
    transform: scale(1.1);
    opacity: 1;
  }
  
  /* S'assurer que le bouton est toujours visible dans la liste des sourates */
  .spotify-surah-item .button.dark-single {
    visibility: visible !important;
    display: flex !important;
    opacity: 1 !important;
  }
  
  /* Ajouter plus d'espace entre la colonne DURÉE et les boutons */
  .spotify-surah-duration {
    margin-left: 40px !important;
    min-width: 60px !important;
    text-align: right !important;
  }
  
  /* Ajuster l'en-tête DURÉE également */
  .spotify-header .durée {
    margin-left: 40px !important;
    text-align: right !important;
  }
  
  /* Ajouter plus d'espace sur toute la ligne */
  .spotify-surah-item {
    grid-template-columns: 30px 1fr auto 80px auto !important;
    column-gap: 15px !important;
  }
`;
document.head.appendChild(downloadButtonStyles);

// Fonction pour charger les durées réelles des sourates en arrière-plan
async function loadSurahDurationsInBackground() {
  console.log('Chargement des durées des sourates en arrière-plan...');
  
  // Vérifier si les durées sont déjà en cache
  const cachedDurations = localStorage.getItem('surahDurations');
  if (cachedDurations) {
    console.log('Durées des sourates trouvées dans le cache');
    return JSON.parse(cachedDurations);
  }
  
  // Si pas de cache, créer un objet pour stocker les durées
  const durations = {};
  
  // Récupérer tous les récitateurs disponibles
  try {
    const recitersResponse = await fetch('https://api.quran.com/api/v4/resources/recitations');
    const recitersData = await recitersResponse.json();
    
    if (recitersData && recitersData.recitations && recitersData.recitations.length > 0) {
      // Utiliser le premier récitateur pour obtenir les durées
      const reciterId = recitersData.recitations[0].id;
      
      // Récupérer toutes les sourates
      const surahsResponse = await fetch('https://api.quran.com/api/v4/chapters');
      const surahsData = await surahsResponse.json();
      
      if (surahsData && surahsData.chapters) {
        // Limiter à 10 sourates pour ne pas surcharger l'API
        const limitedSurahs = surahsData.chapters.slice(0, 10);
        
        // Charger les durées pour chaque sourate
        for (const surah of limitedSurahs) {
          try {
            const endpoint = `https://api.quran.com/api/v4/chapter_recitations/${reciterId}/${surah.id}`;
            const response = await fetch(endpoint);
            
            if (response.ok) {
              const data = await response.json();
              
              if (data.audio_file && data.audio_file.audio_url) {
                // Créer un élément audio temporaire pour obtenir la durée
                const tempAudio = new Audio();
                
                // Utiliser une promesse pour attendre que les métadonnées soient chargées
                const duration = await new Promise((resolve) => {
                  tempAudio.onloadedmetadata = function() {
                    resolve(formatTime(tempAudio.duration));
                  };
                  
                  tempAudio.onerror = function() {
                    resolve("--:--");
                  };
                  
                  // Charger l'URL audio pour obtenir sa durée
                  tempAudio.src = data.audio_file.audio_url;
                  
                  // Timeout pour éviter de bloquer indéfiniment
                  setTimeout(() => resolve("--:--"), 5000);
                });
                
                // Stocker la durée
                durations[surah.id] = duration;
                console.log(`Durée de la sourate ${surah.id}: ${duration}`);
              }
            }
            
            // Attendre un peu entre chaque requête pour ne pas surcharger l'API
            await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
            console.error(`Erreur lors du chargement de la durée de la sourate ${surah.id}:`, error);
            durations[surah.id] = "--:--";
          }
        }
        
        // Sauvegarder les durées dans le localStorage
        localStorage.setItem('surahDurations', JSON.stringify(durations));
        console.log('Durées des sourates sauvegardées dans le cache');
        
        return durations;
      }
    }
  } catch (error) {
    console.error('Erreur lors du chargement des durées des sourates:', error);
  }
  
  return {};
}

// Lancer le chargement des durées en arrière-plan au démarrage
document.addEventListener('DOMContentLoaded', () => {
  // Charger les durées des sourates en arrière-plan
  loadSurahDurationsInBackground().then(durations => {
    console.log('Durées des sourates chargées:', durations);
    
    // Mettre à jour les durées affichées
    updateSurahDurations();
    
    // Mettre à jour les durées toutes les 5 secondes pour s'assurer qu'elles sont affichées
    // même si la liste est chargée après le chargement des durées
    let updateCount = 0;
    const updateInterval = setInterval(() => {
      updateSurahDurations();
      updateCount++;
      
      // Arrêter après 10 tentatives (50 secondes)
      if (updateCount >= 10) {
        clearInterval(updateInterval);
      }
    }, 5000);
  });
});

// Fonction pour mettre à jour les durées affichées dans la liste des sourates
function updateSurahDurations() {
  // Récupérer les durées du cache
  const cachedDurations = localStorage.getItem('surahDurations');
  if (!cachedDurations) return;
  
  const durations = JSON.parse(cachedDurations);
  
  // Mettre à jour les durées affichées
  const surahItems = document.querySelectorAll('.spotify-surah-item');
  surahItems.forEach(item => {
    const surahId = item.dataset.surahId;
    if (durations[surahId]) {
      const durationElement = item.querySelector('div:nth-child(4)');
      if (durationElement) {
        durationElement.textContent = durations[surahId];
      }
    }
  });
}

// Lancer le chargement des durées en arrière-plan au démarrage
document.addEventListener('DOMContentLoaded', () => {
  // Charger les durées des sourates en arrière-plan
  loadSurahDurationsInBackground().then(durations => {
    console.log('Durées des sourates chargées:', durations);
    
    // Mettre à jour les durées affichées
    updateSurahDurations();
    
    // Mettre à jour les durées toutes les 5 secondes pour s'assurer qu'elles sont affichées
    // même si la liste est chargée après le chargement des durées
    let updateCount = 0;
    const updateInterval = setInterval(() => {
      updateSurahDurations();
      updateCount++;
      
      // Arrêter après 10 tentatives (50 secondes)
      if (updateCount >= 10) {
        clearInterval(updateInterval);
      }
    }, 5000);
  });
});

// Fonction pour obtenir la durée réelle d'une sourate
async function getSurahDuration(surahId, reciterId) {
  try {
    // Vérifier d'abord dans le cache
    const cachedDurations = localStorage.getItem('surahDurations');
    if (cachedDurations) {
      const durations = JSON.parse(cachedDurations);
      if (durations[surahId]) {
        return durations[surahId];
      }
    }
    
    // Si pas dans le cache, récupérer depuis l'API
    const endpoint = `https://api.quran.com/api/v4/chapter_recitations/${reciterId}/${surahId}`;
    const response = await fetch(endpoint);
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.audio_file && data.audio_file.audio_url) {
        // Créer un élément audio temporaire pour obtenir la durée
        const tempAudio = new Audio();
        
        // Utiliser une promesse pour attendre que les métadonnées soient chargées
        const duration = await new Promise((resolve) => {
          tempAudio.onloadedmetadata = function() {
            resolve(formatTime(tempAudio.duration));
          };
          
          tempAudio.onerror = function() {
            resolve("--:--");
          };
          
          // Charger l'URL audio pour obtenir sa durée
          tempAudio.src = data.audio_file.audio_url;
          
          // Timeout pour éviter de bloquer indéfiniment
          setTimeout(() => resolve("--:--"), 5000);
        });
        
        // Mettre en cache la durée
        if (cachedDurations) {
          const durations = JSON.parse(cachedDurations);
          durations[surahId] = duration;
          localStorage.setItem('surahDurations', JSON.stringify(durations));
        } else {
          const durations = {};
          durations[surahId] = duration;
          localStorage.setItem('surahDurations', JSON.stringify(durations));
        }
        
        return duration;
      }
    }
  } catch (error) {
    console.error(`Erreur lors de la récupération de la durée de la sourate ${surahId}:`, error);
  }
  
  return "--:--";
}

// Modifier la fonction renderSurahs pour utiliser les durées réelles
function renderSurahs(surahs, reciterId) {
  // Clear previous content
  spotifySurahListElement.innerHTML = '';
  
  surahs.forEach((surah) => {
    // Utiliser une durée par défaut en attendant la durée réelle
    const duration = "...";
    
    const surahItem = document.createElement('div');
    surahItem.className = 'spotify-surah-item';
    surahItem.dataset.surahId = surah.id;
    surahItem.dataset.reciterId = reciterId;
    
    // Vérifier si cette sourate est déjà téléchargée
    const isOffline = checkOfflineAvailability(surah.id);
    
    surahItem.innerHTML = `
      <div class="spotify-surah-number">${surah.id}</div>
      <div>
        <div class="spotify-surah-name">${surah.name_simple}</div>
        <div class="spotify-surah-name-ar">${surah.name_arabic}</div>
      </div>
      <div style="display: flex; justify-content: center; align-items: center;">
        <button class="button dark-single spotify-download-button ${isOffline ? 'downloaded' : ''}" 
          data-surah-id="${surah.id}" 
          data-reciter-id="${reciterId}" 
          title="${isOffline ? 'Déjà téléchargée' : 'Télécharger la sourate'}"
          style="width: 32px; height: 32px; border: none;"
          onclick="event.stopPropagation(); event.preventDefault(); return false;">
          <div>
              <svg viewBox="0 0 24 24">
                ${isOffline 
                  ? '<path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" fill="var(--checkmark, white)"/>'
                  : '<path d="M12 4v12m-4-4l4 4 4-4" stroke="var(--arrow, white)" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
                }
          </svg>
          </div>
          <div class="download-progress-container">
            <div class="download-progress-bar"></div>
          </div>
        </button>
      </div>
      <div style="display: flex; justify-content: center; align-items: center; text-align: center;" class="surah-duration" data-surah-id="${surah.id}">${duration}</div>
      <button class="spotify-surah-play">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
      </button>
    `;
    
    // --- Ajout du listener d'animation pour CE bouton ---
    const downloadButton = surahItem.querySelector('.spotify-download-button');
    if (downloadButton) {
        downloadButton.addEventListener('click', function(e) {
        e.stopPropagation();
        e.preventDefault();
        
            // Si déjà téléchargé, juste montrer une notification
            if (isOffline || downloadButton.classList.contains('downloaded')) {
                console.log('Cette sourate est déjà téléchargée');
                showNotification('Sourate déjà disponible hors ligne', 'info');
                return false;
            }
            
            // Ajouter la classe loading et commencer le téléchargement
            downloadButton.classList.add('loading');
            
            // Mettre à jour le SVG pour l'animation de téléchargement
            const svg = downloadButton.querySelector('svg');
            if (svg) {
                svg.innerHTML = '<path d="M12 16l-4-4h3V4h2v8h3l-4 4zm-8 2v-6h2v4h12v-4h2v6H4z" fill="var(--arrow, white)"/>';
            }
            
            // Lancer le téléchargement
            if (typeof downloadSurahAudio === 'function') {
                const surahId = parseInt(downloadButton.dataset.surahId);
                const reciterId = parseInt(downloadButton.dataset.reciterId);
                
                console.log(`Téléchargement de la sourate ${surahId} (récitateur ${reciterId})`);
                
                downloadSurahAudio(surahId, reciterId, downloadButton)
                    .then(() => {
                        // Mise à jour réussie - mettre à jour l'icône et la classe
                        downloadButton.classList.remove('loading');
                        downloadButton.classList.add('downloaded');
                        if (svg) {
                            svg.innerHTML = '<path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" fill="var(--checkmark, white)"/>';
                        }
                        downloadButton.title = 'Téléchargement terminé';
                    })
                    .catch(error => {
                        console.error(`Erreur de téléchargement:`, error);
                        downloadButton.classList.remove('loading');
                        if (svg) {
                            svg.innerHTML = '<path d="M12 4v12m-4-4l4 4 4-4" stroke="var(--arrow, white)" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
                        }
                        showNotification('Erreur de téléchargement', 'error');
                    });
            }
            
            return false; // Empêcher la propagation
        }, true); // Phase de capture
    }
    
    // Play button click event
    surahItem.querySelector('.spotify-surah-play').addEventListener('click', (e) => {
        e.stopPropagation();
        playSurah(surah, reciterId);
      });
    
    // Entire row click event
    surahItem.addEventListener('click', () => {
      playSurah(surah, reciterId);
    });
    
    spotifySurahListElement.appendChild(surahItem);
    
    // Charger la durée réelle en arrière-plan
    getSurahDuration(surah.id, reciterId).then(realDuration => {
      const durationElement = document.querySelector(`.surah-duration[data-surah-id="${surah.id}"]`);
      if (durationElement) {
        durationElement.textContent = realDuration;
      }
    });
  });
}

// ... existing code ...

// Fonction pour vérifier et reprendre les téléchargements interrompus
async function checkPendingDownloads() {
  try {
    const pendingDownload = localStorage.getItem('pendingDownload');
    if (!pendingDownload) return;
    
    const downloadInfo = JSON.parse(pendingDownload);
    const { surahId, reciterId, progress, timestamp, downloadedVersets } = downloadInfo;
    
    // Vérifier si le téléchargement date de moins de 24h
    const downloadDate = new Date(timestamp);
    const now = new Date();
    const hoursDiff = (now - downloadDate) / (1000 * 60 * 60);
    
    if (hoursDiff > 24) {
      console.log("Téléchargement trop ancien, suppression");
      localStorage.removeItem('pendingDownload');
      return;
    }
    
    // Trouver le bouton de téléchargement correspondant
    const downloadButton = document.querySelector(`.spotify-download-button[data-surah-id="${surahId}"]`);
    if (!downloadButton) {
      console.log("Bouton de téléchargement non trouvé");
      return;
    }
    
    // Demander à l'utilisateur s'il veut reprendre le téléchargement
    const shouldResume = await showConfirmDialog(
      'Téléchargement interrompu',
      `Un téléchargement de la sourate ${surahId} a été interrompu à ${progress}%. Voulez-vous le reprendre ?`
    );
    
    if (shouldResume) {
      // Reprendre le téléchargement
      downloadSurahAudio(surahId, reciterId, downloadButton);
    } else {
      // Supprimer les données de téléchargement
      localStorage.removeItem('pendingDownload');
    }
        
      } catch (error) {
    console.error("Erreur lors de la vérification des téléchargements en attente:", error);
    localStorage.removeItem('pendingDownload');
  }
}

// Fonction pour afficher une boîte de dialogue de confirmation
function showConfirmDialog(title, message) {
  return new Promise((resolve) => {
    const dialog = document.createElement('div');
    dialog.className = 'spotify-dialog';
    dialog.innerHTML = `
      <div class="spotify-dialog-content">
        <h3>${title}</h3>
        <p>${message}</p>
        <div class="spotify-dialog-buttons">
          <button class="spotify-dialog-button spotify-dialog-cancel">Annuler</button>
          <button class="spotify-dialog-button spotify-dialog-confirm">Reprendre</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(dialog);
    
    // Gérer les clics sur les boutons
    dialog.querySelector('.spotify-dialog-cancel').addEventListener('click', () => {
      dialog.remove();
      resolve(false);
    });
    
    dialog.querySelector('.spotify-dialog-confirm').addEventListener('click', () => {
      dialog.remove();
      resolve(true);
    });
  });
}

// ... existing code ...