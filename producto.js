/**
 * @file producto.js
 * @description Carga dinámicamente el contenido de la página de detalle del producto.
 * @version 2.1.0
 * @summary Añadido contador de stock bajo, animación en selector de cantidad y mejoras visuales.
 */
document.addEventListener('DOMContentLoaded', () => {
    
    // --- CONFIGURACIÓN ---
    const API_URL = 'https://script.google.com/macros/s/AKfycby7Iwe8Y86-sVMy5PNGYhm1fcp4qgJ89VzUWrODes57i-wJCeqXswMn5KYAdRFZMhSPFA/exec';
    const WHATSAPP_NUMBER = '5493489515452';
    const LOW_STOCK_THRESHOLD = 5; // CAMBIO: Umbral para mostrar el aviso de "últimas unidades".
    const placeholderImage = 'https://placehold.co/600x600/f0f0f0/333?text=BSI';

    // --- ELEMENTOS DEL DOM ---
    const pageLoader = document.getElementById('page-loader');
    const mainContent = document.getElementById('product-main-content');
    
    // --- ESTADO DE LA APLICACIÓN ---
    let currentProduct = null;
    let selectedColor = null;
    let selectedQuantity = 1;

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
            
            currentProduct = product;
            const relatedProducts = getRelatedProducts(allProducts, product);

            populateProductDetails(product);
            populateRelatedProducts(relatedProducts);
            setupActionListeners();
            
            pageLoader.classList.add('hidden');
            mainContent.classList.remove('hidden');

        } catch (error) {
            console.error('Error al inicializar la página:', error);
            displayError('No se pudo cargar la información del producto.');
        }
    }

    const getProductIdFromURL = () => new URLSearchParams(window.location.search).get('id');

    function displayError(message) {
        pageLoader.innerHTML = `<p class="catalog-message">${message}</p>`;
    }
    
    async function fetchProducts() {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`Error de red: ${response.status}`);
        const rawData = await response.json();
        return mapProductData(rawData);
    }
    
    function mapProductData(rawData) {
        return rawData.map(item => ({
            id: item.id,
            name: item.nombre || 'Producto sin nombre',
            brand: item.marca || 'Sin marca',
            category: item.categoría || 'General',
            price: parseFloat(item.precio) || 0,
            salePrice: item.oferta ? parseFloat(item.oferta) : null,
            stock: parseInt(item.stock, 10) || 0,
            description: item.descripcion || 'Sin descripción disponible.',
            specs: { Material: item.material, Peso: item.peso },
            colors: item.color ? item.color.split(',').map(c => c.trim()) : [],
            imageUrls: [item.image, item.image2, item.image3, item.image4].filter(Boolean),
            isOnSale: item.oferta && parseFloat(item.oferta) < parseFloat(item.precio),
        }));
    }

    function getRelatedProducts(allProducts, currentProduct) {
        return allProducts
            .filter(p => p.category === currentProduct.category && p.id != currentProduct.id)
            .slice(0, 4);
    }
    
    function populateProductDetails(product) {
        document.title = `${product.name} - Bike Stunt Importados`;
        document.getElementById('product-brand').textContent = product.brand;
        document.getElementById('product-name').textContent = product.name;
        document.getElementById('product-description-text').textContent = product.description;

        const availabilityEl = document.getElementById('product-availability');
        const stockCounterEl = document.getElementById('product-stock-counter');
        
        if (product.stock > 0) {
            availabilityEl.className = 'availability available';
            availabilityEl.innerHTML = `<i class="fa-solid fa-check-circle"></i> En Stock`;
            
            // NUEVO: Lógica del contador de stock bajo.
            if (product.stock <= LOW_STOCK_THRESHOLD) {
                stockCounterEl.innerHTML = `<i class="fa-solid fa-bolt"></i> ¡Solo quedan ${product.stock} en stock!`;
                stockCounterEl.classList.add('visible');
            } else {
                 stockCounterEl.classList.remove('visible');
            }

        } else {
            availabilityEl.className = 'availability unavailable';
            availabilityEl.innerHTML = `<i class="fa-solid fa-times-circle"></i> Agotado`;
            stockCounterEl.classList.remove('visible');
        }

        const pricingEl = document.getElementById('product-pricing');
        const formatPrice = (price) => price.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 });
        pricingEl.innerHTML = product.isOnSale
            ? `<span class="original-price">${formatPrice(product.price)}</span><p class="product-price sale">${formatPrice(product.salePrice)}</p>`
            : `<p class="product-price">${formatPrice(product.price)}</p>`;

        populateImageGallery(product);
        populateSpecs(product.specs);
        renderColorSelector(product.colors);
    }

    function populateImageGallery(product) {
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
                    const currentActive = document.querySelector('.thumbnail-item.active');
                    if(currentActive) currentActive.classList.remove('active');
                    thumb.classList.add('active');
                });
                thumbnailGallery.appendChild(thumb);
            });
        }
    }

    /**
     * CAMBIO: Añade la especificación de envío estática.
     */
    function populateSpecs(specs) {
        const specsList = document.getElementById('specs-list');
        specsList.innerHTML = '';
        Object.entries(specs).forEach(([key, value]) => {
            if (value) {
                const li = document.createElement('li');
                li.innerHTML = `<span>${key}</span><span>${value}</span>`;
                specsList.appendChild(li);
            }
        });

        // Añade envío
        const shippingLi = document.createElement('li');
        shippingLi.innerHTML = `<span>Envío</span><span>A todo el país</span>`;
        specsList.appendChild(shippingLi);
    }

    function renderColorSelector(colors) {
        const selectorContainer = document.getElementById('color-selector-container');
        selectorContainer.innerHTML = '';
        if (!colors || colors.length === 0) {
            selectorContainer.style.display = 'none';
            return;
        }
        selectorContainer.style.display = 'block';
        
        const colorMap = {
            'rojo': '#ff4136', 'azul': '#0074d9', 'verde': '#2ecc40', 'amarillo': '#ffdc00',
            'naranja': '#ff851b', 'violeta': '#b10dc9', 'negro': '#111111', 'blanco': '#ffffff',
            'gris': '#aaaaaa', 'plata': '#dddddd', 'marron': '#85144b', 'rosa': '#f012be',
            'cyan': '#7fdbff', 'cromo': 'linear-gradient(45deg, #d2d2d2, #fafafa, #d2d2d2)',
            'tornasol': 'linear-gradient(45deg, #ff00ff, #00ffff, #ffff00, #ff00ff)',
        };

        let html = '<h4>Colores Disponibles</h4><div class="color-swatches">';
        colors.forEach(colorName => {
            const normalizedColorName = colorName.toLowerCase();
            const colorValue = colorMap[normalizedColorName] || normalizedColorName;
            const style = colorValue.startsWith('linear-gradient') ? `background-image: ${colorValue}` : `background-color: ${colorValue}`;
            html += `<div class="color-swatch" data-color="${colorName}" title="${colorName}" style="${style}"></div>`;
        });
        html += '</div>';
        selectorContainer.innerHTML = html;

        document.querySelectorAll('.color-swatch').forEach(swatch => {
            swatch.addEventListener('click', () => {
                const currentActive = document.querySelector('.color-swatch.active');
                if(currentActive) currentActive.classList.remove('active');
                swatch.classList.add('active');
                selectedColor = swatch.dataset.color;
                updateCtaButton();
            });
        });
    }
    
    /**
     * CAMBIO: Implementa la animación en el contador de cantidad.
     */
    function setupActionListeners() {
        const qtyDecrease = document.getElementById('quantity-decrease');
        const qtyIncrease = document.getElementById('quantity-increase');
        const qtyInput = document.getElementById('quantity-input');

        const animateQty = () => {
            qtyInput.classList.add('animate-pop');
            setTimeout(() => qtyInput.classList.remove('animate-pop'), 200);
        };

        qtyDecrease.addEventListener('click', () => {
            let currentValue = parseInt(qtyInput.value, 10);
            if (currentValue > 1) {
                qtyInput.value = --currentValue;
                selectedQuantity = currentValue;
                animateQty();
                updateCtaButton();
            }
        });

        qtyIncrease.addEventListener('click', () => {
            let currentValue = parseInt(qtyInput.value, 10);
            if (currentValue < (currentProduct.stock || 99)) {
                qtyInput.value = ++currentValue;
                selectedQuantity = currentValue;
                animateQty();
                updateCtaButton();
            }
        });

        updateCtaButton();
    }

    function updateCtaButton() {
        const ctaButton = document.getElementById('primary-action-btn');
        if (!currentProduct) return;
        
        let message = `¡Hola! Estoy interesado en el producto: *${currentProduct.name}*.`;
        if (selectedColor) {
            message += `\nColor: *${selectedColor}*.`;
        }
        message += `\nCantidad: *${selectedQuantity}*.`;
        
        const encodedMessage = encodeURIComponent(message);
        ctaButton.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
    }

    function populateRelatedProducts(relatedProducts) {
        const grid = document.getElementById('related-products-grid');
        grid.innerHTML = '';
        if(relatedProducts.length === 0) {
            document.getElementById('related-products-section').style.display = 'none';
            return;
        }

        relatedProducts.forEach(product => {
            grid.appendChild(createProductCard(product));
        });
    }

    function createProductCard(product) {
        const link = document.createElement('a');
        link.href = `producto.html?id=${product.id}`;
        link.className = 'catalog-product-card-link';

        const formatPrice = (price) => price.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 });
        const priceHTML = product.isOnSale 
            ? `<span class="original-price">${formatPrice(product.price)}</span><p class="product-price sale">${formatPrice(product.salePrice)}</p>`
            : `<p class="product-price">${formatPrice(product.price)}</p>`;
        
        link.innerHTML = `
            <div class="catalog-product-card">
                <div class="product-image-container">
                    ${product.isOnSale ? '<span class="sale-badge">OFERTA</span>' : ''}
                    <img src="${product.imageUrls[0] || placeholderImage}" alt="${product.name}" loading="lazy">
                </div>
                <div class="product-info">
                    <span class="product-brand-tag">${product.brand}</span>
                    <h3 class="product-name">${product.name}</h3>
                    <div class="product-pricing">
                        ${priceHTML}
                    </div>
                    <span class="view-product-btn">Ver Detalles</span>
                </div>
            </div>`;
        return link;
    }

    initializeProductPage();
});

