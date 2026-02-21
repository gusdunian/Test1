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
  const CLOUD_LAST_PUSH_KEY = 'lastPushAt';
  const CLOUD_LAST_PULL_KEY = 'lastPullAt';
  const CLOUD_LAST_SYNCED_AT_KEY = 'lastSyncedAt';
  const CLOUD_LAST_UPDATED_AT_KEY = 'lastCloudUpdatedAt';
  const LOCAL_DIRTY_SINCE_KEY = 'localDirtySince';
  const LOCAL_STATE_VERSION_KEY = 'dashboardStateVersion';
  const LATEST_STATE_VERSION = 9;
  const AUTOSYNC_DEBOUNCE_MS = 2000;
  const FOCUS_SYNC_DEBOUNCE_MS = 700;
  const PERSON_TAG_REGEX = /(^|[\s(>])(@[A-Za-z0-9_-]+)/g;
  const HASH_TAG_REGEX = /(^|[\s(>])(#[A-Za-z0-9_-]+)/g;
  const URGENCY_LOW = 3;
  const MOVE_HIGHLIGHT_MS = 5000;

  const DEFAULT_DASHBOARD_TITLE = 'Angus’ Working Dashboard';

  const defaultTheme = {
    bannerBg: '#1e3a8a',
    bannerFg: '#ffffff',
    pageBg: '#f3f6fb',
    cardHeaderBg: '#0f172a',
    cardHeaderFg: '#ffffff',
  };

  const THEMES = {
    'Office Blue': {
      bannerBg: '#2563eb',
      bannerFg: '#ffffff',
      pageBg: '#f8fafc',
      cardHeaderBg: '#1d4ed8',
      cardHeaderFg: '#ffffff',
    },
    'Office Teal': {
      bannerBg: '#0f766e',
      bannerFg: '#f0fdfa',
      pageBg: '#f0fdfa',
      cardHeaderBg: '#115e59',
      cardHeaderFg: '#f0fdfa',
    },
    'Office Green': {
      bannerBg: '#15803d',
      bannerFg: '#f0fdf4',
      pageBg: '#f0fdf4',
      cardHeaderBg: '#166534',
      cardHeaderFg: '#f0fdf4',
    },
    'Office Red': {
      bannerBg: '#b91c1c',
      bannerFg: '#fef2f2',
      pageBg: '#fef2f2',
      cardHeaderBg: '#991b1b',
      cardHeaderFg: '#fef2f2',
    },
    'Office Orange': {
      bannerBg: '#c2410c',
      bannerFg: '#fff7ed',
      pageBg: '#fff7ed',
      cardHeaderBg: '#9a3412',
      cardHeaderFg: '#fff7ed',
    },
    'Office Purple': {
      bannerBg: '#7e22ce',
      bannerFg: '#faf5ff',
      pageBg: '#faf5ff',
      cardHeaderBg: '#6b21a8',
      cardHeaderFg: '#faf5ff',
    },
    'Office Grey': {
      bannerBg: '#475569',
      bannerFg: '#f8fafc',
      pageBg: '#f8fafc',
      cardHeaderBg: '#334155',
      cardHeaderFg: '#f8fafc',
    },
    Navy: {
      bannerBg: '#1e3a8a',
      bannerFg: '#eff6ff',
      pageBg: '#eff6ff',
      cardHeaderBg: '#1e40af',
      cardHeaderFg: '#eff6ff',
    },
    Charcoal: {
      bannerBg: '#1f2937',
      bannerFg: '#f9fafb',
      pageBg: '#f3f4f6',
      cardHeaderBg: '#111827',
      cardHeaderFg: '#f9fafb',
    },
    Forest: {
      bannerBg: '#14532d',
      bannerFg: '#f0fdf4',
      pageBg: '#ecfdf5',
      cardHeaderBg: '#166534',
      cardHeaderFg: '#f0fdf4',
    },
    Crimson: {
      bannerBg: '#9f1239',
      bannerFg: '#fff1f2',
      pageBg: '#fff1f2',
      cardHeaderBg: '#881337',
      cardHeaderFg: '#fff1f2',
    },
    Sunshine: {
      bannerBg: '#ca8a04',
      bannerFg: '#422006',
      pageBg: '#fefce8',
      cardHeaderBg: '#eab308',
      cardHeaderFg: '#422006',
    },
    'Pastel Mint': {
      bannerBg: '#6ee7b7',
      bannerFg: '#064e3b',
      pageBg: '#f0fdf4',
      cardHeaderBg: '#34d399',
      cardHeaderFg: '#064e3b',
    },
    'Pastel Lavender': {
      bannerBg: '#c4b5fd',
      bannerFg: '#312e81',
      pageBg: '#f5f3ff',
      cardHeaderBg: '#a78bfa',
      cardHeaderFg: '#312e81',
    },
    'Pastel Peach': {
      bannerBg: '#fdba74',
      bannerFg: '#7c2d12',
      pageBg: '#fff7ed',
      cardHeaderBg: '#fb923c',
      cardHeaderFg: '#7c2d12',
    },
  };

  const THEME_PRESET_NAMES = [...Object.keys(THEMES), 'Custom'];
  const movedActionHighlights = new Map();

  const collapsedCardsDefault = {
    generalActions: false,
    personalActions: false,
    bigTicket: false,
    scheduling: false,
    meetingNotes: false,
    generalNotes: false,
  };

  const { createClient } = supabase;
  const sb = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

  const modal = document.getElementById('action-modal');
  const modalBackdrop = document.getElementById('action-modal-backdrop');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalSaveBtn = document.getElementById('modal-save-btn');
  const modalCancelBtn = document.getElementById('modal-cancel-btn');
  const modalDictateBtn = document.getElementById('modal-dictate-btn');
  const modalTitle = document.getElementById('modal-title');
  const modalStatus = document.getElementById('modal-status');
  const modalTextInput = document.getElementById('modal-text-input');
  const modalUrgencyBtn = document.getElementById('modal-urgency-btn');
  const modalUrgencyLabel = document.getElementById('modal-urgency-label');
  const modalTimeDependentBtn = document.getElementById('modal-time-dependent-btn');
  const modalTimeDependentLabel = document.getElementById('modal-time-dependent-label');

  const meetingBigEditModal = document.getElementById('meeting-big-edit-modal');
  const meetingBigEditBackdrop = document.getElementById('meeting-big-edit-backdrop');
  const meetingBigEditClose = document.getElementById('meeting-big-edit-close');
  const meetingBigEditForm = document.getElementById('meeting-big-edit-form');
  const meetingBigEditTitleInput = document.getElementById('meeting-big-edit-title-input');
  const meetingBigEditDateInput = document.getElementById('meeting-big-edit-date-input');
  const meetingBigEditHourInput = document.getElementById('meeting-big-edit-hour-input');
  const meetingBigEditMinuteInput = document.getElementById('meeting-big-edit-minute-input');
  const meetingBigEditNotesEditor = document.getElementById('meeting-big-edit-notes-editor');
  const meetingBigEditDictateBtn = document.getElementById('meeting-big-edit-dictate');
  const bigTicketModal = document.getElementById('big-ticket-modal');
  const bigTicketModalBackdrop = document.getElementById('big-ticket-modal-backdrop');
  const bigTicketModalClose = document.getElementById('big-ticket-modal-close');
  const bigTicketModalSave = document.getElementById('big-ticket-modal-save');
  const bigTicketModalEditor = document.getElementById('big-ticket-modal-editor');
  const generalNoteBigEditModal = document.getElementById('general-note-big-edit-modal');
  const generalNoteBigEditBackdrop = document.getElementById('general-note-big-edit-backdrop');
  const generalNoteBigEditClose = document.getElementById('general-note-big-edit-close');
  const generalNoteBigEditForm = document.getElementById('general-note-big-edit-form');
  const generalNoteBigEditTitleInput = document.getElementById('general-note-big-edit-title-input');
  const generalNoteBigEditDateInput = document.getElementById('general-note-big-edit-date-input');
  const generalNoteBigEditEditor = document.getElementById('general-note-big-edit-editor');
  const generalNoteBigEditDictateBtn = document.getElementById('general-note-big-edit-dictate');
  const mainContainer = document.getElementById('main-content');
  const columnsSection = document.querySelector('.columns');
  const signedOutMessage = document.getElementById('signed-out-message');
  const dashboardTitleEl = document.getElementById('dashboard-title');
  const dashboardDateEl = document.getElementById('dashboard-date');
  const generalPersonFilterSelect = document.getElementById('general-person-filter');
  const schedulingPersonFilterSelect = document.getElementById('scheduling-person-filter');
  const generalTagFilterSelect = document.getElementById('general-tag-filter');
  const schedulingTagFilterSelect = document.getElementById('scheduling-tag-filter');
  const generalPersonCountEl = document.getElementById('general-person-filter-count');
  const schedulingPersonCountEl = document.getElementById('scheduling-person-filter-count');

  const settingsBtn = document.getElementById('cloud-settings-btn');
  const settingsModal = document.getElementById('settings-modal');
  const settingsModalBackdrop = document.getElementById('settings-modal-backdrop');
  const settingsModalClose = document.getElementById('settings-modal-close');
  const settingsForm = document.getElementById('settings-form');
  const settingsCancelBtn = document.getElementById('settings-cancel-btn');
  const themePresetSelect = document.getElementById('theme-preset-select');
  const dashboardTitleInput = document.getElementById('dashboard-title-input');
  const themeBannerBgInput = document.getElementById('theme-banner-bg');
  const themeBannerFgInput = document.getElementById('theme-banner-fg');
  const themePageBgInput = document.getElementById('theme-page-bg');
  const themeCardHeaderBgInput = document.getElementById('theme-card-header-bg');
  const themeCardHeaderFgInput = document.getElementById('theme-card-header-fg');
  const importModal = document.getElementById('import-modal');
  const importModalBackdrop = document.getElementById('import-modal-backdrop');
  const importModalClose = document.getElementById('import-modal-close');
  const importForm = document.getElementById('import-form');
  const importFileInput = document.getElementById('import-file-input');
  const importCancelBtn = document.getElementById('import-cancel-btn');
  const meetingBigEditCancel = document.getElementById('meeting-big-edit-cancel');
  const generalNoteBigEditCancel = document.getElementById('general-note-big-edit-cancel');

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

  const bigTicket = {
    items: [],
    form: document.getElementById('big-ticket-add-form'),
    input: document.getElementById('big-ticket-input'),
    listEl: document.getElementById('big-ticket-list'),
    activeId: null,
  };

  const generalNotes = {
    items: [],
    expandedId: null,
    editingId: null,
    uiState: { collapsedMonths: {} },
    form: document.getElementById('general-notes-add-form'),
    dateInput: document.getElementById('general-note-date-input'),
    titleInput: document.getElementById('general-note-title-input'),
    editor: document.getElementById('general-note-editor'),
    listEl: document.getElementById('general-notes-list'),
  };

  const uiState = {
    collapsedCards: { ...collapsedCardsDefault },
    collapsedGeneralNotesMonths: {},
    theme: { presetName: 'Office Blue', vars: { ...defaultTheme } },
    dashboardTitle: DEFAULT_DASHBOARD_TITLE,
    personFilter: 'All',
    tagFilter: 'All',
  };

  const appState = {
    stateVersion: LATEST_STATE_VERSION,
    generalActions: [],
    personalActions: [],
    schedulingActions: [],
    meetingNotes: [],
    bigTicketItems: [],
    generalNotes: [],
    ui: {
      collapsedCards: { ...collapsedCardsDefault },
      collapsedGeneralNotesMonths: {},
      theme: { presetName: 'Office Blue', vars: { ...defaultTheme } },
      dashboardTitle: DEFAULT_DASHBOARD_TITLE,
      personFilter: 'All',
      tagFilter: 'All',
    },
    meetingNotesUIState: { collapsedMonths: {}, collapsedWeeks: {} },
    nextActionNumber: DEFAULT_NEXT_NUMBER,
  };

  const cloud = {
    emailInput: document.getElementById('cloud-email-input'),
    passwordInput: document.getElementById('cloud-password-input'),
    signInBtn: document.getElementById('cloud-sign-in-btn'),
    signOutBtn: document.getElementById('cloud-sign-out-btn'),
    exportBtn: document.getElementById('cloud-export-btn'),
    importBtn: document.getElementById('cloud-import-btn'),
    settingsBtn: document.getElementById('cloud-settings-btn'),
    signedInDisplay: document.getElementById('cloud-signed-in-display'),
    signedInEmailEl: document.getElementById('cloud-signed-in-email'),
    collapseAllBtn: document.getElementById('collapse-all-btn'),
    statusEl: document.getElementById('cloud-status'),
    toastContainer: document.getElementById('toast-container'),
    signedInUser: null,
    busy: false,
    loadingContext: '',
    syncInFlight: false,
    refreshInFlight: false,
    focusRefreshTimer: null,
    importInProgress: false,
    lastCloudUpdatedAt: localStorage.getItem(CLOUD_LAST_UPDATED_AT_KEY) || null,
    lastSyncedAt: localStorage.getItem(CLOUD_LAST_SYNCED_AT_KEY) || null,
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
      createUrgencyBtn: document.getElementById('general-create-urgency-btn'),
      createTimingBtn: document.getElementById('general-create-timing-btn'),
    },
    personal: {
      key: 'personalActions',
      showDates: true,
      hideNumber: true,
      idPrefix: 'pact',
      actions: [],
      form: document.getElementById('personal-add-action-form'),
      input: document.getElementById('personal-action-input'),
      listEl: document.getElementById('personal-action-list'),
      clearBtn: document.getElementById('personal-clear-completed-btn'),
    },
    scheduling: {
      key: SCHEDULING_STORAGE_KEY,
      showDates: false,
      hideNumber: false,
      idPrefix: 'act',
      actions: [],
      form: document.getElementById('scheduling-add-action-form'),
      input: document.getElementById('scheduling-action-input'),
      listEl: document.getElementById('scheduling-action-list'),
      clearBtn: document.getElementById('scheduling-clear-completed-btn'),
      createUrgencyBtn: document.getElementById('scheduling-create-urgency-btn'),
      createTimingBtn: document.getElementById('scheduling-create-timing-btn'),
    },
  };

  let nextActionNumber = DEFAULT_NEXT_NUMBER;
  let activeModalContext = null;
  const creationDefaults = { urgencyLevel: 0, timingFlag: null };
  const creationState = {
    general: { ...creationDefaults },
    scheduling: { ...creationDefaults },
  };
  const dictationState = { recognition: null, button: null, defaultTarget: null, fallbackTarget: null };
  let activeMeetingBigEditId = null;
  let activeMeetingBigEditDraft = null;
  let activeGeneralNoteBigEditId = null;
  let activeGeneralNoteBigEditDraft = null;
  let isAuthenticated = false;
  let suppressAutosync = false;
  let autosyncTimer = null;
  let autosyncPending = false;
  let autosyncInFlight = false;
  let settingsThemeDraft = null;
  let settingsThemeSavedSnapshot = null;
  let suppressThemePresetSync = false;
  let localDirtySince = Number(localStorage.getItem(LOCAL_DIRTY_SINCE_KEY)) || null;

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

  function markLocalDirty() {
    localDirtySince = Date.now();
    localStorage.setItem(LOCAL_DIRTY_SINCE_KEY, String(localDirtySince));
  }

  function clearLocalDirty() {
    localDirtySince = null;
    localStorage.removeItem(LOCAL_DIRTY_SINCE_KEY);
  }

  function extractPersonTagsFromAction(action) {
    const sourceText = (typeof action?.text === 'string' && action.text.trim())
      ? action.text
      : htmlToPlainText(action?.html || action?.html_inline || '');
    if (!sourceText) return [];

    const matches = new Map();
    const regex = new RegExp(PERSON_TAG_REGEX);
    let match;
    while ((match = regex.exec(sourceText)) !== null) {
      const tag = match[2];
      const key = tag.toLowerCase();
      if (!matches.has(key)) matches.set(key, tag);
    }
    return Array.from(matches.values());
  }

  function collectPersonTags() {
    const unique = new Map();
    [lists.general.actions, lists.scheduling.actions, bigTicket.items].forEach((items) => {
      items.forEach((item) => {
        extractPersonTagsFromAction(item).forEach((tag) => {
          const key = tag.toLowerCase();
          if (!unique.has(key)) unique.set(key, tag);
        });
      });
    });

    return Array.from(unique.values()).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }

  function extractHashTagsFromAction(action) {
    const sourceText = (typeof action?.text === 'string' && action.text.trim())
      ? action.text
      : htmlToPlainText(action?.html || action?.html_inline || '');
    if (!sourceText) return [];

    const matches = new Map();
    const regex = new RegExp(HASH_TAG_REGEX);
    let match;
    while ((match = regex.exec(sourceText)) !== null) {
      const tag = match[2];
      const key = tag.toLowerCase();
      if (!matches.has(key)) matches.set(key, tag);
    }
    return Array.from(matches.values());
  }

  function collectHashTags() {
    const unique = new Map();
    [lists.general.actions, lists.scheduling.actions, bigTicket.items].forEach((items) => {
      items.forEach((item) => {
        extractHashTagsFromAction(item).forEach((tag) => {
          const key = tag.toLowerCase();
          if (!unique.has(key)) unique.set(key, tag);
        });
      });
    });

    return Array.from(unique.values()).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }

  function richHtmlToInlineHtml(html) {
    const source = sanitizeRichHtml(html || '');
    const container = document.createElement('div');
    container.innerHTML = source;

    function nodeToInline(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent || '';
      }
      if (node.nodeType !== Node.ELEMENT_NODE) {
        return '';
      }
      const tag = node.tagName.toUpperCase();
      if (tag === 'BR') return ' ';
      if (tag === 'P') {
        return Array.from(node.childNodes).map(nodeToInline).join(' ').trim();
      }
      if (tag === 'UL' || tag === 'OL') {
        const items = Array.from(node.children)
          .filter((child) => child.tagName && child.tagName.toUpperCase() === 'LI')
          .map((li) => `• ${Array.from(li.childNodes).map(nodeToInline).join(' ').replace(/\s+/g, ' ').trim()}`)
          .filter(Boolean);
        return items.join('; ');
      }
      if (tag === 'LI') {
        return Array.from(node.childNodes).map(nodeToInline).join(' ').trim();
      }
      if (['B', 'STRONG', 'I', 'EM', 'U'].includes(tag)) {
        const content = Array.from(node.childNodes).map(nodeToInline).join(' ').replace(/\s+/g, ' ').trim();
        return content ? `<${tag.toLowerCase()}>${content}</${tag.toLowerCase()}>` : '';
      }
      return Array.from(node.childNodes).map(nodeToInline).join(' ');
    }

    const inline = Array.from(container.childNodes).map(nodeToInline).join(' ').replace(/\s+/g, ' ').trim();
    return inline || htmlToPlainText(source);
  }

  function resolveThemePresetName(themeVars) {
    return Object.entries(THEMES).find(([, vars]) => {
      const normalized = normalizeTheme(vars);
      return Object.keys(normalized).every((key) => normalized[key] === themeVars[key]);
    })?.[0] || 'Custom';
  }

  function normalizeThemeState(themeLike) {
    const source = themeLike && typeof themeLike === 'object' ? themeLike : {};
    const varsSource = source.vars && typeof source.vars === 'object' ? source.vars : source;
    const vars = normalizeTheme(varsSource);
    const presetName = THEME_PRESET_NAMES.includes(source.presetName)
      ? source.presetName
      : resolveThemePresetName(vars);
    return { presetName, vars };
  }

  function ensureActionRichContent(action) {
    if (!action) {
      return;
    }
    if (!action.html && action.text) {
      action.html = textToRichHtml(action.text);
    }
    action.html = sanitizeRichHtml(action.html || textToRichHtml(action.text || '')) || textToRichHtml(action.text || '');
    action.html_inline = richHtmlToInlineHtml(action.html);
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

  function normalizeBigTicketItem(item) {
    const html = sanitizeRichHtml(typeof item?.html === 'string' ? item.html : textToRichHtml(item?.text || ''));
    const text = htmlToPlainText(html);
    if (!text) return null;
    return {
      id: typeof item?.id === 'string' && item.id ? item.id : `ticket-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      html,
      html_inline: richHtmlToInlineHtml(typeof item?.html_inline === 'string' ? item.html_inline : html),
      text,
      urgencyLevel: Math.max(0, Math.min(URGENCY_LOW, Number.isInteger(item?.urgencyLevel) ? item.urgencyLevel : 0)),
      timingFlag: item?.timingFlag === 'T' || item?.timingFlag === 'D' ? item.timingFlag : (item?.timeDependent ? 'T' : null),
      createdAt: Number(item?.createdAt) || Date.now(),
      updatedAt: Number(item?.updatedAt) || Date.now(),
    };
  }

  function normalizeGeneralNote(item) {
    const title = typeof item?.title === 'string' ? item.title.trim() : '';
    const date = typeof item?.date === 'string' ? item.date : '';
    const html = sanitizeRichHtml(typeof item?.html === 'string' ? item.html : textToRichHtml(item?.text || ''));
    const text = htmlToPlainText(html);
    if (!title || !date || !text) return null;
    return {
      id: typeof item?.id === 'string' && item.id ? item.id : `gn-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      date,
      title,
      html,
      html_inline: richHtmlToInlineHtml(typeof item?.html_inline === 'string' ? item.html_inline : html),
      text,
      createdAt: Number(item?.createdAt) || Date.now(),
      updatedAt: Number(item?.updatedAt) || Date.now(),
    };
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

  function normalizeAction(item, options = {}) {
    const requireNumber = options.requireNumber !== false;
    const number = Number(item?.number);
    const text = typeof item?.text === 'string' ? item.text.trim() : '';
    const html = typeof item?.html === 'string' ? item.html : '';
    const createdAt = Number(item?.createdAt) || Date.now();
    const completedAt = Number(item?.completedAt) || null;
    const deletedAt = Number(item?.deletedAt) || null;
    const status = typeof item?.status === 'string' ? item.status.toLowerCase() : '';

    if ((requireNumber && !Number.isInteger(number)) || (!text && !html)) return null;

    const completed = Boolean(item?.completed || completedAt || status === 'completed');
    const deleted = Boolean(item?.deleted || deletedAt || status === 'deleted');
    const urgencyLevelRaw = Number.isInteger(item?.urgencyLevel) ? item.urgencyLevel : Number.isInteger(item?.urgency) ? item.urgency : item?.urgent ? 1 : 0;
    const urgencyLevel = Math.max(0, Math.min(URGENCY_LOW, urgencyLevelRaw));

    const normalized = {
      text,
      html,
      html_inline: richHtmlToInlineHtml(typeof item?.html_inline === 'string' ? item.html_inline : html),
      createdAt,
      completed,
      deleted,
      urgencyLevel,
      timingFlag: item?.timingFlag === 'T' || item?.timingFlag === 'D' ? item.timingFlag : (item?.timeDependent ? 'T' : null),
      updatedAt: Number(item?.updatedAt) || createdAt,
      completedAt: completed ? completedAt || createdAt : null,
      deletedAt: deleted ? deletedAt || createdAt : null,
    };

    if (requireNumber) {
      normalized.number = number;
    } else {
      normalized.id = typeof item?.id === 'string' && item.id
        ? item.id
        : `${options.idPrefix || 'act'}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

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
    syncAppStateFromMemory();
    markLocalDirty();
    localStorage.setItem(list.key, JSON.stringify(list.actions));
    if (!suppressAutosync) requestAutosync();
  }

  function saveMeetings() {
    syncAppStateFromMemory();
    markLocalDirty();
    localStorage.setItem(MEETING_STORAGE_KEY, JSON.stringify(meeting.items));
    if (!suppressAutosync) requestAutosync();
  }

  function saveBigTicketItems() {
    syncAppStateFromMemory();
    markLocalDirty();
    localStorage.setItem('bigTicketItems', JSON.stringify(bigTicket.items));
    if (!suppressAutosync) requestAutosync();
  }

  function saveGeneralNotes() {
    syncAppStateFromMemory();
    markLocalDirty();
    localStorage.setItem('generalNotes', JSON.stringify(generalNotes.items));
    if (!suppressAutosync) requestAutosync();
  }

  function saveUiState(options = {}) {
    const shouldMarkDirty = options.markDirty !== false;
    const shouldAutosync = options.autosync !== false;
    syncAppStateFromMemory();
    if (shouldMarkDirty) markLocalDirty();
    localStorage.setItem('dashboardUiState', JSON.stringify(uiState));
    if (shouldAutosync && !suppressAutosync) requestAutosync();
  }

  function saveMeetingUIState() {
    syncAppStateFromMemory();
    markLocalDirty();
    localStorage.setItem(MEETING_UI_STORAGE_KEY, JSON.stringify(meeting.uiState));
    if (!suppressAutosync) requestAutosync();
  }

  function saveNextNumber() {
    syncAppStateFromMemory();
    markLocalDirty();
    localStorage.setItem(NEXT_NUMBER_STORAGE_KEY, String(nextActionNumber));
    localStorage.setItem(LOCAL_STATE_VERSION_KEY, String(LATEST_STATE_VERSION));
    if (!suppressAutosync) requestAutosync();
  }

  function loadList(list) {
    try {
      const raw = localStorage.getItem(list.key);
      list.actions = raw
        ? (Array.isArray(JSON.parse(raw))
          ? JSON.parse(raw)
            .map((item) => normalizeAction(item, { requireNumber: !list.hideNumber, idPrefix: list.idPrefix }))
            .filter(Boolean)
          : [])
        : [];
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

  function loadBigTicketItems() {
    const parsed = parseStoredJson(localStorage.getItem('bigTicketItems'), []);
    bigTicket.items = Array.isArray(parsed) ? parsed.map(normalizeBigTicketItem).filter(Boolean) : [];
  }

  function loadGeneralNotes() {
    const parsed = parseStoredJson(localStorage.getItem('generalNotes'), []);
    generalNotes.items = Array.isArray(parsed) ? parsed.map(normalizeGeneralNote).filter(Boolean) : [];
  }

  function normalizeTheme(themeLike) {
    const source = themeLike && typeof themeLike === 'object' ? themeLike : {};
    return {
      bannerBg: typeof source.bannerBg === 'string' ? source.bannerBg : defaultTheme.bannerBg,
      bannerFg: typeof source.bannerFg === 'string' ? source.bannerFg : defaultTheme.bannerFg,
      pageBg: typeof source.pageBg === 'string' ? source.pageBg : defaultTheme.pageBg,
      cardHeaderBg: typeof source.cardHeaderBg === 'string' ? source.cardHeaderBg : defaultTheme.cardHeaderBg,
      cardHeaderFg: typeof source.cardHeaderFg === 'string' ? source.cardHeaderFg : defaultTheme.cardHeaderFg,
    };
  }

  function applyTheme(themeLike) {
    const theme = normalizeTheme(themeLike);
    const root = document.documentElement;
    root.style.setProperty('--banner-bg', theme.bannerBg);
    root.style.setProperty('--banner-fg', theme.bannerFg);
    root.style.setProperty('--page-bg', theme.pageBg);
    root.style.setProperty('--card-header-bg', theme.cardHeaderBg);
    root.style.setProperty('--card-header-fg', theme.cardHeaderFg);
  }

  function loadUiState() {
    const parsed = parseStoredJson(localStorage.getItem('dashboardUiState'), {});
    uiState.collapsedCards = {
      ...collapsedCardsDefault,
      ...(parsed?.collapsedCards && typeof parsed.collapsedCards === 'object' ? parsed.collapsedCards : {}),
    };
    uiState.collapsedGeneralNotesMonths = parsed?.collapsedGeneralNotesMonths && typeof parsed.collapsedGeneralNotesMonths === 'object'
      ? parsed.collapsedGeneralNotesMonths
      : {};
    uiState.theme = normalizeThemeState(parsed?.theme);
    uiState.dashboardTitle = typeof parsed?.dashboardTitle === 'string' && parsed.dashboardTitle.trim()
      ? parsed.dashboardTitle.trim()
      : DEFAULT_DASHBOARD_TITLE;
    uiState.personFilter = typeof parsed?.personFilter === 'string' && parsed.personFilter.trim()
      ? parsed.personFilter.trim()
      : 'All';
    uiState.tagFilter = typeof parsed?.tagFilter === 'string' && parsed.tagFilter.trim()
      ? parsed.tagFilter.trim()
      : 'All';
    generalNotes.uiState.collapsedMonths = uiState.collapsedGeneralNotesMonths;
    applyTheme(uiState.theme.vars);
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

  function migrateState(rawState) {
    const incoming = rawState && typeof rawState === 'object' ? rawState : {};
    const versionValue = Number(incoming.stateVersion);
    const baseState = {
      stateVersion: Number.isInteger(versionValue) && versionValue > 0 ? versionValue : 1,
      generalActions: Array.isArray(incoming.generalActions) ? incoming.generalActions.map((item) => normalizeAction(item, { requireNumber: true, idPrefix: 'act' })).filter(Boolean) : [],
      personalActions: Array.isArray(incoming.personalActions) ? incoming.personalActions.map((item) => normalizeAction(item, { requireNumber: false, idPrefix: 'pact' })).filter(Boolean) : [],
      schedulingActions: Array.isArray(incoming.schedulingActions) ? incoming.schedulingActions.map((item) => normalizeAction(item, { requireNumber: true, idPrefix: 'act' })).filter(Boolean) : [],
      meetingNotes: Array.isArray(incoming.meetingNotes) ? incoming.meetingNotes.map(normalizeMeeting).filter(Boolean) : [],
      bigTicketItems: Array.isArray(incoming.bigTicketItems) ? incoming.bigTicketItems.map(normalizeBigTicketItem).filter(Boolean) : [],
      generalNotes: Array.isArray(incoming.generalNotes) ? incoming.generalNotes.map(normalizeGeneralNote).filter(Boolean) : [],
      ui: incoming.ui && typeof incoming.ui === 'object' ? incoming.ui : {},
      meetingNotesUIState: incoming.meetingNotesUIState && typeof incoming.meetingNotesUIState === 'object'
        ? {
          collapsedMonths: incoming.meetingNotesUIState.collapsedMonths && typeof incoming.meetingNotesUIState.collapsedMonths === 'object' ? incoming.meetingNotesUIState.collapsedMonths : {},
          collapsedWeeks: incoming.meetingNotesUIState.collapsedWeeks && typeof incoming.meetingNotesUIState.collapsedWeeks === 'object' ? incoming.meetingNotesUIState.collapsedWeeks : {},
        }
        : { collapsedMonths: {}, collapsedWeeks: {} },
      nextActionNumber: Number.isInteger(Number(incoming.nextActionNumber)) && Number(incoming.nextActionNumber) > 0
        ? Number(incoming.nextActionNumber)
        : DEFAULT_NEXT_NUMBER,
    };

    if (baseState.stateVersion < 2) {
      baseState.bigTicketItems = baseState.bigTicketItems || [];
      baseState.generalNotes = baseState.generalNotes || [];
      baseState.ui = {
        collapsedCards: {
          ...collapsedCardsDefault,
          ...(baseState.ui.collapsedCards && typeof baseState.ui.collapsedCards === 'object' ? baseState.ui.collapsedCards : {}),
        },
      };
      baseState.stateVersion = 2;
    }

    if (baseState.stateVersion < 3) {
      baseState.ui = {
        ...baseState.ui,
        collapsedGeneralNotesMonths: baseState.ui.collapsedGeneralNotesMonths && typeof baseState.ui.collapsedGeneralNotesMonths === 'object' ? baseState.ui.collapsedGeneralNotesMonths : {},
        theme: normalizeThemeState(baseState.ui.theme),
      };
      baseState.stateVersion = 3;
    }

    if (baseState.stateVersion < 4) {
      baseState.generalActions.forEach(ensureActionRichContent);
      baseState.schedulingActions.forEach(ensureActionRichContent);
      baseState.bigTicketItems = baseState.bigTicketItems.map(normalizeBigTicketItem).filter(Boolean);
      baseState.generalNotes = baseState.generalNotes.map(normalizeGeneralNote).filter(Boolean);
      baseState.ui = { ...baseState.ui, theme: normalizeThemeState(baseState.ui.theme) };
      baseState.stateVersion = 4;
    }

    if (baseState.stateVersion < 5) {
      baseState.ui = {
        ...baseState.ui,
        theme: normalizeThemeState(baseState.ui.theme),
        dashboardTitle: typeof baseState.ui.dashboardTitle === 'string' && baseState.ui.dashboardTitle.trim()
          ? baseState.ui.dashboardTitle.trim()
          : DEFAULT_DASHBOARD_TITLE,
      };
      baseState.stateVersion = 5;
    }


    if (baseState.stateVersion < 6) {
      baseState.generalActions = baseState.generalActions.map((item) => ({ ...item, timingFlag: item?.timingFlag === 'T' || item?.timingFlag === 'D' ? item.timingFlag : (item?.timeDependent ? 'T' : null) }));
      baseState.schedulingActions = baseState.schedulingActions.map((item) => ({ ...item, timingFlag: item?.timingFlag === 'T' || item?.timingFlag === 'D' ? item.timingFlag : (item?.timeDependent ? 'T' : null) }));
      baseState.personalActions = Array.isArray(baseState.personalActions) ? baseState.personalActions.map((item) => ({ ...item, timingFlag: item?.timingFlag === 'T' || item?.timingFlag === 'D' ? item.timingFlag : (item?.timeDependent ? 'T' : null) })) : [];
      baseState.ui = {
        ...baseState.ui,
        collapsedCards: {
          ...collapsedCardsDefault,
          ...(baseState.ui.collapsedCards && typeof baseState.ui.collapsedCards === 'object' ? baseState.ui.collapsedCards : {}),
        },
      };
      baseState.stateVersion = 6;
    }

    if (baseState.stateVersion < 7) {
      baseState.bigTicketItems = baseState.bigTicketItems.map((item) => ({
        ...item,
        urgencyLevel: Math.max(0, Math.min(URGENCY_LOW, Number.isInteger(item?.urgencyLevel) ? item.urgencyLevel : 0)),
        timingFlag: item?.timingFlag === 'T' || item?.timingFlag === 'D' ? item.timingFlag : (item?.timeDependent ? 'T' : null),
      }));
      baseState.stateVersion = 7;
    }


    if (baseState.stateVersion < 9) {
      baseState.generalActions = baseState.generalActions.map((item) => ({
        ...item,
        urgencyLevel: Math.max(0, Math.min(URGENCY_LOW, Number.isInteger(item?.urgencyLevel) ? item.urgencyLevel : 0)),
        timingFlag: item?.timingFlag === 'T' || item?.timingFlag === 'D' ? item.timingFlag : (item?.timeDependent ? 'T' : null),
      }));
      baseState.schedulingActions = baseState.schedulingActions.map((item) => ({
        ...item,
        urgencyLevel: Math.max(0, Math.min(URGENCY_LOW, Number.isInteger(item?.urgencyLevel) ? item.urgencyLevel : 0)),
        timingFlag: item?.timingFlag === 'T' || item?.timingFlag === 'D' ? item.timingFlag : (item?.timeDependent ? 'T' : null),
      }));
      baseState.personalActions = Array.isArray(baseState.personalActions)
        ? baseState.personalActions.map((item) => ({
          ...item,
          urgencyLevel: Math.max(0, Math.min(URGENCY_LOW, Number.isInteger(item?.urgencyLevel) ? item.urgencyLevel : 0)),
          timingFlag: item?.timingFlag === 'T' || item?.timingFlag === 'D' ? item.timingFlag : (item?.timeDependent ? 'T' : null),
        }))
        : [];
      baseState.stateVersion = 9;
    }

    if (baseState.stateVersion < LATEST_STATE_VERSION) {
      baseState.stateVersion = LATEST_STATE_VERSION;
    }

    baseState.ui = {
      collapsedCards: {
        ...collapsedCardsDefault,
        ...(baseState.ui.collapsedCards && typeof baseState.ui.collapsedCards === 'object' ? baseState.ui.collapsedCards : {}),
      },
      collapsedGeneralNotesMonths: baseState.ui.collapsedGeneralNotesMonths && typeof baseState.ui.collapsedGeneralNotesMonths === 'object' ? baseState.ui.collapsedGeneralNotesMonths : {},
      theme: normalizeThemeState(baseState.ui.theme),
      dashboardTitle: typeof baseState.ui.dashboardTitle === 'string' && baseState.ui.dashboardTitle.trim()
        ? baseState.ui.dashboardTitle.trim()
        : DEFAULT_DASHBOARD_TITLE,
      personFilter: typeof baseState.ui.personFilter === 'string' && baseState.ui.personFilter.trim()
        ? baseState.ui.personFilter.trim()
        : 'All',
      tagFilter: typeof baseState.ui.tagFilter === 'string' && baseState.ui.tagFilter.trim()
        ? baseState.ui.tagFilter.trim()
        : 'All',
    };

    const highest = Math.max(DEFAULT_NEXT_NUMBER - 1, ...baseState.generalActions.map((i) => i.number), ...baseState.schedulingActions.map((i) => i.number));
    if (baseState.nextActionNumber <= highest) {
      baseState.nextActionNumber = highest + 1;
    }

    return baseState;
  }

  function withAutosyncSuppressed(callback) {
    suppressAutosync = true;
    try {
      return callback();
    } finally {
      suppressAutosync = false;
    }
  }

  function getStateSnapshotFromMemory() {
    return migrateState({
      stateVersion: appState.stateVersion,
      generalActions: appState.generalActions,
      personalActions: appState.personalActions,
      schedulingActions: appState.schedulingActions,
      meetingNotes: appState.meetingNotes,
      bigTicketItems: appState.bigTicketItems,
      generalNotes: appState.generalNotes,
      ui: appState.ui,
      meetingNotesUIState: appState.meetingNotesUIState,
      nextActionNumber: appState.nextActionNumber,
    });
  }

  function syncAppStateFromMemory() {
    appState.stateVersion = LATEST_STATE_VERSION;
    appState.generalActions = lists.general.actions;
    appState.personalActions = lists.personal.actions;
    appState.schedulingActions = lists.scheduling.actions;
    appState.meetingNotes = meeting.items;
    appState.bigTicketItems = bigTicket.items;
    appState.generalNotes = generalNotes.items;
    appState.ui = {
      collapsedCards: uiState.collapsedCards,
      collapsedGeneralNotesMonths: uiState.collapsedGeneralNotesMonths,
      theme: uiState.theme,
      dashboardTitle: uiState.dashboardTitle,
      personFilter: uiState.personFilter || 'All',
      tagFilter: uiState.tagFilter || 'All',
    };
    appState.meetingNotesUIState = meeting.uiState;
    appState.nextActionNumber = nextActionNumber;
  }

  function getLocalDashboardState() {
    return getStateSnapshotFromMemory();
  }

  function hydrateFromLocalCacheAndRender() {
    loadData();
    syncAppStateFromMemory();
    renderAll();
  }

  function setLocalDashboardState(stateObj, options = {}) {
    const state = migrateState(stateObj);
    withAutosyncSuppressed(() => {
      localStorage.setItem(GENERAL_STORAGE_KEY, JSON.stringify(state.generalActions));
      localStorage.setItem('personalActions', JSON.stringify(state.personalActions));
      localStorage.setItem(SCHEDULING_STORAGE_KEY, JSON.stringify(state.schedulingActions));
      localStorage.setItem(MEETING_STORAGE_KEY, JSON.stringify(state.meetingNotes));
      localStorage.setItem('bigTicketItems', JSON.stringify(state.bigTicketItems));
      localStorage.setItem('generalNotes', JSON.stringify(state.generalNotes));
      localStorage.setItem('dashboardUiState', JSON.stringify(state.ui));
      localStorage.setItem(MEETING_UI_STORAGE_KEY, JSON.stringify(state.meetingNotesUIState));
      localStorage.setItem(NEXT_NUMBER_STORAGE_KEY, String(state.nextActionNumber));
      localStorage.setItem(LOCAL_STATE_VERSION_KEY, String(state.stateVersion || LATEST_STATE_VERSION));
      loadData();
      syncAppStateFromMemory();
      if (options.markDirty) {
        markLocalDirty();
      } else {
        clearLocalDirty();
      }
      renderAll();
    });
  }

  function formatCloudTimestamp(value) {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toLocaleString('en-GB', { hour12: false });
  }

  function updateCloudMeta() {
    const email = cloud.signedInUser?.email || '—';
    if (cloud.signedInEmailEl) {
      cloud.signedInEmailEl.textContent = email;
    }
    const label = formatCloudTimestamp(cloud.lastSyncedAt) || 'Never';
    if (cloud.signedInUser && !cloud.busy && !cloud.syncInFlight) {
      setStatus(`Synced — Last synced: ${label}`, 'success', { toast: false });
    }
  }

  function markLastSynced(timestamp, cloudUpdatedAt = null) {
    cloud.lastSyncedAt = timestamp || new Date().toISOString();
    localStorage.setItem(CLOUD_LAST_SYNCED_AT_KEY, cloud.lastSyncedAt);
    if (cloudUpdatedAt) {
      cloud.lastCloudUpdatedAt = cloudUpdatedAt;
      localStorage.setItem(CLOUD_LAST_UPDATED_AT_KEY, cloudUpdatedAt);
    }
    updateCloudMeta();
  }

  function showToast(message, type = 'info') {
    if (!cloud.toastContainer || !message) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    cloud.toastContainer.appendChild(toast);
    window.setTimeout(() => {
      toast.remove();
    }, 3600);
  }

  function setStatus(message, type = 'info', options = {}) {
    if (!cloud.statusEl) return;
    const normalizedType = ['info', 'success', 'warning', 'error', 'loading'].includes(type) ? type : 'info';
    const nextMessage = message || 'Ready';
    cloud.statusEl.textContent = nextMessage;
    cloud.statusEl.className = `cloud-status cloud-status-${normalizedType}`;
    const shouldToast = options.toast !== false;
    if (normalizedType !== 'loading' && shouldToast) {
      showToast(nextMessage, normalizedType === 'warning' ? 'warning' : normalizedType);
    }
  }

  function setLoading(isLoading, context = '') {
    cloud.busy = Boolean(isLoading);
    cloud.loadingContext = context || '';
    updateCloudUi();

    if (!isLoading) return;
    const label = {
      signIn: 'Signing in…',
      authLoad: 'Loading from cloud…',
      export: 'Preparing backup export…',
      import: 'Importing backup…',
    }[context] || 'Loading…';
    setStatus(label, 'loading');
  }

  function setSyncIndicator(isSyncing) {
    cloud.syncInFlight = Boolean(isSyncing);
    updateCloudUi();
    if (isSyncing) {
      setStatus('Syncing…', 'loading');
    }
  }

  function updateCloudUi() {
    const signedIn = Boolean(cloud.signedInUser);
    cloud.signOutBtn.hidden = !signedIn;
    cloud.signInBtn.hidden = signedIn;
    cloud.exportBtn.hidden = !signedIn;
    cloud.importBtn.hidden = !signedIn;
    cloud.settingsBtn.hidden = !signedIn;
    cloud.collapseAllBtn.hidden = !signedIn;
    cloud.signedInDisplay.hidden = !signedIn;
    cloud.emailInput.hidden = signedIn;
    cloud.passwordInput.hidden = signedIn;
    cloud.statusEl.hidden = false;
    cloud.exportBtn.disabled = cloud.busy || !signedIn;
    cloud.importBtn.disabled = cloud.busy || !signedIn || cloud.syncInFlight;
    cloud.signInBtn.disabled = cloud.busy || cloud.syncInFlight || signedIn;
    cloud.signOutBtn.disabled = cloud.busy || !signedIn;
    cloud.settingsBtn.disabled = cloud.busy || !signedIn || cloud.syncInFlight;
    cloud.collapseAllBtn.disabled = cloud.busy || !signedIn || cloud.syncInFlight;
    cloud.emailInput.disabled = cloud.busy || signedIn || cloud.syncInFlight;
    cloud.passwordInput.disabled = cloud.busy || cloud.syncInFlight || signedIn;

    if (cloud.busy || cloud.loadingContext || cloud.syncInFlight) {
      cloud.statusEl.classList.toggle('cloud-status-loading', true);
    }

    if (!signedIn && !cloud.busy && !cloud.syncInFlight) {
      setStatus('Ready', 'info', { toast: false });
    }
    updateCloudMeta();
  }

  function renderSignedOutState() {
    [lists.general, lists.personal, lists.scheduling].forEach((list) => {
      list.listEl.innerHTML = '';
    });
    meeting.listEl.innerHTML = '';
    bigTicket.listEl.innerHTML = '';
    generalNotes.listEl.innerHTML = '';
  }

  function applyAuthUiState(options = {}) {
    const signedIn = Boolean(cloud.signedInUser);
    isAuthenticated = signedIn;

    [lists.general, lists.personal, lists.scheduling].forEach((list) => {
      list.form.hidden = !signedIn;
      list.clearBtn.hidden = !signedIn;
    });
    meeting.form.hidden = !signedIn;

    updateCloudUi();

    mainContainer.classList.toggle('is-signed-out', !signedIn);
    if (columnsSection) {
      columnsSection.hidden = !signedIn;
    }
    if (signedOutMessage) {
      signedOutMessage.hidden = signedIn;
    }

    if (!signedIn) {
      renderSignedOutState();
      closeModal(true);
      closeMeetingBigEdit();
      closeBigTicketModal(true);
      closeGeneralNoteBigEdit();
      return;
    }

    if (options.deferRender) {
      return;
    }

    renderAll();
  }

  function emptyDashboardState() {
    return migrateState({
      stateVersion: LATEST_STATE_VERSION,
      generalActions: [],
      personalActions: [],
      schedulingActions: [],
      meetingNotes: [],
      bigTicketItems: [],
      generalNotes: [],
      ui: {
      collapsedCards: { ...collapsedCardsDefault },
      collapsedGeneralNotesMonths: {},
      theme: { presetName: 'Office Blue', vars: { ...defaultTheme } },
      dashboardTitle: DEFAULT_DASHBOARD_TITLE,
      personFilter: 'All',
    },
      meetingNotesUIState: { collapsedMonths: {}, collapsedWeeks: {} },
      nextActionNumber: DEFAULT_NEXT_NUMBER,
    });
  }

  function loadData() {
    withAutosyncSuppressed(() => {
      const storedNext = Number(localStorage.getItem(NEXT_NUMBER_STORAGE_KEY));
      if (Number.isInteger(storedNext) && storedNext > 0) nextActionNumber = storedNext;

      migrateLegacyGeneralData();
      loadList(lists.general);
      loadList(lists.personal);
      loadList(lists.scheduling);
      loadMeetings();
      loadMeetingUIState();
      loadBigTicketItems();
      loadGeneralNotes();
      loadUiState();

      const highest = Math.max(DEFAULT_NEXT_NUMBER - 1, ...lists.general.actions.map((i) => i.number), ...lists.scheduling.actions.map((i) => i.number));
      if (nextActionNumber <= highest) {
        nextActionNumber = highest + 1;
        saveNextNumber();
      }

      localStorage.setItem(LOCAL_STATE_VERSION_KEY, String(LATEST_STATE_VERSION));
      saveList(lists.general);
      saveList(lists.personal);
      saveList(lists.scheduling);
      saveMeetings();
      saveBigTicketItems();
      saveGeneralNotes();
      saveUiState();
      syncAppStateFromMemory();
    });
  }

  function sortNewestFirst(a, b) {
    return b.createdAt - a.createdAt || (Number(b.number) || 0) - (Number(a.number) || 0);
  }

  function sortWithinUrgencyTier(a, b) {
    const aIsTimeDependent = a.timingFlag === 'T';
    const bIsTimeDependent = b.timingFlag === 'T';
    if (aIsTimeDependent !== bIsTimeDependent) return aIsTimeDependent ? -1 : 1;
    return sortNewestFirst(a, b);
  }

  function getActionIdentifier(list, action) {
    return String(list.hideNumber ? action.id : action.number);
  }

  function queueMovedActionHighlight(list, action) {
    const key = `${list.key}:${getActionIdentifier(list, action)}`;
    const existing = movedActionHighlights.get(key);
    if (existing?.timeoutId) clearTimeout(existing.timeoutId);
    const timeoutId = window.setTimeout(() => {
      movedActionHighlights.delete(key);
      const row = list.listEl.querySelector(`.action-item[data-action-id="${CSS.escape(getActionIdentifier(list, action))}"]`);
      if (row) row.classList.remove('move-highlight');
    }, MOVE_HIGHLIGHT_MS);
    movedActionHighlights.set(key, { timeoutId, expiresAt: Date.now() + MOVE_HIGHLIGHT_MS });
  }

  function isActionMoveHighlighted(list, action) {
    const key = `${list.key}:${getActionIdentifier(list, action)}`;
    const entry = movedActionHighlights.get(key);
    if (!entry) return false;
    if (entry.expiresAt <= Date.now()) {
      movedActionHighlights.delete(key);
      return false;
    }
    return true;
  }

  function getOrderedActions(list) {
    const active = list.actions.filter((i) => !i.deleted && !i.completed);
    const superUrgent = active.filter((i) => i.urgencyLevel === 2).sort(sortWithinUrgencyTier);
    const urgent = active.filter((i) => i.urgencyLevel === 1).sort(sortWithinUrgencyTier);
    const normal = active.filter((i) => i.urgencyLevel === 0).sort(sortWithinUrgencyTier);
    const low = active.filter((i) => i.urgencyLevel === URGENCY_LOW).sort(sortWithinUrgencyTier);
    const completed = list.actions.filter((i) => !i.deleted && i.completed).sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
    const deleted = list.actions.filter((i) => i.deleted).sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0));
    return [...superUrgent, ...urgent, ...normal, ...low, ...completed, ...deleted];
  }

  function updateRowTruncation(row) {
    const textEl = row.querySelector('.action-text');
    const toggleBtn = row.querySelector('.action-text-toggle');
    if (!textEl || !toggleBtn) return;
    toggleBtn.hidden = !(textEl.scrollWidth > textEl.clientWidth + 1);
  }

  function getUrgencyLabel(action) {
    if (action.urgencyLevel === 2) return 'Super urgent';
    if (action.urgencyLevel === 1) return 'Urgent';
    if (action.urgencyLevel === URGENCY_LOW) return 'Low';
    return 'None';
  }

  function getUrgencyButtonText(level) {
    if (level === 2) return '!!';
    if (level === URGENCY_LOW) return 'L';
    return '!';
  }

  function cycleUrgencyLevel(level) {
    if (level === 0) return 1;
    if (level === 1) return 2;
    if (level === 2) return URGENCY_LOW;
    return 0;
  }

  function cycleUrgency(action) {
    action.urgencyLevel = cycleUrgencyLevel(action.urgencyLevel);
    action.updatedAt = Date.now();
  }

  function updateModalUrgencyUI(action) {
    modalUrgencyLabel.textContent = getUrgencyLabel(action);
    modalUrgencyBtn.classList.toggle('active', action.urgencyLevel === 1);
    modalUrgencyBtn.classList.toggle('super', action.urgencyLevel === 2);
    modalUrgencyBtn.classList.toggle('low', action.urgencyLevel === URGENCY_LOW);
    modalUrgencyBtn.textContent = getUrgencyButtonText(action.urgencyLevel);
    modalUrgencyBtn.disabled = action.deleted;
  }


  function getTimingFlagLabel(timingFlag) {
    return timingFlag === 'T' ? 'Time-dependent' : timingFlag === 'D' ? 'Delegated' : '';
  }

  function cycleTimingFlag(flag) {
    if (!flag) return 'T';
    if (flag === 'T') return 'D';
    return null;
  }

  function updateModalTimeDependentUI(action) {
    if (!modalTimeDependentBtn || !modalTimeDependentLabel) return;
    const timingFlag = action.timingFlag || null;
    modalTimeDependentBtn.classList.toggle('active', Boolean(timingFlag));
    modalTimeDependentBtn.classList.toggle('delegated', timingFlag === 'D');
    modalTimeDependentBtn.textContent = timingFlag || 'T';
    modalTimeDependentBtn.disabled = action.deleted;
    modalTimeDependentLabel.textContent = getTimingFlagLabel(timingFlag);
    modalTimeDependentLabel.hidden = !timingFlag;
  }

  function getSelectedPersonFilter() {
    return typeof uiState.personFilter === 'string' && uiState.personFilter.trim() ? uiState.personFilter.trim() : 'All';
  }

  function getSelectedTagFilter() {
    return typeof uiState.tagFilter === 'string' && uiState.tagFilter.trim() ? uiState.tagFilter.trim() : 'All';
  }

  function persistViewFilters() {
    saveUiState({ markDirty: false, autosync: false });
  }

  function setPersonFilter(value) {
    uiState.personFilter = typeof value === 'string' && value.trim() ? value.trim() : 'All';
    persistViewFilters();
    renderAll();
  }

  function setTagFilter(value) {
    uiState.tagFilter = typeof value === 'string' && value.trim() ? value.trim() : 'All';
    persistViewFilters();
    renderAll();
  }

  function actionHasPersonTag(action, selectedFilter) {
    if (!selectedFilter || selectedFilter === 'All') return true;
    const selectedLower = selectedFilter.toLowerCase();
    return extractPersonTagsFromAction(action).some((tag) => tag.toLowerCase() === selectedLower);
  }

  function actionHasHashTag(action, selectedFilter) {
    if (!selectedFilter || selectedFilter === 'All') return true;
    const selectedLower = selectedFilter.toLowerCase();
    return extractHashTagsFromAction(action).some((tag) => tag.toLowerCase() === selectedLower);
  }

  function renderActionFilterControls() {
    const personTags = collectPersonTags();
    const hashTags = collectHashTags();
    const selectedPerson = getSelectedPersonFilter();
    const selectedTag = getSelectedTagFilter();
    let didReset = false;

    const validPerson = selectedPerson === 'All' || personTags.some((tag) => tag.toLowerCase() === selectedPerson.toLowerCase());
    if (!validPerson) {
      uiState.personFilter = 'All';
      didReset = true;
    }

    const validTag = selectedTag === 'All' || hashTags.some((tag) => tag.toLowerCase() === selectedTag.toLowerCase());
    if (!validTag) {
      uiState.tagFilter = 'All';
      didReset = true;
    }

    if (didReset) persistViewFilters();

    const effectivePerson = validPerson ? selectedPerson : 'All';
    const effectiveTag = validTag ? selectedTag : 'All';

    [generalPersonFilterSelect, schedulingPersonFilterSelect].forEach((selectEl) => {
      if (!selectEl) return;
      selectEl.innerHTML = '';
      const allOption = document.createElement('option');
      allOption.value = 'All';
      allOption.textContent = 'All';
      selectEl.appendChild(allOption);
      personTags.forEach((tag) => {
        const option = document.createElement('option');
        option.value = tag;
        option.textContent = tag;
        selectEl.appendChild(option);
      });
      const selected = personTags.find((tag) => tag.toLowerCase() === effectivePerson.toLowerCase());
      selectEl.value = effectivePerson === 'All' ? 'All' : (selected || 'All');
    });

    [generalTagFilterSelect, schedulingTagFilterSelect].forEach((selectEl) => {
      if (!selectEl) return;
      selectEl.innerHTML = '';
      const allOption = document.createElement('option');
      allOption.value = 'All';
      allOption.textContent = 'All';
      selectEl.appendChild(allOption);
      hashTags.forEach((tag) => {
        const option = document.createElement('option');
        option.value = tag;
        option.textContent = tag;
        selectEl.appendChild(option);
      });
      const selected = hashTags.find((tag) => tag.toLowerCase() === effectiveTag.toLowerCase());
      selectEl.value = effectiveTag === 'All' ? 'All' : (selected || 'All');
    });
  }

  function renderList(list) {
    list.listEl.innerHTML = '';
    const ordered = getOrderedActions(list);
    const selectedPerson = getSelectedPersonFilter();
    const selectedTag = getSelectedTagFilter();
    const useFilters = list.key === GENERAL_STORAGE_KEY || list.key === SCHEDULING_STORAGE_KEY;
    const visible = useFilters
      ? ordered.filter((action) => actionHasPersonTag(action, selectedPerson) && actionHasHashTag(action, selectedTag))
      : ordered;
    const totalCount = ordered.length;
    const visibleCount = visible.length;

    if (!visible.length) {
      const empty = document.createElement('li');
      empty.className = 'coming-soon';
      empty.textContent = !useFilters || (selectedPerson === 'All' && selectedTag === 'All')
        ? 'No actions yet. Add one to get started.'
        : 'No actions match the selected filters.';
      list.listEl.appendChild(empty);
      const countLabel = useFilters && (selectedPerson !== 'All' || selectedTag !== 'All') ? `Showing 0 of ${totalCount}` : '';
      if (list.key === GENERAL_STORAGE_KEY && generalPersonCountEl) generalPersonCountEl.textContent = countLabel;
      if (list.key === SCHEDULING_STORAGE_KEY && schedulingPersonCountEl) schedulingPersonCountEl.textContent = countLabel;
      return;
    }

    visible.forEach((action) => {
      const li = document.createElement('li');
      li.className = 'action-item';
      li.dataset.actionId = getActionIdentifier(list, action);
      if (action.completed) li.classList.add('completed');
      if (action.deleted) li.classList.add('deleted');
      if (!action.completed && !action.deleted && action.urgencyLevel === 1) li.classList.add('urgent');
      if (!action.completed && !action.deleted && action.urgencyLevel === 2) li.classList.add('super-urgent');
      if (!action.completed && !action.deleted && action.urgencyLevel === URGENCY_LOW) li.classList.add('low-priority');
      if (!action.completed && !action.deleted && action.timingFlag === 'T') li.classList.add('timing-time-dependent');
      if (!action.completed && !action.deleted && action.timingFlag === 'D') li.classList.add('timing-delegated');
      if (isActionMoveHighlighted(list, action)) li.classList.add('move-highlight');

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

      const actionKey = list.hideNumber ? action.id : action.number;

      const number = document.createElement('span');
      number.className = 'action-number';
      number.textContent = list.hideNumber ? '' : String(action.number);
      if (list.hideNumber) number.hidden = true;

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
      text.innerHTML = action.html_inline || escapeHtml(action.text);
      if (action.urgencyLevel === 2 && !action.completed && !action.deleted) text.classList.add('super-urgent-text');
      textWrap.appendChild(text);

      const expandBtn = document.createElement('button');
      expandBtn.type = 'button';
      expandBtn.className = 'action-text-toggle';
      expandBtn.textContent = '+';
      expandBtn.hidden = true;
      expandBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        openModal(list, actionKey);
      });
      textWrap.appendChild(expandBtn);

      const controls = document.createElement('div');
      controls.className = 'action-controls';

      const urgentBtn = document.createElement('button');
      urgentBtn.type = 'button';
      urgentBtn.className = 'icon-btn urgent-btn';
      urgentBtn.disabled = action.deleted;
      urgentBtn.textContent = getUrgencyButtonText(action.urgencyLevel);
      urgentBtn.classList.toggle('active', action.urgencyLevel === 1);
      urgentBtn.classList.toggle('super', action.urgencyLevel === 2);
      urgentBtn.classList.toggle('low', action.urgencyLevel === URGENCY_LOW);
      urgentBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        cycleUrgency(action);
        queueMovedActionHighlight(list, action);
        saveList(list);
        renderList(list);
      });

      const timeDependentBtn = document.createElement('button');
      timeDependentBtn.type = 'button';
      timeDependentBtn.className = 'icon-btn time-dependent-btn';
      timeDependentBtn.disabled = action.deleted;
      timeDependentBtn.textContent = action.timingFlag || 'T';
      timeDependentBtn.classList.toggle('active', Boolean(action.timingFlag));
      timeDependentBtn.classList.toggle('delegated', action.timingFlag === 'D');
      timeDependentBtn.setAttribute('aria-label', 'Toggle time-dependent');
      timeDependentBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        action.timingFlag = cycleTimingFlag(action.timingFlag || null);
        action.updatedAt = Date.now();
        queueMovedActionHighlight(list, action);
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

      controls.append(urgentBtn, timeDependentBtn, deleteBtn);
      li.append(checkbox, number, textWrap, controls);
      li.addEventListener('click', (event) => {
        if (event.target.closest('.action-controls') || event.target.closest('.action-text-toggle') || event.target.closest('input[type="checkbox"]')) {
          return;
        }
        openModal(list, actionKey);
      });
      list.listEl.appendChild(li);
      requestAnimationFrame(() => updateRowTruncation(li));
    });

    const countLabel = useFilters && (selectedPerson !== 'All' || selectedTag !== 'All') ? `Showing ${visibleCount} of ${totalCount}` : '';
    if (list.key === GENERAL_STORAGE_KEY && generalPersonCountEl) generalPersonCountEl.textContent = countLabel;
    if (list.key === SCHEDULING_STORAGE_KEY && schedulingPersonCountEl) schedulingPersonCountEl.textContent = countLabel;
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
      saveBigTicketItems();
      saveGeneralNotes();
      saveUiState();
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
      saveBigTicketItems();
      saveGeneralNotes();
      saveUiState();
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
      monthBody.className = 'meeting-month-body';
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


  function renderCardCollapseState() {
    document.querySelectorAll('[data-card-toggle]').forEach((toggle) => {
      const cardId = toggle.dataset.cardToggle;
      const collapsed = Boolean(uiState.collapsedCards[cardId]);
      const body = document.querySelector(`[data-card-body="${cardId}"]`);
      toggle.textContent = collapsed ? '▸' : '▾';
      toggle.setAttribute('aria-expanded', String(!collapsed));
      if (body) body.hidden = collapsed;
    });
  }


  function getOrdinalSuffix(day) {
    const remainder100 = day % 100;
    if (remainder100 >= 11 && remainder100 <= 13) return 'th';
    const remainder10 = day % 10;
    if (remainder10 === 1) return 'st';
    if (remainder10 === 2) return 'nd';
    if (remainder10 === 3) return 'rd';
    return 'th';
  }

  function renderDashboardHeading() {
    const title = uiState.dashboardTitle || DEFAULT_DASHBOARD_TITLE;
    dashboardTitleEl.textContent = title;
    document.title = title;
    const today = new Date();
    const dayName = today.toLocaleDateString('en-GB', { weekday: 'long' });
    const monthName = today.toLocaleDateString('en-GB', { month: 'long' });
    const day = today.getDate();
    const year = today.getFullYear();
    dashboardDateEl.textContent = `${dayName} ${day}${getOrdinalSuffix(day)} ${monthName} ${year}`;
  }

  function renderCollapseAllButton() {
    const allCollapsed = Object.values(uiState.collapsedCards).every(Boolean);
    cloud.collapseAllBtn.textContent = allCollapsed ? 'Expand' : 'Hide';
    cloud.collapseAllBtn.setAttribute('aria-label', allCollapsed ? 'Expand all cards' : 'Hide all cards');
  }

  function toggleAllCardsCollapse() {
    const allCollapsed = Object.values(uiState.collapsedCards).every(Boolean);
    Object.keys(collapsedCardsDefault).forEach((cardId) => {
      uiState.collapsedCards[cardId] = !allCollapsed;
    });
    saveUiState();
    renderCardCollapseState();
    renderCollapseAllButton();
  }

  function renderBigTicketItems() {
    bigTicket.listEl.innerHTML = '';
    if (!bigTicket.items.length) {
      const empty = document.createElement('li');
      empty.className = 'coming-soon';
      empty.textContent = 'No big ticket items yet.';
      bigTicket.listEl.appendChild(empty);
      return;
    }

    bigTicket.items.forEach((item, index) => {
      const row = document.createElement('li');
      row.className = 'big-ticket-row';
      if (item.urgencyLevel === 1) row.classList.add('urgent');
      if (item.urgencyLevel === 2) row.classList.add('super-urgent');
      if (item.urgencyLevel === URGENCY_LOW) row.classList.add('low-priority');

      const number = document.createElement('span');
      number.className = 'action-number';
      number.textContent = `${index + 1}.`;

      const summary = document.createElement('button');
      summary.type = 'button';
      summary.className = 'big-ticket-summary';
      summary.innerHTML = item.html_inline || escapeHtml(item.text);
      summary.addEventListener('click', () => openBigTicketModal(item.id));

      const controls = document.createElement('div');
      controls.className = 'action-controls';

      const urgentBtn = document.createElement('button');
      urgentBtn.type = 'button';
      urgentBtn.className = 'icon-btn urgent-btn';
      urgentBtn.textContent = getUrgencyButtonText(item.urgencyLevel);
      urgentBtn.classList.toggle('active', item.urgencyLevel === 1);
      urgentBtn.classList.toggle('super', item.urgencyLevel === 2);
      urgentBtn.classList.toggle('low', item.urgencyLevel === URGENCY_LOW);
      urgentBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        item.urgencyLevel = cycleUrgencyLevel(item.urgencyLevel);
        item.updatedAt = Date.now();
        saveBigTicketItems();
        renderBigTicketItems();
      });

      const timeDependentBtn = document.createElement('button');
      timeDependentBtn.type = 'button';
      timeDependentBtn.className = 'icon-btn time-dependent-btn';
      timeDependentBtn.textContent = item.timingFlag || 'T';
      timeDependentBtn.classList.toggle('active', Boolean(item.timingFlag));
      timeDependentBtn.classList.toggle('delegated', item.timingFlag === 'D');
      timeDependentBtn.setAttribute('aria-label', 'Toggle time-dependent');
      timeDependentBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        item.timingFlag = cycleTimingFlag(item.timingFlag || null);
        item.updatedAt = Date.now();
        saveBigTicketItems();
        renderBigTicketItems();
      });

      const upBtn = document.createElement('button');
      upBtn.type = 'button';
      upBtn.className = 'icon-btn';
      upBtn.textContent = '▲';
      upBtn.disabled = index === 0;
      upBtn.setAttribute('aria-label', 'Move up');
      upBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        if (index === 0) return;
        [bigTicket.items[index - 1], bigTicket.items[index]] = [bigTicket.items[index], bigTicket.items[index - 1]];
        item.updatedAt = Date.now();
        saveBigTicketItems();
        renderBigTicketItems();
      });

      const downBtn = document.createElement('button');
      downBtn.type = 'button';
      downBtn.className = 'icon-btn';
      downBtn.textContent = '▼';
      downBtn.disabled = index === bigTicket.items.length - 1;
      downBtn.setAttribute('aria-label', 'Move down');
      downBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        if (index >= bigTicket.items.length - 1) return;
        [bigTicket.items[index], bigTicket.items[index + 1]] = [bigTicket.items[index + 1], bigTicket.items[index]];
        item.updatedAt = Date.now();
        saveBigTicketItems();
        renderBigTicketItems();
      });

      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'icon-btn delete-btn';
      del.textContent = 'X';
      del.addEventListener('click', (event) => {
        event.stopPropagation();
        bigTicket.items = bigTicket.items.filter((entry) => entry.id !== item.id);
        if (bigTicket.activeId === item.id) bigTicket.activeId = null;
        saveBigTicketItems();
        renderBigTicketItems();
      });

      controls.append(urgentBtn, timeDependentBtn, upBtn, downBtn, del);
      row.append(number, summary, controls);
      bigTicket.listEl.appendChild(row);
    });
  }


  function getGeneralNoteGroups() {
    const sorted = [...generalNotes.items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.createdAt - a.createdAt);
    const map = new Map();
    sorted.forEach((note) => {
      const d = new Date(`${note.date}T00:00:00`);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!map.has(key)) {
        map.set(key, { key, label: d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }), items: [] });
      }
      map.get(key).items.push(note);
    });
    return Array.from(map.values());
  }

  function renderGeneralNotes() {
    generalNotes.listEl.innerHTML = '';
    if (!generalNotes.items.length) {
      const empty = document.createElement('p');
      empty.className = 'meeting-empty';
      empty.textContent = 'No general notes yet.';
      generalNotes.listEl.appendChild(empty);
      return;
    }

    getGeneralNoteGroups().forEach((group) => {
      const section = document.createElement('section');
      const headerRow = document.createElement('div');
      headerRow.className = 'general-note-month-row';
      const monthToggle = document.createElement('button');
      monthToggle.type = 'button';
      monthToggle.className = 'collapse-toggle';
      const monthCollapsed = Boolean(uiState.collapsedGeneralNotesMonths[group.key]);
      monthToggle.textContent = monthCollapsed ? '+' : '–';
      monthToggle.addEventListener('click', () => {
        uiState.collapsedGeneralNotesMonths[group.key] = !monthCollapsed;
        generalNotes.uiState.collapsedMonths = uiState.collapsedGeneralNotesMonths;
        saveUiState();
        renderGeneralNotes();
      });
      const header = document.createElement('h4');
      header.className = 'general-note-month-header';
      header.textContent = group.label;
      headerRow.append(monthToggle, header);
      section.appendChild(headerRow);

      const list = document.createElement('ul');
      list.className = 'meeting-items general-note-items';
      list.hidden = monthCollapsed;
      group.items.forEach((note) => {
        const li = document.createElement('li');
        li.className = 'general-note-item';
        const summary = document.createElement('button');
        summary.type = 'button';
        summary.className = 'general-note-summary';
        const day = note.date.split('-').reverse().slice(0, 2).join('/');
        summary.textContent = `${day} — ${note.title}`;
        summary.addEventListener('click', () => {
          generalNotes.expandedId = generalNotes.expandedId === note.id ? null : note.id;
          generalNotes.editingId = null;
          renderGeneralNotes();
        });
        li.appendChild(summary);

        if (generalNotes.expandedId === note.id) {
          const detail = document.createElement('div');
          detail.className = 'general-note-detail';

          if (generalNotes.editingId === note.id) {
            const form = document.createElement('form');
            form.className = 'meeting-edit-form';
            const d = document.createElement('input'); d.type = 'date'; d.required = true; d.value = note.date;
            const t = document.createElement('input'); t.type = 'text'; t.required = true; t.value = note.title;
            const toolbar = document.createElement('div'); toolbar.className = 'rtf-toolbar';
            const editorId = `gn-edit-${note.id}`; toolbar.dataset.editorTarget = editorId;
            toolbar.innerHTML = '<button type="button" data-command="bold">B</button><button type="button" data-command="italic">I</button><button type="button" data-command="underline">U</button><button type="button" data-command="insertUnorderedList">•</button><button type="button" data-command="insertOrderedList">1.</button>';
            const editor = document.createElement('div'); editor.id = editorId; editor.className = 'modal-editor'; editor.contentEditable = 'true'; editor.innerHTML = note.html;
            const controls = document.createElement('div'); controls.className = 'meeting-detail-controls';
            const save = document.createElement('button'); save.type='submit'; save.className='meeting-link-btn'; save.textContent='Save';
            const cancel = document.createElement('button'); cancel.type='button'; cancel.className='meeting-link-btn'; cancel.textContent='Cancel';
            cancel.addEventListener('click',()=>{generalNotes.editingId=null; renderGeneralNotes();});
            controls.append(save,cancel);
            form.append(d,t,toolbar,editor,controls);
            bindRtfToolbar(toolbar); bindEditorShortcuts(editor);
            form.addEventListener('submit',(e)=>{e.preventDefault(); const html=sanitizeRichHtml(editor.innerHTML); const text=htmlToPlainText(html); const title=t.value.trim(); if(!title||!d.value||!text)return; note.date=d.value; note.title=title; note.html=html; note.text=text; note.html_inline=richHtmlToInlineHtml(html); note.updatedAt=Date.now(); saveGeneralNotes(); generalNotes.editingId=null; renderGeneralNotes();});
            detail.appendChild(form);
          } else {
            const notes = document.createElement('div'); notes.className = 'meeting-notes-rendered'; notes.innerHTML = note.html;
            const controls = document.createElement('div'); controls.className = 'meeting-detail-controls';
            const edit = document.createElement('button'); edit.type='button'; edit.className='meeting-link-btn'; edit.textContent='Edit'; edit.addEventListener('click',()=>{generalNotes.editingId=note.id; renderGeneralNotes();});
            const big = document.createElement('button'); big.type='button'; big.className='meeting-link-btn'; big.textContent='Big edit'; big.addEventListener('click',()=>openGeneralNoteBigEdit(note.id));
            const del = document.createElement('button'); del.type='button'; del.className='meeting-link-btn delete'; del.textContent='Delete'; del.addEventListener('click',()=>{generalNotes.items=generalNotes.items.filter((n)=>n.id!==note.id); if(generalNotes.expandedId===note.id)generalNotes.expandedId=null; saveGeneralNotes(); renderGeneralNotes();});
            controls.append(edit,big,del);
            detail.append(notes,controls);
          }
          li.appendChild(detail);
        }
        list.appendChild(li);
      });
      section.appendChild(list);
      generalNotes.listEl.appendChild(section);
    });
  }

  function renderAll() {
    renderDashboardHeading();
    if (!isAuthenticated) {
      renderSignedOutState();
      return;
    }
    console.debug('[renderAll]', {
      generalActions: lists.general.actions.length,
      personalActions: lists.personal.actions.length,
      schedulingActions: lists.scheduling.actions.length,
      bigTicketItems: bigTicket.items.length,
      meetingNotes: meeting.items.length,
      generalNotes: generalNotes.items.length,
    });
    renderActionFilterControls();
    renderList(lists.general);
    renderList(lists.personal);
    renderList(lists.scheduling);
    renderBigTicketItems();
    renderMeetings();
    renderGeneralNotes();
    renderCardCollapseState();
    renderCollapseAllButton();
  }

  function addAction(list, rawHtml, options = {}) {
    const html = sanitizeRichHtml(rawHtml);
    const text = htmlToPlainText(html);
    if (!text) return;
    const now = Date.now();
    const item = {
      text,
      html,
      html_inline: richHtmlToInlineHtml(html),
      createdAt: now,
      updatedAt: now,
      completed: false,
      deleted: false,
      urgencyLevel: Math.max(0, Math.min(URGENCY_LOW, Number.isInteger(options.urgencyLevel) ? options.urgencyLevel : 0)),
      timingFlag: options.timingFlag === 'T' || options.timingFlag === 'D' ? options.timingFlag : null,
      completedAt: null,
      deletedAt: null,
    };

    if (list.hideNumber) {
      item.id = `${list.idPrefix || 'pact'}-${now}-${Math.random().toString(16).slice(2)}`;
    } else {
      item.number = nextActionNumber;
      nextActionNumber += 1;
      saveNextNumber();
    }

    list.actions.unshift(item);
    saveList(list);
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
    activeMeetingBigEditDraft = null;
    return true;
  }


  function addBigTicketItem(rawHtml) {
    const html = sanitizeRichHtml(rawHtml);
    const text = htmlToPlainText(html);
    if (!text) return false;
    const now = Date.now();
    bigTicket.items.unshift({ id: `ticket-${now}-${Math.random().toString(16).slice(2)}`, html, html_inline: richHtmlToInlineHtml(html), text, urgencyLevel: 0, timingFlag: null, createdAt: now, updatedAt: now });
    saveBigTicketItems();
    renderBigTicketItems();
    return true;
  }

  function openBigTicketModal(id) {
    const item = bigTicket.items.find((entry) => entry.id === id);
    if (!item) return;
    bigTicket.activeId = id;
    bigTicketModalEditor.innerHTML = item.html;
    bigTicketModal.hidden = false;
    bigTicketModalEditor.focus();
  }

  function saveBigTicketModal() {
    const item = bigTicket.items.find((entry) => entry.id === bigTicket.activeId);
    if (!item) return false;
    const html = sanitizeRichHtml(bigTicketModalEditor.innerHTML);
    const text = htmlToPlainText(html);
    if (!text) return false;
    item.html = html;
    item.text = text;
    item.html_inline = richHtmlToInlineHtml(html);
    item.updatedAt = Date.now();
    saveBigTicketItems();
    renderBigTicketItems();
    return true;
  }

  function closeBigTicketModal(skipSave = false) {
    if (!skipSave && bigTicket.activeId) saveBigTicketModal();
    bigTicketModal.hidden = true;
    bigTicket.activeId = null;
  }

  function addGeneralNote(dateRaw, titleRaw, htmlRaw) {
    const title = titleRaw.trim();
    const html = sanitizeRichHtml(htmlRaw);
    const text = htmlToPlainText(html);
    if (!dateRaw || !title || !text) return false;
    const now = Date.now();
    generalNotes.items.push({ id: `gn-${now}-${Math.random().toString(16).slice(2)}`, date: dateRaw, title, html, html_inline: richHtmlToInlineHtml(html), text, createdAt: now, updatedAt: now });
    saveGeneralNotes();
    renderGeneralNotes();
    activeGeneralNoteBigEditDraft = null;
    return true;
  }

  function getGeneralNoteById(id) {
    return generalNotes.items.find((item) => item.id === id) || null;
  }

  function openGeneralNoteBigEdit(id) {
    const item = getGeneralNoteById(id);
    if (!item) return;
    activeGeneralNoteBigEditId = id;
    activeGeneralNoteBigEditDraft = { title: item.title, date: item.date, html: item.html };
    generalNoteBigEditTitleInput.value = item.title;
    generalNoteBigEditDateInput.value = item.date;
    generalNoteBigEditEditor.innerHTML = item.html;
    generalNoteBigEditModal.hidden = false;
  }

  function closeGeneralNoteBigEdit() {
    stopDictation();
    if (activeGeneralNoteBigEditDraft) {
      generalNoteBigEditTitleInput.value = activeGeneralNoteBigEditDraft.title;
      generalNoteBigEditDateInput.value = activeGeneralNoteBigEditDraft.date;
      generalNoteBigEditEditor.innerHTML = activeGeneralNoteBigEditDraft.html;
    }
    generalNoteBigEditModal.hidden = true;
    activeGeneralNoteBigEditId = null;
    activeGeneralNoteBigEditDraft = null;
  }

  function saveGeneralNoteBigEdit() {
    const item = getGeneralNoteById(activeGeneralNoteBigEditId);
    if (!item) return false;
    const title = generalNoteBigEditTitleInput.value.trim();
    const date = generalNoteBigEditDateInput.value;
    const html = sanitizeRichHtml(generalNoteBigEditEditor.innerHTML);
    const text = htmlToPlainText(html);
    if (!title || !date || !text) return false;
    item.title = title;
    item.date = date;
    item.html = html;
    item.text = text;
    item.html_inline = richHtmlToInlineHtml(html);
    item.updatedAt = Date.now();
    saveGeneralNotes();
    renderGeneralNotes();
    return true;
  }


  function fillSettingsForm(themeLike) {
    const themeState = normalizeThemeState(themeLike || uiState.theme);
    const theme = themeState.vars;
    suppressThemePresetSync = true;
    themePresetSelect.value = themeState.presetName;
    dashboardTitleInput.value = uiState.dashboardTitle;
    themeBannerBgInput.value = theme.bannerBg;
    themeBannerFgInput.value = theme.bannerFg;
    themePageBgInput.value = theme.pageBg;
    themeCardHeaderBgInput.value = theme.cardHeaderBg;
    themeCardHeaderFgInput.value = theme.cardHeaderFg;
    suppressThemePresetSync = false;
  }

  function getThemeVarsFromSettingsForm() {
    return normalizeTheme({
      bannerBg: themeBannerBgInput.value,
      bannerFg: themeBannerFgInput.value,
      pageBg: themePageBgInput.value,
      cardHeaderBg: themeCardHeaderBgInput.value,
      cardHeaderFg: themeCardHeaderFgInput.value,
    });
  }

  function getThemeFromSettingsForm() {
    const vars = getThemeVarsFromSettingsForm();
    const selectedPreset = themePresetSelect.value;
    const presetName = selectedPreset === 'Custom' ? 'Custom' : resolveThemePresetName(vars) === selectedPreset ? selectedPreset : 'Custom';
    return normalizeThemeState({ presetName, vars });
  }

  function previewSettingsTheme() {
    settingsThemeDraft = getThemeFromSettingsForm();
    applyTheme(settingsThemeDraft.vars);
  }

  function applyThemePresetFromSettings() {
    if (suppressThemePresetSync) return;
    const preset = themePresetSelect.value;
    if (!THEMES[preset]) {
      previewSettingsTheme();
      return;
    }
    fillSettingsForm({ presetName: preset, vars: THEMES[preset] });
    previewSettingsTheme();
  }

  function onThemeColorInputChange() {
    if (suppressThemePresetSync) return;
    if (themePresetSelect.value !== 'Custom') {
      suppressThemePresetSync = true;
      themePresetSelect.value = 'Custom';
      suppressThemePresetSync = false;
    }
    previewSettingsTheme();
  }

  function openSettingsModal() {
    settingsThemeSavedSnapshot = normalizeThemeState(uiState.theme);
    fillSettingsForm(settingsThemeSavedSnapshot);
    settingsThemeDraft = normalizeThemeState(settingsThemeSavedSnapshot);
    applyTheme(settingsThemeDraft.vars);
    settingsModal.hidden = false;
    themePresetSelect.focus();
  }

  function closeSettingsModal({ revert = true } = {}) {
    if (revert && settingsThemeSavedSnapshot) {
      applyTheme(settingsThemeSavedSnapshot.vars);
    }
    settingsModal.hidden = true;
    settingsThemeDraft = null;
    settingsThemeSavedSnapshot = null;
  }

  function openImportModal() {
    importForm.reset();
    const defaultMode = importForm.querySelector('input[name="import-mode"][value="merge"]');
    if (defaultMode) defaultMode.checked = true;
    importModal.hidden = false;
    importFileInput.focus();
  }

  function closeImportModal() {
    importModal.hidden = true;
    importForm.reset();
    importFileInput.value = '';
  }

  function saveSettingsModal() {
    uiState.theme = settingsThemeDraft ? normalizeThemeState(settingsThemeDraft) : getThemeFromSettingsForm();
    uiState.dashboardTitle = dashboardTitleInput.value.trim() || DEFAULT_DASHBOARD_TITLE;
    applyTheme(uiState.theme.vars);
    saveUiState();
    renderAll();
  }

  function modalStatusText(action) {
    const created = `Created: ${formatLocalDate(action.createdAt)}`;
    const completed = action.completed ? `Completed: ${formatLocalDate(action.completedAt)}` : null;
    const deleted = action.deleted ? `Deleted: ${formatLocalDate(action.deletedAt)}` : null;
    const urgency = getUrgencyLabel(action) !== 'None' ? getUrgencyLabel(action) : null;
    const timing = getTimingFlagLabel(action.timingFlag || null) || null;
    return [deleted || completed || created, created, completed, deleted, urgency, timing].filter(Boolean).join(' • ');
  }

  function findActionForList(list, actionKey) {
    if (list.hideNumber) {
      return list.actions.find((item) => item.id === actionKey) || null;
    }
    return list.actions.find((item) => item.number === actionKey) || null;
  }

  function getActiveModalAction() {
    if (!activeModalContext) return null;
    return findActionForList(activeModalContext.list, activeModalContext.actionKey);
  }

  function openModal(list, actionKey) {
    const action = findActionForList(list, actionKey);
    if (!action) return;
    ensureActionRichContent(action);
    activeModalContext = { list, actionKey };
    modalTitle.textContent = list.hideNumber ? 'Action details' : `${action.number}`;
    modalStatus.textContent = modalStatusText(action);
    modalTextInput.innerHTML = action.html;
    updateModalUrgencyUI(action);
    updateModalTimeDependentUI(action);
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
    action.html_inline = richHtmlToInlineHtml(html);
    action.updatedAt = Date.now();
    saveList(activeModalContext.list);
    renderList(activeModalContext.list);
    return true;
  }

  function closeModal(skipPersist = false) {
    stopDictation();
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


  function appendDictatedTextToTarget(target, text) {
    if (!target || !text) return;
    target.focus();
    const content = `${text} `;
    if (document.activeElement === target && typeof document.execCommand === 'function') {
      document.execCommand('insertText', false, content);
      return;
    }
    if (target.isContentEditable) {
      target.innerHTML += `${escapeHtml(text)} `;
    } else if ('value' in target) {
      target.value = `${target.value || ''}${content}`;
    }
  }

  function stopDictation() {
    if (!dictationState.recognition) return;
    dictationState.recognition.stop();
  }

  function updateDictationButtonState(button, listening) {
    if (!button) return;
    button.textContent = listening ? 'Stop' : 'Dictate';
    button.classList.toggle('active', listening);
  }

  function startDictation(button, defaultTarget, fallbackTarget) {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      showToast('Dictation not supported in this browser.', 'warning');
      return;
    }

    if (dictationState.button === button && dictationState.recognition) {
      stopDictation();
      return;
    }

    stopDictation();

    const recognition = new Recognition();
    recognition.lang = 'en-GB';
    recognition.continuous = true;
    recognition.interimResults = false;

    dictationState.recognition = recognition;
    dictationState.button = button;
    dictationState.defaultTarget = defaultTarget;
    dictationState.fallbackTarget = fallbackTarget || defaultTarget;
    updateDictationButtonState(button, true);

    recognition.onresult = (event) => {
      const idx = event.resultIndex;
      const transcript = event.results[idx] && event.results[idx][0] ? event.results[idx][0].transcript : '';
      const active = document.activeElement;
      const target = active && active.isContentEditable ? active : dictationState.fallbackTarget;
      appendDictatedTextToTarget(target, transcript.trim());
    };

    recognition.onerror = () => {
      updateDictationButtonState(dictationState.button, false);
      dictationState.recognition = null;
      dictationState.button = null;
    };

    recognition.onend = () => {
      updateDictationButtonState(dictationState.button, false);
      dictationState.recognition = null;
      dictationState.button = null;
    };

    recognition.start();
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


  function getCreationState(list) {
    if (list.key === GENERAL_STORAGE_KEY) return creationState.general;
    if (list.key === SCHEDULING_STORAGE_KEY) return creationState.scheduling;
    return creationDefaults;
  }

  function renderCreationControls(list) {
    const state = getCreationState(list);
    if (list.createUrgencyBtn) {
      list.createUrgencyBtn.textContent = getUrgencyButtonText(state.urgencyLevel);
      list.createUrgencyBtn.classList.toggle('active', state.urgencyLevel === 1);
      list.createUrgencyBtn.classList.toggle('super', state.urgencyLevel === 2);
      list.createUrgencyBtn.classList.toggle('low', state.urgencyLevel === URGENCY_LOW);
    }
    if (list.createTimingBtn) {
      list.createTimingBtn.textContent = state.timingFlag || 'T';
      list.createTimingBtn.classList.toggle('active', Boolean(state.timingFlag));
      list.createTimingBtn.classList.toggle('delegated', state.timingFlag === 'D');
    }
  }

  function resetCreationState(list) {
    const state = getCreationState(list);
    state.urgencyLevel = 0;
    state.timingFlag = null;
    renderCreationControls(list);
  }

  function bindListEvents(list) {
    list.form.addEventListener('submit', (event) => {
      event.preventDefault();
      const state = getCreationState(list);
      addAction(list, list.input.innerHTML, { urgencyLevel: state.urgencyLevel, timingFlag: state.timingFlag });
      list.input.innerHTML = '';
      resetCreationState(list);
      list.input.focus();
    });

    list.input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        list.form.requestSubmit();
      }
    });

    if (list.createUrgencyBtn) {
      list.createUrgencyBtn.addEventListener('click', () => {
        const state = getCreationState(list);
        state.urgencyLevel = cycleUrgencyLevel(state.urgencyLevel);
        renderCreationControls(list);
      });
    }

    if (list.createTimingBtn) {
      list.createTimingBtn.addEventListener('click', () => {
        const state = getCreationState(list);
        state.timingFlag = cycleTimingFlag(state.timingFlag);
        renderCreationControls(list);
      });
    }

    renderCreationControls(list);

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
    activeMeetingBigEditDraft = {
      title: item.title,
      date: dateToDateValue(date),
      hour: String(date.getHours()).padStart(2, '0'),
      minute: ALLOWED_MINUTES.includes(String(date.getMinutes()).padStart(2, '0')) ? String(date.getMinutes()).padStart(2, '0') : '00',
      notesHtml: item.notesHtml,
    };
    meetingBigEditTitleInput.value = item.title;
    meetingBigEditDateInput.value = dateToDateValue(date);
    meetingBigEditHourInput.value = activeMeetingBigEditDraft.hour;
    meetingBigEditMinuteInput.value = activeMeetingBigEditDraft.minute;
    meetingBigEditNotesEditor.innerHTML = activeMeetingBigEditDraft.notesHtml;
    meetingBigEditModal.hidden = false;
    meetingBigEditTitleInput.focus();
  }

  function closeMeetingBigEdit() {
    stopDictation();
    if (activeMeetingBigEditDraft) {
      meetingBigEditTitleInput.value = activeMeetingBigEditDraft.title;
      meetingBigEditDateInput.value = activeMeetingBigEditDraft.date;
      meetingBigEditHourInput.value = activeMeetingBigEditDraft.hour;
      meetingBigEditMinuteInput.value = activeMeetingBigEditDraft.minute;
      meetingBigEditNotesEditor.innerHTML = activeMeetingBigEditDraft.notesHtml;
    }
    meetingBigEditModal.hidden = true;
    activeMeetingBigEditId = null;
    activeMeetingBigEditDraft = null;
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


  async function signInWithPassword() {
    if (cloud.busy) return;
    const email = cloud.emailInput.value.trim();
    const password = cloud.passwordInput.value;
    if (!email || !password) {
      setStatus('Sign in failed: Enter email and password first.', 'error');
      return;
    }

    setLoading(true, 'signIn');
    try {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) {
        setStatus(`Sign in failed: ${error.message}`, 'error');
        return;
      }
      cloud.passwordInput.value = '';
    } finally {
      setLoading(false);
    }
  }

  async function signOutCloud() {
    if (cloud.busy || !cloud.signedInUser) return;
    setLoading(true, 'authSignOut');
    const { error } = await sb.auth.signOut();
    if (error) {
      setStatus(`Sign out failed: ${error.message}`, 'error');
    }
    setLoading(false);
  }

  async function fetchCloudStateRow(userId) {
    const { data, error } = await sb.from('dashboard_state')
      .select('state, updated_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      setStatus(`Cloud load failed: ${error.message}`, 'error');
      return null;
    }
    return data || null;
  }

  async function fetchCloudUpdatedAt(userId) {
    const { data, error } = await sb.from('dashboard_state')
      .select('updated_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      setStatus(`Sync error: ${error.message}`, 'error');
      return { ok: false, updatedAt: null };
    }
    return { ok: true, updatedAt: data?.updated_at || null };
  }

  function isCloudNewerThanLastKnown(cloudUpdatedAt) {
    if (!cloudUpdatedAt) return false;
    if (!cloud.lastCloudUpdatedAt) return true;
    return new Date(cloudUpdatedAt).getTime() > new Date(cloud.lastCloudUpdatedAt).getTime();
  }

  async function pullCloudState(options = {}) {
    const user = cloud.signedInUser;
    if (!user) {
      setStatus('Please sign in first.', 'error');
      return false;
    }

    const row = await fetchCloudStateRow(user.id);
    if (row === null) {
      if (!options.silentNoData) {
        setStatus('No cloud data found.', 'warning');
      }
      return false;
    }

    if (!row.state) {
      if (!options.silentNoData) {
        setStatus('No cloud data found.', 'warning');
      }
      return false;
    }

    setLocalDashboardState(row.state);
    const syncedAt = new Date().toISOString();
    localStorage.setItem(CLOUD_LAST_PULL_KEY, syncedAt);
    markLastSynced(syncedAt, row.updated_at || syncedAt);
    if (!options.silentSuccess) {
    }
    return true;
  }

  async function pushCloudState(options = {}) {
    const user = cloud.signedInUser;
    if (!user) {
      setStatus('Please sign in first.', 'error');
      return false;
    }

    const meta = await fetchCloudUpdatedAt(user.id);
    if (!meta.ok) return false;

    if (isCloudNewerThanLastKnown(meta.updatedAt)) {
      const recentDirty = localDirtySince && (Date.now() - localDirtySince) < 5 * 60 * 1000;
      showToast(recentDirty
        ? 'Cloud updated elsewhere — reloaded latest to avoid overwriting.'
        : 'Updated from another device', 'warning');
      await pullCloudState({ silentSuccess: true });
      return 'conflict';
    }

    const state = migrateState(getLocalDashboardState());
    const nowIso = new Date().toISOString();
    const { error } = await sb.from('dashboard_state').upsert({
      user_id: user.id,
      state,
      updated_at: nowIso,
    });

    if (error) {
      setStatus(`Sync failed: ${error.message}`, 'error');
      return false;
    }

    localStorage.setItem(CLOUD_LAST_PUSH_KEY, nowIso);
    markLastSynced(nowIso, nowIso);
    clearLocalDirty();
    if (!options.silentSuccess) {
    }
    return true;
  }

  function requestAutosync() {
    if (suppressAutosync || cloud.importInProgress || !isAuthenticated || !cloud.signedInUser) return;
    autosyncPending = true;
    if (autosyncTimer) {
      window.clearTimeout(autosyncTimer);
    }
    autosyncTimer = window.setTimeout(() => {
      autosyncTimer = null;
      runAutosync().catch((error) => {
        setStatus(`Sync failed: ${error.message}`, 'error');
      });
    }, AUTOSYNC_DEBOUNCE_MS);
  }

  async function runAutosync() {
    if (autosyncInFlight || !cloud.signedInUser) return;
    autosyncInFlight = true;
    setSyncIndicator(true);
    try {
      while (autosyncPending) {
        autosyncPending = false;
        const result = await pushCloudState({ silentSuccess: true });
        if (result === 'conflict') {
          continue;
        }
        if (!result) {
          break;
        }
      }
      if (!autosyncPending) {
        }
    } finally {
      autosyncInFlight = false;
      setSyncIndicator(false);
    }
  }

  async function refreshFromCloudIfNewer(options = {}) {
    if (!cloud.signedInUser || cloud.importInProgress || cloud.refreshInFlight) return false;
    cloud.refreshInFlight = true;
    setSyncIndicator(true);
    try {
      const meta = await fetchCloudUpdatedAt(cloud.signedInUser.id);
      if (!meta.ok || !meta.updatedAt) return false;
      if (!isCloudNewerThanLastKnown(meta.updatedAt)) return false;
      const recentDirty = localDirtySince && (Date.now() - localDirtySince) < 5 * 60 * 1000;
      await pullCloudState({ silentSuccess: true });
      showToast(recentDirty
        ? 'Cloud updated elsewhere — reloaded latest to avoid overwriting.'
        : 'Updated from another device', recentDirty ? 'warning' : 'info');
      return true;
    } finally {
      cloud.refreshInFlight = false;
      setSyncIndicator(false);
    }
  }

  function scheduleFocusRefresh() {
    if (!cloud.signedInUser || cloud.importInProgress) return;
    hydrateFromLocalCacheAndRender();
    if (cloud.focusRefreshTimer) window.clearTimeout(cloud.focusRefreshTimer);
    cloud.focusRefreshTimer = window.setTimeout(() => {
      cloud.focusRefreshTimer = null;
      refreshFromCloudIfNewer().catch((error) => {
        setStatus(`Sync error: ${error.message}`, 'error');
      });
    }, FOCUS_SYNC_DEBOUNCE_MS);
  }

  async function exportCloudBackup() {
    if (!cloud.signedInUser || cloud.busy) return;
    setLoading(true, 'export');
    try {
      const row = await fetchCloudStateRow(cloud.signedInUser.id);
      const sourceState = row?.state ? migrateState(row.state) : getLocalDashboardState();
      const payload = {
        exportedAt: new Date().toISOString(),
        stateVersion: sourceState.stateVersion || LATEST_STATE_VERSION,
        state: sourceState,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `dashboard-backup-${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setStatus('Backup exported', 'success');
    } finally {
      setLoading(false);
    }
  }

  function extractActionNumber(action) {
    const asNumber = Number(action?.number);
    if (Number.isInteger(asNumber)) return asNumber;
    const idAsNumber = Number(action?.id);
    return Number.isInteger(idAsNumber) ? idAsNumber : null;
  }

  function dedupeActionsByNumber(items) {
    const byNumber = new Map();
    items.forEach((item) => {
      const normalized = normalizeAction(item);
      if (!normalized) return;
      const number = extractActionNumber(normalized);
      if (!Number.isInteger(number)) return;
      normalized.number = number;
      byNumber.set(number, normalized);
    });
    return Array.from(byNumber.values());
  }

  function mergeById(currentItems, importedItems, normalizer) {
    const merged = new Map();
    currentItems.forEach((item) => {
      const normalized = normalizer(item);
      if (normalized?.id) merged.set(normalized.id, normalized);
    });
    importedItems.forEach((item) => {
      const normalized = normalizer(item);
      if (normalized?.id) merged.set(normalized.id, normalized);
    });
    return Array.from(merged.values());
  }

  function computeNextActionNumber(state) {
    const numbers = [
      ...state.generalActions.map((item) => extractActionNumber(item)).filter(Number.isInteger),
      ...state.schedulingActions.map((item) => extractActionNumber(item)).filter(Number.isInteger),
    ];
    const maxNumber = numbers.length ? Math.max(...numbers) : DEFAULT_NEXT_NUMBER - 1;
    return maxNumber + 1;
  }

  function mergeDashboardState(currentState, importedState) {
    const merged = migrateState({
      ...currentState,
      generalActions: dedupeActionsByNumber([...currentState.generalActions, ...importedState.generalActions]),
      schedulingActions: dedupeActionsByNumber([...currentState.schedulingActions, ...importedState.schedulingActions]),
      personalActions: mergeById(currentState.personalActions || [], importedState.personalActions || [], (item) => normalizeAction(item, { requireNumber: false, idPrefix: 'pact' })),
      bigTicketItems: mergeById(currentState.bigTicketItems, importedState.bigTicketItems, normalizeBigTicketItem),
      meetingNotes: mergeById(currentState.meetingNotes, importedState.meetingNotes, normalizeMeeting),
      generalNotes: mergeById(currentState.generalNotes, importedState.generalNotes, normalizeGeneralNote),
      ui: {
        collapsedCards: currentState.ui?.collapsedCards || importedState.ui?.collapsedCards || { ...collapsedCardsDefault },
        collapsedGeneralNotesMonths: currentState.ui?.collapsedGeneralNotesMonths || importedState.ui?.collapsedGeneralNotesMonths || {},
        theme: currentState.ui?.theme || importedState.ui?.theme || normalizeThemeState(defaultTheme),
        dashboardTitle: currentState.ui?.dashboardTitle || importedState.ui?.dashboardTitle || DEFAULT_DASHBOARD_TITLE,
        personFilter: currentState.ui?.personFilter || importedState.ui?.personFilter || 'All',
        tagFilter: currentState.ui?.tagFilter || importedState.ui?.tagFilter || 'All',
      },
      meetingNotesUIState: currentState.meetingNotesUIState || importedState.meetingNotesUIState || { collapsedMonths: {}, collapsedWeeks: {} },
      stateVersion: LATEST_STATE_VERSION,
    });
    merged.nextActionNumber = computeNextActionNumber(merged);
    return merged;
  }

  async function importCloudBackup(file, mode) {
    if (!file || !cloud.signedInUser || cloud.busy || !mode) return false;
    setLoading(true, 'import');
    cloud.importInProgress = true;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== 'object' || !parsed.state) {
        setStatus('Import failed: invalid backup format.', 'error');
        return false;
      }

      const importedState = migrateState({
        stateVersion: Number(parsed.stateVersion) || Number(parsed.state?.stateVersion) || 1,
        ...parsed.state,
      });

      let finalState;
      if (mode === 'overwrite') {
        const confirmed = window.confirm('This will replace all current data. Continue?');
        if (!confirmed) return false;
        finalState = migrateState(importedState);
      } else {
        finalState = mergeDashboardState(getLocalDashboardState(), importedState);
      }
      finalState.nextActionNumber = computeNextActionNumber(finalState);

      setLocalDashboardState(finalState, { markDirty: true });
      const result = await pushCloudState({ silentSuccess: true });
      if (!result || result === 'conflict') {
        setStatus(`Imported (${mode}) locally; cloud sync needs retry.`, 'warning');
        return true;
      }
      const verb = mode === 'overwrite' ? 'overwrite' : 'merge';
      setStatus(`Imported (${verb})`, 'success');
      showToast(`Imported (${verb})`, 'success');
      return true;
    } catch (error) {
      setStatus(`Import failed: ${error.message}`, 'error');
      return false;
    } finally {
      cloud.importInProgress = false;
      importFileInput.value = '';
      setLoading(false);
    }
  }

  async function handleAuthStateChange(event, session) {
    cloud.signedInUser = session?.user || null;
    applyAuthUiState({ deferRender: event === 'SIGNED_IN' || event === 'INITIAL_SESSION' });

    if (!cloud.signedInUser) {
      autosyncPending = false;
      if (autosyncTimer) {
        window.clearTimeout(autosyncTimer);
        autosyncTimer = null;
      }
      setLoading(false);
      if (event === 'SIGNED_OUT') {
        setStatus('Signed out', 'info');
      }
      return;
    }

    if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
      hydrateFromLocalCacheAndRender();
      setLoading(false);

      await refreshFromCloudIfNewer({ reason: 'auth' });

      const row = await fetchCloudStateRow(cloud.signedInUser.id);
      if (row && row.state) {
        if (!cloud.lastCloudUpdatedAt || isCloudNewerThanLastKnown(row.updated_at)) {
          setLocalDashboardState(row.state);
        }
        markLastSynced(new Date().toISOString(), row.updated_at || new Date().toISOString());
      } else {
        const defaultState = emptyDashboardState();
        setLocalDashboardState(defaultState);
        await pushCloudState({ silentSuccess: true });
      }
      if (cloud.signedInUser.email) {
        showToast(`Signed in as ${cloud.signedInUser.email}`, 'success');
      }
    }
  }

  async function initializeAuth() {
    const { data: { session } } = await sb.auth.getSession();
    await handleAuthStateChange('INITIAL_SESSION', session || null);
  }

  function bindCloudEvents() {
    cloud.signInBtn.addEventListener('click', signInWithPassword);
    cloud.signOutBtn.addEventListener('click', signOutCloud);
    cloud.exportBtn.addEventListener('click', exportCloudBackup);
    cloud.importBtn.addEventListener('click', openImportModal);

    const submitSignIn = (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        signInWithPassword();
      }
    };

    cloud.emailInput.addEventListener('keydown', submitSignIn);
    cloud.passwordInput.addEventListener('keydown', submitSignIn);

    sb.auth.onAuthStateChange((event, session) => {
      handleAuthStateChange(event, session).catch((error) => {
        setStatus(`Auth state failed: ${error.message}`, 'error');
      });
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

  function bindCardToggleEvents() {
    document.querySelectorAll('[data-card-toggle]').forEach((toggle) => {
      toggle.addEventListener('click', () => {
        const cardId = toggle.dataset.cardToggle;
        uiState.collapsedCards[cardId] = !uiState.collapsedCards[cardId];
        saveUiState();
        renderCardCollapseState();
        renderCollapseAllButton();
      });
    });
  }

  function bindBigTicketEvents() {
    bigTicket.form.addEventListener('submit', (event) => {
      event.preventDefault();
      const added = addBigTicketItem(bigTicket.input.innerHTML);
      if (!added) return;
      bigTicket.input.innerHTML = '';
      bigTicket.input.focus();
    });

    bigTicket.input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        bigTicket.form.requestSubmit();
      }
    });
  }

  function bindGeneralNotesEvents() {
    generalNotes.form.addEventListener('submit', (event) => {
      event.preventDefault();
      const added = addGeneralNote(generalNotes.dateInput.value, generalNotes.titleInput.value, generalNotes.editor.innerHTML);
      if (!added) return;
      generalNotes.form.reset();
      generalNotes.editor.innerHTML = '';
      generalNotes.dateInput.focus();
    });
  }


  populateHourOptions(meeting.hourInput);
  populateHourOptions(meetingBigEditHourInput);
  meeting.minuteInput.value = '00';

  document.querySelectorAll('.rtf-toolbar').forEach(bindRtfToolbar);
  bindEditorShortcuts(modalTextInput);
  bindEditorShortcuts(lists.general.input);
  bindEditorShortcuts(lists.personal.input);
  bindEditorShortcuts(lists.scheduling.input);
  bindEditorShortcuts(meeting.notesEditor);
  bindEditorShortcuts(meetingBigEditNotesEditor);
  bindEditorShortcuts(bigTicket.input);
  bindEditorShortcuts(bigTicketModalEditor);
  bindEditorShortcuts(generalNotes.editor);
  bindEditorShortcuts(generalNoteBigEditEditor);

  modalSaveBtn.addEventListener('click', () => {
    if (persistModalChanges()) closeModal(true);
  });

  modalUrgencyBtn.addEventListener('click', () => {
    const action = getActiveModalAction();
    if (!action || !activeModalContext || action.deleted) return;
    cycleUrgency(action);
    queueMovedActionHighlight(activeModalContext.list, action);
    saveList(activeModalContext.list);
    modalStatus.textContent = modalStatusText(action);
    updateModalUrgencyUI(action);
    updateModalTimeDependentUI(action);
    renderList(activeModalContext.list);
  });

  if (modalTimeDependentBtn) {
    modalTimeDependentBtn.addEventListener('click', () => {
      const action = getActiveModalAction();
      if (!action || !activeModalContext || action.deleted) return;
      action.timingFlag = cycleTimingFlag(action.timingFlag || null);
      action.updatedAt = Date.now();
      queueMovedActionHighlight(activeModalContext.list, action);
      saveList(activeModalContext.list);
      modalStatus.textContent = modalStatusText(action);
      updateModalTimeDependentUI(action);
      renderList(activeModalContext.list);
    });
  }


  if (modalDictateBtn) {
    modalDictateBtn.addEventListener('click', () => startDictation(modalDictateBtn, modalTextInput, modalTextInput));
  }

  if (meetingBigEditDictateBtn) {
    meetingBigEditDictateBtn.addEventListener('click', () => startDictation(meetingBigEditDictateBtn, meetingBigEditNotesEditor, meetingBigEditNotesEditor));
  }

  if (generalNoteBigEditDictateBtn) {
    generalNoteBigEditDictateBtn.addEventListener('click', () => startDictation(generalNoteBigEditDictateBtn, generalNoteBigEditEditor, generalNoteBigEditEditor));
  }

  meetingBigEditForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (saveMeetingBigEdit()) closeMeetingBigEdit();
  });

  meetingBigEditClose.addEventListener('click', closeMeetingBigEdit);
  meetingBigEditCancel.addEventListener('click', closeMeetingBigEdit);
  meetingBigEditBackdrop.addEventListener('click', closeMeetingBigEdit);

  bigTicketModalSave.addEventListener('click', () => {
    if (saveBigTicketModal()) closeBigTicketModal(true);
  });
  bigTicketModalClose.addEventListener('click', () => closeBigTicketModal());
  bigTicketModalBackdrop.addEventListener('click', () => closeBigTicketModal());

  generalNoteBigEditForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (saveGeneralNoteBigEdit()) closeGeneralNoteBigEdit();
  });
  generalNoteBigEditClose.addEventListener('click', closeGeneralNoteBigEdit);
  generalNoteBigEditCancel.addEventListener('click', closeGeneralNoteBigEdit);
  generalNoteBigEditBackdrop.addEventListener('click', closeGeneralNoteBigEdit);

  modalCloseBtn.addEventListener('click', () => closeModal());
  if (modalCancelBtn) modalCancelBtn.addEventListener('click', () => closeModal());

  settingsBtn.addEventListener('click', openSettingsModal);
  cloud.collapseAllBtn.addEventListener('click', toggleAllCardsCollapse);
  settingsForm.addEventListener('submit', (event) => {
    event.preventDefault();
    previewSettingsTheme();
    saveSettingsModal();
    closeSettingsModal({ revert: false });
  });
  themePresetSelect.addEventListener('change', applyThemePresetFromSettings);
  [themeBannerBgInput, themeBannerFgInput, themePageBgInput, themeCardHeaderBgInput, themeCardHeaderFgInput]
    .forEach((input) => input.addEventListener('input', onThemeColorInputChange));
  settingsCancelBtn.addEventListener('click', () => closeSettingsModal());
  settingsModalClose.addEventListener('click', () => closeSettingsModal());
  settingsModalBackdrop.addEventListener('click', () => closeSettingsModal());
  importForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const [file] = importFileInput.files || [];
    const modeInput = importForm.querySelector('input[name="import-mode"]:checked');
    if (!file || !modeInput?.value) {
      setStatus('Select a file and import mode first.', 'warning');
      return;
    }
    const imported = await importCloudBackup(file, modeInput.value);
    if (imported) closeImportModal();
  });
  importCancelBtn.addEventListener('click', closeImportModal);
  importModalClose.addEventListener('click', closeImportModal);
  importModalBackdrop.addEventListener('click', closeImportModal);
  modalBackdrop.addEventListener('click', () => closeModal());
  window.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (!importModal.hidden) {
      closeImportModal();
      return;
    }
    if (!settingsModal.hidden) {
      closeSettingsModal();
      return;
    }
    if (!generalNoteBigEditModal.hidden) {
      closeGeneralNoteBigEdit();
      return;
    }
    if (!bigTicketModal.hidden) {
      closeBigTicketModal();
      return;
    }
    if (!meetingBigEditModal.hidden) {
      closeMeetingBigEdit();
      return;
    }
    if (!modal.hidden) closeModal();
  });

  window.addEventListener('resize', () => {
    document.querySelectorAll('.action-item').forEach((row) => updateRowTruncation(row));
  });

  window.addEventListener('focus', scheduleFocusRefresh);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') scheduleFocusRefresh();
  });

  [generalPersonFilterSelect, schedulingPersonFilterSelect].forEach((selectEl) => {
    if (!selectEl) return;
    selectEl.addEventListener('change', (event) => {
      setPersonFilter(event.target.value || 'All');
    });
  });

  [generalTagFilterSelect, schedulingTagFilterSelect].forEach((selectEl) => {
    if (!selectEl) return;
    selectEl.addEventListener('change', (event) => {
      setTagFilter(event.target.value || 'All');
    });
  });

  bindListEvents(lists.general);
  bindListEvents(lists.personal);
  bindListEvents(lists.scheduling);
  bindMeetingEvents();
  bindBigTicketEvents();
  bindGeneralNotesEvents();
  applyTheme(defaultTheme);
  bindCardToggleEvents();
  bindCloudEvents();
  loadData();
  renderAll();
  initializeAuth().catch((error) => {
    setStatus(`Auth check failed: ${error.message}`, 'error');
  });
})();
