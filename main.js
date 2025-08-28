import { ProductCard } from "./productCard.js";
import { Cart } from "./cart.js";

// Variables globales para el estado de la aplicación
let products = [];
let filteredProducts = [];
let selectedCategory = "";
let currentPage = 1;
let productLimit = 6;

// Instancia del carrito
const cart = new Cart();

// Elementos del DOM
const productsContainer = document.getElementById("products");
const loading = document.getElementById("loading");
const searchInput = document.querySelector('.search-input');
const sortSelect = document.querySelector('.sort-select');
const cartButton = document.getElementById('cartButton');
const cartModal = document.getElementById('cartModal');
const closeCart = document.getElementById('closeCart');
const productLimitSelect = document.getElementById("productLimit");

// Función principal para cargar productos
async function fetchProducts() {
    try {
        const res = await fetch("https://fakestoreapi.com/products");
        if (!res.ok) throw new Error('Error al obtener los productos');

        products = await res.json();
        filteredProducts = [...products];

        renderProducts();
        hideLoading();

    } catch (error) {
        console.error("Error al cargar productos", error);
        showError('Error al cargar los productos. Por favor, recarga la página.');
    }
}

function renderProducts(productsToRender = filteredProducts.length ? filteredProducts : products) { 
    if (productsToRender.length === 0) {
        productsContainer.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; color: white; padding: 40px;">
                <h2>No se encontraron productos</h2>
                <p>Intenta con otros filtros de búsqueda</p>
            </div>`;
        document.getElementById("pagination").innerHTML = "";
        return;
    }

    productsContainer.innerHTML = '';
    
    const start = (currentPage - 1) * productLimit;
    const end = start + productLimit;
    const pageProducts = productsToRender.slice(start, end);

    pageProducts.forEach(product => {
        const card = ProductCard(product, cart);
        let favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];
        const favBtn = document.createElement("button");
        favBtn.dataset.id = product.id;
        favBtn.textContent = favoritos.includes(String(product.id))

        productsContainer.appendChild(card);
    });

    renderPagination(productsToRender.length);
}

function renderPagination(totalProducts) { 
    const pagination = document.getElementById("pagination");
    pagination.innerHTML = "";

    const totalPages = Math.ceil(totalProducts / productLimit);

    // Botón Anterior 
    const prevBtn = document.createElement("button");
    prevBtn.textContent = "Anterior";
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => {
        currentPage--;
        renderProducts(filteredProducts.length ? filteredProducts : products);
    };
    pagination.appendChild(prevBtn);

    // Números de página
    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement("button");
        pageBtn.textContent = i;
        if (i === currentPage) pageBtn.disabled = true;
        pageBtn.onclick = () => {
            currentPage = i;
            renderProducts(filteredProducts.length ? filteredProducts : products);
        };
        pagination.appendChild(pageBtn);
    }

    // Botón Siguiente
    const nextBtn = document.createElement("button");
    nextBtn.textContent = "Siguiente";
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => {
        currentPage++;
        renderProducts(filteredProducts.length ? filteredProducts : products);
    };
    pagination.appendChild(nextBtn);
}

// Filtrar productos
function filterProducts() {
    const searchTerm = searchInput.value.toLowerCase();

    filteredProducts = products.filter(product => {
        const matchesSearch = product.title.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm);
        const matchesCategory = !selectedCategory || product.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });


    sortProducts();
    renderProducts();
}

// Ordenar productos
function sortProducts() {
    const sortValue = sortSelect.value;

    switch (sortValue) {
        case 'price-asc':
            filteredProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            filteredProducts.sort((a, b) => b.price - a.price);
            break;
        case 'title-asc':
            filteredProducts.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'title-desc':
            filteredProducts.sort((a, b) => b.title.localeCompare(a.title));
            break;
        case 'rating-desc':
            filteredProducts.sort((a, b) => b.rating.rate - a.rating.rate);
            break;
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Buscar
    searchInput.addEventListener('input', filterProducts);

    // Ordenar
    sortSelect.addEventListener('change', () => {
        sortProducts();
        renderProducts();
    });

    // Botones de categorías
    const categoryButtons = document.querySelectorAll('.category-btn');
    categoryButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Quitar activo de todos
            categoryButtons.forEach(b => b.classList.remove('active'));
            // Activar el clicado
            btn.classList.add('active');

            selectedCategory = btn.getAttribute("data-category");
            filterProducts();
        });
    });

    // Carrito
    cartButton.addEventListener('click', () => cart.toggleModal());
    closeCart.addEventListener('click', () => cart.toggleModal());

    cartModal.addEventListener('click', (e) => {
        if (e.target === cartModal) {
            cart.toggleModal();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && cartModal.classList.contains('active')) {
            cart.toggleModal();
        }
    });

    cart.subscribe(() => {
        renderProducts();
    });
}

function hideLoading() {
    loading.style.display = 'none';
}

function showError(message) {
    productsContainer.innerHTML = `
    <div style="grid-column: 1/-1; text-align: center; color: white; padding: 40px;">
    <h2>❌ Error</h2>
    <p>${message}</p>
    </div>
`;
    hideLoading();
}

if (productLimitSelect) { 
    productLimitSelect.addEventListener("change", () => {
        productLimit = parseInt(productLimitSelect.value);
        currentPage = 1; // volver a la primera página
        renderProducts(filteredProducts.length ? filteredProducts : products);
    });
}

// Inicializar la aplicación
async function initApp() {
    try {
        cart.loadFromStorage(); 
        setupEventListeners();
        await fetchProducts();
    } catch (error) {
        console.error('Error al inicializar la aplicación:', error);
        showError('Error al cargar la aplicación. Por favor, recarga la página.');
    }
}

document.addEventListener('DOMContentLoaded', initApp);