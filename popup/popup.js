/**
 * Script du popup de l'extension Commentaire AI
 */

document.addEventListener('DOMContentLoaded', () => {
  // Éléments du DOM
  const apiProviderSelect = document.getElementById('apiProvider');
  const apiKeyInput = document.getElementById('apiKey');
  const toggleVisibilityBtn = document.getElementById('toggleVisibility');
  const getApiKeyLink = document.getElementById('getApiKeyLink');
  const saveConfigBtn = document.getElementById('saveConfig');
  const defaultToneSelect = document.getElementById('defaultTone');
  const languageSelect = document.getElementById('language');
  const statusIndicator = document.getElementById('statusIndicator');
  const statusText = document.getElementById('statusText');

  // URLs pour obtenir les clés API
  const apiKeyUrls = {
    gemini: 'https://aistudio.google.com/app/apikey',
    groq: 'https://console.groq.com/keys',
    openai: 'https://platform.openai.com/api-keys',
    anthropic: 'https://console.anthropic.com/settings/keys'
  };

  // Charger la configuration sauvegardée
  loadConfig();

  // Mettre à jour le lien de la clé API selon le provider
  apiProviderSelect.addEventListener('change', () => {
    updateApiKeyLink();
  });

  // Toggle visibilité du mot de passe
  toggleVisibilityBtn.addEventListener('click', () => {
    const type = apiKeyInput.type === 'password' ? 'text' : 'password';
    apiKeyInput.type = type;
  });

  // Sauvegarder la configuration
  saveConfigBtn.addEventListener('click', saveConfig);

  // Sauvegarder les paramètres au changement
  defaultToneSelect.addEventListener('change', saveSettings);
  languageSelect.addEventListener('change', saveSettings);

  /**
   * Charger la configuration depuis le storage
   */
  async function loadConfig() {
    try {
      const result = await chrome.storage.sync.get([
        'apiKey',
        'apiProvider',
        'defaultTone',
        'language'
      ]);

      if (result.apiProvider) {
        apiProviderSelect.value = result.apiProvider;
      }

      if (result.apiKey) {
        apiKeyInput.value = result.apiKey;
        updateStatus(true);
      }

      if (result.defaultTone) {
        defaultToneSelect.value = result.defaultTone;
      }

      if (result.language) {
        languageSelect.value = result.language;
      }

      updateApiKeyLink();
    } catch (error) {
      console.error('Error loading config:', error);
    }
  }

  /**
   * Sauvegarder la configuration API
   */
  async function saveConfig() {
    const apiKey = apiKeyInput.value.trim();
    const apiProvider = apiProviderSelect.value;

    if (!apiKey) {
      showToast('Veuillez entrer une clé API', 'error');
      return;
    }

    try {
      // Valider la clé API
      saveConfigBtn.textContent = 'Vérification...';
      saveConfigBtn.disabled = true;

      const isValid = await validateApiKey(apiKey, apiProvider);

      if (isValid) {
        await chrome.storage.sync.set({
          apiKey: apiKey,
          apiProvider: apiProvider
        });

        updateStatus(true);
        showToast('Configuration sauvegardée !', 'success');
      } else {
        showToast('Clé API invalide', 'error');
        updateStatus(false);
      }
    } catch (error) {
      showToast('Erreur de connexion', 'error');
      console.error('Error saving config:', error);
    } finally {
      saveConfigBtn.textContent = 'Sauvegarder';
      saveConfigBtn.disabled = false;
    }
  }

  /**
   * Sauvegarder les paramètres
   */
  async function saveSettings() {
    try {
      await chrome.storage.sync.set({
        defaultTone: defaultToneSelect.value,
        language: languageSelect.value
      });
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  /**
   * Valider la clé API
   */
  async function validateApiKey(apiKey, provider) {
    try {
      if (provider === 'gemini') {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        return response.ok;
      } else if (provider === 'groq') {
        const response = await fetch('https://api.groq.com/openai/v1/models', {
          headers: {
            'Authorization': `Bearer ${apiKey}`
          }
        });
        return response.ok;
      } else if (provider === 'openai') {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${apiKey}`
          }
        });
        return response.ok;
      } else if (provider === 'anthropic') {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1,
            messages: [{ role: 'user', content: 'Hi' }]
          })
        });
        return response.ok || response.status === 400;
      }
      return false;
    } catch (error) {
      console.error('Validation error:', error);
      return false;
    }
  }

  /**
   * Mettre à jour le lien pour obtenir une clé API
   */
  function updateApiKeyLink() {
    const provider = apiProviderSelect.value;
    getApiKeyLink.href = apiKeyUrls[provider] || apiKeyUrls.openai;
  }

  /**
   * Mettre à jour le statut
   */
  function updateStatus(isConfigured) {
    if (isConfigured) {
      statusIndicator.classList.add('active');
      statusText.textContent = 'Prêt à utiliser';
    } else {
      statusIndicator.classList.remove('active');
      statusText.textContent = 'Non configuré';
    }
  }

  /**
   * Afficher un toast de notification
   */
  function showToast(message, type = 'info') {
    // Supprimer les toasts existants
    document.querySelectorAll('.toast').forEach(t => t.remove());

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
});
