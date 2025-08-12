const INSTANCES_KEY = 'stg.instances.v1';
const LAST_SELECTION_KEY = 'stg.lastSelection.v1';
const GLOBAL_SETTINGS_KEY = 'stg.globalSettings.v1';

export function loadInstances() {
  try {
    const raw = localStorage.getItem(INSTANCES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveInstances(instances) {
  try {
    localStorage.setItem(INSTANCES_KEY, JSON.stringify(instances));
  } catch {}
}

export function loadLastSelection() {
  try {
    const raw = localStorage.getItem(LAST_SELECTION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveLastSelection(selection) {
  try {
    localStorage.setItem(LAST_SELECTION_KEY, JSON.stringify(selection));
  } catch {}
} 

export function loadGlobalSettings() {
  try {
    const raw = localStorage.getItem(GLOBAL_SETTINGS_KEY);
    if (!raw) return { ldts_default: 'ldts', rsrc_default: 'rsrc' };
    const parsed = JSON.parse(raw);
    return {
      ldts_default: parsed.ldts_default || 'ldts',
      rsrc_default: parsed.rsrc_default || 'rsrc',
    };
  } catch {
    return { ldts_default: 'ldts', rsrc_default: 'rsrc' };
  }
}

export function saveGlobalSettings(settings) {
  try {
    const safe = {
      ldts_default: settings?.ldts_default || 'ldts',
      rsrc_default: settings?.rsrc_default || 'rsrc',
    };
    localStorage.setItem(GLOBAL_SETTINGS_KEY, JSON.stringify(safe));
  } catch {}
}