# Deploy RNAflow to rnaflow.bioinfocodex.com

## Step 1 — Deploy to Netlify (free)

### Option A: Drag & Drop (no GitHub needed)
1. Go to https://app.netlify.com
2. Log in / sign up (free)
3. On the dashboard, drag the **`website/`** folder into the drop zone
4. Netlify gives you a random URL like `https://rainbow-pie-abc123.netlify.app`
5. Continue to Step 2 to connect your domain

### Option B: Connect GitHub repo (auto-deploys on push)
1. Push this project to GitHub
2. Go to https://app.netlify.com → "Add new site" → "Import from Git"
3. Select your repo
4. Set **Publish directory** to: `website`
5. Click "Deploy site"
6. Continue to Step 2 to connect your domain

---

## Step 2 — Add custom domain in Netlify

1. In your Netlify site dashboard → **Domain settings** → **Add custom domain**
2. Enter: `rnaflow.bioinfocodex.com`
3. Click **Verify** → **Add domain**
4. Netlify will show you a CNAME value to add to your DNS (e.g. `rainbow-pie-abc123.netlify.app`)

---

## Step 3 — Add DNS record at your domain registrar

Log in to wherever bioinfocodex.com is registered (Namecheap, GoDaddy, Cloudflare, Google Domains, etc.) and add:

| Type  | Name      | Value                              | TTL  |
|-------|-----------|------------------------------------|------|
| CNAME | `rnaflow` | `[your-site].netlify.app`          | Auto |

> Replace `[your-site].netlify.app` with the actual Netlify URL from Step 2.

**On Cloudflare**: Set the Proxy status to **DNS only** (grey cloud) initially, then you can enable proxy after it works.

DNS changes take 5–30 minutes to propagate.

---

## Step 4 — Enable HTTPS (automatic)

Back in Netlify → Domain settings → scroll to **HTTPS**
→ Click **"Verify DNS configuration"** → **"Provision certificate"**

Netlify auto-provisions a free Let's Encrypt SSL certificate.
Your site will be live at: **https://rnaflow.bioinfocodex.com** ✓

---

## Step 5 — Link from main bioinfocodex.com site (optional)

Add a link in your main `index.html` navigation to:
```
https://rnaflow.bioinfocodex.com
```

---

## GitHub Pages alternative (if you prefer)

The `website/CNAME` file is already set to `rnaflow.bioinfocodex.com`.

1. Push to GitHub
2. Repo Settings → Pages → Source: `GitHub Actions`
3. The `.github/workflows/deploy-site.yml` workflow deploys automatically
4. Add the same CNAME DNS record pointing to `[username].github.io`

---

## Releasing a new version

Tag a release in git — GitHub Actions builds all installers automatically:

```bash
# bump version in files/package.json first, then:
git add -A
git commit -m "Release v1.1.0"
git tag v1.1.0
git push && git push --tags
```

GitHub Actions will:
1. Build macOS (arm64 + x64 DMG + ZIP)
2. Build Windows (installer + portable EXE)
3. Build Linux (AppImage + DEB + RPM)
4. Create a GitHub Release with all 7 files attached

Update the download links in `website/index.html` to match the new version number.
