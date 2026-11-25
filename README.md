# FI Consultancy website

A static, multi-page website. Open `index.html` in a browser; no build step needed.

## Pages
- `index.html` – Home
- `services.html` and `services/*.html` – one page per service
- `industries.html`, `insights.html` + `insights/*.html`, `case-studies.html`
- `about.html`, `careers.html`, `contact.html`

Shared files: `styles.css` (design) and `script.js` (menus, animations, forms).

## Filling in your details
Search all files for `[` and replace each bracketed placeholder, `[Your email address]`, `[Full name]`.

- **Highlight numbers** (home page): replace `[ ]` with your number and put the same number in `data-count`, e.g. `<strong data-count="15" data-suffix="+">15+</strong>`. It will count up on scroll.
- **Contact & newsletter forms**: create a form at a service such as Formspree and paste its URL into `formEndpoint` at the top of `script.js`.
