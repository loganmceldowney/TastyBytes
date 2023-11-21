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

let recipeID;
let recipeArray = [];
let bookmarksArray = [];
let totalPages;

const createRecipe = function (data) {
  return {
    id: data.id,
    title: data.title,
    imageUrl: data.image_url,
    publisher: data.publisher,
    bookmark: false,
  };
};

const clearContainer = function (container) {
  container.innerHTML = "";
};

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

const getItemsForPage = function (array, currentPage, itemsPerPage = 12) {
  const startIndex = (+currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return array.slice(startIndex, endIndex);
};

const renderError = function (container, message) {
  const markup = `<div class="error"><svg class="icon-error">
  <use href="${icons}#icon-alert-triangle"></use></svg
  >${message}</div>`;
  container.insertAdjacentHTML("afterbegin", markup);
};

const recipeSearch = async function (query) {
  try {
    const res = await fetch(`${API_URL}?search=${query}`);
    const { data } = await res.json();
    const recipes = data.recipes;
    recipes.forEach((rec) => {
      recipeArray.push(createRecipe(rec));
    });
    totalPages = Math.ceil(recipeArray.length / RES_PER_PAGE);

    getTotalRecipes(recipeArray);

    if (query === `${ALL_RECIPES}`) {
      // recipeArray = randomizeArray(recipeArray);
    }

    clearContainer(recipeContainer);
    if (totalPages === 0) {
      console.log(recipeContainer);
      renderError(
        recipeContainer,
        "Could not find any recipes, please try again!"
      );
    }

    showRecipes(recipeArray);
  } catch (err) {
    console.log(err);
  }
};

const clearArray = function (array) {
  array.length = 0;
};

const showRecipes = function (array) {
  const curPageRecipes = getItemsForPage(array, getCurrentPage());
  curPageRecipes.forEach((rec) => {
    recipeContainer.insertAdjacentHTML("afterbegin", generateMarkup(rec));
  });
  loadOverlay();
  if (totalPages < 1) {
    nextBtn.style.display = "none";
  }
};

const resetPaginationBtns = function () {
  paginationButtonContainer.dataset.currentpage = 1;
  pageNum.textContent = paginationButtonContainer.dataset.currentpage;
  previousBtn.style.display = "none";
  nextBtn.style.display = "block";
};

const getCurrentPage = function () {
  const curPage = paginationButtonContainer.dataset.currentpage;
  return curPage;
};

paginationContainer.addEventListener("click", function (e) {
  e.preventDefault();
  const elementToScrollTo = document.querySelector(".heading-primary");
  const btn = e.target.closest(".btn-pagination");
  if (!btn) return;
  nextBtn.style.display = "block";
  previousBtn.style.display = "block";
  if (btn === nextBtn) {
    paginationButtonContainer.dataset.currentpage =
      +paginationButtonContainer.dataset.currentpage + 1;
  }
  if (btn === previousBtn) {
    paginationButtonContainer.dataset.currentpage =
      +paginationButtonContainer.dataset.currentpage - 1;
  }

  if (+paginationButtonContainer.dataset.currentpage >= totalPages) {
    nextBtn.style.display = "none";
  }
  if (+paginationButtonContainer.dataset.currentpage === 1) {
    previousBtn.style.display = "none";
  }

  pageNum.textContent = +paginationButtonContainer.dataset.currentpage;
  clearContainer(recipeContainer);
  showRecipes(recipeArray);
  elementToScrollTo.scrollIntoView({ behavior: "smooth" });
});

recipeButtonContainer.addEventListener("click", function (e) {
  e.preventDefault();
  const btn = e.target.closest(".btn-recipe-nav");
  if (!btn || btn.classList.contains("btn-active")) return;
  recipeButtons.forEach((btn) => btn.classList.remove("btn-active"));
  btn.classList.add("btn-active");
  clearArray(recipeArray);
  let query;
  if (btn.textContent === "All") {
    query = `${ALL_RECIPES}`;
    recipeSearch(query);
  } else if (btn.textContent === "Bookmarks") {
    totalPages = Math.ceil(bookmarksArray.length / RES_PER_PAGE);
    console.log(bookmarksArray);
    if (bookmarksArray.length === 0) {
      clearContainer(recipeContainer);
      renderError(
        recipeContainer,
        "No bookmarks yet. Find a nice recipe and bookmark it!"
      );
      getTotalRecipes(bookmarksArray);
    } else {
      console.log(totalPages);
      clearContainer(recipeContainer);
      getTotalRecipes(bookmarksArray);
      showRecipes(bookmarksArray);
    }
  } else {
    query = btn.textContent;
    recipeSearch(query);
  }
  resetPaginationBtns();
});

searchField.addEventListener("submit", function (e) {
  e.preventDefault();
  const value = document.querySelector(".search-field").value.toLowerCase();
  const correctValue = value.charAt(0).toUpperCase() + value.slice(1);
  document.querySelector(".search-field").value = "";

  paginationButtons.forEach((btn) =>
    btn.classList.remove("btn-pagination-active")
  );
  paginationButtons[0].classList.add("btn-pagination-active");

  recipeButtons.forEach((btn) => {
    btn.classList.remove("btn-active");
    if (btn.textContent.includes(correctValue)) btn.classList.add("btn-active");
  });
  recipeArray.length = 0;
  recipeSearch(correctValue);
  resetPaginationBtns();
});

const getTotalRecipes = function (array) {
  recipeNumber.textContent = array.length.toLocaleString();
};

const loadOverlay = function () {
  const recipeOverlay = document.querySelectorAll(".recipe-overlay");
  recipeOverlay.forEach((overlay) => {
    overlay.addEventListener("mouseover", function (e) {
      const btns = overlay.children[0].children;
      recipeID = overlay.closest(".recipe-entire").children[1].dataset.id;

      btns[0].addEventListener("click", openModal);
      btns[1].addEventListener("click", addBookmark);

      Array.from(overlay.children[0].children).forEach((btn) => {
        btn.classList.remove("hidden");
      });
    });
    overlay.addEventListener("mouseout", function () {
      Array.from(overlay.children[0].children).forEach((btn) => {
        btn.classList.add("hidden");
      });
    });
  });
};

const addBookmark = async function () {
  try {
    const res = await fetch(
      `https://forkify-api.herokuapp.com/api/v2/recipes/${recipeID}`
    );
    const { data } = await res.json();
    const recipe = createRecipe(data.recipe);
    recipe.bookmark = true;
    console.log(recipe);
    bookmarksArray.push(recipe);
  } catch (err) {
    console.error(err);
  }
};

const openModal = async function () {
  try {
    const res = await fetch(
      `https://forkify-api.herokuapp.com/api/v2/recipes/${recipeID}`
    );
    const { data } = await res.json();
    const recipe = data.recipe;
    const markup = generateModalMarkup(recipe);
    recipeContainer.insertAdjacentHTML("afterbegin", markup);
    const exitModalBtn = document.querySelector(".exit-modal");
    const modal = document.querySelector(".modal-container");
    modal.style.opacity = 1;
    background.classList.remove("hidden");
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
    console.log(err);
  }
};

const closeModal = function (modal) {
  modal.remove();
  background.classList.add("hidden");
};

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

const generateMarkupIngredient = function (ing) {
  return `
  <li class="modal-ingredient">${ing.quantity ? ing.quantity : ""} ${
    ing.unit
  } ${ing.description}</li>
  `;
};

const init = function () {
  recipeSearch(ALL_RECIPES);
  previousBtn.style.display = "none";
};

init();
