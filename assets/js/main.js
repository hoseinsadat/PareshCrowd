(function () {
  "use strict";

  var DATA = window.PARESH_DATA;
  var L = DATA.labels;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.documentElement.classList.remove("no-js");

  /* ------------------------------------------------------------------ */
  /* Formatting                                                          */
  /* ------------------------------------------------------------------ */

  var nf = new Intl.NumberFormat("fa-IR");
  var nf1 = new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 1 });
  var dateFmt = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { year: "numeric", month: "long", day: "numeric" });

  function num(n) { return nf.format(Math.round(n)); }

  function toman(n) {
    if (n >= 1e9) return nf1.format(n / 1e9) + " میلیارد";
    if (n >= 1e6) return nf1.format(n / 1e6) + " میلیون";
    return num(n);
  }

  function pct(plan) { return plan.target ? Math.min(100, (plan.raised / plan.target) * 100) : 0; }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ------------------------------------------------------------------ */
  /* Icons (24px stroke icons)                                           */
  /* ------------------------------------------------------------------ */

  var ICON_PATHS = {
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    arrow: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    alert: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/>',
    wallet: '<path d="M20 12V8H6a2 2 0 0 1 0-4h12v4"/><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>'
  };

  function icon(name, cls) {
    return '<svg class="' + (cls || "") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON_PATHS[name] + "</svg>";
  }

  /* ------------------------------------------------------------------ */
  /* Shared fragments                                                    */
  /* ------------------------------------------------------------------ */

  function statusBadge(plan) {
    var cls = { active: "badge--live", soon: "badge--info", funded: "badge--dark" }[plan.status];
    return '<span class="badge ' + cls + '">' + L.status[plan.status] + "</span>";
  }

  function riskMeter(level, withLabel) {
    var bars = "";
    for (var i = 0; i < 5; i++) bars += "<i></i>";
    var label = "ریسک " + L.risk[level];
    return '<span class="risk risk--' + level + '" title="سطح ریسک: ' + L.risk[level] + ' از ۵ سطح">' +
      '<span class="risk__bars" aria-hidden="true">' + bars + "</span>" +
      (withLabel === false ? '<span class="visually-hidden">' + label + "</span>" : label) + "</span>";
  }

  function progressBar(plan, extraCls) {
    var p = pct(plan);
    return '<div class="progress ' + (extraCls || "") + (plan.status === "funded" ? " progress--done" : "") +
      '" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.round(p) +
      '" aria-label="درصد تأمین سرمایه"><span class="progress__bar" data-width="' + p.toFixed(1) + '"></span></div>';
  }

  function cardFootLine(plan) {
    if (plan.status === "soon") return '<span>شروع جذب: <b>' + num(plan.opensIn) + " روز دیگر</b></span>";
    if (plan.status === "funded") return '<span><b>' + num(plan.paidInstallments) + "</b> قسط سود پرداخت شده</span>";
    return '<span><b class="' + (plan.daysLeft <= 5 ? "text-risk" : "") + '">' + num(plan.daysLeft) + " روز</b> باقی‌مانده</span>";
  }

  function planCard(plan, delay) {
    var p = pct(plan);
    return '<article class="plan-card reveal" style="--delay:' + (delay || 0) + 'ms">' +
      '<div class="plan-card__top">' +
        '<div class="plan-card__badges">' + statusBadge(plan) + '<span class="badge badge--outline">' + plan.industry + "</span></div>" +
        '<h3 class="plan-card__title"><a class="plan-card__link" href="plan.html?id=' + plan.id + '">' + escapeHtml(plan.title) + "</a></h3>" +
        '<p class="plan-card__company">' + escapeHtml(plan.company) + " · " + plan.location + "</p>" +
      "</div>" +
      '<div class="plan-card__body">' +
        '<div class="plan-card__return">' +
          '<div class="plan-card__rate"><strong>' + num(plan.rate) + '</strong><span>٪</span><small>سود سالانه پیش‌بینی‌شده</small></div>' +
          riskMeter(plan.risk) +
        "</div>" +
        '<dl class="plan-card__facts">' +
          '<div><dt class="fact__label">مدت طرح</dt><dd class="fact__value" style="margin:0">' + num(plan.months) + " ماه</dd></div>" +
          '<div><dt class="fact__label">پرداخت سود</dt><dd class="fact__value" style="margin:0">' + L.payout[plan.payout] + "</dd></div>" +
          '<div><dt class="fact__label">ضمانت</dt><dd class="fact__value" style="margin:0">' + L.guarantee[plan.guarantee] + "</dd></div>" +
          '<div><dt class="fact__label">حداقل سرمایه‌گذاری</dt><dd class="fact__value" style="margin:0">' + toman(plan.minInvest) + " تومان</dd></div>" +
        "</dl>" +
        '<div class="plan-card__foot">' +
          progressBar(plan) +
          '<div class="plan-card__amounts"><span><b>' + num(p) + "٪</b> از " + toman(plan.target) + " تومان</span>" + cardFootLine(plan) + "</div>" +
        "</div>" +
      "</div>" +
    "</article>";
  }

  /* ------------------------------------------------------------------ */
  /* Header                                                              */
  /* ------------------------------------------------------------------ */

  function initHeader() {
    var header = document.querySelector(".site-header");
    if (!header) return;
    var onScroll = function () { header.classList.toggle("is-scrolled", window.scrollY > 8); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    var toggle = header.querySelector(".nav-toggle");
    if (toggle) {
      toggle.addEventListener("click", function () {
        var open = document.body.classList.toggle("nav-open");
        toggle.setAttribute("aria-expanded", String(open));
      });
      header.querySelectorAll(".site-nav a").forEach(function (a) {
        a.addEventListener("click", function () {
          document.body.classList.remove("nav-open");
          toggle.setAttribute("aria-expanded", "false");
        });
      });
    }
  }

  /* ------------------------------------------------------------------ */
  /* Viewport-driven effects: reveal, progress fill, count-up            */
  /* ------------------------------------------------------------------ */

  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      activate(e.target);
      io.unobserve(e.target);
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }) : null;

  function activate(el) {
    if (el.classList.contains("reveal")) el.classList.add("is-visible");
    el.querySelectorAll(".progress__bar[data-width]").forEach(function (b) { b.style.width = b.dataset.width + "%"; });
    if (el.classList.contains("progress__bar") && el.dataset.width) el.style.width = el.dataset.width + "%";
    if (el.hasAttribute("data-count")) countUp(el);
  }

  function observe(root) {
    var nodes = (root || document).querySelectorAll(".reveal, [data-count], .progress__bar[data-width]");
    nodes.forEach(function (el) {
      if (!io || reduceMotion) activate(el);
      else io.observe(el);
    });
  }

  function countUp(el) {
    var target = parseFloat(el.dataset.count);
    if (reduceMotion) { el.textContent = num(target); return; }
    var start = performance.now();
    var dur = 1400;
    function frame(t) {
      var k = Math.min(1, (t - start) / dur);
      var eased = 1 - Math.pow(1 - k, 3);
      el.textContent = num(target * eased);
      if (k < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ------------------------------------------------------------------ */
  /* Profit calculator (home + plan detail)                              */
  /* ------------------------------------------------------------------ */

  function computeReturn(plan, amount) {
    var profit = amount * (plan.rate / 100) * (plan.months / 12);
    var every = L.payoutEvery[plan.payout];
    var count = every ? Math.floor(plan.months / every) : 1;
    return { profit: profit, count: count, per: profit / count, every: every || plan.months, total: amount + profit };
  }

  function schedule(plan, amount) {
    var r = computeReturn(plan, amount);
    var rows = [];
    var now = new Date();
    var paid = plan.status === "funded" ? (plan.paidInstallments || 0) : 0;
    var base = new Date(now.getFullYear(), now.getMonth() - paid * r.every, now.getDate() - 15);
    for (var i = 1; i <= r.count; i++) {
      var d = new Date(base.getFullYear(), base.getMonth() + r.every * i, base.getDate());
      var isLast = i === r.count;
      rows.push({
        n: i,
        date: d,
        profit: r.per,
        principal: isLast ? amount : 0,
        paid: i <= paid
      });
    }
    return rows;
  }

  function setRangeFill(range) {
    var min = +range.min, max = +range.max, v = +range.value;
    range.style.setProperty("--pct", ((v - min) / (max - min)) * 100 + "%");
  }

  function parseAmount(str) {
    var latin = String(str).replace(/[۰-۹]/g, function (d) { return "۰۱۲۳۴۵۶۷۸۹".indexOf(d); })
      .replace(/[٠-٩]/g, function (d) { return "٠١٢٣٤٥٦٧٨٩".indexOf(d); });
    return parseInt(latin.replace(/[^\d]/g, ""), 10) || 0;
  }

  function initHomeCalculator() {
    var root = document.getElementById("calc");
    if (!root) return;
    var select = root.querySelector("#calc-plan");
    var range = root.querySelector("#calc-range");
    var amountOut = root.querySelector("[data-calc='amount']");
    var active = DATA.plans.filter(function (p) { return p.status !== "funded"; });

    select.innerHTML = active.map(function (p) {
      return '<option value="' + p.id + '">' + escapeHtml(p.title) + " — " + num(p.rate) + "٪، " + num(p.months) + " ماهه</option>";
    }).join("");

    function update() {
      var plan = active.find(function (p) { return p.id === select.value; }) || active[0];
      var amount = +range.value * 1e6;
      var r = computeReturn(plan, amount);
      setRangeFill(range);
      amountOut.textContent = num(amount / 1e6);
      root.querySelector("[data-calc='profit']").textContent = num(r.profit);
      root.querySelector("[data-calc='total']").textContent = num(r.total);
      root.querySelector("[data-calc='per']").textContent = num(r.per);
      root.querySelector("[data-calc='count']").textContent = r.count === 1 ? "یک‌جا در پایان دوره" : num(r.count) + " قسط " + L.payout[plan.payout];
      root.querySelector("[data-calc='link']").href = "plan.html?id=" + plan.id;
      root.querySelector("[data-calc='meta']").innerHTML = riskMeter(plan.risk) +
        "<span>" + L.guarantee[plan.guarantee] + "</span><span>حداقل " + toman(plan.minInvest) + " تومان</span>";

      var bars = root.querySelector("[data-calc='bars']");
      var html = "";
      for (var i = 1; i <= r.count; i++) {
        var h = 18 + (i / r.count) * 70;
        html += '<span style="height:' + h + '%" title="قسط ' + num(i) + '"></span>';
      }
      bars.innerHTML = html;
    }

    root.querySelectorAll("[data-calc-quick]").forEach(function (b) {
      b.addEventListener("click", function () { range.value = b.dataset.calcQuick; update(); });
    });
    select.addEventListener("change", update);
    range.addEventListener("input", update);
    update();
  }

  /* ------------------------------------------------------------------ */
  /* Page: home                                                          */
  /* ------------------------------------------------------------------ */

  function initHome() {
    var grid = document.getElementById("home-plans");
    if (grid) {
      var list = DATA.plans.filter(function (p) { return p.status === "active"; }).slice(0, 3);
      grid.innerHTML = list.map(function (p, i) { return planCard(p, i * 90); }).join("");
    }

    var hero = document.getElementById("hero-plan");
    if (hero) {
      var plan = DATA.plans[0];
      hero.querySelector("[data-hero='title']").textContent = plan.title;
      hero.querySelector("[data-hero='rate']").textContent = num(plan.rate);
      hero.querySelector("[data-hero='pct']").textContent = num(pct(plan));
      hero.querySelector("[data-hero='days']").textContent = num(plan.daysLeft);
      hero.querySelector(".progress__bar").dataset.width = pct(plan).toFixed(1);
      hero.href = "plan.html?id=" + plan.id;
    }

    initHomeCalculator();
  }

  /* ------------------------------------------------------------------ */
  /* Page: plans list                                                    */
  /* ------------------------------------------------------------------ */

  function initPlans() {
    var grid = document.getElementById("plans-grid");
    if (!grid) return;

    var state = { status: "all", industry: "all", guarantee: "all", sort: "recommended" };
    var industrySel = document.getElementById("f-industry");
    var guaranteeSel = document.getElementById("f-guarantee");
    var sortSel = document.getElementById("f-sort");
    var count = document.getElementById("plans-count");
    var empty = document.getElementById("plans-empty");

    var industries = DATA.plans.map(function (p) { return p.industry; })
      .filter(function (v, i, a) { return a.indexOf(v) === i; });
    industrySel.innerHTML = '<option value="all">همه صنایع</option>' +
      industries.map(function (v) { return "<option>" + v + "</option>"; }).join("");
    guaranteeSel.innerHTML = '<option value="all">همه ضمانت‌ها</option>' +
      Object.keys(L.guarantee).map(function (k) { return '<option value="' + k + '">' + L.guarantee[k] + "</option>"; }).join("");

    // Summary stats in the page header
    var activePlans = DATA.plans.filter(function (p) { return p.status === "active"; });
    setText("sum-active", num(activePlans.length));
    setText("sum-rate", num(Math.max.apply(null, activePlans.map(function (p) { return p.rate; }))));
    setText("sum-need", toman(activePlans.reduce(function (s, p) { return s + (p.target - p.raised); }, 0)));

    var statusOrder = { active: 0, soon: 1, funded: 2 };
    var sorters = {
      recommended: function (a, b) { return statusOrder[a.status] - statusOrder[b.status] || pct(b) - pct(a); },
      rate: function (a, b) { return b.rate - a.rate; },
      months: function (a, b) { return a.months - b.months; },
      progress: function (a, b) { return pct(b) - pct(a); },
      risk: function (a, b) { return a.risk - b.risk; }
    };

    function render() {
      var list = DATA.plans.filter(function (p) {
        return (state.status === "all" || p.status === state.status) &&
          (state.industry === "all" || p.industry === state.industry) &&
          (state.guarantee === "all" || p.guarantee === state.guarantee);
      }).sort(sorters[state.sort]);

      grid.innerHTML = list.map(function (p, i) { return planCard(p, (i % 3) * 80); }).join("");
      count.textContent = num(list.length) + " طرح";
      empty.hidden = list.length > 0;
      observe(grid);
    }

    document.querySelectorAll("[data-filter-status]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.status = btn.dataset.filterStatus;
        document.querySelectorAll("[data-filter-status]").forEach(function (b) {
          b.setAttribute("aria-pressed", String(b === btn));
        });
        render();
      });
    });
    industrySel.addEventListener("change", function () { state.industry = industrySel.value; render(); });
    guaranteeSel.addEventListener("change", function () { state.guarantee = guaranteeSel.value; render(); });
    sortSel.addEventListener("change", function () { state.sort = sortSel.value; render(); });

    document.getElementById("plans-reset").addEventListener("click", function () {
      state = { status: "all", industry: "all", guarantee: "all", sort: state.sort };
      industrySel.value = "all";
      guaranteeSel.value = "all";
      document.querySelectorAll("[data-filter-status]").forEach(function (b) {
        b.setAttribute("aria-pressed", String(b.dataset.filterStatus === "all"));
      });
      render();
    });

    var toggle = document.getElementById("filters-toggle");
    var panel = document.getElementById("filters-panel");
    if (toggle && panel) {
      toggle.addEventListener("click", function () {
        var open = panel.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", String(open));
      });
    }

    render();
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  /* ------------------------------------------------------------------ */
  /* Page: plan detail                                                   */
  /* ------------------------------------------------------------------ */

  var GUARANTEE_TEXT = {
    bank: {
      issuer: "بانک عامل طرح",
      body: "اصل سرمایه و سود پیش‌بینی‌شده با ضمانت‌نامه بانکی پوشش داده شده است. اگر کسب‌وکار نتواند به تعهد خود عمل کند، پرش ضمانت‌نامه را از طرف سرمایه‌گذاران نزد بانک مطالبه می‌کند."
    },
    fund: {
      issuer: "صندوق پژوهش و فناوری",
      body: "صندوق پژوهش و فناوری برای این طرح ضمانت‌نامه تعهد پرداخت صادر کرده است. در صورت نکول، مبلغ ضمانت‌نامه از صندوق مطالبه و بین سرمایه‌گذاران تقسیم می‌شود."
    },
    insurance: {
      issuer: "شرکت بیمه طرف قرارداد",
      body: "بیمه‌نامه اعتباری، اصل سرمایه را در برابر نکول کسب‌وکار پوشش می‌دهد. توجه کنید که پوشش بیمه ممکن است شامل سود پیش‌بینی‌شده نباشد و جزئیات آن در سند بیمه‌نامه آمده است."
    }
  };

  function initPlanDetail() {
    if (document.body.dataset.page !== "plan") return;

    var id = new URLSearchParams(location.search).get("id");
    var plan = DATA.plans.find(function (p) { return p.id === id; }) || DATA.plans[0];
    var p = pct(plan);
    document.title = plan.title + " | پرش";

    // Header
    setText("pd-crumb", plan.title);
    setText("pd-title", plan.title);
    document.getElementById("pd-badges").innerHTML = statusBadge(plan) +
      '<span class="badge badge--outline">' + plan.industry + "</span>" +
      '<span class="badge badge--positive">' + icon("shield") + L.guarantee[plan.guarantee] + "</span>";
    document.getElementById("pd-meta").innerHTML =
      '<span>' + escapeHtml(plan.company) + "</span>" +
      '<span class="row" style="gap:4px">' + icon("pin", "pd-meta__icon") + plan.location + "</span>" +
      "<span>نماد: " + plan.symbol + "</span>";

    // Key metrics
    var metrics = [
      { label: "سود سالانه پیش‌بینی‌شده", value: num(plan.rate) + "٪", cls: "text-positive" },
      { label: "مدت طرح", value: num(plan.months) + " ماه" },
      { label: "پرداخت سود", value: L.payout[plan.payout] },
      { label: "سطح ریسک", html: riskMeter(plan.risk) },
      { label: "حداقل سرمایه‌گذاری", value: toman(plan.minInvest) + " تومان" },
      { label: "سرمایه‌گذاران", value: num(plan.investors) + " نفر" }
    ];
    document.getElementById("pd-metrics").innerHTML = metrics.map(function (m) {
      return '<div class="metric"><span class="metric__label">' + m.label + '</span><span class="metric__value ' + (m.cls || "") + '">' +
        (m.html || m.value) + "</span></div>";
    }).join("");

    // Overview
    setText("pd-summary", plan.summary);
    document.getElementById("pd-highlights").innerHTML = plan.highlights.map(function (h) {
      return '<li><span class="check">' + icon("check") + "</span>" + escapeHtml(h) + "</li>";
    }).join("");

    // Use of funds
    document.getElementById("pd-uses").innerHTML = plan.uses.map(function (u, i) {
      return '<div class="use-row"><div class="row row--between"><span>' + u.label + '</span><b>' + num(u.pct) + "٪</b></div>" +
        '<div class="progress"><span class="progress__bar use-bar use-bar--' + i + '" data-width="' + u.pct + '"></span></div>' +
        '<span class="text-xs text-muted">' + toman(plan.target * u.pct / 100) + " تومان</span></div>";
    }).join("");

    // Guarantee
    var g = GUARANTEE_TEXT[plan.guarantee];
    setText("pd-guarantee-type", L.guarantee[plan.guarantee]);
    setText("pd-guarantee-issuer", g.issuer);
    setText("pd-guarantee-body", g.body);

    // Risks
    document.getElementById("pd-risk-meter").innerHTML = riskMeter(plan.risk);
    document.getElementById("pd-risks").innerHTML = plan.risks.map(function (r) {
      return '<li><span class="risk-dot">' + icon("alert") + "</span><span>" + escapeHtml(r) + "</span></li>";
    }).join("");

    // Similar plans
    var similar = DATA.plans.filter(function (x) { return x.id !== plan.id && x.status !== "funded"; }).slice(0, 3);
    document.getElementById("pd-similar").innerHTML = similar.map(function (x, i) { return planCard(x, i * 90); }).join("");

    // Invest panel + schedule share the amount
    var panel = document.getElementById("invest-panel");
    var input = document.getElementById("invest-amount");
    var amount = Math.max(plan.minInvest, 10000000);

    panel.querySelector("[data-pd='rate']").textContent = num(plan.rate);
    panel.querySelector("[data-pd='raised']").textContent = toman(plan.raised);
    panel.querySelector("[data-pd='target']").textContent = toman(plan.target);
    panel.querySelector("[data-pd='pct']").textContent = num(p);
    panel.querySelector("[data-pd='progress']").innerHTML = progressBar(plan, "progress--lg");
    panel.querySelector("[data-pd='status-line']").innerHTML = cardFootLine(plan) +
      "<span><b>" + num(plan.investors) + "</b> سرمایه‌گذار</span>";
    setText("pd-min", "حداقل " + toman(plan.minInvest) + " تومان");

    var cta = document.getElementById("invest-cta");
    var mobileCta = document.getElementById("mobile-cta");
    if (plan.status === "soon") {
      cta.innerHTML = icon("bell") + "وقتی شروع شد خبرم کن";
      mobileCta.textContent = "خبرم کن";
    } else if (plan.status === "funded") {
      cta.textContent = "این طرح تأمین شده است";
      cta.disabled = true;
      cta.classList.replace("btn--primary", "btn--outline");
      mobileCta.textContent = "مشاهده جزئیات";
      panel.querySelector(".invest-form").hidden = true;
    }
    setText("mobile-rate", num(plan.rate) + "٪");
    setText("mobile-months", num(plan.months) + " ماه · " + L.payout[plan.payout]);
    mobileCta.addEventListener("click", function () {
      panel.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      if (plan.status === "active") setTimeout(function () { input.focus({ preventScroll: true }); }, 400);
    });

    function updateAmount(v, fromInput) {
      amount = Math.max(0, v);
      if (!fromInput) input.value = num(amount);
      var r = computeReturn(plan, amount);
      var valid = amount >= plan.minInvest;
      setText("pd-profit", num(r.profit));
      setText("pd-total", num(r.total));
      setText("pd-per", r.count === 1 ? "پرداخت یک‌جا در پایان دوره" : num(r.count) + " قسط " + L.payout[plan.payout] + "، هر قسط " + num(r.per) + " تومان");
      document.getElementById("pd-min").classList.toggle("text-risk", !valid && amount > 0);
      if (plan.status === "active") cta.disabled = !valid;
      setText("pd-schedule-amount", num(amount));
      renderSchedule();
    }

    function renderSchedule() {
      var rows = schedule(plan, amount);
      document.getElementById("pd-schedule").innerHTML = rows.map(function (row) {
        var state = row.paid ? '<span class="badge badge--positive">' + icon("check") + "پرداخت شد</span>" : '<span class="badge">در انتظار</span>';
        return "<tr><td>" + num(row.n) + "</td><td>" + dateFmt.format(row.date) + '</td><td class="num">' + num(row.profit) + " تومان</td>" +
          '<td class="num">' + (row.principal ? num(row.principal) + " تومان" : "—") + "</td><td>" + state + "</td></tr>";
      }).join("");
    }

    input.addEventListener("input", function () {
      var caret = input.value.length - input.selectionStart;
      var v = parseAmount(input.value);
      input.value = v ? num(v) : "";
      var pos = Math.max(0, input.value.length - caret);
      input.setSelectionRange(pos, pos);
      updateAmount(v, true);
    });
    panel.querySelectorAll("[data-quick]").forEach(function (b) {
      b.addEventListener("click", function () { updateAmount(+b.dataset.quick); });
    });
    updateAmount(amount);

    initSectionNav();
  }

  function initSectionNav() {
    var nav = document.getElementById("pd-tabs");
    if (!nav || !("IntersectionObserver" in window)) return;
    var links = Array.prototype.slice.call(nav.querySelectorAll("a"));
    var sections = links.map(function (a) { return document.querySelector(a.getAttribute("href")); }).filter(Boolean);

    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) {
          var on = a.getAttribute("href") === "#" + e.target.id;
          a.classList.toggle("is-active", on);
          if (on) {
            a.setAttribute("aria-current", "true");
            var left = a.offsetLeft - (nav.clientWidth - a.clientWidth) / 2;
            nav.scrollTo({ left: left, behavior: reduceMotion ? "auto" : "smooth" });
          } else {
            a.removeAttribute("aria-current");
          }
        });
      });
    }, { rootMargin: "-35% 0px -60% 0px" });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ------------------------------------------------------------------ */
  /* FAQ: keep one item open at a time                                   */
  /* ------------------------------------------------------------------ */

  function initAccordions() {
    document.querySelectorAll(".accordion[data-single]").forEach(function (acc) {
      acc.addEventListener("toggle", function (e) {
        if (!e.target.open) return;
        acc.querySelectorAll("details[open]").forEach(function (d) { if (d !== e.target) d.open = false; });
      }, true);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Boot                                                                */
  /* ------------------------------------------------------------------ */

  document.querySelectorAll("[data-plan-card]").forEach(function (el) {
    var plan = DATA.plans.find(function (p) { return p.id === el.dataset.planCard; });
    if (plan) el.innerHTML = planCard(plan);
  });

  initHeader();
  initHome();
  initPlans();
  initPlanDetail();
  initAccordions();
  observe(document);
  var year = document.getElementById("year");
  if (year) year.textContent = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { year: "numeric" }).format(new Date());
})();
