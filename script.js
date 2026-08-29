/* =========================================================
   KIYOCHEM — MOLECULAR BUILDER
   PC EDITION
========================================================= */

/* =========================================================
   CANVAS & CONTEXT
========================================================= */

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const canvasArea = document.getElementById("canvasArea");

/* =========================================================
   ELEMENT DATA
========================================================= */

const elementData = {
    H: { name: "Hydrogen", atomicMass: 1.008, valenceElectrons: 1, commonBondOrder: 1 },
    C: { name: "Carbon", atomicMass: 12.011, valenceElectrons: 4, commonBondOrder: 4 },
    N: { name: "Nitrogen", atomicMass: 14.007, valenceElectrons: 5, commonBondOrder: 3 },
    O: { name: "Oxygen", atomicMass: 15.999, valenceElectrons: 6, commonBondOrder: 2 },
    F: { name: "Fluorine", atomicMass: 18.998, valenceElectrons: 7, commonBondOrder: 1 }
};

/* =========================================================
   MOLECULE STATE
========================================================= */

let atoms = [];
let bonds = [];
let nextAtomId = 0;
let selectedElement = "C";
let selectedAtom = null;
let selectedMoleculeIds = new Set();

/* =========================================================
   CAMERA & PANNING
========================================================= */

let zoom = 1;
let cameraX = 0;
let cameraY = 0;
let cameraInitialized = false;

let isPanning = false;
let panStartX = 0;
let panStartY = 0;
let panStartCameraX = 0;
let panStartCameraY = 0;

let draggingAtom = null;
let dragOffsetX = 0;
let dragOffsetY = 0;
let atomHasMoved = false;
let dragHistorySaved = false;

/* =========================================================
   BOND DRAG & HOVER STATE
========================================================= */

let bondingFromAtom = null;
let bondingFromSlot = null;
let bondPreviewPos = null;
let hoveredDot = null;

/* =========================================================
   HISTORY
========================================================= */

let undoStack = [];
let redoStack = [];
const MAX_HISTORY = 100;

/* =========================================================
   CHEMICAL 3D BOND GEOMETRY (2D PROJECTION)
========================================================= */

const connectionGeometry = {
    H: { count: 1, angles: [-90] },
    F: { count: 1, angles: [-90] },
    O: { count: 2, angles: [-52.25, 52.25] },
    N: { count: 3, angles: [-90, 30, 150] },
    C: { count: 4, angles: [-90, 0, 90, 180] }
};

/* =========================================================
   BASIC UTILITIES
========================================================= */

function getAtomById(id) {
    return atoms.find(atom => atom.id === id);
}

function getConnectedMoleculeIds(startAtomId) {
    const connected = new Set();
    const queue = [startAtomId];

    while (queue.length > 0) {
        const currentId = queue.shift();
        if (connected.has(currentId)) continue;
        connected.add(currentId);

        bonds.forEach(bond => {
            if (bond.atom1Id === currentId && !connected.has(bond.atom2Id)) {
                queue.push(bond.atom2Id);
            } else if (bond.atom2Id === currentId && !connected.has(bond.atom1Id)) {
                queue.push(bond.atom1Id);
            }
        });
    }

    return connected;
}

function getMousePosition(event) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
}

/* =========================================================
   HISTORY MANAGEMENT
========================================================= */

function makeSnapshot() {
    return JSON.stringify({ atoms, bonds, nextAtomId });
}

function saveHistory() {
    undoStack.push(makeSnapshot());
    if (undoStack.length > MAX_HISTORY) undoStack.shift();
    redoStack = [];
    updateHistoryButtons();
}

function restoreSnapshot(snapshot) {
    const state = JSON.parse(snapshot);
    atoms = Array.isArray(state.atoms) ? state.atoms : [];
    bonds = Array.isArray(state.bonds) ? state.bonds : [];
    nextAtomId = Number.isFinite(state.nextAtomId) ? state.nextAtomId : atoms.length;

    selectedAtom = null;
    selectedMoleculeIds.clear();
    bondingFromAtom = null;
    bondingFromSlot = null;
    bondPreviewPos = null;
    hoveredDot = null;

    updateAnalysis();
    redraw();
}

function undo() {
    if (undoStack.length === 0) return;
    redoStack.push(makeSnapshot());
    restoreSnapshot(undoStack.pop());
    updateHistoryButtons();
}

function redo() {
    if (redoStack.length === 0) return;
    undoStack.push(makeSnapshot());
    restoreSnapshot(redoStack.pop());
    updateHistoryButtons();
}

function updateHistoryButtons() {
    const undoBtn = document.getElementById("undoBtn");
    const redoBtn = document.getElementById("redoBtn");
    if (undoBtn) undoBtn.disabled = undoStack.length === 0;
    if (redoBtn) redoBtn.disabled = redoStack.length === 0;
}

