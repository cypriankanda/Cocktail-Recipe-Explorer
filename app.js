// State management
let cocktails = [];
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let currentView = 'grid';

// DOM Elements
const searchBar = document.getElementById('search-bar');
const alcoholFilter = document.getElementById('alcohol-filter');
const alcoholicFilter = document.getElementById('alcoholic-filter');
const viewToggleBtn = document.getElementById('view-toggle');
const cocktailGrid = document.getElementById('cocktail-grid');
const favoriteList = document.getElementById("favorite-list");

// Event Listeners
searchBar.addEventListener('input', debounce(handleSearch, 300));
alcoholFilter.addEventListener('change', handleFilters);
alcoholicFilter.addEventListener('change', handleFilters);
viewToggleBtn.addEventListener('click', toggleView);

// Fetch cocktails from API
async function fetchCocktails() {
    const response = await fetch('https://www.thecocktaildb.com/api/json/v1/1/search.php?s=margarita');
    const data = await response.json();
    if (data.drinks) {
        cocktails = data.drinks;
        displayCocktails(cocktails);
    }
}

// Display cocktails in the grid
function displayCocktails(cocktailsToDisplay) {
    if (!cocktailsToDisplay || cocktailsToDisplay.length === 0) {
        cocktailGrid.innerHTML = '<p>No cocktails found.</p>';
        return;
    }

    cocktailGrid.innerHTML = '';
    cocktailsToDisplay.forEach(cocktail => {
        const isFavorite = favorites.some(fav => fav.idDrink === cocktail.idDrink);
        const card = createCocktailCard(cocktail, isFavorite);
        cocktailGrid.appendChild(card);
    });
}

// Create cocktail card element
function createCocktailCard(cocktail, isFavorite) {
    const card = document.createElement('div');
    card.className = 'cocktail-card';
    
    card.innerHTML = `
        <img src="${cocktail.strDrinkThumb}" alt="${cocktail.strDrink}">
        <h3>${cocktail.strDrink}</h3>
        <button class="favorite-btn" data-id="${cocktail.idDrink}">
            ${isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
        </button>
    `;

    const favoriteBtn = card.querySelector('.favorite-btn');
    favoriteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(cocktail, favoriteBtn);
    });

    card.addEventListener('click', () => showCocktailDetails(cocktail.idDrink));
    return card;
}

// Handle search functionality
async function handleSearch() {
    const searchTerm = searchBar.value.trim();
    if (searchTerm === '') {
        displayCocktails(cocktails);
        return;
    }

    const response = await fetch(`https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${encodeURIComponent(searchTerm)}`);
    const data = await response.json();
    displayCocktails(data.drinks || []);
}

// Handle filter functionality
async function handleFilters() {
    const alcoholType = alcoholFilter.value;
    const alcoholicType = alcoholicFilter.value;
    
    let url = 'https://www.thecocktaildb.com/api/json/v1/1/';
    if (alcoholType) {
        url += `filter.php?i=${encodeURIComponent(alcoholType)}`;
    } else if (alcoholicType) {
        url += `filter.php?a=${encodeURIComponent(alcoholicType)}`;
    } else {
        url += 'search.php?s=';
    }

    const response = await fetch(url);
    const data = await response.json();
    
    if (alcoholType || alcoholicType) {
        const fullCocktails = await Promise.all(
            data.drinks.map(async (drink) => {
                const detailResponse = await fetch(`https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=${drink.idDrink}`);
                const detailData = await detailResponse.json();
                return detailData.drinks[0];
            })
        );
        displayCocktails(fullCocktails);
    } else {
        displayCocktails(data.drinks);
    }
}

// Show cocktail details
async function showCocktailDetails(cocktailId) {
    const response = await fetch(`https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=${cocktailId}`);
    const data = await response.json();
    
    if (data.drinks) {
        const cocktail = data.drinks[0];
        const ingredients = [];
        
        for (let i = 1; i <= 15; i++) {
            const ingredient = cocktail[`strIngredient${i}`];
            const measure = cocktail[`strMeasure${i}`];
            if (ingredient && ingredient.trim() !== '') {
                ingredients.push(`${ingredient}${measure ? ` - ${measure}` : ''}`);
            }
        }

        alert(`
            ${cocktail.strDrink}
            
            Ingredients:
            ${ingredients.join('\n')}
            
            Instructions:
            ${cocktail.strInstructions}
            
            Glass: ${cocktail.strGlass}
            Category: ${cocktail.strCategory}
            Alcoholic: ${cocktail.strAlcoholic}
        `);
    }
}

// Toggle between grid and list view
function toggleView() {
    currentView = currentView === 'grid' ? 'list' : 'grid';
    cocktailGrid.classList.toggle('list-view');
    viewToggleBtn.innerHTML = currentView === 'grid' 
        ? '<i class="fas fa-th-large"></i>' 
        : '<i class="fas fa-list"></i>';
}

// Toggle favorite status
function toggleFavorite(cocktail, button) {
    const index = favorites.findIndex(fav => fav.idDrink === cocktail.idDrink);
    
    if (index === -1) {
        favorites.push(cocktail);
        button.textContent = 'Remove from Favorites';
    } else {
        favorites.splice(index, 1);
        button.textContent = 'Add to Favorites';
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
    loadFavorites();
}

// Load favorites
function loadFavorites() {
    if (!favoriteList) return;
    
    favoriteList.innerHTML = '';
    if (favorites.length > 0) {
        favorites.forEach(fav => {
            const favoriteItem = document.createElement("div");
            favoriteItem.className = "favorite-item";
            favoriteItem.textContent = fav.strDrink;
            favoriteList.appendChild(favoriteItem);
        });
    } else {
        favoriteList.innerHTML = "<p>No favorites yet. Add some!</p>";
    }
}

// Debounce function for search input
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize the app
fetchCocktails();
loadFavorites();
