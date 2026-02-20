(() => {
  const loadedAtEl = document.getElementById('loaded-at');
  const locationEl = document.getElementById('location');
  const checkBtn = document.getElementById('check-btn');
  const resultEl = document.getElementById('check-result');

  const actionForm = document.getElementById('add-action-form');
  const actionInput = document.getElementById('action-input');
  const actionList = document.getElementById('action-list');
  const clearCompletedBtn = document.getElementById('clear-completed-btn');

  const STORAGE_KEY = 'generalActions.v1';
  const DEFAULT_NEXT_NUMBER = 137;

  let count = 0;
  let actions = [];
  let nextNumber = DEFAULT_NEXT_NUMBER;

  loadedAtEl.textContent = `Loaded at: ${new Date().toLocaleString()}`;
  locationEl.textContent = `URL: ${window.location.href}`;

  checkBtn.addEventListener('click', () => {
    count += 1;
    resultEl.textContent = `JS OK: ${count}`;
  });

  function saveActions() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        actions,
        nextNumber,
      }),
    );
  }

  function loadActions() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.actions)) {
        actions = parsed.actions
          .filter((item) => Number.isInteger(item.number) && typeof item.text === 'string')
          .map((item) => ({
            number: item.number,
            text: item.text,
            completed: Boolean(item.completed),
          }));
      }

      if (Number.isInteger(parsed.nextNumber) && parsed.nextNumber > 0) {
        nextNumber = parsed.nextNumber;
      }
    } catch {
      actions = [];
      nextNumber = DEFAULT_NEXT_NUMBER;
    }
  }

  function renderActions() {
    actionList.innerHTML = '';

    if (!actions.length) {
      const empty = document.createElement('li');
      empty.className = 'coming-soon';
      empty.textContent = 'No actions yet. Add one to get started.';
      actionList.appendChild(empty);
      return;
    }

    actions.forEach((action) => {
      const li = document.createElement('li');
      li.className = 'action-item';
      if (action.completed) {
        li.classList.add('completed');
      }

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = action.completed;
      checkbox.setAttribute('aria-label', `Mark action ${action.number} complete`);
      checkbox.addEventListener('change', () => {
        action.completed = checkbox.checked;
        li.classList.toggle('completed', action.completed);
        saveActions();
      });

      const number = document.createElement('span');
      number.className = 'action-number';
      number.textContent = String(action.number);

      const textInput = document.createElement('input');
      textInput.type = 'text';
      textInput.className = 'action-text';
      textInput.value = action.text;
      textInput.maxLength = 200;
      textInput.setAttribute('aria-label', `Action ${action.number} description`);

      let editTimer;
      const queueSave = () => {
        clearTimeout(editTimer);
        editTimer = window.setTimeout(() => {
          action.text = textInput.value.trim();
          saveActions();
        }, 250);
      };

      textInput.addEventListener('input', queueSave);
      textInput.addEventListener('blur', () => {
        clearTimeout(editTimer);
        action.text = textInput.value.trim();
        saveActions();
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'delete-btn';
      deleteBtn.textContent = 'Delete';
      deleteBtn.setAttribute('aria-label', `Delete action ${action.number}`);
      deleteBtn.addEventListener('click', () => {
        actions = actions.filter((item) => item.number !== action.number);
        saveActions();
        renderActions();
      });

      li.append(checkbox, number, textInput, deleteBtn);
      actionList.appendChild(li);
    });
  }

  function addAction(text) {
    const value = text.trim();
    if (!value) {
      return;
    }

    actions.push({
      number: nextNumber,
      text: value,
      completed: false,
    });
    nextNumber += 1;
    saveActions();
    renderActions();
  }

  actionForm.addEventListener('submit', (event) => {
    event.preventDefault();
    addAction(actionInput.value);
    actionForm.reset();
    actionInput.focus();
  });

  clearCompletedBtn.addEventListener('click', () => {
    actions = actions.filter((item) => !item.completed);
    saveActions();
    renderActions();
  });

  loadActions();
  renderActions();
})();