const undoButton = document.getElementById("undoBtn");
const redoButton = document.getElementById("redoBtn");
if (undoButton) undoButton.addEventListener("click", undo);
if (redoButton) redoButton.addEventListener("click", redo);

/* =========================================================
   ELEMENT SELECTION (SIDEBAR)
========================================================= */

document.querySelectorAll(".element-btn").forEach(button => {
    button.addEventListener("click", () => {
        document.querySelectorAll(".element-btn").forEach(other => other.classList.remove("active"));
        button.classList.add("active");
        selectedElement = button.dataset.element;
    });
});

/* =========================================================
   CANVAS RESIZING & COORDINATE CONVERSIONS
========================================================= */

function resizeCanvas() {
    const rect = canvasArea.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));

    canvas.style.width = rect.width + "px";
    canvas.style.height = rect.height + "px";

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (!cameraInitialized) {
        cameraX = rect.width / 2;
        cameraY = rect.height / 2;
        cameraInitialized = true;
    }

    redraw();
}

window.addEventListener("resize", resizeCanvas);

function screenToWorld(screenX, screenY) {
    return {
        x: (screenX - cameraX) / zoom,
        y: (screenY - cameraY) / zoom
    };
}

function worldToScreen(worldX, worldY) {
    return {
        x: worldX * zoom + cameraX,
        y: worldY * zoom + cameraY
    };
}

/* =========================================================
   BOND & SLOT CALCULATIONS
========================================================= */

function bondOrderSum(atomId) {
    return bonds.reduce((total, bond) => {
        if (bond.atom1Id === atomId || bond.atom2Id === atomId) {
            return total + bond.order;
        }
        return total;
    }, 0);
}

function sigmaBondCount(atomId) {
    return bonds.filter(bond => bond.atom1Id === atomId || bond.atom2Id === atomId).length;
}

function findBond(atom1Id, atom2Id) {
    return bonds.find(bond =>
        (bond.atom1Id === atom1Id && bond.atom2Id === atom2Id) ||
        (bond.atom1Id === atom2Id && bond.atom2Id === atom1Id)
    );
}

function getSlotPosition(atom, slot) {
    const { connectionAngles } = getDynamicPositions(atom);
    const angle = connectionAngles[slot] !== undefined ? connectionAngles[slot] : -Math.PI / 2;
    const distance = 36;

    return {
        x: atom.x + Math.cos(angle) * distance,
        y: atom.y + Math.sin(angle) * distance,
        angleRad: angle
    };
}

function getUsedSlots(atomId) {
    const used = new Set();
    for (const bond of bonds) {
        if (bond.atom1Id === atomId && Number.isInteger(bond.atom1Slot)) used.add(bond.atom1Slot);
        if (bond.atom2Id === atomId && Number.isInteger(bond.atom2Slot)) used.add(bond.atom2Slot);
    }
    return used;
}

function findFreeSlot(atom, targetX, targetY) {
    const { connectionAngles } = getDynamicPositions(atom);
    if (connectionAngles.length === 0) return null;

    const usedSlots = getUsedSlots(atom.id);
    let bestSlot = null;
    let bestDistance = Infinity;

    for (let slot = 0; slot < connectionAngles.length; slot++) {
        if (usedSlots.has(slot)) continue;

        const point = getSlotPosition(atom, slot);
        const distance = Math.hypot(point.x - targetX, point.y - targetY);

        if (distance < bestDistance) {
            bestDistance = distance;
            bestSlot = slot;
        }
    }

    return bestSlot;
}

/* =========================================================
   DYNAMIC POSITIONS (DOTS & LONE PAIRS)
========================================================= */

function calculateElectronState(atom) {
    const data = elementData[atom.element];
    if (!data) return { lonePairs: 0, unpaired: 0, nonBondingDomains: 0 };

    const currentBondSum = bondOrderSum(atom.id);
    const freeValence = Math.max(0, data.valenceElectrons - currentBondSum);

    // Standard Lewis dot partitioning for unbonded/partially bonded atoms:
    // Single electrons fill up to 4 positions first; additional electrons form lone pairs.
    let lonePairs = 0;
    let unpaired = 0;

    if (freeValence <= 4) {
        unpaired = freeValence;
        lonePairs = 0;
    } else {
        lonePairs = freeValence - 4;
        unpaired = 4 - lonePairs;
    }

    const nonBondingDomains = lonePairs + (unpaired > 0 ? 1 : 0);

    return { lonePairs, unpaired, nonBondingDomains };
}

