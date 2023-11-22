import { ALL_RECIPES, API_URL, RES_PER_PAGE } from "./config.js";
import icons from "url:../img/icons.svg";

const recipeContainer = document.querySelector(".recipe-container");
const paginationButtons = document.querySelectorAll(".btn-pagination");
const paginationContainer = document.querySelector(".pagination-nav-list");
const paginationButtonContainer = document.querySelector(".pagination-nav");
const recipeButtons = document.querySelectorAll(".btn-recipe-nav");
const recipeButtonContainer = document.querySelector(".recipe-nav-list");
const recipeNumber = document.querySelector(".recipe-number");
const searchField = document.querySelector(".search");
const pageNum = document.querySelector(".page-number");
const previousBtn = document.querySelector(".previous");
const nextBtn = document.querySelector(".next");
const background = document.querySelector(".bg");
const bookmarkBtn = document.querySelector(".btn-bookmarks");
const bookmarksContainer = document.querySelector(".bookmarks");
const bookmarkList = document.querySelector(".bookmarks-list");

let recipeID;
let recipeArray = [];
let bookmarksArray = [];
let totalPages;

/**
 * Creates a recipe object from the provided data.
 *
 * @param {Object} data - The data object containing information about the recipe.
 * @returns {Object} - The created recipe object.
 */
const createRecipe = function (data) {
  return {
    id: data.id,
    title: data.title,
    imageUrl: data.image_url,
    publisher: data.publisher,
    bookmark: false,
  };
};

/**
 * Clears the content of a container by setting its inner HTML to an empty string.
 *
 * @param {HTMLElement} container - The HTML element representing the container to be cleared.
 */
const clearContainer = function (container) {
  container.innerHTML = "";
};

/**
 * Generates HTML markup for displaying a recipe.
 *
 * @param {Object} recipe - The recipe object containing information to be displayed.
 *
 * @returns {string} - The generated HTML markup for the recipe.
 */
const generateMarkup = function (recipe) {
  return `
  <div class="recipe-entire">
      <div class="recipe-overlay">
        <div class="recipe-btns">
          <button class="btn-view-recipe hidden">View Recipe</button>
          <button class="btn-add-bookmark hidden">Bookmark</button>
        </div>
      </div>
    <div class="recipe" data-id="${recipe.id}">
      <div class="recipe-image-container">
        <img
          src="${recipe.imageUrl}"
          alt="${recipe.title}"
          class="recipe-image"
        />
      </div>
    <h2 class="recipe-header">${recipe.title}</h2>
    <p class="recipe-publisher-text">
        Recipe created by
        <span class="recipe-publisher">${recipe.publisher}</span>
    </p>
    </div>
  </div>
    `;
};

/**
 * Retrieves a subset of items from an array based on the specified page and items per page.
 *
 * @param {Array} array - The array containing the items to be paginated.
 * @param {number} currentPage - The current page number (1-indexed).
 * @param {number} [itemsPerPage=12] - The number of items to display per page (default is 12).
 *
 * @returns {Array} - A subset of items corresponding to the specified page.
 */
