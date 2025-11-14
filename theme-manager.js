// ============================================
// GreenTrack Multi-Theme Manager
// ============================================

class ThemeManager {
    constructor() {
        this.themes = [
            { id: 'default', name: '🌌 Default Purple', color: '#8b5cf6' },
            { id: 'ocean', name: '🌊 Ocean Blue', color: '#2196f3' },
            { id: 'forest', name: '🌲 Forest Green', color: '#4caf50' },
            { id: 'sunset', name: '🌅 Sunset Orange', color: '#ff9800' },
            { id: 'purple', name: '🌙 Purple Night', color: '#9c27b0' },
            { id: 'rose', name: '🌹 Rose Pink', color: '#e91e63' },
            { id: 'teal', name: '💎 Emerald Teal', color: '#009688' }
        ];
        
        this.currentTheme = this.loadTheme();
        
        this.init();
    }
    
    init() {
        this.applyTheme(this.currentTheme, false);
        this.createThemeSelector();
        this.setupEventListeners();
        this.showThemeHint();
    }
    
    showThemeHint() {
        // Only show hint on first visit
        const hasSeenHint = localStorage.getItem('greentrack-theme-hint-seen');
        if (hasSeenHint) return;
        
        setTimeout(() => {
            const themePaletteBtn = document.getElementById('themePaletteBtn');
            if (!themePaletteBtn) return;
            
            // Create hint tooltip
            const hint = document.createElement('div');
            hint.className = 'theme-hint';
            hint.innerHTML = `
                <div class="theme-hint-content">
                    🎨 Click here to change themes!
                    <button class="theme-hint-close" aria-label="Close hint">×</button>
                </div>
            `;
            
            themePaletteBtn.parentElement.appendChild(hint);
            
            // Position hint
            const btnRect = themePaletteBtn.getBoundingClientRect();
            hint.style.position = 'absolute';
            hint.style.top = 'calc(100% + 0.5rem)';
            hint.style.right = '0';
            
            // Close hint on click
            hint.querySelector('.theme-hint-close').addEventListener('click', () => {
                hint.remove();
                localStorage.setItem('greentrack-theme-hint-seen', 'true');
            });
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                if (hint.parentElement) {
                    hint.style.opacity = '0';
                    setTimeout(() => hint.remove(), 300);
                    localStorage.setItem('greentrack-theme-hint-seen', 'true');
                }
            }, 5000);
        }, 1000);
    }
    
    loadTheme() {
        return localStorage.getItem('greentrack-theme') || 'default';
    }
    
    saveTheme(themeId) {
        localStorage.setItem('greentrack-theme', themeId);
    }
    
    applyTheme(themeId, animate = true) {
        const html = document.documentElement;
        const body = document.body;
        
        // Add transition animation
        if (animate && body) {
            body.classList.add('theme-changing');
            setTimeout(() => body.classList.remove('theme-changing'), 500);
        }
        
        // Remove all theme classes from both html and body
        [html, body].forEach(element => {
            if (!element) return;
            element.className = element.className.split(' ')
                .filter(c => !c.startsWith('theme-'))
                .join(' ');
        });
        
        // Apply new theme to both html and body (always dark mode)
        const applyClasses = (element) => {
            if (!element) return;
            if (themeId !== 'default') {
                element.classList.add(`theme-${themeId}`);
            }
        };
        
        applyClasses(html);
        applyClasses(body);
        
        this.currentTheme = themeId;
        
        this.saveTheme(themeId);
        
        // Update UI elements
        this.updateThemeSelectorValue();
        
        // Dispatch custom event for other scripts to react
        document.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme: themeId }
        }));
    }
    
    updateThemeSelectorValue() {
        const selector = document.getElementById('themeSelector');
        if (selector) {
            selector.value = this.currentTheme;
        }
    }
    
    createThemeSelector() {
        const navActions = document.querySelector('.nav-actions');
        if (!navActions) return;
        
        // Create theme palette button
        const themePaletteBtn = document.createElement('button');
        themePaletteBtn.id = 'themePaletteBtn';
        themePaletteBtn.className = 'icon-button';
        themePaletteBtn.setAttribute('aria-label', 'Choose color theme');
        themePaletteBtn.setAttribute('title', 'Choose Theme');
        themePaletteBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/>
                <circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
            </svg>
        `;
        
        // Create dropdown menu
        const themeDropdown = document.createElement('div');
        themeDropdown.id = 'themeDropdown';
        themeDropdown.className = 'theme-dropdown-menu';
        themeDropdown.style.display = 'none';
        
        // Add theme options
        this.themes.forEach(theme => {
            const themeOption = document.createElement('div');
            themeOption.className = 'theme-option';
            if (theme.id === this.currentTheme) {
                themeOption.classList.add('active');
            }
            themeOption.innerHTML = `
                <div class="theme-color-dot" style="background: ${theme.color}"></div>
                <span class="theme-option-name">${theme.name}</span>
                <svg class="theme-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            `;
            themeOption.addEventListener('click', () => {
                this.applyTheme(theme.id);
                this.showToast(`${theme.name} applied!`, 'success');
                
                // Update active state
                themeDropdown.querySelectorAll('.theme-option').forEach(opt => opt.classList.remove('active'));
                themeOption.classList.add('active');
                
                // Close dropdown
                themeDropdown.style.display = 'none';
            });
            themeDropdown.appendChild(themeOption);
        });
        
        // Toggle dropdown on button click
        themePaletteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = themeDropdown.style.display === 'block';
            themeDropdown.style.display = isVisible ? 'none' : 'block';
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!themePaletteBtn.contains(e.target) && !themeDropdown.contains(e.target)) {
                themeDropdown.style.display = 'none';
            }
        });
        
        // Append theme controls to nav actions
        navActions.appendChild(themePaletteBtn);
        navActions.appendChild(themeDropdown);
    }
    
    setupEventListeners() {
        // Light/dark mode removed - using only color themes now
    }
    
    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer') || this.createToastContainer();
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <svg class="toast-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                ${type === 'success' ? 
                    '<polyline points="20 6 9 17 4 12"></polyline>' : 
                    '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>'}
            </svg>
            <span class="toast-message">${message}</span>
        `;
        
        toastContainer.appendChild(toast);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
        return container;
    }
    
    // Get current theme info
    getCurrentTheme() {
        return this.themes.find(t => t.id === this.currentTheme);
    }
    
    // Check if dark mode
}


// Apply theme immediately (before DOM loads) to prevent flash
(function applyThemeImmediately() {
    const savedTheme = localStorage.getItem('greentrack-theme') || 'default';
    
    // Apply theme class (always dark mode)
    if (savedTheme !== 'default') {
        document.documentElement.classList.add(`theme-${savedTheme}`);
    }
})();

// Initialize theme manager when DOM is ready
let themeManager;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        themeManager = new ThemeManager();
    });
} else {
    themeManager = new ThemeManager();
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
}
