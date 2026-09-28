import { THOUGHTS, STORY_GROUPS } from './data.js';

const STORAGE_KEY = 'thoughts-demo-v1';
const TOPICS = ['All', 'World', 'Life', 'Tech', 'Sports', 'Culture'];
const icons = {
  spark: '<svg viewBox="0 0 24 24"><path d="m12 2 1.9 7.1L21 11l-7.1 1.9L12 20l-1.9-7.1L3 11l7.1-1.9L12 2Z"/><path d="m19 18 .5 1.5L21 20l-1.5.5L19 22l-.5-1.5L17 20l1.5-.5L19 18Z"/></svg>',
  bookmark: '<svg viewBox="0 0 24 24"><path d="M6 4.5A2.5 2.5 0 0 1 8.5 2h7A2.5 2.5 0 0 1 18 4.5V22l-6-4-6 4V4.5Z"/></svg>',
  layers: '<svg viewBox="0 0 24 24"><path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/></svg>',
  heart: '<svg viewBox="0 0 24 24"><path d="M20.8 4.6a5.6 5.6 0 0 0-7.9 0L12 5.5l-.9-.9a5.6 5.6 0 0 0-7.9 7.9L12 20l8.8-8.8a5.6 5.6 0 0 0 0-7.9Z"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>'
};

const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
const defaultDb = () => ({ accounts: [], activeId: null });
function loadDb() { try { const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY)); return parsed && Array.isArray(parsed.accounts) ? parsed : defaultDb(); } catch { return defaultDb(); } }
let db = loadDb();
let currentView = 'feed';
let topic = 'All';
let feedIndex = 0;
let activeCollection = null;
let toastTimeout;

const account = () => db.accounts.find(item => item.id === db.activeId) || null;
const feed = () => topic === 'All' ? THOUGHTS : THOUGHTS.filter(item => item.topic === topic);
const currentThought = () => feed()[feedIndex] || feed()[0];
const isLiked = (id) => Boolean(account()?.likes.includes(id));
const isSaved = (id) => Boolean(account()?.saved.includes(id));
function persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); }
function notify(message) { const node = $('#toast'); node.textContent = message; node.classList.add('visible'); clearTimeout(toastTimeout); toastTimeout = setTimeout(() => node.classList.remove('visible'), 2600); }

