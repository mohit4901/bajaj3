document.addEventListener('DOMContentLoaded', () => {
    // productsContainer is the div where the product grid will be injected
    const productsContainer = document.getElementById('product-list'); 
    // IMPORTANT: REPLACE WITH YOUR WHATSAPP NUMBER (e.g., 919876543210)
    const whatsappNumber = '9729643803'; 

    // Function to fetch products from the backend API
    async function fetchProducts() {
        try {
            productsContainer.innerHTML = '<p class="loading-message">Loading premium numbers...</p>'; // Show loading message
            console.log('Frontend: Attempting to fetch products from /api/products');
            const response = await fetch('/api/products');
            
            if (!response.ok) {
                const errorText = await response.text(); 
                console.error(`Frontend: HTTP error! Status: ${response.status}, Response: ${errorText}`);
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }
            
            const products = await response.json();
            console.log('Frontend: Successfully fetched products:', products);
            return products;
        } catch (error) {
            console.error('Frontend: Error fetching products:', error);
            productsContainer.innerHTML = `<p class="error-message">Failed to load products. Please try again later. Error: ${error.message}</p>`;
            return [];
        }
    }

    // Function to render products onto the page
    function renderProducts(products) {
        if (products.length === 0) {
            productsContainer.innerHTML = '<p class="no-products">No premium numbers available at the moment. Please check back later!</p>';
            return;
        }

        productsContainer.innerHTML = products.map(product => {
            const whatsappLink = `https://wa.me/${whatsappNumber}?text=Hello! I am interested in the number ${product.number}. Is it still available?`;
            const buttonText = product.availability === 'Sold Out' ? 'Sold Out' : 'Enquire on WhatsApp';
            const buttonDisabled = product.availability === 'Sold Out' ? 'disabled' : '';
            const buttonClass = product.availability === 'Sold Out' ? 'btn-sold-out' : 'btn-whatsapp';

            return `
                <div class="product-card animate-on-scroll">
                    <img src="${product.imageurl}" alt="Vehicle with number ${product.number}" class="product-image">
                    <div class="product-info">
                        <div class="product-header">
                            <h3 class="product-number">${product.number}</h3>
                            <span class="product-cost">₹${product.cost.toLocaleString('en-IN')}</span>
                        </div>
                        <p class="product-description">${product.description}</p>
                        <a href="${whatsappLink}" target="_blank" class="btn ${buttonClass}" ${buttonDisabled}>
                            ${buttonText}
                        </a>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Call fetch and render functions on page load
    fetchProducts().then(renderProducts);

    // Update WhatsApp link with the number
    const whatsappLinkElement = document.getElementById('whatsapp-link');
    if (whatsappLinkElement) {
        whatsappLinkElement.href = `https://wa.me/${whatsappNumber}`;
    }

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId !== '#') {
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth' 
                    });
                }
            }
        });
    });

    // --- Intersection Observer for Scroll Animations ---
    const observerOptions = {
        root: null, 
        rootMargin: '0px',
        threshold: 0.1 
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target); 
            }
        });
    }, observerOptions);

    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
    });

    // --- Review carousel functionality ---
    const reviewsCarousel = document.querySelector('.reviews-carousel');
    if (reviewsCarousel) {
        let currentScrollPosition = 0;
        const scrollSpeed = 1; 

        function animateScroll() {
            const singleSetWidth = reviewsCarousel.scrollWidth / 2; 

            currentScrollPosition += scrollSpeed;
            if (currentScrollPosition >= singleSetWidth) {
                currentScrollPosition = 0;
            }
            reviewsCarousel.style.transform = `translateX(-${currentScrollPosition}px)`;
            requestAnimationFrame(animateScroll); 
        }

        requestAnimationFrame(animateScroll);
    }
    
    // --- Mobile Navigation Toggle ---
    const hamburgerMenu = document.querySelector('.hamburger-menu');
    const mainNav = document.querySelector('.main-nav');

    if (hamburgerMenu && mainNav) {
        hamburgerMenu.addEventListener('click', () => {
            mainNav.classList.toggle('nav-open');
        });

        // Close nav when a link is clicked
        mainNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mainNav.classList.remove('nav-open');
            });
        });
    }

});

function copyMessage() {
    console.log("Attempting to open WhatsApp link. (No text copied to clipboard in this version)");
}


function copyMessage() {
    console.log("Attempting to open WhatsApp link. (No text copied to clipboard in this version)");
}
