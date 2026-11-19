(function () {
  const data = window.HERITAGE_DATA;
  if (!data) return;

  const regionNames = Object.fromEntries(data.regions.map((r) => [r.id, r.name]));
  const regionLeads = {
    north: "皇家宫殿、祭坛、园林，还有跨多省的长城与古城墙。",
    northeast: "以古代边疆王国遗存为主。",
    east: "江南园林、西湖、古城、土楼，以及瓷业与港口遗产。",
    central: "石窟、甲骨文都城与名山古建。",
    south: "侨乡碉楼、澳门历史城区与左江岩画。",
    southwest: "古城、梯田、茶林与布达拉宫。",
    northwest: "兵马俑、莫高窟与西夏陵。",
    serial: "一条线、多地点；作业写清「跨多省市」或「跨国」即可。"
  };

  const filtersEl = document.getElementById("region-filters");
  const listEl = document.getElementById("site-list");
  const metaEl = document.getElementById("result-meta");
  const searchEl = document.getElementById("search-input");
  const toTop = document.getElementById("to-top");

  let activeRegion = "all";
  let query = "";

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderFilters() {
    filtersEl.innerHTML = data.regions
      .map(
        (r) =>
          `<button type="button" class="filter-btn${r.id === activeRegion ? " is-active" : ""}" data-region="${r.id}">${escapeHtml(r.name)}</button>`
      )
      .join("");
  }

  function matches(site) {
    if (activeRegion !== "all" && site.region !== activeRegion) return false;
    if (!query) return true;
    const hay = `${site.name} ${site.location} ${site.blurb} ${site.search} ${site.year}`.toLowerCase();
    return hay.includes(query);
  }

  function siteCard(site) {
    return `
      <article class="site-card" id="site-${escapeHtml(site.id)}">
        <div class="site-card__media">
          <img src="${escapeHtml(site.image)}" alt="${escapeHtml(site.name)}" loading="lazy" width="280" height="200">
        </div>
        <div class="site-card__body">
          <div class="site-card__meta">
            <span class="chip">${escapeHtml(String(site.year))} 年</span>
            <span class="chip">${escapeHtml(regionNames[site.region] || "")}</span>
          </div>
          <h4>${escapeHtml(site.name)}</h4>
          <p>${escapeHtml(site.blurb)}</p>
          <p class="loc">所在地：${escapeHtml(site.location)}</p>
        </div>
      </article>`;
  }

  function observeReveal() {
    const nodes = listEl.querySelectorAll(".site-card");
    if (!nodes.length) return;
    if (!("IntersectionObserver" in window)) {
      nodes.forEach((n) => n.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    nodes.forEach((n) => io.observe(n));
  }

  function renderList() {
    const filtered = data.sites.filter(matches);
    metaEl.textContent = `共显示 ${filtered.length} / ${data.sites.length} 处`;

    if (!filtered.length) {
      listEl.innerHTML = `<div class="empty">没有匹配结果。试试换个关键词，或点「全部」。</div>`;
      return;
    }

    const order = data.regions.filter((r) => r.id !== "all").map((r) => r.id);
    const groups = order
      .map((rid) => ({
        id: rid,
        name: regionNames[rid],
        lead: regionLeads[rid] || "",
        items: filtered.filter((s) => s.region === rid)
      }))
      .filter((g) => g.items.length);

    listEl.innerHTML = groups
      .map(
        (g) => `
        <section class="region-block" aria-labelledby="region-${g.id}">
          <h3 id="region-${g.id}">${escapeHtml(g.name)}</h3>
          <p class="region-lead">${escapeHtml(g.lead)}</p>
          <div class="card-grid">${g.items.map(siteCard).join("")}</div>
        </section>`
      )
      .join("");

    observeReveal();
  }

  filtersEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-region]");
    if (!btn) return;
    activeRegion = btn.getAttribute("data-region");
    renderFilters();
    renderList();
  });

  searchEl.addEventListener("input", () => {
    query = searchEl.value.trim().toLowerCase();
    renderList();
  });

  window.addEventListener(
    "scroll",
    () => {
      if (window.scrollY > 480) toTop.classList.add("is-shown");
      else toTop.classList.remove("is-shown");
    },
    { passive: true }
  );

  toTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  renderFilters();
  renderList();
})();
