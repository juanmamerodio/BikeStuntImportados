/**
 * @file catalogo.js
 * @description Lógica dinámica para el catálogo de productos de Bike Stunt Importados.
 * @author Tu Nombre (Experto en JS y Marketing)
 * @version 2.2.0
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- CONFIGURACIÓN ---
    const API_URL = 'https://script.google.com/macros/s/AKfycby7Iwe8Y86-sVMy5PNGYhm1fcp4qgJ89VzUWrODes57i-wJCeqXswMn5KYAdRFZMhSPFA/exec'; // Reemplaza con tu URL real
    const placeholderImage = 'https://placehold.co/400x400/f0f0f0/333?text=BSI';

    // --- ELEMENTOS DEL DOM ---
    const productGrid = document.getElementById('product-grid');
    const searchInput = document.getElementById('search-input');
    const categorySelect = document.getElementById('category-select');
    const noResultsMsg = document.getElementById('no-results');

    // --- ESTADO DE LA APLICACIÓN ---
    let allProducts = [];

    async function initializeCatalog() {
        try {
            const products = await fetchProducts();
            allProducts = mapProductData(products);
            
            populateCategoryFilter(allProducts);
            renderProducts(allProducts);

            setupEventListeners();
        } catch (error) {
            console.error('Error al inicializar el catálogo:', error);
            productGrid.innerHTML = `<p class="catalog-message">Error al cargar productos. Por favor, intenta de nuevo más tarde.</p>`;
        }
    }

    async function fetchProducts() {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`Error de red: ${response.status}`);
        }
        return response.json();
    }

    function mapProductData(rawData) {
        return rawData.map(item => ({
            id: item.id || Date.now(),
            name: item.nombre || 'Producto sin nombre',
            brand: item.marca || 'Generica',
            category: item.categoría || 'General',
            price: parseFloat(item.precio) || 0,
            salePrice: item.oferta ? parseFloat(item.oferta) : null,
            imageUrl: item.image || placeholderImage,
            stock: parseInt(item.stock, 10) || 0, // <-- AÑADIDO
            isOnSale: item.oferta && parseFloat(item.oferta) < parseFloat(item.precio),
        }));
    }

    function populateCategoryFilter(products) {
        const categories = [...new Set(products.map(p => p.category))];
        categories.sort().forEach(category => {
            const option = document.createElement('option');
            option.value = category.toLowerCase();
            option.textContent = category;
            categorySelect.appendChild(option);
        });
    }

    function renderProducts(productsToDisplay) {
        productGrid.innerHTML = ''; 

        if (productsToDisplay.length === 0) {
            noResultsMsg.classList.remove('hidden');
        } else {
            noResultsMsg.classList.add('hidden');
        }

        const fragment = document.createDocumentFragment();
        productsToDisplay.forEach(product => {
            const cardLink = createProductCardLink(product);
            fragment.appendChild(cardLink);
        });
        productGrid.appendChild(fragment);
    }

    /**
     * Crea el elemento HTML <a> que envuelve toda la tarjeta del producto.
     * AHORA INCLUYE LÓGICA DE STOCK.
     */
    function createProductCardLink(product) {
        const cardLink = document.createElement('a');
        cardLink.href = product.stock > 0 ? `producto.html?id=${product.id}` : '#';
        cardLink.className = 'catalog-product-card-link';
        if (product.stock <= 0) {
            cardLink.classList.add('out-of-stock');
        }

        const formatPrice = (price) => price.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 });

        const priceHTML = product.isOnSale
            ? `<span class="original-price">${formatPrice(product.price)}</span><p class="product-price sale">${formatPrice(product.salePrice)}</p>`
            : `<p class="product-price">${formatPrice(product.price)}</p>`;
        
        const saleBadgeHTML = product.isOnSale ? `<span class="sale-badge">OFERTA</span>` : '';

        // --- LÓGICA DE STOCK VISUAL ---
        let stockHTML = '';
        if (product.stock > 5) {
            stockHTML = `<div class="product-stock-status stock-available"><i class="fa-solid fa-check"></i> En Stock</div>`;
        } else if (product.stock > 0) {
            stockHTML = `<div class="product-stock-status stock-low"><i class="fa-solid fa-bolt"></i> ¡Últimas unidades!</div>`;
        } else {
            stockHTML = `<div class="product-stock-status stock-out"><i class="fa-solid fa-xmark"></i> Agotado</div>`;
        }
        // --- FIN LÓGICA DE STOCK ---

        cardLink.innerHTML = `
            <div class="catalog-product-card">
                <div class="product-image-container">
                    ${saleBadgeHTML}
                    <img src="${product.imageUrl}" alt="${product.name}" onerror="this.onerror=null;this.src='${placeholderImage}';">
                </div>
                <div class="product-info">
                    <span class="product-brand-tag">${product.brand}</span>
                    <h3 class="product-name">${product.name}</h3>
                    ${stockHTML}
                    <div class="product-pricing">
                        ${priceHTML}
                    </div>
                    <span class="view-product-btn">Comprar</span>
                </div>
            </div>
        `;
        return cardLink;
    }

    function setupEventListeners() {
        searchInput.addEventListener('input', handleFilterChange);
        categorySelect.addEventListener('change', handleFilterChange);
    }

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

