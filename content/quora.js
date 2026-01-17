/**
 * Content script pour Quora - Détection des champs de commentaire
 */

(function() {
  'use strict';

  let lastFocusedField = null;

  const QuoraAI = {
    init() {
      console.log('Quora AI Commentaire initialized');
      this.observeDOM();
      this.scanForTextareas();

      // Méthodes universelles
      this.setupHoverButton();
      this.setupKeyboardShortcut();
      this.trackFocusedField();
    },

    // Observer les changements du DOM
    observeDOM() {
      const observer = new MutationObserver(() => {
        this.scanForTextareas();
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    },

    // Scanner pour trouver les zones de texte
    scanForTextareas() {
      const selectors = [
        'textarea',
        'div[contenteditable="true"]',
        '[role="textbox"]'
      ];

      selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          this.addIconToField(el);
        });
      });
    },

    // Ajouter l'icône au champ
    addIconToField(field) {
      if (field.dataset.aiIconAdded) return;
      if (field.closest('.ai-modal')) return;

      field.dataset.aiIconAdded = 'true';

      const icon = document.createElement('button');
      icon.className = 'ai-gen-icon';
      icon.type = 'button';
      icon.title = 'Générer avec AI';
      icon.innerHTML = `
        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
      `;

      const parent = field.parentElement;
      if (parent && !parent.querySelector('.ai-gen-icon')) {
        parent.style.position = 'relative';
        parent.appendChild(icon);
      }

      icon.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.openModal(field);
      });
    },

    // Obtenir le contexte
    getContext(field) {
      // Question de la page
      const question = document.querySelector('.q-text.qu-display--block, .puppeteer_test_question_title, h1');
      let context = '';

      if (question) {
        context = 'Question: ' + question.textContent.trim().substring(0, 300);
      }

      // Réponse proche
      const answer = field.closest('.Answer, [data-post-type="answer"]');
      if (answer) {
        const answerText = answer.querySelector('.q-text, .Answer__content');
        if (answerText) {
          context += '\n\nRéponse: ' + answerText.textContent.trim().substring(0, 400);
        }
      }

      return context;
    },

    // Ouvrir la modal
    openModal(field) {
      const context = this.getContext(field);
      document.querySelector('.ai-modal-overlay')?.remove();

      const overlay = document.createElement('div');
      overlay.className = 'ai-modal-overlay';
      overlay.innerHTML = `
        <div class="ai-modal">
          <div class="ai-modal-header">
            <h2 class="ai-modal-title">Générer une réponse</h2>
            <button class="ai-modal-close">&times;</button>
          </div>

          <div class="ai-tone-selector">
            <label class="ai-tone-label">Ton :</label>
            <div class="ai-tone-options">
              <button class="ai-tone-option selected" data-tone="friendly">Amical</button>
              <button class="ai-tone-option" data-tone="professional">Pro</button>
              <button class="ai-tone-option" data-tone="humorous">Humour</button>
              <button class="ai-tone-option" data-tone="informative">Info</button>
            </div>
          </div>

          <div class="ai-context-section">
            <label class="ai-context-label">Contexte :</label>
            <textarea class="ai-context-text">${context}</textarea>
          </div>

          <div class="ai-response-section">
            <label class="ai-response-label">Réponse :</label>
            <textarea class="ai-response-text" placeholder="Cliquez sur Générer..."></textarea>
          </div>

          <div class="ai-modal-actions">
            <button class="ai-btn ai-btn-secondary" id="ai-generate">Générer</button>
            <button class="ai-btn ai-btn-secondary" id="ai-copy" disabled>Copier</button>
            <button class="ai-btn ai-btn-primary" id="ai-insert" disabled>Insérer</button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);

      const closeBtn = overlay.querySelector('.ai-modal-close');
      const toneOptions = overlay.querySelectorAll('.ai-tone-option');
      const generateBtn = overlay.querySelector('#ai-generate');
      const copyBtn = overlay.querySelector('#ai-copy');
      const insertBtn = overlay.querySelector('#ai-insert');
      const contextTextarea = overlay.querySelector('.ai-context-text');
      const responseTextarea = overlay.querySelector('.ai-response-text');

      closeBtn.onclick = () => overlay.remove();
      overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

      toneOptions.forEach(opt => {
        opt.onclick = () => {
          toneOptions.forEach(o => o.classList.remove('selected'));
          opt.classList.add('selected');
        };
      });

      generateBtn.onclick = async () => {
        const tone = overlay.querySelector('.ai-tone-option.selected').dataset.tone;
        const ctx = contextTextarea.value.trim();

        if (!ctx) {
          responseTextarea.value = 'Entrez un contexte.';
          return;
        }

        responseTextarea.value = 'Génération...';
        generateBtn.disabled = true;

        try {
          const text = await this.callAPI(ctx, tone);
          responseTextarea.value = text;
          insertBtn.disabled = false;
          copyBtn.disabled = false;
        } catch (err) {
          responseTextarea.value = 'Erreur: ' + err.message;
        }
        generateBtn.disabled = false;
      };

      // Copier
      copyBtn.onclick = async () => {
        const text = responseTextarea.value;
        if (text && !text.startsWith('Erreur') && !text.startsWith('Génération')) {
          try {
            await navigator.clipboard.writeText(text);
            const originalText = copyBtn.textContent;
            copyBtn.textContent = '✓ Copié!';
            copyBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';

            setTimeout(() => {
              copyBtn.textContent = originalText;
              copyBtn.style.background = '';
            }, 2000);
          } catch (err) {
            this.showNotification('Erreur lors de la copie');
          }
        }
      };

      insertBtn.onclick = () => {
        const text = responseTextarea.value;
        if (text && !text.startsWith('Erreur') && !text.startsWith('Génération')) {
          if (field.tagName === 'TEXTAREA' || field.tagName === 'INPUT') {
            field.value = text;
          } else if (field.isContentEditable || field.getAttribute('contenteditable') === 'true') {
            // Pour contenteditable, utiliser innerHTML et innerText
            field.innerHTML = text.replace(/\n/g, '<br>');
            field.innerText = text;
          } else {
            field.textContent = text;
          }

          // Déclencher plusieurs événements pour compatibilité
          field.dispatchEvent(new Event('input', { bubbles: true }));
          field.dispatchEvent(new Event('change', { bubbles: true }));
          field.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
          field.focus();
          overlay.remove();
        }
      };
    },

    // Appel API
    async callAPI(context, tone) {
      return new Promise((resolve, reject) => {
        try {
          chrome.runtime.sendMessage({
            action: 'generateResponse',
            context,
            tone
          }, (res) => {
            if (chrome.runtime.lastError) {
              reject(new Error('Rafraîchissez la page (F5)'));
            } else if (!res || res.error) {
              reject(new Error(res?.error || 'Erreur'));
            } else {
              resolve(res.text);
            }
          });
        } catch {
          reject(new Error('Rafraîchissez la page (F5)'));
        }
      });
    },

    // === MÉTHODES UNIVERSELLES ===

    trackFocusedField() {
      document.addEventListener('focusin', (e) => {
        const target = e.target;
        if (this.isEditableField(target)) {
          lastFocusedField = target;
        }
      }, true);
    },

    isEditableField(element) {
      if (!element) return false;
      return (
        element.tagName === 'TEXTAREA' ||
        element.tagName === 'INPUT' ||
        element.isContentEditable ||
        element.getAttribute('contenteditable') === 'true' ||
        element.getAttribute('role') === 'textbox'
      );
    },

    setupHoverButton() {
      let hoverButton = null;
      let hideTimeout = null;

      document.addEventListener('mouseover', (e) => {
        const target = e.target;
        if (this.isEditableField(target)) {
          lastFocusedField = target;

          // Nettoyer timeout précédent
          if (hideTimeout) {
            clearTimeout(hideTimeout);
            hideTimeout = null;
          }

          // Supprimer l'ancien bouton s'il existe
          if (hoverButton) {
            hoverButton.remove();
          }

          // Créer le bouton de survol
          hoverButton = document.createElement('button');
          hoverButton.className = 'ai-hover-button';
          hoverButton.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            <span>Générer avec AI</span>
          `;

          document.body.appendChild(hoverButton);

          // Positionner au-dessus du champ
          const fieldRect = target.getBoundingClientRect();
          hoverButton.style.left = fieldRect.left + 'px';
          hoverButton.style.top = (fieldRect.top - 50) + 'px';

          // Afficher avec animation
          setTimeout(() => hoverButton.classList.add('show'), 10);

          // Clic sur le bouton
          hoverButton.addEventListener('click', () => {
            hoverButton.remove();
            hoverButton = null;
            this.openModal(target);
          });
        }
      });

      // Masquer quand on quitte le champ ou le bouton
      document.addEventListener('mouseout', (e) => {
        if (hoverButton && e.target === lastFocusedField) {
          hideTimeout = setTimeout(() => {
            if (hoverButton) {
              hoverButton.classList.remove('show');
              setTimeout(() => {
                if (hoverButton) {
                  hoverButton.remove();
                  hoverButton = null;
                }
              }, 200);
            }
          }, 300);
        }
      });
    },

    setupKeyboardShortcut() {
      document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'G') {
          e.preventDefault();
          if (lastFocusedField && this.isEditableField(lastFocusedField)) {
            console.log('AI: Keyboard shortcut triggered');
            this.openModal(lastFocusedField);
          } else {
            this.showNotification('Veuillez d\'abord cliquer dans un champ de texte');
          }
        }
      });
    },

    showNotification(message) {
      const toast = document.createElement('div');
      toast.className = 'ai-toast';
      toast.textContent = message;
      document.body.appendChild(toast);

      setTimeout(() => toast.classList.add('show'), 10);
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    }
  };

  // Init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => QuoraAI.init());
  } else {
    QuoraAI.init();
  }
})();
