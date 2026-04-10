/* ============================================
   DDSMS | SAFETY PRESENTATION JAVASCRIPT
   Sistema Modular de Controle de Apresentação
   ============================================ */

/* ============================================
   CLASSE: LOADING MANAGER
   ============================================ */
class LoadingManager {
    constructor() {
        this.loadingScreen = document.getElementById('loading-screen');
    }

    hide() {
        setTimeout(() => {
            if (this.loadingScreen) {
                this.loadingScreen.classList.add('hidden');
                setTimeout(() => {
                    this.loadingScreen.remove();
                }, 600);
            }
        }, 1000);
    }
}

/* ============================================
   CLASSE: PARTICLES CANVAS
   ============================================ */
class ParticlesCanvas {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.particleCount = 35; // Reduced count for cleaner look
        // Petrobras Colors: Green, Yellow, Light Green, Red (Safety)
        this.colors = ['#008542', '#FFCC29', '#00a552', '#ef4444'];
        
        this.resize();
        this.init();
        this.animate();
        
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    init() {
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                radius: Math.random() * 3 + 1,
                color: this.colors[Math.floor(Math.random() * this.colors.length)],
                opacity: Math.random() * 0.5 + 0.2
            });
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles.forEach((particle, i) => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            if (particle.x < 0 || particle.x > this.canvas.width) particle.vx *= -1;
            if (particle.y < 0 || particle.y > this.canvas.height) particle.vy *= -1;
            
            // Desenhar partícula
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = particle.opacity;
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
            
            // Conectar partículas próximas
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[j].x - particle.x;
                const dy = this.particles[j].y - particle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 100) { // Reduced connection distance
                    this.ctx.beginPath();
                    this.ctx.moveTo(particle.x, particle.y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.strokeStyle = particle.color;
                    this.ctx.globalAlpha = (1 - distance / 100) * 0.2; // Reduced line opacity
                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();
                    this.ctx.globalAlpha = 1;
                }
            }
        });
        
        requestAnimationFrame(() => this.animate());
    }
}

/* ============================================
   CLASSE: SLIDE MANAGER
   ============================================ */
class SlideManager {
    constructor() {
        this.slides = document.querySelectorAll('.slide');
        this.currentSlide = 1;
        this.totalSlides = this.slides.length;
        
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.progressBar = document.getElementById('progressBar');
        this.slideIndicator = document.getElementById('slideIndicator');
        
        this.init();
    }

    init() {
        if (!this.totalSlides) {
            return;
        }

        this.syncCurrentSlideFromDOM();

        // Eventos de navegação
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', () => this.previousSlide());
        }
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => this.nextSlide());
        }
        
        // Navegação por teclado
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Swipe em dispositivos móveis
        this.setupSwipeGestures();
        
        // Mostrar primeiro slide
        this.showSlide(this.currentSlide);
    }

    syncCurrentSlideFromDOM() {
        const activeFromMarkup = document.querySelector('.slide.active[id^="slide-"]');
        if (!activeFromMarkup) {
            return;
        }

        const numericId = Number(activeFromMarkup.id.replace('slide-', ''));
        if (Number.isInteger(numericId) && numericId >= 1 && numericId <= this.totalSlides) {
            this.currentSlide = numericId;
        }
    }

    showSlide(slideNumber) {
        // Remover classe active de todos e ocultar de forma determinística
        this.slides.forEach(slide => {
            slide.classList.remove('active');
            slide.hidden = true;
            slide.setAttribute('aria-hidden', 'true');
        });
        
        // Adicionar classe active ao slide atual
        const currentSlideElement = document.getElementById(`slide-${slideNumber}`);
        if (currentSlideElement) {
            currentSlideElement.classList.add('active');
            currentSlideElement.hidden = false;
            currentSlideElement.setAttribute('aria-hidden', 'false');
        }
        
        // Atualizar controles
        this.updateControls();
        
        // Resetar animações
        this.resetAnimations(slideNumber);
        
        // Atualizar indicador de slide
        if (this.slideIndicator) {
            this.slideIndicator.textContent = `${slideNumber} / ${this.totalSlides}`;
        }
    }

    resetAnimations(slideNumber) {
        const currentSlideElement = document.getElementById(`slide-${slideNumber}`);
        if (!currentSlideElement) return;
        
        const animatedItems = currentSlideElement.querySelectorAll('.animated-item');
        animatedItems.forEach(item => {
            item.style.opacity = '0';
            item.style.animation = 'none';
            void item.offsetWidth; // Trigger reflow
            item.style.animation = '';
        });

        // Fallback para ambientes onde animações podem não iniciar
        setTimeout(() => {
            animatedItems.forEach(item => {
                if (item.isConnected && getComputedStyle(item).opacity === '0') {
                    item.style.opacity = '1';
                }
            });
        }, 850);
    }

    updateControls() {
        // Botão anterior
        if (this.prevBtn) {
            this.prevBtn.disabled = this.currentSlide === 1;
        }
        
        // Botão próximo
        if (this.nextBtn) {
            if (this.currentSlide === this.totalSlides) {
                this.nextBtn.textContent = 'Reiniciar';
                this.nextBtn.classList.remove('primary');
                this.nextBtn.classList.add('secondary');
            } else {
                this.nextBtn.textContent = 'Próximo';
                this.nextBtn.classList.add('primary');
                this.nextBtn.classList.remove('secondary');
            }
        }
        
        // Barra de progresso
        if (this.progressBar) {
            const progressPercentage = (this.currentSlide / this.totalSlides) * 100;
            this.progressBar.style.width = `${progressPercentage}%`;
        }
    }

    nextSlide() {
        if (this.currentSlide < this.totalSlides) {
            this.currentSlide++;
            this.showSlide(this.currentSlide);
        } else {
            // Reiniciar apresentação
            this.currentSlide = 1;
            this.showSlide(this.currentSlide);
        }
    }

    previousSlide() {
        if (this.currentSlide > 1) {
            this.currentSlide--;
            this.showSlide(this.currentSlide);
        }
    }

    handleKeyboard(e) {
        // Não interfere quando um modal está aberto ou o foco está em input/textarea
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
        if (document.querySelector('.ppt-modal:not(.hidden)')) return;
        if (document.getElementById('keyboard-help-overlay')) return;

        switch(e.key) {
            case 'ArrowRight':
            case ' ':
            case 'PageDown':
                e.preventDefault();
                this.nextSlide();
                break;
            case 'ArrowLeft':
            case 'PageUp':
                e.preventDefault();
                this.previousSlide();
                break;
            case 'Home':
                e.preventDefault();
                this.currentSlide = 1;
                this.showSlide(this.currentSlide);
                break;
            case 'End':
                e.preventDefault();
                this.currentSlide = this.totalSlides;
                this.showSlide(this.currentSlide);
                break;
        }
    }

    setupSwipeGestures() {
        let touchStartX = 0;
        let touchEndX = 0;
        
        const presentationCard = document.getElementById('presentationCard');
        if (!presentationCard) {
            return;
        }
        
        presentationCard.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, false);
        
        presentationCard.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe();
        }, false);
        
        const handleSwipe = () => {
            const swipeThreshold = 50;
            const diff = touchStartX - touchEndX;
            
            if (Math.abs(diff) > swipeThreshold) {
                if (diff > 0) {
                    // Swipe left - próximo slide
                    this.nextSlide();
                } else {
                    // Swipe right - slide anterior
                    this.previousSlide();
                }
            }
        };
        
        this.handleSwipe = handleSwipe;
    }

    goToSlide(slideNumber) {
        if (slideNumber >= 1 && slideNumber <= this.totalSlides) {
            this.currentSlide = slideNumber;
            this.showSlide(this.currentSlide);
        }
    }
}

/* ============================================
   CLASSE: TIMER CONTROLLER
   ============================================ */
class TimerController {
    constructor() {
        this.timerElement = document.getElementById('timer');
        this.seconds = 0;
        this.interval = null;
        
        this.init();
    }

    init() {
        if (!this.timerElement) {
            return;
        }
        this.start();
        
        // Reset ao clicar
        this.timerElement.addEventListener('click', () => this.reset());
    }

    start() {
        if (!this.timerElement) {
            return;
        }
        if (this.interval) clearInterval(this.interval);
        
        this.interval = setInterval(() => {
            this.seconds++;
            this.updateDisplay();
        }, 1000);
    }

    reset() {
        if (!this.timerElement) {
            return;
        }
        this.seconds = 0;
        this.updateDisplay();
        
        // Feedback visual
        this.timerElement.classList.add('clicked');
        setTimeout(() => {
            this.timerElement.classList.remove('clicked');
        }, 300);
        
        // Reiniciar timer
        clearInterval(this.interval);
        this.start();
    }

    updateDisplay() {
        if (!this.timerElement || !this.timerElement.isConnected) {
            this.pause();
            return;
        }
        try {
            const mins = Math.floor(this.seconds / 60).toString().padStart(2, '0');
            const secs = (this.seconds % 60).toString().padStart(2, '0');
            this.timerElement.textContent = `${mins}:${secs}`;
        } catch (error) {
            this.pause();
        }
    }

    pause() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    resume() {
        if (!this.interval) {
            this.start();
        }
    }

    getTime() {
        return this.seconds;
    }
}

/* ============================================
   CLASSE: FULLSCREEN MANAGER
   ============================================ */
class FullscreenManager {
    constructor() {
        this.presentationCard = document.getElementById('presentationCard');
        this.fullscreenBtn = document.getElementById('fullscreenBtn');
        this.enterIcon = document.getElementById('fs-enter-icon');
        this.exitIcon = document.getElementById('fs-exit-icon');
        
        this.init();
    }

    init() {
        if (!this.fullscreenBtn || !this.presentationCard) {
            return;
        }

        this.fullscreenBtn.addEventListener('click', () => this.toggle());
        
        document.addEventListener('fullscreenchange', () => this.updateUI());
        document.addEventListener('webkitfullscreenchange', () => this.updateUI());
        document.addEventListener('mozfullscreenchange', () => this.updateUI());
        document.addEventListener('MSFullscreenChange', () => this.updateUI());
        
        // Tecla F11 ou F para fullscreen
        document.addEventListener('keydown', (e) => {
            if (e.key === 'f' || e.key === 'F') {
                e.preventDefault();
                this.toggle();
            }
        });
    }

    toggle() {
        if (!this.isFullscreen()) {
            this.enter();
        } else {
            this.exit();
        }
    }

