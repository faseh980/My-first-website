/* ============================================================
   SITE SETTINGS — fill these in
   formEndpoint: URL of a form service (e.g. Formspree) that receives
   contact-form and newsletter submissions. Leave empty until you have one.
   ============================================================ */
const SITE = {
  formEndpoint: "",
};

(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canHover = matchMedia("(hover: hover)").matches;
  document.documentElement.classList.add("js");

  $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  /* ---------- Header: solid on scroll, hide on scroll down ---------- */
  const header = $(".site-header");
  const progress = $(".read-progress");
  const toTop = $(".to-top");
  let lastY = scrollY;
  let ticking = false;

  function onScroll() {
    const y = scrollY;
    header.classList.toggle("is-solid", y > 24);
    const goingDown = y > lastY + 4;
    const goingUp = y < lastY - 4;
    if (goingDown && y > 320 && !header.classList.contains("menu-open")) document.body.classList.add("header-hidden");
    if (goingUp || y < 320) document.body.classList.remove("header-hidden");
    lastY = y;
    if (progress) {
      const max = document.documentElement.scrollHeight - innerHeight;
      progress.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;
    }
    if (toTop) toTop.classList.toggle("show", y > 900);
    updateTimelines();
    ticking = false;
  }
  addEventListener("scroll", () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });

  toTop?.addEventListener("click", () => scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }));

  /* ---------- Mega menu & dropdowns ---------- */
  const menuItems = $$(".nav-item.has-menu");
  let closeTimer;
  function setOpen(item, open) {
    item.classList.toggle("open", open);
    $(".nav-link", item).setAttribute("aria-expanded", String(open));
    header.classList.toggle("menu-open", menuItems.some((i) => i.classList.contains("open")));
  }
  const closeAll = (except) => menuItems.forEach((i) => i !== except && setOpen(i, false));
  menuItems.forEach((item) => {
    const trigger = $(".nav-link", item);
    trigger.addEventListener("click", () => {
      const open = !item.classList.contains("open");
      closeAll(item);
      setOpen(item, open);
    });
    item.addEventListener("mouseenter", () => {
      if (!canHover) return;
      clearTimeout(closeTimer);
      closeAll(item);
      setOpen(item, true);
    });
    item.addEventListener("mouseleave", () => {
      if (!canHover) return;
      closeTimer = setTimeout(() => setOpen(item, false), 160);
    });
  });
  document.addEventListener("click", (e) => { if (!e.target.closest(".nav-item")) closeAll(); });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const open = menuItems.find((i) => i.classList.contains("open"));
    if (open) { setOpen(open, false); $(".nav-link", open).focus(); }
    if (document.body.classList.contains("drawer-open")) toggleDrawer(false);
  });

  /* ---------- Mobile drawer ---------- */
  const drawer = $(".drawer");
  const toggle = $(".menu-toggle");
  function toggleDrawer(open) {
    document.body.classList.toggle("drawer-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    drawer.inert = !open;
    drawer.setAttribute("aria-hidden", String(!open));
  }
  if (drawer && toggle) {
    drawer.inert = true;
    toggle.addEventListener("click", () => toggleDrawer(!document.body.classList.contains("drawer-open")));
    $$("a", drawer).forEach((a) => a.addEventListener("click", () => toggleDrawer(false)));
    addEventListener("resize", () => { if (innerWidth > 1140) toggleDrawer(false); });
  }

  /* ---------- Reveal on scroll (with stagger groups) ---------- */
  $$("[data-stagger]").forEach((group) => {
    [...group.children].forEach((child, i) => {
      child.setAttribute("data-reveal", "");
      child.style.setProperty("--d", `${Math.min(i, 8) * 90}ms`);
    });
  });
  const revealEls = $$("[data-reveal]");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add("in");
        io.unobserve(el);
        setTimeout(() => {
          el.classList.remove("pre", "in");
          el.removeAttribute("data-reveal");
          el.style.removeProperty("--d");
        }, 1800);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach((el) => {
      // Content already on screen at load stays visible; only content below the fold animates in.
      if (el.getBoundingClientRect().top < innerHeight * 0.92) return;
      el.classList.add("pre");
      io.observe(el);
    });
  }

  /* ---------- Number counters: <strong data-count="250" data-suffix="+"> ---------- */
  const counters = $$("[data-count]").filter((el) => !isNaN(parseFloat(el.dataset.count)));
  function runCounter(el) {
    const target = parseFloat(el.dataset.count);
    const decimals = (el.dataset.count.split(".")[1] || "").length;
    const pre = el.dataset.prefix || "", suf = el.dataset.suffix || "";
    if (reduceMotion) { el.textContent = pre + target.toFixed(decimals) + suf; return; }
    const start = performance.now(), dur = 1600;
    const step = (now) => {
      const p = Math.min((now - start) / dur, 1);
      el.textContent = pre + (target * (1 - Math.pow(1 - p, 4))).toFixed(decimals) + suf;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  if (counters.length && "IntersectionObserver" in window) {
    const cio = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { runCounter(e.target); cio.unobserve(e.target); }
    }), { threshold: 0.5 });
    counters.forEach((c) => cio.observe(c));
  }

  /* ---------- Rotating hero word ---------- */
  $$("[data-rotate]").forEach((el) => {
    const words = el.dataset.rotate.split("|");
    if (reduceMotion || words.length < 2) return;
    let i = 0;
    setInterval(() => {
      el.classList.add("out");
      setTimeout(() => {
        i = (i + 1) % words.length;
        el.textContent = words[i];
        el.classList.remove("out");
        el.classList.add("enter");
        requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove("enter")));
      }, 350);
    }, 3000);
  });

  /* ---------- Hero canvas: flowing data lines ---------- */
  const canvas = $(".hero-canvas");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    let w = 0, h = 0, raf = 0, visible = true;
    const lines = Array.from({ length: 16 }, (_, i) => ({
      amp: 16 + i * 4.5,
      freq: 0.0018 + i * 0.00011,
      speed: 0.00022 + i * 0.000018,
      phase: i * 0.55,
      base: 0.42 + i * 0.028,
    }));
    function size() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function yAt(l, x, t) {
      return h * l.base + Math.sin(x * l.freq + t * l.speed + l.phase) * l.amp + Math.sin(x * l.freq * 2.4 - t * l.speed * 1.3) * l.amp * 0.3;
    }
    function draw(t) {
      ctx.clearRect(0, 0, w, h);
      lines.forEach((l, i) => {
        ctx.beginPath();
        for (let x = 0; x <= w + 10; x += 10) {
          const y = yAt(l, x, t);
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        const strong = i === 11;
        ctx.strokeStyle = strong ? "rgba(20,193,143,.75)" : `rgba(${i % 3 === 0 ? "120,130,230" : "20,193,143"},${0.05 + (i / lines.length) * 0.16})`;
        ctx.lineWidth = strong ? 2 : 1;
        ctx.stroke();
      });
      // travelling data points on the highlighted line
      const l = lines[11];
      for (let k = 0; k < 3; k++) {
        const x = ((t * 0.05 + k * w / 3) % (w + 40)) - 20;
        const y = yAt(l, x, t);
        ctx.beginPath();
        ctx.fillStyle = "rgba(20,193,143,.25)";
        ctx.arc(x, y, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = "#14c18f";
        ctx.arc(x, y, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!reduceMotion && visible) raf = requestAnimationFrame(draw);
    }
    size();
    addEventListener("resize", () => { size(); if (reduceMotion) draw(0); });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        cancelAnimationFrame(raf);
        if (visible) raf = requestAnimationFrame(draw);
      }).observe(canvas);
    }
    raf = requestAnimationFrame(draw);
  }

  /* ---------- Process timeline fill ---------- */
  const timelines = $$(".steps");
  function updateTimelines() {
    timelines.forEach((tl) => {
      const r = tl.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (innerHeight * 0.75 - r.top) / (r.width > 0 ? innerHeight * 0.45 : 1)));
      tl.style.setProperty("--p", p.toFixed(3));
      const items = $$("li", tl);
      items.forEach((li, i) => li.classList.toggle("on", p >= i / items.length + 0.02 || (reduceMotion && r.top < innerHeight)));
    });
  }

  /* ---------- Cursor glow on service cards ---------- */
  if (canHover && !reduceMotion) {
    $$(".svc-card").forEach((card) => card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    }));
  }

  /* ---------- "I want to…" selector ---------- */
  const intent = $("#intent");
  const intentGo = $("#intent-go");
  if (intent && intentGo) {
    const sync = () => (intentGo.href = intent.value);
    intent.addEventListener("change", sync);
    sync();
  }

  /* ---------- Tabs (industries) ---------- */
  $$("[role=tablist]").forEach((list) => {
    const tabs = $$("[role=tab]", list);
    function select(tab, focus) {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
      });
      if (focus) tab.focus();
      history.replaceState(null, "", `#${tab.dataset.slug}`);
    }
    tabs.forEach((t, i) => {
      t.addEventListener("click", () => select(t));
      t.addEventListener("keydown", (e) => {
        const dir = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
        if (dir) { e.preventDefault(); select(tabs[(i + dir + tabs.length) % tabs.length], true); }
      });
    });
    const fromHash = tabs.find((t) => `#${t.dataset.slug}` === location.hash);
    if (fromHash) select(fromHash);
  });

  /* ---------- Filters (insights, case studies) ---------- */
  $$("[data-filter-group]").forEach((bar) => {
    const target = document.getElementById(bar.dataset.filterGroup);
    const chips = $$(".chip", bar);
    chips.forEach((chip) => chip.addEventListener("click", () => {
      chips.forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
      const f = chip.dataset.filter;
      [...target.children].forEach((item) => {
        const show = f === "all" || item.dataset.cat === f;
        item.classList.toggle("is-filtered-out", !show);
        item.classList.remove("pop");
        if (show) { void item.offsetWidth; item.classList.add("pop"); }
      });
    }));
  });

  /* ---------- Service sub-navigation highlight ---------- */
  const subLinks = $$(".subnav a");
  if (subLinks.length && "IntersectionObserver" in window) {
    const map = new Map(subLinks.map((a) => [a.getAttribute("href").slice(1), a]));
    const sio = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      subLinks.forEach((a) => a.classList.remove("active"));
      map.get(e.target.id)?.classList.add("active");
    }), { rootMargin: "-40% 0px -55% 0px" });
    map.forEach((_, id) => { const s = document.getElementById(id); if (s) sio.observe(s); });
  }

  /* ---------- Forms ---------- */
  async function send(data) {
    if (!SITE.formEndpoint) return "not-connected";
    try {
      const res = await fetch(SITE.formEndpoint, { method: "POST", headers: { Accept: "application/json" }, body: data });
      return res.ok ? "ok" : "error";
    } catch { return "error"; }
  }

  const contact = $("#contact-form");
  if (contact) {
    const svc = new URLSearchParams(location.search).get("service");
    const select = $("#f-service");
    if (svc && select && [...select.options].some((o) => o.value === svc)) select.value = svc;
    const status = $(".form-status", contact);
    $$("input, select, textarea", contact).forEach((f) => f.addEventListener("input", () => f.closest(".field")?.classList.remove("invalid")));

    contact.addEventListener("submit", async (e) => {
      e.preventDefault();
      let firstBad = null;
      $$("[required]", contact).forEach((f) => {
        const ok = f.type === "checkbox" ? f.checked : f.value.trim() !== "" && f.checkValidity();
        f.closest(".field")?.classList.toggle("invalid", !ok);
        if (!ok && !firstBad) firstBad = f;
      });
      if (firstBad) {
        status.className = "form-status bad";
        status.textContent = "Please check the highlighted fields.";
        firstBad.focus();
        return;
      }
      const btn = $("button[type=submit]", contact);
      btn.disabled = true;
      const result = await send(new FormData(contact));
      btn.disabled = false;
      if (result === "ok") {
        status.className = "form-status ok";
        status.textContent = "Thank you. Your message has been sent and we'll be in touch within one business day.";
        contact.reset();
      } else if (result === "not-connected") {
        status.className = "form-status bad";
        status.textContent = "This form isn't connected yet. Please contact us using the details on this page.";
      } else {
        status.className = "form-status bad";
        status.textContent = "Your message couldn't be sent. Please try again or contact us directly.";
      }
    });
  }

  $$(".newsletter").forEach((form) => form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = $("input", form), out = $(".nl-status", form);
    if (!input.value.trim() || !input.checkValidity()) { out.textContent = "Please enter a valid email address."; input.focus(); return; }
    const r = await send(new FormData(form));
    out.textContent = r === "ok" ? "Thanks for subscribing." : r === "not-connected" ? "Newsletter sign-up isn't connected yet." : "Something went wrong. Please try again.";
    if (r === "ok") form.reset();
  }));


  /* ---------- Promo video ---------- */
  const promo = $("#promo");
  if (promo) {
    const frame = promo.closest(".video-frame");
    const playBtn = $(".video-play", frame);
    let withSound = false;
    // A muted preview plays while the video is on screen (skipped for reduced motion).
    if ("IntersectionObserver" in window && !reduceMotion) {
      new IntersectionObserver(([e]) => {
        if (withSound) { if (!e.isIntersecting) promo.pause(); return; }
        if (e.isIntersecting) promo.play().catch(() => {}); else promo.pause();
      }, { threshold: 0.4 }).observe(promo);
    }
    function playWithSound(at = 0) {
      withSound = true;
      promo.muted = false;
      promo.loop = false;
      promo.controls = true;
      promo.currentTime = at;
      promo.play().catch(() => {});
      frame.classList.add("is-playing");
    }
    playBtn.addEventListener("click", () => playWithSound(0));
    $$("[data-seek]").forEach((b) => b.addEventListener("click", () => {
      playWithSound(parseFloat(b.dataset.seek));
      frame.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    }));
    promo.addEventListener("ended", () => {
      promo.controls = false;
      frame.classList.remove("is-playing");
      withSound = false;
      promo.muted = true;
      promo.loop = true;
    });
  }

  onScroll();
})();
