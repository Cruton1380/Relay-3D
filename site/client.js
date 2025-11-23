import './dropzone/dropzone.js'
import './modal/relay-modal.js'
import './movies/movie-viewer.js'
import './movies/movie-search.js'
import './movies/movie-upsert.js'


// Mount a movie viewer just below the main header if present
window.addEventListener('DOMContentLoaded', () => {
    const article = document.querySelector('article.themed') || document.querySelector('article');
    if (!article) return;
    // Avoid duplicates
    if (article.querySelector('movie-viewer')) return;
    const header = article.querySelector('header');
    const viewer = document.createElement('movie-viewer');
    if (header && header.nextSibling) {
        article.insertBefore(viewer, header.nextSibling);
    } else {
        article.appendChild(viewer);
    }
});
