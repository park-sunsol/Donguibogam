/**
 * 동의보감 효능 3D 우주 시각화
 * - 1단계: 카테고리(몸부위) + 대분류(효능)만 노출
 * - 대분류 클릭 시: 중앙 배치·확대, 다른 파티클 흐리게, 중분류·소분류 노출
 */
function setFallbackError(msg) {
  var defaultMsg = '3D 시각화 로드 실패. ';
  if (typeof location !== 'undefined' && location.protocol === 'file:') {
    defaultMsg += '파일을 직접 열면 모듈 로드가 차단됩니다. 터미널에서 <code>npx serve .</code> 후 브라우저로 접속해 주세요.';
  } else {
    defaultMsg += '네트워크 연결을 확인하거나 잠시 후 다시 시도해 주세요.';
  }
  window.initEfficacyUniverse3D = function (container) {
    if (container) {
      container.innerHTML = '<p class="efficacy-tree-empty">' + (msg || defaultMsg) + '</p>';
    }
    return null;
  };
}

try {
  var threeModule = await import('three');
  var THREE = threeModule.default || threeModule;
  var controlsModule = await import('three/addons/controls/OrbitControls.js');
  var OrbitControls = controlsModule.OrbitControls || controlsModule.default;
  var css2dModule = await import('three/addons/renderers/CSS2DRenderer.js');
  var CSS2DRenderer = css2dModule.CSS2DRenderer;
  var CSS2DObject = css2dModule.CSS2DObject;
  runModule(THREE, OrbitControls, CSS2DRenderer, CSS2DObject);
  if (typeof window !== 'undefined') window._efficacy3dLoaded = true;
} catch (e) {
  console.error('Efficacy 3D module load error:', e);
  setFallbackError('3D 시각화 로드 실패: ' + (e && (e.message || String(e))) || '알 수 없는 오류');
}