function getDynamicPositions(atom) {
    const data = elementData[atom.element];
    if (!data) return { lonePairAngles: [], connectionAngles: [] };

    const baseAngles = [
        -Math.PI / 2,
        0,
        Math.PI / 2,
        Math.PI
    ];

    const occupiedAngles = bonds.map(bond => {
        let other = null;
        if (bond.atom1Id === atom.id) other = getAtomById(bond.atom2Id);
        else if (bond.atom2Id === atom.id) other = getAtomById(bond.atom1Id);
        return other ? Math.atan2(other.y - atom.y, other.x - atom.x) : null;
    }).filter(angle => angle !== null);

    let availableAngles = [...baseAngles];

    if (occupiedAngles.length === 1) {
        const primaryBondAngle = occupiedAngles[0];
        const oppositeAngle = primaryBondAngle + Math.PI;

        availableAngles = [
            oppositeAngle,
            oppositeAngle + Math.PI / 2,
            oppositeAngle - Math.PI / 2,
            primaryBondAngle
        ];
    }

    const freeAngles = availableAngles.filter(candidateAngle => {
        if (occupiedAngles.length === 0) return true;
        return !occupiedAngles.some(bondAngle => {
            let diff = Math.abs(candidateAngle - bondAngle) % (Math.PI * 2);
            if (diff > Math.PI) diff = Math.PI * 2 - diff;
            return diff < Math.PI / 4;
        });
    });

    const electronState = calculateElectronState(atom);
    const lpCount = electronState.lonePairs;
    const bondOrder = bondOrderSum(atom.id);
    const openSlotsCount = Math.max(0, data.commonBondOrder - bondOrder);

    const lonePairAngles = freeAngles.slice(0, lpCount);
    const connectionAngles = freeAngles.slice(lpCount, lpCount + openSlotsCount);

    return { lonePairAngles, connectionAngles };
}

/* =========================================================
   HIT TESTS
========================================================= */

function findAtomAtScreen(screenX, screenY) {
    const world = screenToWorld(screenX, screenY);
    for (let i = atoms.length - 1; i >= 0; i--) {
        const atom = atoms[i];
        if (Math.hypot(atom.x - world.x, atom.y - world.y) <= 23) {
            return atom;
        }
    }
    return null;
}

function findConnectionDotAtScreen(screenX, screenY) {
    const world = screenToWorld(screenX, screenY);

    for (let i = atoms.length - 1; i >= 0; i--) {
        const atom = atoms[i];
        const data = elementData[atom.element];
        const totalBondOrder = bondOrderSum(atom.id);

        if (data && totalBondOrder >= data.commonBondOrder) continue;

        const { connectionAngles } = getDynamicPositions(atom);

        for (let slot = 0; slot < connectionAngles.length; slot++) {
            const angle = connectionAngles[slot];
            const dist = 36;

            const slotWorldPos = {
                x: atom.x + Math.cos(angle) * dist,
                y: atom.y + Math.sin(angle) * dist
            };

            if (Math.hypot(slotWorldPos.x - world.x, slotWorldPos.y - world.y) <= 12 / zoom) {
                return { atom, slot };
            }
        }
    }
    return null;
}

function findBondAtScreen(screenX, screenY) {
    const world = screenToWorld(screenX, screenY);
    const tolerance = 10 / zoom;

    for (let i = bonds.length - 1; i >= 0; i--) {
        const bond = bonds[i];
        const atom1 = getAtomById(bond.atom1Id);
        const atom2 = getAtomById(bond.atom2Id);

        if (!atom1 || !atom2) continue;

        const p1 = { x: atom1.x, y: atom1.y };
        const p2 = { x: atom2.x, y: atom2.y };

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const lengthSquared = dx * dx + dy * dy;

        if (lengthSquared === 0) continue;

        const t = Math.max(0, Math.min(1, ((world.x - p1.x) * dx + (world.y - p1.y) * dy) / lengthSquared));
        const closestX = p1.x + dx * t;
        const closestY = p1.y + dy * t;

        if (Math.hypot(world.x - closestX, world.y - closestY) <= tolerance) {
            return bond;
        }
    }
    return null;
}

/* =========================================================
   BOND CREATION & ACTIONS
========================================================= */

function cycleBondOrder(bond) {
    if (!bond) return;

    const atom1 = getAtomById(bond.atom1Id);
    const atom2 = getAtomById(bond.atom2Id);
    if (!atom1 || !atom2) return;

    const nextOrder = bond.order >= 3 ? 1 : bond.order + 1;
    const atom1Limit = elementData[atom1.element].commonBondOrder;
    const atom2Limit = elementData[atom2.element].commonBondOrder;
    const increase = nextOrder - bond.order;

    if (bondOrderSum(atom1.id) + increase > atom1Limit) {
        showWarning(`${atom1.element} cannot accept a higher bond order.`);
        return;
    }

    if (bondOrderSum(atom2.id) + increase > atom2Limit) {
        showWarning(`${atom2.element} cannot accept a higher bond order.`);
        return;
    }

    saveHistory();

    bond.order = nextOrder;
    selectedAtom = atom2.id;
    selectedMoleculeIds = getConnectedMoleculeIds(atom2.id);

    updateAnalysis();
    redraw();
}