const getItemsForPage = function (array, currentPage, itemsPerPage = 12) {
  const startIndex = (+currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return array.slice(startIndex, endIndex);
};

/**
 * Renders an error message within a specified container.
 *
 * @param {HTMLElement} container - The HTML element where the error message will be rendered.
 * @param {string} message - The error message to be displayed.
 */
const renderError = function (container, message) {
  const markup = `<div class="error"><svg class="icon-error">
  <use href="${icons}#icon-alert-triangle"></use></svg
  >${message}</div>`;
  container.insertAdjacentHTML("afterbegin", markup);
};

/**
 * Performs a recipe search based on the provided query.
 *
 * @param {string} query - The search query to retrieve recipes.
 */
const recipeSearch = async function (query) {
  try {
    // Fetch recipes from the API based on the provided search query
    const res = await fetch(`${API_URL}?search=${query}`);
    const { data } = await res.json();

    // Extract recipes from the response data
    const recipes = data.recipes;

    // Convert each recipe into a structured format and add it to the recipeArray
    recipes.forEach((rec) => {
      recipeArray.push(createRecipe(rec));
    });

    // Calculate the total number of pages based on the number of recipes and items per page
    totalPages = Math.ceil(recipeArray.length / RES_PER_PAGE);

    // Update the displayed total number of recipes
    getTotalRecipes(recipeArray);

    // Clear the recipe container to prepare for displaying the updated recipes
    clearContainer(recipeContainer);

    // Display an error message if there are no recipes found; otherwise, display the recipes
    if (totalPages === 0) {
      renderError(
        recipeContainer,
        "Could not find any recipes, please try again!"
      );
      nextBtn.style.display = "none";
    } else {
      nextBtn.style.display = "block";
    }
    showRecipes(recipeArray);
  } catch (err) {
    // Handle errors by logging them to the console
    console.error(err);
  }
};

/**
 * Clears all elements from the provided array.
 *
 * @param {Array} array - The array to be cleared.
 */
const clearArray = function (array) {
  array.length = 0;
};

/**
 * Displays recipes from the provided array on the current page.
 *
 * @param {Array} array - The array containing recipes to be displayed.
 */
const showRecipes = function (array) {
  const curPageRecipes = getItemsForPage(array, getCurrentPage());
  curPageRecipes.forEach((rec) => {
    recipeContainer.insertAdjacentHTML("afterbegin", generateMarkup(rec));
  });
  loadOverlay();
};

/**
 * Resets the pagination buttons and sets the current page to 1.
 */
const resetPaginationBtns = function () {
  // Set the current page in the dataset to 1
  paginationButtonContainer.dataset.currentpage = 1;

  // Update the displayed current page number
  pageNum.textContent = paginationButtonContainer.dataset.currentpage;

  // Hide the previous button since we are on the first page
  previousBtn.style.display = "none";

  // Adjust the visibility of the next button based on the total number of pages
  if (totalPages <= 1) {
    nextBtn.style.display = "none";
  } else {
    nextBtn.style.display = "block";
  }
};

/**
 * Retrieves the current page number from the pagination button container's dataset.
 *
 * @returns {number} - The current page number.
 */
const getCurrentPage = function () {
  const curPage = paginationButtonContainer.dataset.currentpage;
  return curPage;
};

/**
 * Event listener for handling pagination button clicks.
 *
 * @param {Event} e - The click event.
 */
paginationContainer.addEventListener("click", function (e) {
  // Prevent the default behavior of the click event
  e.preventDefault();

  // Find the element to scroll to on pagination button click
  const elementToScrollTo = document.querySelector(".heading-primary");

  // Find the closest pagination button that was clicked
  const btn = e.target.closest(".btn-pagination");

  // If no pagination button was clicked, exit the function
  if (!btn) return;

  // Ensure both next and previous buttons are displayed
  nextBtn.style.display = "block";
  previousBtn.style.display = "block";

  // Update current page based on the clicked button
  if (btn === nextBtn) {
    paginationButtonContainer.dataset.currentpage =
      +paginationButtonContainer.dataset.currentpage + 1;
  }
  if (btn === previousBtn) {
    paginationButtonContainer.dataset.currentpage =
      +paginationButtonContainer.dataset.currentpage - 1;
  }

  // Adjust the visibility of next and previous buttons based on the current page
  if (+paginationButtonContainer.dataset.currentpage >= totalPages) {
    nextBtn.style.display = "none";
  }
  if (+paginationButtonContainer.dataset.currentpage === 1) {
    previousBtn.style.display = "none";
  }

  // Update the displayed current page number
  pageNum.textContent = +paginationButtonContainer.dataset.currentpage;

  // Clear the recipe container and show recipes for the updated current page
  clearContainer(recipeContainer);
  showRecipes(recipeArray);

  // Scroll to the element smoothly
  elementToScrollTo.scrollIntoView({ behavior: "smooth" });
});

/**
 * Event listener for handling recipe navigation button clicks.
 *
 * @param {Event} e - The click event.
 */
recipeButtonContainer.addEventListener("click", function (e) {
  // Prevent the default behavior of the click event
  e.preventDefault();

  // Find the closest recipe navigation button that was clicked
  const btn = e.target.closest(".btn-recipe-nav");

  // If no button was clicked or the clicked button is already active, exit the function
  if (!btn || btn.classList.contains("btn-active")) return;

  // Remove the "btn-active" class from all recipe navigation buttons
  recipeButtons.forEach((btn) => btn.classList.remove("btn-active"));

  // Add the "btn-active" class to the clicked button
  btn.classList.add("btn-active");

  // Clear the recipe array to prepare for new search results
  clearArray(recipeArray);

  let query;

  // Determine the search query based on the clicked button's text content
  if (btn.textContent === "All") {
    query = `${ALL_RECIPES}`;
    recipeSearch(query);
  } else {
    query = btn.textContent;
    recipeSearch(query);
  }

  // Reset pagination buttons to default state
  resetPaginationBtns();
});

/**
 * Event listener for handling form submissions in the search field.
 *
 * @param {Event} e - The submit event.
 */
searchField.addEventListener("submit", function (e) {
  // Prevent the default form submission behavior
  e.preventDefault();

  // Get the search value from the input field, convert to lowercase, and capitalize the first letter
  const value = document.querySelector(".search-field").value.toLowerCase();
  const correctValue = value.charAt(0).toUpperCase() + value.slice(1);

  // Clear the search input field
  document.querySelector(".search-field").value = "";

  // Reset the pagination buttons to default state
  paginationButtons.forEach((btn) =>
    btn.classList.remove("btn-pagination-active")
  );
  paginationButtons[0].classList.add("btn-pagination-active");

  // Remove "btn-active" class from all recipe navigation buttons and add it to buttons that match the search value
  recipeButtons.forEach((btn) => {
    btn.classList.remove("btn-active");
    if (btn.textContent.includes(correctValue)) btn.classList.add("btn-active");
  });

  // Clear the recipe array to prepare for new search results
  clearArray(recipeArray);

  // Perform a recipe search based on the corrected search value
  recipeSearch(correctValue);

  // Reset pagination buttons to default state
  resetPaginationBtns();
});

/**
 * Event listener for handling bookmark button clicks.
 */
bookmarkBtn.addEventListener("click", function () {
  bookmarkList.innerHTML = "";
  if (bookmarksContainer.style.visibility === "visible")
    bookmarksContainer.style.visibility = "hidden";
  else {
    bookmarksContainer.style.visibility = "visible";
    renderBookmarks();
  }
});

/**
 * Updates the total number of recipes displayed on the page.
 *
 * @param {Array} array - The array containing recipes.
 */
const getTotalRecipes = function (array) {
  const newArray = array.map(Object.values);
  recipeNumber.textContent = newArray.length.toLocaleString();
};

/**
 * Renders bookmarks in the bookmarks container.
 */
const renderBookmarks = function () {
  // Check if there are no bookmarks
  if (bookmarksArray.length === 0) {
    // Display a message if there are no bookmarks
    const markup = `
      <li class="bookmark-item" ">
        <svg class="icon-clock">
          <use href="${icons}#icon-alert-triangle"></use>
        </svg>
        <div class="bookmark-div">
          <h3 class="bookmark-title">No bookmarks yet</h3>
          <p class="bookmark-publisher">Please add a bookmark first!</p>
        </div>
      </li>`;

    // Insert the message markup into the bookmark list container
    bookmarkList.insertAdjacentHTML("afterbegin", markup);
  } else {
    // Loop through each bookmark and generate HTML markup
    bookmarksArray.forEach((bookmark) => {
      const markup = `
        <li class="bookmark-item" data-id="${bookmark.id}">
          <img class="bookmark-image" src="${bookmark.imageUrl}" alt="${bookmark.title}" />
          <div class="bookmark-div">
            <h3 class="bookmark-title">${bookmark.title}</h3>
            <p class="bookmark-publisher">${bookmark.publisher}</p>
          </div>
        </li>`;

      // Insert the bookmark markup at the beginning of the bookmark list container
      bookmarkList.insertAdjacentHTML("afterbegin", markup);
    });
  }

  // Get all bookmark items from the DOM
  const allBookmarks = Array.from(document.querySelectorAll(".bookmark-item"));

  // Check if there are no bookmarks
  if (allBookmarks.length === 0) return;

  // Attach a click event listener to each bookmark item
  allBookmarks.forEach((bookmark) => {
    bookmark.addEventListener("click", function (e) {
      // Get the recipe ID from the clicked bookmark item
      recipeID = bookmark.dataset.id;

      // Check if the click was on the trash icon
      if (e.target.closest(".icon-trash")) {
        // Remove the bookmark from the bookmarksArray
        bookmarksArray.splice(
          bookmarksArray.findIndex((bookmark) => bookmark.id === recipeID),
          1
        );
      } else {
        // Open the modal for the clicked bookmark
        openModal();
      }
    });
  });
};

/**
 * Adds overlay functionality to recipe elements, displaying buttons on hover.
 */
const loadOverlay = function () {
  // Get all elements with the class "recipe-overlay"
  const recipeOverlay = document.querySelectorAll(".recipe-overlay");

  // Attach event listeners to each recipe overlay element
  recipeOverlay.forEach((overlay) => {
    // Event listener for mouseover (hover) on the recipe overlay
    overlay.addEventListener("mouseover", function (e) {
      // Get the buttons inside the recipe overlay
      const btns = overlay.children[0].children;

      // Get the recipe ID from the closest ancestor with class "recipe-entire"
      recipeID = overlay.closest(".recipe-entire").children[1].dataset.id;

      // Attach click event listeners to the buttons
      btns[0].addEventListener("click", openModal);
      btns[1].addEventListener("click", function () {
        addBookmark(btns[1]);
      });

      // Remove the "hidden" class from all buttons inside the overlay
      Array.from(overlay.children[0].children).forEach((btn) => {
        btn.classList.remove("hidden");
      });
    });

    // Event listener for mouseout (hover out) from the recipe overlay
    overlay.addEventListener("mouseout", function () {
      // Add the "hidden" class to all buttons inside the overlay
      Array.from(overlay.children[0].children).forEach((btn) => {
        btn.classList.add("hidden");
      });
    });
  });
};

/**
 * Fetches recipe details, creates a bookmark, and adds it to the bookmarks array.
 * Handles the case where the bookmark already exists in the array.
 */
const addBookmark = async function (btn) {
  try {
    btn.classList.add("animate");
    setTimeout(() => {
      btn.classList.remove("animate");
    }, 600);
    // Fetch recipe details from the Forkify API using the recipeID
    const res = await fetch(
      `https://forkify-api.herokuapp.com/api/v2/recipes/${recipeID}`
    );
    const { data } = await res.json();
    const recipe = data.recipe;

    // Create a new bookmark recipe object
    const newRecipe = createRecipe(recipe);
    newRecipe.bookmark = true;

    // Check if the new recipe is unique by comparing with existing bookmarks
    const isObjectUnique = bookmarksArray.every(
      (item) => JSON.stringify(item) !== JSON.stringify(newRecipe)
    );

    // Add the new recipe to bookmarksArray if it is unique
    if (isObjectUnique) {
      bookmarksArray.push(newRecipe);
    }
  } catch (err) {
    // Log an error if there is an issue with fetching or processing data
    console.error(err);
  }
};

/**
 * Fetches recipe details, generates modal markup, and displays the modal.
 * Adds event listeners to close the modal on button click, pressing the Escape key, or clicking outside the modal.
 */
const openModal = async function () {
  try {
    // Fetch recipe details from the Forkify API using the recipeID
    const res = await fetch(
      `https://forkify-api.herokuapp.com/api/v2/recipes/${recipeID}`
    );
    const { data } = await res.json();
    const recipe = data.recipe;

    // Generate HTML markup for the recipe modal
    const markup = generateModalMarkup(recipe);

    // Insert the modal markup into the recipeContainer
    recipeContainer.insertAdjacentHTML("afterbegin", markup);

    // Get references to modal elements
    const exitModalBtn = document.querySelector(".exit-modal");
    const modal = document.querySelector(".modal-container");

    // Show the modal and remove the hidden class from the background overlay
    modal.style.opacity = 1;
    background.classList.remove("hidden");

    // Add event listeners to close the modal
    exitModalBtn.addEventListener("click", function () {
      closeModal(modal);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        closeModal(modal);
      }
    });
    background.addEventListener("click", function () {
      closeModal(modal);
    });
  } catch (err) {
    // Log an error if there is an issue with fetching or processing data
    console.error(err);
  }
};

