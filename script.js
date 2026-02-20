(() => {
  const loadedAtEl = document.getElementById('loaded-at');
  const locationEl = document.getElementById('location');
  const checkBtn = document.getElementById('check-btn');
  const resultEl = document.getElementById('check-result');

  let count = 0;

  loadedAtEl.textContent = `Loaded at: ${new Date().toLocaleString()}`;
  locationEl.textContent = `URL: ${window.location.href}`;

  checkBtn.addEventListener('click', () => {
    count += 1;
    resultEl.textContent = `JS OK: ${count}`;
  });
})();
