# Point periodictablepoker.com to Your Landing Page

Your landing page is live at: **https://nathangamalnasser1-arch.github.io/periodictablepoker.com/**

To show it at **https://periodictablepoker.com**, update DNS at your domain registrar.

## Step 1: Remove domain from other hosts (if applicable)

If periodictablepoker.com is connected to Vercel, Netlify, or similar:
- Go to that service's dashboard
- Remove periodictablepoker.com from the project's custom domains

## Step 2: Add DNS records at your registrar

Where you manage the domain (GoDaddy, Namecheap, Cloudflare, Google Domains, etc.):

### Option A: Apex domain (periodictablepoker.com)

Add these **A records** for the root domain:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 185.199.108.153 | 3600 |
| A | @ | 185.199.109.153 | 3600 |
| A | @ | 185.199.110.153 | 3600 |
| A | @ | 185.199.111.153 | 3600 |

### Option B: www subdomain (www.periodictablepoker.com)

Add this **CNAME record**:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | www | nathangamalnasser1-arch.github.io | 3600 |

## Step 3: Configure GitHub Pages

1. Go to: https://github.com/nathangamalnasser1-arch/periodictablepoker.com/settings/pages
2. Under **Custom domain**, enter: `periodictablepoker.com` (or `www.periodictablepoker.com` if using www)
3. Click **Save**
4. Wait for " DNS check successful" (can take 5–30 minutes)

## Step 4: Enable HTTPS (after DNS is verified)

In GitHub Pages settings, check **Enforce HTTPS** once it becomes available.

---

**Propagation:** DNS changes can take a few minutes to 48 hours. After that, https://periodictablepoker.com will show your landing page with the video and PDF download.
