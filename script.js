// Email address that receives contact-form enquiries. Change this to your own.
const CONTACT_EMAIL = ""; // e.g. "you@yourfirm.com"

// Footer year
document.getElementById("year").textContent = new Date().getFullYear();

// Header shadow on scroll
const header = document.querySelector(".site-header");
const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 8);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// Mobile menu
const toggle = document.querySelector(".nav-toggle");
const menu = document.getElementById("nav-menu");
toggle.addEventListener("click", () => {
  const open = menu.classList.toggle("open");
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
});
menu.querySelectorAll("a").forEach((link) =>
  link.addEventListener("click", () => {
    menu.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
  })
);

// Reveal-on-scroll and stat counters
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const revealTargets = document.querySelectorAll(
  ".service, .steps li, .value, .section-head, .faq details, .contact-form"
);

function animateCount(el) {
  const target = Number(el.dataset.count);
  const prefix = el.dataset.prefix || "";
  const suffix = el.dataset.suffix || "";
  const duration = 1400;
  const start = performance.now();
  const tick = (now) => {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = prefix + Math.round(target * eased) + suffix;
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

if ("IntersectionObserver" in window && !reduceMotion) {
  revealTargets.forEach((el) => el.classList.add("reveal"));
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        if (el.dataset.count) animateCount(el);
        else el.classList.add("visible");
        io.unobserve(el);
      });
    },
    { threshold: 0.15 }
  );
  revealTargets.forEach((el) => io.observe(el));
  document.querySelectorAll("[data-count]").forEach((el) => io.observe(el));
}

// Contact form: validates, then opens the visitor's email app with the message filled in.
const form = document.getElementById("contact-form");
const status = form.querySelector(".form-status");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  let valid = true;
  form.querySelectorAll("[required]").forEach((field) => {
    const ok = field.value.trim() !== "" && field.checkValidity();
    field.classList.toggle("invalid", !ok);
    if (!ok) valid = false;
  });

  if (!valid) {
    status.className = "form-status error";
    status.textContent = "Please complete the highlighted fields with valid details.";
    form.querySelector(".invalid").focus();
    return;
  }

  if (!CONTACT_EMAIL) {
    status.className = "form-status error";
    status.textContent = "This form isn't connected yet. Please use the contact details shown.";
    return;
  }

  const data = new FormData(form);
  const subject = `Consultation request: ${data.get("service")}`;
  const body = [
    `Name: ${data.get("name")}`,
    `Email: ${data.get("email")}`,
    `Company: ${data.get("company") || "-"}`,
    `Service: ${data.get("service")}`,
    "",
    data.get("message"),
  ].join("\n");

  window.location.href =
    `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  status.className = "form-status success";
  status.textContent = "Thank you! Your email app should open with your message ready to send.";
  form.reset();
});

form.querySelectorAll("input, textarea").forEach((field) =>
  field.addEventListener("input", () => field.classList.remove("invalid"))
);