function createAtom(x, y) {
    saveHistory();
    const atom = {
        id: nextAtomId++,
        element: selectedElement,
        x,
        y
    };
    atoms.push(atom);
    selectedAtom = atom.id;

    updateAnalysis();
    redraw();
}

function deleteSelectedAtom() {
    if (selectedAtom === null) return;
    const exists = getAtomById(selectedAtom);
    if (!exists) {
        selectedAtom = null;
        return;
    }

    saveHistory();
    bonds = bonds.filter(bond => bond.atom1Id !== selectedAtom && bond.atom2Id !== selectedAtom);
    atoms = atoms.filter(atom => atom.id !== selectedAtom);
    selectedAtom = null;

    updateAnalysis();
    redraw();
}

function createBond(atom1, atom2, slot1, slot2) {
    if (!atom1 || !atom2 || atom1.id === atom2.id) return;

    const existing = findBond(atom1.id, atom2.id);

    if (existing) {
        const nextOrder = existing.order + 1;
        if (nextOrder > 3) {
            showWarning("Maximum displayed bond order is 3.");
            return;
        }

        const atom1Limit = elementData[atom1.element].commonBondOrder;
        const atom2Limit = elementData[atom2.element].commonBondOrder;

        if (bondOrderSum(atom1.id) + 1 > atom1Limit) {
            showWarning(`${atom1.element} cannot accept a higher bond order.`);
            return;
        }

        if (bondOrderSum(atom2.id) + 1 > atom2Limit) {
            showWarning(`${atom2.element} cannot accept a higher bond order.`);
            return;
        }

        saveHistory();
        existing.order = nextOrder;
        selectedAtom = atom2.id;

        updateAnalysis();
        redraw();
        return;
    }

    if (bondOrderSum(atom1.id) + 1 > elementData[atom1.element].commonBondOrder) {
        showWarning(`${atom1.element} has no available bonding capacity.`);
        return;
    }

    if (bondOrderSum(atom2.id) + 1 > elementData[atom2.element].commonBondOrder) {
        showWarning(`${atom2.element} has no available bonding capacity.`);
        return;
    }

    saveHistory();
    bonds.push({
        atom1Id: atom1.id,
        atom2Id: atom2.id,
        order: 1,
        atom1Slot: slot1,
        atom2Slot: slot2
    });

    selectedAtom = atom2.id;
    updateAnalysis();
    redraw();
}

function finishBondDrag(screenX, screenY) {
    if (!bondingFromAtom) return;

    const targetAtom = findAtomAtScreen(screenX, screenY);
    if (!targetAtom || targetAtom.id === bondingFromAtom.id) return;

    const existing = findBond(bondingFromAtom.id, targetAtom.id);
    if (existing) {
        createBond(bondingFromAtom, targetAtom, existing.atom1Slot, existing.atom2Slot);
        return;
    }

    const targetSlot = findFreeSlot(targetAtom, bondingFromAtom.x, bondingFromAtom.y);
    createBond(bondingFromAtom, targetAtom, bondingFromSlot, targetSlot);
}

/* =========================================================
   WARNING SYSTEM
========================================================= */

function showWarning(message) {
    const warnings = document.getElementById("warnings");
    if (!warnings) return;

    warnings.innerHTML = `<div class="warning">⚠ ${message}</div>`;
    clearTimeout(showWarning.timer);

    showWarning.timer = setTimeout(() => {
        warnings.innerHTML = "";
    }, 2500);
}

/* =========================================================
   MOUSE EVENTS
========================================================= */

canvas.addEventListener("mousedown", event => {
    const { x, y } = getMousePosition(event);

    if (event.button === 2) {
        isPanning = true;
        panStartX = x;
        panStartY = y;
        panStartCameraX = cameraX;
        panStartCameraY = cameraY;
        canvas.style.cursor = "grabbing";
        return;
    }

    if (event.button !== 0) return;

    // 1. Check connection dots first
const dot = findConnectionDotAtScreen(x, y);

if (dot) {
    bondingFromAtom = dot.atom;
    bondingFromSlot = dot.slot;
    bondPreviewPos = { x, y };
    return;
}

// 2. Check atoms BEFORE bonds
const atom = findAtomAtScreen(x, y);

if (atom) {
    selectedAtom = atom.id;
    selectedMoleculeIds = getConnectedMoleculeIds(atom.id);

    const world = screenToWorld(x, y);

    draggingAtom = atom;
    dragOffsetX = atom.x - world.x;
    dragOffsetY = atom.y - world.y;

    atomHasMoved = false;
    dragHistorySaved = false;

    updateAnalysis();
    redraw();
    return;
}

// 3. Only check bonds if we didn't click an atom
const clickedBond = findBondAtScreen(x, y);

if (clickedBond) {
    cycleBondOrder(clickedBond);
    return;
}
    if (atom) {
        selectedAtom = atom.id;
        selectedMoleculeIds = getConnectedMoleculeIds(atom.id);

        const world = screenToWorld(x, y);
        draggingAtom = atom;
        dragOffsetX = atom.x - world.x;
        dragOffsetY = atom.y - world.y;

        atomHasMoved = false;
        dragHistorySaved = false;

        updateAnalysis();
        redraw();
        return;
    }

    const world = screenToWorld(x, y);
    createAtom(world.x, world.y);
});

