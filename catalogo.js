document.addEventListener('DOMContentLoaded', () => {
    // --- URL DE TU API DE GOOGLE APPS SCRIPT ---
    const API_URL = 'https://script.google.com/macros/s/AKfycby6-At3EHKlp7cnqQY32okkz6LZmZwXjrBDeNjESaE7MGTcEpkEpoxRYEEluxsGjyrD5g/exec';

    // --- SELECCIÓN DE ELEMENTOS DEL DOM ---
    const productGrid = document.getElementById('product-grid');
    const searchInput = document.getElementById('search-input');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const noResultsMsg = document.getElementById('no-results');
    const initialLoadingMsg = document.querySelector('.catalog-message');

    let allProducts = [];

    // --- FUNCIÓN PARA RENDERIZAR PRODUCTOS ---
    const renderProducts = (products) => {
        productGrid.innerHTML = ''; 

        if (products.length === 0) {
            noResultsMsg.classList.remove('hidden');
        } else {
            noResultsMsg.classList.add('hidden');
        }

        products.forEach(product => {
            const card = document.createElement('div');
            card.className = 'catalog-product-card';
            
            const priceNumber = parseFloat(product.price) || 0;
            const formattedPrice = priceNumber > 0 ? priceNumber.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }) : 'Consultar';

            // Usamos el nombre de la categoría (que ahora es la marca)
            const categoryName = product.category || 'Sin categoría';

            card.innerHTML = `
                <div class="product-image-container">
                    <img src="${product.imageUrl}" alt="${product.name}">
                </div>
                <div class="product-info">
                    <span class="product-category-tag">${categoryName.replace(/-/g, ' ')}</span>
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-price">${formattedPrice}</p>
                    <a href="#" class="view-product-btn">Ver más</a>
                </div>
            `;
            productGrid.appendChild(card);
        });
    };

    // --- FUNCIÓN PARA FILTRAR Y BUSCAR ---
    const updateCatalogView = () => {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const activeCategory = document.querySelector('.filter-btn.active').dataset.category;

        let filteredProducts = allProducts;

        if (activeCategory !== 'todos') {
            // Se filtra por la categoría (que ahora es la marca)
            filteredProducts = filteredProducts.filter(product => product.category.toLowerCase() === activeCategory);
        }

        if (searchTerm) {
            filteredProducts = filteredProducts.filter(product => product.name.toLowerCase().includes(searchTerm));
        }

        renderProducts(filteredProducts);
    };

    // --- FUNCIÓN PARA CARGAR LOS DATOS DESDE LA API ---
    async function loadProductsFromAPI() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error(`Error de red: ${response.status}`);
            }
            
            const jsonData = await response.json();
            
            // === BLOQUE CORREGIDO ===
            // Mapeamos los datos usando los nombres de columna CORRECTOS de tu Sheet.
            allProducts = jsonData.map(item => ({
                id: parseInt(item.id, 10),
                name: item.nombre,
                // Usaremos la 'marca' como nuestra 'categoría' para los filtros.
                category: item.marca, 
                // Si la columna 'precio' no existe, usará 0 por defecto.
                price: parseInt(String(item.precio || '0').replace(/\./g, ''), 10), 
                // Si la columna 'imagen_url' no existe, usará una imagen por defecto.
                imageUrl: item.imagen_url || 'https://via.placeholder.com/400x400.png?text=BSI'
            }));

            if(initialLoadingMsg) initialLoadingMsg.classList.add('hidden');

            renderProducts(allProducts);

            // Se necesita ajustar los filtros para que coincidan con las marcas
            // (Esta parte se deja como está, pero ten en cuenta que los botones de filtro
            // deben coincidir con las marcas de tus productos para funcionar)
            filterBtns.forEach(btn => btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                updateCatalogView();
            }));

            searchInput.addEventListener('input', updateCatalogView);

        } catch (error) {
            console.error('Error detallado al cargar los productos:', error);
            productGrid.innerHTML = `<p class="catalog-message">Hubo un problema. Revisa la consola (F12) para más detalles.</p>`;
        }
    }

    // --- INICIAR EL CATÁLOGO ---
    loadProductsFromAPI();
});