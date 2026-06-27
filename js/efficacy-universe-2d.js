/**
 * 효능 2D 그래프 (Top view 전용)
 * 3D와 별개의 독립적인 2D 시각화
 */
(function () {
  'use strict';

  var BODY_COLORS = (typeof window !== 'undefined' && window.EFFICACY_BODY_CATEGORY_COLORS)
    ? window.EFFICACY_BODY_CATEGORY_COLORS
    : { '기타': 0xcacaca, '전신·기력': 0xb8d0b8 };

  var CATEGORY_CLUSTERS = (typeof window !== 'undefined' && window.EFFICACY_CATEGORY_CLUSTERS)
    ? window.EFFICACY_CATEGORY_CLUSTERS
    : { '기타': 7 };

  function toRgb(num) {
    if (typeof num !== 'number') num = 0x7aaa7a;
    var r = (num >> 16) & 255;
    var g = (num >> 8) & 255;
    var b = num & 255;
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  var SUB_CATEGORY_COLORS = {
    곡부: 0x9ad49a, 과부: 0xb8a8d4, 목부: 0xd4b89a, 채부: 0x9ad4b8, 초부: 0xc8a88a,
    어부: 0xd49a9a, '금부(禽)': 0xb8b8d4, '수부(獸)': 0xd4b89a, 인부: 0xa0c4d4, 충부: 0xc89ab0,
    석부: 0xb8a8a8, 옥부: 0xa0b8d4, '금부(金)': 0xc8b89a,
    '수부(水)': 0x9ab8d4, 토부: 0xb8c8a0
  };

  var SPLIT_DURATION = 400;

  function segsCross(x1, y1, x2, y2, x3, y3, x4, y4) {
    var d = (x2 - x1) * (y4 - y3) - (y2 - y1) * (x4 - x3);
    if (!d) return false;
    var t = ((x3 - x1) * (y4 - y3) - (y3 - y1) * (x4 - x3)) / d;
    var u = ((x3 - x1) * (y2 - y1) - (y3 - y1) * (x2 - x1)) / d;
    return t > 0 && t < 1 && u > 0 && u < 1;
  }

  function escapeRegExp(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /** 괄호 앞 표기(대표 한글명)만 소문자화 */
  function primaryKoreanName(name) {
    if (name == null || typeof name !== 'string') return '';
    var m = /^([^(]+)/.exec(name.trim());
    return (m ? m[1] : name.trim()).trim().toLowerCase();
  }

  function fullKoreanNameLower(name) {
    return (name == null || typeof name !== 'string') ? '' : name.trim().toLowerCase();
  }

  /**
   * 약재 한글명 vs 검색어 — 높을수록 더 잘 맞음. null 이면 불일치.
   * 1) 대표명(괄호 앞) 완전일치 → 2) 전체 문자열 완전일치 → 3) 단어 경계 일치 → 4) 단순 부분일치(짧은 이름 우선)
   */
  function herbMatchScore(queryLower, koreanName) {
    if (!queryLower || koreanName == null || typeof koreanName !== 'string') return null;
    var full = fullKoreanNameLower(koreanName);
    if (full.indexOf(queryLower) < 0) return null;

    var primary = primaryKoreanName(koreanName);
    if (primary === queryLower) {
      return 1000000 - full.length;
    }
    if (full === queryLower) {
      return 990000 - full.length;
    }
    var reWord = new RegExp('(^|[\\s\\(])' + escapeRegExp(queryLower) + '(?=[\\s\\)\\?.,;:!/]|$)');
    if (reWord.test(koreanName)) {
      return 800000 - full.length;
    }
    return 600000 - full.length;
  }

  /** 효능 태그명 매칭 점수 (약재보다 상한을 낮춰, 동일 검색에서 대표 약재명이 우선) */
  function efficacyTagMatchScore(queryLower, tag) {
    if (!queryLower || tag == null || typeof tag !== 'string') return null;
    var t = tag.trim().toLowerCase();
    if (t.indexOf(queryLower) < 0) return null;
    if (t === queryLower) {
      return 500000 - t.length;
    }
    var reWord = new RegExp('(^|[\\s])' + escapeRegExp(queryLower) + '(?=[\\s.,;:!/]|$)');
    if (reWord.test(t)) {
      return 400000 - t.length;
    }
    return 250000 - t.length;
  }

  function categoryKeyMatchScore(queryLower, catKey) {
    if (!queryLower || catKey == null || typeof catKey !== 'string') return null;
    var k = catKey.trim().toLowerCase();
    if (k.indexOf(queryLower) < 0) return null;
    if (k === queryLower) return 120000 - k.length;
    return 80000 - k.length;
  }

  function buildEfficacy2DGraph(container, universeData, onSubCategoryClick, onBackTo3D, onDrillDownChange) {
    if (!container || !window.d3) return null;
    var d3 = window.d3;
    var categories = universeData.categories || [];
    var width = container.clientWidth || 800;
    var height = container.clientHeight || 600;
    var drillDownEfficacy = null;
    var drillDownHerb = null;
    var activeSubNode = null;
    var CENTER_CLUSTER = 2;

    function isMobile() { return window.innerWidth < 768; }

    var clusterCenters = {};
    var clusterCount = 8;
    var subClusterRadius = 95;
    function updateClusterCenters(w, h) {
      var cx = w / 2;
      var cy = h / 2;
      var r = Math.min(w, h) * 0.48;
      clusterCenters[CENTER_CLUSTER] = { x: cx, y: cy };
      var others = [0, 1, 3, 4, 5, 6, 7];
      others.forEach(function (c, i) {
        var angle = (i / others.length) * Math.PI * 2 - Math.PI / 2;
        clusterCenters[c] = { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
      });
    }
    updateClusterCenters(width, height);

    function resolveLinks(nodes, links) {
      var byId = {};
      nodes.forEach(function (n) { if (n && n.id != null) byId[n.id] = n; });
      return links.filter(function (lnk) {
        var src = (typeof lnk.source === 'string') ? byId[lnk.source] : lnk.source;
        var tgt = (typeof lnk.target === 'string') ? byId[lnk.target] : lnk.target;
        if (src && tgt) { lnk.source = src; lnk.target = tgt; return true; }
        return false;
      });
    }

    function buildNodesAndLinks() {
      var nodes = [];
      var links = [];
      var nodeId = 0;

      if (drillDownHerb) {
        var herb = drillDownHerb;
        var herbCenterId = 'herbcenter_' + (nodeId++);
        var herbName = (typeof herb.korean_name === 'string')
          ? herb.korean_name.replace(/\s*\(.*$/, '').trim()
          : (herb.korean_name || herb.id || '');
        nodes.push({
          id: herbCenterId, name: herbName, type: 'herb',
          herb: herb, color: 0xffffff, isHerbCenter: true,
          x: width / 2, y: height / 2, fx: width / 2, fy: height / 2
        });
        var herbEfficacies = [];
        categories.forEach(function (cat) {
          (cat.efficacies || []).forEach(function (eff) {
            var found = (eff.groups || []).some(function (grp) {
              return (grp.herbs || []).some(function (h) {
                var hObj = typeof h === 'object' ? h : { id: h };
                return hObj.id === herb.id;
              });
            });
            if (found) herbEfficacies.push({ tag: eff.tag, groups: eff.groups, catKey: cat.key });
          });
        });
        herbEfficacies.forEach(function (eff, effIdx) {
          var effId = 'eff_' + (nodeId++);
          var effAngle = (effIdx / Math.max(herbEfficacies.length, 1)) * Math.PI * 2 - Math.PI / 2;
          var effDist = 220;
          var effColor = BODY_COLORS[eff.catKey] || 0x7aaa7a;
          nodes.push({
            id: effId, name: eff.tag, type: 'efficacy',
            groups: eff.groups || [], color: effColor,
            category: eff.catKey,
            clusterX: width / 2 + Math.cos(effAngle) * effDist,
            clusterY: height / 2 + Math.sin(effAngle) * effDist
          });
          links.push({ source: herbCenterId, target: effId });
        });
        return { nodes: nodes, links: links };
      }

      if (drillDownEfficacy) {
        var eff = drillDownEfficacy;
        var effId = 'eff_' + (nodeId++);
        var effNode = {
          id: effId, name: eff.name, type: 'efficacy', groups: eff.groups || [],
          color: eff.color, x: width / 2, y: height / 2, fx: width / 2, fy: height / 2
        };
        nodes.push(effNode);
        var groups = eff.groups || [];
        groups.forEach(function (grp, grpIdx) {
          var subAngle = (grpIdx / Math.max(groups.length, 1)) * Math.PI * 2 - Math.PI / 2;
          var subDist = 320;
          var subId = 'sub_' + (nodeId++);
          var subColor = SUB_CATEGORY_COLORS[grp.category] || 0x8aaa8a;
          var subNode = {
            id: subId,
            name: (grp.label || grp.category) + ' (' + (grp.herbs ? grp.herbs.length : 0) + ')',
            type: 'subCategory', category: grp.category, herbs: grp.herbs || [],
            efficacyTag: eff.name, color: subColor,
            clusterX: width / 2 + Math.cos(subAngle) * subDist,
            clusterY: height / 2 + Math.sin(subAngle) * subDist
          };
          nodes.push(subNode);
          links.push({ source: effId, target: subId });
          var herbs = grp.herbs || [];
          var maxHerbs = Math.max(herbs.length, 1);
          var herbDist = 110 + Math.min(herbs.length * 8, 140);
          herbs.forEach(function (h, hIdx) {
            var rawName = (typeof h === 'object' && (h.korean_name || h.id)) ? (h.korean_name || h.id) : String(h);
            var herbName = (typeof rawName === 'string') ? rawName.replace(/\s*\(.*$/, '').trim() : rawName;
            var herbId = 'herb_' + (nodeId++);
            var herbAngle = (hIdx / maxHerbs) * Math.PI * 2 - Math.PI / 2;
            var subCx = width / 2 + Math.cos(subAngle) * subDist;
            var subCy = height / 2 + Math.sin(subAngle) * subDist;
            nodes.push({
              id: herbId, name: herbName, type: 'herb',
              herb: typeof h === 'object' ? h : { id: h, korean_name: h },
              subCategory: grp.category, efficacyTag: eff.name, color: subColor,
              clusterX: subCx + Math.cos(herbAngle) * herbDist,
              clusterY: subCy + Math.sin(herbAngle) * herbDist,
              siblingCount: herbs.length
            });
            links.push({ source: subId, target: herbId });
          });
        });
      } else {
        /* Bug 1: CATEGORY_CLUSTERS에 없는 카테고리는 0~7 순환 자동 배정 */
        var autoClusterIdx = 0;
        var clusterAssignment = {};
        categories.forEach(function (cat) {
          if (CATEGORY_CLUSTERS[cat.key] != null) {
            clusterAssignment[cat.key] = CATEGORY_CLUSTERS[cat.key];
          } else {
            clusterAssignment[cat.key] = autoClusterIdx % clusterCount;
            autoClusterIdx++;
          }
        });
        var clusterSubCount = {};
        categories.forEach(function (cat) {
          var cluster = clusterAssignment[cat.key];
          clusterSubCount[cluster] = (clusterSubCount[cluster] || 0) + 1;
        });
        var clusterSubIdx = {};
        categories.forEach(function (cat) {
          var catId = 'cat_' + (nodeId++);
          var cluster = clusterAssignment[cat.key];
          var center = clusterCenters[cluster] || clusterCenters[7];
          if (!clusterSubIdx[cluster]) clusterSubIdx[cluster] = 0;
          var subIdx = clusterSubIdx[cluster]++;
          var subTotal = clusterSubCount[cluster] || 1;
          var subAngle = (subTotal > 1) ? (subIdx / subTotal) * Math.PI * 2 - Math.PI / 2 : 0;
          var cx = center.x + (subTotal > 1 ? Math.cos(subAngle) * subClusterRadius : 0);
          var cy = center.y + (subTotal > 1 ? Math.sin(subAngle) * subClusterRadius : 0);
          var catNode = {
            id: catId, name: cat.key, type: 'category',
            color: BODY_COLORS[cat.key] || 0x7aaa7a,
            cluster: cluster, clusterX: cx, clusterY: cy,
            clusterSubIdx: subIdx, clusterSubTotal: subTotal
          };
          nodes.push(catNode);
          var effCount = (cat.efficacies || []).length;
          (cat.efficacies || []).forEach(function (eff, effIdx) {
            var effId = 'eff_' + (nodeId++);
            var effAngle = (effIdx / Math.max(effCount, 1)) * Math.PI * 2 - Math.PI / 2;
            var effSpread = effCount > 1 ? 60 : 0;
            nodes.push({
              id: effId, name: eff.tag, type: 'efficacy', category: cat.key,
              groups: eff.groups || [], color: catNode.color,
              cluster: catNode.cluster,
              clusterX: catNode.clusterX + Math.cos(effAngle) * effSpread,
              clusterY: catNode.clusterY + Math.sin(effAngle) * effSpread,
              clusterSubIdx: subIdx, clusterSubTotal: subTotal
            });
            links.push({ source: catId, target: effId });
          });
        });
      }
      return { nodes: nodes, links: links };
    }

    function forceCluster() {
      var strength = drillDownEfficacy ? 0.4 : 0.1;
      return function (alpha) {
        nodes.forEach(function (d) {
          if (d.clusterX == null) return;
          d.vx = (d.vx || 0) + (d.clusterX - d.x) * strength * alpha;
          d.vy = (d.vy || 0) + (d.clusterY - d.y) * strength * alpha;
        });
      };
    }

    function forceLinkSpacing() {
      var str = 0.035;
      return function (alpha) {
        var allLinks = links;
        var ls;
        if (drillDownEfficacy || drillDownHerb) {
          /* drilldown: only check center→subCategory edges (small N, cheap) */
          ls = [];
          for (var k = 0; k < allLinks.length; k++) {
            var tgt = allLinks[k].target;
            if (tgt && (tgt.type === 'subCategory' || tgt.type === 'efficacy')) ls.push(allLinks[k]);
          }
        } else {
          ls = allLinks;
        }
        var n = ls.length;
        for (var i = 0; i < n - 1; i++) {
          var a = ls[i];
          if (!a.source || !a.target) continue;
          for (var j = i + 1; j < n; j++) {
            var b = ls[j];
            if (!b.source || !b.target) continue;
            if (a.source === b.source || a.source === b.target ||
                a.target === b.source || a.target === b.target) continue;
            if (!segsCross(a.source.x, a.source.y, a.target.x, a.target.y,
                           b.source.x, b.source.y, b.target.x, b.target.y)) continue;
            var ax = (a.source.x + a.target.x) * 0.5;
            var ay = (a.source.y + a.target.y) * 0.5;
            var bx = (b.source.x + b.target.x) * 0.5;
            var by = (b.source.y + b.target.y) * 0.5;
            var dx = ax - bx;
            var dy = ay - by;
            var dist = Math.sqrt(dx * dx + dy * dy) || 1;
            var f = str * alpha / dist;
            if (a.source.fx == null) { a.source.vx += dx * f; a.source.vy += dy * f; }
            if (a.target.fx == null) { a.target.vx += dx * f; a.target.vy += dy * f; }
            if (b.source.fx == null) { b.source.vx -= dx * f; b.source.vy -= dy * f; }
            if (b.target.fx == null) { b.target.vx -= dx * f; b.target.vy -= dy * f; }
          }
        }
      };
    }

    /* Bug 2: enter/update/exit 패턴으로 신규 노드에 circle/text 자식 추가 보장 */
    function joinNodes(newNodes) {
      var sel = node.data(newNodes, function (d) { return d.id; }).join(
        function (enter) {
          var g = enter.append('g');
          g.call(d3.drag().on('start', dragstarted).on('drag', dragged).on('end', dragended));
          g.append('circle');
          g.append('text').attr('dy', '0.35em').attr('text-anchor', 'middle')
            .attr('fill', '#333').attr('pointer-events', 'none');
          return g;
        },
        function (update) { return update; },
        function (exit) { return exit.remove(); }
      );
      node = sel;
      node.attr('cursor', function (d) { return d.type === 'center' ? 'default' : 'pointer'; });
      node.select('circle')
        .attr('r', function (d) {
          if (d.type === 'center') return 0;
          if (d.isHerbCenter) return 35;
          if (d.type === 'category') return 39;
          if (d.type === 'efficacy') return 29;
          if (d.type === 'subCategory') return 25;
          return 19;
        })
        .attr('fill', function (d) { return d.type === 'center' ? 'transparent' : toRgb(d.color || 0); })
        .attr('stroke', function (d) {
          if (d.type === 'center') return 'transparent';
          if (d.isHerbCenter) return '#000';
          return '#fff';
        })
        .attr('stroke-width', function (d) { return d.isHerbCenter ? 2.5 : 1.5; })
        .attr('opacity', 1);
      node.select('text')
        .attr('font-size', function (d) {
          if (d.type === 'center') return 0;
          if (d.isHerbCenter) return 13;
          if (d.type === 'category') return 12;
          if (d.type === 'efficacy') return 11;
          if (d.type === 'subCategory') return 10;
          return 8;
        })
        .attr('fill', function (d) { return d.isHerbCenter ? '#111' : '#333'; })
        .attr('opacity', 1)
        .text(function (d) { return d.name; });
      node.on('click', handleNodeClick);
    }

    /* ── 노드 dimming ────────────────────────────────────────────── */
    /* activeId  : 선택된 subCategory 노드 id
       clickedNodeId : 직접 클릭한 노드 id (약재 클릭 시 herb id, 중분류 직접 클릭 시 activeId와 동일) */
    function applyDimming(activeId, clickedNodeId) {
      if (!node) return;
      var resolvedClickId = clickedNodeId || activeId;
      var activeNode = nodes.find(function (n) { return n.id === activeId; });
      var activeCat = activeNode && activeNode.category;

      /* stroke 대상: 클릭한 노드 + 부모 subCategory + 부모 efficacy(대분류) */
      function needsStroke(d) {
        if (d.id === resolvedClickId) return true;   /* 클릭한 노드(herb or subCategory) */
        if (d.id === activeId) return true;          /* 부모 subCategory */
        if (d.type === 'efficacy') return true;      /* 대분류 중심 노드 */
        return false;
      }

      function isHighlighted(d) {
        if (d.type === 'category') return true;
        if (d.type === 'efficacy') return true;
        if (d.id === activeId) return true;
        if (d.id === resolvedClickId) return true;
        if (d.type === 'herb' && activeCat && d.subCategory === activeCat) return true;
        return false;
      }

      node.select('circle')
        .attr('opacity', function (d) { return isHighlighted(d) ? 1 : 0.4; })
        .attr('stroke', function (d) {
          if (needsStroke(d)) return '#000';
          return d.type === 'center' ? 'transparent' : '#fff';
        })
        .attr('stroke-width', function (d) { return needsStroke(d) ? 2 : 1.5; }) /* 2px로 얇게 */
        .style('filter', 'none')
        .style('box-shadow', 'none');
      node.select('text')
        .attr('opacity', function (d) { return isHighlighted(d) ? 1 : 0.4; });
      link.attr('opacity', function (d) {
        var src = d.source;
        var tgt = d.target;
        var srcId = src && src.id;
        var tgtId = tgt && tgt.id;
        if (srcId === activeId || tgtId === activeId) return 1;
        if (srcId === resolvedClickId || tgtId === resolvedClickId) return 1;
        if (src && activeCat && src.type === 'herb' && src.subCategory === activeCat) return 1;
        if (tgt && activeCat && tgt.type === 'herb' && tgt.subCategory === activeCat) return 1;
        return 0.12;
      });
      /* 선택 노드(+herb) 연결 링크에만 애니메이션 */
      link.classed('link-animated', function (d) {
        var srcId = d.source && d.source.id;
        var tgtId = d.target && d.target.id;
        return srcId === activeId || tgtId === activeId ||
               srcId === resolvedClickId || tgtId === resolvedClickId;
      });
    }

    function clearDimming() {
      if (!node) return;
      node.select('circle')
        .attr('opacity', 1)
        .attr('stroke', function (d) { return d.type === 'center' ? 'transparent' : '#fff'; })
        .attr('stroke-width', 1.5)
        .style('filter', null)
        .style('box-shadow', null);
      node.select('text').attr('opacity', 1);
      link.attr('opacity', 1)
          .classed('link-animated', false); /* 애니메이션 클래스 제거 */
    }

    /* ── 레이아웃 재계산 ──────────────────────────────────────────── */
    function onLayoutChanged(newWidth, newHeight, lowAlpha) {
      width = newWidth;
      height = newHeight;
      svg.attr('width', newWidth).attr('height', newHeight)
        .attr('viewBox', [0, 0, newWidth, newHeight]);
      simulation.force('center', d3.forceCenter(newWidth / 2, newHeight / 2));
      updateClusterCenters(newWidth, newHeight);
      /* 버그1: 닫을 때는 alpha를 낮게 설정해 노드 튕김 방지 */
      simulation.alpha(lowAlpha ? 0.08 : 0.3).restart();
    }

    /* ── DOM 구조 ─────────────────────────────────────────────────── */
    container.innerHTML = '';
    container.style.position = 'relative';
    container.style.height = '100%';   /* inset:0 이 position:relative로 덮이지 않도록 명시 */
    container.style.touchAction = 'none';

    var splitContainer = document.createElement('div');
    splitContainer.className = 'efficacy-split-container';
    container.appendChild(splitContainer);

    var graphPane = document.createElement('div');
    graphPane.className = 'efficacy-graph-pane';
    splitContainer.appendChild(graphPane);

    var herbPane = document.createElement('div');
    herbPane.className = 'efficacy-herb-pane';
    splitContainer.appendChild(herbPane);

    /* ── 버튼 (그래프 pane 내부 좌측/우측) ──────────────────────── */
    var backBtn2d = document.createElement('button');
    backBtn2d.type = 'button';
    backBtn2d.className = 'efficacy-2d-back-btn';
    backBtn2d.setAttribute('aria-label', '상위로 돌아가기');
    backBtn2d.innerHTML = '&lsaquo;';
    backBtn2d.style.display = 'none';
    backBtn2d.addEventListener('click', function () { goBack(); });
    graphPane.appendChild(backBtn2d);

    var zoomWrap2d = document.createElement('div');
    zoomWrap2d.className = 'efficacy-2d-zoom-wrap efficacy-2d-zoom-wrap--graph';
    var zIn = document.createElement('button');
    zIn.type = 'button'; zIn.className = 'efficacy-3d-zoom-btn'; zIn.textContent = '+'; zIn.setAttribute('aria-label', '확대');
    zIn.addEventListener('click', function () { if (svg && zoom) svg.transition().duration(200).call(zoom.scaleBy, 1.3); });
    var zOut = document.createElement('button');
    zOut.type = 'button'; zOut.className = 'efficacy-3d-zoom-btn'; zOut.textContent = '−'; zOut.setAttribute('aria-label', '축소');
    zOut.addEventListener('click', function () { if (svg && zoom) svg.transition().duration(200).call(zoom.scaleBy, 0.77); });
    zoomWrap2d.appendChild(zIn);
    zoomWrap2d.appendChild(zOut);
    graphPane.appendChild(zoomWrap2d);

    /* ── onDrillDownChange 래핑 ──────────────────────────────────── */
    var originalOnDrillDownChange = onDrillDownChange;
    onDrillDownChange = function (isDrilledDown) {
      backBtn2d.style.display = isDrilledDown ? 'flex' : 'none';
      if (typeof originalOnDrillDownChange === 'function') originalOnDrillDownChange(isDrilledDown);
    };

    /* ── SVG ─────────────────────────────────────────────────────── */
    var nodes = [];
    var links = [];
    var data = buildNodesAndLinks();
    nodes = data.nodes;
    links = resolveLinks(nodes, data.links);

    var svg = d3.select(graphPane).append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);

    var defs = svg.append('defs');
    var nodeFilter = defs.append('filter').attr('id', 'efficacy-node-blur')
      .attr('x', '-30%').attr('y', '-30%').attr('width', '160%').attr('height', '160%');
    nodeFilter.append('feGaussianBlur').attr('in', 'SourceGraphic').attr('stdDeviation', 1).attr('result', 'blur');
    var merge = nodeFilter.append('feMerge');
    merge.append('feMergeNode').attr('in', 'blur');
    merge.append('feMergeNode').attr('in', 'SourceGraphic');
    defs.append('filter').attr('id', 'efficacy-link-blur')
      .attr('x', '-15%').attr('y', '-15%').attr('width', '130%').attr('height', '130%')
      .append('feGaussianBlur').attr('in', 'SourceGraphic').attr('stdDeviation', 0.6);
    /* 수정 4: 카테고리→효능 링크 대시 애니메이션용 (CSS에서 처리) */

    /** 패널 그리드 순서 = 약재 상세 모달 좌우 탐색 순서 (script.js `openHerbIngredientModal`과 동일 가나다) */
    function sortHerbsByKoreanName(herbObjs) {
      return herbObjs.slice().sort(function (a, b) {
        return (a.korean_name || '').localeCompare(b.korean_name || '', 'ko-KR');
      });
    }

    /* ── herb pane 열기/닫기 ─────────────────────────────────────── */
    function buildHerbPaneContent(subData, herbObjs) {
      herbPane.innerHTML = '';
      var sortedHerbs = sortHerbsByKoreanName(herbObjs);

      /* 헤더 (수정 2: 타이틀 좌 / × 닫기 우) */
      var header = document.createElement('div');
      header.className = 'efficacy-herb-pane__header';

      var titleWrap = document.createElement('div');
      titleWrap.className = 'efficacy-herb-pane__title-wrap';

      var titleEl = document.createElement('span');
      titleEl.className = 'efficacy-herb-pane__title';
      /* PC·모바일 모두 '카테고리 › 대분류 › 중분류' 형식 */
      var catName = (drillDownEfficacy && drillDownEfficacy.category) || '';
      var effName = subData.efficacyTag || (drillDownEfficacy && drillDownEfficacy.name) || '';
      var subName = subData.category || subData.name || '';
      titleEl.textContent = [catName, effName, subName].filter(Boolean).join(' › ');

      var countEl = document.createElement('span');
      countEl.className = 'efficacy-herb-pane__count';
      countEl.textContent = '(' + sortedHerbs.length + '개)';

      titleWrap.appendChild(titleEl);
      titleWrap.appendChild(countEl);

      /* 수정 2: × 닫기 버튼은 우측에만, ← 버튼 제거 */
      var closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'efficacy-herb-pane__close';
      closeBtn.innerHTML = '&times;';
      closeBtn.setAttribute('aria-label', '패널 닫기');
      closeBtn.addEventListener('click', function () { closeHerbPane(); });

      header.appendChild(titleWrap);
      header.appendChild(closeBtn);
      herbPane.appendChild(header);

      /* 카드 그리드 */
      var grid = document.createElement('div');
      grid.className = 'efficacy-herb-pane__grid';

      var getThumb = (typeof window.getThumbnailForHerb === 'function') ? window.getThumbnailForHerb : function () { return null; };
      sortedHerbs.forEach(function (h) {
        var rawN = (h.korean_name || h.id || '');
        var name = (typeof rawN === 'string') ? rawN.replace(/\s*\(.*$/, '').trim() : rawN;
        var thumb = getThumb(h);

        var card = document.createElement('button');
        card.type = 'button';
        card.className = 'efficacy-herb-pane__card';
        card.setAttribute('aria-label', name);
        card.setAttribute('data-herb-id', h.id || '');

        var imgWrap = document.createElement('div');
        imgWrap.className = 'efficacy-herb-pane__img';
        if (thumb) {
          var img = document.createElement('img');
          img.src = thumb; img.alt = name; img.loading = 'lazy';
          imgWrap.appendChild(img);
        } else {
          var ph = document.createElement('div');
          ph.className = 'efficacy-herb-pane__placeholder';
          ph.textContent = (name || '?')[0];
          imgWrap.appendChild(ph);
        }
        card.appendChild(imgWrap);

        var lbl = document.createElement('span');
        lbl.className = 'efficacy-herb-pane__name';
        lbl.textContent = name || '';
        card.appendChild(lbl);

        card.addEventListener('click', function () {
          if (typeof onSubCategoryClick === 'function') {
            onSubCategoryClick(subData.efficacyTag || '', subData.category || '', sortedHerbs, h);
          }
        });
        grid.appendChild(card);
      });
      herbPane.appendChild(grid);
    }

    function onHerbCardSelect(herbId) {
      if (!herbId) return;
      var grid = herbPane.querySelector('.efficacy-herb-pane__grid');
      if (!grid) return;
      grid.querySelectorAll('.efficacy-herb-pane__card').forEach(function (el) {
        el.classList.remove('selected');
      });
      var target = grid.querySelector('.efficacy-herb-pane__card[data-herb-id="' + herbId + '"]');
      if (target) {
        target.classList.add('selected');
        target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }

    function openHerbPane(subData, herbObjs, clickedNodeId) {
      var isSame = activeSubNode && activeSubNode.id === subData.id;
      if (isSame) {
        if (clickedNodeId) {
          /* 같은 중분류, 다른 약재 클릭: 선택만 갱신 */
          onHerbCardSelect(clickedNodeId);
          applyDimming(subData.id, clickedNodeId);
        } else {
          closeHerbPane();
        }
        return;
      }

      activeSubNode = subData;
      /* 다른 중분류 클릭 시 패널 내용만 교체 (레이아웃 클래스 유지) */
      buildHerbPaneContent(subData, herbObjs);
      applyDimming(subData.id, clickedNodeId);
      if (clickedNodeId) {
        setTimeout(function () { onHerbCardSelect(clickedNodeId); }, 0);
      }

      splitContainer.classList.add('panel-open'); /* 애니메이션 트리거 */
      if (isMobile()) {
        herbPane.classList.add('is-open');
        /* 모바일: 하단 시트(45vh) 위 영역 중앙으로 — 전환 완료 후 pan */
        var mobileNodeId = subData.id;
        setTimeout(function () {
          var mobileNode = nodes.find(function (n) { return n.id === mobileNodeId; });
          if (mobileNode) panToNodeMobile(mobileNode);
        }, SPLIT_DURATION + 30);
      } else {
        var alreadyOpen = graphPane.classList.contains('is-split');
        graphPane.classList.add('is-split');
        herbPane.classList.add('is-open');
        if (!alreadyOpen) {
          /* 새로 열리는 경우: transition 완료 후 레이아웃 재계산 + 노드 중앙 pan */
          setTimeout(function () {
            var gw = graphPane.clientWidth || width;
            var gh = graphPane.clientHeight || height;
            onLayoutChanged(gw, gh, false);
            /* 레이아웃 변화로 노드가 새 클러스터 중심으로 끌려가는 동안 pan 좌표가
               어긋나는 문제를 막기 위해 시뮬레이션을 동기적으로 일정 횟수 진행 */
            settleSimulation(60);
            /* 선택 노드를 분할된 그래프 중앙으로 */
            var targetNode = nodes.find(function (n) { return activeSubNode && n.id === activeSubNode.id; });
            if (targetNode) panToNode(targetNode);
          }, SPLIT_DURATION + 30);
        } else {
          /* 이미 열려있는 상태에서 다른 노드 클릭: 즉시 pan */
          var targetNode = nodes.find(function (n) { return n.id === subData.id; });
          if (targetNode) panToNode(targetNode);
        }
      }
    }

    /* 버그1: 닫을 때 transition 완료 후 low-alpha로 재계산 */
    function closeHerbPane() {
      activeSubNode = null;
      clearDimming();
      splitContainer.classList.remove('panel-open'); /* 애니메이션 해제 */
      graphPane.classList.remove('is-split');
      herbPane.classList.remove('is-open');
      setTimeout(function () {
        herbPane.innerHTML = '';
        var gw = graphPane.clientWidth || width;
        var gh = graphPane.clientHeight || height;
        onLayoutChanged(gw, gh, true); /* lowAlpha = true → 0.08 */
      }, 420);
    }

    /* ── goBack ──────────────────────────────────────────────────── */
    function goBack() {
      /* 패널/레이아웃을 즉시 초기화 (closeHerbPane의 setTimeout 없이 직접 처리) */
      activeSubNode = null;
      clearDimming();
      splitContainer.classList.remove('panel-open');
      graphPane.classList.remove('is-split');
      herbPane.classList.remove('is-open');
      herbPane.innerHTML = '';

      drillDownEfficacy = null;
      drillDownHerb = null;
      try {
        var nd = buildNodesAndLinks();
        nodes = nd.nodes;
        links = resolveLinks(nodes, nd.links);
        if (!link || !node || !simulation) {
          if (typeof onDrillDownChange === 'function') onDrillDownChange(false);
          return;
        }
        link = applyLinkAttrs(link.data(links).join('line'));
        joinNodes(nodes);
        simulation.nodes(nodes);
        simulation.force('link').links(links);
        simulation.force('cluster', forceCluster());
        simulation.force('charge', d3.forceManyBody().strength(-380));
        simulation.force('linkSpacing', forceLinkSpacing());
        if (typeof d3.forceCollide === 'function') {
          simulation.force('collision', d3.forceCollide().radius(getCollisionRadius).strength(1.0).iterations(4));
        }
        /* 레이아웃 복원 후 전체 너비 기준으로 SVG 및 시뮬레이션 재계산 */
        setTimeout(function () {
          var fw = graphPane.clientWidth || container.clientWidth || width;
          var fh = graphPane.clientHeight || container.clientHeight || height;
          onLayoutChanged(fw, fh, false);
        }, 30);
        simulation.alpha(0.5).restart();
        if (typeof onDrillDownChange === 'function') onDrillDownChange(false);
      } catch (e) {
        console.warn('Efficacy 2D goBack error:', e);
        if (typeof onDrillDownChange === 'function') onDrillDownChange(false);
      }
    }

    var g = svg.append('g');

    /* SVG 빈 영역 클릭 → herb pane 닫기 */
    svg.on('click', function (event) {
      if (event.target === this && activeSubNode) closeHerbPane();
    });

    function linkDistanceFn(d) {
      if (drillDownEfficacy) {
        if (d.target && d.target.type === 'subCategory') return 320;
        if (d.target && d.target.type === 'herb') return 120 + Math.min((d.target.siblingCount || 1) * 8, 140);
        return 150;
      }
      return 160;
    }
    var linkForce = d3.forceLink(links).id(function (d) { return d.id; }).distance(linkDistanceFn);
    if (drillDownEfficacy && linkForce.iterations) linkForce.iterations(4);

    function getCollisionRadius(d) {
      if (!d || d.type === 'center') return 0;
      if (d.type === 'category') return 78;
      if (d.type === 'efficacy') return 62;
      if (d.type === 'subCategory') return 54;
      if (d.type === 'herb') return 44 + Math.min((d.siblingCount || 1) * 2, 22);
      return 50;
    }
    var simulation = d3.forceSimulation(nodes)
      .force('link', linkForce)
      .force('charge', d3.forceManyBody().strength(drillDownEfficacy ? -420 : -460))
      .force('cluster', forceCluster())
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('linkSpacing', forceLinkSpacing());
    if (typeof d3.forceCollide === 'function') {
      simulation.force('collision', d3.forceCollide().radius(getCollisionRadius).strength(1.0).iterations(4));
    }
    simulation.alphaDecay(0.014);

    function applyLinkAttrs(sel) {
      return sel
        /* 카테고리→대분류, 대분류→중분류 링크: CSS .link-cat-to-eff로 기본 스타일 처리 */
        .attr('class', function (d) {
          var t = d.target && d.target.type;
          return (t === 'efficacy' || t === 'subCategory') ? 'link-cat-to-eff' : '';
        })
        /* .link-cat-to-eff에는 CSS가 stroke를 관리하므로 SVG 속성 제거(null) */
        .attr('stroke', function (d) {
          var t = d.target && d.target.type;
          return (t === 'efficacy' || t === 'subCategory') ? null : '#999';
        })
        .attr('stroke-opacity', function (d) {
          var t = d.target && d.target.type;
          return (t === 'efficacy' || t === 'subCategory') ? null : 0.6;
        })
        .attr('stroke-width', function (d) {
          if (d.target && d.target.type === 'herb') return 1;
          if (d.target && d.target.type === 'subCategory') return 1.5;
          return 2;
        });
    }

    var link = g.append('g').attr('class', 'efficacy-2d-links')
      .selectAll('line').data(links).join('line');
    applyLinkAttrs(link);

    var node = g.append('g').attr('class', 'efficacy-2d-nodes')
      .selectAll('g').data(nodes).join('g')
      .attr('cursor', function (d) { return d.type === 'center' ? 'default' : 'pointer'; })
      .call(d3.drag()
        .on('start', dragstarted).on('drag', dragged).on('end', dragended));

    node.append('circle')
      .attr('r', function (d) {
        if (d.type === 'center') return 0;
        if (d.isHerbCenter) return 35;
        if (d.type === 'category') return 39;
        if (d.type === 'efficacy') return 29;
        if (d.type === 'subCategory') return 25;
        return 19;
      })
      .attr('fill', function (d) { return d.type === 'center' ? 'transparent' : toRgb(d.color || 0); })
      .attr('stroke', function (d) {
        if (d.type === 'center') return 'transparent';
        if (d.isHerbCenter) return '#000';
        return '#fff';
      })
      .attr('stroke-width', function (d) { return d.isHerbCenter ? 2.5 : 1.5; });

    node.append('text')
      .attr('dy', '0.35em').attr('text-anchor', 'middle')
      .attr('font-size', function (d) {
        if (d.type === 'category') return 12;
        if (d.type === 'efficacy') return 11;
        if (d.type === 'subCategory') return 10;
        return 8;
      })
      .attr('fill', '#333').attr('pointer-events', 'none')
      .text(function (d) { return d.name; });

    function centerNodeOnScreen(d) {
      var px = (d.x != null) ? d.x : (d.clusterX != null ? d.clusterX : width / 2);
      var py = (d.y != null) ? d.y : (d.clusterY != null ? d.clusterY : height / 2);
      /* 모바일: 화면이 좁아 2.2배로 확대하면 연결 노드가 모두 잘림 → 주변 클러스터가 보이게 낮춤 */
      var k = isMobile() ? 1.1 : 2.2;
      svg.transition().duration(500).ease(d3.easeCubicInOut)
        .call(zoom.transform, d3.zoomIdentity
          .translate(width / 2 - px * k, height / 2 - py * k).scale(k));
    }

    /* 클릭 시 노드가 너무 작아 보이지 않도록 보장하는 최소 줌 배율 */
    var MIN_FOCUS_ZOOM = 1.8;

    /* 현재 줌 배율 유지하면서 노드를 그래프 pane 중앙으로 pan (PC) */
    function panToNode(d) {
      if (!d || d.x == null) return;
      var paneW = graphPane.clientWidth || width;
      var paneH = graphPane.clientHeight || height;
      var currentT = d3.zoomTransform(svg.node());
      var k = Math.max(currentT.k, MIN_FOCUS_ZOOM);
      var tx = paneW / 2 - d.x * k;
      var ty = paneH / 2 - d.y * k;
      svg.transition().duration(450).ease(d3.easeCubicInOut)
        .call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(k));
    }

    /* 모바일: 하단 시트(45vh) 위 남은 영역의 중앙으로 pan */
    function panToNodeMobile(d) {
      if (!d || d.x == null) return;
      var paneW = graphPane.clientWidth || width;
      var paneH = graphPane.clientHeight || height;
      /* 하단 시트가 차지하는 높이(45vh) 제외 */
      var sheetH = window.innerHeight * 0.45;
      var availH = paneH - sheetH;
      var centerY = availH / 2;
      var currentT = d3.zoomTransform(svg.node());
      var k = Math.max(currentT.k, MIN_FOCUS_ZOOM);
      var tx = paneW / 2 - d.x * k;
      var ty = centerY - d.y * k;
      svg.transition().duration(450).ease(d3.easeCubicInOut)
        .call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(k));
    }

    /* 레이아웃 변경 직후 시뮬레이션이 노드를 새 클러스터 중심으로 끌어당기는 동안
       pan 좌표가 어긋나지 않도록, 동기적으로 시뮬레이션을 일정 횟수 진행시킨다. */
    function settleSimulation(ticks) {
      if (!simulation || typeof simulation.tick !== 'function') return;
      for (var i = 0; i < ticks; i++) simulation.tick();
    }

    function handleNodeClick(event, d) {
      event.stopPropagation();
      if (d.type === 'center') return;

      if (d.type === 'efficacy' && d.groups && d.groups.length > 0) {
        /* 드릴다운: 효능 클릭 */
        closeHerbPane();
        drillDownHerb = null;
        drillDownEfficacy = d;
        if (typeof onDrillDownChange === 'function') onDrillDownChange(true);
        var nd = buildNodesAndLinks();
        nodes = nd.nodes;
        links = resolveLinks(nodes, nd.links);
        link = applyLinkAttrs(link.data(links).join('line'));
        joinNodes(nodes);
        simulation.nodes(nodes);
        var lf = simulation.force('link');
        lf.links(links);
        if (lf.iterations) lf.iterations(4);
        simulation.force('cluster', forceCluster());
        simulation.force('charge', d3.forceManyBody().strength(-340));
        simulation.force('linkSpacing', forceLinkSpacing());
        if (typeof d3.forceCollide === 'function') {
          simulation.force('collision', d3.forceCollide().radius(getCollisionRadius).strength(1.0).iterations(3));
        }
        simulation.alpha(0.5).restart();
        setTimeout(function () {
          var effNode = nodes.find(function (nd) { return nd.type === 'efficacy'; });
          if (effNode) centerNodeOnScreen(effNode);
        }, 450);

      } else if (d.type === 'subCategory' && d.herbs && d.herbs.length > 0) {
        /* 중분류 클릭 → 2분할 패널 */
        var herbObjs = d.herbs.map(function (h) {
          return typeof h === 'object' ? h : { id: h, korean_name: h };
        });
        openHerbPane(d, herbObjs);

      } else if (d.type === 'herb' && d.herb) {
        /* 약재 클릭 → 부모 중분류 패널 열기 */
        var parentSub = nodes.find(function (n) {
          return n.type === 'subCategory' &&
                 n.category === d.subCategory &&
                 n.efficacyTag === d.efficacyTag;
        });
        if (parentSub && parentSub.herbs && parentSub.herbs.length > 0) {
          var herbObjs = parentSub.herbs.map(function (h) {
            return typeof h === 'object' ? h : { id: h, korean_name: h };
          });
          openHerbPane(parentSub, herbObjs, d.id); /* 클릭한 herb id 전달 */
        } else if (typeof onSubCategoryClick === 'function') {
          /* 부모를 찾지 못한 경우 fallback */
          onSubCategoryClick(d.efficacyTag || '', d.subCategory || '', [d.herb]);
        }
      }
    }
    node.on('click', handleNodeClick);

    function dragstarted(event) {
      if (event.subject.type === 'center') return;
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }
    function dragged(event) {
      if (event.subject.type === 'center') return;
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }
    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0);
    }

    simulation.on('tick', function () {
      link
        .attr('x1', function (d) { return (d.source && d.source.x != null) ? d.source.x : 0; })
        .attr('y1', function (d) { return (d.source && d.source.y != null) ? d.source.y : 0; })
        .attr('x2', function (d) { return (d.target && d.target.x != null) ? d.target.x : 0; })
        .attr('y2', function (d) { return (d.target && d.target.y != null) ? d.target.y : 0; });
      node.attr('transform', function (d) { return 'translate(' + d.x + ',' + d.y + ')'; });
    });

    /* 수정 1: 터치 필터 추가 */
    var zoom = d3.zoom()
      .scaleExtent([0.3, 4])
      .filter(function (event) {
        return !event.ctrlKey || event.type === 'wheel' ||
          event.type === 'touchstart' || event.type === 'touchmove';
      })
      .on('zoom', function (event) {
        g.attr('transform', event.transform);
      });
    svg.call(zoom);
    svg.style('touch-action', 'none');

    function resize() {
      var w = (graphPane.clientWidth || container.clientWidth) || 800;
      var h = container.clientHeight || 600;
      width = w; height = h;
      svg.attr('width', w).attr('height', h).attr('viewBox', [0, 0, w, h]);
      updateClusterCenters(w, h);
      if (!drillDownEfficacy) {
        nodes.forEach(function (d) {
          if (d.cluster != null && d.clusterSubTotal != null) {
            var center = clusterCenters[d.cluster] || clusterCenters[7];
            var subAngle = (d.clusterSubTotal > 1) ? (d.clusterSubIdx / d.clusterSubTotal) * Math.PI * 2 - Math.PI / 2 : 0;
            var subR = (d.clusterSubTotal > 1) ? subClusterRadius : 0;
            d.clusterX = center.x + Math.cos(subAngle) * subR;
            d.clusterY = center.y + Math.sin(subAngle) * subR;
          }
        });
      }
      simulation.force('center', d3.forceCenter(w / 2, h / 2));
      simulation.alpha(0.3).restart();
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', resize);
    }

    function doSearch(q) {
      if (!q || !q.trim()) { if (drillDownEfficacy || drillDownHerb) goBack(); return; }
      var lower = q.trim().toLowerCase();
      if (drillDownEfficacy) {
        var bestDrill = null;
        var bestDrillScore = -1;
        nodes.forEach(function (d) {
          var s = null;
          if (d.type === 'efficacy') {
            s = efficacyTagMatchScore(lower, d.name || '');
          } else if (d.type === 'herb') {
            s = herbMatchScore(lower, d.name || '');
            if (d.herb && d.herb.korean_name) {
              var fs = herbMatchScore(lower, d.herb.korean_name);
              if (fs != null && (s == null || fs > s)) s = fs;
            }
          } else if (d.type === 'subCategory') {
            var label = ((d.category || '') + ' ' + (d.name || '')).trim();
            if (label.toLowerCase().indexOf(lower) >= 0) {
              s = 100000 - label.length;
            }
            (d.herbs || []).forEach(function (h) {
              var hObj = typeof h === 'object' ? h : { id: h, korean_name: String(h) };
              var hs = herbMatchScore(lower, hObj.korean_name || '');
              if (hs != null && (s == null || hs > s)) s = hs;
            });
          }
          if (s != null && s > bestDrillScore) {
            bestDrillScore = s;
            bestDrill = d;
          }
        });
        if (bestDrill) centerNodeOnScreen(bestDrill);
        return;
      }
      if (drillDownHerb) {
        var herbCenterName = (drillDownHerb.korean_name || '').toLowerCase();
        if (herbCenterName.indexOf(lower) >= 0) return;
        goBack();
      }

      var best = null;
      categories.forEach(function (cat) {
        var ck = categoryKeyMatchScore(lower, cat.key || '');
        if (ck != null && (!best || ck > best.score)) {
          best = { kind: 'category', score: ck, cat: cat };
        }
        (cat.efficacies || []).forEach(function (eff) {
          var es = efficacyTagMatchScore(lower, eff.tag || '');
          if (es != null && (!best || es > best.score)) {
            best = {
              kind: 'efficacy',
              score: es,
              eff: eff,
              color: BODY_COLORS[cat.key] || 0x7aaa7a
            };
          }
          (eff.groups || []).forEach(function (grp) {
            (grp.herbs || []).forEach(function (h) {
              var hObj = typeof h === 'object' ? h : { id: h, korean_name: String(h) };
              var hs = herbMatchScore(lower, hObj.korean_name || '');
              if (hs != null && (!best || hs > best.score)) {
                best = {
                  kind: 'herb',
                  score: hs,
                  herb: hObj,
                  color: BODY_COLORS[cat.key] || 0x7aaa7a
                };
              }
            });
          });
        });
      });
      if (best && best.kind === 'efficacy') {
        closeHerbPane();
        drillDownEfficacy = { name: best.eff.tag, groups: best.eff.groups || [], color: best.color };
        var nd = buildNodesAndLinks();
        nodes = nd.nodes; links = resolveLinks(nodes, nd.links);
        link = applyLinkAttrs(link.data(links).join('line'));
        joinNodes(nodes);
        simulation.nodes(nodes);
        simulation.force('link').links(links);
        simulation.force('cluster', forceCluster());
        simulation.force('charge', d3.forceManyBody().strength(-340));
        simulation.force('linkSpacing', forceLinkSpacing());
        if (typeof d3.forceCollide === 'function') {
          simulation.force('collision', d3.forceCollide().radius(getCollisionRadius).strength(1.0).iterations(3));
        }
        simulation.alpha(0.5).restart();
        setTimeout(function () {
          var effNode = nodes.find(function (d) { return d.type === 'efficacy'; });
          if (effNode) centerNodeOnScreen(effNode);
        }, 300);
        if (typeof onDrillDownChange === 'function') onDrillDownChange(true);
      } else if (best && best.kind === 'herb') {
        closeHerbPane();
        drillDownHerb = best.herb;
        var nd = buildNodesAndLinks();
        nodes = nd.nodes; links = resolveLinks(nodes, nd.links);
        link = applyLinkAttrs(link.data(links).join('line'));
        link.classed('link-animated', true);
        joinNodes(nodes);
        simulation.nodes(nodes);
        simulation.force('link').links(links);
        simulation.force('cluster', forceCluster());
        simulation.force('charge', d3.forceManyBody().strength(-360));
        simulation.force('linkSpacing', forceLinkSpacing());
        if (typeof d3.forceCollide === 'function') {
          simulation.force('collision', d3.forceCollide().radius(getCollisionRadius).strength(1.0).iterations(4));
        }
        simulation.alpha(0.5).restart();
        setTimeout(function () {
          var centerNode = nodes.find(function (d) { return d.type === 'herb'; });
          if (centerNode) centerNodeOnScreen(centerNode);
        }, 300);
        if (typeof onDrillDownChange === 'function') onDrillDownChange(true);
      } else if (best && best.kind === 'category') {
        var catKeyWant = (best.cat && best.cat.key) ? best.cat.key : '';
        var catNode = nodes.find(function (d) {
          return d.type === 'category' && catKeyWant && (d.name || '') === catKeyWant;
        });
        if (!catNode) {
          catNode = nodes.find(function (d) { return d.type === 'category' && (d.name || '').toLowerCase().indexOf(lower) >= 0; });
        }
        if (catNode) centerNodeOnScreen(catNode);
      }
    }

    function apiGoBack() {
      if (!drillDownEfficacy && !drillDownHerb) return false;
      goBack();
      return true;
    }

    function zoomIn() { if (svg && zoom) svg.transition().duration(200).call(zoom.scaleBy, 1.3); }
    function zoomOut() { if (svg && zoom) svg.transition().duration(200).call(zoom.scaleBy, 0.77); }

    if (typeof onDrillDownChange === 'function') onDrillDownChange(false);

    return {
      dispose: function () {
        if (typeof window !== 'undefined') window.removeEventListener('resize', resize);
        simulation.stop();
        container.innerHTML = '';
      },
      search: doSearch,
      goBack: apiGoBack,
      zoomIn: zoomIn,
      zoomOut: zoomOut,
      closeHerbPanel: closeHerbPane,
      selectHerb: function (herbId) {
        if (!herbId) return;
        var herbNode = nodes.find(function (n) { return n.type === 'herb' && n.id === herbId; });
        if (!herbNode) return;
        var parentSub = nodes.find(function (n) {
          return n.type === 'subCategory' &&
                 n.category === herbNode.subCategory &&
                 n.efficacyTag === herbNode.efficacyTag;
        });
        if (parentSub) {
          var herbObjs = parentSub.herbs.map(function (h) {
            return typeof h === 'object' ? h : { id: h, korean_name: h };
          });
          openHerbPane(parentSub, herbObjs, herbId);
        }
      }
    };
  }

  window.buildEfficacy2DGraph = buildEfficacy2DGraph;
})();