canvas.addEventListener("mousemove", event => {
    const { x, y } = getMousePosition(event);

    if (isPanning) {
        cameraX = panStartCameraX + (x - panStartX);
        cameraY = panStartCameraY + (y - panStartY);
        redraw();
        return;
    }

    if (bondingFromAtom) {
        bondPreviewPos = { x, y };
        redraw();
        return;
    }

    if (draggingAtom) {
        const world = screenToWorld(x, y);
        const newX = world.x + dragOffsetX;
        const newY = world.y + dragOffsetY;

        if (Math.hypot(newX - draggingAtom.x, newY - draggingAtom.y) > 1) {
            atomHasMoved = true;
        }

        if (atomHasMoved && !dragHistorySaved) {
            saveHistory();
            dragHistorySaved = true;
        }

        if (atomHasMoved) {
            draggingAtom.x = newX;
            draggingAtom.y = newY;
            updateAnalysis();
            redraw();
        }
        return;
    }

    hoveredDot = findConnectionDotAtScreen(x, y);
    canvas.style.cursor = hoveredDot ? "crosshair" : "default";
    redraw();
});

window.addEventListener("mouseup", event => {
    if (event.button === 2) {
        isPanning = false;
        canvas.style.cursor = "default";
    }

    if (bondingFromAtom) {
        const rect = canvas.getBoundingClientRect();
        finishBondDrag(event.clientX - rect.left, event.clientY - rect.top);

        bondingFromAtom = null;
        bondingFromSlot = null;
        bondPreviewPos = null;
        redraw();
    }

    if (draggingAtom) {
        draggingAtom = null;
        atomHasMoved = false;
        dragHistorySaved = false;
        redraw();
    }
});

canvas.addEventListener("contextmenu", event => event.preventDefault());

/* =========================================================
   ZOOM CONTROLS
========================================================= */

canvas.addEventListener("wheel", event => {
    event.preventDefault();
    const { x, y } = getMousePosition(event);

    const worldBefore = screenToWorld(x, y);
    const zoomFactor = event.deltaY < 0 ? 1.12 : 0.89;

    zoom *= zoomFactor;
    zoom = Math.max(0.20, Math.min(5, zoom));

    cameraX = x - worldBefore.x * zoom;
    cameraY = y - worldBefore.y * zoom;

    updateZoomDisplay();
    redraw();
}, { passive: false });

function updateZoomDisplay() {
    const display = document.getElementById("zoomDisplay");
    if (display) {
        display.textContent = Math.round(zoom * 100) + "%";
    }
}

/* =========================================================
   KEYBOARD SHORTCUTS
========================================================= */

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        bondingFromAtom = null;
        bondingFromSlot = null;
        bondPreviewPos = null;
        redraw();
        return;
    }

    if (event.ctrlKey && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
        return;
    }

    if (event.ctrlKey && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
        return;
    }

    if (event.key === "Delete") {
        deleteSelectedAtom();
    }
});

/* =========================================================
   CLEAR CANVAS
========================================================= */

const clearButton = document.getElementById("clearBtn");
if (clearButton) {
    clearButton.addEventListener("click", () => {
        if (atoms.length === 0 && bonds.length === 0) return;

        saveHistory();
        atoms = [];
        bonds = [];
        nextAtomId = 0;
        selectedAtom = null;

        updateAnalysis();
        redraw();
    });
}

/* =========================================================
   CANVAS RENDERING
========================================================= */

function drawGrid() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const gridSize = 40 * zoom;

    if (gridSize < 7) return;

    const startX = ((cameraX % gridSize) + gridSize) % gridSize;
    const startY = ((cameraY % gridSize) + gridSize) % gridSize;

    ctx.beginPath();
    ctx.strokeStyle = "rgba(80,150,220,0.055)";
    ctx.lineWidth = 1;

    for (let x = startX; x < width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
    }
    for (let y = startY; y < height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
    }
    ctx.stroke();

    const majorGrid = gridSize * 5;
    const majorStartX = ((cameraX % majorGrid) + majorGrid) % majorGrid;
    const majorStartY = ((cameraY % majorGrid) + majorGrid) % majorGrid;

    ctx.beginPath();
    ctx.strokeStyle = "rgba(80,150,220,0.10)";

    for (let x = majorStartX; x < width; x += majorGrid) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
    }
    for (let y = majorStartY; y < height; y += majorGrid) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
    }
    ctx.stroke();
}

