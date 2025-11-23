export default { title: 'Template/Movies/Card' };

export const Card = () => {
  const root = document.createElement('div');
  root.className = 'themed max-w-[400px]';
  root.innerHTML = `
    <div class="card-elevated bg-[color:var(--panel)] overflow-hidden rounded-md">
      <img class="w-full aspect-[2/3] object-cover block" src="https://image.tmdb.org/t/p/w500/qmDpIHrmpJINaRKAfWQfftjCdyi.jpg" alt="Poster" />
      <div class="px-3 py-2">
        <div class="font-semibold text-sm text-[color:var(--text)]">Inception <span class="text-[color:var(--muted)] text-xs">(2010)</span></div>
        <div class="text-[color:var(--muted)] text-xs mt-1">sci-fi, action</div>
      </div>
    </div>
  `;
  return root;
};