/**
 * Closes the modal by removing it from the DOM and hiding the background overlay.
 *
 * @param {HTMLElement} modal - The modal element to be closed.
 */
const closeModal = function (modal) {
  modal.remove();
  background.classList.add("hidden");
};

/**
 * Generates HTML markup for displaying a recipe modal.
 *
 * @param {Object} recipe - The recipe object containing details for the modal.
 * @returns {string} - The HTML markup for the recipe modal.
 */
const generateModalMarkup = function (recipe) {
  return `
  <div class="modal-container">
      <div class="modal-image-container">
      <button class="exit-modal">×</button>
        <img class="modal-image" src="${recipe.image_url}" alt="" />
      </div>
      <h2 class="modal-title">${recipe.title}</h2>
      <div class="modal-info-container">
        <p class="modal-time">
          <svg class="icon-clock">
            <use href="${icons}#icon-clock"></use></svg
          >${recipe.cooking_time} minutes
        </p>
        <p class="modal-servings">
          <svg class="icon-users">
            <use href="${icons}#icon-users"></use></svg
          >${recipe.servings} servings
        </p>
      </div>
      <h3 class="modal-recipe-title">Recipe Ingredients</h3>
      <ul class="modal-ingredient-list">
        ${recipe.ingredients.map(generateMarkupIngredient).join("")}
      </ul>
      <a class="btn modal-recipe-button" href="${
        recipe.source_url
      }" target="_blank">Directions</a>
    </div>
  `;
};

/**
 * Click event handler for window clicks.
 *
 * @param {MouseEvent} event - The click event.
 */
window.onclick = (event) => {
  if (!event.target.matches(".btn-bookmarks")) {
    if (bookmarksContainer.style.visibility === "visible") {
      bookmarksContainer.style.visibility = "hidden";
    }
  }
};

/**
 * Generates HTML markup for displaying an ingredient in the recipe modal.
 *
 * @param {Object} ing - The ingredient object containing details to display.
 * @returns {string} - The HTML markup for the ingredient in the recipe modal.
 */
const generateMarkupIngredient = function (ing) {
  return `
  <li class="modal-ingredient">${ing.quantity ? ing.quantity : ""} ${
    ing.unit
  } ${ing.description}</li>
  `;
};

/**
 * Initializes the application by performing an initial recipe search and hiding the previous button.
 */
const init = function () {
  recipeSearch(ALL_RECIPES);
  previousBtn.style.display = "none";
};

init();
