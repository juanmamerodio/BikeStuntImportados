document.addEventListener('DOMContentLoaded', () => {

    // --- Efecto de Header al hacer scroll ---
    const header = document.getElementById('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    /**
     * Configura la animación de elementos al hacer scroll.
     * Hacemos esta función global (adjuntándola a 'window') para poder
     * llamarla desde otros scripts (como ofertas.js) cuando se añaden
     * nuevos elementos dinámicamente.
     */
    window.setupScrollAnimations = () => {
        const animatedElements = document.querySelectorAll('.animate-on-scroll:not(.is-visible)');

        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.2
        };

        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        animatedElements.forEach(element => {
            observer.observe(element);
        });
    };

    // Primera ejecución al cargar la página.
    window.setupScrollAnimations();

});