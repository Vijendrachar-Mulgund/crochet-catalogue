// store.js — picks the data backend. If Supabase is configured (and the
// library loaded), use the shared CloudStore; otherwise fall back to the
// offline LocalStore. The rest of the app talks only to window.Store.
(function () {
  'use strict';
  window.Store = window.CloudStore || window.LocalStore;
})();
