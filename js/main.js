(function () {
  const TARGET_FILTERS = [
    { id: 'all', label: '전체' },
    { id: '예비창업자', label: '예비창업자' },
    { id: '소상공인', label: '소상공인' },
    { id: '중소기업', label: '중소기업' },
    { id: '중견기업', label: '중견기업' },
    { id: '스타트업', label: '스타트업' },
    { id: '수출', label: '수출기업' },
    { id: '여성', label: '여성기업' },
    { id: '사회적기업', label: '사회적기업' },
    { id: '협동조합', label: '협동조합' },
    { id: '장애인', label: '장애인기업' },
    { id: '재직자', label: '재직자' },
    { id: '청년', label: '청년' }
  ];

  const REGION_FILTERS = [
    { id: 'all', label: '전체' },
    { id: '전국', label: '전국' },
    { id: '서울', label: '서울' },
    { id: '부산', label: '부산' },
    { id: '대구', label: '대구' },
    { id: '인천', label: '인천' },
    { id: '광주', label: '광주' },
    { id: '대전', label: '대전' },
    { id: '울산', label: '울산' },
    { id: '세종', label: '세종' },
    { id: '경기', label: '경기' },
    { id: '강원', label: '강원' },
    { id: '충북', label: '충북' },
    { id: '충남', label: '충남' },
    { id: '전북', label: '전북' },
    { id: '전남', label: '전남' },
    { id: '경북', label: '경북' },
    { id: '경남', label: '경남' },
    { id: '제주', label: '제주' }
  ];

  const CATEGORY_FILTERS = [
    { id: 'housing', name: '주거' },
    { id: 'job', name: '취업' },
    { id: 'startup', name: '창업' },
    { id: 'finance', name: '자산·금융' },
    { id: 'edu', name: '교육' },
    { id: 'culture', name: '문화·생활' }
  ];

  const URGENT_DAYS = 5;
  const POPULAR_VIEWS = 3000;

  const state = {
    items: [],
    categories: [],
    activeCategory: 'all',
    activeTarget: 'all',
    activeRegion: 'all',
    keyword: '',
    pageSize: 10,
    currentPage: 1
  };

  const grid = document.getElementById('policyGrid');
  const emptyState = document.getElementById('emptyState');
  const resultsMeta = document.getElementById('resultsMeta');
  const categoryBar = document.getElementById('categoryBar');
  const targetBar = document.getElementById('targetBar');
  const regionBar = document.getElementById('regionBar');
  const searchForm = document.getElementById('searchForm');
  const searchInput = document.getElementById('searchInput');
  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('mainNav');
  const pageSizeSelect = document.getElementById('pageSizeSelect');
  const prevPageBtn = document.getElementById('prevPageBtn');
  const nextPageBtn = document.getElementById('nextPageBtn');
  const pageIndicator = document.getElementById('pageIndicator');

  if (navToggle) {
    navToggle.addEventListener('click', () => mainNav.classList.toggle('open'));
  }

  function categoryName(id) {
    const found = state.categories.find(c => c.id === id);
    return found ? found.name : id;
  }

  function renderCategoryChips() {
    state.categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'chip';
      btn.dataset.category = cat.id;
      btn.textContent = cat.name;
      btn.addEventListener('click', () => {
        state.activeCategory = cat.id;
        state.currentPage = 1;
        updateActiveChip(categoryBar, 'category', state.activeCategory);
        render();
      });
      categoryBar.appendChild(btn);
    });

    categoryBar.querySelector('[data-category="all"]').addEventListener('click', () => {
      state.activeCategory = 'all';
      state.currentPage = 1;
      updateActiveChip(categoryBar, 'category', state.activeCategory);
      render();
    });
  }

  function renderTargetChips() {
    TARGET_FILTERS.filter(t => t.id !== 'all').forEach(t => {
      const btn = document.createElement('button');
      btn.className = 'chip';
      btn.dataset.target = t.id;
      btn.textContent = t.label;
      btn.addEventListener('click', () => {
        state.activeTarget = t.id;
        state.currentPage = 1;
        updateActiveChip(targetBar, 'target', state.activeTarget);
        render();
      });
      targetBar.appendChild(btn);
    });

    targetBar.querySelector('[data-target="all"]').addEventListener('click', () => {
      state.activeTarget = 'all';
      state.currentPage = 1;
      updateActiveChip(targetBar, 'target', state.activeTarget);
      render();
    });
  }

  function renderRegionChips() {
    REGION_FILTERS.filter(r => r.id !== 'all').forEach(r => {
      const btn = document.createElement('button');
      btn.className = 'chip';
      btn.dataset.region = r.id;
      btn.textContent = r.label;
      btn.addEventListener('click', () => {
        state.activeRegion = r.id;
        state.currentPage = 1;
        updateActiveChip(regionBar, 'region', state.activeRegion);
        render();
      });
      regionBar.appendChild(btn);
    });

    regionBar.querySelector('[data-region="all"]').addEventListener('click', () => {
      state.activeRegion = 'all';
      state.currentPage = 1;
      updateActiveChip(regionBar, 'region', state.activeRegion);
      render();
    });
  }

  function updateActiveChip(bar, datasetKey, value) {
    bar.querySelectorAll('.chip').forEach(chip => {
      chip.classList.toggle('active', chip.dataset[datasetKey] === value);
    });
  }

  function parseDeadlineDate(period) {
    if (!period) return null;

    const dotted = period.match(/\d{4}[.\-]\d{2}[.\-]\d{2}/g);
    if (dotted && dotted.length) {
      const last = dotted[dotted.length - 1];
      const parts = last.split(/[.\-]/).map(Number);
      const date = new Date(parts[0], parts[1] - 1, parts[2]);
      return isNaN(date.getTime()) ? null : date;
    }

    const compact = period.match(/\d{8}/g);
    if (compact && compact.length) {
      const last = compact[compact.length - 1];
      const date = new Date(Number(last.slice(0, 4)), Number(last.slice(4, 6)) - 1, Number(last.slice(6, 8)));
      return isNaN(date.getTime()) ? null : date;
    }

    return null;
  }

  function daysLeftFor(item) {
    const deadline = parseDeadlineDate(item.period);
    if (!deadline) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((deadline - today) / 86400000);
  }

  function matchesTarget(item, targetId) {
    if (targetId === 'all') return true;
    const haystack = `${item.target || ''} ${(item.tags || []).join(' ')} ${item.title || ''}`;
    return haystack.includes(targetId);
  }

  function matchesRegion(item, regionId) {
    if (regionId === 'all') return true;
    const region = item.region || '';
    return region.includes(regionId) || region.includes('전국');
  }

  function filteredItems() {
    return state.items.filter(item => {
      const matchesCategory = state.activeCategory === 'all' || item.category === state.activeCategory;
      const haystack = `${item.title} ${item.org} ${item.target} ${(item.tags || []).join(' ')}`.toLowerCase();
      const matchesKeyword = !state.keyword || haystack.includes(state.keyword.toLowerCase());
      return matchesCategory && matchesKeyword && matchesTarget(item, state.activeTarget) && matchesRegion(item, state.activeRegion);
    });
  }

  function sortByDeadline(items) {
    const withMeta = items.map(item => ({
      item,
      daysLeft: daysLeftFor(item),
      views: Number(item.views) || 0
    }));
    withMeta.sort((a, b) => {
      // 0: 마감임박(D-5 이내), 1: 여유있는 진행중, 2: 마감일 정보 없음, 3: 마감됨
      const rank = (v) => (v === null ? 2 : (v < 0 ? 3 : (v <= URGENT_DAYS ? 0 : 1)));
      const rankA = rank(a.daysLeft);
      const rankB = rank(b.daysLeft);
      if (rankA !== rankB) return rankA - rankB;
      if (rankA === 0) return a.daysLeft - b.daysLeft; // 마감 임박 순
      return b.views - a.views; // 그 외에는 조회수(인기) 높은 순
    });
    return withMeta;
  }

  function badgeHtml(daysLeft, views) {
    let html = '';
    if (views >= POPULAR_VIEWS) html += '<span class="badge-popular">인기</span>';
    if (daysLeft === null) return html;
    if (daysLeft < 0) return html + '<span class="badge-closed">마감</span>';
    if (daysLeft <= URGENT_DAYS) return html + `<span class="badge-urgent">마감임박 D-${daysLeft}</span>`;
    return html;
  }

  function renderCard(item, daysLeft, views) {
    const card = document.createElement('a');
    card.className = 'policy-card';
    card.href = item.link;
    card.target = '_blank';
    card.rel = 'noopener';
    card.innerHTML = `
      <div class="badge-row">
        <span class="badge">${categoryName(item.category)}</span>
        ${badgeHtml(daysLeft, views)}
      </div>
      <h3>${item.title}</h3>
      <div class="org">${item.org}</div>
      <dl>
        <div><dt>대상</dt><dd>${item.target}</dd></div>
        <div><dt>지역</dt><dd>${item.region}</dd></div>
        <div><dt>기간</dt><dd>${item.period}</dd></div>
        <div class="support"><dt>지원</dt><dd>${item.support}</dd></div>
      </dl>
      <div class="tags">${(item.tags || []).map(t => `<span>#${t}</span>`).join('')}</div>
      <span class="card-link">공식 페이지 바로가기 →</span>
    `;
    return card;
  }

  function render() {
    const filtered = sortByDeadline(filteredItems());
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / state.pageSize));
    if (state.currentPage > totalPages) state.currentPage = totalPages;
    if (state.currentPage < 1) state.currentPage = 1;

    const start = (state.currentPage - 1) * state.pageSize;
    const pageItems = filtered.slice(start, start + state.pageSize);

    grid.innerHTML = '';
    pageItems.forEach(({ item, daysLeft, views }) => grid.appendChild(renderCard(item, daysLeft, views)));
    emptyState.hidden = total !== 0;
    resultsMeta.textContent = `총 ${total}개의 공고를 찾았어요`;

    pageIndicator.textContent = `${state.currentPage} / ${totalPages} 페이지`;
    prevPageBtn.disabled = state.currentPage <= 1;
    nextPageBtn.disabled = state.currentPage >= totalPages;
  }

  async function loadJson(path) {
    try {
      const res = await fetch(path);
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      return null;
    }
  }

  async function init() {
    const [youthpolicy, bizinfo] = await Promise.all([
      loadJson('data/youthpolicy.json'),
      loadJson('data/bizinfo.json')
    ]);

    if (!youthpolicy && !bizinfo) {
      resultsMeta.textContent = '정책 데이터를 불러오지 못했어요. 로컬 서버로 실행 중인지 확인해주세요.';
      return;
    }

    state.items = [...((youthpolicy && youthpolicy.items) || []), ...((bizinfo && bizinfo.items) || [])];
    state.categories = CATEGORY_FILTERS;

    renderCategoryChips();
    renderTargetChips();
    renderRegionChips();
    render();
  }

  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    state.keyword = searchInput.value.trim();
    state.currentPage = 1;
    render();
  });

  pageSizeSelect.addEventListener('change', () => {
    state.pageSize = Number(pageSizeSelect.value);
    state.currentPage = 1;
    render();
  });

  prevPageBtn.addEventListener('click', () => {
    state.currentPage -= 1;
    render();
  });

  nextPageBtn.addEventListener('click', () => {
    state.currentPage += 1;
    render();
  });

  init();
})();
