/**
 * Module commun pour les fonctionnalités partagées entre les content scripts
 */

const AICommentaire = {
  // Configuration des tons disponibles
  tones: [
    { id: 'friendly', label: 'Amical', emoji: '😊' },
    { id: 'professional', label: 'Professionnel', emoji: '💼' },
    { id: 'humorous', label: 'Humoristique', emoji: '😄' },
    { id: 'informative', label: 'Informatif', emoji: '📚' },
    { id: 'supportive', label: 'Encourageant', emoji: '💪' }
  ],

  // Créer le bouton AI
  createAIButton() {
    const button = document.createElement('button');
    button.className = 'ai-comment-btn';
    button.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
      </svg>
      <span>AI Réponse</span>
    `;
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.openModal(button);
    });
    return button;
  },

  // Ouvrir la modal
  openModal(triggerButton) {
    // Récupérer le contexte (commentaire parent)
    const context = this.getCommentContext(triggerButton);

    const overlay = document.createElement('div');
    overlay.className = 'ai-modal-overlay';
    overlay.innerHTML = `
      <div class="ai-modal">
        <div class="ai-modal-header">
          <h2 class="ai-modal-title">Générer une réponse AI</h2>
          <button class="ai-modal-close">&times;</button>
        </div>

        <div class="ai-tone-selector">
          <label class="ai-tone-label">Choisir le ton :</label>
          <div class="ai-tone-options">
            ${this.tones.map((tone, index) => `
              <button class="ai-tone-option ${index === 0 ? 'selected' : ''}" data-tone="${tone.id}">
                ${tone.emoji} ${tone.label}
              </button>
            `).join('')}
          </div>
        </div>

        <div class="ai-context-section">
          <label class="ai-context-label">Contexte du commentaire :</label>
          <textarea class="ai-context-text" placeholder="Le commentaire auquel vous répondez...">${context}</textarea>
        </div>

        <div class="ai-response-section">
          <label class="ai-response-label">Réponse générée :</label>
          <textarea class="ai-response-text" placeholder="La réponse apparaîtra ici..."></textarea>
        </div>

        <div class="ai-modal-actions">
          <button class="ai-btn ai-btn-secondary ai-btn-regenerate">Régénérer</button>
          <button class="ai-btn ai-btn-primary ai-btn-insert">Insérer la réponse</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Gestionnaires d'événements
    const modal = overlay.querySelector('.ai-modal');
    const closeBtn = overlay.querySelector('.ai-modal-close');
    const toneOptions = overlay.querySelectorAll('.ai-tone-option');
    const regenerateBtn = overlay.querySelector('.ai-btn-regenerate');
    const insertBtn = overlay.querySelector('.ai-btn-insert');
    const contextTextarea = overlay.querySelector('.ai-context-text');
    const responseTextarea = overlay.querySelector('.ai-response-text');

    // Fermer la modal
    closeBtn.addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });

    // Sélection du ton
    toneOptions.forEach(option => {
      option.addEventListener('click', () => {
        toneOptions.forEach(o => o.classList.remove('selected'));
        option.classList.add('selected');
      });
    });

    // Générer la réponse
    const generateResponse = async () => {
      const selectedTone = overlay.querySelector('.ai-tone-option.selected').dataset.tone;
      const context = contextTextarea.value;

      responseTextarea.value = 'Génération en cours...';
      regenerateBtn.disabled = true;
      insertBtn.disabled = true;

      try {
        const response = await this.generateAIResponse(context, selectedTone);
        responseTextarea.value = response;
      } catch (error) {
        responseTextarea.value = 'Erreur lors de la génération. Veuillez réessayer.';
        console.error('AI Generation Error:', error);
      }

      regenerateBtn.disabled = false;
      insertBtn.disabled = false;
    };

    regenerateBtn.addEventListener('click', generateResponse);

    // Insérer la réponse
    insertBtn.addEventListener('click', () => {
      const response = responseTextarea.value;
      if (response && response !== 'Génération en cours...' && !response.startsWith('Erreur')) {
        this.insertResponse(triggerButton, response);
        overlay.remove();
      }
    });

    // Générer automatiquement au démarrage si contexte disponible
    if (context) {
      generateResponse();
    }
  },

  // Obtenir le contexte du commentaire (à surcharger par plateforme)
  getCommentContext(button) {
    return '';
  },

  // Insérer la réponse (à surcharger par plateforme)
  insertResponse(button, response) {
    console.log('Insert response:', response);
  },

  // Générer une réponse AI
  async generateAIResponse(context, tone) {
    // Récupérer la clé API depuis le storage
    const result = await chrome.storage.sync.get(['apiKey', 'apiProvider']);
    const apiKey = result.apiKey;
    const provider = result.apiProvider || 'openai';

    if (!apiKey) {
      throw new Error('Clé API non configurée. Veuillez la configurer dans les paramètres de l\'extension.');
    }

    const toneDescriptions = {
      friendly: 'amical et chaleureux',
      professional: 'professionnel et formel',
      humorous: 'humoristique et léger',
      informative: 'informatif et détaillé',
      supportive: 'encourageant et positif'
    };

    const prompt = `Tu es un assistant qui aide à rédiger des réponses aux commentaires sur les réseaux sociaux.

Contexte du commentaire auquel répondre:
"${context}"

Génère une réponse ${toneDescriptions[tone]} en français.
La réponse doit être:
- Naturelle et authentique
- Appropriée pour un forum/réseau social
- Entre 2 et 4 phrases
- Sans hashtags ni emojis excessifs

Réponds uniquement avec le texte de la réponse, sans préfixe ni explication.`;

    if (provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 200,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error('Erreur API OpenAI');
      }

      const data = await response.json();
      return data.choices[0].message.content.trim();
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
          max_tokens: 200,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!response.ok) {
        throw new Error('Erreur API Anthropic');
      }

      const data = await response.json();
      return data.content[0].text.trim();
    }

    throw new Error('Provider non supporté');
  }
};

// Exporter pour utilisation dans les content scripts
window.AICommentaire = AICommentaire;
