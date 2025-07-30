#!/bin/bash

# Couleurs pour le terminal
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Script de build PlayQuran Universal ===${NC}"
echo -e "${YELLOW}Ce script va créer une version universelle pour Intel et Apple Silicon${NC}"

# Créer le dossier cache pour electron
mkdir -p .electron-cache

# Vérifier si electron est téléchargé
ELECTRON_VERSION="35.1.3"
ARM64_PATH=".electron-cache/electron-v${ELECTRON_VERSION}-darwin-arm64.zip"
X64_PATH=".electron-cache/electron-v${ELECTRON_VERSION}-darwin-x64.zip"

if [ ! -f "$ARM64_PATH" ]; then
  echo -e "${YELLOW}Téléchargement de Electron pour Apple Silicon...${NC}"
  curl -L "https://github.com/electron/electron/releases/download/v${ELECTRON_VERSION}/electron-v${ELECTRON_VERSION}-darwin-arm64.zip" -o "$ARM64_PATH"
else
  echo -e "${GREEN}Electron pour Apple Silicon déjà téléchargé${NC}"
fi

if [ ! -f "$X64_PATH" ]; then
  echo -e "${YELLOW}Téléchargement de Electron pour Intel...${NC}"
  curl -L "https://github.com/electron/electron/releases/download/v${ELECTRON_VERSION}/electron-v${ELECTRON_VERSION}-darwin-x64.zip" -o "$X64_PATH"
else
  echo -e "${GREEN}Electron pour Intel déjà téléchargé${NC}"
fi

# Nettoyer les builds précédents
echo -e "${YELLOW}Nettoyage des builds précédents...${NC}"
rm -rf dist

# Créer l'application universelle
echo -e "${GREEN}Création de l'application universelle...${NC}"
npm run build:universal

# Vérifier si le build a réussi
if [ $? -eq 0 ]; then
  echo -e "${GREEN}====================================${NC}"
  echo -e "${GREEN}Build réussi !${NC}"
  echo -e "${GREEN}L'application universelle est disponible dans le dossier dist/${NC}"
  echo -e "${GREEN}====================================${NC}"
else
  echo -e "${RED}====================================${NC}"
  echo -e "${RED}Échec du build !${NC}"
  echo -e "${RED}Vérifiez les erreurs ci-dessus.${NC}"
  echo -e "${RED}====================================${NC}"
fi
