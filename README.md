# emCommerce Landing Page

Landing page untuk Meta Ads emCommerce - Olshop Hack Rp119.000

## Stack
- HTML + CSS + Vanilla JS (static, GitHub Pages)
- Meta Pixel (client-side) + CAPI via Cloudflare Workers (server-side)
- Custom domain: emcommerce.online

## Structure
```
emcommerce-landing/
  index.html          - Main landing page
  CNAME               - Custom domain config
  assets/
    style.css         - Mobile-first stylesheet
    script.js         - Pixel tracking + FAQ + sticky nav
    img/              - Dashboard screenshots (4 files)
  workers/
    capi.js           - Cloudflare Worker for server-side CAPI
```

## Deploy
1. Push to main branch
2. GitHub Settings → Pages → Source: main branch / root
3. Verify CNAME file contains: emcommerce.online
4. DNS: Point emcommerce.online A records to GitHub Pages IPs

## GitHub Pages IPs
```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

## Cloudflare Worker (CAPI)
Deploy `workers/capi.js` as Cloudflare Worker with route: `emcommerce.online/api/*`

## Meta Pixel Events
- PageView: On load (in HTML head)
- ViewContent: On 50% scroll (script.js)
- InitiateCheckout: On CTA click (script.js, dual pixel+CAPI)