function drawBonds() {
    bonds.forEach(bond => {
        const atom1 = getAtomById(bond.atom1Id);
        const atom2 = getAtomById(bond.atom2Id);

        if (!atom1 || !atom2) return;

        const p1 = worldToScreen(atom1.x, atom1.y);
        const p2 = worldToScreen(atom2.x, atom2.y);

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const length = Math.hypot(dx, dy);

        if (length === 0) return;

        const perpendicularX = -dy / length;
        const perpendicularY = dx / length;
        const gap = Math.max(3, 4 * Math.min(zoom, 1.5));

        let offsets;
        if (bond.order === 1) offsets = [0];
        else if (bond.order === 2) offsets = [-gap, gap];
        else offsets = [-gap * 1.5, 0, gap * 1.5];

        const moleculeSelected = selectedMoleculeIds.has(atom1.id) && selectedMoleculeIds.has(atom2.id);

        ctx.save();
        if (moleculeSelected) {
            ctx.strokeStyle = "#66c7ff";
            ctx.shadowColor = "rgba(70,190,255,1)";
            ctx.shadowBlur = 18;
            ctx.lineWidth = Math.max(2.2, 2.8 * Math.min(zoom, 1.5));
        } else {
            ctx.strokeStyle = "#4298ff";
            ctx.shadowColor = "rgba(36,156,255,0.55)";
            ctx.shadowBlur = 7;
            ctx.lineWidth = Math.max(1.5, 2.2 * Math.min(zoom, 1.5));
        }

        ctx.lineCap = "round";

        offsets.forEach(offset => {
            ctx.beginPath();
            ctx.moveTo(p1.x + perpendicularX * offset, p1.y + perpendicularY * offset);
            ctx.lineTo(p2.x + perpendicularX * offset, p2.y + perpendicularY * offset);
            ctx.stroke();
        });

        ctx.restore();
    });
}

function drawBondPreview() {
    if (!bondingFromAtom || !bondPreviewPos) return;

    const start = getSlotPosition(bondingFromAtom, bondingFromSlot);
    const p1 = worldToScreen(start.x, start.y);

    if (Math.hypot(bondPreviewPos.x - p1.x, bondPreviewPos.y - p1.y) < 1) return;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(bondPreviewPos.x, bondPreviewPos.y);

    ctx.strokeStyle = "#3399ff";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.shadowColor = "rgba(51,153,255,0.8)";
    ctx.shadowBlur = 8;

    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
}

function drawConnectionDots(atom, position) {
    const data = elementData[atom.element];
    if (!data) return;

    const currentBondSum = bondOrderSum(atom.id);
    if (currentBondSum >= data.commonBondOrder) return;

    const { connectionAngles } = getDynamicPositions(atom);

    connectionAngles.forEach((angle, idx) => {
        const dist = 36;
        const worldPoint = {
            x: atom.x + Math.cos(angle) * dist,
            y: atom.y + Math.sin(angle) * dist
        };
        const point = worldToScreen(worldPoint.x, worldPoint.y);

        const isHovered = hoveredDot && hoveredDot.atom.id === atom.id && hoveredDot.slot === idx;
        const radius = isHovered ? 6 : 4;

        ctx.save();
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = isHovered ? "#68c0ff" : "#3399ff";
        ctx.shadowColor = "rgba(51,153,255,0.95)";
        ctx.shadowBlur = isHovered ? 14 : 8;
        ctx.fill();
        ctx.restore();
    });
}

