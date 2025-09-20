/**
 * @file producto.js
 * @description Carga dinámicamente el contenido de la página de detalle del producto.
 * @version 3.0.0
 * @summary Completamente adaptado al sistema de proxy Base64 para todas las imágenes (principal y miniaturas).
 */
document.addEventListener('DOMContentLoaded', () => {
    
    const API_URL = 'https://script.google.com/macros/s/AKfycbzAnNQGAMIqcHRew3NcrgKrMOirPuWwB5lmv8eYCJiTMnGe0E0tp62S86KPC2uPhBlFJA/exec';
    const WHATSAPP_NUMBER = '5493489515452';
    const LOW_STOCK_THRESHOLD = 5;

    const pageLoader = document.getElementById('page-loader');
    const mainContent = document.getElementById('product-main-content');
    
    let currentProduct = null;
    let selectedColor = null;
    let selectedQuantity = 1;

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
            console.error(`Error cargando imagen de producto ${fileId}:`, error);
        }
    }

    // --- LÓGICA PRINCIPAL DE LA PÁGINA DE PRODUCTO ---

    async function initializeProductPage() {
        const productId = new URLSearchParams(window.location.search).get('id');
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

    function displayError(message) {
        pageLoader.innerHTML = `<p class="catalog-message">${message}</p>`;
    }
    
    async function fetchProducts() {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`Error de red: ${response.status}`);
        return mapProductData(await response.json());
    }
    
    function mapProductData(rawData) {
        return rawData.map(item => ({
            id: item.id,
            name: item.nombre || 'Producto sin nombre',
            brand: item.marca || 'Sin marca',
            category: item.categoria || 'General',
            price: parseFloat(item.precio) || 0,
            salePrice: item.oferta ? parseFloat(item.oferta) : null,
            stock: parseInt(item.stock, 10) || 0,
            description: item.descripcion || 'Sin descripción disponible.',
            specs: { Material: item.material, Peso: item.peso },
            colors: item.color ? item.color.split(',').map(c => c.trim()) : [],
            // CAMBIO: Creamos un array de IDs de imagen
            imageIds: [item.image, item.image2, item.image3, item.image4]
                .filter(Boolean)
                .map(getFileIdFromUrl),
            isOnSale: item.oferta && parseFloat(item.oferta) < parseFloat(item.precio),
        }));
    }

    function getRelatedProducts(allProducts, currentProduct) {
        // Para los productos relacionados, solo necesitamos la primera imagen.
        const related = allProducts
            .filter(p => p.category === currentProduct.category && p.id != currentProduct.id)
            .slice(0, 4);

        return related.map(p => ({ ...p, imageId: p.imageIds[0] }));
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
        const formatPrice = (p) => p.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 });
        pricingEl.innerHTML = product.isOnSale
            ? `<span class="original-price">${formatPrice(product.price)}</span><p class="product-price sale">${formatPrice(product.salePrice)}</p>`
            : `<p class="product-price">${formatPrice(product.price)}</p>`;

        populateImageGallery(product);
        populateSpecs(product.specs);
        renderColorSelector(product.colors);
    }

    function populateImageGallery(product) {
        const mainImage = document.getElementById('main-product-image');
        mainImage.alt = product.name;
        loadDriveImage(mainImage, product.imageIds[0]); // Carga la imagen principal
        
        const thumbnailGallery = document.getElementById('thumbnail-gallery');
        thumbnailGallery.innerHTML = '';
        if (product.imageIds.length > 1) {
            product.imageIds.forEach((id, index) => {
                const thumb = document.createElement('div');
                thumb.className = 'thumbnail-item';
                if (index === 0) thumb.classList.add('active');
                
                const thumbImg = document.createElement('img');
                thumbImg.alt = `Vista miniatura ${index + 1}`;
                thumb.appendChild(thumbImg);

                loadDriveImage(thumbImg, id); // Carga cada miniatura

                thumb.addEventListener('click', () => {
                    mainImage.src = thumbImg.src; // El src ya es la data Base64
                    document.querySelector('.thumbnail-item.active')?.classList.remove('active');
                    thumb.classList.add('active');
                });
                thumbnailGallery.appendChild(thumb);
            });
        }
    }

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
        const shippingLi = document.createElement('li');
        shippingLi.innerHTML = `<span>Envío</span><span>A todo el país</span>`;
        specsList.appendChild(shippingLi);
    }

    function renderColorSelector(colors) {
        const selectorContainer = document.getElementById('color-selector-container');
        if (!colors || colors.length === 0) {
            selectorContainer.style.display = 'none';
            return;
        }
        selectorContainer.style.display = 'block';
        const colorMap={'rojo':'#ff4136','azul':'#0074d9','verde':'#2ecc40','amarillo':'#ffdc00','naranja':'#ff851b','violeta':'#b10dc9','negro':'#111111','blanco':'#ffffff','gris':'#aaaaaa','plata':'#dddddd','marron':'#85144b','rosa':'#f012be','cyan':'#7fdbff','cromo':'linear-gradient(45deg, #d2d2d2, #fafafa, #d2d2d2)','tornasol':'linear-gradient(45deg, #ff00ff, #00ffff, #ffff00, #ff00ff)',};
        let html = '<h4>Colores Disponibles</h4><div class="color-swatches">';
        colors.forEach(c=>{const n=c.toLowerCase(),l=colorMap[n]||n,s=l.startsWith('linear-gradient')?`background-image: ${l}`:`background-color: ${l}`;html+=`<div class="color-swatch" data-color="${c}" title="${c}" style="${s}"></div>`});
        selectorContainer.innerHTML = html + '</div>';
        document.querySelectorAll('.color-swatch').forEach(s=>{s.addEventListener('click',()=>{document.querySelector('.color-swatch.active')?.classList.remove('active');s.classList.add('active');selectedColor=s.dataset.color;updateCtaButton()})});
    }

    function setupActionListeners() {
        const qtyDecrease = document.getElementById('quantity-decrease');
        const qtyIncrease = document.getElementById('quantity-increase');
        const qtyInput = document.getElementById('quantity-input');
        const animateQty = () => { qtyInput.classList.add('animate-pop'); setTimeout(() => qtyInput.classList.remove('animate-pop'), 200); };
        qtyDecrease.addEventListener('click', () => { let v = parseInt(qtyInput.value, 10); if (v > 1) { qtyInput.value = --v; selectedQuantity = v; animateQty(); updateCtaButton(); } });
        qtyIncrease.addEventListener('click', () => { let v = parseInt(qtyInput.value, 10); if (v < (currentProduct.stock || 99)) { qtyInput.value = ++v; selectedQuantity = v; animateQty(); updateCtaButton(); } });
        updateCtaButton();
    }

    function updateCtaButton() {
        const ctaButton = document.getElementById('primary-action-btn');
        if (!currentProduct) return;
        let msg = `¡Hola! Estoy interesado en el producto: *${currentProduct.name}*.`;
        if (selectedColor) msg += `\nColor: *${selectedColor}*.`;
        msg += `\nCantidad: *${selectedQuantity}*.`;
        ctaButton.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    }

    function populateRelatedProducts(relatedProducts) {
        const grid = document.getElementById('related-products-grid');
        grid.innerHTML = '';
        if(relatedProducts.length === 0) { document.getElementById('related-products-section').style.display = 'none'; return; }
        relatedProducts.forEach(p => grid.appendChild(createProductCard(p)));
    }

    function createProductCard(product) {
        const link = document.createElement('a');
        link.href = `producto.html?id=${product.id}`;
        link.className = 'catalog-product-card-link';
        const formatPrice = (p) => p.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 });
        const priceHTML = product.isOnSale ? `<span class="original-price">${formatPrice(product.price)}</span><p class="product-price sale">${formatPrice(product.salePrice)}</p>` : `<p class="product-price">${formatPrice(product.price)}</p>`;
        
        const card = document.createElement('div');
        card.className = 'catalog-product-card';
        card.innerHTML = `<div class="product-image-container">${product.isOnSale ? '<span class="sale-badge">OFERTA</span>' : ''}<img src="" alt="${product.name}" loading="lazy"></div><div class="product-info"><span class="product-brand-tag">${product.brand}</span><h3 class="product-name">${product.name}</h3><div class="product-pricing">${priceHTML}</div><span class="view-product-btn">Ver Detalles</span></div>`;
        
        const img = card.querySelector('img');
        loadDriveImage(img, product.imageId);

        link.appendChild(card);
        return link;
    }

    initializeProductPage();
});