function setView(view) {
  if (!['feed', 'saved', 'collections'].includes(view)) return;
  currentView = view;
  document.querySelectorAll('.view').forEach(node => node.classList.toggle('active', node.id === `${view}-view`));
  document.querySelectorAll('[data-view]').forEach(node => node.classList.toggle('active', node.dataset.view === view));
  if (view === 'saved') renderSaved();
  if (view === 'collections') renderCollections();
  history.replaceState(null, '', `#${view}`);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderProfile() {
  const profile = account();
  $('#profile-initial').textContent = profile ? profile.name.trim().charAt(0).toUpperCase() : '?';
  $('#profile-name').textContent = profile ? profile.name.split(' ')[0] : 'Join thoughts';
  $('#side-saved-count').textContent = profile?.saved.length ?? 0;
  $('#saved-total').textContent = profile?.saved.length ?? 0;
}

function renderChips() {
  $('#topic-chips').innerHTML = TOPICS.map(item => `<button class="topic-chip ${item === topic ? 'active' : ''}" data-topic="${item}" aria-pressed="${item === topic}">${item}</button>`).join('');
}

function renderCard() {
  const item = currentThought();
  if (!item) return;
  const total = feed().length;
  const card = $('#thought-card');
  card.dataset.topic = item.topic;
  card.innerHTML = `
    <div class="card-top"><div class="card-category"><span class="category-flower">✳</span>${escapeHtml(item.topic)} <span style="opacity:.45">/</span> ${escapeHtml(item.label)}</div><span class="card-number">${String(feedIndex + 1).padStart(2, '0')} <span style="opacity:.4">/</span> ${String(total).padStart(2, '0')}</span></div>
    <div class="card-main"><div class="quote-mark" aria-hidden="true">“</div><p class="thought-text">${escapeHtml(item.text)}</p></div>
    <div class="card-bottom"><a class="story-link" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(item.story)}">↗ &nbsp; Sparked by: ${escapeHtml(item.story)}</a><div class="card-actions"><button class="round-action ${isLiked(item.id) ? 'active' : ''}" data-action="like" data-id="${item.id}" aria-label="${isLiked(item.id) ? 'Unlike' : 'Like'} this thought" aria-pressed="${isLiked(item.id)}" title="Like">${icons.heart}</button><button class="round-action ${isSaved(item.id) ? 'active' : ''}" data-action="save" data-id="${item.id}" aria-label="${isSaved(item.id) ? 'Unsave' : 'Save'} this thought" aria-pressed="${isSaved(item.id)}" title="Save">${icons.bookmark}</button><button class="round-action" data-action="collect" data-id="${item.id}" aria-label="Add thought to a collection" title="Add to collection">${icons.plus}</button></div></div>`;
  $('#feed-count').textContent = `${total} thoughts in ${topic === 'All' ? 'this edition' : topic}`;
  $('#progress-bar').style.width = `${((feedIndex + 1) / total) * 100}%`;
  $('#prev-button').disabled = feedIndex === 0;
  $('#next-button').disabled = feedIndex === total - 1;
}

function step(direction) {
  const next = Math.max(0, Math.min(feed().length - 1, feedIndex + direction));
  if (next === feedIndex) return;
  const card = $('#thought-card');
  card.style.transform = `translateX(${direction < 0 ? 18 : -18}px)`;
  card.style.opacity = '.55';
  setTimeout(() => { feedIndex = next; renderCard(); card.style.transform = ''; card.style.opacity = ''; }, 135);
}

function ensureAccount() { if (account()) return true; openAccountModal(); return false; }
function toggleLike(id) {
  if (!ensureAccount()) return;
  const profile = account();
  profile.likes = profile.likes.includes(id) ? profile.likes.filter(item => item !== id) : [...profile.likes, id];
  persist(); renderCard(); notify(profile.likes.includes(id) ? 'Thought liked' : 'Like removed');
}
function toggleSave(id) {
  if (!ensureAccount()) return;
  const profile = account();
  profile.saved = profile.saved.includes(id) ? profile.saved.filter(item => item !== id) : [...profile.saved, id];
  persist(); renderProfile(); renderCard();
  if (currentView === 'saved') renderSaved();
  notify(profile.saved.includes(id) ? 'Saved to your thoughts' : 'Removed from saved thoughts');
}

function thoughtById(id) { return THOUGHTS.find(item => item.id === id); }
function miniCard(item, inCollection = false) {
  return `<article class="mini-card"><div><span class="mini-card-tag">${escapeHtml(item.topic)} / ${escapeHtml(item.label)}</span><p class="mini-card-text">${escapeHtml(item.text)}</p></div><div class="mini-card-bottom"><a class="mini-card-source" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">↗ ${escapeHtml(item.story)}</a><div class="mini-card-actions"><button class="tiny-button" data-action="open-thought" data-id="${item.id}" title="Open thought" aria-label="Open thought">↗</button><button class="tiny-button" data-action="${inCollection ? 'remove-from-collection' : 'save'}" data-id="${item.id}" title="${inCollection ? 'Remove from collection' : 'Remove saved thought'}" aria-label="${inCollection ? 'Remove from collection' : 'Remove saved thought'}">×</button></div></div></article>`;
}
function emptyState(symbol, title, body, buttonText, action) {
  return `<div class="empty-state"><div class="empty-icon">${symbol}</div><h3>${title}</h3><p>${body}</p><button class="primary-button" data-action="${action}">${buttonText}</button></div>`;
}
function renderSaved() {
  const profile = account();
  const items = (profile?.saved || []).map(thoughtById).filter(Boolean).reverse();
  $('#saved-content').innerHTML = items.length ? `<div class="library-grid">${items.map(item => miniCard(item)).join('')}</div>` : emptyState('✳', 'Nothing tucked away yet.', 'When a thought stays with you, tap its bookmark to keep it here.', 'Explore thoughts', 'go-feed');
}
function renderCollections() {
  const profile = account();
  const root = $('#collections-content');
  if (activeCollection && profile) {
    const collection = profile.collections.find(item => item.id === activeCollection);
    if (!collection) activeCollection = null;
    else {
      const items = collection.thoughtIds.map(thoughtById).filter(Boolean);
      root.innerHTML = `<div class="collection-heading"><div><button class="link-button" data-action="back-collections">← All collections</button><h3>${escapeHtml(collection.name)}</h3></div><button class="link-button" data-action="delete-collection" data-id="${collection.id}">Delete collection</button></div>${items.length ? `<div class="library-grid">${items.map(item => miniCard(item, true)).join('')}</div>` : emptyState('✺', 'A little space to fill.', 'Browse the feed and tap + on a thought to add it here.', 'Explore thoughts', 'go-feed')}`;
      return;
    }
  }
  const collections = profile?.collections || [];
  root.innerHTML = collections.length ? `<div class="library-grid">${collections.map(item => `<button class="collection-card" data-action="open-collection" data-id="${item.id}"><span class="collection-symbol">✺</span><div><div class="collection-title">${escapeHtml(item.name)}</div><div class="collection-count">${item.thoughtIds.length} ${item.thoughtIds.length === 1 ? 'thought' : 'thoughts'}</div></div><span class="collection-arrow">↗</span></button>`).join('')}</div>` : emptyState('✺', 'Make your first collection.', 'Give a few thoughts a place to belong together.', '+ New collection', 'new-collection');
}

function openModal(html) { $('#modal-content').innerHTML = html; $('#modal-backdrop').hidden = false; setTimeout(() => $('#modal-content input')?.focus(), 0); }
function closeModal() { $('#modal-backdrop').hidden = true; $('#modal-content').innerHTML = ''; }
function openAccountModal() {
  const profiles = db.accounts.length ? `<div class="profile-list">${db.accounts.map(item => `<button class="profile-choice" data-action="switch-profile" data-id="${item.id}"><span class="avatar">${escapeHtml(item.name.charAt(0).toUpperCase())}</span><span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.email || 'Demo profile')}</small></span><span>${item.id === db.activeId ? '✓' : '→'}</span></button>`).join('')}</div>` : '';
  openModal(`<span class="modal-kicker">YOUR SPACE</span><h3>${account() ? 'Your profile' : 'Make it yours.'}</h3><p>Keep likes, saves, and collections in this browser. This demo uses local profiles; online accounts come later.</p>${profiles}<form id="account-form"><label class="field-label" for="account-name">Your name</label><input class="field" id="account-name" name="name" maxlength="40" required placeholder="e.g. Alex"><label class="field-label" for="account-email">Email <span style="font-weight:400">(optional in demo)</span></label><input class="field" id="account-email" name="email" type="email" maxlength="100" placeholder="alex@example.com"><div class="modal-actions"><button class="primary-button" type="submit">Create local profile</button>${!account() ? '<button class="secondary-button" type="button" data-action="try-demo">Try demo profile</button>' : '<button class="secondary-button" type="button" data-action="sign-out">Sign out</button>'}</div></form><p class="modal-note">No password or email is sent. Data stays on this device.</p>`);
}
function createProfile(name, email) {
  const cleanedName = name.trim();
  if (!cleanedName) return;
  const profile = { id: `profile-${crypto.randomUUID()}`, name: cleanedName, email: email.trim(), likes: [], saved: [], collections: [] };
  db.accounts.push(profile); db.activeId = profile.id; persist(); renderAll(); closeModal(); notify(`Welcome, ${cleanedName.split(' ')[0]}`);
}
function openNewCollectionModal() {
  if (!ensureAccount()) return;
  openModal(`<span class="modal-kicker">GIVE IT A NAME</span><h3>A new collection.</h3><p>Something you want to return to, or a theme you keep noticing.</p><form id="collection-form"><label class="field-label" for="collection-name">Collection name</label><input class="field" id="collection-name" name="name" maxlength="50" required placeholder="e.g. The little things"><div class="modal-actions"><button class="primary-button" type="submit">Create collection</button></div></form>`);
}
function openCollectModal(id) {
  if (!ensureAccount()) return;
  const profile = account();
  const item = thoughtById(id);
  const choices = profile.collections.map(collection => `<label class="collection-option"><input type="checkbox" data-collection-id="${collection.id}" ${collection.thoughtIds.includes(id) ? 'checked' : ''}><span>${escapeHtml(collection.name)}</span></label>`).join('');
  openModal(`<span class="modal-kicker">SAVE A CONNECTION</span><h3>Add to collection.</h3><p>“${escapeHtml(item.text)}”</p><div class="collection-options">${choices || '<p>You have no collections yet. Make one below.</p>'}</div><div class="modal-actions"><button class="primary-button" data-action="new-collection-for-thought" data-id="${id}">+ New collection</button>${choices ? '<button class="secondary-button" data-action="done-collect">Done</button>' : ''}</div>`);
  $('#modal-content').dataset.thoughtId = id;
}
function createCollection(name, thoughtId = null) {
  const cleanedName = name.trim();
  if (!cleanedName || !account()) return;
  account().collections.push({ id: `collection-${crypto.randomUUID()}`, name: cleanedName, thoughtIds: thoughtId ? [thoughtId] : [] });
  if (thoughtId && !account().saved.includes(thoughtId)) account().saved.push(thoughtId);
  persist(); renderAll(); closeModal(); notify('Collection created');
}
function renderAll() { renderProfile(); renderChips(); renderCard(); if (currentView === 'saved') renderSaved(); if (currentView === 'collections') renderCollections(); }

