# Commentaire AI

Extension Chrome pour générer des réponses intelligentes aux commentaires sur les réseaux sociaux (Reddit, Quora).

## Fonctionnalités

- Génération automatique de réponses aux commentaires
- Support de plusieurs tons : Amical, Professionnel, Humoristique, Informatif, Encourageant
- Support multilingue : Français, Anglais, Espagnol, Allemand
- Compatible avec Reddit et Quora
- Interface moderne et intuitive

## Installation

### 1. Générer les icônes

1. Ouvrez le fichier `icons/generate-icons.html` dans votre navigateur
2. Cliquez sur "Générer les icônes"
3. Téléchargez chaque icône et sauvegardez-la dans le dossier `icons/` avec les noms :
   - `icon16.png`
   - `icon32.png`
   - `icon48.png`
   - `icon128.png`

### 2. Charger l'extension dans Chrome

1. Ouvrez Chrome et allez à `chrome://extensions/`
2. Activez le "Mode développeur" (coin supérieur droit)
3. Cliquez sur "Charger l'extension non empaquetée"
4. Sélectionnez le dossier de l'extension

### 3. Configurer l'API

1. Cliquez sur l'icône de l'extension dans la barre d'outils
2. Choisissez votre fournisseur AI (OpenAI ou Anthropic)
3. Entrez votre clé API :
   - OpenAI : https://platform.openai.com/api-keys
   - Anthropic : https://console.anthropic.com/settings/keys
4. Cliquez sur "Sauvegarder"

## Utilisation

1. Visitez Reddit ou Quora
2. Trouvez un commentaire auquel vous souhaitez répondre
3. Cliquez sur le bouton "AI Réponse" qui apparaît près des zones de commentaire
4. Choisissez le ton souhaité
5. La réponse sera générée automatiquement
6. Modifiez si nécessaire, puis cliquez sur "Insérer la réponse"

## Structure du projet

```
commentaire AI/
├── manifest.json          # Configuration de l'extension
├── background/
│   └── service-worker.js  # Gestion des appels API
├── content/
│   ├── styles.css         # Styles communs
│   ├── reddit.js          # Script pour Reddit
│   └── quora.js           # Script pour Quora
├── popup/
│   ├── popup.html         # Interface du popup
│   ├── popup.css          # Styles du popup
│   └── popup.js           # Logique du popup
├── icons/
│   ├── icon.svg           # Icône source
│   └── generate-icons.html # Générateur d'icônes PNG
└── README.md
```

## APIs supportées

### OpenAI
- Modèle : GPT-3.5-turbo
- Rapide et économique

### Anthropic
- Modèle : Claude 3 Haiku
- Performant et précis

## Licence

MIT