    enter() {
        const element = this.presentationCard;
        if (!element) {
            return;
        }
        
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen();
        } else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen();
        } else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();
        }
    }

    exit() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }

    isFullscreen() {
        return !!(document.fullscreenElement || 
                 document.webkitFullscreenElement || 
                 document.mozFullScreenElement || 
                 document.msFullscreenElement);
    }

    updateUI() {
        const isFullscreen = this.isFullscreen();
        
        // Atualizar ícones
        if (this.enterIcon && this.exitIcon) {
            this.enterIcon.classList.toggle('hidden', isFullscreen);
            this.exitIcon.classList.toggle('hidden', !isFullscreen);
        }
        
        // Atualizar classe do card
        if (this.presentationCard) {
            this.presentationCard.classList.toggle('fullscreen', isFullscreen);
        }
    }
}

/* ============================================
   CLASSE: KEYBOARD SHORTCUTS MANAGER
   ============================================ */
class KeyboardShortcutsManager {
    constructor(slideManager, timerController, fullscreenManager) {
        this.slideManager = slideManager;
        this.timerController = timerController;
        this.fullscreenManager = fullscreenManager;
        
        this.init();
    }

    init() {
        document.addEventListener('keydown', (e) => {
            // Prevenir atalhos em campos de input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
            // Desativar quando qualquer modal estiver aberto
            if (document.querySelector('.ppt-modal:not(.hidden)')) return;
            // Desativar quando o overlay de ajuda estiver visível
            if (document.getElementById('keyboard-help-overlay')) return;

            if (e.key === '?' || (e.shiftKey && e.key === '/')) {
                e.preventDefault();
                this.showHelpOverlay();
            }
        });
    }

