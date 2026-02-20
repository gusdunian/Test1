(() => {
  const GENERAL_STORAGE_KEY = 'generalActions';
  const SCHEDULING_STORAGE_KEY = 'schedulingActions';
  const MEETING_STORAGE_KEY = 'meetingNotes';
  const MEETING_UI_STORAGE_KEY = 'meetingNotesUIState';
  const NEXT_NUMBER_STORAGE_KEY = 'nextActionNumber';
  const LEGACY_STORAGE_KEY = 'generalActions.v1';
  const DEFAULT_NEXT_NUMBER = 137;
  const ALLOWED_RICH_TAGS = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'BR', 'P', 'UL', 'OL', 'LI']);

  const ALLOWED_MINUTES = ['00', '15', '30', '45'];
  const SUPABASE_URL = 'https://ngmcjvsqontdwgxyedwx.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_QNIuyXbtKQ_1-1NnU1J4pA_53Jckpes';
  const SUPABASE_REDIRECT_URL = 'https://gusdunian.github.io/Test1/';
  const CLOUD_LAST_PUSH_KEY = 'lastPushAt';
  const CLOUD_LAST_PULL_KEY = 'lastPullAt';

  const { createClient } = supabase;
  const sb = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

  const modal = document.getElementById('action-modal');
  const modalBackdrop = document.getElementById('action-modal-backdrop');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalSaveBtn = document.getElementById('modal-save-btn');
  const modalTitle = document.getElementById('modal-title');
  const modalStatus = document.getElementById('modal-status');
  const modalTextInput = document.getElementById('modal-text-input');
  const modalUrgencyBtn = document.getElementById('modal-urgency-btn');
  const modalUrgencyLabel = document.getElementById('modal-urgency-label');

  const meetingBigEditModal = document.getElementById('meeting-big-edit-modal');
  const meetingBigEditBackdrop = document.getElementById('meeting-big-edit-backdrop');
  const meetingBigEditClose = document.getElementById('meeting-big-edit-close');
  const meetingBigEditForm = document.getElementById('meeting-big-edit-form');
  const meetingBigEditTitleInput = document.getElementById('meeting-big-edit-title-input');
  const meetingBigEditDateInput = document.getElementById('meeting-big-edit-date-input');
  const meetingBigEditHourInput = document.getElementById('meeting-big-edit-hour-input');
  const meetingBigEditMinuteInput = document.getElementById('meeting-big-edit-minute-input');
  const meetingBigEditNotesEditor = document.getElementById('meeting-big-edit-notes-editor');

  const meeting = {
    items: [],
    expandedId: null,
    editingId: null,
    uiState: { collapsedMonths: {}, collapsedWeeks: {} },
    form: document.getElementById('meeting-add-form'),
    titleInput: document.getElementById('meeting-title-input'),
    dateInput: document.getElementById('meeting-date-input'),
    hourInput: document.getElementById('meeting-hour-input'),
    minuteInput: document.getElementById('meeting-minute-input'),
    notesEditor: document.getElementById('meeting-notes-editor'),
    listEl: document.getElementById('meeting-list'),
  };

  const cloud = {
    emailInput: document.getElementById('cloud-email-input'),
    signInBtn: document.getElementById('cloud-sign-in-btn'),
    signOutBtn: document.getElementById('cloud-sign-out-btn'),
    pushBtn: document.getElementById('cloud-push-btn'),
    pullBtn: document.getElementById('cloud-pull-btn'),
    statusEl: document.getElementById('cloud-status'),
    signedInUser: null,
    busy: false,
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
    },
    scheduling: {
      key: SCHEDULING_STORAGE_KEY,
      showDates: false,
      actions: [],
      form: document.getElementById('scheduling-add-action-form'),
      input: document.getElementById('scheduling-action-input'),
      listEl: document.getElementById('scheduling-action-list'),
      clearBtn: document.getElementById('scheduling-clear-completed-btn'),
    },
  };

  let nextActionNumber = DEFAULT_NEXT_NUMBER;
  let activeModalContext = null;
  let activeMeetingBigEditId = null;

  function escapeHtml(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function textToRichHtml(text) {
    const escaped = escapeHtml(String(text || '').trim());
    if (!escaped) {
      return '<p><br></p>';
    }
    return `<p>${escaped.replace(/\n/g, '<br>')}</p>`;
  }

  function sanitizeRichHtml(inputHtml) {
    const template = document.createElement('template');
    template.innerHTML = inputHtml || '';

    function sanitizeNode(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        return document.createTextNode(node.textContent || '');
      }

      if (node.nodeType !== Node.ELEMENT_NODE) {
        return document.createDocumentFragment();
      }

      const tagName = node.tagName.toUpperCase();
      const childFragment = document.createDocumentFragment();
      Array.from(node.childNodes).forEach((child) => childFragment.appendChild(sanitizeNode(child)));

      if (!ALLOWED_RICH_TAGS.has(tagName)) {
        return childFragment;
      }

      const cleanEl = document.createElement(tagName.toLowerCase());
      cleanEl.appendChild(childFragment);
      return cleanEl;
    }

    const output = document.createElement('div');
    Array.from(template.content.childNodes).forEach((node) => output.appendChild(sanitizeNode(node)));
    return output.innerHTML.trim();
  }

  function htmlToPlainText(html) {
    const container = document.createElement('div');
    container.innerHTML = html || '';
    return (container.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function ensureActionRichContent(action) {
    if (!action) {
      return;
    }
    if (!action.html && action.text) {
      action.html = textToRichHtml(action.text);
    }
    action.html = sanitizeRichHtml(action.html || textToRichHtml(action.text || '')) || textToRichHtml(action.text || '');
    action.text = htmlToPlainText(action.html);
  }

  function ensureMeetingRichContent(item) {
    if (!item) {
      return;
    }
    if (!item.notesHtml && item.notes) {
      item.notesHtml = textToRichHtml(item.notes);
    }
    item.notesHtml = sanitizeRichHtml(item.notesHtml || textToRichHtml(item.notes || '')) || textToRichHtml(item.notes || '');
    item.notesText = htmlToPlainText(item.notesHtml);
  }

  function formatLocalDate(timestamp) {
    if (!timestamp) return '--/--';
    const date = new Date(timestamp);
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
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
    date.setDate(date.getDate() + (day === 0 ? -6 : 1 - day));
    return date;
  }

  function dateToDateValue(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function dateToTimeValue(date) {
    const minutes = date.getMinutes();
    const validMinute = ALLOWED_MINUTES.includes(String(minutes).padStart(2, '0')) ? minutes : 0;
    return `${String(date.getHours()).padStart(2, '0')}:${String(validMinute).padStart(2, '0')}`;
  }


  function buildTimeValue(hourValue, minuteValue) {
    const hour = String(hourValue || '').padStart(2, '0');
    const minute = String(minuteValue || '').padStart(2, '0');
    return `${hour}:${minute}`;
  }

  function populateHourOptions(selectEl) {
    if (!selectEl || selectEl.options.length) return;
    for (let hour = 0; hour < 24; hour += 1) {
      const value = String(hour).padStart(2, '0');
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      selectEl.appendChild(option);
    }
  }

  function parseLocalDateTime(dateValue, timeValue) {
    if (!dateValue || !timeValue) return null;
    const [year, month, day] = dateValue.split('-').map(Number);
    const [hour, minute] = timeValue.split(':').map(Number);
    if (![year, month, day, hour, minute].every(Number.isFinite)) return null;
    const parsed = new Date(year, month - 1, day, hour, minute, 0, 0);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  function buildPrefix(action) {
    if (action.deleted) return `<span class="prefix-mark">X</span>${formatLocalDate(action.deletedAt)}`;
    if (action.completed) return `<span class="prefix-mark">C</span>${formatLocalDate(action.completedAt)}`;
    return formatLocalDate(action.createdAt);
  }

  function normalizeAction(item) {
    const number = Number(item.number);
    const text = typeof item.text === 'string' ? item.text.trim() : '';
    const html = typeof item.html === 'string' ? item.html : '';
    const createdAt = Number(item.createdAt) || Date.now();
    const completedAt = Number(item.completedAt) || null;
    const deletedAt = Number(item.deletedAt) || null;
    const status = typeof item.status === 'string' ? item.status.toLowerCase() : '';

    if (!Number.isInteger(number) || (!text && !html)) return null;

    const completed = Boolean(item.completed || completedAt || status === 'completed');
    const deleted = Boolean(item.deleted || deletedAt || status === 'deleted');
    const urgencyLevelRaw = Number.isInteger(item.urgencyLevel) ? item.urgencyLevel : Number.isInteger(item.urgency) ? item.urgency : item.urgent ? 1 : 0;
    const urgencyLevel = Math.max(0, Math.min(2, urgencyLevelRaw));

    const normalized = {
      number,
      text,
      html,
      createdAt,
      completed,
      deleted,
      urgencyLevel,
      updatedAt: Number(item.updatedAt) || createdAt,
      completedAt: completed ? completedAt || createdAt : null,
      deletedAt: deleted ? deletedAt || createdAt : null,
    };

    ensureActionRichContent(normalized);
    return normalized;
  }

  function normalizeMeeting(item) {
    const title = typeof item.title === 'string' ? item.title.trim() : '';
    const date = new Date(item.datetime);
    if (!title || Number.isNaN(date.getTime())) return null;

    const normalized = {
      id: typeof item.id === 'string' && item.id ? item.id : `meeting-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title,
      datetime: date.toISOString(),
      notesHtml: typeof item.notesHtml === 'string' ? item.notesHtml : '',
      notes: typeof item.notes === 'string' ? item.notes : '',
      notesText: typeof item.notesText === 'string' ? item.notesText : '',
      createdAt: item.createdAt || null,
      updatedAt: item.updatedAt || null,
    };

    ensureMeetingRichContent(normalized);
    if (!normalized.notesText) return null;
    return normalized;
  }

  function saveList(list) {
    localStorage.setItem(list.key, JSON.stringify(list.actions));
  }

  function saveMeetings() {
    localStorage.setItem(MEETING_STORAGE_KEY, JSON.stringify(meeting.items));
  }

  function saveMeetingUIState() {
    localStorage.setItem(MEETING_UI_STORAGE_KEY, JSON.stringify(meeting.uiState));
  }

  function saveNextNumber() {
    localStorage.setItem(NEXT_NUMBER_STORAGE_KEY, String(nextActionNumber));
  }

  function loadList(list) {
    try {
      const raw = localStorage.getItem(list.key);
      list.actions = raw ? (Array.isArray(JSON.parse(raw)) ? JSON.parse(raw).map(normalizeAction).filter(Boolean) : []) : [];
    } catch {
      list.actions = [];
    }
  }

  function loadMeetings() {
    try {
      const raw = localStorage.getItem(MEETING_STORAGE_KEY);
      meeting.items = raw ? (Array.isArray(JSON.parse(raw)) ? JSON.parse(raw).map(normalizeMeeting).filter(Boolean) : []) : [];
    } catch {
      meeting.items = [];
    }
  }

  function loadMeetingUIState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(MEETING_UI_STORAGE_KEY) || '{}');
      meeting.uiState = {
        collapsedMonths: parsed.collapsedMonths && typeof parsed.collapsedMonths === 'object' ? parsed.collapsedMonths : {},
        collapsedWeeks: parsed.collapsedWeeks && typeof parsed.collapsedWeeks === 'object' ? parsed.collapsedWeeks : {},
      };
    } catch {
      meeting.uiState = { collapsedMonths: {}, collapsedWeeks: {} };
    }
  }

  function migrateLegacyGeneralData() {
    if (localStorage.getItem(GENERAL_STORAGE_KEY)) return;
    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!legacyRaw) return;
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
      // keep defaults
    }
  }


  function parseStoredJson(value, fallback) {
    if (typeof value !== 'string' || !value) return fallback;
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  function getLocalDashboardState() {
    return {
      generalActions: parseStoredJson(localStorage.getItem(GENERAL_STORAGE_KEY), []),
      schedulingActions: parseStoredJson(localStorage.getItem(SCHEDULING_STORAGE_KEY), []),
      meetingNotes: parseStoredJson(localStorage.getItem(MEETING_STORAGE_KEY), []),
      meetingNotesUIState: parseStoredJson(localStorage.getItem(MEETING_UI_STORAGE_KEY), { collapsedMonths: {}, collapsedWeeks: {} }),
      nextActionNumber: Number(localStorage.getItem(NEXT_NUMBER_STORAGE_KEY)) || DEFAULT_NEXT_NUMBER,
    };
  }

  function setLocalDashboardState(stateObj) {
    const state = stateObj && typeof stateObj === 'object' ? stateObj : {};
    localStorage.setItem(GENERAL_STORAGE_KEY, JSON.stringify(Array.isArray(state.generalActions) ? state.generalActions : []));
    localStorage.setItem(SCHEDULING_STORAGE_KEY, JSON.stringify(Array.isArray(state.schedulingActions) ? state.schedulingActions : []));
    localStorage.setItem(MEETING_STORAGE_KEY, JSON.stringify(Array.isArray(state.meetingNotes) ? state.meetingNotes : []));

    const uiState = state.meetingNotesUIState && typeof state.meetingNotesUIState === 'object'
      ? state.meetingNotesUIState
      : { collapsedMonths: {}, collapsedWeeks: {} };
    localStorage.setItem(MEETING_UI_STORAGE_KEY, JSON.stringify(uiState));

    const nextNumber = Number(state.nextActionNumber);
    localStorage.setItem(NEXT_NUMBER_STORAGE_KEY, String(Number.isInteger(nextNumber) && nextNumber > 0 ? nextNumber : DEFAULT_NEXT_NUMBER));

    loadData();
    renderAll();
  }

  function formatCloudTimestamp(value) {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toLocaleString('en-GB', { hour12: false });
  }

  function setCloudStatus(message, isError = false) {
    if (!cloud.statusEl) return;
    cloud.statusEl.textContent = message;
    cloud.statusEl.style.color = isError ? '#b91c1c' : '#475569';
  }

  function updateCloudUi() {
    const signedIn = Boolean(cloud.signedInUser);
    cloud.signOutBtn.hidden = !signedIn;
    cloud.signInBtn.hidden = signedIn;
    cloud.pushBtn.disabled = cloud.busy || !signedIn;
    cloud.pullBtn.disabled = cloud.busy || !signedIn;
    cloud.signInBtn.disabled = cloud.busy;
    cloud.signOutBtn.disabled = cloud.busy;
    cloud.emailInput.disabled = cloud.busy || signedIn;

    if (cloud.busy) return;
    if (signedIn) {
      const email = cloud.signedInUser.email || 'account';
      setCloudStatus(`Signed in as ${email}`);
      return;
    }
    setCloudStatus('Signed out');
  }

  async function refreshSignedInUser() {
    const { data } = await sb.auth.getUser();
    cloud.signedInUser = data?.user || null;
    updateCloudUi();
  }

  async function withCloudBusy(task) {
    if (cloud.busy) return;
    cloud.busy = true;
    updateCloudUi();
    try {
      await task();
    } finally {
      cloud.busy = false;
      updateCloudUi();
    }
  }

  function loadData() {
    const storedNext = Number(localStorage.getItem(NEXT_NUMBER_STORAGE_KEY));
    if (Number.isInteger(storedNext) && storedNext > 0) nextActionNumber = storedNext;

    migrateLegacyGeneralData();
    loadList(lists.general);
    loadList(lists.scheduling);
    loadMeetings();
    loadMeetingUIState();

    const highest = Math.max(DEFAULT_NEXT_NUMBER - 1, ...lists.general.actions.map((i) => i.number), ...lists.scheduling.actions.map((i) => i.number));
    if (nextActionNumber <= highest) {
      nextActionNumber = highest + 1;
      saveNextNumber();
    }

    saveList(lists.general);
    saveList(lists.scheduling);
    saveMeetings();
  }

  function sortNewestFirst(a, b) {
    return b.createdAt - a.createdAt || b.number - a.number;
  }

  function getOrderedActions(list) {
    const superUrgent = list.actions.filter((i) => !i.deleted && !i.completed && i.urgencyLevel === 2).sort(sortNewestFirst);
    const urgent = list.actions.filter((i) => !i.deleted && !i.completed && i.urgencyLevel === 1).sort(sortNewestFirst);
    const normal = list.actions.filter((i) => !i.deleted && !i.completed && i.urgencyLevel === 0).sort(sortNewestFirst);
    const completed = list.actions.filter((i) => !i.deleted && i.completed).sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
    const deleted = list.actions.filter((i) => i.deleted).sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0));
    return [...superUrgent, ...urgent, ...normal, ...completed, ...deleted];
  }

  function updateRowTruncation(row) {
    const textEl = row.querySelector('.action-text');
    const toggleBtn = row.querySelector('.action-text-toggle');
    if (!textEl || !toggleBtn) return;
    toggleBtn.hidden = !(textEl.scrollWidth > textEl.clientWidth + 1);
  }

  function getUrgencyLabel(action) {
    return action.urgencyLevel === 2 ? 'Super urgent' : action.urgencyLevel === 1 ? 'Urgent' : 'None';
  }

  function cycleUrgency(action) {
    action.urgencyLevel = (action.urgencyLevel + 1) % 3;
    action.updatedAt = Date.now();
  }

  function updateModalUrgencyUI(action) {
    modalUrgencyLabel.textContent = getUrgencyLabel(action);
    modalUrgencyBtn.classList.toggle('active', action.urgencyLevel === 1);
    modalUrgencyBtn.classList.toggle('super', action.urgencyLevel === 2);
    modalUrgencyBtn.textContent = action.urgencyLevel === 2 ? '!!' : '!';
    modalUrgencyBtn.disabled = action.deleted;
  }

  function renderList(list) {
    list.listEl.innerHTML = '';
    const ordered = getOrderedActions(list);
    if (!ordered.length) {
      const empty = document.createElement('li');
      empty.className = 'coming-soon';
      empty.textContent = 'No actions yet. Add one to get started.';
      list.listEl.appendChild(empty);
      return;
    }

    ordered.forEach((action) => {
      const li = document.createElement('li');
      li.className = 'action-item';
      if (action.completed) li.classList.add('completed');
      if (action.deleted) li.classList.add('deleted');
      if (!action.completed && !action.deleted && action.urgencyLevel === 1) li.classList.add('urgent');
      if (!action.completed && !action.deleted && action.urgencyLevel === 2) li.classList.add('super-urgent');

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = action.completed;
      checkbox.disabled = action.deleted;
      checkbox.addEventListener('change', () => {
        action.completed = checkbox.checked;
        action.completedAt = action.completed ? Date.now() : null;
        action.updatedAt = Date.now();
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
      if (action.urgencyLevel === 2 && !action.completed && !action.deleted) text.classList.add('super-urgent-text');
      textWrap.appendChild(text);

      const expandBtn = document.createElement('button');
      expandBtn.type = 'button';
      expandBtn.className = 'action-text-toggle';
      expandBtn.textContent = '+';
      expandBtn.hidden = true;
      expandBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        openModal(list, action.number);
      });
      textWrap.appendChild(expandBtn);

      const controls = document.createElement('div');
      controls.className = 'action-controls';

      const urgentBtn = document.createElement('button');
      urgentBtn.type = 'button';
      urgentBtn.className = 'icon-btn urgent-btn';
      urgentBtn.disabled = action.deleted;
      urgentBtn.textContent = action.urgencyLevel === 2 ? '!!' : '!';
      urgentBtn.classList.toggle('active', action.urgencyLevel === 1);
      urgentBtn.classList.toggle('super', action.urgencyLevel === 2);
      urgentBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        cycleUrgency(action);
        saveList(list);
        renderList(list);
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'icon-btn delete-btn';
      deleteBtn.textContent = action.deleted ? 'UD' : 'X';
      deleteBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        if (action.deleted) {
          action.deleted = false;
          action.deletedAt = null;
        } else {
          action.deleted = true;
          action.deletedAt = Date.now();
        }
        action.updatedAt = Date.now();
        saveList(list);
        renderList(list);
      });

      controls.append(urgentBtn, deleteBtn);
      li.append(checkbox, number, textWrap, controls);
      li.addEventListener('click', (event) => {
        if (event.target.closest('.action-controls') || event.target.closest('.action-text-toggle') || event.target.closest('input[type="checkbox"]')) {
          return;
        }
        openModal(list, action.number);
      });
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
      if (!byMonth.has(monthKey)) {
        byMonth.set(monthKey, {
          monthKey,
          monthLabel: date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
          monthStart: new Date(date.getFullYear(), date.getMonth(), 1).getTime(),
          weeks: new Map(),
        });
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
      const hourInput = document.createElement('select');
      hourInput.required = true;
      populateHourOptions(hourInput);
      hourInput.value = String(date.getHours()).padStart(2, '0');

      const minuteInput = document.createElement('select');
      minuteInput.required = true;
      ALLOWED_MINUTES.forEach((minute) => {
        const option = document.createElement('option');
        option.value = minute;
        option.textContent = minute;
        minuteInput.appendChild(option);
      });
      minuteInput.value = ALLOWED_MINUTES.includes(String(date.getMinutes()).padStart(2, '0')) ? String(date.getMinutes()).padStart(2, '0') : '00';
      dateTimeWrap.append(dateInput, hourInput, minuteInput);

      const toolbar = document.createElement('div');
      toolbar.className = 'rtf-toolbar';
      const editorId = `meeting-edit-${item.id}`;
      toolbar.dataset.editorTarget = editorId;
      toolbar.innerHTML = '<button type="button" data-command="bold">B</button><button type="button" data-command="italic">I</button><button type="button" data-command="underline">U</button><button type="button" data-command="insertUnorderedList">•</button><button type="button" data-command="insertOrderedList">1.</button>';

      const notesEditor = document.createElement('div');
      notesEditor.id = editorId;
      notesEditor.className = 'modal-editor';
      notesEditor.contentEditable = 'true';
      notesEditor.innerHTML = item.notesHtml;

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
      editForm.append(titleInput, dateTimeWrap, toolbar, notesEditor, controls);
      detail.appendChild(editForm);
      bindRtfToolbar(toolbar);
      bindEditorShortcuts(notesEditor);

      editForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const parsed = parseLocalDateTime(dateInput.value, buildTimeValue(hourInput.value, minuteInput.value));
        if (!parsed) return;
        const title = titleInput.value.trim();
        const notesHtml = sanitizeRichHtml(notesEditor.innerHTML);
        const notesText = htmlToPlainText(notesHtml);
        if (!title || !notesText) return;

        item.title = title;
        item.datetime = parsed.toISOString();
        item.notesHtml = notesHtml;
        item.notesText = notesText;
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
    notesWrap.innerHTML = item.notesHtml;

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
      if (!window.confirm(`Delete meeting: "${item.title}"?`)) return;
      meeting.items = meeting.items.filter((entry) => entry.id !== item.id);
      if (meeting.expandedId === item.id) meeting.expandedId = null;
      if (meeting.editingId === item.id) meeting.editingId = null;
      saveMeetings();
      renderMeetings();
    });

    const bigEditBtn = document.createElement('button');
    bigEditBtn.type = 'button';
    bigEditBtn.className = 'meeting-link-btn';
    bigEditBtn.textContent = 'Big edit';
    bigEditBtn.addEventListener('click', () => openMeetingBigEdit(item.id));

    controls.append(editBtn, bigEditBtn, deleteBtn);
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

    getMeetingGroups().forEach((month) => {
      const monthSection = document.createElement('section');
      monthSection.className = 'meeting-month-group';

      const monthHeaderRow = document.createElement('div');
      monthHeaderRow.className = 'meeting-header-row';
      const monthToggle = document.createElement('button');
      monthToggle.type = 'button';
      monthToggle.className = 'collapse-toggle';
      const monthCollapsed = Boolean(meeting.uiState.collapsedMonths[month.monthKey]);
      monthToggle.textContent = monthCollapsed ? '+' : '–';
      monthToggle.addEventListener('click', () => {
        meeting.uiState.collapsedMonths[month.monthKey] = !monthCollapsed;
        saveMeetingUIState();
        renderMeetings();
      });

      const monthHeader = document.createElement('h3');
      monthHeader.className = 'meeting-month-header';
      monthHeader.textContent = month.monthLabel;
      monthHeaderRow.append(monthToggle, monthHeader);
      monthSection.appendChild(monthHeaderRow);

      const monthBody = document.createElement('div');
      monthBody.hidden = monthCollapsed;

      month.weeks.forEach((week) => {
        const weekSection = document.createElement('section');
        weekSection.className = 'meeting-week-group';

        const weekHeaderRow = document.createElement('div');
        weekHeaderRow.className = 'meeting-header-row';
        const weekToggle = document.createElement('button');
        weekToggle.type = 'button';
        weekToggle.className = 'collapse-toggle';
        const weekMapKey = `${month.monthKey}:${week.weekKey}`;
        const weekCollapsed = Boolean(meeting.uiState.collapsedWeeks[weekMapKey]);
        weekToggle.textContent = weekCollapsed ? '+' : '–';
        weekToggle.addEventListener('click', () => {
          meeting.uiState.collapsedWeeks[weekMapKey] = !weekCollapsed;
          saveMeetingUIState();
          renderMeetings();
        });

        const weekHeader = document.createElement('h4');
        weekHeader.className = 'meeting-week-header';
        weekHeader.textContent = week.weekLabel;
        weekHeaderRow.append(weekToggle, weekHeader);

        const weekItemsContainer = document.createElement('div');
        weekItemsContainer.className = 'meeting-week-items';
        weekItemsContainer.hidden = weekCollapsed;

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
            meeting.expandedId = meeting.expandedId === item.id ? null : item.id;
            meeting.editingId = null;
            renderMeetings();
          });
          li.appendChild(summary);
          if (meeting.expandedId === item.id) li.appendChild(renderMeetingExpanded(item));
          meetingsEl.appendChild(li);
        });

        weekItemsContainer.appendChild(meetingsEl);
        weekSection.append(weekHeaderRow, weekItemsContainer);
        monthBody.appendChild(weekSection);
      });

      monthSection.appendChild(monthBody);
      meeting.listEl.appendChild(monthSection);
    });
  }

  function renderAll() {
    renderList(lists.general);
    renderList(lists.scheduling);
    renderMeetings();
  }

  function addAction(list, rawText) {
    const text = rawText.trim();
    if (!text) return;
    list.actions.unshift({
      number: nextActionNumber,
      text,
      html: textToRichHtml(text),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      completed: false,
      deleted: false,
      urgencyLevel: 0,
      completedAt: null,
      deletedAt: null,
    });
    nextActionNumber += 1;
    saveList(list);
    saveNextNumber();
    renderList(list);
  }

  function addMeeting(titleRaw, dateRaw, timeRaw, notesHtmlRaw) {
    const title = titleRaw.trim();
    const parsed = parseLocalDateTime(dateRaw, timeRaw);
    const notesHtml = sanitizeRichHtml(notesHtmlRaw);
    const notesText = htmlToPlainText(notesHtml);
    if (!title || !notesText || !parsed) return false;

    const nowIso = new Date().toISOString();
    meeting.items.push({
      id: `meeting-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title,
      datetime: parsed.toISOString(),
      notesHtml,
      notesText,
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
    const urgency = action.urgencyLevel === 2 ? 'Super urgent' : action.urgencyLevel === 1 ? 'Urgent' : null;
    return [deleted || completed || created, created, completed, deleted, urgency].filter(Boolean).join(' • ');
  }

  function findActionByNumber(list, number) {
    return list.actions.find((item) => item.number === number) || null;
  }

  function getActiveModalAction() {
    if (!activeModalContext) return null;
    return findActionByNumber(activeModalContext.list, activeModalContext.actionNumber);
  }

  function openModal(list, actionNumber) {
    const action = findActionByNumber(list, actionNumber);
    if (!action) return;
    ensureActionRichContent(action);
    activeModalContext = { list, actionNumber };
    modalTitle.textContent = `${action.number}`;
    modalStatus.textContent = modalStatusText(action);
    modalTextInput.innerHTML = action.html;
    updateModalUrgencyUI(action);
    modal.hidden = false;
    modalTextInput.focus();
  }

  function persistModalChanges() {
    const action = getActiveModalAction();
    if (!action || !activeModalContext) return false;

    const html = sanitizeRichHtml(modalTextInput.innerHTML);
    const text = htmlToPlainText(html);
    if (!text) {
      modalTextInput.focus();
      return false;
    }

    action.html = html;
    action.text = text;
    action.updatedAt = Date.now();
    saveList(activeModalContext.list);
    renderList(activeModalContext.list);
    return true;
  }

  function closeModal(skipPersist = false) {
    if (!skipPersist && activeModalContext) {
      persistModalChanges();
    }
    modal.hidden = true;
    activeModalContext = null;
  }

  function execEditorCommand(editorEl, command) {
    editorEl.focus();
    document.execCommand(command, false);
  }

  function getEditorCommandForShortcut(event) {
    if (!(event.ctrlKey || event.metaKey)) return null;
    const key = event.key.toLowerCase();
    if (event.shiftKey && key === '8') return 'insertUnorderedList';
    if (event.shiftKey && key === '7') return 'insertOrderedList';
    if (key === 'b') return 'bold';
    if (key === 'i') return 'italic';
    if (key === 'u') return 'underline';
    return null;
  }

  function bindEditorShortcuts(editorEl) {
    editorEl.addEventListener('keydown', (event) => {
      const command = getEditorCommandForShortcut(event);
      if (!command) return;
      event.preventDefault();
      execEditorCommand(editorEl, command);
    });
  }

  function bindRtfToolbar(toolbarEl) {
    toolbarEl.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-command]');
      if (!button) return;
      const editor = document.getElementById(toolbarEl.dataset.editorTarget);
      if (!editor) return;
      execEditorCommand(editor, button.dataset.command);
    });
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
      list.actions = list.actions.filter((item) => {
        const isCompleted = item.completed || Boolean(item.completedAt) || item.status === 'completed';
        const isDeleted = item.deleted || Boolean(item.deletedAt) || item.status === 'deleted';
        return !(isCompleted || isDeleted);
      });
      saveList(list);
      renderList(list);
    });
  }


  function getMeetingById(id) {
    return meeting.items.find((item) => item.id === id) || null;
  }

  function openMeetingBigEdit(meetingId) {
    const item = getMeetingById(meetingId);
    if (!item) return;
    const date = new Date(item.datetime);
    activeMeetingBigEditId = item.id;
    meetingBigEditTitleInput.value = item.title;
    meetingBigEditDateInput.value = dateToDateValue(date);
    meetingBigEditHourInput.value = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    meetingBigEditMinuteInput.value = ALLOWED_MINUTES.includes(minute) ? minute : '00';
    meetingBigEditNotesEditor.innerHTML = item.notesHtml;
    meetingBigEditModal.hidden = false;
    meetingBigEditTitleInput.focus();
  }

  function closeMeetingBigEdit() {
    meetingBigEditModal.hidden = true;
    activeMeetingBigEditId = null;
  }

  function saveMeetingBigEdit() {
    const item = getMeetingById(activeMeetingBigEditId);
    if (!item) return false;
    const title = meetingBigEditTitleInput.value.trim();
    const parsed = parseLocalDateTime(meetingBigEditDateInput.value, buildTimeValue(meetingBigEditHourInput.value, meetingBigEditMinuteInput.value));
    const notesHtml = sanitizeRichHtml(meetingBigEditNotesEditor.innerHTML);
    const notesText = htmlToPlainText(notesHtml);
    if (!title || !parsed || !notesText) return false;

    item.title = title;
    item.datetime = parsed.toISOString();
    item.notesHtml = notesHtml;
    item.notesText = notesText;
    item.updatedAt = new Date().toISOString();
    saveMeetings();
    renderMeetings();
    return true;
  }


  async function signInWithMagicLink() {
    const email = cloud.emailInput.value.trim();
    if (!email) {
      setCloudStatus('Enter an email address first.', true);
      return;
    }

    await withCloudBusy(async () => {
      const { error } = await sb.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: SUPABASE_REDIRECT_URL },
      });
      if (error) {
        setCloudStatus(`Sign in failed: ${error.message}`, true);
        return;
      }
      setCloudStatus(`Magic link sent to ${email}`);
    });
  }

  async function signOutCloud() {
    await withCloudBusy(async () => {
      const { error } = await sb.auth.signOut();
      if (error) {
        setCloudStatus(`Sign out failed: ${error.message}`, true);
        return;
      }
      cloud.signedInUser = null;
      setCloudStatus('Signed out');
    });
  }

  async function pushCloudState() {
    await withCloudBusy(async () => {
      const { data } = await sb.auth.getUser();
      const user = data?.user;
      if (!user) {
        cloud.signedInUser = null;
        setCloudStatus('Please sign in first.', true);
        return;
      }

      const state = getLocalDashboardState();
      const nowIso = new Date().toISOString();
      const { error } = await sb.from('dashboard_state').upsert({
        user_id: user.id,
        state,
        updated_at: nowIso,
      });

      if (error) {
        setCloudStatus(`Push failed: ${error.message}`, true);
        return;
      }

      localStorage.setItem(CLOUD_LAST_PUSH_KEY, nowIso);
      const label = formatCloudTimestamp(nowIso) || nowIso;
      setCloudStatus(`Last push: ${label}`);
    });
  }

  async function pullCloudState() {
    await withCloudBusy(async () => {
      const { data: userData } = await sb.auth.getUser();
      const user = userData?.user;
      if (!user) {
        cloud.signedInUser = null;
        setCloudStatus('Please sign in first.', true);
        return;
      }

      const { data, error } = await sb.from('dashboard_state')
        .select('state, updated_at')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setCloudStatus('No cloud data yet.');
          return;
        }
        setCloudStatus(`Pull failed: ${error.message}`, true);
        return;
      }

      setLocalDashboardState(data.state || {});
      const pulledAt = new Date().toISOString();
      localStorage.setItem(CLOUD_LAST_PULL_KEY, pulledAt);
      const label = formatCloudTimestamp(data.updated_at || pulledAt) || data.updated_at || pulledAt;
      setCloudStatus(`Last pull: ${label}`);
    });
  }

  function bindCloudEvents() {
    cloud.signInBtn.addEventListener('click', signInWithMagicLink);
    cloud.signOutBtn.addEventListener('click', signOutCloud);
    cloud.pushBtn.addEventListener('click', pushCloudState);
    cloud.pullBtn.addEventListener('click', pullCloudState);

    cloud.emailInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        signInWithMagicLink();
      }
    });

    sb.auth.onAuthStateChange((_event, session) => {
      cloud.signedInUser = session?.user || null;
      updateCloudUi();
    });
  }

  function bindMeetingEvents() {
    meeting.form.addEventListener('submit', (event) => {
      event.preventDefault();
      const added = addMeeting(meeting.titleInput.value, meeting.dateInput.value, buildTimeValue(meeting.hourInput.value, meeting.minuteInput.value), meeting.notesEditor.innerHTML);
      if (!added) return;
      meeting.form.reset();
      meeting.minuteInput.value = '00';
      meeting.notesEditor.innerHTML = '';
      meeting.titleInput.focus();
    });

    meeting.form.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        meeting.form.requestSubmit();
      }
    });
  }

  populateHourOptions(meeting.hourInput);
  populateHourOptions(meetingBigEditHourInput);
  meeting.minuteInput.value = '00';

  document.querySelectorAll('.rtf-toolbar').forEach(bindRtfToolbar);
  bindEditorShortcuts(modalTextInput);
  bindEditorShortcuts(meeting.notesEditor);
  bindEditorShortcuts(meetingBigEditNotesEditor);

  modalSaveBtn.addEventListener('click', () => {
    if (persistModalChanges()) closeModal(true);
  });

  modalUrgencyBtn.addEventListener('click', () => {
    const action = getActiveModalAction();
    if (!action || !activeModalContext || action.deleted) return;
    cycleUrgency(action);
    saveList(activeModalContext.list);
    modalStatus.textContent = modalStatusText(action);
    updateModalUrgencyUI(action);
    renderList(activeModalContext.list);
  });


  meetingBigEditForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (saveMeetingBigEdit()) closeMeetingBigEdit();
  });

  meetingBigEditClose.addEventListener('click', closeMeetingBigEdit);
  meetingBigEditBackdrop.addEventListener('click', closeMeetingBigEdit);

  modalCloseBtn.addEventListener('click', () => closeModal());
  modalBackdrop.addEventListener('click', () => closeModal());
  window.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (!meetingBigEditModal.hidden) {
      closeMeetingBigEdit();
      return;
    }
    if (!modal.hidden) closeModal();
  });

  window.addEventListener('resize', () => {
    document.querySelectorAll('.action-item').forEach((row) => updateRowTruncation(row));
  });

  bindListEvents(lists.general);
  bindListEvents(lists.scheduling);
  bindMeetingEvents();
  bindCloudEvents();
  loadData();
  renderAll();
  refreshSignedInUser().catch((error) => {
    setCloudStatus(`Auth check failed: ${error.message}`, true);
  });
})();
