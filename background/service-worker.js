/**
 * Service Worker pour l'extension Commentaire AI
 * Gère les appels API et la communication entre les composants
 */

// Écouter les messages des content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'generateResponse') {
    handleGenerateResponse(request.context, request.tone)
      .then(text => sendResponse({ text }))
      .catch(error => sendResponse({ error: error.message }));
    return true; // Indique une réponse asynchrone
  }
});

/**
 * Générer une réponse AI
 */
async function handleGenerateResponse(context, tone) {
  // Récupérer la configuration
  const config = await chrome.storage.sync.get(['apiKey', 'apiProvider', 'language']);

  if (!config.apiKey) {
    throw new Error('Clé API non configurée. Cliquez sur l\'icône de l\'extension pour configurer.');
  }

  const provider = config.apiProvider || 'openai';
  const language = config.language || 'fr';

  const toneDescriptions = {
    friendly: {
      fr: 'amical et chaleureux',
      en: 'friendly and warm',
      es: 'amigable y cálido',
      de: 'freundlich und herzlich'
    },
    professional: {
      fr: 'professionnel et formel',
      en: 'professional and formal',
      es: 'profesional y formal',
      de: 'professionell und formell'
    },
    humorous: {
      fr: 'humoristique et léger',
      en: 'humorous and light',
      es: 'humorístico y ligero',
      de: 'humorvoll und leicht'
    },
    informative: {
      fr: 'informatif et détaillé',
      en: 'informative and detailed',
      es: 'informativo y detallado',
      de: 'informativ und detailliert'
    },
    supportive: {
      fr: 'encourageant et positif',
      en: 'supportive and positive',
      es: 'alentador y positivo',
      de: 'unterstützend und positiv'
    }
  };

  const languageNames = {
    fr: 'français',
    en: 'English',
    es: 'español',
    de: 'Deutsch'
  };

  const toneDesc = toneDescriptions[tone]?.[language] || toneDescriptions[tone]?.fr || 'amical';
  const langName = languageNames[language] || 'français';

  const prompt = `Tu es un assistant qui aide à rédiger des réponses aux commentaires sur les réseaux sociaux.

Contexte du commentaire/discussion auquel répondre:
"${context}"

Génère une réponse ${toneDesc} en ${langName}.
La réponse doit être:
- Naturelle et authentique
- Appropriée pour un forum/réseau social
- Entre 2 et 4 phrases
- Sans hashtags ni emojis excessifs
- Pertinente par rapport au contexte

Réponds uniquement avec le texte de la réponse, sans préfixe ni explication.`;

  if (provider === 'gemini') {
    return await callGemini(config.apiKey, prompt);
  } else if (provider === 'openai') {
    return await callOpenAI(config.apiKey, prompt);
  } else if (provider === 'anthropic') {
    return await callAnthropic(config.apiKey, prompt);
  } else if (provider === 'groq') {
    return await callGroq(config.apiKey, prompt);
  }

  throw new Error('Fournisseur AI non supporté');
}

/**
 * Appeler l'API Google Gemini
 */
async function callGemini(apiKey, prompt) {
  // Utiliser gemini-2.0-flash (modèle actuel)
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 300
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMsg = errorData.error?.message || '';
    console.error('Gemini API Error:', response.status, errorMsg);

    if (response.status === 400 && errorMsg.includes('API_KEY')) {
      throw new Error('Clé API invalide. Vérifiez sur aistudio.google.com');
    } else if (response.status === 403) {
      throw new Error('API non autorisée. Activez l\'API sur aistudio.google.com');
    } else if (response.status === 429) {
      throw new Error('Limite atteinte. Attendez 1 minute.');
    } else if (response.status === 404) {
      throw new Error('Modèle non disponible.');
    }
    throw new Error(errorMsg || `Erreur Gemini (${response.status})`);
  }

  const data = await response.json();

  if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
    console.error('Réponse inattendue:', data);
    if (data.promptFeedback?.blockReason) {
      throw new Error('Contenu bloqué par le filtre de sécurité.');
    }
    throw new Error('Réponse vide. Réessayez.');
  }

  return data.candidates[0].content.parts[0].text.trim();
}

/**
 * Appeler l'API OpenAI
 */
async function callOpenAI(apiKey, prompt) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 401) {
      throw new Error('Clé API invalide. Veuillez vérifier votre configuration.');
    } else if (response.status === 429) {
      throw new Error('Limite de requêtes atteinte. Veuillez réessayer plus tard.');
    } else if (response.status === 500) {
      throw new Error('Erreur serveur OpenAI. Veuillez réessayer plus tard.');
    }
    throw new Error(errorData.error?.message || 'Erreur API OpenAI');
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

/**
 * Appeler l'API Anthropic
 */
async function callAnthropic(apiKey, prompt) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 401) {
      throw new Error('Clé API invalide. Veuillez vérifier votre configuration.');
    } else if (response.status === 429) {
      throw new Error('Limite de requêtes atteinte. Veuillez réessayer plus tard.');
    } else if (response.status === 500) {
      throw new Error('Erreur serveur Anthropic. Veuillez réessayer plus tard.');
    }
    throw new Error(errorData.error?.message || 'Erreur API Anthropic');
  }

  const data = await response.json();
  return data.content[0].text.trim();
}

/**
 * Appeler l'API Groq
 */
async function callGroq(apiKey, prompt) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 401) {
      throw new Error('Clé API Groq invalide. Vérifiez votre configuration.');
    } else if (response.status === 429) {
      throw new Error('Limite de requêtes atteinte. Veuillez réessayer plus tard.');
    } else if (response.status === 500) {
      throw new Error('Erreur serveur Groq. Veuillez réessayer plus tard.');
    }
    throw new Error(errorData.error?.message || 'Erreur API Groq');
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

// Gérer l'installation de l'extension
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Commentaire AI installed successfully!');

    // Définir les paramètres par défaut
    chrome.storage.sync.set({
      defaultTone: 'friendly',
      language: 'fr'
    });
  } else if (details.reason === 'update') {
    console.log('Commentaire AI updated to version', chrome.runtime.getManifest().version);
  }
});
