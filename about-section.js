// Fonction pour afficher la section À propos
function showAboutSection() {
  // Vérifier si une fenêtre About est déjà ouverte et la supprimer
  const existingOverlay = document.querySelector('.about-overlay');
  if (existingOverlay) {
    existingOverlay.remove();
  }

  // Création de l'overlay
  const aboutOverlay = document.createElement('div');
  aboutOverlay.className = 'about-overlay';
  
  // Année actuelle pour le copyright
  const currentYear = new Date().getFullYear();
  const appVersion = '1.5.0'; // Idéalement, cela devrait être récupéré depuis package.json
  
  // HTML pour la fenêtre À propos avec design moderne et professionnel
  aboutOverlay.innerHTML = `
    <div class="about-container">
      <div class="about-backdrop"></div>
      
      <div class="about-header">
        <div class="about-logo-container">
          <img src="assets/images/icon.png" alt="PlayQuran Logo" class="about-logo">
          <div class="about-logo-glow"></div>
        </div>
        <button class="about-close-btn" id="about-close-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      
      <div class="about-content-wrapper">
        <div class="about-title-section">
          <h1 class="about-app-name">PlayQuran</h1>
          <div class="about-version-badge">${appVersion}</div>
          <div class="about-tagline">Lecture et écoute modernes du Coran</div>
        </div>
        
        <div class="about-divider"></div>
        
        <div class="about-features-section">
          <div class="about-feature-grid">
            <div class="about-feature">
              <div class="about-feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 6v6l4 2"></path>
                  <circle cx="12" cy="12" r="10"></circle>
                </svg>
              </div>
              <div class="about-feature-content">
                <h3>Récitation audio</h3>
                <p>Des récitations par les meilleurs récitateurs internationaux</p>
              </div>
            </div>
            
            <div class="about-feature">
              <div class="about-feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
              </div>
              <div class="about-feature-content">
                <h3>Mode hors-ligne</h3>
                <p>Téléchargez vos sourates pour les consulter sans connexion</p>
              </div>
            </div>
            
            <div class="about-feature">
              <div class="about-feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
              </div>
              <div class="about-feature-content">
              <h3>Favoris</h3>
                <p>Marquez vos passages préférés pour y accéder facilement</p>
              </div>
            </div>
            
            <div class="about-feature">
              <div class="about-feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path>
                </svg>
              </div>
              <div class="about-feature-content">
                <h3>Météo et prières</h3>
                <p>Informations météo locales et horaires de prière précis</p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="about-divider"></div>
        
        <div class="about-developer-section">
          <div class="about-dev-header">Développé par</div>
          <div class="about-developer-card">
            <div class="about-developer-photo-container">
              <div class="about-developer-photo"></div>
            </div>
            <div class="about-developer-details">
              <h3 class="about-developer-name">Anis Mosbah</h3>
              <p class="about-developer-title">Développeur & Designer</p>
              <div class="about-dev-contact">
                <a href="mailto:contact@playquran.app" class="about-email">contact@playquran.app</a>
              </div>
            </div>
          </div>
        </div>
        
        <div class="about-footer">
          <div class="about-platform-badge">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z"></path>
              <path d="M10 2c1 .5 2 2 2 5"></path>
            </svg>
            <span>macOS Universal (Apple Silicon & Intel)</span>
          </div>
          <div class="about-legal">
            <p class="about-copyright">© ${currentYear} PlayQuran. Tous droits réservés.</p>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Ajout de l'overlay au body
  document.body.appendChild(aboutOverlay);
  
  // Fonction simple de fermeture
  function closeAbout() {
    aboutOverlay.classList.add('closing');
    aboutOverlay.classList.remove('visible');
    
    setTimeout(() => {
      aboutOverlay.remove();
    }, 300);
  }
  
  // Gestion de la fermeture
  const closeButton = aboutOverlay.querySelector('#about-close-btn');
  closeButton.onclick = closeAbout; // Utiliser onclick au lieu de addEventListener
  
  // Fermeture en cliquant en dehors
  aboutOverlay.onclick = function(e) {
    if (e.target === aboutOverlay) {
      closeAbout();
    }
  };
  
  // Fermeture avec la touche Échap
  const escListener = function(e) {
    if (e.key === 'Escape') {
      closeAbout();
      document.removeEventListener('keydown', escListener);
    }
  };
  document.addEventListener('keydown', escListener);
  
  // Ajouter une classe pour l'animation d'entrée
  setTimeout(() => {
    aboutOverlay.classList.add('visible');
  }, 50);
}

// Ajouter les styles CSS pour la section À propos avec support du mode sombre et clair
function injectAboutStyles() {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'about-section-styles';
  styleSheet.textContent = `
    .about-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      opacity: 0;
      transition: all 0.3s ease;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
    }
    
    .about-overlay.visible {
      opacity: 1;
      backdrop-filter: blur(15px);
      -webkit-backdrop-filter: blur(15px);
    }
    
    .about-overlay.closing {
      opacity: 0;
      background-color: rgba(0, 0, 0, 0.1);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
    }
    
    .about-container {
      width: 560px;
      max-width: 95vw;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      position: relative;
      transform: scale(0.95);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      border-radius: 20px;
      background-color: rgba(255, 255, 255, 0.85);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15), 
                  0 0 0 1px rgba(255, 255, 255, 0.1),
                  0 0 40px rgba(0, 0, 0, 0.05);
      color: #333;
      overflow-y: auto;
    }
    
    [data-theme="dark"] .about-container {
      background-color: rgba(30, 30, 32, 0.85);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3), 
                 0 0 0 1px rgba(255, 255, 255, 0.08),
                 0 0 40px rgba(0, 0, 0, 0.3);
      color: #f5f5f7;
    }
    
    .about-backdrop {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: -1;
      background: radial-gradient(circle at top right, 
                  rgba(59, 130, 246, 0.15), 
                  transparent 70%),
                 radial-gradient(circle at bottom left, 
                  rgba(59, 130, 246, 0.12), 
                  transparent 70%);
      opacity: 0.6;
    }
    
    [data-theme="dark"] .about-backdrop {
      background: radial-gradient(circle at top right, 
                  rgba(59, 130, 246, 0.2), 
                  transparent 70%),
                 radial-gradient(circle at bottom left, 
                  rgba(59, 130, 246, 0.18), 
                  transparent 70%);
      opacity: 0.5;
    }
    
    .about-overlay.visible .about-container {
      transform: scale(1);
    }
    
    .about-overlay.closing .about-container {
      transform: scale(0.95);
    }
    
    .about-header {
      display: flex;
      justify-content: center;
      padding: 30px 0 10px;
      position: relative;
    }
    
    .about-logo-container {
      position: relative;
      width: 96px;
      height: 96px;
    }
    
    .about-logo {
      width: 96px;
      height: 96px;
      border-radius: 22px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
      object-fit: cover;
      border: 1px solid rgba(255, 255, 255, 0.3);
      position: relative;
      z-index: 1;
      background-color: transparent;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    
    .about-logo:hover {
      transform: scale(1.03);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
    }
    
    [data-theme="dark"] .about-logo {
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
    
    .about-logo-glow {
      position: absolute;
      top: 10%;
      left: 10%;
      width: 80%;
      height: 80%;
      border-radius: 20px;
      z-index: 0;
      filter: blur(15px);
      background: linear-gradient(45deg, rgba(59, 130, 246, 0.6), rgba(59, 130, 246, 0.4));
      opacity: 0.5;
      animation: pulse 3s infinite alternate;
    }
    
    @keyframes pulse {
      0% { opacity: 0.3; transform: scale(0.95); }
      100% { opacity: 0.5; transform: scale(1.05); }
    }
    
    .about-close-btn {
      position: absolute;
      top: 16px;
      right: 16px;
      background: rgba(240, 240, 240, 0.6);
      border: none;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #555;
      cursor: pointer;
      transition: all 0.2s ease;
      z-index: 10;
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
    }
    
    [data-theme="dark"] .about-close-btn {
      background: rgba(60, 60, 65, 0.6);
      color: rgba(255, 255, 255, 0.8);
    }
    
    .about-close-btn:hover {
      background: rgba(230, 230, 230, 0.9);
      transform: scale(1.05);
    }
    
    [data-theme="dark"] .about-close-btn:hover {
      background: rgba(80, 80, 85, 0.8);
      color: white;
    }
    
    .about-content-wrapper {
      padding: 0 30px 30px;
      display: flex;
      flex-direction: column;
      gap: 25px;
    }
    
    .about-title-section {
      text-align: center;
      margin-top: 5px;
    }
    
    .about-app-name {
      font-size: 2.2rem;
      font-weight: 600;
      margin: 0;
      background: linear-gradient(90deg, #3b82f6, #60a5fa);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      display: inline-block;
      letter-spacing: -0.02em;
    }
    
    .about-version-badge {
      display: inline-block;
      background-color: rgba(59, 130, 246, 0.1);
      color: #3b82f6;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;
      margin: 8px 0 0;
    }
    
    [data-theme="dark"] .about-version-badge {
      background-color: rgba(59, 130, 246, 0.2);
    }
    
    .about-tagline {
      font-size: 1rem;
      color: #666;
      margin-top: 10px;
    }
    
    [data-theme="dark"] .about-tagline {
      color: rgba(255, 255, 255, 0.7);
    }
    
    .about-divider {
      width: 100%;
      height: 1px;
      background: linear-gradient(90deg, 
                  transparent, 
                  rgba(59, 130, 246, 0.3), 
                  rgba(59, 130, 246, 0.3), 
                  transparent);
      margin: 5px 0;
    }
    
    .about-features-section {
      padding: 10px 0;
    }
    
    .about-feature-grid {
      display: grid;
      grid-template-columns: repeat(1, 1fr);
      gap: 16px;
    }
    
    .about-feature {
      display: flex;
      align-items: flex-start;
      padding: 14px;
      border-radius: 12px;
      transition: all 0.2s ease;
      background-color: rgba(255, 255, 255, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.5);
    }
    
    [data-theme="dark"] .about-feature {
      background-color: rgba(50, 50, 55, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.05);
    }
    
    .about-feature:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
      background-color: rgba(255, 255, 255, 0.6);
    }
    
    [data-theme="dark"] .about-feature:hover {
      background-color: rgba(60, 60, 70, 0.6);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
    }
    
    .about-feature-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: linear-gradient(135deg, #3b82f6, #60a5fa);
      color: white;
      margin-right: 16px;
      flex-shrink: 0;
    }
    
    .about-feature-content {
      flex: 1;
    }
    
    .about-feature-content h3 {
      margin: 0 0 6px;
      font-size: 1rem;
      font-weight: 600;
      color: #333;
    }
    
    [data-theme="dark"] .about-feature-content h3 {
      color: #f5f5f7;
    }
    
    .about-feature-content p {
      margin: 0;
      font-size: 0.9rem;
      color: #666;
      line-height: 1.4;
    }
    
    [data-theme="dark"] .about-feature-content p {
      color: rgba(255, 255, 255, 0.7);
    }
    
    .about-developer-section {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }
    
    .about-dev-header {
      font-size: 0.9rem;
      font-weight: 500;
      color: #666;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    [data-theme="dark"] .about-dev-header {
      color: rgba(255, 255, 255, 0.7);
    }
    
    .about-developer-card {
      display: flex;
      align-items: center;
      width: 100%;
      padding: 16px;
      background-color: rgba(255, 255, 255, 0.5);
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.5);
      transition: all 0.2s ease;
    }
    
    [data-theme="dark"] .about-developer-card {
      background-color: rgba(50, 50, 55, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.05);
    }
    
    .about-developer-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
      background-color: rgba(255, 255, 255, 0.7);
    }
    
    [data-theme="dark"] .about-developer-card:hover {
      background-color: rgba(60, 60, 70, 0.6);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
    }
    
    .about-developer-photo-container {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      overflow: hidden;
      background: rgba(80, 80, 90, 0.1);
      margin-right: 16px;
      border: 2px solid rgba(255, 255, 255, 0.6);
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      flex-shrink: 0;
    }
    
    [data-theme="dark"] .about-developer-photo-container {
      background: rgba(80, 80, 90, 0.3);
      border: 2px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
    }
    
    .about-developer-card:hover .about-developer-photo-container {
      transform: scale(1.05);
      box-shadow: 0 6px 15px rgba(0, 0, 0, 0.12);
    }
    
    .about-developer-photo {
      width: 100%;
      height: 100%;
      background: url('assets/images/developer/profile.png') center/cover;
    }
    
    .about-developer-details {
      flex: 1;
    }
    
    .about-developer-name {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 600;
      color: #333;
    }
    
    [data-theme="dark"] .about-developer-name {
      color: #f5f5f7;
    }
    
    .about-developer-title {
      margin: 4px 0 0;
      font-size: 0.9rem;
      color: #666;
    }
    
    [data-theme="dark"] .about-developer-title {
      color: rgba(255, 255, 255, 0.7);
    }
    
    .about-dev-contact {
      margin-top: 6px;
    }
    
    .about-email {
      font-size: 0.8rem;
      color: #3b82f6;
      text-decoration: none;
      display: inline-block;
      transition: all 0.2s ease;
    }
    
    .about-email:hover {
      color: #1d4ed8;
      transform: translateY(-1px);
    }
    
    [data-theme="dark"] .about-email {
      color: #60a5fa;
    }
    
    [data-theme="dark"] .about-email:hover {
      color: #93c5fd;
    }
    
    .about-footer {
      margin-top: 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }
    
    .about-platform-badge {
      display: flex;
      align-items: center;
      background-color: rgba(0, 0, 0, 0.05);
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
      color: #666;
    }
    
    [data-theme="dark"] .about-platform-badge {
      background-color: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.7);
    }
    
    .about-platform-badge svg {
      margin-right: 8px;
      stroke-width: 1.5px;
    }
    
    .about-legal {
      text-align: center;
    }
    
    .about-copyright {
      font-size: 0.8rem;
      color: #888;
      margin: 0;
    }
    
    [data-theme="dark"] .about-copyright {
      color: rgba(255, 255, 255, 0.5);
    }
    
    @media (max-width: 600px) {
      .about-container {
        max-height: 95vh;
      }
      
      .about-content-wrapper {
        padding: 0 20px 20px;
      }
      
      .about-app-name {
        font-size: 1.8rem;
      }
    }
  `;
  
  document.head.appendChild(styleSheet);
}

// Initialiser la section À propos
function initAboutSection() {
  injectAboutStyles();
  
  // Appeler showAboutSection lorsque l'utilisateur clique sur "À propos"
  document.addEventListener('click', (e) => {
    if (e.target.closest('.about-menu-item')) {
    showAboutSection();
    }
  });
  
  // Ajouter un élément au menu principal s'il existe
  addAboutMenuToMainMenu();
}

// Ajouter un élément "À propos" au menu principal
function addAboutMenuToMainMenu() {
  // Attendre que le DOM soit complètement chargé
  document.addEventListener('DOMContentLoaded', () => {
    // Chercher un conteneur de menu existant ou créer une balise pour cela
    const sidebar = document.querySelector('.sidebar');
    
    if (sidebar) {
      const aboutMenuItem = document.createElement('div');
      aboutMenuItem.className = 'sidebar-icon-button about-menu-item';
      aboutMenuItem.title = 'À propos de PlayQuran';
      aboutMenuItem.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
      `;
      
      // S'il y a des icônes existantes dans la sidebar, ajouter en première position
      const sidebarIcons = sidebar.querySelector('.sidebar-icons');
      if (sidebarIcons) {
        // Insérer en première position
        if (sidebarIcons.firstChild) {
          sidebarIcons.insertBefore(aboutMenuItem, sidebarIcons.firstChild);
        } else {
          sidebarIcons.appendChild(aboutMenuItem);
        }
      } else {
        // Sinon ajouter au début de la sidebar
        sidebar.prepend(aboutMenuItem);
      }
      
      // Ajouter l'événement pour montrer la section À propos
      aboutMenuItem.addEventListener('click', () => {
        showAboutSection();
      });
    }
  });
    }

// Initialiser le module À propos au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
  initAboutSection();
});

// Exporter les fonctions pour les rendre disponibles
module.exports = {
  showAboutSection,
  initAboutSection
};
