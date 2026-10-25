(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* Loader + page entrance */
  function start() {
    $("#loader").classList.add("done");
    document.body.classList.add("ready");
  }
  window.addEventListener("load", function () { setTimeout(start, reduce ? 0 : 1200); });
  setTimeout(start, 4000); // safety net if load event is slow

  /* Split headings into words for text reveal */
  $$(".split").forEach(function (el) {
    var words = el.textContent.trim().split(/\s+/);
    el.setAttribute("aria-label", el.textContent.trim());
    el.innerHTML = words.map(function (w, i) {
      return '<span class="w" aria-hidden="true"><span style="transition-delay:' + i * 90 + 'ms">' + w + "</span></span> ";
    }).join("");
  });

  /* Reveal on scroll */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.15 });
    $$(".reveal, .split").forEach(function (el) { io.observe(el); });
  } else {
    $$(".reveal, .split").forEach(function (el) { el.classList.add("in"); });
  }

  /* Navigation: solid background, active link, mobile menu */
  var nav = $("#nav"), toggle = $("#navToggle"), menu = $("#menu");
  var links = $$("a", menu);
  function setMenu(open) {
    menu.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", open);
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.style.overflow = open ? "hidden" : "";
  }
  toggle.addEventListener("click", function () { setMenu(!menu.classList.contains("open")); });
  links.forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });

  var sections = links.map(function (a) { return $(a.getAttribute("href")); });
  var parallax = $$("[data-parallax]");
  var ticking = false;
  function onScroll() {
    var y = window.scrollY;
    nav.classList.toggle("solid", y > 60);
    var mark = y + window.innerHeight * 0.4, cur = 0;
    sections.forEach(function (s, i) { if (s && s.offsetTop <= mark) cur = i; });
    links.forEach(function (a, i) { a.classList.toggle("active", i === cur); });
    if (!reduce) {
      parallax.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > window.innerHeight + 200) return;
        var offset = (r.top + r.height / 2 - window.innerHeight / 2) * parseFloat(el.dataset.parallax);
        el.style.translate = "0 " + offset.toFixed(1) + "px";
      });
    }
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* Golden dust in hero */
  if (!reduce) {
    var dust = $("#dust"), frag = document.createDocumentFragment();
    for (var i = 0; i < 24; i++) {
      var d = document.createElement("i");
      d.style.left = Math.random() * 100 + "%";
      d.style.top = 30 + Math.random() * 60 + "%";
      d.style.animationDuration = 6 + Math.random() * 8 + "s";
      d.style.animationDelay = -Math.random() * 10 + "s";
      frag.appendChild(d);
    }
    dust.appendChild(frag);
  }

  /* Subtle cursor */
  var cursor = $("#cursor");
  if (window.matchMedia("(hover:hover) and (pointer:fine)").matches && !reduce) {
    var cx = 0, cy = 0, tx = 0, ty = 0;
    window.addEventListener("mousemove", function (e) { tx = e.clientX; ty = e.clientY; cursor.classList.add("on"); });
    (function loop() {
      cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18;
      cursor.style.transform = "translate(" + cx + "px," + cy + "px)";
      requestAnimationFrame(loop);
    })();
    document.addEventListener("mouseover", function (e) {
      cursor.classList.toggle("big", !!e.target.closest("a,button"));
    });
  }

  /* Exhibition button: scroll to gallery */
  $("#exhibitBtn").addEventListener("click", function () {
    $("#gallery").scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  });

  /* Lightbox */
  var lb = $("#lightbox"), items = $$("[data-open]"), idx = 0, opener = null;
  function show(i) {
    idx = (i + items.length) % items.length;
    var it = items[idx], svg = $("svg", it);
    $("#lbArt").innerHTML = svg ? svg.outerHTML : "";
    var s = $("#lbArt svg"); if (s) { s.removeAttribute("style"); s.setAttribute("viewBox", "0 0 100 160"); s.setAttribute("aria-hidden", "true"); }
    $("#lbTitle").textContent = it.dataset.title;
    $("#lbEra").textContent = it.dataset.era;
    $("#lbText").textContent = it.dataset.text;
  }
  function openLb(i, from) {
    opener = from; show(i);
    lb.hidden = false; document.body.style.overflow = "hidden";
    $("#lbClose").focus();
  }
  function closeLb() {
    lb.hidden = true; document.body.style.overflow = "";
    if (opener) opener.focus();
  }
  items.forEach(function (it, i) { it.addEventListener("click", function () { openLb(i, it); }); });
  $("#lbClose").addEventListener("click", closeLb);
  $("#lbPrev").addEventListener("click", function () { show(idx - 1); });
  $("#lbNext").addEventListener("click", function () { show(idx + 1); });
  lb.addEventListener("click", function (e) { if (e.target === lb) closeLb(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { if (!lb.hidden) closeLb(); else setMenu(false); }
    if (lb.hidden) return;
    if (e.key === "ArrowLeft") show(idx - 1);
    if (e.key === "ArrowRight") show(idx + 1);
  });
  var sx = null; // swipe support for touch screens
  lb.addEventListener("touchstart", function (e) { sx = e.changedTouches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", function (e) {
    if (sx === null) return;
    var dx = e.changedTouches[0].clientX - sx; sx = null;
    if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
  });
})();
