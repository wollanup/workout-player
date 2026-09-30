export const $ = (s, el = document) => el.querySelector(s);

export const esc = s => String(s ?? '').replace(/[&<>"']/g,
  c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const VIEWS = ['list', 'edit', 'play'];

export function showView(view) {
  for (const v of VIEWS) $('#view-' + v).hidden = v !== view;
  // The YouTube iframe must stay rendered (not display:none) to keep working; move it off-screen instead.
  $('#yt-wrap').classList.toggle('offscreen', view !== 'play');
  window.scrollTo(0, 0);
}
