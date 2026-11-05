/* ============================================================
 * 主逻辑：时钟 / 视图切换 / 空间视图（高德地图 + 城市行政边界）/ 时间视图 / 灯箱
 * 依赖 js/photos.js 中的 PHOTOS、CITIES、HUB_CITY、YEAR_NOTES、YEAR_INTROS
 * 依赖 index.html 中引入的高德 JS API v2（含 AMap.DistrictLayer 插件）
 * ============================================================ */

(function () {
  'use strict';

  const $ = (sel) => document.querySelector(sel);

  const CURRENT_YEAR = String(new Date().getFullYear());

  /* 需与 index.html 中 script 的 key 保持一致 */
  const AMAP_KEY = '906aa4509a440c22e2d461602eaf0079';
  const KEY_READY = AMAP_KEY && AMAP_KEY.indexOf('YOUR_') !== 0;
  const HAS_AMAP = typeof AMap !== 'undefined';

  /* 按城市统计照片数（照片上架后自动 > 0） */
  const countByCity = {};
  PHOTOS.forEach((p) => { countByCity[p.city] = (countByCity[p.city] || 0) + 1; });

  /* ============================================================
   * 导航栏：实时时钟（HH:MM:SS，每秒更新）
   * ============================================================ */
  const clockEl = $('#clock');

  function tickClock() {
    const d = new Date();
    clockEl.textContent = [d.getHours(), d.getMinutes(), d.getSeconds()]
      .map((n) => String(n).padStart(2, '0'))
      .join(':');
  }

  tickClock();
  setInterval(tickClock, 1000);

  /* ============================================================
   * 视图切换
   * ============================================================ */
  const views = {
    geo:   { btn: $('#btnGeo'),   el: $('#viewGeo') },
    time:  { btn: $('#btnTime'),  el: $('#viewTime') },
    equip: { btn: $('#btnEquip'), el: $('#viewEquip') },
  };

  function switchView(name) {
    Object.entries(views).forEach(([key, v]) => {
      const on = key === name;
      v.btn.classList.toggle('active', on);
      v.btn.setAttribute('aria-selected', on);
      v.el.classList.toggle('active', on);
    });
    /* 切回空间视图时重新计算地图尺寸，避免容器被隐藏后尺寸为 0 */
    if (name === 'geo' && map) setTimeout(() => map.resize(), 60);
  }

  views.geo.btn.addEventListener('click', () => switchView('geo'));
  views.time.btn.addEventListener('click', () => switchView('time'));
  views.equip.btn.addEventListener('click', () => switchView('equip'));

  /* ============================================================
   * 视图一：空间 —— 高德地图 + DistrictLayer 城市边界
   * ============================================================ */
  let map = null;             // AMap 实例
  let chinaLayer = null;      // 中国整体底色
  let cityBoundary = null;    // 当前选中城市的行政边界
  let cityExtraLayer = null;  // 县级市兜底层（Polygon / Circle）
  const provinceLayers = [];  // 去过的省份点亮层
  let selectedName = null;    // 当前选中的城市名
  let selectedUid = null;     // 当前选中的列表条目 uid（区分同城市的多个年份入口）
  let markerClickedAt = 0;    // 区分 marker 点击与地图空白点击

  const markerMap = {};       // 城市名 -> AMap.Marker
  const autoBoundaries = {};  // zoom>=10 时按视野自动加载的城市边界（城市名 -> 图层）
  const russiaHandled = new Set(); // 俄罗斯两城已渲染（搜索或圆形兜底）
  const HOME_VIEW = { center: [104.5, 35.8], zoom: 3.4 };

  /* 省份层样式（俄罗斯城市区域兜底也复用） */
  const PROVINCE_STYLES = {
    fill: 'rgba(139, 111, 71, 0.35)',           /* #8b6f47 @ 0.35 */
    stroke: 'rgba(212, 165, 116, 0.6)',         /* #d4a574 @ 0.6 */
    'stroke-width': 0.6,
    'national-stroke': 'rgba(212, 165, 116, 0.6)',
    'coastline-stroke': 'rgba(212, 165, 116, 0.6)',
    'province-stroke': 'rgba(212, 165, 116, 0.6)',
    'city-stroke': 'rgba(212, 165, 116, 0.6)',
    'county-stroke': 'rgba(212, 165, 116, 0.6)',
  };

  function dotHTML(active) {
    return `<div class="amap-dot${active ? ' active' : ''}"></div>`;
  }

  function showMapFallback(title, hint) {
    const el = document.getElementById('amapContainer');
    el.innerHTML = `<p class="map-fallback">${title}<span>${hint}</span></p>`;
  }

  function initMap() {
    if (!HAS_AMAP || !KEY_READY) {
      showMapFallback(
        '高德地图未启用',
        '请把 index.html 中的 YOUR_AMAP_KEY 替换为你的 Web 端（JS API）Key'
      );
      return;
    }

    try {
      map = new AMap.Map('amapContainer', {
        viewMode: '2D',
        mapStyle: 'amap://styles/dark',   // 高德自带暗色样式
        center: HOME_VIEW.center,
        zoom: HOME_VIEW.zoom,
        zooms: [2, 12],
        showLabel: false,                 // 关键：不显示任何文字标注
        resizeEnable: true,
      });
    } catch (err) {
      showMapFallback('高德地图初始化失败', '请确认 Key 为 Web 端（JS API）类型，并已配置安全密钥');
      return;
    }

    /* 中国整体：浅沙色薄纱填充（透明度直接写进 rgba，DistrictLayer 不支持 fill-opacity 键），
       国界/海岸线统一暖沙色细线（覆盖默认蓝色） */
    const COUNTRY_STYLES = {
      fill: 'rgba(232, 213, 176, 0.18)',          /* #e8d5b0 @ 0.18 */
      stroke: 'rgba(232, 213, 176, 0.4)',         /* #e8d5b0 @ 0.4 */
      'stroke-width': 0.8,
      'national-stroke': 'rgba(232, 213, 176, 0.4)',
      'coastline-stroke': 'rgba(232, 213, 176, 0.4)',
      'province-stroke': 'rgba(232, 213, 176, 0.4)',
      'city-stroke': 'rgba(232, 213, 176, 0.4)',
      'county-stroke': 'rgba(232, 213, 176, 0.4)',
    };

    chinaLayer = new AMap.DistrictLayer.Country({
      zIndex: 10,
      SOC: 'CHN',
      depth: 1,
      styles: COUNTRY_STYLES,
    });
    map.add(chinaLayer);

    /* 俄罗斯：去过莫斯科/圣彼得堡，同样用国家边界层铺色 */
    const russiaLayer = new AMap.DistrictLayer.Country({
      zIndex: 10,
      SOC: 'RUS',
      depth: 1,
      styles: COUNTRY_STYLES,
    });
    map.add(russiaLayer);

    /* 去过的城市所在省份：省级边界点亮（zIndex 11，在国家层 10 之上、城市层 12 之下） */

    /* 江苏 320000 湖北 420000 湖南 430000 重庆 500000 广东 440000 河北 130000
       江西 360000 安徽 340000 上海 310000 浙江 330000 香港 810000 澳门 820000
       吉林 220000 黑龙江 230000 辽宁 210000 山东 370000 天津 120000 */
    const VISITED_PROVINCES = [
      '320000', '420000', '430000', '500000', '440000', '130000',
      '360000', '340000', '310000', '330000', '810000', '820000',
      '220000', '230000', '210000', '370000', '120000',
    ];

    VISITED_PROVINCES.forEach((ad) => {
      try {
        const layer = new AMap.DistrictLayer.Province({
          adcode: ad,
          depth: 0,   /* 只画省级轮廓；depth 1 会把省内每个地级市都画出来（默认视图出现城市轮廓的根源） */
          zIndex: 11,
          styles: PROVINCE_STYLES,
        });
        map.add(layer);
        provinceLayers.push(layer);
      } catch (err) { /* 单个省份数据异常时跳过，不影响其余图层 */ }
    });

    /* 俄罗斯两城：先搜行政边界，搜不到再画圆形覆盖物兜底 */
    loadRussiaCityAreas();

    /* 28 个城市圆点（全部无文字标签） */
    CITIES.forEach((c) => {
      const marker = new AMap.Marker({
        position: [c.lon, c.lat],
        content: dotHTML(false),
        offset: new AMap.Pixel(-5, -5),
        zIndex: 20,
        extData: { name: c.name },
        map,
      });

      /* 点击 marker：只选中（面板 + 高亮），不缩放、不加载城市边界；marker 无年份概念 → 全部照片 */
      marker.on('click', () => {
        markerClickedAt = Date.now();
        selectCity({ city: c, uid: null, datePrefix: null });
      });

      markerMap[c.name] = marker;
    });

    /* 放射状虚线：武汉 → 其他所有城市 */
    const hub = CITIES.find((c) => c.name === HUB_CITY);
    CITIES.filter((c) => c.name !== HUB_CITY).forEach((c) => {
      new AMap.Polyline({
        path: [[hub.lon, hub.lat], [c.lon, c.lat]],
        strokeColor: '#d4a578',
        strokeOpacity: 0.3,
        strokeWeight: 1,
        strokeDasharray: [4, 4],
        zIndex: 5,
        map,
      });
    });

    /* 点击地图空白处取消选中（marker 点击不触发） */
    map.on('click', () => {
      if (Date.now() - markerClickedAt < 350) return;
      deselectCity();
    });

    /* 缩放 / 平移结束后按视野同步城市边界（zoom>=10 加载，zoom<8 清空） */
    map.on('zoomend', syncAutoBoundaries);
    map.on('moveend', syncAutoBoundaries);
  }

  /* ---- 俄罗斯两城（莫斯科 / 圣彼得堡）----
   * 高德没有俄罗斯州级行政区图层，先用 DistrictSearch 按城市名搜边界；
   * 搜不到（status 非 complete / 无 adcode / 报错）就退化为圆形覆盖物，
   * 半径按城市实际规模取值，配色与省份层一致。 */
  function loadRussiaCityAreas() {
    const targets = CITIES.filter((c) => !c.adcode);   // 莫斯科、圣彼得堡

    function addCityCircle(c) {
      if (russiaHandled.has(c.name) || !map) return;
      russiaHandled.add(c.name);
      const circle = new AMap.Circle({
        center: [c.lon, c.lat],
        radius: c.name === '莫斯科' ? 35000 : 25000,   // 米；对应两城城区规模
        map,
        zIndex: 11,
        bubble: true,
      });
      circle.setOptions({
        fillColor: '#8b6f47',
        fillOpacity: 0.35,
        strokeColor: '#d4a574',
        strokeOpacity: 0.6,
        strokeWeight: 0.6,
      });
      c._areaCircle = circle;
    }

    function trySearch() {
      try {
        AMap.plugin('AMap.DistrictSearch', () => {
          const ds = new AMap.DistrictSearch({ level: 'city', subdistrict: 0, extensions: 'all' });
          targets.forEach((c) => {
            ds.search(c.name, (status, result) => {
              try {
                const list = (status === 'complete' && result && result.districtList) || [];
                const d = list[0];
                if (d && d.adcode) {
                  /* 搜到了行政区划：按返回的 adcode 加载省级图层 */
                  const layer = new AMap.DistrictLayer.Province({
                    adcode: String(d.adcode),
                    depth: 1,
                    zIndex: 11,
                    styles: PROVINCE_STYLES,
                  });
                  map.add(layer);
                  provinceLayers.push(layer);
                  russiaHandled.add(c.name);
                } else {
                  addCityCircle(c);   /* 高德无该城边界数据 → 圆形兜底 */
                }
              } catch (err) {
                addCityCircle(c);
              }
            });
          });
        });
      } catch (err) {
        targets.forEach(addCityCircle);   /* DistrictSearch 不可用 → 全部圆形兜底 */
      }
    }

    trySearch();
    /* 10 秒内仍未渲染（请求无响应等）→ 圆形兜底 */
    setTimeout(() => targets.forEach((c) => {
      if (!russiaHandled.has(c.name)) addCityCircle(c);
    }), 10000);
  }

  /* ---- zoom>=10：视野内已到访城市自动加载边界；zoom<8：全部隐藏 ---- */
  const AUTO_CITY_STYLES = {
    fill: 'rgba(160, 104, 48, 0.5)',            /* #a06830 @ 0.5，比选中态淡 */
    stroke: 'rgba(212, 165, 116, 0.6)',         /* #d4a574 @ 0.6 */
    'stroke-width': 1,
    'national-stroke': 'rgba(212, 165, 116, 0.6)',
    'coastline-stroke': 'rgba(212, 165, 116, 0.6)',
    'province-stroke': 'rgba(212, 165, 116, 0.6)',
    'city-stroke': 'rgba(212, 165, 116, 0.6)',
    'county-stroke': 'rgba(212, 165, 116, 0.6)',
  };

  function clearAutoBoundaries() {
    Object.values(autoBoundaries).forEach((layer) => { if (map) map.remove(layer); });
    Object.keys(autoBoundaries).forEach((k) => delete autoBoundaries[k]);
  }

  function syncAutoBoundaries() {
    if (!map) return;
    const z = map.getZoom();

    /* zoom < 9：所有城市级行政边界一律隐藏（含选中态的），只留国家层 + 省份层 + marker */
    if (z < 9) {
      clearAutoBoundaries();
      removeCityBoundary();
      return;
    }
    if (z < 10) return;                             // 9~10 过渡区间：维持现状

    const bounds = map.getBounds();
    CITIES.forEach((c) => {
      if (!c.adcode) return;                        // 莫斯科 / 圣彼得堡无边界数据
      if (c.boundaryAlt) return;                    // 县级市/新区（漠河、雄安）无 DistrictLayer 数据
      if (c.name === selectedName) return;          // 选中城市走高亮层
      if (autoBoundaries[c.name]) return;
      if (!bounds.contains([c.lon, c.lat])) return;
      try {
        autoBoundaries[c.name] = new AMap.DistrictLayer.Province({
          adcode: String(c.adcode),
          depth: 1,                                 /* 同选中层：城市 adcode 需 depth 1 才渲染 */
          zIndex: 12,
          styles: AUTO_CITY_STYLES,
        });
        map.add(autoBoundaries[c.name]);
      } catch (err) { /* 单城数据异常跳过 */ }
    });
  }

  /* 加载 / 替换选中城市的行政边界（仅从左侧列表点入时调用） */
  function applyBoundary(city) {
    removeCityBoundary();
    /* 若该城市此前已被自动层淡显（0.5），先移除，避免与 0.85 高亮层叠色 */
    if (city && autoBoundaries[city.name]) {
      map.remove(autoBoundaries[city.name]);
      delete autoBoundaries[city.name];
    }
    /* 莫斯科 / 圣彼得堡：高德俄罗斯数据不全，只平移不加载边界 */
    if (!city || !city.adcode) return;

    /* 县级市 / 新区（漠河、雄安）：DistrictLayer 无面数据，走 DistrictSearch + 圆形兜底 */
    if (city.boundaryAlt === 'search') {
      drawBoundaryFallback(city);
      return;
    }

    /* 注意：城市级 adcode 必须用 depth 1（渲染区县子级，并集即完整市域）；
     * depth 0 对城市 adcode 高德不渲染（省级 adcode 才有效）。
     * zIndex 13 高于省份层(11)与自动淡显层(12)，保证高亮不被盖住。 */
    cityBoundary = new AMap.DistrictLayer.Province({
      adcode: String(city.adcode),
      depth: 1,
      zIndex: 13,
      styles: {
        fill: 'rgba(160, 104, 48, 0.85)',           /* #a06830 @ 0.85 */
        stroke: '#d4a574',
        'stroke-width': 1.5,
        /* 覆盖市界/区县界/海岸线默认色，避免出现蓝色细线 */
        'national-stroke': '#d4a574',
        'coastline-stroke': '#d4a574',
        'province-stroke': '#d4a574',
        'city-stroke': '#d4a574',
        'county-stroke': '#d4a574',
      },
    });
    map.add(cityBoundary);
  }

  function removeCityBoundary() {
    if (cityBoundary && map) {
      map.remove(cityBoundary);
    }
    cityBoundary = null;
    removeCityExtra();
  }

  /* ---- 县级市 / 新区兜底：DistrictSearch 取边界 → 失败则画圆 ---- */
  function removeCityExtra() {
    if (cityExtraLayer && map) {
      map.remove(cityExtraLayer);
    }
    cityExtraLayer = null;
  }

  function drawBoundaryFallback(city) {
    const areaStyle = {
      zIndex: 13,
      bubble: true,
      fillColor: '#a06830',
      fillOpacity: 0.85,
      strokeColor: '#d4a574',
      strokeOpacity: 1,
      strokeWeight: 1.5,
    };

    const drawCircle = () => {
      if (selectedName !== city.name) return;   // 期间已切到别的城市
      removeCityExtra();
      cityExtraLayer = new AMap.Circle({
        center: [city.lon, city.lat],
        radius: city.r || 8000,
        map,
        ...areaStyle,
      });
    };

    try {
      AMap.plugin('AMap.DistrictSearch', () => {
        const ds = new AMap.DistrictSearch({ level: 'city', subdistrict: 0, extensions: 'all' });
        ds.search(city.name, (status, result) => {
          try {
            const d = (status === 'complete' && result && result.districtList && result.districtList[0]) || null;
            const rings = d && d.boundaries && d.boundaries.length ? d.boundaries : null;
            if (rings) {
              /* 搜到边界：用 Polygon 按选中样式绘制（可能多环，逐环画） */
              if (selectedName !== city.name) return;
              removeCityExtra();
              cityExtraLayer = new AMap.Polygon({
                path: rings.length === 1 ? rings[0] : rings,
                map,
                ...areaStyle,
              });
            } else {
              drawCircle();   // 无边界数据 → 圆形兜底
            }
          } catch (err) {
            drawCircle();
          }
        });
      });
    } catch (err) {
      drawCircle();
    }

    /* 3 秒内没结果（插件异常/请求挂起）→ 圆形兜底 */
    setTimeout(() => {
      if (!cityExtraLayer && selectedName === city.name) drawCircle();
    }, 3000);
  }

  /* 平滑放大并平移到城市（列表点击入口）
   * zoom 9.5：能看到城市边界 + 周围省份；中心东移一段像素，让城市略偏左，右侧详情面板区域留出视线 */
  function flyToCity(city) {
    if (!map) return;
    applyBoundary(city);
    const z = 9;
    const pxPerDeg = 360 / (256 * Math.pow(2, z));   // Web Mercator 经度-像素换算
    const shiftPx = 140;                              // 城市中心相对地图容器中心左移的像素
    const centerLon = city.lon + shiftPx * pxPerDeg;  // 地图中心在城市东侧 → 城市显示偏左
    map.setZoomAndCenter(z, [centerLon, city.lat], false, 900);
  }

  function resetView() {
    if (!map) return;
    removeCityBoundary();
    clearAutoBoundaries();
    map.setZoomAndCenter(HOME_VIEW.zoom, HOME_VIEW.center, false, 800);
    deselectCity();
  }

  function zoomBy(factor) {
    if (!map) return;
    const z = map.getZoom();
    map.setZoom(Math.min(12, Math.max(2, z + factor)), false, 250);
  }

  $('#zoomIn').addEventListener('click', () => zoomBy(1));
  $('#zoomOut').addEventListener('click', () => zoomBy(-1));
  $('#resetBtn').addEventListener('click', resetView);

  /* ---- 左侧城市列表（按年份分组） ---- */
  const cityListEl = $('#cityList');

  /* 分组：按 c.year 生成列表条目；跨年份城市（listAlso，如深圳 2024/2026）拆成
   * 两个独立条目（各自 uid + datePrefix），照片与选中态互不干扰 */
  const listGroups = {};
  CITIES.forEach((c) => {
    const multi = (c.listAlso && c.listAlso.length) ? true : false;
    [...new Set([c.year, ...(c.listAlso || [])])].forEach((y) => {
      const entry = {
        city: c,
        year: y,
        uid: `${c.name}-${y}`,
        datePrefix: multi ? String(y) : null,   /* 多批次城市：只显示该年份的照片 */
      };
      (listGroups[y] = listGroups[y] || []).push(entry);
    });
  });

  Object.keys(listGroups).map(Number).sort().forEach((y) => {
    const head = document.createElement('li');
    head.className = 'list-year-head';
    head.textContent = y;
    cityListEl.appendChild(head);

    listGroups[y].forEach((entry) => {
      const c = entry.city;
      /* 跨年份城市：右侧张数只统计该年份批次（2024 深圳 3 / 2026 深圳 8） */
      const count = entry.datePrefix
        ? PHOTOS.filter((p) => p.city === c.name && String(p.date).startsWith(entry.datePrefix)).length
        : (countByCity[c.name] || 0);
      const li = document.createElement('li');
      li.className = 'city-item';
      li.dataset.uid = entry.uid;
      li.innerHTML = `
        <span class="city-item-dot"></span>
        <span class="city-item-name">${c.name}</span>
        <span class="city-item-count">${count}</span>
      `;
      li.addEventListener('click', () => {
        selectCity(entry);
        flyToCity(c);
        if (isMobile()) closeDrawer();   // 手机端：选完城市收起抽屉
      });
      cityListEl.appendChild(li);
    });
  });

  /* ---- 底部统计文字 ---- */
  (function buildStats() {
    const ys = CITIES.map((c) => c.year);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const span = maxY - minY + 1;
    // 作品总数随 PHOTOS 自动更新；如需固定总数，把 PHOTOS.length 改成固定值即可
    $('#geoStats').innerHTML =
      `已到访 <em>${CITIES.length}</em> 座城市 · <em>${PHOTOS.length}</em> 张作品` +
      ` · 跨时 <em>${span}</em> 年（<em>${minY}</em>–<em>${maxY}</em>）`;
  })();

  /* ---- 右侧照片面板 ---- */
  const cityPanel = $('#cityPanel');
  const cityTitle = $('#cityTitle');
  const cityCount = $('#cityCount');
  const cityGrid = $('#cityGrid');
  const panelEmpty = $('#panelEmpty');

  function highlightMarkers() {
    Object.entries(markerMap).forEach(([name, m]) => m.setContent(dotHTML(name === selectedName)));
  }

  /* entry：列表条目 { city, year, uid, datePrefix }；datePrefix 存在时只显示该年份批次 */
  function selectCity(entry) {
    const city = entry.city;
    selectedName = city.name;
    selectedUid = entry.uid || null;
    let list = PHOTOS.filter((p) => p.city === city.name);
    if (entry.datePrefix) {
      list = list.filter((p) => String(p.date).startsWith(entry.datePrefix));
    }

    /* 标题：英文 Times / 点号 / 中文思源宋体 */
    cityTitle.innerHTML =
      `<span class="city-en">${city.en}</span>` +
      `<span class="city-sep">·</span>` +
      `<span class="city-cn">${city.name}</span>`;

    /* 数量：数字 Times / 汉字仿宋，同字号 */
    cityCount.innerHTML =
      `<em class="count-num">${list.length}</em>` +
      `<span class="count-unit">张作品</span>`;

    cityGrid.innerHTML = '';
    panelEmpty.style.display = 'none';

    /* 已上架的照片（缩略图加载，点击灯箱看原图；翻页范围 = 当前面板列表） */
    list.forEach((p) => {
      const fig = document.createElement('figure');
      fig.innerHTML = `<img src="${p.thumb || p.src}" alt="${p.title}" loading="lazy" />
                       <figcaption>${p.date} · ${p.location}</figcaption>`;
      fig.addEventListener('click', () => openLightbox(p, list));
      cityGrid.appendChild(fig);
    });

    /* 尚无照片：整行灰色"待上传"占位框 */
    if (list.length === 0) {
      const ph = document.createElement('div');
      ph.className = 'ph-box wide';
      ph.innerHTML = '<span>待上传</span>';
      cityGrid.appendChild(ph);
    }

    cityPanel.classList.add('open');
    document.querySelectorAll('.city-item').forEach((li) => {
      li.classList.toggle('active', !!selectedUid && li.dataset.uid === selectedUid);
    });
    highlightMarkers();
  }

  function deselectCity() {
    selectedName = null;
    selectedUid = null;
    removeCityBoundary();   // 取消选中时同步移除高亮边界层
    cityTitle.textContent = '';
    cityCount.textContent = '';
    cityGrid.innerHTML = '';
    panelEmpty.style.display = '';
    cityPanel.classList.remove('open');
    document.querySelectorAll('.city-item').forEach((li) => li.classList.remove('active'));
    highlightMarkers();
  }

  $('#deselectBtn').addEventListener('click', deselectCity);
  $('#panelCloseBtn').addEventListener('click', deselectCity);   // 手机 bottom sheet ✕

  /* ============================================================
   * 手机端（≤768px）：城市列表抽屉 + bottom sheet
   * ============================================================ */
  const cityListWrap = document.querySelector('.city-list-wrap');
  const drawerMask = $('#drawerMask');
  const menuBtn = $('#menuBtn');
  const sheetHandle = $('#sheetHandle');
  const isMobile = () => window.matchMedia('(max-width: 768px)').matches;
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function openDrawer() {
    cityListWrap.classList.add('drawer-open');
    drawerMask.classList.add('show');
  }
  function closeDrawer() {
    cityListWrap.classList.remove('drawer-open');
    drawerMask.classList.remove('show');
  }
  menuBtn.addEventListener('click', openDrawer);
  drawerMask.addEventListener('click', closeDrawer);

  /* bottom sheet：把手上下拖动，下拉超过 90px 松手关闭 */
  let sheetY0 = null;
  let sheetDy = 0;
  sheetHandle.addEventListener('touchstart', (e) => {
    sheetY0 = e.touches[0].clientY;
    sheetDy = 0;
    cityPanel.classList.add('no-trans');
  }, { passive: true });
  sheetHandle.addEventListener('touchmove', (e) => {
    if (sheetY0 === null) return;
    sheetDy = e.touches[0].clientY - sheetY0;
    if (sheetDy > 0) cityPanel.style.transform = `translateY(${sheetDy}px)`;
  }, { passive: true });
  sheetHandle.addEventListener('touchend', () => {
    cityPanel.classList.remove('no-trans');
    cityPanel.style.transform = '';
    if (sheetDy > 90) deselectCity();
    sheetY0 = null;
    sheetDy = 0;
  });

  /* 地图初始化（脚本为阻塞加载，此处 DOM 与 AMap 均已就绪） */
  initMap();

  /* ============================================================
   * 视图二：胶片长卷（照片上架后自动生成）
   * ============================================================ */
  const filmTrack = $('#filmTrack');
  const filmScroll = $('#filmScroll');
  const filmYearsNav = $('#filmYears');
  const filmProgress = $('#filmProgress');
  const filmHint = document.querySelector('.film-hint');

  /* 按日期排序后按年份分组 */
  const sorted = [...PHOTOS].sort((a, b) => a.date.localeCompare(b.date));
  const byYear = {};
  sorted.forEach((p) => {
    const y = p.date.slice(0, 4);
    (byYear[y] = byYear[y] || []).push(p);
  });

  const years = Object.keys(byYear).sort();
  const groupMap = {};   // 年份 -> DOM 分组（用于导航跳转）

  /* 电影字幕卡：纯黑底，白色衬线字 */
  function buildTitleCard(year) {
    const card = document.createElement('div');
    card.className = 'title-card';
    card.innerHTML = `
      <p class="tc-year">${year}</p>
      <p class="tc-text">${YEAR_NOTES[year] || ''}</p>
    `;
    return card;
  }

  if (years.length === 0) {
    /* 尚无照片：显示空状态 */
    filmTrack.innerHTML = '<p class="film-empty">胶片等待第一卷底片 · 照片上架后自动生成长卷</p>';
    filmYearsNav.style.display = 'none';
    filmHint.style.display = 'none';
    filmProgress.parentElement.style.display = 'none';
  } else {
    years.forEach((year, idx) => {
      const group = document.createElement('div');
      group.className = 'year-group';
      group.dataset.year = year;
      groupMap[year] = group;

      const label = document.createElement('h3');
      label.className = 'year-label' + (year === CURRENT_YEAR ? ' current' : '');
      label.textContent = year;
      group.appendChild(label);

      /* 大年份下方的斜体引言 */
      const intro = document.createElement('p');
      intro.className = 'year-intro';
      intro.textContent = YEAR_INTROS[year] || '';
      group.appendChild(intro);

      const strip = document.createElement('div');
      strip.className = 'film-strip';

      /* 每个年份段落开头插入字幕卡 */
      strip.appendChild(buildTitleCard(year));

      byYear[year].forEach((p) => {
        const frame = document.createElement('div');
        frame.className = 'frame';
        frame.innerHTML = `
          <div class="frame-img">
            <img src="${p.thumb || p.src}" alt="${p.title}" loading="lazy" draggable="false" />
            <div class="frame-overlay">
              <strong>${p.title}</strong>
              <span>${p.note || ''}</span>
            </div>
          </div>
          <div class="frame-meta">
            <div class="frame-date">${p.date}</div>
            <div class="frame-loc">${p.location}</div>
          </div>
        `;
        frame.addEventListener('click', () => {
          if (dragMoved) return;             // 拖动结束时不触发点击
          openLightbox(p, byYear[year]);     // 翻页范围 = 该年份段落内的照片
        });
        strip.appendChild(frame);
      });

      group.appendChild(strip);
      filmTrack.appendChild(group);
    });

    /* 年份导航：点击平滑滚动到对应年份 */
    years.forEach((year, idx) => {
      if (idx > 0) {
        const sep = document.createElement('span');
        sep.className = 'year-sep';
        sep.textContent = '·';
        filmYearsNav.appendChild(sep);
      }
      const btn = document.createElement('button');
      btn.className = 'year-nav-btn';
      btn.textContent = year;
      btn.dataset.year = year;
      btn.addEventListener('click', () => {
        const g = groupMap[year];
        filmScroll.scrollTo({ left: g.offsetLeft - 30, behavior: 'smooth' });
      });
      filmYearsNav.appendChild(btn);
    });
  }

  /* ---- 滚动：滑块位置/宽度（可见占比） + 当前年份高亮 ---- */
  function onFilmScroll() {
    const max = filmScroll.scrollWidth - filmScroll.clientWidth;
    const visRatio = filmScroll.scrollWidth > 0
      ? Math.min(1, filmScroll.clientWidth / filmScroll.scrollWidth) : 1;
    const trackW = filmProgress.parentElement.clientWidth;
    /* 视觉增益 2.5×：纯比例算出的滑块太短难抓，明显拉长（上限半条轨道） */
    const barW = Math.min(trackW * 0.5, Math.max(160, trackW * visRatio * 2.5));
    const pos = max > 0 ? filmScroll.scrollLeft / max : 0;
    filmProgress.style.width = `${barW}px`;
    filmProgress.style.left = `${(trackW - barW) * pos}px`;

    if (years.length === 0) return;
    let cur = years[0];
    years.forEach((y) => {
      if (groupMap[y].offsetLeft <= filmScroll.scrollLeft + 120) cur = y;
    });
    filmYearsNav.querySelectorAll('.year-nav-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.year === cur);
    });
  }

  filmScroll.addEventListener('scroll', onFilmScroll, { passive: true });
  onFilmScroll();

  /* ---- 鼠标拖动 + 滚轮横向滚动 ---- */
  let isDown = false, startX = 0, startScroll = 0, dragMoved = false;

  filmScroll.addEventListener('mousedown', (e) => {
    isDown = true;
    dragMoved = false;
    startX = e.pageX;
    startScroll = filmScroll.scrollLeft;
    filmScroll.classList.add('dragging');
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    const dx = e.pageX - startX;
    if (Math.abs(dx) > 6) dragMoved = true;
    filmScroll.scrollLeft = startScroll - dx;
  });

  window.addEventListener('mouseup', () => {
    isDown = false;
    filmScroll.classList.remove('dragging');
    setTimeout(() => { dragMoved = false; }, 0);
  });

  filmScroll.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      filmScroll.scrollLeft += e.deltaY;
    }
  }, { passive: false });

  /* ---- 拖动滑块 → 胶片同步滚动（记录按下时偏移，全程同一条映射公式，无跳变） ---- */
  let barDown = false, barStartX = 0, barStartLeft = 0;

  filmProgress.addEventListener('mousedown', (e) => {
    barDown = true;
    barStartX = e.clientX;
    barStartLeft = parseFloat(filmProgress.style.left) || 0;
    filmProgress.classList.add('dragging');
    e.preventDefault();
  });

  window.addEventListener('mousemove', (e) => {
    if (!barDown) return;
    const trackW = filmProgress.parentElement.clientWidth;
    const barW = filmProgress.offsetWidth;
    const max = filmScroll.scrollWidth - filmScroll.clientWidth;
    const newLeft = Math.min(trackW - barW, Math.max(0, barStartLeft + (e.clientX - barStartX)));
    filmProgress.style.left = `${newLeft}px`;
    filmScroll.scrollLeft = max > 0 && trackW > barW ? (newLeft / (trackW - barW)) * max : 0;
  });

  window.addEventListener('mouseup', () => {
    if (!barDown) return;
    barDown = false;
    filmProgress.classList.remove('dragging');
  });

  /* 窗口尺寸变化：滑块宽度/位置重算 */
  window.addEventListener('resize', onFilmScroll);
  /* 缩略图懒加载撑开胶片后，scrollWidth 变化也重算（否则滑块停在旧长度） */
  if (window.ResizeObserver) {
    new ResizeObserver(() => onFilmScroll()).observe(filmTrack);
  }

  /* 触摸滑动由原生 overflow-x 滚动支持 */

  /* ============================================================
   * 全屏灯箱（两个视图共用）
   * ============================================================ */
  const lightbox = $('#lightbox');
  const lightboxImg = $('#lightboxImg');
  const lightboxCap = $('#lightboxCap');
  const lightboxPage = $('#lightboxPage');
  const lightboxPrev = $('#lightboxPrev');
  const lightboxNext = $('#lightboxNext');
  const lightboxClose = $('#lightboxClose');

  /* 灯箱：翻页上下文（打开时的照片列表 + 当前索引）
   * 显示策略：先秒显缩略图（已在缓存中），原图后台加载完成后自动替换为高清
   * token 防止快速切换照片时旧图的 onload 覆盖新图 */
  let lightboxToken = 0;
  let lbList = [];
  let lbIndex = -1;

  function isOpen() { return lightbox.classList.contains('open'); }

  function showPhoto(idx) {
    const p = lbList[idx];
    if (!p) return;
    const token = ++lightboxToken;
    lbIndex = idx;

    /* 底部说明：标题 + 年份 · 省份 · 城市 + 页码（同步更新） */
    const meta = CITIES.find((c) => c.name === p.city) || {};
    const year = (p.date || '').slice(0, 4);
    const place = [year, meta.province, meta.cityFull || p.city].filter(Boolean).join(' · ');
    lightboxCap.innerHTML = `<strong>${p.title}</strong>${place}`;
    lightboxPage.textContent = `${idx + 1} / ${lbList.length}`;

    /* 边界态：第一张左箭头灰、最后一张右箭头灰 */
    lightboxPrev.classList.toggle('disabled', idx <= 0);
    lightboxNext.classList.toggle('disabled', idx >= lbList.length - 1);

    /* 0.3s 淡入：先缩略图（通常已缓存，立即 onload），原图就绪后无缝替换 */
    lightboxImg.classList.add('fading', 'loading');
    lightboxImg.alt = p.title;
    lightboxImg.onload = () => {
      if (token !== lightboxToken) return;
      requestAnimationFrame(() => lightboxImg.classList.remove('fading'));
    };
    const thumbSrc = p.thumb || p.src;
    if (lightboxImg.src === thumbSrc) {
      /* 同一张重复打开：src 未变不会触发 onload，直接淡入 */
      lightboxImg.classList.remove('fading');
    } else {
      lightboxImg.src = thumbSrc;
    }

    const full = new Image();
    full.onload = () => {
      if (token !== lightboxToken) return;   // 期间已切换/关闭
      if (lightboxImg.src !== p.src) lightboxImg.src = p.src;
      lightboxImg.classList.remove('loading');
    };
    full.onerror = () => {
      if (token !== lightboxToken) return;
      lightboxImg.classList.remove('loading');   // 原图加载失败：保留缩略图放大版
    };
    /* 弱网兜底：原图 15s 仍未就绪就先解除占位态（缩略图已是当前最佳显示），
     * 之后原图到货仍会无缝替换 */
    setTimeout(() => {
      if (token === lightboxToken) lightboxImg.classList.remove('loading');
    }, 15000);
    full.src = p.src;
  }

  /* opts.tilt：放大视图内启用 hover 3D 倾斜视差（器材页用） */
  function openLightbox(p, list, opts) {
    lbList = (Array.isArray(list) && list.length) ? list.slice() : [p];
    lbIndex = Math.max(0, lbList.indexOf(p));
    lightbox.classList.toggle('tilt', !!(opts && opts.tilt));
    lightboxImg.style.transform = '';
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    showPhoto(lbIndex);
  }

  function prevPhoto() { if (lbIndex > 0) showPhoto(lbIndex - 1); }
  function nextPhoto() { if (lbIndex < lbList.length - 1) showPhoto(lbIndex + 1); }

  function closeLightbox() {
    lightboxToken++;          // 使挂起的原图 onload 失效
    lbIndex = -1;
    lightbox.classList.remove('open', 'tilt');
    lightboxImg.style.transform = '';
    lightbox.setAttribute('aria-hidden', 'true');
  }

  /* 箭头 / 关闭按钮 */
  lightboxPrev.addEventListener('click', prevPhoto);
  lightboxNext.addEventListener('click', nextPhoto);
  lightboxClose.addEventListener('click', closeLightbox);

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  /* 滚轮翻页：上滚上一张 / 下滚下一张，300ms 节流，边界不再跳 */
  let lbWheelLock = false;
  lightbox.addEventListener('wheel', (e) => {
    if (!isOpen()) return;
    e.preventDefault();
    if (lbWheelLock) return;
    lbWheelLock = true;
    setTimeout(() => { lbWheelLock = false; }, 300);
    if (e.deltaY > 0) nextPhoto();
    else if (e.deltaY < 0) prevPhoto();
  }, { passive: false });

  /* 键盘：← → 翻页；ESC 关闭全屏（灯箱未开时才取消城市选中） */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (isOpen()) closeLightbox();
      else deselectCity();
      return;
    }
    if (!isOpen()) return;
    if (e.key === 'ArrowLeft') prevPhoto();
    else if (e.key === 'ArrowRight') nextPhoto();
  });

  /* tilt 模式（器材放大）：鼠标位置驱动图片 rotateX/rotateY（±6°），离开 0.4s 归位
   * 触屏设备（无 hover）自动禁用 */
  lightbox.addEventListener('mousemove', (e) => {
    if (!canHover) return;
    if (!lightbox.classList.contains('tilt')) return;
    const r = lightboxImg.getBoundingClientRect();
    if (!r.width) return;
    /* 鼠标在图片附近（外扩 60px）才倾斜，否则归位 */
    const near = e.clientX > r.left - 60 && e.clientX < r.right + 60 &&
                 e.clientY > r.top - 60 && e.clientY < r.bottom + 60;
    if (!near) {
      lightboxImg.style.transition = 'transform .4s ease';
      lightboxImg.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg)';
      return;
    }
    const px = (e.clientX - r.left) / r.width - 0.5;     // -0.5 ~ 0.5
    const py = (e.clientY - r.top) / r.height - 0.5;
    lightboxImg.style.transition = 'transform .12s ease';
    lightboxImg.style.transform =
      `perspective(800px) rotateX(${(-py * 12).toFixed(2)}deg) rotateY(${(px * 12).toFixed(2)}deg)`;
  });
  lightbox.addEventListener('mouseleave', () => {
    if (!lightbox.classList.contains('tilt')) return;
    lightboxImg.style.transition = 'transform .4s ease';
    lightboxImg.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg)';
  });

  /* 手机端：左右滑动切换照片（>50px 判定为一次有效滑动） */
  let lbTouchX = null;
  lightbox.addEventListener('touchstart', (e) => {
    lbTouchX = e.touches[0].clientX;
  }, { passive: true });
  lightbox.addEventListener('touchend', (e) => {
    if (lbTouchX === null) return;
    const dx = e.changedTouches[0].clientX - lbTouchX;
    lbTouchX = null;
    if (Math.abs(dx) < 50) return;
    if (dx < 0) nextPhoto();
    else prevPhoto();
  }, { passive: true });

  /* ============================================================
   * 时间视图背景音乐 + LRC 歌词滚动
   *   audio 循环播放；切到空间视图不中断（无任何视图联动暂停逻辑）
   * ============================================================ */
  (function initBGM() {
    const audio = $('#bgm');
    const btn = $('#musicBtn');
    const hintEl = $('#lyricsHint');
    const boxEl = $('#lyricsBox');
    const viewportEl = boxEl;                 // 歌词滚动视口
    const listEl = $('#lyricList');           // 完整歌词列表

    let lines = [];          // [{ t, text }] 按时间升序
    let curIdx = -1;
    let hasStarted = false;  // 是否播放过（决定提示行与歌词区的切换）
    let lastWheelAt = 0;     // 最近一次手动滚轮时间：4 秒内暂停自动跟随

    /* 解析 LRC：[mm:ss.xx]（支持多时间戳行），忽略元数据，应用 [offset:] 偏移 */
    fetch('assets/travel-meaning.lrc')
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(r.status))))
      .then((raw) => {
        const om = raw.match(/\[offset:\s*(-?\d+)\]/i);
        const offsetMs = om ? parseInt(om[1], 10) : 0;

        const out = [];
        raw.split(/\r?\n/).forEach((line) => {
          const text = line.replace(/\[[^\]]*\]/g, '').trim();
          const stamps = line.match(/\[(\d+):(\d+)(?:[.:](\d+))?\]/g);
          if (!stamps || !text) return;
          stamps.forEach((s) => {
            const m = s.match(/\[(\d+):(\d+)(?:[.:](\d+))?\]/);
            const fracRaw = m[3] || '0';
            const t = parseInt(m[1], 10) * 60 + parseInt(m[2], 10)
              + parseInt(fracRaw, 10) / Math.pow(10, fracRaw.length)
              - offsetMs / 1000;
            out.push({ t, text });
          });
        });
        lines = out.sort((a, b) => a.t - b.t);
        buildList();
        syncLyrics();
      })
      .catch(() => { /* LRC 加载失败：歌词区保持提示行 */ });

    /* 构建完整歌词列表：每行可点击跳转 */
    function buildList() {
      listEl.innerHTML = '';
      lines.forEach((ln, i) => {
        const p = document.createElement('p');
        p.className = 'lyric';
        p.dataset.idx = String(i);
        p.textContent = ln.text;
        p.addEventListener('click', () => seekToLine(i));
        listEl.appendChild(p);
      });
    }

    /* 高亮第 i 行；未被用户手动滚动接管时，平滑滚到视口中心 */
    function markActive(i, force) {
      const items = listEl.children;
      Array.prototype.forEach.call(items, (el, k) => el.classList.toggle('active', k === i));
      curIdx = i;
      if (!items.length || i < 0) return;
      if (force || Date.now() - lastWheelAt > 4000) {
        const el = items[i];
        const top = el.offsetTop - viewportEl.clientHeight / 2 + el.offsetHeight / 2;
        viewportEl.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      }
    }

    /* 点击歌词行：严格 seek 到该句时间戳（元数据未就绪时挂 loadedmetadata 再设），
     * 并立即高亮该行 —— 修复“点击后从头播放” */
    function seekToLine(i) {
      if (!lines.length || i < 0 || i >= lines.length) return;
      const t = Math.max(0, lines[i].t);
      const applySeek = () => { try { audio.currentTime = t; } catch (err) { /* ignore */ } };
      if (audio.duration > 0) {
        applySeek();
      } else {
        audio.addEventListener('loadedmetadata', applySeek, { once: true });
      }

      if (!hasStarted) {
        hasStarted = true;
        hintEl.hidden = true;
        boxEl.hidden = false;
      }
      const pr = audio.play();
      if (pr && pr.catch) pr.catch(() => {});
      lastWheelAt = 0;          // 点击后立即恢复自动跟随
      markActive(i, true);
    }

    /* 用户用滚轮翻歌词：4 秒内不打断（当前行高亮照常更新，但不再自动滚回） */
    viewportEl.addEventListener('wheel', () => { lastWheelAt = Date.now(); }, { passive: true });

    function syncLyrics() {
      if (!lines.length || !hasStarted) return;
      const t = audio.currentTime + 0.05;   // 轻微提前，视觉上更贴合演唱
      let idx = -1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].t <= t) idx = i; else break;
      }
      if (idx === curIdx) return;
      markActive(idx, false);
    }

    /* 播放 / 暂停切换 */
    btn.addEventListener('click', () => {
      if (audio.paused) {
        audio.play().catch(() => {});
      } else {
        audio.pause();
      }
    });

    audio.addEventListener('play', () => {
      btn.classList.add('playing');
      btn.setAttribute('aria-label', '暂停 旅行的意义');
      if (!hasStarted) {
        hasStarted = true;
        hintEl.hidden = true;
        boxEl.hidden = false;
      }
      syncLyrics();
    });

    audio.addEventListener('pause', () => {
      btn.classList.remove('playing');
      btn.setAttribute('aria-label', '播放 旅行的意义');
    });

    audio.addEventListener('seeked', syncLyrics);
    audio.addEventListener('timeupdate', syncLyrics);

    /* 弱网缓冲提示：mp3 较大，慢网络下点播放后有一段静默缓冲期，
     * 用歌手行临时显示「缓冲中…」，可播放后恢复 */
    const artistEl = document.querySelector('.music-artist');
    audio.addEventListener('waiting', () => { artistEl.textContent = '缓冲中…'; });
    audio.addEventListener('stalled', () => { artistEl.textContent = '缓冲中…'; });
    const clearBuf = () => { artistEl.textContent = '陈绮贞'; };
    audio.addEventListener('canplay', clearBuf);
    audio.addEventListener('playing', clearBuf);
  })();

  /* ============================================================
   * 视图三：器材 —— 透明卡片 + hover 3D 倾斜视差
   * ============================================================ */
  (function initEquipment() {
    const EQUIPMENT = {
      bodies: [
        { name: 'Canon EOS R100',        note: '2024·入门微单',          img: 'assets/equipment/png/r100.png' },
        { name: 'Sony A7C II',           note: '2026 · 全画幅主力',      img: 'assets/equipment/png/a7c2.png', featured: true },
        { name: 'Canon Kiss 3',          note: '2025 · 胶片单反',        img: 'assets/equipment/png/kiss3.png' },
        { name: 'Nikon Coolpix S2500',   note: 'CCD 卡片机 · 复古扫街',  img: 'assets/equipment/png/nikon-s2500.png' },
      ],
      lenses: [
        { name: 'Canon RF-S 18-45 套头',     note: '日常挂机',             img: 'assets/equipment/png/rf-s18-45.png' },
        { name: 'Canon EF 28-80',            note: '胶片挂机头',           img: 'assets/equipment/png/ef28-80.png' },
        { name: 'Yongnuo YN50mm F1.8 II',    note: 'EF 小痰盂 · 副厂定焦', img: 'assets/equipment/png/yn50-ii.png' },
        { name: 'Sigma 28-70mm F2.8',        note: '主力挂机 · A7C II',    img: 'assets/equipment/png/sigma28-70.png', featured: true },
      ],
    };

    function buildCard(item, isLens) {
      const card = document.createElement('div');
      card.className = 'equip-card' + (isLens ? ' lens' : '') + (item.featured ? ' featured' : '');
      card.innerHTML = `
        <img src="${item.img}" alt="${item.name}" loading="lazy" draggable="false" />
        <p class="eq-name">${item.name}</p>
        <p class="eq-note">${item.note}</p>
      `;

      /* 点击放大：复用全屏灯箱（tilt 模式，单张） */
      card.style.cursor = 'zoom-in';
      card.addEventListener('click', () => {
        const item0 = {
          src: item.img,
          thumb: item.img,
          title: item.name,
          date: '',
          city: item.name,
        };
        openLightbox(item0, [item0], { tilt: true });
      });

      /* hover 3D 倾斜视差：±6°，跟随鼠标位置；离开 0.4s 平滑归位
       * 触屏设备（无 hover）自动禁用 */
      if (!canHover) return;   // 手机端：无 hover，跳过倾斜绑定

      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;    // -0.5 ~ 0.5
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transition = 'transform .12s ease';
        card.style.transform =
          `perspective(800px) rotateX(${(-py * 12).toFixed(2)}deg) rotateY(${(px * 12).toFixed(2)}deg)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transition = 'transform .4s ease';
        card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg)';
      });

      return card;
    }

    const bodiesEl = $('#equipBodies');
    const lensesEl = $('#equipLenses');
    EQUIPMENT.bodies.forEach((item) => bodiesEl.appendChild(buildCard(item, false)));
    EQUIPMENT.lenses.forEach((item) => lensesEl.appendChild(buildCard(item, true)));

    /* 底部统计随数据自动计算 */
    $('#equipStats').textContent =
      `${EQUIPMENT.bodies.length} 机身 · ${EQUIPMENT.lenses.length} 镜头`;
  })();
})();
