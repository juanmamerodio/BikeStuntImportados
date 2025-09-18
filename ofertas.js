/**
 * @file ofertas.js
 * @description Carga y muestra dinámicamente los productos destacados en la página principal.
 * @version 1.0.0
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- CONFIGURACIÓN ---
    // La misma URL de la API que usa el catálogo.
    const API_URL = 'https://script.google.com/macros/s/AKfycby7Iwe8Y86-sVMy5PNGYhm1fcp4qgJ89VzUWrODes57i-wJCeqXswMn5KYAdRFZMhSPFA/exec'; // Reemplaza con tu URL real
    const placeholderImage = 'https://placehold.co/400x400/f0f0f0/333?text=BSI';

    // --- ELEMENTOS DEL DOM ---
    const featuredGrid = document.getElementById('featured-product-grid');
    
    // Si no existe el contenedor en la página, no continuamos.
    if (!featuredGrid) {
        return;
    }

    /**
     * Orquesta la carga y renderización de productos destacados.
     */
    async function initializeFeaturedSection() {
        try {
            const products = await fetchProducts();
            const allProducts = mapProductData(products);
            // Filtramos solo los productos marcados con el checkpoint "grillaprincipal"
            const featuredProducts = allProducts.filter(p => p.isFeatured);
            
            renderFeaturedProducts(featuredProducts);

        } catch (error) {
            console.error('Error al cargar productos destacados:', error);
            featuredGrid.innerHTML = `<p class="catalog-message">No se pudieron cargar las ofertas en este momento.</p>`;
        }
    }

    /**
     * Obtiene los productos desde la API de Google Sheets.
     */
    async function fetchProducts() {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`Error de red: ${response.status}`);
        return response.json();
    }

    /**
     * Mapea los datos crudos a un formato de objeto limpio y consistente.
     */
    function mapProductData(rawData) {
        return rawData.map(item => ({
            name: item.nombre || 'Producto',
            price: parseFloat(item.precio) || 0,
            salePrice: item.oferta ? parseFloat(item.oferta) : null,
            imageUrl: item.image || placeholderImage,
            isOnSale: item.oferta && parseFloat(item.oferta) < parseFloat(item.precio),
            // Google Sheets devuelve 'TRUE' para casillas marcadas.
            isFeatured: item.grillaprincipal === true || item.grillaprincipal === 'TRUE',
        }));
    }

    /**
     * Renderiza las tarjetas de los productos destacados en el DOM.
     */
    function renderFeaturedProducts(products) {
        featuredGrid.innerHTML = ''; // Limpia el mensaje de "cargando"

        if (products.length === 0) {
            featuredGrid.innerHTML = `<p class="catalog-message">¡Pronto tendremos nuevas ofertas destacadas!</p>`;
            return;
        }

        const fragment = document.createDocumentFragment();
        products.forEach(product => {
            const card = createProductCard(product);
            // Reutilizamos la clase de animación para un efecto de entrada suave.
            card.classList.add('animate-on-scroll');
            fragment.appendChild(card);
        });
        featuredGrid.appendChild(fragment);
        
        // Es necesario reactivar el observer para que detecte los nuevos elementos.
        if (window.setupScrollAnimations) {
            window.setupScrollAnimations();
        }
    }

    /**
     * Crea el elemento HTML para una tarjeta de producto, reutilizando estilos.
     */
    function createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'product-card'; // Clase principal de la tarjeta

        const formatPrice = (price) => price.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 });
        
        const saleBadgeHTML = product.isOnSale ? `<span class="sale-badge">OFERTA</span>` : '';

        const priceHTML = product.isOnSale
            ? `<span class="original-price">${formatPrice(product.price)}</span><span class="sale-price">${formatPrice(product.salePrice)}</span>`
            : `<span class="sale-price">${formatPrice(product.price)}</span>`;

        card.innerHTML = `
            <div class="product-image-sale">
                <img src="${product.imageUrl}" alt="${product.name}" onerror="this.onerror=null;this.src='${placeholderImage}';">
                ${saleBadgeHTML}
            </div>
            <div class="product-info-sale">
                <h3>${product.name}</h3>
                <div class="product-pricing">
                    ${priceHTML}
                </div>
                <a href="catalogo.html" class="cta-button-sale">Ver en catálogo</a>
            </div>
        `;
        return card;
    }

    // --- Inicia el proceso ---
    initializeFeaturedSection();
});
