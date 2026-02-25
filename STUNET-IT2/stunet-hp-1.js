// STUNET Home Page - Interactive Features

document.addEventListener('DOMContentLoaded', () => {
    initializeScrollAnimations();
    initializeButtonInteractions();
    initializeNavigation();
    initializeProfileCards();
    initializeCompetitionCards();
});

/**
 * Initialize smooth scroll animations
 */
function initializeScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe elements for lazy animation
    document.querySelectorAll('.feature-card, .profile-card, .competition-card, .step-card').forEach(element => {
        element.style.opacity = '0';
        observer.observe(element);
    });
}

/**
 * Initialize button interactions
 */
function initializeButtonInteractions() {
    const buttons = document.querySelectorAll('[class*="btn-"]');

    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Add click feedback
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = '';
            }, 100);

            console.log('Button clicked:', this.textContent);
        });

        // Hover ripple effect
        button.addEventListener('mouseenter', function() {
            if (!this.classList.contains('btn-secondary')) {
                this.style.boxShadow = '0 12px 32px rgba(99, 102, 241, 0.4)';
            }
        });

        button.addEventListener('mouseleave', function() {
            this.style.boxShadow = '';
        });
    });
}

/**
 * Initialize navigation interactions
 */
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const href = this.getAttribute('href');
            const target = document.querySelector(href);
            
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Highlight active nav item on scroll
    window.addEventListener('scroll', updateActiveNavLink);
}

function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (scrollY >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
}

/**
 * Initialize profile card interactions
 */
function initializeProfileCards() {
    const profileCards = document.querySelectorAll('.profile-card');

    profileCards.forEach((card, index) => {
        card.addEventListener('mouseenter', function() {
            profileCards.forEach(c => c.style.opacity = '0.6');
            this.style.opacity = '1';
        });

        card.addEventListener('mouseleave', function() {
            profileCards.forEach(c => c.style.opacity = '1');
        });

        // View profile button
        const viewBtn = card.querySelector('.btn-small');
        viewBtn.addEventListener('click', () => {
            const profileName = card.querySelector('h4').textContent;
            showNotification(`Viewing ${profileName}'s profile...`);
        });
    });
}

/**
 * Initialize competition card interactions
 */
function initializeCompetitionCards() {
    const compCards = document.querySelectorAll('.competition-card');

    compCards.forEach(card => {
        const registerBtn = card.querySelector('.btn-primary');
        
        registerBtn.addEventListener('click', () => {
            const compName = card.querySelector('h3').textContent;
            showNotification(`Registered for ${compName}! 🎉`);
        });
    });
}

/**
 * Show notification
 */
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;

    document.body.appendChild(notification);

    // Add styles for notification if not present
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.innerHTML = `
            .notification {
                position: fixed;
                bottom: 30px;
                right: 30px;
                background: rgba(30, 41, 59, 0.95);
                border: 1px solid rgba(203, 213, 225, 0.1);
                border-radius: 8px;
                padding: 16px 20px;
                color: #ffffff;
                font-size: 14px;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
                animation: slideIn 0.3s ease-out;
                z-index: 9999;
                max-width: 400px;
            }

            .notification-content {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .notification-success {
                border-color: rgba(16, 185, 129, 0.3);
                background: rgba(16, 185, 129, 0.1);
            }

            .notification-success i {
                color: #10b981;
            }

            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateX(30px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }

            @media (max-width: 768px) {
                .notification {
                    bottom: 20px;
                    right: 20px;
                    left: 20px;
                    max-width: none;
                }
            }
        `;
        document.head.appendChild(style);
    }

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out forwards';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/**
 * Add slide out animation
 */
if (!document.querySelector('style[data-slide-out]')) {
    const style = document.createElement('style');
    style.setAttribute('data-slide-out', 'true');
    style.innerHTML = `
        @keyframes slideOut {
            to {
                opacity: 0;
                transform: translateX(30px);
            }
        }
    `;
    document.head.appendChild(style);
}

/**
 * Parallax effect for floating cards
 */
document.addEventListener('mousemove', (e) => {
    const floatingCards = document.querySelectorAll('.floating-card');
    
    floatingCards.forEach(card => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - window.innerWidth / 2) * 0.02;
        const y = (e.clientY - window.innerHeight / 2) * 0.02;
        
        card.style.transform = `translate(${x}px, ${y}px)`;
    });
});

/**
 * Search functionality
 */
const searchChip = document.querySelector('.search-chip input');
if (searchChip) {
    searchChip.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const profileCards = document.querySelectorAll('.profile-card');

        profileCards.forEach(card => {
            const name = card.querySelector('h4').textContent.toLowerCase();
            const role = card.querySelector('.role').textContent.toLowerCase();
            const skills = Array.from(card.querySelectorAll('.skill-tag'))
                .map(tag => tag.textContent.toLowerCase())
                .join(' ');

            if (name.includes(searchTerm) || role.includes(searchTerm) || skills.includes(searchTerm)) {
                card.style.display = '';
                card.style.opacity = '1';
            } else {
                card.style.opacity = '0.3';
                card.style.pointerEvents = 'none';
            }
        });
    });
}

/**
 * Filter chips functionality
 */
const filterChips = document.querySelectorAll('.filter-chip:not(.search-chip)');
filterChips.forEach(chip => {
    chip.addEventListener('click', function() {
        this.classList.toggle('active');
        const filterText = this.querySelector('span').textContent;
        console.log('Filter applied:', filterText);
    });
});

/**
 * Smooth scroll for anchor links
 */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href !== '#') {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});

/**
 * Add to window for external access
 */
window.STUNET = {
    showNotification,
    initializeScrollAnimations,
    initializeButtonInteractions,
    initializeNavigation
};

console.log('✨ STUNET Home Page loaded successfully!');