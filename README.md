# 🕌 PlayOuran - Modern Quran Reading App for macOS

[![GitHub release](https://img.shields.io/github/v/release/yani2298/PlayOuran?style=for-the-badge&logo=github)](https://github.com/yani2298/PlayOuran/releases)
[![License CC BY-NC-SA](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-red?style=for-the-badge)](LICENSE)
[![macOS Support](https://img.shields.io/badge/Platform-macOS-blue?style=for-the-badge&logo=apple)](https://www.apple.com/macos/)
[![Built with Electron](https://img.shields.io/badge/Built%20with-Electron-47848f?style=for-the-badge&logo=electron)](https://electronjs.org/)
[![French Interface](https://img.shields.io/badge/Interface-Français-blue?style=for-the-badge)](https://fr.wikipedia.org/wiki/Français)

> **🌙 A modern Quran reading application for macOS with French interface. Built with Electron for a native desktop experience.**

<div align="center">

### 📖 **Interface en Français - Designed for French-speaking Muslims** 🇫🇷

**Keywords**: *quran app, islamic software, quran reader, french islamic app, lecteur coran, logiciel islamique*

</div>

## ✨ Current Features

### 📖 **Quran Reading Experience**
- 🎨 **Arabic Typography** - Clean fonts for Quranic text reading
- 📑 **Surah Navigation** - Browse through different chapters
- 📱 **Responsive Interface** - Adapts to window size
- 🌐 **French Interface** - Complete interface in French language

### 🕌 **Islamic Utilities**
- ⏰ **Prayer Times** - Basic prayer time display
- 🧭 **Qibla Direction** - Simple compass feature
- 📅 **Islamic Calendar** - Basic Hijri date display
- 🌙 **Islamic Themes** - Light and dark modes

### 🌟 **Desktop Experience**
- 🍎 **Native macOS** - Optimized for macOS
- ⚡ **Fast Performance** - Built with Electron
- 🔒 **Privacy-Focused** - No data tracking

## 🖼️ Screenshots

<div align="center">

### **Interface Principale - Lecture du Coran**
<img width="1489" height="966" alt="PlayOuran - Interface de lecture du Coran" src="https://github.com/user-attachments/assets/ee74d0bf-ff9d-4e09-a8b6-7e5c035598ee" />

### **Sélection des Sourates**
<img width="1489" height="966" alt="PlayOuran - Sélection des sourates" src="https://github.com/user-attachments/assets/364eb8c6-a337-4d06-99a3-d90ebc20319d" />

### **Heures de Prière et Méteo**
<img width="1489" height="966" alt="PlayOuran - Heures de prière" src="https://github.com/user-attachments/assets/9d46f3c1-1a29-49ef-afe0-a799390e4558" />

### **Interface Complète de l'Application**
<img width="1489" height="966" alt="PlayOuran - Vue d'ensemble" src="https://github.com/user-attachments/assets/f981d9f6-edc4-4a92-8e94-1c854117aeee" />

</div>

## 📥 Download & Installation

### **System Requirements**
- **macOS 10.15** (Catalina) or later
- **Intel** or **Apple Silicon** (M1/M2/M3) processor
- **300 MB** free disk space

### **Installation Steps**
1. Download `PlayOuran-1.5.0-Universal.dmg` from [Releases](https://github.com/yani2298/PlayOuran/releases/latest)
2. Open the DMG file
3. Drag **PlayOuran** to your Applications folder
4. Launch from Applications or Spotlight

> **Note**: On first launch, right-click → "Open" to allow the application.

## 🛠️ **Technology Stack**

<div align="center">

| **Frontend** | **Platform** | **APIs** |
|-------------|-------------|----------|
| ![Electron](https://img.shields.io/badge/Electron-47848f?style=for-the-badge&logo=electron) | ![macOS](https://img.shields.io/badge/macOS-000000?style=for-the-badge&logo=apple) | ![APIs](https://img.shields.io/badge/Islamic%20APIs-green?style=for-the-badge) |
| ![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white) | ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black) | ![REST](https://img.shields.io/badge/REST%20APIs-blue?style=for-the-badge) |

</div>

### **Core Technologies**
- **[Electron](https://electronjs.org/)** - Cross-platform desktop framework
- **[Node.js](https://nodejs.org/)** - JavaScript runtime
- **HTML5, CSS3, ES6+** - Modern web technologies
- **French Localization** - Complete French interface

### **External APIs**
- **Prayer Times API** - For accurate prayer calculations
- **Islamic Calendar API** - For Hijri date conversion
- **Quran Text API** - For Quranic content

## 🏗️ **Development Setup**

```bash
# Clone the repository
git clone https://github.com/yani2298/PlayOuran.git
cd PlayOuran

# Install dependencies
npm install

# Start development server
npm start

# Build for macOS
npm run build:mac
```

### **Project Structure**
```
PlayOuran/
├── 📁 assets/           # Images, icons, and media files
├── 📁 scripts/          # Build and deployment scripts
├── 📄 main.js           # Electron main process
├── 📄 renderer.js       # Application logic and UI
├── 📄 index.html        # Main application HTML
├── 📄 style.css         # Styling and themes
└── 📄 package.json      # Dependencies and scripts
```

## 🤝 **Contributing**

We welcome contributions from the Muslim developer community!

### **Ways to Contribute**
- 🐛 **Bug Reports** - [Create Issue](https://github.com/yani2298/PlayOuran/issues/new?template=bug_report.md)
- 💡 **Feature Requests** - [Suggest Enhancement](https://github.com/yani2298/PlayOuran/issues/new?template=feature_request.md)
- 🔧 **Code Contributions** - Submit pull requests
- 🌐 **Translations** - Help with Arabic translations
- 📖 **Documentation** - Improve guides and docs

### **Development Guidelines**
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/prayer-enhancement`
3. Make your changes following coding standards
4. Test on macOS
5. Commit: `git commit -m "feat: add new prayer calculation"`
6. Push: `git push origin feature/prayer-enhancement`
7. Open a Pull Request

## 📱 **Community & Support**

- **GitHub Issues**: [Report bugs and request features](https://github.com/yani2298/PlayOuran/issues)
- **Discussions**: [Community Q&A](https://github.com/yani2298/PlayOuran/discussions)

## 🌟 **Roadmap**

### **Planned Features**
- [ ] **Audio Recitations** - Add Quran audio playback
- [ ] **Additional Languages** - Arabic interface option
- [ ] **Windows/Linux Support** - Cross-platform versions
- [ ] **Enhanced Prayer Times** - More calculation methods
- [ ] **Hadith Integration** - Daily hadith feature
- [ ] **Export Features** - Save and share verses

## 📄 **License**

This project is licensed under the **Creative Commons Attribution-NonCommercial-ShareAlike 4.0** - see the [LICENSE](LICENSE) file for details.

### **📋 What You CAN Do**
- ✅ **Personal use** - Use for your own spiritual practice
- ✅ **Educational use** - Use in schools, mosques, Islamic centers
- ✅ **Modify and share** - Adapt the software and share improvements
- ✅ **Community projects** - Use in non-profit Islamic initiatives

### **❌ What You CANNOT Do**
- ❌ **Commercial use** - Selling or using for profit is STRICTLY PROHIBITED
- ❌ **Paid distribution** - Cannot include in paid software packages
- ❌ **Revenue generation** - Cannot use to make money in any form
- ❌ **Commercial apps** - Cannot integrate into commercial products

### **🕌 Islamic Principles**
This software is developed as **Sadaqah (charity)** for the Muslim Ummah. Commercial exploitation goes against the charitable spirit of this project.

## 🙏 **Acknowledgments**

<div align="center">

### **"And We made from them leaders guiding by Our command when they were patient and were certain of Our signs."**
*— Quran 32:24*

</div>

#### **Special Thanks**
- **📖 The Noble Quran** - Our ultimate source of guidance
- **🕌 Islamic API Providers** - For reliable Islamic content
- **👥 French Muslim Community** - For feedback and support
- **🤝 All Contributors** - Every contribution matters

#### **Support the Project**
*This project is developed as Sadaqah (charity) for the Muslim Ummah. Your duas and stars are appreciated.*

---

## 📊 **Project Statistics**

<div align="center">

![GitHub stars](https://img.shields.io/github/stars/yani2298/PlayOuran?style=for-the-badge&logo=github&color=yellow)
![GitHub forks](https://img.shields.io/github/forks/yani2298/PlayOuran?style=for-the-badge&logo=github&color=blue)
![GitHub downloads](https://img.shields.io/github/downloads/yani2298/PlayOuran/total?style=for-the-badge&color=purple)

![GitHub last commit](https://img.shields.io/github/last-commit/yani2298/PlayOuran?style=for-the-badge)
![GitHub issues](https://img.shields.io/github/issues/yani2298/PlayOuran?style=for-the-badge)

</div>

---

<div align="center">

### 🌙 **PlayOuran - Interface en Français pour les Musulmans** 🌙

**Made with ❤️ for the French-speaking Muslim community**

[![Download](https://img.shields.io/badge/📱%20Download-Latest%20Release-green?style=for-the-badge)](https://github.com/yani2298/PlayOuran/releases)
[![Documentation](https://img.shields.io/badge/📚%20Docs-User%20Guide-orange?style=for-the-badge)](https://github.com/yani2298/PlayOuran#readme)
[![Community](https://img.shields.io/badge/💬%20Community-Discussions-purple?style=for-the-badge)](https://github.com/yani2298/PlayOuran/discussions)

---

### 🏷️ **Keywords for Discovery**

**Quran app** • **Islamic software** • **Muslim app** • **French Islamic app** • **Lecteur Coran** • **Logiciel islamique** • **Prayer times** • **Heures de prière** • **Islamic desktop** • **macOS Quran** • **Electron Islamic app** • **Open source Islamic software**

---

**⭐ Star this repository to support French Islamic software development ⭐**

*"The best of people are those who benefit humanity"* - Prophet Muhammad ﷺ

</div>