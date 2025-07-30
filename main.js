const { app, BrowserWindow, Menu, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const remote = require('@electron/remote/main');

// Initialiser remote
remote.initialize();

// Dossier pour les fichiers téléchargés
const downloadsBaseDir = path.join(app.getPath('userData'), 'downloads');

// Maintenir une référence globale à la fenêtre
let mainWindow;
let aboutWindow;

// Fonction pour créer le dossier de téléchargements s'il n'existe pas
function ensureDownloadsDir() {
  if (!fs.existsSync(downloadsBaseDir)) {
    fs.mkdirSync(downloadsBaseDir, { recursive: true });
  }
  return downloadsBaseDir;
}

// Gestionnaires IPC pour la sauvegarde de fichiers
ipcMain.handle('create-download-directory', (event, folderName) => {
  try {
    ensureDownloadsDir(); // S'assurer que le dossier de base existe
    
    const surahDir = path.join(downloadsBaseDir, folderName);
    if (!fs.existsSync(surahDir)) {
      fs.mkdirSync(surahDir, { recursive: true });
    }
    
    return surahDir;
  } catch (error) {
    console.error('Erreur lors de la création du dossier de téléchargement:', error);
    return null;
  }
});

ipcMain.handle('save-audio-file', async (event, { path: filePath, fileName, data }) => {
  try {
    const fullPath = path.join(filePath, fileName);
    fs.writeFileSync(fullPath, data);
    return fullPath;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du fichier audio:', error);
    return null;
  }
});

// Gestionnaire pour sauvegarder les fichiers audio en base64
ipcMain.handle('save-audio-file-base64', async (event, { path: filePath, fileName, data }) => {
  try {
    console.log(`Sauvegarde du fichier en base64: ${fileName} dans ${filePath}`);
    
    // Convertir la chaîne base64 en buffer
    const buffer = Buffer.from(data, 'base64');
    
    const fullPath = path.join(filePath, fileName);
    fs.writeFileSync(fullPath, buffer);
    console.log(`Fichier sauvegardé avec succès: ${fullPath}`);
    return fullPath;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du fichier audio depuis base64:', error);
    return null;
  }
});

// Gestionnaire pour lire les fichiers audio hors ligne
ipcMain.handle('get-offline-audio-paths', (event) => {
  try {
    return downloadsBaseDir;
  } catch (error) {
    console.error('Erreur lors de la récupération des chemins audio hors ligne:', error);
    return null;
  }
});

function createWindow() {
  // Créer la fenêtre du navigateur avec un design moderne Apple
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 960,
    minHeight: 600,
    titleBarStyle: "hiddenInset", // Style de barre de titre spécifique à macOS
    vibrancy: "under-window", // Effet de vibrancy amélioré pour macOS
    visualEffectState: "active",
    trafficLightPosition: { x: 20, y: 20 }, // Position des boutons de la fenêtre à la macOS
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    backgroundColor: "#00000000", // Transparent pour permettre les effets de vibrancy
    show: false, // Ne pas afficher la fenêtre jusqu'à ce qu'elle soit prête
    title: 'PlayOuran'
  });

  // Charger le fichier index HTML
  mainWindow.loadFile("index.html");

  // Afficher la fenêtre une fois qu'elle est prête pour éviter les flashs
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  // Activer le module remote pour cette fenêtre
  remote.enable(mainWindow.webContents);

  // Écouter l'événement de fermeture
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Créer le menu de l'application pour macOS
  const template = [
    {
      label: app.name,
      submenu: [
        { role: "about" },
        { type: "separator" },
        { role: "services" },
        { type: "separator" },
        { role: "hide" },
        { role: "hideothers" },
        { role: "unhide" },
        { type: "separator" },
        { role: "quit" }
      ]
    },
    {
      label: "Fichier",
      submenu: [
        {
          label: "Nouvelle fenêtre",
          accelerator: "CmdOrCtrl+N",
          click: () => createWindow()
        },
        { type: "separator" },
        { role: "close" }
      ]
    },
    {
      label: "Édition",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" }
      ]
    },
    {
      label: "Affichage",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" }
      ]
    },
    {
      label: "Audio",
      submenu: [
        { 
          label: "Lecture/Pause",
          accelerator: "Space",
          click: () => mainWindow.webContents.executeJavaScript("toggleAudio()")
        },
        { 
          label: "Prochain Verset",
          accelerator: "Right",
          click: () => mainWindow.webContents.executeJavaScript("nextVerse()")
        },
        { 
          label: "Verset Précédent",
          accelerator: "Left",
          click: () => mainWindow.webContents.executeJavaScript("prevVerse()")
        }
      ]
    },
    {
      role: "window",
      submenu: [
        { role: "minimize" },
        { role: "zoom" },
        { type: "separator" },
        { role: "front" }
      ]
    },
    {
      role: "help",
      submenu: [
        {
          label: "À propos",
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('show-about');
            }
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// À propos
ipcMain.on("show-about", () => {
  if (!aboutWindow) {
    aboutWindow = new BrowserWindow({
      width: 500, 
      height: 600,
      parent: mainWindow,
      modal: true,
      transparent: true,
      frame: false,
      titleBarStyle: 'hidden',
      resizable: false,
      maximizable: false,
      minimizable: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      },
      backgroundColor: "#00000000",
      title: "À propos de PlayOuran",
      vibrancy: 'under-window', // Effet de vitrail sur macOS
      visualEffectState: 'active'
    });
    aboutWindow.loadFile("about.html");
    
    // Écoutez l'événement de fermeture
    aboutWindow.on("closed", () => {
      aboutWindow = null;
    });
    
    // Fermeture en cliquant sur Échap
    aboutWindow.webContents.on('before-input-event', (event, input) => {
      if (input.key === 'Escape') {
        aboutWindow.close();
      }
    });
  } else {
    // Si la fenêtre existe déjà, mettez-la au premier plan
    aboutWindow.show();
  }
});

// Créer la fenêtre lorsque Electron est prêt
app.whenReady().then(() => {
  createWindow();

  // Sur macOS, il est courant de recréer une fenêtre lorsque
  // l'icône du dock est cliquée et qu'il n'y a pas d'autres fenêtres ouvertes
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quitter l'application lorsque toutes les fenêtres sont fermées,
// sauf sur macOS où il est courant que les applications restent
// actives jusqu'à ce que l'utilisateur quitte explicitement avec Cmd + Q
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Créer un fichier about.html vide que nous remplirons plus tard
if (!fs.existsSync(path.join(__dirname, "about.html"))) {
  fs.writeFileSync(
    path.join(__dirname, "about.html"),
    `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>À propos de PlayOuran</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", sans-serif;
          padding: 40px 20px;
          text-align: center;
          background-color: transparent;
          color: #1d1d1f;
          margin: 0;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        h1 {
          color: #0071e3;
          margin-top: 40px;
          font-size: 24px;
          font-weight: 600;
          letter-spacing: -0.02em;
        }
        p {
          margin: 10px 0;
          font-size: 14px;
          line-height: 1.5;
          color: #515154;
        }
        .logo {
          width: 80px;
          height: 80px;
          margin-bottom: 20px;
        }
        .version {
          display: inline-block;
          background-color: rgba(0,0,0,0.05);
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          margin-top: 10px;
        }
        .dev-info {
          margin-top: 20px;
          font-size: 12px;
          color: #707070;
        }
      </style>
    </head>
    <body>
      <svg class="logo" xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#0071e3" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
      </svg>
      <h1>PlayOuran</h1>
      <p class="version">Version 1.5.0</p>
      <p>Une application moderne pour lire et écouter le Saint Coran</p>
      <p class="dev-info">Développé par Anis Mosbah</p>
      <p>© 2024 - Tous droits réservés</p>
    </body>
    </html>`
  );
}
