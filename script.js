(() => {
  const GENERAL_STORAGE_KEY = 'generalActions';
  const SCHEDULING_STORAGE_KEY = 'schedulingActions';
  const NEXT_NUMBER_STORAGE_KEY = 'nextActionNumber';
  const LEGACY_STORAGE_KEY = 'generalActions.v1';
  const DEFAULT_NEXT_NUMBER = 137;

  const modal = document.getElementById('action-modal');
  const modalBackdrop = document.getElementById('action-modal-backdrop');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalSaveBtn = document.getElementById('modal-save-btn');
  const modalTitle = document.getElementById('modal-title');
  const modalStatus = document.getElementById('modal-status');
  const modalTextInput = document.getElementById('modal-text-input');

  const lists = {
    general: {
      key: GENERAL_STORAGE_KEY,
      showDates: true,
      actions: [],
      form: document.getElementById('general-add-action-form'),
      input: document.getElementById('general-action-input'),
      listEl: document.getElementById('general-action-list'),
      clearBtn: document.getElementById('general-clear-completed-btn'),
      name: 'General',
    },
    scheduling: {
      key: SCHEDULING_STORAGE_KEY,
      showDates: false,
      actions: [],
      form: document.getElementById('scheduling-add-action-form'),
      input: document.getElementById('scheduling-action-input'),
      listEl: document.getElementById('scheduling-action-list'),
      clearBtn: document.getElementById('scheduling-clear-completed-btn'),
      name: 'Scheduling',
    },
  };

  let nextActionNumber = DEFAULT_NEXT_NUMBER;
  let activeModalContext = null;

  function formatLocalDate(timestamp) {
    if (!timestamp) {
      return '--/--';
    }

    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  }

  function buildPrefix(action) {
    if (action.deleted) {
      return `<span class="prefix-mark">X</span>${formatLocalDate(action.deletedAt)}`;
    }

    if (action.completed) {
      return `<span class="prefix-mark">C</span>${formatLocalDate(action.completedAt)}`;
    }

    return formatLocalDate(action.createdAt);
  }

  function normalizeAction(item) {
    const number = Number(item.number);
    const text = typeof item.text === 'string' ? item.text.trim() : '';

    if (!Number.isInteger(number) || !text) {
      return null;
    }

    const createdAt = Number(item.createdAt) || Date.now();
    const completed = Boolean(item.completed);
    const deleted = Boolean(item.deleted);

    return {
      number,
      text,
      createdAt,
      completed,
      deleted,
      urgent: Boolean(item.urgent),
      completedAt: completed ? Number(item.completedAt) || createdAt : null,
      deletedAt: deleted ? Number(item.deletedAt) || createdAt : null,
    };
  }

  function saveList(list) {
    localStorage.setItem(list.key, JSON.stringify(list.actions));
  }

  function saveNextNumber() {
    localStorage.setItem(NEXT_NUMBER_STORAGE_KEY, String(nextActionNumber));
  }

  function loadList(list) {
    try {
      const raw = localStorage.getItem(list.key);
      if (!raw) {
        list.actions = [];
        return;
      }

      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        list.actions = parsed.map(normalizeAction).filter(Boolean);
      } else {
        list.actions = [];
      }
    } catch {
      list.actions = [];
    }
  }

  function migrateLegacyGeneralData() {
    if (localStorage.getItem(GENERAL_STORAGE_KEY)) {
      return;
    }

    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!legacyRaw) {
      return;
    }

    try {
      const parsed = JSON.parse(legacyRaw);
      if (Array.isArray(parsed.actions)) {
        lists.general.actions = parsed.actions.map(normalizeAction).filter(Boolean);
        saveList(lists.general);
      }

      if (!localStorage.getItem(NEXT_NUMBER_STORAGE_KEY) && Number.isInteger(parsed.nextNumber) && parsed.nextNumber > 0) {
        nextActionNumber = parsed.nextNumber;
        saveNextNumber();
      }
    } catch {
      // Keep defaults if migration fails.
    }
  }

  function loadData() {
    const storedNext = Number(localStorage.getItem(NEXT_NUMBER_STORAGE_KEY));
    if (Number.isInteger(storedNext) && storedNext > 0) {
      nextActionNumber = storedNext;
    }

    migrateLegacyGeneralData();

    loadList(lists.general);
    loadList(lists.scheduling);

    const highestNumber = Math.max(
      DEFAULT_NEXT_NUMBER - 1,
      ...lists.general.actions.map((item) => item.number),
      ...lists.scheduling.actions.map((item) => item.number),
    );

    if (nextActionNumber <= highestNumber) {
      nextActionNumber = highestNumber + 1;
      saveNextNumber();
    }
  }

  function sortNewestFirst(a, b) {
    return b.createdAt - a.createdAt || b.number - a.number;
  }

  function getOrderedActions(list) {
    const incompleteUrgent = list.actions
      .filter((item) => !item.deleted && !item.completed && item.urgent)
      .sort(sortNewestFirst);

    const incompleteNormal = list.actions
      .filter((item) => !item.deleted && !item.completed && !item.urgent)
      .sort(sortNewestFirst);

    const completed = list.actions
      .filter((item) => !item.deleted && item.completed)
      .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0) || b.number - a.number);

    const deleted = list.actions
      .filter((item) => item.deleted)
      .sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0) || b.number - a.number);

    return [...incompleteUrgent, ...incompleteNormal, ...completed, ...deleted];
  }

  function updateRowTruncation(row) {
    const textEl = row.querySelector('.action-text');
    const toggleBtn = row.querySelector('.action-text-toggle');
    if (!textEl || !toggleBtn) {
      return;
    }

    const isTruncated = textEl.scrollWidth > textEl.clientWidth + 1;
    toggleBtn.hidden = !isTruncated;
  }

  function updateAllTruncation() {
    document.querySelectorAll('.action-item').forEach((row) => {
      updateRowTruncation(row);
    });
  }

  function renderList(list) {
    list.listEl.innerHTML = '';

    const orderedActions = getOrderedActions(list);
    if (!orderedActions.length) {
      const empty = document.createElement('li');
      empty.className = 'coming-soon';
      empty.textContent = 'No actions yet. Add one to get started.';
      list.listEl.appendChild(empty);
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
      if (action.urgent && !action.deleted && !action.completed) {
        li.classList.add('urgent');
      }

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = action.completed;
      checkbox.disabled = action.deleted;
      checkbox.setAttribute('aria-label', `Mark action ${action.number} complete`);
      checkbox.addEventListener('change', () => {
        action.completed = checkbox.checked;
        action.completedAt = action.completed ? Date.now() : null;
        saveList(list);
        renderList(list);
      });

      const number = document.createElement('span');
      number.className = 'action-number';
      number.textContent = String(action.number);

      const textWrap = document.createElement('div');
      textWrap.className = 'action-text-wrap';

      if (list.showDates) {
        const prefix = document.createElement('span');
        prefix.className = 'action-date-prefix';
        prefix.innerHTML = `(${buildPrefix(action)})`;
        textWrap.appendChild(prefix);
      }

      const text = document.createElement('span');
      text.className = 'action-text';
      text.textContent = action.text;
      textWrap.appendChild(text);

      const expandBtn = document.createElement('button');
      expandBtn.type = 'button';
      expandBtn.className = 'action-text-toggle';
      expandBtn.textContent = '+';
      expandBtn.hidden = true;
      expandBtn.setAttribute('aria-label', `Expand action ${action.number} details`);
      expandBtn.addEventListener('click', () => openModal(list, action));
      textWrap.appendChild(expandBtn);

      const controls = document.createElement('div');
      controls.className = 'action-controls';

      const urgentBtn = document.createElement('button');
      urgentBtn.type = 'button';
      urgentBtn.className = 'icon-btn urgent-btn';
      urgentBtn.textContent = '!';
      urgentBtn.disabled = action.deleted;
      urgentBtn.classList.toggle('active', action.urgent);
      urgentBtn.setAttribute('aria-label', action.urgent ? `Remove urgent from action ${action.number}` : `Mark action ${action.number} urgent`);
      urgentBtn.addEventListener('click', () => {
        action.urgent = !action.urgent;
        saveList(list);
        renderList(list);
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'icon-btn delete-btn';
      deleteBtn.textContent = action.deleted ? 'UD' : 'X';
      deleteBtn.setAttribute('aria-label', action.deleted ? `Undelete action ${action.number}` : `Delete action ${action.number}`);
      deleteBtn.addEventListener('click', () => {
        if (action.deleted) {
          action.deleted = false;
          action.deletedAt = null;
        } else {
          action.deleted = true;
          action.deletedAt = Date.now();
        }

        saveList(list);
        renderList(list);
      });

      controls.append(urgentBtn, deleteBtn);
      li.append(checkbox, number, textWrap, controls);
      list.listEl.appendChild(li);

      requestAnimationFrame(() => updateRowTruncation(li));
    });
  }

  function renderAll() {
    renderList(lists.general);
    renderList(lists.scheduling);
  }

  function addAction(list, rawText) {
    const text = rawText.trim();
    if (!text) {
      return;
    }

    list.actions.unshift({
      number: nextActionNumber,
      text,
      createdAt: Date.now(),
      completed: false,
      deleted: false,
      urgent: false,
      completedAt: null,
      deletedAt: null,
    });

    nextActionNumber += 1;
    saveList(list);
    saveNextNumber();
    renderList(list);
  }

  function modalStatusText(action) {
    if (action.deleted) {
      return 'Status: deleted';
    }
    if (action.completed) {
      return 'Status: completed';
    }
    if (action.urgent) {
      return 'Status: urgent';
    }
    return 'Status: active';
  }

  function openModal(list, action) {
    activeModalContext = { list, action };
    modalTitle.textContent = `${list.name} action #${action.number}`;
    modalStatus.textContent = modalStatusText(action);
    modalTextInput.value = action.text;
    modal.hidden = false;
    modalTextInput.focus();
    modalTextInput.setSelectionRange(modalTextInput.value.length, modalTextInput.value.length);
  }

  function closeModal() {
    modal.hidden = true;
    activeModalContext = null;
  }

  function saveModalChanges() {
    if (!activeModalContext) {
      return;
    }

    const { list, action } = activeModalContext;
    const value = modalTextInput.value.trim();
    if (!value) {
      modalTextInput.focus();
      return;
    }

    action.text = value;
    saveList(list);
    renderList(list);
    closeModal();
  }

  function bindListEvents(list) {
    list.form.addEventListener('submit', (event) => {
      event.preventDefault();
      addAction(list, list.input.value);
      list.form.reset();
      list.input.focus();
    });

    list.input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        list.form.requestSubmit();
      }
    });

    list.clearBtn.addEventListener('click', () => {
      list.actions = list.actions.filter((item) => item.deleted || !item.completed);
      saveList(list);
      renderList(list);
    });
  }

  modalSaveBtn.addEventListener('click', saveModalChanges);
  modalCloseBtn.addEventListener('click', closeModal);
  modalBackdrop.addEventListener('click', closeModal);
  window.addEventListener('keydown', (event) => {
    if (!modal.hidden && event.key === 'Escape') {
      closeModal();
    }
  });

  window.addEventListener('resize', () => {
    updateAllTruncation();
  });

  bindListEvents(lists.general);
  bindListEvents(lists.scheduling);
  loadData();
  renderAll();
})();
