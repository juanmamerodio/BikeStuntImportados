/**
 * @file ofertas.js
 * @description Carga y muestra dinámicamente los productos destacados en la página principal.
 * @version 2.1.0
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- CONFIGURACIÓN ---
    const API_URL = 'https://script.google.com/macros/s/AKfycby7Iwe8Y86-sVMy5PNGYhm1fcp4qgJ89VzUWrODes57i-wJCeqXswMn5KYAdRFZMhSPFA/exec'; // Reemplaza con tu URL real
    const placeholderImage = 'https://placehold.co/400x400/f0f0f0/333?text=BSI';

    // --- ELEMENTOS DEL DOM ---
    const featuredGrid = document.getElementById('featured-product-grid');
    
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
     * AHORA INCLUYE ID, MARCA Y STOCK.
     */
    function mapProductData(rawData) {
        return rawData.map(item => ({
            id: item.id,
            name: item.nombre || 'Producto',
            brand: item.marca || 'Sin Marca',
            price: parseFloat(item.precio) || 0,
            salePrice: item.oferta ? parseFloat(item.oferta) : null,
            imageUrl: item.image || placeholderImage,
            stock: parseInt(item.stock, 10) || 0, // <-- AÑADIDO
            isOnSale: item.oferta && parseFloat(item.oferta) < parseFloat(item.precio),
            isFeatured: item.grillaprincipal === true || String(item.grillaprincipal).toUpperCase() === 'TRUE',
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
            const cardLink = createProductCardLink(product);
            cardLink.classList.add('animate-on-scroll');
            fragment.appendChild(cardLink);
        });
        featuredGrid.appendChild(fragment);
        
        if (window.setupScrollAnimations) {
            window.setupScrollAnimations();
        }
    }

    /**
     * Crea el elemento HTML <a> que envuelve la tarjeta de producto.
     * AHORA INCLUYE LÓGICA DE STOCK.
     */
    function createProductCardLink(product) {
        const cardLink = document.createElement('a');
        // El enlace se desactiva si no hay stock
        cardLink.href = product.stock > 0 ? `producto.html?id=${product.id}` : '#';
        cardLink.className = 'product-card-link';
        // Se añade una clase para aplicar estilos a productos agotados
        if (product.stock <= 0) {
            cardLink.classList.add('out-of-stock');
        }

        const formatPrice = (price) => price.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 });
        
        const saleBadgeHTML = product.isOnSale ? `<span class="sale-badge">OFERTA</span>` : '';

        const priceHTML = product.isOnSale
            ? `<span class="original-price">${formatPrice(product.price)}</span><span class="sale-price">${formatPrice(product.salePrice)}</span>`
            : `<span class="sale-price">${formatPrice(product.price)}</span>`;

        // --- LÓGICA DE STOCK VISUAL ---
        let stockHTML = '';
        if (product.stock > 5) {
            stockHTML = `<div class="product-stock-status stock-available"><i class="fa-solid fa-check"></i> En Stock</div>`;
        } else if (product.stock > 0) {
            stockHTML = `<div class="product-stock-status stock-low"><i class="fa-solid fa-bolt"></i> ¡Últimas ${product.stock} u.!</div>`;
        } else {
            stockHTML = `<div class="product-stock-status stock-out"><i class="fa-solid fa-xmark"></i> Agotado</div>`;
        }
        // --- FIN LÓGICA DE STOCK ---

        cardLink.innerHTML = `
            <div class="product-card">
                <div class="product-image-sale">
                    <img src="${product.imageUrl}" alt="${product.name}" onerror="this.onerror=null;this.src='${placeholderImage}';">
                    ${saleBadgeHTML}
                </div>
                <div class="product-info-sale">
                    <span class="product-brand-tag">${product.brand}</span>
                    <h3>${product.name}</h3>
                    
                    <div class="product-pricing">
                        ${priceHTML}
                    </div>
                    ${stockHTML} 
                </div>
            </div>
        `;
        return cardLink;
    }

    initializeFeaturedSection();
});

