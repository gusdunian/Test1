(() => {
  const GENERAL_STORAGE_KEY = 'generalActions';
  const SCHEDULING_STORAGE_KEY = 'schedulingActions';
  const MEETING_STORAGE_KEY = 'meetingNotes';
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
  const modalUrgencyBtn = document.getElementById('modal-urgency-btn');
  const modalUrgencyLabel = document.getElementById('modal-urgency-label');

  const meeting = {
    items: [],
    expandedId: null,
    editingId: null,
    form: document.getElementById('meeting-add-form'),
    titleInput: document.getElementById('meeting-title-input'),
    dateInput: document.getElementById('meeting-date-input'),
    timeInput: document.getElementById('meeting-time-input'),
    notesInput: document.getElementById('meeting-notes-input'),
    listEl: document.getElementById('meeting-list'),
  };

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

  function formatWeekday(date) {
    return date.toLocaleDateString('en-GB', { weekday: 'short' });
  }

  function formatTime24(date) {
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  function getWeekCommencingMonday(dateInput) {
    const date = new Date(dateInput);
    date.setHours(0, 0, 0, 0);
    const day = date.getDay();
    const offset = day === 0 ? -6 : 1 - day;
    date.setDate(date.getDate() + offset);
    return date;
  }

  function dateToDateValue(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function dateToTimeValue(date) {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  function parseLocalDateTime(dateValue, timeValue) {
    if (!dateValue || !timeValue) {
      return null;
    }

    const [year, month, day] = dateValue.split('-').map(Number);
    const [hour, minute] = timeValue.split(':').map(Number);

    if (![year, month, day, hour, minute].every(Number.isFinite)) {
      return null;
    }

    const parsed = new Date(year, month - 1, day, hour, minute, 0, 0);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
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

  function htmlToPlainText(html) {
    const container = document.createElement('div');
    container.innerHTML = html || '';
    return (container.textContent || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function sanitizeActionHtml(inputHtml) {
    const template = document.createElement('template');
    template.innerHTML = inputHtml || '';
    const allowedTags = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'BR', 'P', 'UL', 'OL', 'LI']);

    function sanitizeNode(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        return document.createTextNode(node.textContent || '');
      }

      if (node.nodeType !== Node.ELEMENT_NODE) {
        return document.createDocumentFragment();
      }

      const tagName = node.tagName.toUpperCase();
      const fragment = document.createDocumentFragment();
      Array.from(node.childNodes).forEach((child) => {
        fragment.appendChild(sanitizeNode(child));
      });

      if (!allowedTags.has(tagName)) {
        return fragment;
      }

      const cleanEl = document.createElement(tagName.toLowerCase());
      cleanEl.appendChild(fragment);
      return cleanEl;
    }

    const output = document.createElement('div');
    Array.from(template.content.childNodes).forEach((node) => {
      output.appendChild(sanitizeNode(node));
    });

    return output.innerHTML.trim();
  }

  function normalizeAction(item) {
    const number = Number(item.number);
    const textSource = typeof item.text === 'string' ? item.text : '';
    const htmlSource = typeof item.html === 'string' ? item.html : '';
    const sanitizedHtml = sanitizeActionHtml(htmlSource || textSource);
    const text = (textSource.trim() || htmlToPlainText(sanitizedHtml)).trim();

    if (!Number.isInteger(number) || !text) {
      return null;
    }

    const createdAt = Number(item.createdAt) || Date.now();
    const completed = Boolean(item.completed);
    const deleted = Boolean(item.deleted);
    const urgency = Number.isInteger(item.urgency) ? Math.max(0, Math.min(2, item.urgency)) : (item.urgent ? 1 : 0);

    return {
      number,
      text,
      html: sanitizedHtml || text,
      createdAt,
      completed,
      deleted,
      urgency,
      completedAt: completed ? Number(item.completedAt) || createdAt : null,
      deletedAt: deleted ? Number(item.deletedAt) || createdAt : null,
    };
  }

  function normalizeMeeting(item) {
    const title = typeof item.title === 'string' ? item.title.trim() : '';
    const notes = typeof item.notes === 'string' ? item.notes : '';
    const date = new Date(item.datetime);
    if (!title || Number.isNaN(date.getTime())) {
      return null;
    }

    const createdAtRaw = item.createdAt ? new Date(item.createdAt) : null;
    const updatedAtRaw = item.updatedAt ? new Date(item.updatedAt) : null;

    return {
      id: typeof item.id === 'string' && item.id ? item.id : `meeting-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title,
      datetime: date.toISOString(),
      notes,
      createdAt: createdAtRaw && !Number.isNaN(createdAtRaw.getTime()) ? createdAtRaw.toISOString() : null,
      updatedAt: updatedAtRaw && !Number.isNaN(updatedAtRaw.getTime()) ? updatedAtRaw.toISOString() : null,
    };
  }

  function saveList(list) {
    localStorage.setItem(list.key, JSON.stringify(list.actions));
  }

  function saveMeetings() {
    localStorage.setItem(MEETING_STORAGE_KEY, JSON.stringify(meeting.items));
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

  function loadMeetings() {
    try {
      const raw = localStorage.getItem(MEETING_STORAGE_KEY);
      if (!raw) {
        meeting.items = [];
        return;
      }

      const parsed = JSON.parse(raw);
      meeting.items = Array.isArray(parsed) ? parsed.map(normalizeMeeting).filter(Boolean) : [];
    } catch {
      meeting.items = [];
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
    loadMeetings();

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
    const incompleteSuperUrgent = list.actions
      .filter((item) => !item.deleted && !item.completed && item.urgency === 2)
      .sort(sortNewestFirst);

    const incompleteUrgent = list.actions
      .filter((item) => !item.deleted && !item.completed && item.urgency === 1)
      .sort(sortNewestFirst);

    const incompleteNormal = list.actions
      .filter((item) => !item.deleted && !item.completed && item.urgency === 0)
      .sort(sortNewestFirst);

    const completed = list.actions
      .filter((item) => !item.deleted && item.completed)
      .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0) || b.number - a.number);

    const deleted = list.actions
      .filter((item) => item.deleted)
      .sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0) || b.number - a.number);

    return [...incompleteSuperUrgent, ...incompleteUrgent, ...incompleteNormal, ...completed, ...deleted];
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

  function getUrgencyLabel(action) {
    if (action.urgency === 2) {
      return 'Super urgent';
    }
    if (action.urgency === 1) {
      return 'Urgent';
    }
    return 'None';
  }

  function cycleUrgency(action) {
    action.urgency = (action.urgency + 1) % 3;
  }

  function updateModalUrgencyUI(action) {
    const label = getUrgencyLabel(action);
    modalUrgencyLabel.textContent = label;
    modalUrgencyBtn.classList.remove('super');
    modalUrgencyBtn.classList.toggle('active', action.urgency === 1);
    if (action.urgency === 2) {
      modalUrgencyBtn.classList.add('super');
      modalUrgencyBtn.textContent = '!!';
    } else if (action.urgency === 1) {
      modalUrgencyBtn.textContent = '!';
    } else {
      modalUrgencyBtn.textContent = '!';
    }
    modalUrgencyBtn.disabled = action.deleted;
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
      if (action.urgency === 1 && !action.deleted && !action.completed) {
        li.classList.add('urgent');
      }
      if (action.urgency === 2 && !action.deleted && !action.completed) {
        li.classList.add('super-urgent');
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
      if (action.urgency === 2 && !action.deleted && !action.completed) {
        text.classList.add('super-urgent-text');
      }
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
      urgentBtn.disabled = action.deleted;
      urgentBtn.textContent = action.urgency === 2 ? '!!' : '!';
      urgentBtn.classList.toggle('active', action.urgency === 1);
      urgentBtn.classList.toggle('super', action.urgency === 2);
      urgentBtn.setAttribute('aria-label', `Cycle urgency for action ${action.number}`);
      urgentBtn.addEventListener('click', () => {
        cycleUrgency(action);
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

  function getSortedMeetings() {
    return [...meeting.items].sort((a, b) => new Date(b.datetime) - new Date(a.datetime));
  }

  function getMeetingGroups() {
    const byMonth = new Map();
    getSortedMeetings().forEach((item) => {
      const date = new Date(item.datetime);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1).getTime();

      if (!byMonth.has(monthKey)) {
        byMonth.set(monthKey, { monthKey, monthLabel, monthStart, weeks: new Map() });
      }

      const month = byMonth.get(monthKey);
      const monday = getWeekCommencingMonday(date);
      const weekKey = dateToDateValue(monday);
      if (!month.weeks.has(weekKey)) {
        month.weeks.set(weekKey, { weekKey, weekStart: monday.getTime(), weekLabel: `W/C ${formatLocalDate(monday)}`, meetings: [] });
      }

      month.weeks.get(weekKey).meetings.push(item);
    });

    return [...byMonth.values()]
      .sort((a, b) => b.monthStart - a.monthStart)
      .map((month) => ({
        ...month,
        weeks: [...month.weeks.values()]
          .sort((a, b) => b.weekStart - a.weekStart)
          .map((week) => ({ ...week, meetings: week.meetings.sort((a, b) => new Date(b.datetime) - new Date(a.datetime)) })),
      }));
  }

  function renderNotesContent(container, notes) {
    const lines = notes.split('\n').map((line) => line.trim()).filter(Boolean);
    const allBullets = lines.length > 0 && lines.every((line) => /^(- |\* |• )/.test(line));

    if (!lines.length) {
      const p = document.createElement('p');
      p.textContent = 'No notes added.';
      container.appendChild(p);
      return;
    }

    if (allBullets) {
      const ul = document.createElement('ul');
      lines.forEach((line) => {
        const li = document.createElement('li');
        li.textContent = line.replace(/^(- |\* |• )/, '').trim();
        ul.appendChild(li);
      });
      container.appendChild(ul);
      return;
    }

    notes
      .split(/\n{2,}/)
      .map((part) => part.trim())
      .filter(Boolean)
      .forEach((paragraph) => {
        const p = document.createElement('p');
        p.textContent = paragraph;
        container.appendChild(p);
      });
  }

  function renderMeetingExpanded(item) {
    const detail = document.createElement('div');
    detail.className = 'meeting-details';

    if (meeting.editingId === item.id) {
      const editForm = document.createElement('form');
      editForm.className = 'meeting-edit-form';

      const date = new Date(item.datetime);

      const titleInput = document.createElement('input');
      titleInput.type = 'text';
      titleInput.required = true;
      titleInput.value = item.title;
      titleInput.maxLength = 200;

      const dateTimeWrap = document.createElement('div');
      dateTimeWrap.className = 'meeting-edit-datetime';

      const dateInput = document.createElement('input');
      dateInput.type = 'date';
      dateInput.required = true;
      dateInput.value = dateToDateValue(date);

      const timeInput = document.createElement('input');
      timeInput.type = 'time';
      timeInput.required = true;
      timeInput.value = dateToTimeValue(date);

      dateTimeWrap.append(dateInput, timeInput);

      const notesInput = document.createElement('textarea');
      notesInput.required = true;
      notesInput.value = item.notes;

      const controls = document.createElement('div');
      controls.className = 'meeting-edit-controls';

      const saveBtn = document.createElement('button');
      saveBtn.type = 'submit';
      saveBtn.className = 'subtle-button';
      saveBtn.textContent = 'Save';

      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.className = 'subtle-button';
      cancelBtn.textContent = 'Cancel';
      cancelBtn.addEventListener('click', () => {
        meeting.editingId = null;
        renderMeetings();
      });

      controls.append(saveBtn, cancelBtn);
      editForm.append(titleInput, dateTimeWrap, notesInput, controls);
      detail.appendChild(editForm);

      editForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const parsed = parseLocalDateTime(dateInput.value, timeInput.value);
        if (!parsed) {
          return;
        }

        const title = titleInput.value.trim();
        const notes = notesInput.value.trim();
        if (!title || !notes) {
          return;
        }

        item.title = title;
        item.notes = notes;
        item.datetime = parsed.toISOString();
        item.updatedAt = new Date().toISOString();
        saveMeetings();
        meeting.editingId = null;
        renderMeetings();
      });

      return detail;
    }

    const title = document.createElement('h4');
    title.className = 'meeting-detail-title';
    title.textContent = item.title;

    const notesWrap = document.createElement('div');
    notesWrap.className = 'meeting-notes-rendered';
    renderNotesContent(notesWrap, item.notes);

    const controls = document.createElement('div');
    controls.className = 'meeting-detail-controls';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'meeting-link-btn';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => {
      meeting.editingId = item.id;
      renderMeetings();
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'meeting-link-btn delete';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => {
      const confirmed = window.confirm(`Delete meeting: "${item.title}"?`);
      if (!confirmed) {
        return;
      }

      meeting.items = meeting.items.filter((entry) => entry.id !== item.id);
      if (meeting.expandedId === item.id) {
        meeting.expandedId = null;
      }
      if (meeting.editingId === item.id) {
        meeting.editingId = null;
      }

      saveMeetings();
      renderMeetings();
    });

    controls.append(editBtn, deleteBtn);
    detail.append(title, notesWrap, controls);
    return detail;
  }

  function renderMeetings() {
    meeting.listEl.innerHTML = '';

    if (!meeting.items.length) {
      const empty = document.createElement('p');
      empty.className = 'meeting-empty';
      empty.textContent = 'No meeting notes yet. Add one to get started.';
      meeting.listEl.appendChild(empty);
      return;
    }

    const monthGroups = getMeetingGroups();

    monthGroups.forEach((month) => {
      const monthEl = document.createElement('section');
      monthEl.className = 'meeting-month-group';

      const monthHeader = document.createElement('h3');
      monthHeader.className = 'meeting-month-header';
      monthHeader.textContent = month.monthLabel;
      monthEl.appendChild(monthHeader);

      month.weeks.forEach((week) => {
        const weekEl = document.createElement('section');
        weekEl.className = 'meeting-week-group';

        const weekHeader = document.createElement('h4');
        weekHeader.className = 'meeting-week-header';
        weekHeader.textContent = week.weekLabel;

        const meetingsEl = document.createElement('ul');
        meetingsEl.className = 'meeting-items';

        week.meetings.forEach((item) => {
          const li = document.createElement('li');
          li.className = 'meeting-item';

          const date = new Date(item.datetime);
          const summary = document.createElement('button');
          summary.type = 'button';
          summary.className = 'meeting-summary';
          summary.textContent = `${formatWeekday(date)} ${formatLocalDate(date)} ${formatTime24(date)} — ${item.title}`;

          summary.addEventListener('click', () => {
            if (meeting.expandedId === item.id) {
              meeting.expandedId = null;
              meeting.editingId = null;
            } else {
              meeting.expandedId = item.id;
              meeting.editingId = null;
            }
            renderMeetings();
          });

          li.appendChild(summary);

          if (meeting.expandedId === item.id) {
            li.appendChild(renderMeetingExpanded(item));
          }

          meetingsEl.appendChild(li);
        });

        weekEl.append(weekHeader, meetingsEl);
        monthEl.appendChild(weekEl);
      });

      meeting.listEl.appendChild(monthEl);
    });
  }

  function renderAll() {
    renderList(lists.general);
    renderList(lists.scheduling);
    renderMeetings();
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
      html: text,
      urgency: 0,
      completedAt: null,
      deletedAt: null,
    });

    nextActionNumber += 1;
    saveList(list);
    saveNextNumber();
    renderList(list);
  }

  function addMeeting(titleRaw, dateRaw, timeRaw, notesRaw) {
    const title = titleRaw.trim();
    const notes = notesRaw.trim();
    const parsed = parseLocalDateTime(dateRaw, timeRaw);
    if (!title || !notes || !parsed) {
      return false;
    }

    const nowIso = new Date().toISOString();
    meeting.items.push({
      id: `meeting-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title,
      datetime: parsed.toISOString(),
      notes,
      createdAt: nowIso,
      updatedAt: nowIso,
    });

    saveMeetings();
    renderMeetings();
    return true;
  }

  function modalStatusText(action) {
    const created = `Created: ${formatLocalDate(action.createdAt)}`;
    const completed = action.completed ? `Completed: ${formatLocalDate(action.completedAt)}` : null;
    const deleted = action.deleted ? `Deleted: ${formatLocalDate(action.deletedAt)}` : null;

    let primary = created;
    if (deleted) {
      primary = deleted;
    } else if (completed) {
      primary = completed;
    }

    const extras = [created];
    if (completed) {
      extras.push(completed);
    }
    if (deleted) {
      extras.push(deleted);
    }

    const urgency = action.urgency === 2 ? 'Super urgent' : action.urgency === 1 ? 'Urgent' : null;
    return urgency ? `${primary} • ${extras.join(' • ')} • ${urgency}` : `${primary} • ${extras.join(' • ')}`;
  }

  function openModal(list, action) {
    activeModalContext = { list, action };
    modalTitle.textContent = `${action.number}`;
    modalStatus.textContent = modalStatusText(action);
    modalTextInput.innerHTML = sanitizeActionHtml(action.html || action.text);
    updateModalUrgencyUI(action);
    modal.hidden = false;
    modalTextInput.focus();
  }

  function persistModalChanges() {
    if (!activeModalContext) {
      return false;
    }

    const { list, action } = activeModalContext;
    const html = sanitizeActionHtml(modalTextInput.innerHTML);
    const text = htmlToPlainText(html);
    if (!text) {
      modalTextInput.focus();
      return false;
    }

    action.html = html;
    action.text = text;
    saveList(list);
    renderList(list);
    return true;
  }

  function closeModal(skipPersist = false) {
    if (!skipPersist && activeModalContext) {
      persistModalChanges();
    }
    modal.hidden = true;
    activeModalContext = null;
  }

  function saveModalChanges() {
    const saved = persistModalChanges();
    if (!saved) {
      return;
    }

    closeModal(true);
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

  function bindMeetingEvents() {
    meeting.form.addEventListener('submit', (event) => {
      event.preventDefault();
      const added = addMeeting(meeting.titleInput.value, meeting.dateInput.value, meeting.timeInput.value, meeting.notesInput.value);
      if (!added) {
        return;
      }

      meeting.form.reset();
      meeting.titleInput.focus();
    });

    meeting.titleInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        meeting.dateInput.focus();
      }
    });

    meeting.form.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        meeting.form.requestSubmit();
      }
    });
  }

  modalSaveBtn.addEventListener('click', saveModalChanges);
  modalUrgencyBtn.addEventListener('click', () => {
    if (!activeModalContext || activeModalContext.action.deleted) {
      return;
    }

    cycleUrgency(activeModalContext.action);
    updateModalUrgencyUI(activeModalContext.action);
  });
  modalTextInput.addEventListener('keydown', (event) => {
    if (!(event.ctrlKey || event.metaKey)) {
      return;
    }

    const key = event.key.toLowerCase();
    if (!['b', 'i', 'u'].includes(key)) {
      return;
    }

    event.preventDefault();
    const command = key === 'b' ? 'bold' : key === 'i' ? 'italic' : 'underline';
    document.execCommand(command, false);
  });
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
  bindMeetingEvents();
  loadData();
  renderAll();
})();
