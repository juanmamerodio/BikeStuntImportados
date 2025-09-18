/**
 * @file catalogo.js
 * @description Lógica dinámica para el catálogo de productos de Bike Stunt Importados.
 * @author Tu Nombre (Experto en JS y Marketing)
 * @version 2.0.0
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- CONFIGURACIÓN ---
    // URL de la API de Google Apps Script. ¡Asegúrate de que tu spreadsheet esté publicado como app web!
    const API_URL = 'https://script.google.com/macros/s/AKfycby7Iwe8Y86-sVMy5PNGYhm1fcp4qgJ89VzUWrODes57i-wJCeqXswMn5KYAdRFZMhSPFA/exec'; // Reemplazar con tu URL real
    const placeholderImage = 'https://placehold.co/400x400/f0f0f0/333?text=BSI';

    // --- ELEMENTOS DEL DOM ---
    const productGrid = document.getElementById('product-grid');
    const searchInput = document.getElementById('search-input');
    const categorySelect = document.getElementById('category-select');
    const noResultsMsg = document.getElementById('no-results');

    // --- ESTADO DE LA APLICACIÓN ---
    let allProducts = []; // Almacenará todos los productos para evitar múltiples llamadas a la API.

    /**
     * Inicializa el catálogo: obtiene los productos y configura los event listeners.
     */
    async function initializeCatalog() {
        try {
            const products = await fetchProducts(100);
            allProducts = mapProductData(products);
            
            populateCategoryFilter(allProducts);
            renderProducts(allProducts);

            setupEventListeners();
        } catch (error) {
            console.error('Error al inicializar el catálogo:', error);
            productGrid.innerHTML = `<p class="catalog-message">Error al cargar productos. Por favor, intenta de nuevo más tarde.</p>`;
        }
    }

    /**
     * Obtiene los productos desde la API de Google Sheets.
     * @returns {Promise<Array>} Una promesa que resuelve a un array de productos.
     */
    async function fetchProducts() {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`Error de red: ${response.status}`);
        }
        return response.json();
    }

    /**
     * Mapea los datos crudos de la API a un formato de objeto más limpio y usable.
     * @param {Array} rawData - Array de objetos directamente desde la API.
     * @returns {Array} Array de objetos de producto limpios.
     */
    function mapProductData(rawData) {
        return rawData.map(item => ({
            id: item.id || Date.now(),
            name: item.nombre || 'Producto sin nombre',
            brand: item.marca || 'Generica',
            category: item.categoría || 'General',
            price: parseFloat(item.precio) || 0,
            salePrice: item.oferta ? parseFloat(item.oferta) : null,
            imageUrl: item.image || placeholderImage,
            isOnSale: item.oferta && parseFloat(item.oferta) < parseFloat(item.precio),
        }));
    }

    /**
     * Popula el menú desplegable de categorías dinámicamente.
     * @param {Array} products - El array de todos los productos.
     */
    function populateCategoryFilter(products) {
        const categories = [...new Set(products.map(p => p.category))];
        categories.sort().forEach(category => {
            const option = document.createElement('option');
            option.value = category.toLowerCase();
            option.textContent = category;
            categorySelect.appendChild(option);
        });
    }

    /**
     * Renderiza los productos en la grilla del DOM.
     * @param {Array} productsToDisplay - El array de productos a mostrar.
     */
    function renderProducts(productsToDisplay) {
        productGrid.innerHTML = ''; // Limpia la grilla antes de renderizar

        if (productsToDisplay.length === 0) {
            noResultsMsg.classList.remove('hidden');
        } else {
            noResultsMsg.classList.add('hidden');
        }

        const fragment = document.createDocumentFragment();
        productsToDisplay.forEach(product => {
            const card = createProductCard(product);
            fragment.appendChild(card);
        });
        productGrid.appendChild(fragment);
    }

    /**
     * Crea el elemento HTML para una tarjeta de producto individual.
     * @param {Object} product - El objeto del producto.
     * @returns {HTMLElement} El elemento div de la tarjeta de producto.
     */
    function createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'catalog-product-card';

        const formatPrice = (price) => price.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 });

        const priceHTML = product.isOnSale
            ? `
                <span class="original-price">${formatPrice(product.price)}</span>
                <p class="product-price sale">${formatPrice(product.salePrice)}</p>
              `
            : `<p class="product-price">${formatPrice(product.price)}</p>`;
        
        const saleBadgeHTML = product.isOnSale ? `<span class="sale-badge">OFERTA</span>` : '';

        card.innerHTML = `
            <div class="product-image-container">
                ${saleBadgeHTML}
                <img src="${product.imageUrl}" alt="${product.name}" onerror="this.onerror=null;this.src='${placeholderImage}';">
            </div>
            <div class="product-info">
                <span class="product-brand-tag">${product.brand}</span>
                <h3 class="product-name">${product.name}</h3>
                <div class="product-pricing">
                    ${priceHTML}
                </div>
                <a href="#" class="view-product-btn">Comprar</a>
            </div>
        `;
        return card;
    }

    /**
     * Configura los listeners para los controles de búsqueda y filtro.
     */
    function setupEventListeners() {
        searchInput.addEventListener('input', handleFilterChange);
        categorySelect.addEventListener('change', handleFilterChange);
    }

    /**
     * Maneja los cambios en los filtros, actualizando la vista de productos.
     */
    function handleFilterChange() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const selectedCategory = categorySelect.value;

        let filteredProducts = allProducts;

        // 1. Filtrar por categoría
        if (selectedCategory !== 'todos') {
            filteredProducts = filteredProducts.filter(p => p.category.toLowerCase() === selectedCategory);
        }

        // 2. Filtrar por término de búsqueda (en nombre o marca)
        if (searchTerm) {
            filteredProducts = filteredProducts.filter(p => 
                p.name.toLowerCase().includes(searchTerm) || 
                p.brand.toLowerCase().includes(searchTerm)
            );
        }

        renderProducts(filteredProducts);
    }

    // --- INICIO DE LA EJECUCIÓN ---
    initializeCatalog();
});
