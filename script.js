/**
 * @file script.js
 * @description Lógicas globales para todo el sitio Bike Stunt Importados.
 * @version 2.0.0
 * @summary Ahora este script se encarga del efecto del header y de las animaciones de scroll.
 * Se debe enlazar en TODAS las páginas (index, catalogo, producto).
 */
document.addEventListener('DOMContentLoaded', () => {

    // --- Efecto de Header al hacer scroll ---
    const header = document.getElementById('header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

    /**
     * Configura la animación de elementos al hacer scroll.
     * Esta función es global para poder ser llamada desde otros scripts
     * cuando se añaden elementos dinámicamente.
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
