/**
 * Content script pour Quora - Détection des champs de commentaire
 */

(function() {
  'use strict';

  let lastFocusedField = null;

  const QuoraAI = {
    init() {
      console.log('Quora AI Commentaire initialized');
      this.setupHoverIcon();
      this.setupKeyboardShortcut();
      this.trackFocusedField();
    },

    // Obtenir le contexte lié au champ de commentaire
    getContext(field) {
      let context = '';
      let questionText = null;
      let contentText = null;

      // Remonter dans le DOM pour trouver le bloc post/answer parent
      let container = field.parentElement;
      for (let i = 0; i < 30 && container; i++) {
        // 1. Chercher la question (pour les réponses)
        if (!questionText) {
          const questionEl = container.querySelector('.puppeteer_test_question_title span');
          if (questionEl) {
            questionText = questionEl.textContent.trim();
            console.log('AI: Found question:', questionText.substring(0, 50));
          }
        }

        // 2. Chercher le contenu (réponse ou post)
        if (!contentText) {
          // D'abord essayer le contenu de réponse
          let contentEl = container.querySelector('.puppeteer_test_answer_content .q-text span, .spacing_log_answer_content .q-text span');

          // Sinon essayer le contenu de post (qu-truncateLines)
          if (!contentEl) {
            contentEl = container.querySelector('.qu-truncateLines--3 > span, .qu-truncateLines--5 > span');
          }

          // Sinon chercher tout span avec du texte significatif dans q-box qu-cursor--pointer
          if (!contentEl) {
            const postBox = container.querySelector('.qu-cursor--pointer.b1waa02m .q-text');
            if (postBox) {
              contentEl = postBox.querySelector('span');
            }
          }

          if (contentEl) {
            // Vérifier que ce n'est pas le champ de saisie
            if (!contentEl.contains(field) && !contentEl.closest('[contenteditable="true"]')) {
              const text = contentEl.textContent.trim();
              if (text.length > 20) {
                contentText = text;
                console.log('AI: Found content:', contentText.substring(0, 50));
              }
            }
          }
        }

        // Si on a trouvé le contenu (et la question si c'est une réponse), on arrête
        if (contentText && (questionText || i > 15)) break;

        container = container.parentElement;
      }

      // Fallback: chercher la question sur toute la page
      if (!questionText) {
        const pageQuestion = document.querySelector('.puppeteer_test_question_title span');
        if (pageQuestion) {
          questionText = pageQuestion.textContent.trim();
          console.log('AI: Using page question fallback:', questionText.substring(0, 50));
        }
      }

      // Construire le contexte
      if (questionText) {
        context = 'Question: ' + questionText.substring(0, 300);
      }

      if (contentText) {
        const label = questionText ? 'Réponse' : 'Publication';
        context += (context ? '\n\n' : '') + label + ': ' + contentText.substring(0, 500);
      }

      console.log('AI: Final context:', context || '(empty)');
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
        element.getAttribute('role') === 'textbox' ||
        element.getAttribute('data-kind') === 'doc'
      );
    },

    setupHoverIcon() {
      let hoverIcon = null;
      let currentField = null;

      const showIcon = (field) => {
        if (currentField === field && hoverIcon) return;

        // Supprimer l'ancien icône
        if (hoverIcon) {
          hoverIcon.remove();
          hoverIcon = null;
        }

        currentField = field;
        lastFocusedField = field;

        // Créer l'icône
        hoverIcon = document.createElement('button');
        hoverIcon.className = 'ai-hover-icon';
        hoverIcon.type = 'button';
        hoverIcon.title = 'Générer avec AI (Ctrl+Shift+G)';
        hoverIcon.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        `;

        document.body.appendChild(hoverIcon);

        // Positionner dans le coin supérieur droit du champ
        const updatePosition = () => {
          const rect = field.getBoundingClientRect();
          hoverIcon.style.left = (rect.right - 36 + window.scrollX) + 'px';
          hoverIcon.style.top = (rect.top + 6 + window.scrollY) + 'px';
        };

        updatePosition();

        // Afficher avec animation
        requestAnimationFrame(() => hoverIcon.classList.add('show'));

        // Clic sur l'icône
        hoverIcon.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.openModal(field);
        });

        // Garder l'icône visible quand on la survole
        hoverIcon.addEventListener('mouseenter', () => {
          hoverIcon.dataset.hovered = 'true';
        });

        hoverIcon.addEventListener('mouseleave', () => {
          hoverIcon.dataset.hovered = 'false';
        });
      };

      const hideIcon = () => {
        if (hoverIcon && hoverIcon.dataset.hovered !== 'true') {
          hoverIcon.classList.remove('show');
          setTimeout(() => {
            if (hoverIcon && hoverIcon.dataset.hovered !== 'true') {
              hoverIcon.remove();
              hoverIcon = null;
              currentField = null;
            }
          }, 200);
        }
      };

      // Événements de survol
      document.addEventListener('mouseover', (e) => {
        const field = e.target.closest('[contenteditable="true"], textarea, [role="textbox"], input[type="text"]');
        if (field && this.isEditableField(field)) {
          showIcon(field);
        }
      });

      document.addEventListener('mouseout', (e) => {
        const field = e.target.closest('[contenteditable="true"], textarea, [role="textbox"], input[type="text"]');
        if (field && currentField === field) {
          setTimeout(() => {
            if (hoverIcon && hoverIcon.dataset.hovered !== 'true') {
              hideIcon();
            }
          }, 100);
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
