/**
 * @file producto.js
 * @description Carga dinámicamente el contenido de la página de detalle del producto.
 * @version 1.0.0
 */
document.addEventListener('DOMContentLoaded', () => {
    
    // --- CONFIGURACIÓN ---
    const API_URL = 'https://script.google.com/macros/s/AKfycby7Iwe8Y86-sVMy5PNGYhm1fcp4qgJ89VzUWrODes57i-wJCeqXswMn5KYAdRFZMhSPFA/exec'; // Reemplaza con tu URL real
    const placeholderImage = 'https://placehold.co/600x600/f0f0f0/333?text=BSI';

    // --- ELEMENTOS DEL DOM ---
    const pageLoader = document.getElementById('page-loader');
    const mainContent = document.getElementById('product-main-content');
    
    /**
     * Función principal que orquesta la carga de la página.
     */
    async function initializeProductPage() {
        const productId = getProductIdFromURL();
        if (!productId) {
            displayError('No se especificó un producto.');
            return;
        }

        try {
            const allProducts = await fetchProducts();
            const product = allProducts.find(p => p.id == productId);

            if (!product) {
                displayError('Producto no encontrado.');
                return;
            }

            const relatedProducts = getRelatedProducts(allProducts, product);

            // Una vez que tenemos los datos, poblamos la página
            populateProductDetails(product);
            populateRelatedProducts(relatedProducts);
            
            // Ocultamos el loader y mostramos el contenido
            pageLoader.classList.add('hidden');
            mainContent.classList.remove('hidden');

        } catch (error) {
            console.error('Error al inicializar la página:', error);
            displayError('No se pudo cargar la información del producto.');
        }
    }

    /**
     * Extrae el ID del producto de los parámetros de la URL.
     * @returns {string|null} El ID del producto o null si no se encuentra.
     */
    const getProductIdFromURL = () => new URLSearchParams(window.location.search).get('id');

    /**
     * Muestra un mensaje de error en lugar del contenido del producto.
     * @param {string} message - El mensaje de error a mostrar.
     */
    function displayError(message) {
        pageLoader.innerHTML = `<p class="catalog-message">${message}</p>`;
    }
    
    /**
     * Obtiene y procesa todos los productos de la API.
     */
    async function fetchProducts() {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`Error de red: ${response.status}`);
        const rawData = await response.json();
        return mapProductData(rawData);
    }
    
    /**
     * Mapea los datos crudos de la API a un formato de objeto consistente.
     */
    function mapProductData(rawData) {
        // Esta función puede ser compartida entre catalogo.js y producto.js en el futuro
        return rawData.map(item => ({
            id: item.id,
            name: item.nombre || 'Producto sin nombre',
            brand: item.marca || 'Sin marca',
            category: item.categoría || 'General',
            price: parseFloat(item.precio) || 0,
            salePrice: item.oferta ? parseFloat(item.oferta) : null,
            stock: parseInt(item.stock, 10) || 0,
            description: item.descripcion || 'Sin descripción disponible.',
            specs: { // Asumimos que las especificaciones vienen en columnas separadas
                Material: item.material,
                Peso: item.peso,
                Color: item.color,
            },
            // Asumimos que las imágenes vienen en columnas separadas y la primera es la principal
            imageUrls: [item.image, item.image2, item.image3, item.image4].filter(Boolean),
            isOnSale: item.oferta && parseFloat(item.oferta) < parseFloat(item.precio),
        }));
    }

    /**
     * Filtra y devuelve productos relacionados (misma categoría, diferente ID).
     */
    function getRelatedProducts(allProducts, currentProduct) {
        return allProducts
            .filter(p => p.category === currentProduct.category && p.id != currentProduct.id)
            .slice(0, 4); // Limita a 4 productos relacionados
    }
    
    /**
     * Rellena la página con los detalles del producto encontrado.
     * @param {object} product - El objeto del producto a mostrar.
     */
    function populateProductDetails(product) {
        document.title = `${product.name} - Bike Stunt Importados`;

        // Textos básicos
        document.getElementById('product-brand').textContent = product.brand;
        document.getElementById('product-name').textContent = product.name;
        document.getElementById('product-description-text').textContent = product.description;

        // Disponibilidad (Stock)
        const availabilityEl = document.getElementById('product-availability');
        if (product.stock > 0) {
            availabilityEl.className = 'availability available';
            availabilityEl.innerHTML = `<i class="fa-solid fa-check-circle"></i> Disponible`;
        } else {
            availabilityEl.className = 'availability unavailable';
            availabilityEl.innerHTML = `<i class="fa-solid fa-times-circle"></i> Agotado`;
        }

        // Precios
        const pricingEl = document.getElementById('product-pricing');
        const formatPrice = (price) => price.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 });
        pricingEl.innerHTML = product.isOnSale
            ? `<span class="original-price">${formatPrice(product.price)}</span><p class="product-price sale">${formatPrice(product.salePrice)}</p>`
            : `<p class="product-price">${formatPrice(product.price)}</p>`;

        // Galería de imágenes
        const mainImage = document.getElementById('main-product-image');
        mainImage.src = product.imageUrls[0] || placeholderImage;
        mainImage.alt = product.name;
        
        const thumbnailGallery = document.getElementById('thumbnail-gallery');
        thumbnailGallery.innerHTML = '';
        if (product.imageUrls.length > 1) {
            product.imageUrls.forEach((url, index) => {
                const thumb = document.createElement('div');
                thumb.className = 'thumbnail-item';
                if (index === 0) thumb.classList.add('active');
                thumb.innerHTML = `<img src="${url}" alt="Vista miniatura ${index + 1}">`;
                thumb.addEventListener('click', () => {
                    mainImage.src = url;
                    document.querySelector('.thumbnail-item.active').classList.remove('active');
                    thumb.classList.add('active');
                });
                thumbnailGallery.appendChild(thumb);
            });
        }
        
        // Especificaciones
        const specsList = document.getElementById('specs-list');
        specsList.innerHTML = '';
        Object.entries(product.specs).forEach(([key, value]) => {
            if (value) { // Solo muestra la especificación si tiene un valor
                const li = document.createElement('li');
                li.innerHTML = `<span>${key}</span><span>${value}</span>`;
                specsList.appendChild(li);
            }
        });
    }

    /**
     * Rellena la sección de productos relacionados.
     * @param {Array} relatedProducts - Array de objetos de productos relacionados.
     */
    function populateRelatedProducts(relatedProducts) {
        const grid = document.getElementById('related-products-grid');
        grid.innerHTML = '';
        if(relatedProducts.length === 0) {
            grid.innerHTML = `<p class="catalog-message">No hay otros productos en esta categoría.</p>`;
            return;
        }

        relatedProducts.forEach(product => {
            const card = createProductCard(product); // Reutilizamos la función de creación de tarjetas
            grid.appendChild(card);
        });
    }

    /**
     * Crea el HTML para una tarjeta de producto (versión simplificada para "relacionados").
     */
    function createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'catalog-product-card';
        const formatPrice = (price) => price.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 });
        const priceHTML = product.isOnSale ? `<p class="product-price sale">${formatPrice(product.salePrice)}</p>` : `<p class="product-price">${formatPrice(product.price)}</p>`;
        
        card.innerHTML = `
            <a href="producto.html?id=${product.id}" class="product-card-link">
                <div class="product-image-container">
                    ${product.isOnSale ? '<span class="sale-badge">OFERTA</span>' : ''}
                    <img src="${product.imageUrls[0] || placeholderImage}" alt="${product.name}">
                </div>
                <div class="product-info">
                    <span class="product-brand-tag">${product.brand}</span>
                    <h3 class="product-name">${product.name}</h3>
                    <div class="product-pricing">
                        ${priceHTML}
                    </div>
                </div>
            </a>`;
        return card;
    }


    // --- INICIO DE LA EJECUCIÓN ---
    initializeProductPage();
});
