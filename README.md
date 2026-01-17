# Commentaire AI - Chrome Extension

Extension Chrome pour générer des réponses intelligentes aux commentaires sur Reddit, Quora et autres sites web.

## 🚀 Fonctionnalités

### 3 Méthodes d'Activation

1. **Icône Automatique** (Reddit/Quora)
   - Icône circulaire violette apparaît automatiquement sur les champs détectés
   - Animation pulse pour attirer l'attention
   - Cliquez dessus pour ouvrir la modal

2. **Menu Contextuel** (Tous les champs)
   - Clic droit sur n'importe quel champ de texte
   - Option "Générer avec AI" dans le menu contextuel
   - Fonctionne sur TOUS les sites web

3. **Raccourci Clavier** (Tous les champs)
   - Appuyez sur **Ctrl+Shift+G** dans un champ de texte
   - Activation rapide sans souris
   - Universel sur tous les sites

## 🔧 Installation

### 1. Charger l'extension dans Chrome

1. Ouvrez Chrome → `chrome://extensions/`
2. Activez le **Mode développeur** (coin supérieur droit)
3. Cliquez sur **Charger l'extension non empaquetée**
4. Sélectionnez le dossier de l'extension

### 2. Configuration Initiale

1. Cliquez sur l'icône de l'extension dans Chrome
2. Choisissez votre fournisseur AI
3. Entrez votre clé API (voir liens ci-dessous)
4. Sélectionnez le ton par défaut et la langue
5. Cliquez sur **Sauvegarder**

## 🔑 Obtenir une Clé API

### Google Gemini (Recommandé - Gratuit)
https://aistudio.google.com/app/apikey

### Groq (Rapide - Gratuit)
https://console.groq.com/keys

### OpenAI
https://platform.openai.com/api-keys

### Anthropic
https://console.anthropic.com/settings/keys

## 📖 Utilisation

### Sur Reddit

1. **Détection automatique** : L'icône apparaît sur le champ de commentaire
2. **Clic sur l'icône** pour ouvrir la modal
3. **Ou clic droit** → "Générer avec AI"
4. **Ou Ctrl+Shift+G** dans le champ

### Sur Quora

1. Même système que Reddit
2. Détection automatique des champs de réponse
3. + Menu contextuel + Raccourci clavier

### Sur d'autres sites

1. Cliquez dans n'importe quel champ de texte
2. **Clic droit** → "Générer avec AI"
3. **Ou** appuyez sur **Ctrl+Shift+G**

## 🎨 Tons Disponibles

- **Amical** : Chaleureux et convivial
- **Professionnel** : Formel et précis
- **Humoristique** : Léger et amusant
- **Informatif** : Détaillé et éducatif

## 📁 Structure du projet

```
commentaire AI/
├── manifest.json           # Configuration Chrome Extension
├── background/
│   └── service-worker.js   # Gestion des appels API
├── content/
│   ├── styles.css          # Styles (icône, modal, menu)
│   ├── reddit.js           # Script pour Reddit
│   └── quora.js            # Script pour Quora
├── popup/
│   ├── popup.html          # Interface de configuration
│   ├── popup.css           # Styles du popup
│   └── popup.js            # Logique de configuration
├── icons/
│   ├── icon16.png, icon32.png, icon48.png, icon128.png
│   └── generate-icons.html # Générateur d'icônes
└── README.md
```

## 🤖 Fournisseurs AI Supportés

### Google Gemini (Recommandé)
- Modèle : gemini-2.0-flash-exp
- Gratuit et performant

### Groq
- Modèle : llama-3.3-70b-versatile
- Très rapide

### OpenAI
- Modèle : GPT-3.5-turbo
- Rapide et économique

### Anthropic
- Modèle : Claude 3 Haiku
- Performant et précis

## 💡 Astuces

- Le contexte est extrait automatiquement du commentaire parent ou du titre
- Vous pouvez éditer le contexte avant de générer
- La réponse générée est modifiable avant insertion
- Le raccourci **Ctrl+Shift+G** fonctionne sur TOUS les sites web
- Si l'icône ne s'affiche pas, utilisez le clic droit ou le raccourci

## 🔒 Confidentialité

- Aucune donnée n'est collectée
- Les clés API sont stockées localement dans Chrome
- Les requêtes vont directement aux fournisseurs AI choisis

## 📝 Version

**1.0.0** - Version initiale avec support multi-méthodes

## 📜 Licence

MIT
