const tagButtons = Array.from(document.querySelectorAll("[data-tag]"));
const articles = Array.from(document.querySelectorAll(".blog-card"));
const resultCount = document.querySelector("#blog-result-count");
const emptyMessage = document.querySelector("#blog-empty");

function updateArticleList(selectedTag) {
  let visibleCount = 0;

  articles.forEach((article) => {
    const tags = (article.dataset.tags || "").split("|");
    const isVisible = !selectedTag || tags.includes(selectedTag);

    article.hidden = !isVisible;
    if (isVisible) {
      visibleCount += 1;
    }
  });

  resultCount.textContent = `${visibleCount}件の記事`;
  emptyMessage.hidden = visibleCount !== 0;
}

tagButtons.forEach((button) => {
  button.addEventListener("click", () => {
    tagButtons.forEach((item) => {
      const isActive = item === button;
      item.classList.toggle("active", isActive);
      item.setAttribute("aria-pressed", String(isActive));
    });

    updateArticleList(button.dataset.tag);
  });
});
