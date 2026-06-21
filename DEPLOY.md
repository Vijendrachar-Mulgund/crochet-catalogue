# Put the catalogue online (free)

Do this **after** finishing `SUPABASE_SETUP.md` (so `js/config.js` has your
Supabase keys in it). This publishes the website and gives you a link to share
with your mother.

We'll use **Netlify Drop** — the simplest option, just drag-and-drop. Free,
no credit card.

---

## Steps

1. Make sure `js/config.js` has your Supabase **Project URL** and **anon key**
   filled in (from the setup guide). If it's still blank, the online site will
   only store data on each person's own computer — not shared.

2. Go to **https://app.netlify.com/drop**
   (sign up for a free Netlify account if asked — GitHub or email is fine).

3. In Finder, open the **`Catalogue`** folder. Select **all the files inside
   it** (index.html, the `css`, `js`, `assets` folders, etc.) — or just drag
   the whole `Catalogue` folder onto the page.

   > Tip: drag the **folder** itself onto the drop zone — Netlify handles it.

4. Wait a few seconds. Netlify gives you a link like
   `https://random-name-123.netlify.app`. **That's your catalogue website.**

5. (Optional) Rename it: in Netlify, open the site → **Site configuration** →
   **Change site name** → set it to e.g. `charming-yarns`, giving you
   `https://charming-yarns.netlify.app`.

6. Send that link to your mother. She opens it, signs in with the shared
   email + password, and can start adding photos. 🎉

---

## When you add or change the catalogue's code later

The product/photo *data* lives in Supabase, so you don't redeploy for that.
You only need to re-upload to Netlify if you change the app's files
(`index.html`, `css`, `js`). To update: open your site in Netlify →
**Deploys** → drag the folder onto the page again. Your data stays intact.

---

## Privacy note
Anyone with the link reaches the **sign-in screen**, but they can't see or
change the catalogue without the email + password. Keep those private and
share them only with your mother. To share products with *customers*, use the
**Create a Share → Save as PDF** feature, not the website link.