function runModule(THREE, OrbitControls, CSS2DRenderer, CSS2DObject) {

var SUB_CATEGORY_COLORS = {
  곡부: 0x9ad49a, 과부: 0xb8a8d4, 목부: 0xd4b89a, 채부: 0x9ad4b8, 초부: 0xc8a88a,
  어부: 0xd49a9a, '금부(禽)': 0xb8b8d4, '수부(獸)': 0xd4b89a, 인부: 0xa0c4d4, 충부: 0xc89ab0,
  석부: 0xb8a8a8, 옥부: 0xa0b8d4, '금부(金)': 0xc8b89a,
  '수부(水)': 0x9ab8d4, 토부: 0xb8c8a0
};

var BODY_CATEGORY_COLORS = (typeof window !== 'undefined' && window.EFFICACY_BODY_CATEGORY_COLORS) ? window.EFFICACY_BODY_CATEGORY_COLORS : {};

var scene, camera, renderer, css2dRenderer, controls, raycaster, mouse;
var nodeMeshes = [];
var categoryMeshes = [];
var efficacyMeshes = [];
var subMeshes = [];
var herbMeshes = [];
var herbLines = [];
var efficacyLines = [];
var lineSegments = [];
var lineUpdates = [];
var animationFrameId = null;
var clock = new THREE.Clock();
var hoveredMesh = null;
var onSubCategoryClick = null;
var onBack = null;
var topViewMode = false;
var selectedNode = null;
var targetCameraDistance = null;
var defaultCameraDistance = 180;
var lastPointerDownX = 0;
var lastPointerDownY = 0;
var CLICK_DRAG_THRESHOLD = 8;
var categoryObjects = [];
var efficacyObjects = [];
var INITIAL_VIEW = {}; // sentinel for "go back to initial" when at category level
var subCategoryLines = [];
var topViewRingMeshes = [];
var efficacy2dContainer = null;
var efficacy2dApi = null;
var herbPanelContainer = null;

function computeRequiredCameraDistanceForSelection(node) {
  var nodes = [];
  var center = node.position.clone();
  if (node.userData.type === 'category') {
    nodes = [node].concat(node.userData.efficacyMeshes || []);
  } else if (node.userData.type === 'efficacy') {
    nodes = [node].concat(node.userData.subMeshes || []);
  } else if (node.userData.type === 'subCategory') {
    nodes = [node];
    herbMeshes.forEach(function (m) {
      if (m.userData.subMesh === node) nodes.push(m);
    });
  }
  var maxDist = 0;
  nodes.forEach(function (m) {
    if (!m.visible) return;
    var r = 12;
    if (m.geometry && m.geometry.boundingSphere) r = m.geometry.boundingSphere.radius;
    else if (m.geometry) { m.geometry.computeBoundingSphere(); r = (m.geometry.boundingSphere && m.geometry.boundingSphere.radius) || 12; }
    var orbitR = (m.userData && m.userData.orbitRadius) ? m.userData.orbitRadius : 0;
    var pos = m.userData.basePosition ? m.userData.basePosition : m.position;
    var d = center.distanceTo(pos) + r + orbitR + LABEL_OFFSET_TOPVIEW;
    maxDist = Math.max(maxDist, d);
  });
  if (maxDist <= 0) return 50;
  var el = renderer && renderer.domElement;
  var aspect = el ? (el.clientWidth / el.clientHeight) : 16 / 9;
  var fovRad = (camera && camera.fov ? camera.fov : 60) * Math.PI / 180;
  var tanHalfFov = Math.tan(fovRad / 2);
  var padding = 1.4;
  var d = (maxDist * padding) / (aspect >= 1 ? tanHalfFov : tanHalfFov * aspect);
  return Math.max(25, Math.min(500, d));
}

function ensureTopViewRings() {
  if (topViewRingMeshes.length > 0) {
    topViewRingMeshes.forEach(function (m) { m.visible = true; });
    return;
  }
  var radii = [150, 250, 360];
  radii.forEach(function (r) {
    var geom = new THREE.RingGeometry(r - 1.5, r + 1.5, 64);
    var mat = new THREE.MeshBasicMaterial({
      color: 0x2a3a2a,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    var ring = new THREE.Mesh(geom, mat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0;
    ring.userData.topViewRing = true;
    scene.add(ring);
    topViewRingMeshes.push(ring);
  });
}

function hideTopViewRings() {
  topViewRingMeshes.forEach(function (m) { m.visible = false; });
}

function brightenColor(hex) {
  var c = new THREE.Color(hex);
  var hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  hsl.s = Math.min(1, hsl.s * 1.35);
  hsl.l = Math.min(0.85, hsl.l * 1.25);
  c.setHSL(hsl.h, hsl.s, hsl.l);
  return c.getHex();
}

function createMesh(radius, color, type) {
  var brightColor = brightenColor(color);
  var geometry = new THREE.SphereGeometry(radius, 24, 18);
  var material = new THREE.MeshLambertMaterial({
    color: brightColor,
    transparent: true,
    opacity: 1
  });
  var mesh = new THREE.Mesh(geometry, material);
  mesh.userData = { type: type, radius: radius };
  return mesh;
}

function updateNodeGeometryForTopView(useFlatCircle) {
  nodeMeshes.forEach(function (m) {
    var r = m.userData.radius;
    if (r == null) return;
    if (m.geometry) m.geometry.dispose();
    if (useFlatCircle) {
      m.geometry = new THREE.CircleGeometry(r, 32);
      m.rotation.x = -Math.PI / 2;
      m.rotation.y = 0;
      m.rotation.z = 0;
    } else {
      m.geometry = new THREE.SphereGeometry(r, 24, 18);
      m.rotation.x = 0;
      m.rotation.y = 0;
      m.rotation.z = 0;
    }
  });
}

function createLabel(text, type, renderOrder) {
  var div = document.createElement('div');
  div.className = 'efficacy-3d-label efficacy-3d-label--' + type;
  div.textContent = text;
  div.style.pointerEvents = 'none';
  var obj = new CSS2DObject(div);
  if (renderOrder != null) obj.renderOrder = renderOrder;
  return obj;
}

var LINE_RADIUS = 0.45;

function createLine(fromMesh, toMesh, color) {
  var brightColor = brightenColor(color);
  var geom = new THREE.CylinderGeometry(LINE_RADIUS, LINE_RADIUS, 1, 6);
  var mat = new THREE.MeshLambertMaterial({
    color: brightColor,
    transparent: true,
    opacity: 1
  });
  var mesh = new THREE.Mesh(geom, mat);
  mesh.userData = { from: fromMesh, to: toMesh, color: brightColor };
  lineUpdates.push({ line: mesh, from: fromMesh, to: toMesh, isTube: true });
  return mesh;
}

function updateTubeLine(u) {
  if (!u.isTube) return;
  var from = u.from.position;
  var to = u.to.position;
  var mid = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);
  var dir = new THREE.Vector3().subVectors(to, from);
  var len = dir.length();
  if (len < 0.01) return;
  u.line.position.copy(mid);
  u.line.scale.set(1, len, 1);
  u.line.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
}

function sphericalToCartesian(r, theta, phi) {
  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

function animateNodes(time) {
  nodeMeshes.forEach(function (m) {
    var data = m.userData;
    if (data.orbitRadius && data.orbitSpeed && data.basePosition) {
      var angle = data.orbitPhase + time * data.orbitSpeed;
      m.position.x = data.basePosition.x + Math.cos(angle) * data.orbitRadius;
      m.position.z = data.basePosition.z + Math.sin(angle) * data.orbitRadius;
      m.position.y = data.basePosition.y + Math.sin(angle * 0.7) * data.orbitRadius * 0.3;
    } else if (data.floatAmplitude) {
      m.position.y = data.baseY + Math.sin(time * data.floatSpeed) * data.floatAmplitude;
    }
  });
  lineUpdates.forEach(function (u) {
    if (u.isTube) {
      updateTubeLine(u);
    } else if (u.line.geometry && u.line.geometry.setFromPoints) {
      u.line.geometry.setFromPoints([u.from.position.clone(), u.to.position.clone()]);
    }
  });
}

function setFocusState(mesh, focused) {
  if (!mesh || !mesh.material) return;
  mesh.material.opacity = 1;
  if (mesh.children && mesh.children[0] && mesh.children[0].element) {
    var el = mesh.children[0].element;
    el.style.opacity = focused ? '1' : '0.2';
    el.style.filter = focused ? 'none' : 'blur(3px)';
  }
}

function updateLineFocus() {
  lineUpdates.forEach(function (u) {
    var line = u.line;
    if (subCategoryLines.indexOf(line) >= 0) return;
    if (efficacyLines.indexOf(line) >= 0) return;
    var bright = !selectedNode || u.from === selectedNode || u.to === selectedNode;
    line.material.opacity = bright ? 1 : 0.2;
  });
  efficacyLines.forEach(function (l) {
    if (!l.visible) return;
    var bright = !selectedNode ||
      (selectedNode.userData.type === 'category' && l.userData && l.userData.from === selectedNode) ||
      (selectedNode.userData.type === 'efficacy' && l.userData && selectedNode.userData.categoryMesh && l.userData.from === selectedNode.userData.categoryMesh);
    l.material.opacity = bright ? 1 : 0.2;
  });
  subCategoryLines.forEach(function (l) {
    if (!l.visible) return;
    var bright = !selectedNode ||
      (selectedNode.userData.type === 'efficacy' && l.userData && l.userData.from === selectedNode) ||
      (selectedNode.userData.type === 'subCategory' && l.userData && l.userData.to === selectedNode);
    l.material.opacity = bright ? 1 : 0.2;
  });
}

var LABEL_OFFSET_TOPVIEW = 14;

/** Top View: 부모 기준 방향으로 라벨 오프셋해 겹침 감소 (계층별 분산) */
function updateLabelOffsetsForTopView() {
  categoryMeshes.forEach(function (m) {
    var label = m.children[0];
    if (!label) return;
    var x = m.position.x;
    var z = m.position.z;
    var len = Math.sqrt(x * x + z * z) || 1;
    label.position.set((x / len) * LABEL_OFFSET_TOPVIEW, 0, (z / len) * LABEL_OFFSET_TOPVIEW);
  });
  efficacyMeshes.forEach(function (m) {
    var label = m.children[0];
    if (!label) return;
    var cat = m.userData.categoryMesh;
    var dx = cat ? (m.position.x - cat.position.x) : m.position.x;
    var dz = cat ? (m.position.z - cat.position.z) : m.position.z;
    var len = Math.sqrt(dx * dx + dz * dz) || 1;
    label.position.set((dx / len) * LABEL_OFFSET_TOPVIEW, 0, (dz / len) * LABEL_OFFSET_TOPVIEW);
  });
  subMeshes.forEach(function (m) {
    var label = m.children[0];
    if (!label) return;
    var eff = m.userData.efficacyMesh;
    var dx = eff ? (m.position.x - eff.position.x) : m.position.x;
    var dz = eff ? (m.position.z - eff.position.z) : m.position.z;
    var len = Math.sqrt(dx * dx + dz * dz) || 1;
    label.position.set((dx / len) * LABEL_OFFSET_TOPVIEW, 0, (dz / len) * LABEL_OFFSET_TOPVIEW);
  });
  herbMeshes.forEach(function (m) {
    var label = m.children[0];
    if (!label) return;
    var sub = m.userData.subMesh;
    var dx = sub ? (m.position.x - sub.position.x) : m.position.x;
    var dz = sub ? (m.position.z - sub.position.z) : m.position.z;
    var len = Math.sqrt(dx * dx + dz * dz) || 1;
    label.position.set((dx / len) * LABEL_OFFSET_TOPVIEW, 0, (dz / len) * LABEL_OFFSET_TOPVIEW);
  });
}

function resetLabelOffsets() {
  var nodes = [].concat(categoryMeshes, efficacyMeshes, subMeshes, herbMeshes);
  nodes.forEach(function (m) {
    var label = m.children[0];
    if (label) label.position.set(0, 0, 0);
  });
}

/** Top View에서 화면에 모든 노드가 들어오도록 필요한 카메라 거리 계산 */
function computeTopViewCameraDistance() {
  var maxExtent = 0;
  var nodes = [].concat(categoryMeshes, efficacyMeshes, subMeshes, herbMeshes);
  nodes.forEach(function (m) {
    if (!m.visible) return;
    var r = 12;
    if (m.geometry && m.geometry.boundingSphere) {
      r = m.geometry.boundingSphere.radius;
    } else if (m.geometry) {
      m.geometry.computeBoundingSphere();
      r = (m.geometry.boundingSphere && m.geometry.boundingSphere.radius) || 12;
    }
    var orbitR = (m.userData && m.userData.orbitRadius) ? m.userData.orbitRadius : 0;
    var px = m.position.x;
    var pz = m.position.z;
    if (m.userData && m.userData.basePosition) {
      px = m.userData.basePosition.x;
      pz = m.userData.basePosition.z;
    }
    var ex = Math.max(Math.abs(px - r - orbitR), Math.abs(px + r + orbitR));
    var ez = Math.max(Math.abs(pz - r - orbitR), Math.abs(pz + r + orbitR));
    maxExtent = Math.max(maxExtent, ex, ez);
  });
  if (maxExtent <= 0) return 350;
  maxExtent += LABEL_OFFSET_TOPVIEW + 25;
  var el = renderer && renderer.domElement;
  var aspect = el ? (el.clientWidth / el.clientHeight) : 16 / 9;
  var fovRad = (camera && camera.fov ? camera.fov : 60) * Math.PI / 180;
  var tanHalfFov = Math.tan(fovRad / 2);
  var padding = 4.5;
  var d = (maxExtent * padding) / (aspect >= 1 ? tanHalfFov : tanHalfFov * aspect);
  return Math.max(450, Math.min(1500, d));
}

/** 최대 2단계만 라벨 표시: (카테고리,대분류) | (대분류,중분류) | (중분류,약재명). 나머지는 원만 표시 */
function updateLabelVisibility() {
  var showCategory = false;
  var showEfficacy = false;
  var showSubCategory = false;
  var showHerb = false;
  var nodeType = selectedNode ? (selectedNode.userData && selectedNode.userData.type) : null;
  if (!nodeType || nodeType === 'category') {
    showCategory = true;
    showEfficacy = true;
  } else if (nodeType === 'efficacy') {
    showEfficacy = true;
    showSubCategory = true;
  } else if (nodeType === 'subCategory' || nodeType === 'herb') {
    showSubCategory = true;
    showHerb = true;
  }
  categoryMeshes.forEach(function (m) {
    if (m.children[0]) m.children[0].visible = showCategory;
  });
  efficacyMeshes.forEach(function (m) {
    if (m.children[0]) m.children[0].visible = showEfficacy && m.visible;
  });
  subMeshes.forEach(function (m) {
    if (m.children[0]) m.children[0].visible = showSubCategory && m.visible;
  });
  herbMeshes.forEach(function (m) {
    if (m.children[0]) m.children[0].visible = showHerb && m.visible;
  });
}

function render() {
  if (!renderer || !scene || !camera) return;
  var time = clock.getElapsedTime();
  animateNodes(time);
  updateHoverScale();
  updateLineFocus();
  updateLabelVisibility();
  if (selectedNode && controls) {
    controls.autoRotate = false;
    var cur = selectedNode.position.clone();
    controls.target.lerp(cur, 0.08);
    if (controls.target.distanceTo(cur) < 0.2) controls.target.copy(cur);
    if (targetCameraDistance !== null) {
      var offset = camera.position.clone().sub(controls.target);
      var dist = offset.length();
      var newDist = dist + (targetCameraDistance - dist) * 0.06;
      if (Math.abs(newDist - targetCameraDistance) < 1) newDist = targetCameraDistance;
      offset.normalize().multiplyScalar(newDist);
      camera.position.copy(controls.target).add(offset);
    }
  } else if (targetCameraDistance !== null && controls && !selectedNode) {
    var offset = camera.position.clone().sub(controls.target);
    var dist = offset.length();
    var newDist = dist + (defaultCameraDistance - dist) * 0.05;
    if (Math.abs(newDist - defaultCameraDistance) < 2) {
      newDist = defaultCameraDistance;
      targetCameraDistance = null;
    }
    offset.normalize().multiplyScalar(newDist);
    camera.position.copy(controls.target).add(offset);
  } else if (!selectedNode && controls) {
    controls.autoRotate = !topViewMode;
  }
  var container = renderer.domElement && renderer.domElement.parentElement;
  if (topViewMode && camera && controls) {
    var topViewDist = computeTopViewCameraDistance();
    camera.position.set(0, topViewDist, 0.01);
    camera.up.set(0, 1, 0);
    controls.target.set(0, 0, 0);
    if (container) container.classList.add('top-view-mode');
  } else {
    if (container) container.classList.remove('top-view-mode');
  }
  if (topViewMode) {
    updateLabelOffsetsForTopView();
    ensureTopViewRings();
  } else {
    resetLabelOffsets();
    hideTopViewRings();
  }
  if (controls && controls.update) controls.update();
  renderer.render(scene, camera);
  if (css2dRenderer && scene && camera) css2dRenderer.render(scene, camera);
  animationFrameId = requestAnimationFrame(render);
}

function onPointerDown(event) {
  if (!raycaster || !camera || !renderer) return;
  lastPointerDownX = event.clientX;
  lastPointerDownY = event.clientY;
}


var HOVER_SCALE_TARGET = 1.25;
var HOVER_SCALE_LERP = 0.12;

function onPointerMove(event) {
  if (!raycaster || !camera || !renderer) return;
  var rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  var intersects = raycaster.intersectObjects(nodeMeshes);
  if (intersects.length > 0) {
    var mesh = intersects[0].object;
    renderer.domElement.style.cursor = 'pointer';
    hoveredMesh = mesh;
  } else {
    renderer.domElement.style.cursor = 'default';
    hoveredMesh = null;
  }
}

function updateHoverScale() {
  nodeMeshes.forEach(function (m) {
    var base = m.userData.baseScale || 1;
    var target = (m === hoveredMesh) ? Math.max(HOVER_SCALE_TARGET, base) : base;
    var cur = m.scale.x;
    var next = cur + (target - cur) * HOVER_SCALE_LERP;
    if (Math.abs(next - target) < 0.005) next = target;
    m.scale.setScalar(next);
  });
}

function hideEfficacyNodes() {
  efficacyMeshes.forEach(function (m) {
    m.visible = false;
    if (m.material) m.material.opacity = 0;
    if (m.children[0]) m.children[0].visible = false;
  });
  efficacyLines.forEach(function (l) {
    l.visible = false;
    if (l.material) l.material.opacity = 0;
  });
}

function showAllEfficacyAsCircles() {
  efficacyMeshes.forEach(function (m) {
    m.visible = true;
    if (m.material) m.material.opacity = 1;
  });
  efficacyLines.forEach(function (l) {
    l.visible = true;
    if (l.material) l.material.opacity = 1;
  });
}

function showEfficacyNodesFor(categoryMesh) {
  hideEfficacyNodes();
  hideSubCategoryNodes();
  var data = categoryMesh.userData;
  if (!data.efficacyMeshes) return;
  data.efficacyMeshes.forEach(function (m) {
    m.visible = true;
    if (m.material) m.material.opacity = 1;
  });
  if (data.efficacyLines) {
    data.efficacyLines.forEach(function (l) {
      l.visible = true;
      if (l.material) l.material.opacity = 1;
    });
  }
}

function hideHerbPanel() {
  if (herbPanelContainer) {
    herbPanelContainer.style.display = 'none';
    herbPanelContainer.innerHTML = '';
  }
}

function showHerbPanel(herbs) {
  if (!herbPanelContainer) return;
  herbPanelContainer.innerHTML = '';
  var getThumb = (typeof window.getThumbnailForHerb === 'function') ? window.getThumbnailForHerb : function () { return null; };
  herbs.forEach(function (herb) {
    var h = (typeof herb === 'object' && herb) ? herb : { id: herb, korean_name: String(herb) };
    var name = h.korean_name || h.id || '';
    var thumb = getThumb(h);
    var item = document.createElement('div');
    item.className = 'efficacy-3d-herb-panel-item';
    if (thumb) {
      var img = document.createElement('img');
      img.src = thumb;
      img.alt = name;
      img.loading = 'lazy';
      item.appendChild(img);
    } else {
      var ph = document.createElement('div');
      ph.className = 'efficacy-3d-herb-panel-placeholder';
      ph.textContent = (name || '?')[0];
      item.appendChild(ph);
    }
    var lbl = document.createElement('span');
    lbl.className = 'efficacy-3d-herb-panel-label';
    lbl.textContent = name || '';
    item.appendChild(lbl);
    herbPanelContainer.appendChild(item);
  });
  herbPanelContainer.style.display = 'flex';
}

function hideHerbNodes() {
  hideHerbPanel();
  if (!scene) return;
  herbLines.forEach(function (l) {
    scene.remove(l);
    for (var i = lineUpdates.length - 1; i >= 0; i--) {
      if (lineUpdates[i].line === l) { lineUpdates.splice(i, 1); break; }
    }
    if (l.geometry) l.geometry.dispose();
    if (l.material) l.material.dispose();
  });
  herbMeshes.forEach(function (m) {
    m.traverse(function (child) {
      if (child.element && child.element.parentNode) {
        child.element.parentNode.removeChild(child.element);
      }
    });
    scene.remove(m);
    var idx = nodeMeshes.indexOf(m);
    if (idx >= 0) nodeMeshes.splice(idx, 1);
    if (m.geometry) m.geometry.dispose();
    if (m.material) m.material.dispose();
  });
  herbMeshes = [];
  herbLines = [];
}

function hideSubCategoryNodes() {
  hideHerbNodes();
  subMeshes.forEach(function (m) {
    m.visible = false;
    if (m.material) m.material.opacity = 0;
    if (m.children[0]) m.children[0].visible = false;
  });
  subCategoryLines.forEach(function (l) {
    l.visible = false;
    if (l.material) l.material.opacity = 0;
  });
}

function showHerbNodesFor(subMesh) {
  hideHerbNodes();
  var data = subMesh.userData;
  var herbs = data.herbs || [];
  if (herbs.length === 0) return;
  var maxHerbs = Math.min(herbs.length, 24);
  showHerbPanel(herbs.slice(0, maxHerbs));
  var subColor = (subMesh.material && subMesh.material.color) ? subMesh.material.color.getHex() : 0x9acc9a;
  var subPos = subMesh.position.clone();
  var maxHerbs = Math.min(herbs.length, 24);
  var minHerbRadius = Math.max(20, (2 * 2 + 5) / (2 * Math.sin(Math.PI / maxHerbs)));
  herbs.slice(0, maxHerbs).forEach(function (herb, idx) {
    var herbName = (typeof herb === 'string') ? herb : (herb && (herb.korean_name || herb.id || '')) || '';
    var angle = (idx / maxHerbs) * Math.PI * 2 - Math.PI / 2;
    var orbitR = minHerbRadius + (idx % 4) * 2.2;
    var hx = subPos.x + Math.cos(angle) * orbitR;
    var hz = subPos.z + Math.sin(angle) * orbitR;
    var hy = subPos.y + Math.sin(angle * 1.2) * 1.5;
    var hPos = new THREE.Vector3(hx, hy, hz);
    var herbMesh = createMesh(3.5, subColor, 'herb');
    herbMesh.position.copy(hPos);
    herbMesh.userData.type = 'herb';
    herbMesh.userData.herbName = herbName;
    herbMesh.userData.herb = herb;
    herbMesh.userData.subMesh = subMesh;
    herbMesh.userData.efficacyTag = data.efficacyTag;
    herbMesh.userData.category = data.category;
    herbMesh.add(createLabel(herbName, 'herb', 0));
    if (herbMesh.children[0]) herbMesh.children[0].element.style.opacity = '1';
    scene.add(herbMesh);
    nodeMeshes.push(herbMesh);
    herbMeshes.push(herbMesh);
    var hLine = createLine(subMesh, herbMesh, subColor);
    hLine.userData = { from: subMesh, to: herbMesh };
    scene.add(hLine);
    herbLines.push(hLine);
  });
}


function showSubCategoryNodesFor(efficacyMesh) {
  hideSubCategoryNodes();
  var data = efficacyMesh.userData;
  if (!data.subMeshes) return;
  data.subMeshes.forEach(function (m) {
    m.visible = true;
    if (m.material) m.material.opacity = 1;
  });
  if (data.lines) {
    data.lines.forEach(function (l) {
      l.visible = true;
      if (l.material) l.material.opacity = 1;
    });
  }
}

function saveState() {
  return {
    selectedNode: selectedNode,
    targetCameraDistance: targetCameraDistance,
    targetPos: selectedNode ? selectedNode.position.clone() : null,
    cameraTarget: controls ? controls.target.clone() : null
  };
}

function restoreState(state) {
  if (!state) return;
  selectedNode = state.selectedNode;
  targetCameraDistance = state.selectedNode ? state.targetCameraDistance : defaultCameraDistance;
  if (state.cameraTarget && controls) controls.target.copy(state.cameraTarget);
  if (selectedNode) {
  var effFocus = selectedNode.userData.type === 'efficacy' ? selectedNode : null;
  var catFocus = selectedNode.userData.type === 'category' ? selectedNode : (selectedNode.userData.categoryMesh || (selectedNode.userData.efficacyMesh && selectedNode.userData.efficacyMesh.userData.categoryMesh) || null);
  var subFocus = selectedNode.userData.type === 'subCategory' ? selectedNode : null;
  efficacyMeshes.forEach(function (m) {
    var inCat = catFocus && (catFocus.userData.efficacyMeshes || []).indexOf(m) >= 0;
    var effFocused = m === effFocus || (catFocus && !effFocus && !subFocus && inCat);
    setFocusState(m, effFocused);
    m.scale.setScalar(m === effFocus ? (m.userData.baseScale || 1.5) : 1);
  });
  categoryMeshes.forEach(function (m) {
    setFocusState(m, m === catFocus);
    m.scale.setScalar(m === catFocus ? (m.userData.baseScale || 1.5) : 1);
  });
  subMeshes.forEach(function (m) {
    var inEff = effFocus && (effFocus.userData.subMeshes || []).indexOf(m) >= 0;
    setFocusState(m, m === subFocus || (effFocus && inEff));
  });
  if (selectedNode.userData.type === 'efficacy') {
    if (catFocus) showEfficacyNodesFor(catFocus);
    showSubCategoryNodesFor(selectedNode);
    hideHerbNodes();
  } else if (selectedNode.userData.type === 'category') {
    showEfficacyNodesFor(selectedNode);
    hideHerbNodes();
  } else if (selectedNode.userData.type === 'subCategory') {
    var effMesh = selectedNode.userData.efficacyMesh;
    var catMesh = effMesh && effMesh.userData.categoryMesh;
    if (catMesh) showEfficacyNodesFor(catMesh);
    if (effMesh) showSubCategoryNodesFor(effMesh);
    showHerbNodesFor(selectedNode);
  } else {
    hideSubCategoryNodes();
    hideEfficacyNodes();
    hideHerbNodes();
  }
  } else {
    efficacyMeshes.forEach(function (m) {
      setFocusState(m, true);
      m.scale.setScalar(1);
    });
    categoryMeshes.forEach(function (m) {
      setFocusState(m, true);
      m.scale.setScalar(1);
    });
    hideSubCategoryNodes();
    showAllEfficacyAsCircles();
  }
}

function getParentNode(node) {
  if (!node) return null;
  var t = node.userData && node.userData.type;
  if (t === 'herb') return node.userData.subMesh || null;
  if (t === 'subCategory') return node.userData.efficacyMesh || null;
  if (t === 'efficacy') return node.userData.categoryMesh || null;
  if (t === 'category') return INITIAL_VIEW;
  return null;
}

function goBack() {
  var parent = getParentNode(selectedNode);
  if (!parent) return;
  if (onBack) onBack();
  if (parent === INITIAL_VIEW) {
    restoreState({
      selectedNode: null,
      targetCameraDistance: defaultCameraDistance,
      cameraTarget: controls ? controls.target.clone() : null
    });
  } else {
    var distMap = { category: 45, efficacy: 35, subCategory: 22 };
    var targetDist = distMap[parent.userData && parent.userData.type] || defaultCameraDistance;
    restoreState({
      selectedNode: parent,
      targetCameraDistance: targetDist,
      cameraTarget: controls ? controls.target.clone() : null
    });
  }
  updateBackButton();
}

function updateBackButton() {
  var btn = document.getElementById('efficacy-3d-back-btn');
  if (!btn) return;
  if (topViewMode) return;
  var parent = selectedNode ? getParentNode(selectedNode) : null;
  var shouldHide = parent === null;
  btn.setAttribute('aria-hidden', shouldHide ? 'true' : 'false');
}

function onPointerClick(event) {
  if (!raycaster || !camera || !renderer) return;
  var dist = Math.hypot(event.clientX - lastPointerDownX, event.clientY - lastPointerDownY);
  if (dist > CLICK_DRAG_THRESHOLD) return;
  var rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  var intersects = raycaster.intersectObjects(nodeMeshes);
  if (intersects.length > 0) {
    var mesh = intersects[0].object;
    var data = mesh.userData;
    if (data.type === 'category') {
      if (selectedNode === mesh) {
        goBack();
        return;
      }
      if (onBack) onBack();
      selectedNode = mesh;
      hideSubCategoryNodes();
      showEfficacyNodesFor(mesh);
      targetCameraDistance = computeRequiredCameraDistanceForSelection(mesh);
      var effInCat = (mesh.userData.efficacyMeshes || []);
      efficacyMeshes.forEach(function (m) {
        setFocusState(m, effInCat.indexOf(m) >= 0);
        m.scale.setScalar(effInCat.indexOf(m) >= 0 ? (m.userData.baseScale || 1.5) : 1);
      });
      categoryMeshes.forEach(function (m) {
        setFocusState(m, m === mesh);
        if (m === mesh) {
          m.scale.setScalar(1.5);
          m.userData.baseScale = 1.5;
        } else {
          m.scale.setScalar(m.userData.baseScale || 1);
        }
      });
      updateBackButton();
    } else if (data.type === 'efficacy') {
      if (selectedNode === mesh) {
        goBack();
        return;
      }
      if (onBack) onBack();
      selectedNode = mesh;
      categoryMeshes.forEach(function (m) { setFocusState(m, false); });
      var effSubs = (mesh.userData.subMeshes || []);
      subMeshes.forEach(function (m) {
        setFocusState(m, effSubs.indexOf(m) >= 0);
      });
      showSubCategoryNodesFor(mesh);
      targetCameraDistance = computeRequiredCameraDistanceForSelection(mesh);
      efficacyMeshes.forEach(function (m) {
        setFocusState(m, m === mesh);
        if (m === mesh) {
          m.scale.setScalar(1.5);
          m.userData.baseScale = 1.5;
        } else {
          m.scale.setScalar(m.userData.baseScale || 1);
        }
      });
      updateBackButton();
    } else if (data.type === 'subCategory' && data.efficacyTag && data.category && data.herbs) {
      if (selectedNode === mesh) {
        goBack();
        return;
      }
      selectedNode = mesh;
      subMeshes.forEach(function (m) {
        setFocusState(m, m === mesh);
      });
      efficacyMeshes.forEach(function (m) { setFocusState(m, false); });
      categoryMeshes.forEach(function (m) { setFocusState(m, false); });
      showHerbNodesFor(mesh);
      targetCameraDistance = computeRequiredCameraDistanceForSelection(mesh);
      updateBackButton();
    }
  } else {
    if (onBack) onBack();
    selectedNode = null;
    targetCameraDistance = defaultCameraDistance;
    efficacyMeshes.forEach(function (m) {
      setFocusState(m, true);
      m.scale.setScalar(1);
    });
    categoryMeshes.forEach(function (m) {
      setFocusState(m, true);
      m.scale.setScalar(1);
    });
    hideSubCategoryNodes();
    hideHerbNodes();
    showAllEfficacyAsCircles();
    updateBackButton();
  }
}

function dispose() {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  animationFrameId = null;
  topViewMode = false;
  if (typeof document !== 'undefined' && document.body) {
    document.body.classList.remove('efficacy-top-view-mode');
  }
  if (efficacy2dApi && efficacy2dApi.dispose) efficacy2dApi.dispose();
  efficacy2dApi = null;
  window._efficacyUniverse2D = null;
  if (efficacy2dContainer && efficacy2dContainer.parentNode) {
    efficacy2dContainer.parentNode.removeChild(efficacy2dContainer);
  }
  efficacy2dContainer = null;
  if (herbPanelContainer && herbPanelContainer.parentNode) {
    herbPanelContainer.parentNode.removeChild(herbPanelContainer);
  }
  herbPanelContainer = null;
  if (renderer && renderer.domElement && renderer.domElement.parentNode) {
    renderer.domElement.parentNode.removeChild(renderer.domElement);
  }
  if (css2dRenderer && css2dRenderer.domElement && css2dRenderer.domElement.parentNode) {
    css2dRenderer.domElement.parentNode.removeChild(css2dRenderer.domElement);
  }
  topViewRingMeshes.forEach(function (m) {
    if (scene) scene.remove(m);
    if (m.geometry) m.geometry.dispose();
    if (m.material) m.material.dispose();
  });
  topViewRingMeshes = [];
  nodeMeshes = [];
  categoryMeshes = [];
  efficacyMeshes = [];
  subMeshes = [];
  herbMeshes = [];
  lineSegments = [];
  efficacyLines = [];
  herbLines = [];
  lineUpdates = [];
  subCategoryLines = [];
  categoryObjects = [];
  efficacyObjects = [];
  scene = null;
  camera = null;
  renderer = null;
  css2dRenderer = null;
  controls = null;
  selectedNode = null;
  targetCameraDistance = null;
}

function initEfficacyUniverse3D(container, options) {
  if (!container) return null;
  var universeData = options && options.universeData ? options.universeData : { categories: [] };
  onSubCategoryClick = options && options.onSubCategoryClick ? options.onSubCategoryClick : null;
  onBack = options && options.onBack ? options.onBack : null;

  if (window._efficacyUniverse3D) {
    window._efficacyUniverse3D.dispose();
  }

  /* 뷰 전환 직후 clientWidth가 0일 수 있음 - 최소값 보장 */
  var width = Math.max(container.clientWidth || 0, 400);
  var height = Math.max(container.clientHeight || 0, 400);

  scene = new THREE.Scene();
  scene.background = null;
  var ambientLight = new THREE.AmbientLight(0x404040, 0.6);
  scene.add(ambientLight);
  var dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
  dirLight.position.set(80, 150, 80);
  dirLight.castShadow = false;
  scene.add(dirLight);

  camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000);
  defaultCameraDistance = 180;
  camera.position.set(0, 90, 155);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  herbPanelContainer = document.createElement('div');
  herbPanelContainer.className = 'efficacy-3d-herb-panel';
  herbPanelContainer.style.display = 'none';
  container.appendChild(herbPanelContainer);

  css2dRenderer = new CSS2DRenderer();
  css2dRenderer.setSize(width, height);
  css2dRenderer.domElement.style.position = 'absolute';
  css2dRenderer.domElement.style.top = '0';
  css2dRenderer.domElement.style.left = '0';
  css2dRenderer.domElement.style.pointerEvents = 'none';
  css2dRenderer.domElement.style.zIndex = '2';
  container.appendChild(css2dRenderer.domElement);
  var btnWrap = document.createElement('div');
  btnWrap.className = 'efficacy-3d-btn-wrap';
  var zoomWrap = document.createElement('div');
  zoomWrap.className = 'efficacy-3d-zoom-wrap';
  var zoomInBtn = document.createElement('button');
  zoomInBtn.type = 'button';
  zoomInBtn.className = 'efficacy-3d-zoom-btn';
  zoomInBtn.textContent = '+';
  zoomInBtn.setAttribute('aria-label', '확대');
  zoomInBtn.addEventListener('click', function () {
    if (topViewMode && efficacy2dApi && typeof efficacy2dApi.zoomIn === 'function') {
      efficacy2dApi.zoomIn();
      return;
    }
    if (!camera || !controls) return;
    var offset = camera.position.clone().sub(controls.target);
    var dist = offset.length();
    var newDist = Math.max(15, dist * 0.8);
    offset.normalize().multiplyScalar(newDist);
    camera.position.copy(controls.target).add(offset);
    if (selectedNode) targetCameraDistance = newDist;
  });
  var zoomOutBtn = document.createElement('button');
  zoomOutBtn.type = 'button';
  zoomOutBtn.className = 'efficacy-3d-zoom-btn';
  zoomOutBtn.textContent = '−';
  zoomOutBtn.setAttribute('aria-label', '축소');
  zoomOutBtn.addEventListener('click', function () {
    if (topViewMode && efficacy2dApi && typeof efficacy2dApi.zoomOut === 'function') {
      efficacy2dApi.zoomOut();
      return;
    }
    if (!camera || !controls) return;
    var offset = camera.position.clone().sub(controls.target);
    var dist = offset.length();
    var newDist = Math.min(1500, dist * 1.25);
    offset.normalize().multiplyScalar(newDist);
    camera.position.copy(controls.target).add(offset);
    if (selectedNode) targetCameraDistance = newDist;
  });
  zoomWrap.appendChild(zoomInBtn);
  zoomWrap.appendChild(zoomOutBtn);
  var backBtn = document.createElement('button');
  backBtn.type = 'button';
  backBtn.id = 'efficacy-3d-back-btn';
  backBtn.className = 'efficacy-3d-back-btn';
  backBtn.innerHTML = '&lsaquo;';
  backBtn.setAttribute('aria-label', '상위로 돌아가기');
  backBtn.setAttribute('aria-hidden', 'true');
  backBtn.addEventListener('click', function () {
    if (topViewMode) {
      if (efficacy2dApi && typeof efficacy2dApi.goBack === 'function') {
        try {
          if (efficacy2dApi.goBack()) return;
        } catch (e) {
          console.warn('Efficacy 2D goBack error:', e);
        }
      }
      return;
    }
    goBack();
  });
  var leftGroup = document.createElement('div');
  leftGroup.className = 'efficacy-3d-btn-left';
  leftGroup.appendChild(backBtn);
  btnWrap.appendChild(leftGroup);
  btnWrap.appendChild(zoomWrap);
  container.appendChild(btnWrap);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 15;
  controls.maxDistance = 1500;
  controls.enableZoom = true;
  controls.zoomSpeed = 2.5;
  controls.enablePan = true;
  controls.panSpeed = 2.5;
  controls.screenSpacePanning = true;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.4;
  controls.mouseButtons = { LEFT: 2, MIDDLE: 1, RIGHT: 0 };

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  nodeMeshes = [];
  categoryMeshes = [];
  efficacyMeshes = [];
  subMeshes = [];
  efficacyLines = [];
  lineUpdates = [];
  subCategoryLines = [];

  var categories = universeData.categories || [];
  var catRadius = 160;
  var clusterMap = (typeof window !== 'undefined' && window.EFFICACY_CATEGORY_CLUSTERS) ? window.EFFICACY_CATEGORY_CLUSTERS : {};
  var clusterCount = 8;
  var clusterBaseAngles = {};
  for (var c = 0; c < clusterCount; c++) {
    clusterBaseAngles[c] = {
      theta: (c / clusterCount) * Math.PI * 2 + Math.PI * 0.3,
      phi: Math.acos(-0.3 + (c % 4) * 0.2)
    };
  }
  var clusterSubCount = {};

  categories.forEach(function (catObj) {
    var catKey = catObj.key;
    var efficacies = catObj.efficacies || [];
    var cluster = clusterMap[catKey] != null ? clusterMap[catKey] : 7;
    if (!clusterSubCount[cluster]) clusterSubCount[cluster] = 0;
    var subIdx = clusterSubCount[cluster]++;
    var subTotal = clusterSubCount[cluster];
    var base = clusterBaseAngles[cluster] || clusterBaseAngles[7];
    var thetaOffset = (subTotal > 1) ? (subIdx - (subTotal - 1) / 2) * 0.22 : 0;
    var phiOffset = (subTotal > 1) ? (subIdx - (subTotal - 1) / 2) * 0.12 : 0;
    var theta = base.theta + thetaOffset;
    var phi = base.phi + phiOffset;
    var r = catRadius;
    var catPos = sphericalToCartesian(r, theta, phi);

    var catColor = BODY_CATEGORY_COLORS[catKey] || 0x7aaa7a;
    var catMesh = createMesh(20, catColor, 'category');
    catMesh.position.copy(catPos);
    catMesh.userData.categoryKey = catKey;
    catMesh.userData.basePosition = catPos.clone();
    catMesh.userData.baseY = catPos.y;
    catMesh.userData.floatAmplitude = 2;
    catMesh.userData.floatSpeed = 0.4;
    catMesh.userData.baseScale = 1;
    catMesh.userData.efficacyMeshes = [];
    catMesh.userData.efficacyLines = [];
    catMesh.add(createLabel(catKey, 'category', 100));
    scene.add(catMesh);
    nodeMeshes.push(catMesh);
    categoryMeshes.push(catMesh);

    var effRadius = 105;
    var effCount = efficacies.length;
    efficacies.forEach(function (eff, effIdx) {
      var effAngle = (effIdx / Math.max(effCount, 1)) * Math.PI * 2 - Math.PI / 2;
      var effX = catPos.x + Math.cos(effAngle) * effRadius;
      var effZ = catPos.z + Math.sin(effAngle) * effRadius;
      var effY = catPos.y + Math.sin(effAngle * 1.2) * 4;
      var effPos = new THREE.Vector3(effX, effY, effZ);

      var effColor = catColor;
      var effMesh = createMesh(8, effColor, 'efficacy');
      effMesh.position.copy(effPos);
      effMesh.userData.basePosition = effPos.clone();
      effMesh.userData.baseY = effPos.y;
      effMesh.userData.floatAmplitude = 1.5;
      effMesh.userData.floatSpeed = 0.5;
      effMesh.userData.baseScale = 1;
      effMesh.userData.tag = eff.tag;
      effMesh.userData.groups = eff.groups || [];
      effMesh.userData.categoryMesh = catMesh;
      effMesh.add(createLabel(eff.tag, 'efficacy', 0));
      if (effMesh.children[0]) effMesh.children[0].visible = false;
      scene.add(effMesh);
      nodeMeshes.push(effMesh);
      efficacyMeshes.push(effMesh);
      catMesh.userData.efficacyMeshes.push(effMesh);

      var catLine = createLine(catMesh, effMesh, catColor);
      catLine.userData = { from: catMesh, to: effMesh };
      scene.add(catLine);
      efficacyLines.push(catLine);
      catMesh.userData.efficacyLines.push(catLine);

      var effSubMeshes = [];
      var effLines = [];
      var groups = eff.groups || [];
      var grpCount = groups.length;
      var minSubRadius = Math.max(24, (2 * 2.5 + 6) / (2 * Math.sin(Math.PI / Math.max(grpCount, 1))));
      groups.forEach(function (grp, grpIdx) {
        var angle = (grpIdx / Math.max(grpCount, 1)) * Math.PI * 2 - Math.PI / 2;
        var orbitR = minSubRadius + grpIdx * 2.8;
        var subX = effPos.x + Math.cos(angle) * orbitR;
        var subZ = effPos.z + Math.sin(angle) * orbitR;
        var subY = effPos.y + Math.sin(angle * 1.3) * 3;
        var subPos = new THREE.Vector3(subX, subY, subZ);
        var color = SUB_CATEGORY_COLORS[grp.category] || 0x8aaa8a;

        var subMesh = createMesh(4.5, color, 'subCategory');
        subMesh.position.copy(subPos);
        subMesh.userData.type = 'subCategory';
        subMesh.userData.efficacyTag = eff.tag;
        subMesh.userData.efficacyMesh = effMesh;
        subMesh.userData.category = grp.category;
        subMesh.userData.herbs = grp.herbs || [];
        subMesh.userData.basePosition = subPos.clone();
        subMesh.userData.orbitRadius = 1;
        subMesh.userData.orbitSpeed = 0.15 + (grpIdx % 3) * 0.04;
        subMesh.userData.orbitPhase = grpIdx * 0.5;
        subMesh.userData.baseScale = 1;
        subMesh.userData.label = grp.label || grp.category;
        subMesh.visible = false;
        subMesh.material.opacity = 0;
        subMesh.add(createLabel((grp.label || grp.category) + ' (' + (grp.herbs ? grp.herbs.length : 0) + ')', 'subcategory', 0));

        scene.add(subMesh);
        nodeMeshes.push(subMesh);
        subMeshes.push(subMesh);
        effSubMeshes.push(subMesh);

        var subLine = createLine(effMesh, subMesh, color);
        subLine.userData = { from: effMesh, to: subMesh };
        subLine.visible = false;
        subLine.material.opacity = 0;
        scene.add(subLine);
        subCategoryLines.push(subLine);
        effLines.push(subLine);
      });
      effMesh.userData.subMeshes = effSubMeshes;
      effMesh.userData.lines = effLines;
    });
  });

  renderer.domElement.addEventListener('pointerdown', onPointerDown, true);
  renderer.domElement.addEventListener('pointermove', onPointerMove);
  renderer.domElement.addEventListener('click', onPointerClick);

  var resizeHandler = function () {
    if (!camera || !renderer || !container) return;
    var w = Math.max(container.clientWidth || 0, 400);
    var h = Math.max(container.clientHeight || 0, 400);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    if (css2dRenderer) css2dRenderer.setSize(w, h);
  };
  window.addEventListener('resize', resizeHandler);
  /* 뷰 전환 후 컨테이너 크기 변경 시 리사이즈 (ResizeObserver) */
  var resizeObs = null;
  if (typeof ResizeObserver !== 'undefined') {
    resizeObs = new ResizeObserver(function () { resizeHandler(); });
    resizeObs.observe(container);
  }

  showAllEfficacyAsCircles();
  render();
  updateBackButton();
  /* Top view만 노출: 3D 제거, 2D 그래프만 표시 */
  topViewMode = true;
  if (typeof document !== 'undefined' && document.body) {
    document.body.classList.add('efficacy-top-view-mode');
  }
  hideHerbPanel();
  if (renderer && renderer.domElement) renderer.domElement.style.display = 'none';
  if (css2dRenderer && css2dRenderer.domElement) css2dRenderer.domElement.style.display = 'none';
  if (!efficacy2dContainer) {
    efficacy2dContainer = document.createElement('div');
    efficacy2dContainer.className = 'efficacy-2d-graph-wrap';
    efficacy2dContainer.style.cssText = 'position:absolute;inset:0;z-index:5;background:#fff;';
    container.appendChild(efficacy2dContainer);
  }
  efficacy2dContainer.style.display = 'block';
  var btnWrap = container.querySelector('.efficacy-3d-btn-wrap');
  if (btnWrap && btnWrap.parentNode === container) {
    efficacy2dContainer.insertBefore(btnWrap, efficacy2dContainer.firstChild);
  }
  if (efficacy2dApi) efficacy2dApi.dispose();
  efficacy2dApi = typeof window.buildEfficacy2DGraph === 'function'
    ? window.buildEfficacy2DGraph(efficacy2dContainer, universeData, onSubCategoryClick, function () {}, function (isDrilledDown) {
        var backBtn = document.getElementById('efficacy-3d-back-btn');
        if (backBtn) backBtn.setAttribute('aria-hidden', isDrilledDown ? 'false' : 'true');
      })
    : null;
  window._efficacyUniverse2D = efficacy2dApi;
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  animationFrameId = null;

  function findMatchingNodes(q) {
    if (!q || !q.trim()) return [];
    var lower = q.trim().toLowerCase();
    var matches = [];
    categoryMeshes.forEach(function (m) {
      var key = (m.userData && m.userData.categoryKey) ? m.userData.categoryKey : '';
      if (key && key.toLowerCase().indexOf(lower) >= 0) matches.push({ node: m, type: 'category' });
    });
    efficacyMeshes.forEach(function (m) {
      var tag = (m.userData && m.userData.tag) ? m.userData.tag : '';
      if (tag.toLowerCase().indexOf(lower) >= 0) matches.push({ node: m, type: 'efficacy' });
    });
    subMeshes.forEach(function (m) {
      var cat = (m.userData && m.userData.category) ? m.userData.category : '';
      var lbl = (m.userData && m.userData.label) ? m.userData.label : '';
      if ((cat && cat.toLowerCase().indexOf(lower) >= 0) || (lbl && lbl.toLowerCase().indexOf(lower) >= 0)) {
        matches.push({ node: m, type: 'subCategory' });
      } else {
        var herbs = m.userData && m.userData.herbs ? m.userData.herbs : [];
        for (var i = 0; i < herbs.length; i++) {
          var h = herbs[i];
          var name = (typeof h === 'object' && (h.korean_name || h.id)) ? String(h.korean_name || h.id) : String(h);
          if (name.toLowerCase().indexOf(lower) >= 0) {
            matches.push({ node: m, type: 'subCategory' });
            break;
          }
        }
      }
    });
    return matches;
  }

  function applySearchFocus(match) {
    if (!match || !match.node) return;
    var mesh = match.node;
    var data = mesh.userData;
    if (data.type === 'category') {
      if (onBack) onBack();
      selectedNode = mesh;
      hideSubCategoryNodes();
      showEfficacyNodesFor(mesh);
      targetCameraDistance = computeRequiredCameraDistanceForSelection(mesh);
      var effInCat = mesh.userData.efficacyMeshes || [];
      efficacyMeshes.forEach(function (m) {
        setFocusState(m, effInCat.indexOf(m) >= 0);
        m.scale.setScalar(effInCat.indexOf(m) >= 0 ? 1.5 : 1);
      });
      categoryMeshes.forEach(function (m) {
        setFocusState(m, m === mesh);
        m.scale.setScalar(m === mesh ? 1.5 : (m.userData.baseScale || 1));
      });
    } else if (data.type === 'efficacy') {
      if (onBack) onBack();
      selectedNode = mesh;
      categoryMeshes.forEach(function (m) { setFocusState(m, false); });
      var effSubs = mesh.userData.subMeshes || [];
      subMeshes.forEach(function (m) { setFocusState(m, effSubs.indexOf(m) >= 0); });
      showSubCategoryNodesFor(mesh);
      targetCameraDistance = computeRequiredCameraDistanceForSelection(mesh);
      efficacyMeshes.forEach(function (m) {
        setFocusState(m, m === mesh);
        m.scale.setScalar(m === mesh ? 1.5 : (m.userData.baseScale || 1));
      });
    } else if (data.type === 'subCategory') {
      var effMesh = data.efficacyMesh;
      if (effMesh) {
        if (onBack) onBack();
        selectedNode = effMesh;
        categoryMeshes.forEach(function (m) { setFocusState(m, false); });
        var effSubs = effMesh.userData.subMeshes || [];
        subMeshes.forEach(function (m) { setFocusState(m, effSubs.indexOf(m) >= 0); });
        showSubCategoryNodesFor(effMesh);
        targetCameraDistance = computeRequiredCameraDistanceForSelection(effMesh);
        efficacyMeshes.forEach(function (m) {
          setFocusState(m, m === effMesh);
          m.scale.setScalar(m === effMesh ? 1.5 : (m.userData.baseScale || 1));
        });
      }
    }
    if (controls) controls.target.copy(mesh.position);
    updateBackButton();
  }

  function clearSearchFocus() {
    restoreState({
      selectedNode: null,
      targetCameraDistance: defaultCameraDistance,
      cameraTarget: controls ? new THREE.Vector3(0, 0, 0) : null
    });
    showAllEfficacyAsCircles();
    hideSubCategoryNodes();
    categoryMeshes.forEach(function (m) {
      setFocusState(m, true);
      m.scale.setScalar(m.userData.baseScale || 1);
    });
    efficacyMeshes.forEach(function (m) {
      setFocusState(m, true);
      m.scale.setScalar(m.userData.baseScale || 1);
    });
    if (controls) controls.target.set(0, 0, 0);
    updateBackButton();
  }

  var api = {
    dispose: function () {
      if (renderer && renderer.domElement) {
        renderer.domElement.removeEventListener('pointerdown', onPointerDown, true);
        renderer.domElement.removeEventListener('pointermove', onPointerMove);
        renderer.domElement.removeEventListener('click', onPointerClick);
      }
      window.removeEventListener('resize', resizeHandler);
      if (resizeObs && container) resizeObs.unobserve(container);
      dispose();
    },
    search: function (q) {
      if (topViewMode && efficacy2dApi && typeof efficacy2dApi.search === 'function') {
        efficacy2dApi.search(q);
        return;
      }
      if (!q || !q.trim()) {
        clearSearchFocus();
        return;
      }
      var matches = findMatchingNodes(q);
      if (matches.length > 0) {
        var byType = { efficacy: [], category: [], subCategory: [] };
        matches.forEach(function (m) { if (byType[m.type]) byType[m.type].push(m); });
        var best = (byType.efficacy[0] || byType.category[0] || byType.subCategory[0]);
        if (best) applySearchFocus(best);
      } else {
        clearSearchFocus();
      }
    }
  };
  window._efficacyUniverse3D = api;
  return api;
}

window.initEfficacyUniverse3D = initEfficacyUniverse3D;

}
