/**
 * @file catalogo.js
 * @description Lógica dinámica para el catálogo de productos.
 * @version 5.0.0
 * @summary Unificado para usar el sistema de proxy Base64 del Apps Script.
 * - Ahora extrae el ID de la URL de Drive y solicita la imagen de forma asíncrona.
 * - Incluye un efecto de carga suave para las imágenes.
 */
document.addEventListener('DOMContentLoaded', () => {
    
    const API_URL = 'https://script.google.com/macros/s/AKfycbzAnNQGAMIqcHRew3NcrgKrMOirPuWwB5lmv8eYCJiTMnGe0E0tp62S86KPC2uPhBlFJA/exec';
    
    const productGrid = document.getElementById('product-grid');
    const searchInput = document.getElementById('search-input');
    const categorySelect = document.getElementById('category-select');
    const noResultsMsg = document.getElementById('no-results');

    let allProducts = [];

    // --- FUNCIONES CLAVE PARA MANEJAR IMÁGENES ---

    /**
     * Extrae el ID de archivo de cualquier formato de URL de Google Drive.
     * @param {string} url - La URL compartida de Google Drive.
     * @returns {string|null} El ID del archivo o null si no se encuentra.
     */
    function getFileIdFromUrl(url) {
        if (!url || typeof url !== 'string') return null;
        const driveRegex = /drive\.google\.com\/(?:file\/d\/|uc\?.*id=)([a-zA-Z0-9_-]+)/;
        const match = url.match(driveRegex);
        return match && match[1] ? match[1] : null;
    }

    /**
     * Carga una imagen desde Google Drive a través del proxy de Apps Script.
     * @param {HTMLImageElement} imgElement - El elemento <img> donde se cargará la imagen.
     * @param {string} fileId - El ID del archivo de Drive.
     */
    async function loadDriveImage(imgElement, fileId) {
        if (!fileId) {
            // Si no hay ID, no se intenta cargar nada y el fondo CSS actúa como placeholder.
            return;
        }
        try {
            const response = await fetch(`${API_URL}?action=getImageBase64&id=${fileId}`);
            if (!response.ok) throw new Error(`Error de red al buscar imagen: ${response.status}`);
            const data = await response.json();

            if (data.imageData && data.mimeType) {
                imgElement.src = `data:${data.mimeType};base64,${data.imageData}`;
                // Efecto de fundido al cargar la imagen.
                imgElement.onload = () => imgElement.classList.add('loaded');
            } else {
                console.warn(`No se pudo cargar la imagen desde el script para el ID: ${fileId}`, data.message || '');
            }
        } catch (error) {
            console.error(`Error crítico cargando imagen ${fileId}:`, error);
        }
    }

    // --- LÓGICA PRINCIPAL DEL CATÁLOGO ---

    async function initializeCatalog() {
        try {
            const productsData = await fetchProducts();
            allProducts = mapProductData(productsData);
            populateCategoryFilter(allProducts);
            renderProducts(allProducts);
            setupEventListeners();
        } catch (error) {
            console.error('Error al inicializar el catálogo:', error);
            productGrid.innerHTML = `<p class="catalog-message"><strong>Error al cargar productos:</strong> ${error.message}</p>`;
        }
    }

    async function fetchProducts() {
        const response = await fetch(API_URL); // Llama sin 'action' para obtener todos los productos.
        if (!response.ok) throw new Error(`Error de red: ${response.status}`);
        const data = await response.json();
        if (data.error) throw new Error(data.message);
        if (!Array.isArray(data)) throw new Error("El formato de los datos recibidos es incorrecto.");
        return data;
    }

    function mapProductData(rawData) {
        return rawData.map(item => ({
            id: item.id || Date.now(),
            name: item.nombre || 'Producto sin nombre',
            brand: item.marca || 'Generica',
            category: item.categoria || 'General',
            price: parseFloat(item.precio) || 0,
            salePrice: item.oferta ? parseFloat(item.oferta) : null,
            imageId: getFileIdFromUrl(item.image), // CAMBIO: Guardamos solo el ID.
            stock: parseInt(item.stock, 10) || 0,
            isOnSale: item.oferta && parseFloat(item.oferta) < parseFloat(item.precio),
        }));
    }
    
    function populateCategoryFilter(products) {
        const categories = [...new Set(products.map(p => p.category))].sort();
        categorySelect.innerHTML = '<option value="todos">Todas las categorías</option>';
        categories.forEach(category => {
            if(category){
                const option = document.createElement('option');
                option.value = category.toLowerCase();
                option.textContent = category;
                categorySelect.appendChild(option);
            }
        });
    }

    function renderProducts(productsToDisplay) {
        productGrid.innerHTML = ''; 
        noResultsMsg.classList.toggle('hidden', productsToDisplay.length > 0);
        
        const fragment = document.createDocumentFragment();
        productsToDisplay.forEach(product => {
            const cardLink = createProductCardLink(product);
            fragment.appendChild(cardLink);
            
            // Llama a la carga asíncrona de la imagen después de crear la tarjeta.
            const imgElement = cardLink.querySelector('img');
            loadDriveImage(imgElement, product.imageId);
        });
        productGrid.appendChild(fragment);
    }

    function createProductCardLink(product) {
        const cardLink = document.createElement('a');
        cardLink.href = product.stock > 0 ? `producto.html?id=${product.id}` : '#';
        cardLink.className = 'catalog-product-card-link';
        if (product.stock <= 0) cardLink.classList.add('out-of-stock');
        
        const formatPrice = (p) => p.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 });
        const priceHTML = product.isOnSale ? `<span class="original-price">${formatPrice(product.price)}</span><p class="product-price sale">${formatPrice(product.salePrice)}</p>` : `<p class="product-price">${formatPrice(product.price)}</p>`;
        const saleBadgeHTML = product.isOnSale ? `<span class="sale-badge">OFERTA</span>` : '';

        let stockHTML = '';
        if (product.stock > 5) stockHTML = `<div class="product-stock-status stock-available"><i class="fa-solid fa-check"></i> En Stock</div>`;
        else if (product.stock > 0) stockHTML = `<div class="product-stock-status stock-low"><i class="fa-solid fa-bolt"></i> ¡Últimas unidades!</div>`;
        else stockHTML = `<div class="product-stock-status stock-out"><i class="fa-solid fa-xmark"></i> Agotado</div>`;

        cardLink.innerHTML = `
            <div class="catalog-product-card">
                <div class="product-image-container">
                    ${saleBadgeHTML}
                    <img src="" alt="${product.name}">
                </div>
                <div class="product-info">
                    <span class="product-brand-tag">${product.brand}</span>
                    <h3 class="product-name">${product.name}</h3>
                    ${stockHTML}
                    <div class="product-pricing">${priceHTML}</div>
                    <span class="view-product-btn">${product.stock > 0 ? 'Ver Detalles' : 'Agotado'}</span>
                </div>
            </div>`;
        return cardLink;
    }

    function setupEventListeners() {
        searchInput.addEventListener('input', () => debounce(handleFilterChange, 300)());
        categorySelect.addEventListener('change', handleFilterChange);
    }
    
    let debounceTimer;
    const debounce = (func, delay) => (...args) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => func.apply(this, args), delay);
    };

    function handleFilterChange() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const selectedCategory = categorySelect.value;
        let filteredProducts = allProducts;

        if (selectedCategory !== 'todos') {
            filteredProducts = filteredProducts.filter(p => p.category.toLowerCase() === selectedCategory);
        }
        if (searchTerm) {
            filteredProducts = filteredProducts.filter(p => 
                p.name.toLowerCase().includes(searchTerm) || 
                p.brand.toLowerCase().includes(searchTerm)
            );
        }
        renderProducts(filteredProducts);
    }

    initializeCatalog();
});