    showHelpOverlay() {
        // Criar overlay de ajuda se não existir
        let overlay = document.getElementById('keyboard-help-overlay');
        
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'keyboard-help-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-family: 'Inter', sans-serif;
            `;
            
            overlay.innerHTML = `
                <div style="background: rgba(16, 185, 129, 0.1); backdrop-filter: blur(20px); padding: 3rem; border-radius: 1.5rem; max-width: 600px; border: 2px solid rgba(16, 185, 129, 0.3);">
                    <h2 style="font-size: 2rem; font-weight: 700; margin-bottom: 1.5rem; text-align: center;">⌨️ Atalhos do Teclado</h2>
                    <div style="display: grid; gap: 1rem; font-size: 1.125rem;">
                        <div style="display: flex; justify-content: space-between;">
                            <span><kbd style="background: rgba(255,255,255,0.2); padding: 0.25rem 0.75rem; border-radius: 0.375rem;">→</kbd> / <kbd style="background: rgba(255,255,255,0.2); padding: 0.25rem 0.75rem; border-radius: 0.375rem;">Espaço</kbd></span>
                            <span>Próximo Slide</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span><kbd style="background: rgba(255,255,255,0.2); padding: 0.25rem 0.75rem; border-radius: 0.375rem;">←</kbd></span>
                            <span>Slide Anterior</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span><kbd style="background: rgba(255,255,255,0.2); padding: 0.25rem 0.75rem; border-radius: 0.375rem;">Home</kbd></span>
                            <span>Primeiro Slide</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span><kbd style="background: rgba(255,255,255,0.2); padding: 0.25rem 0.75rem; border-radius: 0.375rem;">End</kbd></span>
                            <span>Último Slide</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span><kbd style="background: rgba(255,255,255,0.2); padding: 0.25rem 0.75rem; border-radius: 0.375rem;">F</kbd></span>
                            <span>Tela Cheia</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span><kbd style="background: rgba(255,255,255,0.2); padding: 0.25rem 0.75rem; border-radius: 0.375rem;">ESC</kbd></span>
                            <span>Fechar (Ajuda ou Fullscreen)</span>
                        </div>
                    </div>
                    <p style="margin-top: 2rem; text-align: center; opacity: 0.7;">Pressione ESC para fechar</p>
                </div>
            `;
            
            // Fechar ao clicar ou pressionar ESC
            overlay.addEventListener('click', () => overlay.remove());
            document.addEventListener('keydown', function escHandler(e) {
                if (e.key === 'Escape') {
                    overlay.remove();
                    document.removeEventListener('keydown', escHandler);
                }
            });
            
            document.body.appendChild(overlay);
        }
    }
}

/* ============================================
   INICIALIZAÇÃO PRINCIPAL
   ============================================ */
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar Loading Screen
    const loadingManager = new LoadingManager();
    loadingManager.hide();

    // Inicializar Partículas
    new ParticlesCanvas('particles-canvas');

    // Inicializar Gerenciador de Slides
    const slideManager = new SlideManager();
    window._slideManager = slideManager;

    // Inicializar Timer
    const timerController = new TimerController();

    // Inicializar Fullscreen
    const fullscreenManager = new FullscreenManager();

    // Inicializar Atalhos de Teclado
    new KeyboardShortcutsManager(slideManager, timerController, fullscreenManager);

    // Inicializar UI Firebase — aguarda o evento 'firebase-ready' do módulo ES
    const initFirebaseUI = () => {
        if (window._fbUIInitialized) return; // evita dupla inicialização
        window._fbUIInitialized = true;
        try {
            new FirebaseUI(slideManager);
        } catch (err) {
            console.error('[FirebaseUI] Falha ao inicializar:', err);
            window._fbUIInitialized = false; // permite retry na próxima tentativa
        }
    };

    // Escuta evento disparado por firebase.js quando ele termina de carregar
    window.addEventListener('firebase-ready', (e) => {
        if (e.detail?.error) {
            console.error('[UI] Firebase falhou ao inicializar:', e.detail.error);
            return;
        }
        initFirebaseUI();
    });

    // Caso firebase.js já tenha executado antes desse listener ser registrado
    if (window.FirebaseService) initFirebaseUI();

    // Fallback de segurança: se após 3s o Firebase ainda não inicializou, tenta novamente
    setTimeout(() => {
        if (!window._fbUIInitialized && window.FirebaseService) {
            console.warn('[FirebaseUI] Retry de inicialização após timeout.');
            initFirebaseUI();
        }
    }, 3000);

    // Console Easter Egg
    console.log('%c💺 ERGONOMIA NO TRABALHO DIGITAL', 'font-size: 20px; color: #10b981; font-weight: bold;');
    console.log('%cApresentação Premium | Pressione ? para ver os atalhos', 'font-size: 14px; color: #facc15;');
});

/* ============================================
   CLASSE: FIREBASE UI
   Gerenciamento de apresentações com Firebase
   ============================================ */
class FirebaseUI {
    constructor(slideManager) {
        this.slideManager = slideManager;
        this.currentPptId = null;
        this.isAdmin = false;

        // Elementos
        this.modalPpt     = document.getElementById('modal-presentations');
        this.modalEdit    = document.getElementById('modal-edit-ppt');
        this.modalSlide   = document.getElementById('modal-edit-slide');
        this.pptList      = document.getElementById('ppt-list');
        this.nameLabel    = document.getElementById('current-ppt-name');
        this.brandLabel   = document.getElementById('brand-pill');

        this._bindEvents();
        this._watchAuth();
    }

    /* ── Auth ── */
    _watchAuth() {
        const svc = window.FirebaseService;
        if (!svc) {
            // Retry when Firebase becomes available (handles slow/pending loads)
            window.addEventListener('firebase-ready', (e) => {
                if (!e.detail?.error) this._watchAuth();
            }, { once: true });
            return;
        }
        svc.Auth.onStateChange((user, isAdmin) => {
            this.isAdmin = isAdmin;
            this._updateAdminUI(user, isAdmin);

            // Auto-carregar a última apresentação salva (uma vez)
            if (!this._autoLoaded) {
                this._autoLoaded = true;
                this._autoLoadLatest();
            }
        });
    }

    /** Carrega automaticamente a apresentação mais recente do Firebase */
    async _autoLoadLatest() {
        try {
            const svc = window.FirebaseService;
            if (!svc) return;
            const list = await svc.Presentations.list();
            if (!list.length) return; // nenhuma apresentação salva — manter local

            // Encontrar a mais recentemente atualizada
            const latest = list.reduce((a, b) => ((b.updatedAt || 0) > (a.updatedAt || 0) ? b : a), list[0]);
            await this._loadPresentation(latest.id, latest.title);
        } catch (err) {
            console.warn('[AutoLoad] Falha ao carregar última apresentação:', err.message);
            // Falha silenciosa — mantém o conteúdo local
        }
    }

    _updateAdminUI(user, isAdmin) {
        const adminOnly  = document.querySelectorAll('.admin-only');
        const loginPanel = document.getElementById('admin-login-panel');
        const btnAccess  = document.getElementById('btn-admin-access');
        const userLabel  = document.getElementById('admin-user-label');
        const btnLogout  = document.getElementById('btn-admin-logout');

        adminOnly.forEach(el => el.classList.toggle('hidden', !isAdmin));

        if (user) {
            if (userLabel)  { userLabel.textContent = user.email; userLabel.classList.remove('hidden'); }
            if (btnAccess)  { btnAccess.classList.add('hidden'); }
            if (btnLogout)  { btnLogout.classList.remove('hidden'); }
            if (loginPanel) { loginPanel.classList.add('hidden'); }
        } else {
            if (userLabel)  { userLabel.classList.add('hidden'); }
            if (btnAccess)  { btnAccess.classList.remove('hidden'); }
            if (btnLogout)  { btnLogout.classList.add('hidden'); }
        }
    }

    /* ── Eventos ── */
    _bindEvents() {
        /* Abrir modal principal */
        const btnPpts = document.getElementById('presentationsBtn');
        if (btnPpts) btnPpts.addEventListener('click', () => this._openPptModal());

        /* Fechar modais pelo botão */
        document.getElementById('modal-ppt-close')?.addEventListener('click',       () => this._closeModal('modal-presentations'));
        document.getElementById('modal-edit-close')?.addEventListener('click',      () => this._closeModal('modal-edit-ppt'));
        document.getElementById('modal-slide-close')?.addEventListener('click',     () => this._closeModal('modal-edit-slide'));
        document.getElementById('btn-cancel-slide')?.addEventListener('click',      () => this._closeModal('modal-edit-slide'));
        document.getElementById('modal-tpl-close')?.addEventListener('click',       () => this._closeModal('modal-templates'));
        document.getElementById('modal-save-current-close')?.addEventListener('click', () => this._closeModal('modal-save-current'));
        document.getElementById('btn-cancel-save-current')?.addEventListener('click',  () => this._closeModal('modal-save-current'));

        /* Roteiro modal */
        document.getElementById('modal-roteiro-close')?.addEventListener('click', () => this._closeModal('modal-roteiro'));
        document.getElementById('btn-roteiro-copy')?.addEventListener('click', () => {
            if (this._roteiroText) {
                this._copyToClipboard(this._roteiroText).then(() => {
                    const s = document.getElementById('roteiro-status');
                    if (s) { s.textContent = '\u2705 Copiado!'; setTimeout(() => { s.textContent = ''; }, 3000); }
                });
            }
        });
        document.getElementById('btn-roteiro-download')?.addEventListener('click', () => this._downloadRoteiroFile());

        /* Fechar dropdown de download ao clicar fora */
        document.addEventListener('click', () => this._closeDlMenus());

        /* Fechar ao clicar no backdrop — fecha APENAS o modal mais alto visível */
        document.querySelectorAll('.ppt-modal-backdrop').forEach(bd => {
            bd.addEventListener('click', () => {
                // Ordem: do mais alto para o mais baixo
                const stack = ['modal-templates','modal-save-current','modal-roteiro','modal-edit-slide','modal-edit-ppt','modal-presentations'];
                for (const id of stack) {
                    if (!document.getElementById(id)?.classList.contains('hidden')) {
                        this._closeModal(id);
                        return;
                    }
                }
            });
        });

        /* Admin login */
        document.getElementById('btn-admin-access')?.addEventListener('click', () => {
            document.getElementById('admin-login-panel')?.classList.toggle('hidden');
        });
        document.getElementById('btn-cancel-login')?.addEventListener('click', () => {
            document.getElementById('admin-login-panel')?.classList.add('hidden');
        });
        document.getElementById('btn-admin-login')?.addEventListener('click', () => this._doLogin());
        document.getElementById('admin-password')?.addEventListener('keydown', e => {
            if (e.key === 'Enter') this._doLogin();
        });

        /* Logout */
        document.getElementById('btn-admin-logout')?.addEventListener('click', () => {
            window.FirebaseService?.Auth.logout();
        });

        /* Nova apresentação */
        document.getElementById('btn-new-ppt')?.addEventListener('click', () => this._openEditPpt(null));

        /* Salvar apresentação atual */
        document.getElementById('btn-save-current-ppt')?.addEventListener('click', () => this._openSaveCurrentModal());
        document.getElementById('btn-confirm-save-current')?.addEventListener('click', () => this._saveCurrentPresentation());

        /* Salvar metadados da apresentação */
        document.getElementById('btn-save-ppt-meta')?.addEventListener('click', () => this._savePptMeta());

        /* Salvar slide */
        document.getElementById('btn-save-slide')?.addEventListener('click', () => this._saveSlide());

        /* Galeria de templates */
        document.getElementById('btn-slide-template')?.addEventListener('click', () => this._openTemplateGallery());

        /* Editor: preview ao vivo ao digitar ou mudar fundo */
        document.getElementById('edit-slide-content')?.addEventListener('input', () => this._updateSlidePreview());
        document.getElementById('edit-slide-classes')?.addEventListener('change', () => this._updateSlidePreview());

        /* Editor: formatar HTML */
        document.getElementById('btn-format-html')?.addEventListener('click', () => this._formatSlideHtml());

        /* Editor: Tab insere 4 espaços em vez de mudar foco */
        document.getElementById('edit-slide-content')?.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const ta = e.target;
                const s = ta.selectionStart, end = ta.selectionEnd;
                ta.value = ta.value.slice(0, s) + '    ' + ta.value.slice(end);
                ta.selectionStart = ta.selectionEnd = s + 4;
            }
        });

        /* Editor: botões de snippet */
        document.querySelectorAll('[data-snip]').forEach(btn => {
            btn.addEventListener('click', () => this._insertSnippet(btn.dataset.snip));
        });

        /* Adicionar slide */
        document.getElementById('btn-add-slide')?.addEventListener('click', () => {
            const pptId = document.getElementById('edit-ppt-id')?.value;
            if (pptId) this._openEditSlide(pptId, null);
        });

        /* ESC fecha modal no topo */
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                const stack = ['modal-templates','modal-roteiro','modal-edit-slide','modal-edit-ppt','modal-save-current','modal-presentations'];
                for (const id of stack) {
                    if (!document.getElementById(id)?.classList.contains('hidden')) {
                        this._closeModal(id);
                        return;
                    }
                }
            }
        });
    }

    _openModal(id) {
        document.getElementById(id)?.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
    _closeModal(id) {
        document.getElementById(id)?.classList.add('hidden');
        // Só restaura scroll se nenhum modal estiver aberto
        const any = ['modal-presentations','modal-edit-ppt','modal-edit-slide','modal-templates','modal-save-current','modal-roteiro']
            .some(m => !document.getElementById(m)?.classList.contains('hidden'));
        if (!any) document.body.style.overflow = '';
    }

    /* ── Login ── */
    async _doLogin() {
        const email    = document.getElementById('admin-email')?.value.trim();
        const password = document.getElementById('admin-password')?.value;
        const errBox   = document.getElementById('admin-login-error');
        const btn      = document.getElementById('btn-admin-login');

        if (!email || !password) return this._showErr(errBox, 'Preencha e-mail e senha.');
        btn.disabled = true;
        btn.textContent = 'Entrando...';
        try {
            await window.FirebaseService.Auth.login(email, password);
            document.getElementById('admin-login-panel')?.classList.add('hidden');
            if (errBox) errBox.classList.add('hidden');
            document.getElementById('admin-email').value = '';
            document.getElementById('admin-password').value = '';
        } catch(e) {
            this._showErr(errBox, e.code === 'auth/invalid-credential'
                ? 'E-mail ou senha inválidos.'
                : e.message);
        }
        btn.disabled = false;
        btn.textContent = 'Entrar';
    }

    /* ── Modal principal: listar apresentações ── */
    async _openPptModal() {
        this._openModal('modal-presentations');
        await this._refreshPptList();
    }

    async _refreshPptList() {
        const svc = window.FirebaseService;
        if (!svc) { this.pptList.innerHTML = '<div class="ppt-empty">Firebase não conectado.</div>'; return; }

        this.pptList.innerHTML = '<div class="ppt-loading">⏳ Carregando...</div>';
        try {
            const list = await svc.Presentations.list();
            if (!list.length) {
                this.pptList.innerHTML = '<div class="ppt-empty">Nenhuma apresentação salva.<br><small>Use "+ Nova" para criar.</small></div>';
                return;
            }
            this.pptList.innerHTML = '';
            list.forEach(ppt => this.pptList.appendChild(this._buildPptCard(ppt)));
        } catch(e) {
            this.pptList.innerHTML = `<div class="ppt-empty" style="color:#ef4444;">Erro: ${e.message}</div>`;
        }
    }

    _buildPptCard(ppt) {
        const card = document.createElement('div');
        card.className = 'ppt-card' + (ppt.id === this.currentPptId ? ' active' : '');
        const slideCount = ppt.slides ? Object.keys(ppt.slides).length : 0;
        const date = ppt.updatedAt ? new Date(ppt.updatedAt).toLocaleDateString('pt-BR') : '';

        card.innerHTML = `
            <div class="ppt-card-row">
                <div class="ppt-card-info">
                    <div class="ppt-card-title">${this._esc(ppt.title)}</div>
                    <div class="ppt-card-meta">${slideCount} slide${slideCount!==1?'s':''} ${ppt.author?'\u00b7 '+this._esc(ppt.author):''} ${date?'\u00b7 '+date:''}</div>
                </div>
                <div class="ppt-card-actions">
                    <button class="ppt-card-btn" data-action="load" title="Abrir">&#9654; Abrir</button>
                    ${this.isAdmin ? `<button class="ppt-card-btn" data-action="edit" title="Editar">&#9998;&#65039;</button>` : ''}
                    <div class="ppt-dl-wrap">
                        <button class="ppt-dl-trigger" data-action="dl-toggle">&#11015; Baixar</button>
                        <div class="ppt-dl-menu">
                            <button class="ppt-dl-item" data-action="pdf">&#128196; Baixar PDF</button>
                            <button class="ppt-dl-item" data-action="pptx">&#128202; Baixar PPTX</button>
                            <button class="ppt-dl-item" data-action="roteiro">&#128221; Ver Roteiro</button>
                        </div>
                    </div>
                    ${this.isAdmin ? `<button class="ppt-card-btn danger" data-action="delete" title="Excluir">&#128465;</button>` : ''}
                </div>
            </div>
        `;

        card.querySelector('[data-action="load"]')?.addEventListener('click',   () => this._loadPresentation(ppt.id, ppt.title));
        card.querySelector('[data-action="edit"]')?.addEventListener('click',   () => this._openEditPpt(ppt));
        card.querySelector('[data-action="delete"]')?.addEventListener('click', () => this._deletePpt(ppt));
        card.querySelector('[data-action="pdf"]')?.addEventListener('click',    () => { this._closeDlMenus(); this._downloadPresentation(ppt.id, ppt.title, 'pdf'); });
        card.querySelector('[data-action="pptx"]')?.addEventListener('click',   () => { this._closeDlMenus(); this._downloadPresentation(ppt.id, ppt.title, 'pptx'); });
        card.querySelector('[data-action="roteiro"]')?.addEventListener('click', () => { this._closeDlMenus(); this._openRoteiro(ppt.id, ppt.title); });

        // Dropdown toggle
        const dlTrigger = card.querySelector('[data-action="dl-toggle"]');
        const dlMenu = card.querySelector('.ppt-dl-menu');
        dlTrigger?.addEventListener('click', (e) => {
            e.stopPropagation();
            this._closeDlMenus(); // fecha outros abertos
            dlMenu?.classList.toggle('open');
        });

        return card;
    }

    /** Fecha todos os dropdown menus de download */
    _closeDlMenus() {
        document.querySelectorAll('.ppt-dl-menu.open').forEach(m => m.classList.remove('open'));
    }

    /* ── Carregar apresentação do banco ── */
    async _loadPresentation(id, title) {
        const svc = window.FirebaseService;
        const container = document.querySelector('.slides-container');
        if (!container || !svc) return;

        this._closeModal('modal-presentations');

        // Exibir loading
        container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#9ca3af;font-size:1.2rem;">⏳ Carregando slides...</div>';

        try {
            const slides = await svc.Slides.list(id);

            if (!slides.length) {
                container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#9ca3af;font-size:1.2rem;">Esta apresentação não tem slides ainda.<br><small>Adicione slides pelo painel admin.</small></div>';
                return;
            }

            // Injetar slides
            container.innerHTML = '';
            slides.forEach((slide, i) => {
                const section = document.createElement('section');
                section.id = `slide-${i + 1}`;
                // Restaurar classes visuais salvas + active no primeiro
                const extraClasses = slide.slideClasses || '';
                section.className = `slide${extraClasses ? ' ' + extraClasses : ''}${i === 0 ? ' active' : ''}`;
                section.innerHTML = slide.content || '<div class="slide-content"><p>Slide vazio</p></div>';
                container.appendChild(section);
            });

            // Reinicializar SlideManager
            const newManager = new SlideManager();
            window._slideManager = newManager;
            this.slideManager = newManager;

            this.currentPptId = id;
            if (this.nameLabel) this.nameLabel.textContent = title;
            // Atualizar marca/tema se salvo na apresentação
            const pptData = await svc.Presentations.get(id);
            if (pptData?.brand && this.brandLabel) this.brandLabel.textContent = pptData.brand;

        } catch(e) {
            container.innerHTML = `<div style="padding:2rem;color:#ef4444;">Erro ao carregar: ${e.message}</div>`;
        }
    }

    /* ── Criar / Editar apresentação ── */
    _openEditPpt(ppt) {
        document.getElementById('edit-ppt-id').value     = ppt?.id || '';
        document.getElementById('edit-ppt-title').value  = ppt?.title || '';
        document.getElementById('edit-ppt-desc').value   = ppt?.description || '';
        document.getElementById('edit-ppt-author').value = ppt?.author || '';
        const brandInput = document.getElementById('edit-ppt-brand');
        if (brandInput) brandInput.value = ppt?.brand || '';

        const label = document.getElementById('edit-ppt-title-label');
        if (label) label.textContent = ppt ? 'Editar Apresentação' : 'Nova Apresentação';

        const btnAdd = document.getElementById('btn-add-slide');
        if (btnAdd) btnAdd.classList.toggle('hidden', !ppt);

        document.getElementById('edit-ppt-error')?.classList.add('hidden');
        this._refreshSlideList(ppt?.id);

        this._closeModal('modal-presentations');
        this._openModal('modal-edit-ppt');
    }

    async _savePptMeta() {
        const id     = document.getElementById('edit-ppt-id')?.value;
        const title  = document.getElementById('edit-ppt-title')?.value.trim();
        const desc   = document.getElementById('edit-ppt-desc')?.value.trim();
        const author = document.getElementById('edit-ppt-author')?.value.trim();
        const brand  = document.getElementById('edit-ppt-brand')?.value.trim();
        const errBox = document.getElementById('edit-ppt-error');
        const btn    = document.getElementById('btn-save-ppt-meta');
        const svc    = window.FirebaseService;

        if (!title) return this._showErr(errBox, 'O título é obrigatório.');
        btn.disabled = true; btn.textContent = 'Salvando...';

        try {
            if (id) {
                await svc.Presentations.update(id, { title, description: desc, author, brand });
                if (brand && this.brandLabel) this.brandLabel.textContent = brand;
            } else {
                const newId = await svc.Presentations.create({ title, description: desc, author, brand });
                document.getElementById('edit-ppt-id').value = newId;
                document.getElementById('btn-add-slide')?.classList.remove('hidden');
                document.getElementById('edit-ppt-title-label').textContent = 'Editar Apresentação';
                if (brand && this.brandLabel) this.brandLabel.textContent = brand;
            }
            this._showSuccess(errBox, 'Salvo com sucesso!');
            this._refreshSlideList(document.getElementById('edit-ppt-id').value);
        } catch(e) {
            this._showErr(errBox, e.message);
        }
        btn.disabled = false; btn.textContent = 'Salvar Informações';
    }

    async _deletePpt(ppt) {
        if (!this.isAdmin) return;
        if (!confirm(`Excluir "${ppt.title}" e todos os seus slides?\n\nEsta ação é irreversível.`)) return;
        try {
            await window.FirebaseService.Presentations.delete(ppt.id);
            if (this.currentPptId === ppt.id) {
                this.currentPptId = null;
                if (this.nameLabel) this.nameLabel.textContent = 'Local';
            }
            await this._refreshPptList();
        } catch(e) {
            alert('Erro ao excluir: ' + e.message);
        }
    }

    /* ── Slides no editor ── */
    async _refreshSlideList(pptId) {
        const container = document.getElementById('slide-list-editor');
        if (!container) return;
        if (!pptId) {
            container.innerHTML = '<div class="ppt-loading">Salve a apresentação para adicionar slides.</div>';
            return;
        }
        container.innerHTML = '<div class="ppt-loading">⏳ Carregando…</div>';
        try {
            const slides = await window.FirebaseService.Slides.list(pptId);
            if (!slides.length) {
                container.innerHTML = '<div class="ppt-empty">Sem slides. Clique em "+ Slide".</div>';
                return;
            }
            container.innerHTML = '';
            slides.forEach(slide => container.appendChild(this._buildSlideItem(pptId, slide)));
        } catch(e) {
            container.innerHTML = `<div class="ppt-empty" style="color:#ef4444;">${e.message}</div>`;
        }
    }

    _buildSlideItem(pptId, slide) {
        const item = document.createElement('div');
        item.className = 'ppt-slide-item';
        item.innerHTML = `
            <span class="ppt-slide-item-num">${slide.order}</span>
            <span class="ppt-slide-item-title">${this._esc(slide.title || 'Slide sem título')}</span>
            <span class="ppt-slide-item-actions">
                <button class="ppt-card-btn" data-action="edit" title="Editar">✏️</button>
                <button class="ppt-card-btn danger" data-action="delete" title="Excluir">🗑</button>
            </span>
        `;
        item.querySelector('[data-action="edit"]')?.addEventListener('click',   () => this._openEditSlide(pptId, slide));
        item.querySelector('[data-action="delete"]')?.addEventListener('click', () => this._deleteSlide(pptId, slide));
        return item;
    }

    /* ── Criar / Editar slide ── */
    _openEditSlide(pptId, slide) {
        document.getElementById('edit-slide-id').value      = slide?.id || '';
        document.getElementById('edit-slide-ppt-id').value  = pptId;
        document.getElementById('edit-slide-title').value   = slide?.title || '';
        document.getElementById('edit-slide-content').value = slide?.content || '';
        const classesEl = document.getElementById('edit-slide-classes');
        if (classesEl) classesEl.value = slide?.slideClasses || '';
        document.getElementById('edit-slide-label').textContent = slide ? 'Editar Slide' : 'Novo Slide';
        document.getElementById('edit-slide-error')?.classList.add('hidden');
        this._openModal('modal-edit-slide');
        // Iniciar preview ao vivo
        this._initPreviewCss().then(() => this._updateSlidePreview());
    }

    async _saveSlide() {
        const pptId       = document.getElementById('edit-slide-ppt-id')?.value;
        const slideId     = document.getElementById('edit-slide-id')?.value;
        const title       = document.getElementById('edit-slide-title')?.value.trim();
        const content     = document.getElementById('edit-slide-content')?.value;
        const slideClasses = document.getElementById('edit-slide-classes')?.value || '';
        const errBox  = document.getElementById('edit-slide-error');
        const btn     = document.getElementById('btn-save-slide');
        const svc     = window.FirebaseService;

        if (!content.trim()) return this._showErr(errBox, 'O conteúdo HTML não pode estar vazio.');
        btn.disabled = true; btn.textContent = 'Salvando...';

        try {
            if (slideId) {
                await svc.Slides.update(pptId, slideId, { title: title || 'Slide', content, slideClasses });
            } else {
                await svc.Slides.add(pptId, { title: title || 'Slide', content, slideClasses });
            }
            this._closeModal('modal-edit-slide');
            await this._refreshSlideList(pptId);
        } catch(e) {
            this._showErr(errBox, e.message);
        }
        btn.disabled = false; btn.textContent = 'Salvar Slide';
    }

    async _deleteSlide(pptId, slide) {
        if (!confirm(`Excluir slide "${slide.title || slide.order}"?`)) return;
        try {
            await window.FirebaseService.Slides.delete(pptId, slide.id);
            await this._refreshSlideList(pptId);
        } catch(e) {
            alert('Erro: ' + e.message);
        }
    }

    /* ── Salvar apresentação atual (DOM → Firebase) ── */
    _openSaveCurrentModal() {
        const slides   = document.querySelectorAll('.slides-container .slide');
        const countEl  = document.getElementById('save-current-count');
        const titleEl  = document.getElementById('save-current-title');
        const descEl   = document.getElementById('save-current-desc');
        const authorEl = document.getElementById('save-current-author');
        const brandEl  = document.getElementById('save-current-brand');
        if (countEl)  countEl.textContent = slides.length;
        if (titleEl)  titleEl.value  = '';
        if (descEl)   descEl.value   = '';
        if (authorEl) authorEl.value = '';
        // Pré-preenche com a marca atual exibida no header
        if (brandEl)  brandEl.value  = this.brandLabel?.textContent || '';
        document.getElementById('save-current-error')?.classList.add('hidden');
        this._closeModal('modal-presentations');
        this._openModal('modal-save-current');
    }

    async _saveCurrentPresentation() {
        const title  = document.getElementById('save-current-title')?.value.trim();
        const desc   = document.getElementById('save-current-desc')?.value.trim();
        const author = document.getElementById('save-current-author')?.value.trim();
        const brand  = document.getElementById('save-current-brand')?.value.trim();
        const errBox = document.getElementById('save-current-error');
        const btn    = document.getElementById('btn-confirm-save-current');
        const svc    = window.FirebaseService;

        if (!svc)   return this._showErr(errBox, 'Firebase não conectado. Recarregue a página e tente novamente.');
        if (!title) return this._showErr(errBox, 'Informe o título da apresentação.');

        const slideEls = document.querySelectorAll('.slides-container .slide');
        if (!slideEls.length) return this._showErr(errBox, 'Nenhum slide encontrado na tela.');

        btn.disabled = true;
        btn.textContent = 'Salvando...';

        try {
            const pptId = await svc.Presentations.create({ title, description: desc, author, brand });

            for (let i = 0; i < slideEls.length; i++) {
                const el = slideEls[i];
                // Extrair o título interno (section-kicker ou h1/h2 ou id)
                const kicker  = el.querySelector('.section-kicker')?.textContent?.trim();
                const heading = el.querySelector('.section-title, h1, h2')?.textContent?.trim();
                const slideTitle = kicker || heading || `Slide ${i + 1}`;
                const content = el.innerHTML;
                // Capturar classes de layout/visual do elemento .slide
                const slideClasses = el.className
                    .split(' ')
                    .filter(c => c && c !== 'slide' && c !== 'active')
                    .join(' ');
                await svc.Slides.add(pptId, { title: slideTitle, content, slideClasses });
            }

            this._closeModal('modal-save-current');
            this.currentPptId = pptId;
            if (this.nameLabel) this.nameLabel.textContent = title;
            if (brand && this.brandLabel) this.brandLabel.textContent = brand;
            // Feedback ao usuário
            const successBanner = document.createElement('div');
            successBanner.textContent = `✅ "${title}" salva com ${slideEls.length} slides no banco!`;
            successBanner.style.cssText = 'position:fixed;bottom:1.5rem;left:50%;transform:translateX(-50%);background:#064e3b;color:#d1fae5;padding:.75rem 1.5rem;border-radius:999px;font-size:.9rem;font-weight:600;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,.25);';
            document.body.appendChild(successBanner);
            setTimeout(() => successBanner.remove(), 3500);
        } catch(e) {
            this._showErr(errBox, 'Erro: ' + e.message);
        }

        btn.disabled = false;
        btn.textContent = '💾 Salvar no banco';
    }

    /* ── Galeria de templates ── */
    _openTemplateGallery() {
        const gallery = document.getElementById('template-gallery');
        if (gallery && !gallery.hasChildNodes()) {
            this._buildTemplateGallery(gallery);
        }
        this._openModal('modal-templates');
    }

    _buildTemplateGallery(container) {
        const templates = this._getTemplates();
        container.innerHTML = '';
        templates.forEach(tpl => {
            const card = document.createElement('div');
            card.className = 'tpl-card';
            card.innerHTML = `
                <div class="tpl-card-preview tpl-prev--${tpl.key}">
                    <span style="font-size:1.5rem;">${tpl.emoji}</span>
                    <span>${tpl.name}</span>
                </div>
                <div class="tpl-card-name">${tpl.name}</div>
                <div class="tpl-card-desc">${tpl.desc}</div>
            `;
            card.addEventListener('click', () => {
                const textarea = document.getElementById('edit-slide-content');
                if (textarea) {
                    textarea.value = tpl.html;
                    textarea.focus();
                    this._updateSlidePreview();
                }
                this._closeModal('modal-templates');
            });
            container.appendChild(card);
        });
    }

    _getTemplates() {
        return [
            /* ── CAPA ── */
            {
                key: 'capa', emoji: '🎯', name: 'Capa',
                desc: 'Slide inicial com logos, título em destaque e subtítulo. Use fundo Gradiente verde.',
                html: `<div class="slide-content">
    <div class="logos-container animated-item">
        <img src="https://upload.wikimedia.org/wikipedia/commons/5/51/Logo_petrobras.gif" alt="Logo Petrobras">
        <img src="https://www.agfengenharia.com.br/wp-content/uploads/2018/09/group-20668-211507.png" alt="Logo AGF Engenharia">
    </div>
    <div class="animated-item delay-1 section-kicker mb-4">DDSMS | Saúde e Segurança</div>
    <h1 class="animated-item delay-2 section-title">
        <span class="title-line">Título Principal</span>
        <span class="title-line">Subtítulo com <span class="title-accent">Destaque</span></span>
    </h1>
    <p class="animated-item delay-3 mt-6 section-lead">
        Mensagem de abertura que contextualiza o tema.
    </p>
</div>`
            },

            /* ── CONTEÚDO SIMPLES ── */
            {
                key: 'conteudo', emoji: '📄', name: 'Conteúdo',
                desc: 'Kicker + título + parágrafo de destaque em card.',
                html: `<div class="m-auto w-full max-w-3xl">
    <div class="animated-item section-kicker mb-3">Tópico</div>
    <h2 class="animated-item section-title text-gray-800 mb-6">Título do Slide</h2>
    <div class="animated-item delay-1 card card--success">
        <p class="text-2xl text-gray-700 leading-relaxed">
            Mensagem principal com clareza e impacto.
        </p>
        <p class="mt-6 text-xl text-gray-600">
            Complemento direto da mensagem.
        </p>
        <p class="mt-4 text-base text-gray-600 leading-relaxed">
            Detalhe explicativo adicional para contextualizar.
        </p>
    </div>
</div>`
            },

            /* ── GRID 2 COLUNAS (danger + success) ── */
            {
                key: 'grid2', emoji: '⚖️', name: 'Comparativo 2 col.',
                desc: 'Dois cards lado a lado — problema vs solução.',
                html: `<div class="m-auto w-full max-w-4xl">
    <div class="flex items-center justify-center mb-6">
        <div class="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold text-2xl mr-4">⚖️</div>
        <h2 class="section-title text-gray-800">Título do Slide</h2>
    </div>
    <div class="grid md:grid-cols-2 gap-6">
        <div class="animated-item delay-1 card card--danger">
            <div class="card-title">⚠️ Problema</div>
            <p class="text-lg text-gray-600">Descrição do problema ou situação negativa.</p>
            <ul class="card-list text-gray-700 mt-3">
                <li><span>•</span><span>Ponto negativo 1</span></li>
                <li><span>•</span><span>Ponto negativo 2</span></li>
                <li><span>•</span><span>Ponto negativo 3</span></li>
            </ul>
        </div>
        <div class="animated-item delay-2 card card--success">
            <div class="card-title">✅ Solução</div>
            <p class="text-gray-700 text-lg">Descrição da conduta correta ou resultado positivo.</p>
            <ul class="card-list text-emerald-800 mt-3">
                <li><span>•</span><span>Ponto positivo 1</span></li>
                <li><span>•</span><span>Ponto positivo 2</span></li>
                <li><span>•</span><span>Ponto positivo 3</span></li>
            </ul>
        </div>
    </div>
    <div class="animated-item delay-3 mt-6 card card--soft text-center">
        <p class="text-xl text-gray-800 font-semibold">Mensagem de encerramento do slide.</p>
        <p class="mt-2 text-base text-gray-600">Detalhe explicativo.</p>
    </div>
</div>`
            },

            /* ── GRID 3 COLUNAS (cards com ícone) ── */
            {
                key: 'grid3', emoji: '🃏', name: 'Grid 3 col. com ícone',
                desc: 'Três cards com ícone-pill, título e texto.',
                html: `<div class="m-auto w-full max-w-5xl">
    <div class="animated-item section-kicker mb-2">Tópico</div>
    <h2 class="animated-item section-title text-gray-800 mb-8">Título do Slide</h2>
    <div class="grid md:grid-cols-3 gap-6">
        <div class="animated-item delay-1 card hover-lift text-center">
            <div class="icon-pill icon-pill--emerald mx-auto mb-3">
                <img class="icon-img sm" src="https://raw.githubusercontent.com/coltongriffith/fluenticons/main/static/icons/fluent/ic_fluent_shield_24_filled.svg" alt="Ícone">
            </div>
            <div class="card-title">Item 1</div>
            <p class="text-sm text-gray-600">Descrição breve do primeiro item.</p>
            <p class="mt-2 text-xs text-gray-500">Detalhe complementar.</p>
        </div>
        <div class="animated-item delay-2 card hover-lift text-center">
            <div class="icon-pill icon-pill--blue mx-auto mb-3">
                <img class="icon-img sm" src="https://raw.githubusercontent.com/coltongriffith/fluenticons/main/static/icons/fluent/ic_fluent_document_24_filled.svg" alt="Ícone">
            </div>
            <div class="card-title">Item 2</div>
            <p class="text-sm text-gray-600">Descrição breve do segundo item.</p>
            <p class="mt-2 text-xs text-gray-500">Detalhe complementar.</p>
        </div>
        <div class="animated-item delay-3 card hover-lift text-center">
            <div class="icon-pill icon-pill--yellow mx-auto mb-3">
                <img class="icon-img sm" src="https://raw.githubusercontent.com/coltongriffith/fluenticons/main/static/icons/fluent/ic_fluent_clock_24_filled.svg" alt="Ícone">
            </div>
            <div class="card-title">Item 3</div>
            <p class="text-sm text-gray-600">Descrição breve do terceiro item.</p>
            <p class="mt-2 text-xs text-gray-500">Detalhe complementar.</p>
        </div>
    </div>
</div>`
            },

            /* ── GRID 6 MINI CARDS ── */
            {
                key: 'grid6', emoji: '🔢', name: 'Grid 6 mini cards',
                desc: 'Seis cards compactos em 3 colunas — para listagens.',
                html: `<div class="m-auto w-full max-w-5xl">
    <div class="animated-item section-kicker mb-2">Tópico</div>
    <h2 class="animated-item section-title text-gray-800 mb-8">Título do Slide</h2>
    <div class="grid md:grid-cols-3 gap-6">
        <div class="animated-item delay-1 card hover-lift text-center">
            <div class="icon-pill icon-pill--emerald mx-auto mb-3">
                <img class="icon-img sm" src="https://raw.githubusercontent.com/coltongriffith/fluenticons/main/static/icons/fluent/ic_fluent_shield_24_filled.svg" alt="">
            </div>
            <div class="card-title">Item 1</div>
            <p class="text-sm text-gray-600">Texto breve.</p>
            <p class="mt-2 text-xs text-gray-500">Detalhe.</p>
        </div>
        <div class="animated-item delay-2 card hover-lift text-center">
            <div class="icon-pill icon-pill--blue mx-auto mb-3">
                <img class="icon-img sm" src="https://raw.githubusercontent.com/coltongriffith/fluenticons/main/static/icons/fluent/ic_fluent_document_24_filled.svg" alt="">
            </div>
            <div class="card-title">Item 2</div>
            <p class="text-sm text-gray-600">Texto breve.</p>
            <p class="mt-2 text-xs text-gray-500">Detalhe.</p>
        </div>
        <div class="animated-item delay-3 card hover-lift text-center">
            <div class="icon-pill icon-pill--yellow mx-auto mb-3">
                <img class="icon-img sm" src="https://raw.githubusercontent.com/coltongriffith/fluenticons/main/static/icons/fluent/ic_fluent_clock_24_filled.svg" alt="">
            </div>
            <div class="card-title">Item 3</div>
            <p class="text-sm text-gray-600">Texto breve.</p>
            <p class="mt-2 text-xs text-gray-500">Detalhe.</p>
        </div>
        <div class="animated-item delay-4 card hover-lift text-center">
            <div class="icon-pill icon-pill--orange mx-auto mb-3">
                <img class="icon-img sm" src="https://raw.githubusercontent.com/coltongriffith/fluenticons/main/static/icons/fluent/ic_fluent_people_add_24_filled.svg" alt="">
            </div>
            <div class="card-title">Item 4</div>
            <p class="text-sm text-gray-600">Texto breve.</p>
            <p class="mt-2 text-xs text-gray-500">Detalhe.</p>
        </div>
        <div class="animated-item delay-5 card hover-lift text-center">
            <div class="icon-pill icon-pill--purple mx-auto mb-3">
                <img class="icon-img sm" src="https://raw.githubusercontent.com/coltongriffith/fluenticons/main/static/icons/fluent/ic_fluent_eye_show_24_filled.svg" alt="">
            </div>
            <div class="card-title">Item 5</div>
            <p class="text-sm text-gray-600">Texto breve.</p>
            <p class="mt-2 text-xs text-gray-500">Detalhe.</p>
        </div>
        <div class="animated-item delay-6 card hover-lift text-center">
            <div class="icon-pill icon-pill--teal mx-auto mb-3">
                <img class="icon-img sm" src="https://raw.githubusercontent.com/coltongriffith/fluenticons/main/static/icons/fluent/ic_fluent_chart_person_24_filled.svg" alt="">
            </div>
            <div class="card-title">Item 6</div>
            <p class="text-sm text-gray-600">Texto breve.</p>
            <p class="mt-2 text-xs text-gray-500">Detalhe.</p>
        </div>
    </div>
</div>`
            },

            /* ── LISTA / BULLETS ── */
            {
                key: 'lista', emoji: '📋', name: 'Lista com bullets',
                desc: 'Kicker, título e lista de pontos em card-list.',
                html: `<div class="m-auto w-full max-w-3xl">
    <div class="animated-item section-kicker mb-3">Tópico</div>
    <h2 class="animated-item section-title text-gray-800 mb-6">Título do Slide</h2>
    <div class="animated-item delay-1 card card--soft">
        <p class="text-gray-700 mb-4">Descrição introdutória da lista:</p>
        <ul class="card-list text-gray-700">
            <li><span>•</span><span>Primeiro ponto importante</span></li>
            <li><span>•</span><span>Segundo ponto importante</span></li>
            <li><span>•</span><span>Terceiro ponto importante</span></li>
            <li><span>•</span><span>Quarto ponto importante</span></li>
            <li><span>•</span><span>Quinto ponto importante</span></li>
        </ul>
    </div>
    <div class="animated-item delay-2 mt-6 card card--success text-center">
        <p class="text-xl font-semibold text-gray-800">Mensagem de encerramento.</p>
    </div>
</div>`
            },

            /* ── SINAIS DE ALERTA (pills) ── */
            {
                key: 'sinal', emoji: '🚨', name: 'Sinais de alerta (pills)',
                desc: 'Badges coloridos em destaque — sinais, etapas, ações.',
                html: `<div class="m-auto">
    <div class="animated-item section-kicker mb-2">Atenção</div>
    <h2 class="animated-item section-title text-gray-800 mb-10">Título do Slide</h2>
    <div class="flex flex-wrap justify-center gap-4">
        <div class="animated-item delay-1 px-6 py-3 bg-emerald-600 text-white rounded-full font-bold text-xl shadow-lg flex items-center gap-3">
            Sinal 1
        </div>
        <div class="animated-item delay-2 px-6 py-3 bg-emerald-500 text-white rounded-full font-bold text-xl shadow-lg flex items-center gap-3">
            Sinal 2
        </div>
        <div class="animated-item delay-3 px-6 py-3 bg-teal-500 text-white rounded-full font-bold text-xl shadow-lg flex items-center gap-3">
            Sinal 3
        </div>
        <div class="animated-item delay-4 px-6 py-3 bg-cyan-500 text-white rounded-full font-bold text-xl shadow-lg flex items-center gap-3">
            Sinal 4
        </div>
        <div class="animated-item delay-5 px-6 py-3 bg-blue-500 text-white rounded-full font-bold text-xl shadow-lg flex items-center gap-3">
            Sinal 5
        </div>
    </div>
    <p class="animated-item delay-6 mt-10 section-lead">Mensagem de destaque abaixo.</p>
    <p class="animated-item delay-6 mt-4 text-base text-gray-600">
        Explicação adicional sobre os sinais listados acima.
    </p>
</div>`
            },

            /* ── 4 AÇÕES / PASSOS ── */
            {
                key: 'acoes', emoji: '🔵', name: 'Grid 4 ações',
                desc: 'Quatro cards com ícone quadrado e texto curto.',
                html: `<div class="m-auto w-full max-w-4xl">
    <div class="animated-item section-kicker mb-2">Tópico</div>
    <h2 class="animated-item section-title text-gray-800 mb-6">Título do Slide</h2>
    <p class="animated-item delay-1 section-lead mb-8">Descrição introdutória das ações.</p>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="animated-item delay-2 card card--success hover-lift text-center">
            <div class="w-14 h-14 bg-green-500 rounded-2xl mb-4 shadow-lg mx-auto flex items-center justify-center">
                <span class="text-white text-2xl font-bold">1</span>
            </div>
            <div class="card-title">Ação 1</div>
            <p class="text-sm">Descrição breve.</p>
        </div>
        <div class="animated-item delay-3 card card--success hover-lift text-center">
            <div class="w-14 h-14 bg-blue-500 rounded-2xl mb-4 shadow-lg mx-auto flex items-center justify-center">
                <span class="text-white text-2xl font-bold">2</span>
            </div>
            <div class="card-title">Ação 2</div>
            <p class="text-sm">Descrição breve.</p>
        </div>
        <div class="animated-item delay-4 card card--warning hover-lift text-center">
            <div class="w-14 h-14 bg-orange-500 rounded-2xl mb-4 shadow-lg mx-auto flex items-center justify-center">
                <span class="text-white text-2xl font-bold">3</span>
            </div>
            <div class="card-title">Ação 3</div>
            <p class="text-sm">Descrição breve.</p>
        </div>
        <div class="animated-item delay-5 card card--danger hover-lift text-center">
            <div class="w-14 h-14 bg-red-600 rounded-2xl mb-4 shadow-lg mx-auto flex items-center justify-center">
                <span class="text-white text-2xl font-bold">4</span>
            </div>
            <div class="card-title">Ação 4</div>
            <p class="text-sm">Descrição breve.</p>
        </div>
    </div>
    <div class="animated-item delay-6 mt-8 card card--soft text-center">
        <p class="text-base text-gray-700">Mensagem de fechamento.</p>
    </div>
</div>`
            },

            /* ── CARDS COM ÍCONE GRANDE + LISTA ── */
            {
                key: 'cards-icon', emoji: '🗂️', name: 'Cards com checklist',
                desc: '3 cards verticais com ícone grande, título e lista.',
                html: `<div class="m-auto w-full max-w-6xl">
    <div class="animated-item section-kicker mb-2">Tópico</div>
    <h2 class="animated-item section-title text-gray-800 mb-8">Título do Slide</h2>
    <div class="grid md:grid-cols-3 gap-6">
        <div class="animated-item delay-1 card card--danger hover-lift">
            <img class="icon-img mb-4 mx-auto" src="https://raw.githubusercontent.com/coltongriffith/fluenticons/main/static/icons/fluent/ic_fluent_document_24_filled.svg" alt="Ícone 1">
            <div class="card-title">Categoria 1</div>
            <h3 class="card-heading">Subtítulo</h3>
            <ul class="card-list text-gray-600 text-sm">
                <li><span>•</span><span>Item 1</span></li>
                <li><span>•</span><span>Item 2</span></li>
                <li><span>•</span><span>Item 3</span></li>
            </ul>
        </div>
        <div class="animated-item delay-2 card card--warning hover-lift">
            <img class="icon-img mb-4 mx-auto" src="https://raw.githubusercontent.com/coltongriffith/fluenticons/main/static/icons/fluent/ic_fluent_eye_show_24_filled.svg" alt="Ícone 2">
            <div class="card-title">Categoria 2</div>
            <h3 class="card-heading">Subtítulo</h3>
            <ul class="card-list text-gray-600 text-sm">
                <li><span>•</span><span>Item 1</span></li>
                <li><span>•</span><span>Item 2</span></li>
                <li><span>•</span><span>Item 3</span></li>
            </ul>
        </div>
        <div class="animated-item delay-3 card card--success hover-lift">
            <img class="icon-img mb-4 mx-auto" src="https://raw.githubusercontent.com/coltongriffith/fluenticons/main/static/icons/fluent/ic_fluent_shield_24_filled.svg" alt="Ícone 3">
            <div class="card-title">Categoria 3</div>
            <h3 class="card-heading">Subtítulo</h3>
            <ul class="card-list text-gray-600 text-sm">
                <li><span>•</span><span>Item 1</span></li>
                <li><span>•</span><span>Item 2</span></li>
                <li><span>•</span><span>Item 3</span></li>
            </ul>
        </div>
    </div>
    <div class="animated-item delay-4 mt-8 card card--soft text-center">
        <p class="text-lg text-gray-800 font-semibold">Mensagem de encerramento.</p>
    </div>
</div>`
            },

            /* ── DESTAQUE CENTRAL ── */
            {
                key: 'alerta', emoji: '⚠️', name: 'Destaque central',
                desc: 'Slide focado em uma mensagem crítica com dois cards.',
                html: `<div class="m-auto w-full max-w-3xl text-center">
    <div class="animated-item section-kicker mb-2">Atenção</div>
    <h2 class="animated-item section-title text-gray-800 mb-6">Título de Alerta</h2>
    <div class="grid md:grid-cols-2 gap-6">
        <div class="animated-item delay-1 card card--danger">
            <p class="text-2xl font-medium text-gray-700 leading-relaxed text-center">
                Mensagem de alerta principal.
            </p>
        </div>
        <div class="animated-item delay-2 card card--soft text-center">
            <div class="card-title">O que fazer</div>
            <ul class="card-list text-gray-700">
                <li><span>•</span><span>Ação 1</span></li>
                <li><span>•</span><span>Ação 2</span></li>
                <li><span>•</span><span>Ação 3</span></li>
            </ul>
        </div>
    </div>
    <p class="animated-item delay-3 mt-6 section-lead">
        Mensagem de impacto final.
    </p>
</div>`
            },

            /* ── IMAGEM + TEXTO ── */
            {
                key: 'equacao', emoji: '🖼️', name: 'Imagem + texto',
                desc: 'Foto/avatar redondo à esquerda e conteúdo à direita.',
                html: `<div class="m-auto w-full max-w-4xl flex flex-col md:flex-row items-center gap-8">
    <div class="md:w-1/3 animated-item">
        <div class="w-40 h-40 rounded-full mx-auto overflow-hidden shadow-xl border-4 border-emerald-500 flex items-center justify-center bg-emerald-50">
            <img class="icon-img" src="https://raw.githubusercontent.com/coltongriffith/fluenticons/main/static/icons/fluent/ic_fluent_shield_24_filled.svg" alt="Ícone">
        </div>
    </div>
    <div class="md:w-2/3 text-center">
        <div class="animated-item delay-1 section-kicker mb-2">Tópico</div>
        <h2 class="animated-item section-title text-gray-800 mb-4">Título do Slide</h2>
        <p class="animated-item delay-2 text-lg text-gray-700">
            Parágrafo de introdução do tema com linguagem direta.
        </p>
        <ul class="animated-item delay-3 mt-6 space-y-3 text-lg text-gray-700 list-inside">
            <li>• Ponto relevante 1</li>
            <li>• Ponto relevante 2</li>
            <li>• Ponto relevante 3</li>
            <li>• Ponto relevante 4</li>
        </ul>
        <p class="animated-item delay-4 mt-5 text-base text-gray-600 leading-relaxed">
            Conclusão ou contexto final do slide.
        </p>
    </div>
</div>`
            },

            /* ── 2 LISTAS (sim vs não) ── */
            {
                key: 'comparativo', emoji: '✅❌', name: 'Sim vs Não',
                desc: '✅/❌ em dois cards para contrastes diretos.',
                html: `<div class="m-auto w-full max-w-4xl">
    <div class="animated-item section-kicker mb-2">Tópico</div>
    <h2 class="animated-item section-title text-gray-800 mb-8">Título do Slide</h2>
    <div class="grid md:grid-cols-2 gap-8">
        <div class="animated-item delay-1 card card--danger">
            <div class="card-title">❌ Sem esta prática</div>
            <ul class="card-list text-gray-600">
                <li><span>❌</span><span>Consequência negativa 1</span></li>
                <li><span>❌</span><span>Consequência negativa 2</span></li>
                <li><span>❌</span><span>Consequência negativa 3</span></li>
                <li><span>❌</span><span>Consequência negativa 4</span></li>
            </ul>
        </div>
        <div class="animated-item delay-2 card card--success">
            <div class="card-title">✅ Com esta prática</div>
            <ul class="card-list text-gray-600">
                <li><span>✅</span><span>Benefício positivo 1</span></li>
                <li><span>✅</span><span>Benefício positivo 2</span></li>
                <li><span>✅</span><span>Benefício positivo 3</span></li>
                <li><span>✅</span><span>Benefício positivo 4</span></li>
            </ul>
        </div>
    </div>
    <div class="animated-item delay-3 mt-8 card card--soft text-center">
        <p class="text-base text-gray-700">
            Conclusão final do comparativo.
        </p>
    </div>
</div>`
            },

            /* ── FECHAMENTO ── */
            {
                key: 'fechamento', emoji: '🏁', name: 'Fechamento',
                desc: 'Slide final com logos, frase de impacto e assinatura.',
                html: `<div class="m-auto flex flex-col items-center text-gray-800">
    <div class="animated-item mb-6 flex items-center justify-center space-x-8">
        <img src="https://upload.wikimedia.org/wikipedia/commons/5/51/Logo_petrobras.gif" alt="Logo Petrobras" class="h-20">
        <img src="https://www.agfengenharia.com.br/wp-content/uploads/2018/09/group-20668-211507.png" alt="Logo AGF Engenharia" class="h-20">
    </div>
    <h1 class="animated-item delay-1 text-5xl md:text-7xl font-black leading-tight mt-4">Frase de Impacto.</h1>
    <div class="animated-item delay-2 mt-12 text-lg md:text-xl font-semibold bg-white/50 p-8 rounded-xl backdrop-blur-sm text-center max-w-3xl mx-auto">
        <p class="mb-4 font-bold text-emerald-800 text-2xl">Mensagem principal de encerramento.</p>
        <p class="mb-4 text-base text-gray-700 max-w-2xl mx-auto">
            Complemento que reforça a mensagem central da apresentação.
        </p>
        <p class="text-3xl font-black text-gray-800">DDSMS | Saúde e Segurança</p>
    </div>
</div>`
            }
        ];
    }

    /* ── Preview ao vivo do editor de slide ── */

    async _initPreviewCss() {
        if (this._slideCss !== undefined) return; // já carregado ou em cache
        this._slideCss = null;
        try {
            const res = await fetch('style.css');
            this._slideCss = await res.text();
        } catch (_) {
            this._slideCss = '';
        }
    }

    _updateSlidePreview() {
        const ta      = document.getElementById('edit-slide-content');
        const clsEl   = document.getElementById('edit-slide-classes');
        const frame   = document.getElementById('slide-preview-frame');
        const dot     = document.getElementById('preview-status');
        if (!frame || !ta) return;
        if (this._slideCss === null) return; // css ainda carregando

        if (dot) dot.classList.add('updating');
        clearTimeout(this._previewTimer);
        this._previewTimer = setTimeout(() => {
            const content = ta.value || '';
            const cls     = (clsEl?.value || '').trim();
            const srcdoc  = `<!DOCTYPE html>
<html lang="pt-BR"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<script src="https://cdn.tailwindcss.com"><\/script>
<style>${this._slideCss}
html,body{margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:#fff;}
.slide{position:relative!important;display:flex!important;opacity:1!important;transform:none!important;
  top:auto!important;left:auto!important;width:100%!important;height:100vh!important;min-height:unset!important;animation:none!important;}
.animated-item{opacity:1!important;animation:none!important;}
</style>
</head><body>
<section class="slide${cls ? ' ' + cls : ''}">${content}</section>
</body></html>`;
            frame.srcdoc = srcdoc;
            if (dot) setTimeout(() => dot.classList.remove('updating'), 350);
        }, 280);
    }

    /* ── Formatar / auto-indentar o HTML no textarea ── */
    _formatSlideHtml() {
        const ta = document.getElementById('edit-slide-content');
        if (!ta || !ta.value.trim()) return;
        ta.value = this._beautifyHtml(ta.value);
        ta.scrollTop = 0;
        this._updateSlidePreview();
    }

    _beautifyHtml(html) {
        const VOID = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
        let indent = 0;
        const out  = [];
        // Normaliza quebras entre tags e remove linhas vazias
        html = html.replace(/([^\s])(<)/g, '$1\n$2')
                   .replace(/>([^\s])/g, '>\n$1')
                   .replace(/\n{3,}/g, '\n')
                   .trim();
        for (const rawLine of html.split('\n')) {
            const line = rawLine.trim();
            if (!line) continue;
            const isClose  = /^<\//.test(line);
            const tagMatch = line.match(/^<([a-zA-Z0-9-]+)/);
            const tag      = tagMatch?.[1]?.toLowerCase();
            const isVoid   = tag && VOID.has(tag);
            const isSelf   = /\/>$/.test(line);
            if (isClose) indent = Math.max(0, indent - 1);
            out.push('    '.repeat(indent) + line);
            if (!isClose && !isVoid && !isSelf && tagMatch) {
                // Apenas sobe indent se a tag não fecha na mesma linha
                if (!line.includes(`</${tag}>`)) indent++;
            }
        }
        return out.join('\n');
    }

    /* ── Inserir snippet no cursor ── */
    _insertSnippet(key) {
        const ta = document.getElementById('edit-slide-content');
        if (!ta) return;
        const snips = {
            kicker: '<div class="animated-item section-kicker mb-3">Tópico</div>',
            title:  '<h2 class="animated-item section-title text-gray-800 mb-6">Título do Slide</h2>',
            lead:   '<p class="animated-item delay-1 section-lead">Mensagem de destaque.</p>',
            'card-success': `<div class="animated-item card card--success">\n    <div class="card-title">Título</div>\n    <p class="text-gray-700">Conteúdo do card.</p>\n</div>`,
            'card-danger':  `<div class="animated-item card card--danger">\n    <div class="card-title">Atenção</div>\n    <p class="text-gray-700">Conteúdo do card.</p>\n</div>`,
            'card-warning': `<div class="animated-item card card--warning">\n    <div class="card-title">Aviso</div>\n    <p class="text-gray-700">Conteúdo do alerta.</p>\n</div>`,
            list:  `<ul class="card-list text-gray-700">\n    <li><span>•</span><span>Item 1</span></li>\n    <li><span>•</span><span>Item 2</span></li>\n    <li><span>•</span><span>Item 3</span></li>\n</ul>`,
            icon:  `<div class="icon-pill icon-pill--emerald mx-auto mb-3">\n    <img class="icon-img sm" src="https://raw.githubusercontent.com/coltongriffith/fluenticons/main/static/icons/fluent/ic_fluent_shield_24_filled.svg" alt="">\n</div>`,
        };
        const snip = snips[key];
        if (!snip) return;
        const s = ta.selectionStart, e = ta.selectionEnd;
        ta.value = ta.value.slice(0, s) + snip + ta.value.slice(e);
        ta.selectionStart = ta.selectionEnd = s + snip.length;
        ta.focus();
        this._updateSlidePreview();
    }

    /* ── Template de slide (legado, mantido) ── */
    _slideTemplate() {
        return this._getTemplates()[1].html;
    }

    /* ================================================================
       EXPORTAÇÃO: PDF e PPTX
       ================================================================ */

    /** Carrega uma biblioteca CDN de forma lazy (retorna Promise). */
    _loadScript(url) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${url}"]`)) { resolve(); return; }
            const s = document.createElement('script');
            s.src = url;
            s.onload  = resolve;
            s.onerror = () => reject(new Error('Falha ao carregar: ' + url));
            document.head.appendChild(s);
        });
    }

    _showExportProgress(title, msg, pct = 0) {
        document.getElementById('export-progress-title').textContent = title;
        document.getElementById('export-progress-msg').textContent   = msg;
        document.getElementById('export-progress-bar').style.width   = pct + '%';
        document.getElementById('modal-export-progress')?.classList.remove('hidden');
    }
    _updateExportProgress(msg, pct) {
        if (document.getElementById('export-progress-msg'))
            document.getElementById('export-progress-msg').textContent = msg;
        if (document.getElementById('export-progress-bar'))
            document.getElementById('export-progress-bar').style.width = pct + '%';
    }
    _hideExportProgress() {
        document.getElementById('modal-export-progress')?.classList.add('hidden');
    }

    /** Renderiza cada slide em um div oculto e captura como PNG via html2canvas. */
    async _renderSlidesToImages(slides, onProgress) {
        const W = 1280, H = 720;

        // Criar contêiner de renderização off-screen
        const wrap = document.createElement('div');
        wrap.style.cssText = `position:fixed;left:-${W + 40}px;top:0;width:${W}px;height:${H}px;overflow:hidden;z-index:-9999;pointer-events:none;`;
        document.body.appendChild(wrap);

        const images = [];
        try {
            for (let i = 0; i < slides.length; i++) {
                const slide = slides[i];
                const cls   = (slide.slideClasses || '').trim();
                wrap.innerHTML = `
                    <section class="slide active${cls ? ' ' + cls : ''}" style="
                        position:absolute!important;inset:0!important;display:flex!important;
                        opacity:1!important;width:${W}px!important;height:${H}px!important;
                        animation:none!important;transition:none!important;">
                        ${slide.content || ''}
                    </section>`;

                // Aguarda imagens externas carregarem
                await Promise.allSettled(
                    [...wrap.querySelectorAll('img')].map(img =>
                        img.complete ? Promise.resolve() :
                        new Promise(r => { img.onload = img.onerror = r; })
                    )
                );
                await new Promise(r => setTimeout(r, 120)); // reflow extra

                const canvas = await html2canvas(wrap, {
                    width: W, height: H, x: 0, y: 0,
                    useCORS: true, allowTaint: true,
                    logging: false, scale: 1,
                    backgroundColor: '#ffffff'
                });
                images.push(canvas.toDataURL('image/jpeg', 0.93)); // JPEG menor
                if (onProgress) onProgress(i + 1, slides.length);
            }
        } finally {
            document.body.removeChild(wrap);
        }
        return images;
    }

    async _downloadPresentation(pptId, title, format) {
        const svc = window.FirebaseService;
        const label = format === 'pdf' ? 'PDF' : 'PPTX';
        this._showExportProgress(`Gerando ${label}\u2026`, 'Carregando slides do banco\u2026', 5);

        try {
            // 1. Buscar slides
            const slides = await svc.Slides.list(pptId);
            if (!slides.length) {
                this._hideExportProgress();
                alert('Esta apresentação não tem slides.');
                return;
            }

            // 2. Carregar html2canvas
            this._updateExportProgress('Carregando motor de renderização\u2026', 10);
            if (typeof html2canvas === 'undefined') {
                await this._loadScript('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js');
            }

            // 3. Carregar biblioteca do formato
            if (format === 'pdf') {
                this._updateExportProgress('Carregando jsPDF\u2026', 15);
                if (!window.jspdf) {
                    await this._loadScript('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js');
                }
            } else {
                this._updateExportProgress('Carregando PptxGenJS\u2026', 15);
                if (typeof PptxGenJS === 'undefined') {
                    await this._loadScript('https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js');
                }
            }

            // 4. Renderizar slides
            this._updateExportProgress('Renderizando slides\u2026', 20);
            const images = await this._renderSlidesToImages(slides, (done, total) => {
                const pct = 20 + Math.round((done / total) * 65);
                this._updateExportProgress(`Slide ${done} de ${total}\u2026`, pct);
            });

            // 5. Gerar arquivo
            this._updateExportProgress(`Montando ${label}\u2026`, 88);
            const safeTitle = title.replace(/[\\/:*?"<>|]/g, '_');

            if (format === 'pdf') {
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF({
                    orientation: 'landscape',
                    unit: 'px',
                    format: [1280, 720],
                    compress: true
                });
                images.forEach((img, i) => {
                    if (i > 0) pdf.addPage([1280, 720], 'landscape');
                    pdf.addImage(img, 'JPEG', 0, 0, 1280, 720);
                });
                pdf.save(`${safeTitle}.pdf`);
            } else {
                const pptx = new PptxGenJS();
                pptx.layout = 'LAYOUT_16x9';
                pptx.title   = title;
                for (const img of images) {
                    const sl = pptx.addSlide();
                    sl.addImage({ data: img, x: 0, y: 0, w: '100%', h: '100%' });
                }
                await pptx.writeFile({ fileName: safeTitle });
            }

            this._updateExportProgress(`${label} gerado com sucesso!`, 100);
            setTimeout(() => this._hideExportProgress(), 1000);

        } catch (err) {
            this._hideExportProgress();
            console.error('[Export]', err);
            alert(`Erro ao gerar ${label}: ${err.message}`);
        }
    }

    /* ── Roteiro — gera texto, abre modal e copia ── */
    async _openRoteiro(pptId, title) {
        const svc = window.FirebaseService;
        if (!svc) return alert('Firebase não conectado.');

        const preEl     = document.getElementById('roteiro-content');
        const statusEl  = document.getElementById('roteiro-status');
        if (!preEl) return;

        // Abrir modal imediatamente com loading
        preEl.textContent = '⏳ Gerando roteiro…';
        if (statusEl) statusEl.textContent = '';
        this._openModal('modal-roteiro');

        try {
            const content = await this._buildRoteiroText(pptId, title);
            preEl.textContent = content;
            this._roteiroText = content;
            this._roteiroTitle = title;

            // Auto-copy
            await this._copyToClipboard(content);
            if (statusEl) {
                statusEl.textContent = '✅ Copiado para a área de transferência!';
                setTimeout(() => { if (statusEl) statusEl.textContent = ''; }, 4000);
            }
        } catch (err) {
            preEl.textContent = `Erro: ${err.message}`;
            console.error('[Roteiro]', err);
        }
    }

    /** Gera o texto completo do roteiro */
    async _buildRoteiroText(pptId, title) {
        const svc = window.FirebaseService;
        const ppt = await svc.Presentations.get(pptId);
        const slides = await svc.Slides.list(pptId);
        if (!slides.length) throw new Error('Esta apresentação não tem slides.');

        const WORDS_PER_MIN = 150;
        const lines = [];
        const sep = '═'.repeat(60);
        const sepLight = '─'.repeat(60);

        lines.push(sep);
        lines.push(`  ROTEIRO DE APRESENTAÇÃO`);
        lines.push(sep);
        lines.push('');
        lines.push(`  Título:  ${ppt?.title || title}`);
        if (ppt?.author) lines.push(`  Autor:   ${ppt.author}`);
        if (ppt?.brand)  lines.push(`  Tema:    ${ppt.brand}`);
        if (ppt?.description) lines.push(`  Resumo:  ${ppt.description}`);
        lines.push(`  Slides:  ${slides.length}`);
        lines.push(`  Gerado:  ${new Date().toLocaleString('pt-BR')}`);
        lines.push('');
        lines.push(sep);
        lines.push('');

        let totalWords = 0;

        slides.forEach((slide, i) => {
            const num = i + 1;
            const parser = new DOMParser();
            const doc = parser.parseFromString(slide.content || '', 'text/html');
            const slideTitle = slide.title || `Slide ${num}`;
            const sections = [];

            const walk = (root) => {
                for (const el of root.children) {
                    const tag = el.tagName?.toLowerCase();
                    if (['img', 'svg', 'script', 'style', 'canvas'].includes(tag)) continue;

                    if (/^h[1-6]$/.test(tag) || el.classList?.contains('section-title') || el.classList?.contains('section-kicker')) {
                        const txt = el.textContent?.trim();
                        if (txt) sections.push({ type: 'heading', text: txt });
                        continue;
                    }
                    if (tag === 'ul' || tag === 'ol') {
                        const items = [...el.querySelectorAll('li')].map(li => li.textContent?.trim()).filter(Boolean);
                        if (items.length) sections.push({ type: 'list', items });
                        continue;
                    }
                    if (el.classList?.contains('info-card') || el.classList?.contains('signal-card') || el.classList?.contains('warn-card') || el.classList?.contains('card')) {
                        const txt = el.textContent?.trim();
                        if (txt) sections.push({ type: 'card', text: txt });
                        continue;
                    }
                    const txt = el.textContent?.trim();
                    if (txt && txt.length > 1) {
                        if (el.children.length > 1) { walk(el); } else { sections.push({ type: 'paragraph', text: txt }); }
                    } else if (el.children.length) {
                        walk(el);
                    }
                }
            };
            walk(doc.body);

            const slideText = sections.map(s => s.type === 'list' ? s.items.join(' ') : s.text || '').join(' ');
            const wordCount = slideText.split(/\s+/).filter(w => w.length > 0).length;
            totalWords += wordCount;
            const estMin = Math.max(0.5, wordCount / WORDS_PER_MIN);
            const estLabel = estMin < 1 ? `~${Math.round(estMin * 60)}s` : `~${estMin.toFixed(1)} min`;

            lines.push(`┌${'─'.repeat(58)}┐`);
            lines.push(`│  SLIDE ${String(num).padStart(2, '0')} — ${slideTitle.substring(0, 44).padEnd(44)}│`);
            lines.push(`│  Tempo estimado: ${estLabel.padEnd(39)}│`);
            lines.push(`└${'─'.repeat(58)}┘`);
            lines.push('');

            if (!sections.length) {
                lines.push('  (Slide sem conteúdo textual)');
            } else {
                sections.forEach(sec => {
                    switch (sec.type) {
                        case 'heading':  lines.push(`  ▸ ${sec.text}`); break;
                        case 'list':     sec.items.forEach(item => lines.push(`    • ${item}`)); break;
                        case 'card':     lines.push(`    ┆ ${sec.text}`); break;
                        case 'paragraph': default:
                            this._wordWrap(sec.text, 70).forEach(l => lines.push(`  ${l}`)); break;
                    }
                    lines.push('');
                });
            }
            lines.push(sepLight);
            lines.push('');
        });

        const totalMin = totalWords / WORDS_PER_MIN;
        const totalLabel = totalMin < 1 ? `${Math.round(totalMin * 60)} segundos` : `${Math.round(totalMin)} minutos`;

        lines.push('');
        lines.push(sep);
        lines.push(`  RESUMO DO ROTEIRO`);
        lines.push(sep);
        lines.push(`  Total de slides:        ${slides.length}`);
        lines.push(`  Total de palavras:      ${totalWords}`);
        lines.push(`  Tempo estimado (fala):  ${totalLabel}`);
        lines.push(`  Velocidade média:       ${WORDS_PER_MIN} palavras/min`);
        lines.push(sep);

        return lines.join('\n');
    }

    /** Copia texto para clipboard com fallback */
    async _copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            // Fallback para contextos sem HTTPS
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.cssText = 'position:fixed;opacity:0;';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
        }
    }

    /** Download do roteiro como .txt a partir do modal */
    _downloadRoteiroFile() {
        const text = this._roteiroText;
        if (!text) return;
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(this._roteiroTitle || 'Roteiro').replace(/[\\/:*?"<>|]/g, '_')} — Roteiro.txt`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 200);
    }

    /** Quebra texto em linhas de até maxLen caracteres */
    _wordWrap(text, maxLen = 70) {
        const words = text.split(/\s+/);
        const lines = [];
        let current = '';
        for (const w of words) {
            if (current.length + w.length + 1 > maxLen) {
                lines.push(current);
                current = w;
            } else {
                current = current ? current + ' ' + w : w;
            }
        }
        if (current) lines.push(current);
        return lines;
    }

    /* ── Utilitários ── */
    _esc(str) {
        return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }
    _showErr(el, msg) {
        if (!el) return;
        el.textContent = msg;
        el.style.color = '';
        el.style.background = '';
        el.style.border = '';
        el.classList.remove('hidden');
    }
    _showSuccess(el, msg) {
        if (!el) return;
        el.textContent = msg;
        el.style.color = '#166534';
        el.style.background = '#f0fdf4';
        el.style.border = '1px solid #bbf7d0';
        el.classList.remove('hidden');
        setTimeout(() => el.classList.add('hidden'), 3000);
    }
}

