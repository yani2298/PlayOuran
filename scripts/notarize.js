// Ce script est utilisé pour notariser l'application macOS
// Il est appelé après la signature de l'application par electron-builder
const { notarize } = require('electron-notarize');
const path = require('path');
const fs = require('fs');

exports.default = async function notarizing(context) {
  // Ne pas notariser si ce n'est pas un build macOS
  if (process.platform !== 'darwin' || !process.env.CI) {
    console.log('Notarisation ignorée : pas sur macOS ou pas en CI');
    return;
  }

  // Vérifier si les variables d'environnement nécessaires sont définies
  const { APPLE_ID, APPLE_ID_PASSWORD, TEAM_ID } = process.env;
  if (!APPLE_ID || !APPLE_ID_PASSWORD || !TEAM_ID) {
    console.log('Notarisation ignorée : identifiants Apple manquants');
    return;
  }

  console.log('Début de la notarisation...');

  // Récupérer le chemin de l'application macOS
  const packageInfo = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  const appName = packageInfo.build.productName;
  const appPath = path.join(context.appOutDir, `${appName}.app`);

  try {
    await notarize({
      appBundleId: packageInfo.build.appId,
      appPath,
      appleId: APPLE_ID,
      appleIdPassword: APPLE_ID_PASSWORD,
      teamId: TEAM_ID,
      tool: 'notarytool',
    });
    
    console.log(`Notarisation terminée avec succès : ${appPath}`);
  } catch (error) {
    console.error('Erreur lors de la notarisation :', error);
    throw error;
  }
}; 