(() => {
  const actionForm = document.getElementById('add-action-form');
  const actionInput = document.getElementById('action-input');
  const actionList = document.getElementById('action-list');
  const clearCompletedBtn = document.getElementById('clear-completed-btn');

  const STORAGE_KEY = 'generalActions.v1';
  const DEFAULT_NEXT_NUMBER = 137;

  let actions = [];
  let nextNumber = DEFAULT_NEXT_NUMBER;

  function formatLocalDate(timestamp) {
    if (!timestamp) {
      return '--/--';
    }

    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  }

  function saveActions() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        actions,
        nextNumber,
      }),
    );
  }

  function normalizeAction(item) {
    const number = Number(item.number);
    const text = typeof item.text === 'string' ? item.text.trim() : '';

    if (!Number.isInteger(number) || !text) {
      return null;
    }

    const createdAt = Number(item.createdAt) || Date.now();
    const deleted = Boolean(item.deleted);
    const completed = deleted ? false : Boolean(item.completed);

    return {
      number,
      text,
      createdAt,
      completed,
      deleted,
      completedAt: completed ? Number(item.completedAt) || createdAt : null,
      deletedAt: deleted ? Number(item.deletedAt) || Date.now() : null,
    };
  }

  function loadActions() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.actions)) {
        actions = parsed.actions.map(normalizeAction).filter(Boolean);
      }

      if (Number.isInteger(parsed.nextNumber) && parsed.nextNumber > 0) {
        nextNumber = parsed.nextNumber;
      }
    } catch {
      actions = [];
      nextNumber = DEFAULT_NEXT_NUMBER;
    }
  }

  function getOrderedActions() {
    const incomplete = actions
      .filter((item) => !item.deleted && !item.completed)
      .sort((a, b) => b.createdAt - a.createdAt || b.number - a.number);

    const completed = actions
      .filter((item) => !item.deleted && item.completed)
      .sort((a, b) => (a.completedAt || 0) - (b.completedAt || 0) || a.number - b.number);

    const deleted = actions
      .filter((item) => item.deleted)
      .sort((a, b) => (a.deletedAt || 0) - (b.deletedAt || 0) || a.number - b.number);

    return [...incomplete, ...completed, ...deleted];
  }

  function buildPrefix(action) {
    if (action.deleted) {
      return `(X ${formatLocalDate(action.deletedAt)})`;
    }

    if (action.completed) {
      return `(C ${formatLocalDate(action.completedAt)})`;
    }

    return `(${formatLocalDate(action.createdAt)})`;
  }

  function renderActions() {
    actionList.innerHTML = '';

    const orderedActions = getOrderedActions();

    if (!orderedActions.length) {
      const empty = document.createElement('li');
      empty.className = 'coming-soon';
      empty.textContent = 'No actions yet. Add one to get started.';
      actionList.appendChild(empty);
      return;
    }

    orderedActions.forEach((action) => {
      const li = document.createElement('li');
      li.className = 'action-item';

      if (action.completed) {
        li.classList.add('completed');
      }

      if (action.deleted) {
        li.classList.add('deleted');
      }

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = action.completed;
      checkbox.disabled = action.deleted;
      checkbox.setAttribute('aria-label', `Mark action ${action.number} complete`);
      checkbox.addEventListener('change', () => {
        action.completed = checkbox.checked;
        if (action.completed) {
          action.completedAt = Date.now();
        } else {
          action.completedAt = null;
        }

        saveActions();
        renderActions();
      });

      const number = document.createElement('span');
      number.className = 'action-number';
      number.textContent = String(action.number);

      const textWrap = document.createElement('div');
      textWrap.className = 'action-text-wrap';

      const prefix = document.createElement('span');
      prefix.className = 'action-date-prefix';
      prefix.textContent = buildPrefix(action);

      const textInput = document.createElement('textarea');
      textInput.className = 'action-text';
      textInput.value = action.text;
      textInput.maxLength = 200;
      textInput.disabled = action.deleted;
      textInput.setAttribute('aria-label', `Action ${action.number} description`);


      const autosizeTextInput = () => {
        textInput.style.height = 'auto';
        textInput.style.height = `${textInput.scrollHeight}px`;
      };

      let editTimer;
      const queueSave = () => {
        clearTimeout(editTimer);
        editTimer = window.setTimeout(() => {
          action.text = textInput.value.trim();
          saveActions();
        }, 250);
      };

      textInput.addEventListener('input', () => {
        autosizeTextInput();
        queueSave();
      });
      textInput.addEventListener('blur', () => {
        clearTimeout(editTimer);
        action.text = textInput.value.trim();
        saveActions();
      });

      autosizeTextInput();

      textWrap.append(prefix, textInput);

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'delete-btn';
      deleteBtn.textContent = 'X';
      deleteBtn.disabled = action.deleted;
      deleteBtn.setAttribute('aria-label', `Delete action ${action.number}`);
      deleteBtn.addEventListener('click', () => {
        action.deleted = true;
        action.deletedAt = Date.now();
        action.completed = false;
        action.completedAt = null;
        saveActions();
        renderActions();
      });

      li.append(checkbox, number, textWrap, deleteBtn);
      actionList.appendChild(li);
    });
  }

  function addAction(text) {
    const value = text.trim();
    if (!value) {
      return;
    }

    actions.unshift({
      number: nextNumber,
      text: value,
      createdAt: Date.now(),
      completed: false,
      deleted: false,
      completedAt: null,
      deletedAt: null,
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
    actions = actions.filter((item) => item.deleted || !item.completed);
    saveActions();
    renderActions();
  });

  loadActions();
  renderActions();
})();