document.querySelectorAll('[data-icon]').forEach(node => { node.innerHTML = icons[node.dataset.icon]; });
renderAll();
setView(['feed', 'saved', 'collections'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'feed');

document.addEventListener('click', event => {
  const viewButton = event.target.closest('[data-view]');
  if (viewButton) { setView(viewButton.dataset.view); return; }
  const topicButton = event.target.closest('.topic-chip[data-topic]');
  if (topicButton) { topic = topicButton.dataset.topic; feedIndex = 0; renderChips(); renderCard(); return; }
  const actionButton = event.target.closest('[data-action]');
  if (!actionButton) return;
  const { action, id } = actionButton.dataset;
  if (action === 'like') toggleLike(id);
  if (action === 'save') toggleSave(id);
  if (action === 'collect') openCollectModal(id);
  if (action === 'go-feed') setView('feed');
  if (action === 'new-collection') openNewCollectionModal();
  if (action === 'back-collections') { activeCollection = null; renderCollections(); }
  if (action === 'open-collection') { activeCollection = id; renderCollections(); }
  if (action === 'open-thought') { const item = thoughtById(id); topic = 'All'; feedIndex = THOUGHTS.findIndex(entry => entry.id === item.id); renderChips(); renderCard(); setView('feed'); }
  if (action === 'remove-from-collection') {
    const collection = account()?.collections.find(item => item.id === activeCollection);
    if (collection) { collection.thoughtIds = collection.thoughtIds.filter(item => item !== id); persist(); renderCollections(); notify('Removed from collection'); }
  }
  if (action === 'delete-collection') {
    if (confirm('Delete this collection? Your saved thoughts will remain.')) { account().collections = account().collections.filter(item => item.id !== id); activeCollection = null; persist(); renderCollections(); notify('Collection deleted'); }
  }
  if (action === 'try-demo') {
    const existing = db.accounts.find(item => item.email === 'demo@thoughts.local');
    if (existing) { db.activeId = existing.id; persist(); renderAll(); closeModal(); notify('Demo profile ready'); }
    else createProfile('Demo Reader', 'demo@thoughts.local');
  }
  if (action === 'switch-profile') { db.activeId = id; persist(); renderAll(); closeModal(); notify('Profile switched'); }
  if (action === 'sign-out') { db.activeId = null; persist(); renderAll(); closeModal(); notify('Signed out of local profile'); }
  if (action === 'new-collection-for-thought') {
    const thoughtId = id;
    openModal(`<span class="modal-kicker">GIVE IT A NAME</span><h3>A new collection.</h3><p>This thought will be the first one inside it.</p><form id="collection-form" data-thought-id="${thoughtId}"><label class="field-label" for="collection-name">Collection name</label><input class="field" id="collection-name" name="name" maxlength="50" required placeholder="e.g. Things to remember"><div class="modal-actions"><button class="primary-button" type="submit">Create collection</button></div></form>`);
  }
  if (action === 'done-collect') closeModal();
});

document.addEventListener('change', event => {
  const checkbox = event.target.closest('[data-collection-id]');
  if (!checkbox) return;
  const id = $('#modal-content').dataset.thoughtId;
  const collection = account()?.collections.find(item => item.id === checkbox.dataset.collectionId);
  if (!collection) return;
  collection.thoughtIds = checkbox.checked ? [...new Set([...collection.thoughtIds, id])] : collection.thoughtIds.filter(item => item !== id);
  if (checkbox.checked && !account().saved.includes(id)) account().saved.push(id);
  persist(); renderProfile(); renderCard(); notify(checkbox.checked ? 'Added to collection' : 'Removed from collection');
});

document.addEventListener('submit', event => {
  if (event.target.id === 'account-form') { event.preventDefault(); const data = new FormData(event.target); createProfile(String(data.get('name') || ''), String(data.get('email') || '')); }
  if (event.target.id === 'collection-form') { event.preventDefault(); createCollection(String(new FormData(event.target).get('name') || ''), event.target.dataset.thoughtId || null); }
});

$('#profile-button').addEventListener('click', openAccountModal);
$('#new-collection-button').addEventListener('click', openNewCollectionModal);
$('#prev-button').addEventListener('click', () => step(-1));
$('#next-button').addEventListener('click', () => step(1));
$('#modal-close').addEventListener('click', closeModal);
$('#modal-backdrop').addEventListener('click', event => { if (event.target.id === 'modal-backdrop') closeModal(); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !$('#modal-backdrop').hidden) { closeModal(); return; }
  if (!$('#modal-backdrop').hidden || /INPUT|TEXTAREA/.test(document.activeElement?.tagName || '') || currentView !== 'feed') return;
  if (event.key === 'ArrowRight') step(1);
  if (event.key === 'ArrowLeft') step(-1);
});

let pointerStart = null;
const swipeArea = $('#card-swipe-area');
swipeArea.addEventListener('pointerdown', event => { if (event.target.closest('button,a')) return; pointerStart = { x: event.clientX, y: event.clientY }; });
swipeArea.addEventListener('pointerup', event => {
  if (!pointerStart) return;
  const deltaX = event.clientX - pointerStart.x;
  const deltaY = event.clientY - pointerStart.y;
  pointerStart = null;
  if (Math.abs(deltaX) > 55 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) step(deltaX < 0 ? 1 : -1);
});
swipeArea.addEventListener('pointercancel', () => { pointerStart = null; });

// The source groups are checked at startup so later edits cannot silently change the demo count.
if (THOUGHTS.length !== 280 || STORY_GROUPS.length !== 35) console.warn(`Expected 280 thoughts across 35 stories; found ${THOUGHTS.length} and ${STORY_GROUPS.length}.`);
