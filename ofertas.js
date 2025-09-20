/**
 * @file ofertas.js
 * @description Carga y muestra los productos destacados en la página principal.
 * @version 3.0.0
 * @summary Actualizado para usar el sistema de proxy Base64, igual que el catálogo.
 */
document.addEventListener('DOMContentLoaded', () => {
    
    const API_URL = 'https://script.google.com/macros/s/AKfycbzAnNQGAMIqcHRew3NcrgKrMOirPuWwB5lmv8eYCJiTMnGe0E0tp62S86KPC2uPhBlFJA/exec';
    const featuredGrid = document.getElementById('featured-product-grid');
    
    if (!featuredGrid) return;

    // --- FUNCIONES CLAVE PARA MANEJAR IMÁGENES (REUTILIZADAS) ---

    function getFileIdFromUrl(url) {
        if (!url || typeof url !== 'string') return null;
        const driveRegex = /drive\.google\.com\/(?:file\/d\/|uc\?.*id=)([a-zA-Z0-9_-]+)/;
        const match = url.match(driveRegex);
        return match && match[1] ? match[1] : null;
    }

    async function loadDriveImage(imgElement, fileId) {
        if (!fileId) return;
        try {
            const response = await fetch(`${API_URL}?action=getImageBase64&id=${fileId}`);
            if (!response.ok) return;
            const data = await response.json();
            if (data.imageData && data.mimeType) {
                imgElement.src = `data:${data.mimeType};base64,${data.imageData}`;
            }
        } catch (error) {
            console.error(`Error cargando imagen de oferta ${fileId}:`, error);
        }
    }

    // --- LÓGICA PRINCIPAL DE LA SECCIÓN DE OFERTAS ---

    async function initializeFeaturedSection() {
        try {
            const products = await fetchProducts();
            const allProducts = mapProductData(products);
            const featuredProducts = allProducts.filter(p => p.isFeatured);
            renderFeaturedProducts(featuredProducts);
        } catch (error) {
            console.error('Error al cargar productos destacados:', error);
            featuredGrid.innerHTML = `<p class="catalog-message">No se pudieron cargar las ofertas.</p>`;
        }
    }

    async function fetchProducts() {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`Error de red: ${response.status}`);
        return response.json();
    }

    function mapProductData(rawData) {
        return rawData.map(item => ({
            id: item.id,
            name: item.nombre || 'Producto',
            brand: item.marca || 'Sin Marca',
            price: parseFloat(item.precio) || 0,
            salePrice: item.oferta ? parseFloat(item.oferta) : null,
            imageId: getFileIdFromUrl(item.image), // CAMBIO: Guardamos solo el ID.
            stock: parseInt(item.stock, 10) || 0,
            isOnSale: item.oferta && parseFloat(item.oferta) < parseFloat(item.precio),
            isFeatured: item.grillaprincipal === true,
        }));
    }

    function renderFeaturedProducts(products) {
        featuredGrid.innerHTML = '';
        if (products.length === 0) {
            featuredGrid.innerHTML = `<p class="catalog-message">¡Pronto tendremos nuevas ofertas!</p>`;
            return;
        }
        const fragment = document.createDocumentFragment();
        products.forEach(product => {
            const cardLink = createProductCardLink(product);
            cardLink.classList.add('animate-on-scroll');
            fragment.appendChild(cardLink);

            // Carga asíncrona de la imagen
            const imgElement = cardLink.querySelector('img');
            loadDriveImage(imgElement, product.imageId);
        });
        featuredGrid.appendChild(fragment);
        
        if (window.setupScrollAnimations) {
            window.setupScrollAnimations();
        }
    }

    function createProductCardLink(product) {
        const cardLink = document.createElement('a');
        cardLink.href = product.stock > 0 ? `producto.html?id=${product.id}` : '#';
        cardLink.className = 'product-card-link';
        if (product.stock <= 0) cardLink.classList.add('out-of-stock');
        
        const formatPrice = (p) => p.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 });
        const saleBadgeHTML = product.isOnSale ? `<span class="sale-badge">OFERTA</span>` : '';
        const priceHTML = product.isOnSale
            ? `<span class="original-price">${formatPrice(product.price)}</span><span class="sale-price">${formatPrice(product.salePrice)}</span>`
            : `<span class="sale-price">${formatPrice(product.price)}</span>`;

        let stockHTML = '';
        if (product.stock > 5) {
            stockHTML = `<div class="product-stock-status stock-available"><i class="fa-solid fa-check"></i> En Stock</div>`;
        } else if (product.stock > 0) {
            stockHTML = `<div class="product-stock-status stock-low"><i class="fa-solid fa-bolt"></i> ¡Últimas ${product.stock} u.!</div>`;
        } else {
            stockHTML = `<div class="product-stock-status stock-out"><i class="fa-solid fa-xmark"></i> Agotado</div>`;
        }
        
        // La imagen se deja con src vacío para que la cargue la función asíncrona.
        cardLink.innerHTML = `
            <div class="product-card">
                <div class="product-image-sale">
                    <img src="" alt="${product.name}">
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
            </div>`;
        return cardLink;
    }

    initializeFeaturedSection();
});