function drawLonePairs(atom, position) {
    const { lonePairAngles } = getDynamicPositions(atom);
    if (lonePairAngles.length === 0) return;

    lonePairAngles.forEach(angleRad => {
        const dist = 34;

        const cx = atom.x + Math.cos(angleRad) * dist;
        const cy = atom.y + Math.sin(angleRad) * dist;

        const perpX = -Math.sin(angleRad) * 4;
        const perpY = Math.cos(angleRad) * 4;

        const p1 = worldToScreen(cx + perpX, cy + perpY);
        const p2 = worldToScreen(cx - perpX, cy - perpY);

        ctx.save();
        ctx.fillStyle = "#9a6cff";
        ctx.shadowColor = "rgba(154,108,255,0.85)";
        ctx.shadowBlur = 8;

        ctx.beginPath();
        ctx.arc(p1.x, p1.y, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p2.x, p2.y, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    });
}

function drawAtoms() {
    atoms.forEach(atom => {
        const position = worldToScreen(atom.x, atom.y);
        const scale = Math.max(0.65, Math.min(1.25, zoom));
        const radius = 21 * scale;

        let borderColor = "#249cff";
        if (atom.element === "O") borderColor = "#ff5369";
        else if (atom.element === "N") borderColor = "#967fff";
        else if (atom.element === "F") borderColor = "#4be0aa";
        else if (atom.element === "H") borderColor = "#c4d1e0";

        if (selectedAtom === atom.id) {
            ctx.beginPath();
            ctx.arc(position.x, position.y, radius + 7, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(36,156,255,0.55)";
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(position.x, position.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = "#0b121d";
        ctx.shadowColor = borderColor;
        ctx.shadowBlur = 17;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.beginPath();
        ctx.arc(position.x, position.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = `bold ${Math.max(14, 17 * scale)}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(atom.element, position.x, position.y);
        ctx.restore();

        drawConnectionDots(atom, position);
        drawLonePairs(atom, position);
    });
}

function redraw() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#070b11";
    ctx.fillRect(0, 0, width, height);

    drawGrid();
    drawBonds();
    drawBondPreview();
    drawAtoms();
    updateZoomDisplay();
}

/* =========================================================
   FORMULA & MASS CALCULATIONS
========================================================= */

function getFormula() {
    if (atoms.length === 0) return "—";
    if (atoms.length === 1) return atoms[0].element;

    const connected = new Set();
    function visit(atomId) {
        if (connected.has(atomId)) return;
        connected.add(atomId);
        bonds.forEach(bond => {
            if (bond.atom1Id === atomId) visit(bond.atom2Id);
            else if (bond.atom2Id === atomId) visit(bond.atom1Id);
        });
    }

    visit(atoms[0].id);
    if (connected.size !== atoms.length) return "Disconnected";

    const counts = {};
    atoms.forEach(atom => {
        counts[atom.element] = (counts[atom.element] || 0) + 1;
    });

    const order = ["C", "H", "N", "O", "F"];
    let formula = "";

    order.forEach(element => {
        if (!counts[element]) return;
        formula += element;
        if (counts[element] > 1) formula += counts[element];
    });

    return formula || "—";
}

function getMolecularMass() {
    return atoms.reduce((total, atom) => {
        const data = elementData[atom.element];
        return total + (data ? data.atomicMass : 0);
    }, 0);
}

/* =========================================================
   UPDATED VSEPR GEOMETRY LOGIC
========================================================= */

function calculateGeometry(atom) {
    const bondOrder = bondOrderSum(atom.id);

    if (bondOrder === 0) {
        return {
            domains: 0,
            lonePairs: 0,
            electronGeometry: "N/A",
            molecularGeometry: "N/A",
            bondAngle: "N/A"
        };
    }

    const sigmaBonds = sigmaBondCount(atom.id);
    const electronState = calculateElectronState(atom);
    const lonePairs = electronState.lonePairs;

    const domains = sigmaBonds + electronState.nonBondingDomains;

    let electronGeometry = "Unknown";
    let molecularGeometry = "Unknown";
    let bondAngle = "Unknown";

    if (domains === 1 || domains === 2) {
        electronGeometry = "Linear";
        molecularGeometry = "Linear";
        bondAngle = "180°";
    } else if (domains === 3) {
        electronGeometry = "Trigonal planar";
        if (lonePairs === 0) {
            molecularGeometry = "Trigonal planar";
            bondAngle = "~120°";
        } else if (lonePairs === 1) {
            molecularGeometry = "Bent";
            bondAngle = "<120°";
        }
    } else if (domains === 4) {
        electronGeometry = "Tetrahedral";
        if (lonePairs === 0) {
            molecularGeometry = "Tetrahedral";
            bondAngle = "~109.5°";
        } else if (lonePairs === 1) {
            molecularGeometry = "Trigonal pyramidal";
            bondAngle = "~107°";
        } else if (lonePairs === 2) {
            molecularGeometry = "Bent";
            bondAngle = "~104.5°";
        }
    }

    return { domains, lonePairs, electronGeometry, molecularGeometry, bondAngle };
}

/* =========================================================
   ANALYSIS & WARNINGS
========================================================= */

function getAtomAnalysisHTML(atom) {
    const data = elementData[atom.element];
    const bondOrder = bondOrderSum(atom.id);
    const sigmaBonds = sigmaBondCount(atom.id);
    const electronState = calculateElectronState(atom);
    const geometry = calculateGeometry(atom);

    let valenceStatusText = "✓ Common valence satisfied";
    let valenceClass = "good";

    if (bondOrder > data.commonBondOrder) {
        valenceStatusText = "⚠ Common valence exceeded";
        valenceClass = "bad";
    } else if (bondOrder < data.commonBondOrder) {
        valenceStatusText = "⚠ Incomplete octet / Radical";
        valenceClass = "bad";
    }

    return `
        <strong>${data.name} (${atom.element})</strong><br>
        Valence electrons: <strong>${data.valenceElectrons}</strong><br>
        Bond order: <strong>${bondOrder}</strong><br>
        Sigma bonds: <strong>${sigmaBonds}</strong><br>
        Lone pairs: <strong class="lonePair">${electronState.lonePairs}</strong><br>
        Unpaired electrons: <strong>${electronState.unpaired}</strong><br>
        Electron domains: <strong>${geometry.domains}</strong>
        <hr>
        Electron geometry: <strong>${geometry.electronGeometry}</strong><br>
        Molecular geometry: <strong>${geometry.molecularGeometry}</strong><br>
        Typical bond angle: <strong>${geometry.bondAngle}</strong>
        <hr>
        <span class="${valenceClass}">${valenceStatusText}</span>
    `;
}

function getSelectedMoleculeInfo() {
    if (selectedMoleculeIds.size === 0) return null;

    const moleculeAtoms = atoms.filter(atom => selectedMoleculeIds.has(atom.id));
    const moleculeBonds = bonds.filter(bond => selectedMoleculeIds.has(bond.atom1Id) && selectedMoleculeIds.has(bond.atom2Id));

    const counts = {};
    moleculeAtoms.forEach(atom => {
        counts[atom.element] = (counts[atom.element] || 0) + 1;
    });

    const order = ["C", "H", "N", "O", "F"];
    let formula = "";

    order.forEach(element => {
        if (!counts[element]) return;
        formula += element;
        if (counts[element] > 1) formula += counts[element];
    });

    const mass = moleculeAtoms.reduce((total, atom) => total + elementData[atom.element].atomicMass, 0);

    let single = 0, double = 0, triple = 0;
    moleculeBonds.forEach(bond => {
        if (bond.order === 1) single++;
        else if (bond.order === 2) double++;
        else if (bond.order === 3) triple++;
    });

    return {
        formula: formula || "—",
        mass,
        atomCount: moleculeAtoms.length,
        bondCount: moleculeBonds.length,
        single,
        double,
        triple
    };
}

function updateAnalysis() {
    const formula = document.getElementById("formula");
    const mass = document.getElementById("mass");
    const atomInfo = document.getElementById("atomInfo");
    const bondInfo = document.getElementById("bondInfo");
    const moleculeInfo = getSelectedMoleculeInfo();

    if (formula) {
        formula.textContent = moleculeInfo ? moleculeInfo.formula : getFormula();
    }

    if (mass) {
        if (moleculeInfo) {
            mass.textContent = moleculeInfo.mass.toFixed(3) + " u";
        } else {
            const molecularMass = getMolecularMass();
            mass.textContent = molecularMass > 0 ? molecularMass.toFixed(3) + " u" : "—";
        }
    }

    if (selectedAtom === null) {
        if (atomInfo) atomInfo.innerHTML = "Click an atom to inspect it.";
    } else {
        const atom = getAtomById(selectedAtom);
        if (!atom) {
            selectedAtom = null;
            selectedMoleculeIds.clear();
            updateAnalysis();
            return;
        }
        if (atomInfo) atomInfo.innerHTML = getAtomAnalysisHTML(atom);
    }

    if (bondInfo) {
        if (moleculeInfo) {
            bondInfo.innerHTML = `
                <strong>Selected Molecule</strong><br><br>
                Formula: <strong>${moleculeInfo.formula}</strong><br>
                Molecular mass: <strong>${moleculeInfo.mass.toFixed(3)} u</strong><br>
                Atoms: <strong>${moleculeInfo.atomCount}</strong><br>
                Bonds: <strong>${moleculeInfo.bondCount}</strong><br><br>
                <strong>Bond types</strong><br>
                ${moleculeInfo.single > 0 ? `${moleculeInfo.single} × Single<br>` : ""}
                ${moleculeInfo.double > 0 ? `${moleculeInfo.double} × Double<br>` : ""}
                ${moleculeInfo.triple > 0 ? `${moleculeInfo.triple} × Triple` : ""}
            `;
        } else {
            bondInfo.innerHTML = "No molecule selected.";
        }
    }

    updateWarnings();
}

function updateWarnings() {
    const warnings = document.getElementById("warnings");
    if (!warnings) return;

    const problems = [];

    atoms.forEach(atom => {
        const data = elementData[atom.element];
        const order = bondOrderSum(atom.id);

        if (order > data.commonBondOrder) {
            problems.push(`${atom.element} exceeds its common valence.`);
        } else if (order < data.commonBondOrder) {
            problems.push(`${atom.element} has an incomplete octet/radical.`);
        }
    });

    if (problems.length === 0) {
        warnings.innerHTML = atoms.length > 0 ? `<div class="good">✓ No basic valence warnings</div>` : "";
        return;
    }

    warnings.innerHTML = problems.map(msg => `<div class="bad">⚠ ${msg}</div>`).join("");
}

/* =========================================================
   INITIALIZATION
========================================================= */

function initialize() {
    resizeCanvas();
    updateZoomDisplay();
    updateAnalysis();
    updateHistoryButtons();
    redraw();
}

initialize();