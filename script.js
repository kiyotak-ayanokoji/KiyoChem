const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');


// ============================================================
// ELEMENT DATA
// ============================================================

const elementData = {

  H: {
    name: "Hydrogen",
    atomicMass: 1.008,
    valenceElectrons: 1,
    commonBondOrder: 1
  },

  C: {
    name: "Carbon",
    atomicMass: 12.011,
    valenceElectrons: 4,
    commonBondOrder: 4
  },

  N: {
    name: "Nitrogen",
    atomicMass: 14.007,
    valenceElectrons: 5,
    commonBondOrder: 3
  },

  O: {
    name: "Oxygen",
    atomicMass: 15.999,
    valenceElectrons: 6,
    commonBondOrder: 2
  },

  F: {
    name: "Fluorine",
    atomicMass: 18.998,
    valenceElectrons: 7,
    commonBondOrder: 1
  }

};

// ============================================================
// MOLECULE DATA
// ============================================================

// Atom:
// {
//   id,
//   x,
//   y,
//   element
// }

let atoms = [];

// Bond:
// {
//   atom1Id,
//   atom2Id,
//   order
// }

let bonds = [];

let nextId = 0;

let selectedElement = 'C';

let draggingAtom = null;

let bondingFromAtom = null;

let bondPreviewPos = null;

let draggingBond = null;
let bondDragStart = null;

let dragOffsetX = 0;
let dragOffsetY = 0;

let isDragging = false;
let isBonding = false;

let selectedAtom = null;


// ============================================================
// SELECT ELEMENT
// ============================================================

function selectElement(element) {
  selectedElement = element;
}


// ============================================================
// MOUSE POSITION
// ============================================================

function getMousePos(event) {
  const rect = canvas.getBoundingClientRect();

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}


// ============================================================
// FIND ATOM
// ============================================================

function findAtomAt(x, y) {

  return atoms.find(atom => {

    const dx = atom.x - x;
    const dy = atom.y - y;

    return Math.sqrt(dx * dx + dy * dy) < 20;
  });
}

function getBondEndpoint(atom, otherAtom) {

  const dx = otherAtom.x - atom.x;
  const dy = otherAtom.y - atom.y;

  const angle = Math.atan2(dy, dx);

  const directions = [
    {
      dx: 0,
      dy: -28,
      angle: -Math.PI / 2
    },
    {
      dx: 28,
      dy: 0,
      angle: 0
    },
    {
      dx: 0,
      dy: 28,
      angle: Math.PI / 2
    },
    {
      dx: -28,
      dy: 0,
      angle: Math.PI
    }
  ];

  let best = directions[0];
  let smallestDifference = Infinity;

  for (const direction of directions) {

    let difference =
      Math.abs(angle - direction.angle);

    if (difference > Math.PI) {
      difference =
        2 * Math.PI - difference;
    }

    if (difference < smallestDifference) {
      smallestDifference = difference;
      best = direction;
    }
  }

  return {
    x: atom.x + best.dx,
    y: atom.y + best.dy
  };
}

function findBondAt(x, y) {

  const tolerance = 8;

  for (const bond of bonds) {

    const a1 = atoms.find(a => a.id === bond.atom1Id);
    const a2 = atoms.find(a => a.id === bond.atom2Id);

    if (!a1 || !a2) continue;

    const p1 = getBondEndpoint(a1, a2);
    const p2 = getBondEndpoint(a2, a1);

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;

    const lengthSq = dx * dx + dy * dy;

    if (lengthSq === 0) continue;

    let t =
      ((x - p1.x) * dx +
       (y - p1.y) * dy) / lengthSq;

    t = Math.max(0, Math.min(1, t));

    const closestX = p1.x + t * dx;
    const closestY = p1.y + t * dy;

    const distance = Math.hypot(
      x - closestX,
      y - closestY
    );

    if (distance <= tolerance) {
      return bond;
    }
  }

  return null;
}
// ============================================================
// BOND ORDER SUM
// ============================================================

function bondOrderSum(atomId) {

  return bonds
    .filter(bond =>
      bond.atom1Id === atomId ||
      bond.atom2Id === atomId
    )
    .reduce(
      (sum, bond) => sum + bond.order,
      0
    );
}


// ============================================================
// NUMBER OF ATOMS BONDED TO THIS ATOM
// ============================================================

function sigmaBondCount(atomId) {

  return bonds.filter(bond =>
    bond.atom1Id === atomId ||
    bond.atom2Id === atomId
  ).length;
}


// ============================================================
// LONE PAIRS
// ============================================================

function calculateLonePairs(atom) {

  const bondOrder = bondOrderSum(atom.id);

  // ==========================================
  // ISOLATED NEUTRAL ATOM
  // ==========================================

  if (bondOrder === 0) {

    const isolatedLonePairs = {
      H: 0,
      C: 1,
      N: 1,
      O: 2,
      F: 3
    };

    return isolatedLonePairs[atom.element] ?? 0;
  }


  // ==========================================
  // BONDED NEUTRAL ATOMS
  // ==========================================

  switch (atom.element) {

    case 'H':
      return 0;

    case 'C':
      return Math.max(0, 4 - bondOrder);

    case 'N':
      return Math.max(
        0,
        Math.floor((8 - bondOrder * 2) / 2)
      );

    case 'O':
      return Math.max(
        0,
        Math.floor((8 - bondOrder * 2) / 2)
      );

    case 'F':
      return Math.max(
        0,
        Math.floor((8 - bondOrder * 2) / 2)
      );

    default:
      return 0;
  }
}

// ============================================================
// ELECTRON DOMAIN COUNT
// ============================================================

function calculateElectronDomains(atom) {

  const bondOrder =
    bondOrderSum(atom.id);

  // Isolated atom → VSEPR does not apply
  if (bondOrder === 0) {
    return 0;
  }

  const sigmaBonds =
    sigmaBondCount(atom.id);

  const lonePairs =
    calculateLonePairs(atom);

  return sigmaBonds + lonePairs;
}


// ============================================================
// VSEPR GEOMETRY
// ============================================================

function calculateGeometry(atom) {

  const bondOrder =
    bondOrderSum(atom.id);

  // Isolated atom → VSEPR does not apply
  if (bondOrder === 0) {
    return {
      domains: 0,
      lonePairs: calculateLonePairs(atom),
      electronGeometry: "N/A",
      molecularGeometry: "N/A",
      bondAngle: "N/A"
    };
  }

  const domains =
    calculateElectronDomains(atom);

  const lonePairs =
    calculateLonePairs(atom);

  // ↓↓↓ KEEP YOUR EXISTING CODE HERE ↓↓↓
  



  let electronGeometry = "Unknown";
  let molecularGeometry = "Unknown";
  let bondAngle = "Unknown";


  // ----------------------------------------------------------
  // 2 ELECTRON DOMAINS
  // ----------------------------------------------------------

  if (domains === 2) {

    electronGeometry = "Linear";

    if (lonePairs === 0) {

      molecularGeometry = "Linear";
      bondAngle = "180°";
    }
  }


  // ----------------------------------------------------------
  // 3 ELECTRON DOMAINS
  // ----------------------------------------------------------

  else if (domains === 3) {

    electronGeometry = "Trigonal planar";

    if (lonePairs === 0) {

      molecularGeometry = "Trigonal planar";
      bondAngle = "~120°";
    }

    else if (lonePairs === 1) {

      molecularGeometry = "Bent";
      bondAngle = "<120°";
    }
  }


  // ----------------------------------------------------------
  // 4 ELECTRON DOMAINS
  // ----------------------------------------------------------

  else if (domains === 4) {

    electronGeometry = "Tetrahedral";

    if (lonePairs === 0) {

      molecularGeometry = "Tetrahedral";
      bondAngle = "~109.5°";
    }

    else if (lonePairs === 1) {

      molecularGeometry = "Trigonal pyramidal";
      bondAngle = "~107°";
    }

    else if (lonePairs === 2) {

      molecularGeometry = "Bent";
      bondAngle = "~104.5°";
    }
  }


  // ----------------------------------------------------------
  // 5 ELECTRON DOMAINS
  // ----------------------------------------------------------

  else if (domains === 5) {

    electronGeometry =
      "Trigonal bipyramidal";

    if (lonePairs === 0) {

      molecularGeometry =
        "Trigonal bipyramidal";

      bondAngle =
        "90°, 120°, 180°";
    }

    else if (lonePairs === 1) {

      molecularGeometry =
        "Seesaw";

      bondAngle =
        "<90°, <120°";
    }

    else if (lonePairs === 2) {

      molecularGeometry =
        "T-shaped";

      bondAngle =
        "~90°, 180°";
    }

    else if (lonePairs === 3) {

      molecularGeometry =
        "Linear";

      bondAngle =
        "180°";
    }
  }


  // ----------------------------------------------------------
  // 6 ELECTRON DOMAINS
  // ----------------------------------------------------------

  else if (domains === 6) {

    electronGeometry =
      "Octahedral";

    if (lonePairs === 0) {

      molecularGeometry =
        "Octahedral";

      bondAngle =
        "90°, 180°";
    }

    else if (lonePairs === 1) {

      molecularGeometry =
        "Square pyramidal";

      bondAngle =
        "~90°";
    }

    else if (lonePairs === 2) {

      molecularGeometry =
        "Square planar";

      bondAngle =
        "90°";
    }
  }


  return {
    domains,
    lonePairs,
    electronGeometry,
    molecularGeometry,
    bondAngle
  };
}


// ============================================================
// DRAW ATOM
// ============================================================



function drawAtom(atom) {

  const x = atom.x;
  const y = atom.y;

  // Atom circle
  ctx.beginPath();

  ctx.arc(
    x,
    y,
    20,
    0,
    Math.PI * 2
  );

  ctx.fillStyle = '#ddd';
  ctx.fill();

  ctx.strokeStyle = '#222';
  ctx.stroke();


  // Selected atom highlight
  if (
    selectedAtom &&
    selectedAtom.id === atom.id
  ) {

    ctx.beginPath();

    ctx.arc(
      x,
      y,
      25,
      0,
      Math.PI * 2
    );

    ctx.strokeStyle = '#ff8800';

    ctx.lineWidth = 3;

    ctx.stroke();

    ctx.lineWidth = 1;
  }


  // Element symbol
  ctx.fillStyle = 'black';

  ctx.font = '16px sans-serif';

  ctx.textAlign = 'center';

  ctx.textBaseline = 'middle';

  ctx.fillText(
    atom.element,
    x,
    y
  );


  // ==========================================================
  // AVAILABLE BONDING POSITIONS
  // ==========================================================

  const maxBonds =
    elementData[atom.element]?.commonBondOrder ?? 0;

  const usedBonds =
    bondOrderSum(atom.id);

  const availableBonds =
    Math.max(0, maxBonds - usedBonds);


  // Positions around the atom
  const allPositions = [

    { dx: 0, dy: -28 },

    { dx: 28, dy: 0 },

    { dx: 0, dy: 28 },

    { dx: -28, dy: 0 }

  ];


  // Only draw as many connectors as are actually available
  for (
    let i = 0;
    i < availableBonds;
    i++
  ) {

    const pos =
      allPositions[i];


    ctx.beginPath();

    ctx.arc(
      x + pos.dx,
      y + pos.dy,
      4,
      0,
      Math.PI * 2
    );

    ctx.fillStyle = '#3399ff';

    ctx.fill();
  }


  // Lone pairs
  drawLonePairs(atom);
}



// ============================================================
// DRAW LONE PAIRS
// ============================================================

function drawLonePairs(atom) {

  const lonePairs =
    calculateLonePairs(atom);

  if (lonePairs <= 0) {
    return;
  }


  /*
    This is a visual 2D representation.

    The actual VSEPR geometry is 3D and will be
    implemented properly in the future 3D engine.
  */

  const positions = [

    { x: atom.x,     y: atom.y - 34 },

    { x: atom.x + 34, y: atom.y },

    { x: atom.x,     y: atom.y + 34 },

    { x: atom.x - 34, y: atom.y }
  ];


  for (
    let i = 0;
    i < lonePairs && i < positions.length;
    i++
  ) {

    const p = positions[i];

    ctx.fillStyle = '#7b2cff';


    // First electron
    ctx.beginPath();

    ctx.arc(
      p.x - 3,
      p.y,
      2.5,
      0,
      Math.PI * 2
    );

    ctx.fill();


    // Second electron
    ctx.beginPath();

    ctx.arc(
      p.x + 3,
      p.y,
      2.5,
      0,
      Math.PI * 2
    );

    ctx.fill();
  }
}


// ============================================================
// DRAW BONDS
// ============================================================

function drawBond(bond) {

  const a1 =
    atoms.find(
      atom => atom.id === bond.atom1Id
    );

  const a2 =
    atoms.find(
      atom => atom.id === bond.atom2Id
    );


  if (!a1 || !a2) {
    return;
  }


  const dx = a2.x - a1.x;
  const dy = a2.y - a1.y;

  const length =
    Math.sqrt(dx * dx + dy * dy);


  if (length === 0) {
    return;
  }


  const perpX =
    -dy / length;

  const perpY =
    dx / length;


  const offsetGap = 4;


  const offsets =
    bond.order === 1
      ? [0]
      : bond.order === 2
        ? [-offsetGap, offsetGap]
        : [
            -offsetGap * 1.5,
            0,
            offsetGap * 1.5
          ];


  offsets.forEach(offset => {

    ctx.beginPath();

    ctx.moveTo(
      a1.x + perpX * offset,
      a1.y + perpY * offset
    );

    ctx.lineTo(
      a2.x + perpX * offset,
      a2.y + perpY * offset
    );

    ctx.strokeStyle = '#444';

    ctx.lineWidth = 2;

    ctx.stroke();
  });
}


// ============================================================
// REDRAW
// ============================================================

function redraw() {

  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );


  // Bonds first
 bonds.forEach(bond => {

  const a1 = atoms.find(
    a => a.id === bond.atom1Id
  );

  const a2 = atoms.find(
    a => a.id === bond.atom2Id
  );

  if (!a1 || !a2) return;

  const p1 = getBondEndpoint(a1, a2);
  const p2 = getBondEndpoint(a2, a1);

  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;

  const length = Math.hypot(dx, dy);

  if (length === 0) return;

  const perpX = -dy / length;
  const perpY = dx / length;

  const offsetGap = 5;

  const offsets =
    bond.order === 1
      ? [0]
      : bond.order === 2
        ? [-offsetGap, offsetGap]
        : [
            -offsetGap * 1.5,
            0,
            offsetGap * 1.5
          ];

  offsets.forEach(offset => {

    ctx.beginPath();

    ctx.moveTo(
      p1.x + perpX * offset,
      p1.y + perpY * offset
    );

    ctx.lineTo(
      p2.x + perpX * offset,
      p2.y + perpY * offset
    );

    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2;

    ctx.stroke();
  });
});


  // Atoms second
  atoms.forEach(drawAtom);


  updateInspector();
}

function maxBondsFor(element) {

  const values = {
    H: 1,
    C: 4,
    N: 3,
    O: 2,
    F: 1
  };

  return values[element] ?? 0;
}
// ============================================================
// FIND DOT
// ============================================================

function findDotAt(x, y) {

  for (const atom of atoms) {

    const maxBonds =
      elementData[atom.element]?.commonBondOrder ?? maxBondsFor(atom.element);

    const usedBonds =
      bondOrderSum(atom.id);

    const availableBonds =
      Math.max(0, maxBonds - usedBonds);

    const dotPositions = [
      { dx: 0, dy: -28 },
      { dx: 28, dy: 0 },
      { dx: 0, dy: 28 },
      { dx: -28, dy: 0 }
    ];

    for (let i = 0; i < availableBonds; i++) {

      const pos = dotPositions[i];

      const dotX = atom.x + pos.dx;
      const dotY = atom.y + pos.dy;

      const dist = Math.hypot(
        dotX - x,
        dotY - y
      );

      if (dist < 9) {
        return {
          atom: atom,
          x: dotX,
          y: dotY,
          index: i
        };
      }
    }
  }

  return null;
}


// ============================================================
// CREATE ANALYSIS PANEL
// ============================================================

function createInspector() {

  const panel =
    document.createElement('div');

  panel.id = 'atomInspector';

  panel.style.position = 'fixed';

  panel.style.right = '20px';

  panel.style.top = '100px';

  panel.style.width = '250px';

  panel.style.padding = '15px';

  panel.style.background = 'white';

  panel.style.border = '2px solid #333';

  panel.style.borderRadius = '10px';

  panel.style.fontFamily =
    'Arial, sans-serif';

  panel.style.textAlign = 'left';

  panel.style.boxShadow =
    '0 4px 15px rgba(0,0,0,0.2)';

  panel.innerHTML = `
    <h3 style="margin-top:0;">
      🔬 Atom Analysis
    </h3>

    <div id="atomAnalysis">
      Click an atom.
    </div>
  `;

  document.body.appendChild(panel);
}


createInspector();


// ============================================================
// UPDATE INSPECTOR
// ============================================================

function updateInspector() {

  const panel =
    document.getElementById(
      'atomAnalysis'
    );


  if (!panel) {
    return;
  }


  if (!selectedAtom) {

    panel.innerHTML =
      'Click an atom to inspect it.';

    return;
  }


  const data =
    elementData[selectedAtom.element];


  const bondOrder =
    bondOrderSum(
      selectedAtom.id
    );


  const sigmaBonds =
    sigmaBondCount(
      selectedAtom.id
    );


  const lonePairs =
    calculateLonePairs(
      selectedAtom
    );


  const geometry =
    calculateGeometry(
      selectedAtom
    );


  const valenceOK =
    bondOrder <= data.commonBondOrder;


  panel.innerHTML = `

    <strong>
      ${data.name} (${selectedAtom.element})
    </strong>

    <hr>

    <b>Bond order:</b>
    ${bondOrder}

    <br>

    <b>Sigma bonds:</b>
    ${sigmaBonds}

    <br>

    <b>Lone pairs:</b>
    <span style="color:#7b2cff;">
      ${lonePairs}
    </span>

    <br>

    <b>Electron domains:</b>
    ${geometry.domains}

    <hr>

    <b>Electron geometry:</b>
    <br>
    ${geometry.electronGeometry}

    <br><br>

    <b>Molecular geometry:</b>
    <br>
    ${geometry.molecularGeometry}

    <br><br>

    <b>Typical bond angle:</b>
    <br>
    ${geometry.bondAngle}

    <hr>

    <span style="
      color:${valenceOK ? 'green' : 'red'};
      font-weight:bold;
    ">
      ${valenceOK ? '✓' : '⚠'}
      ${valenceOK
        ? 'Common valence satisfied'
        : 'Common valence exceeded'}
    </span>
  `;
}


// ============================================================
// MOUSE DOWN
// ============================================================

canvas.addEventListener('mousedown', (event) => {

  const { x, y } = getMousePos(event);

  // ==========================================
  // 1. CLICK ON BOND → PREPARE TO BREAK IT
  // ==========================================

  const bond = findBondAt(x, y);

  if (bond) {

    draggingBond = bond;

    bondDragStart = {
      x,
      y
    };

    return;
  }


  // ==========================================
  // 2. CLICK ON CONNECTOR DOT → START BOND
  // ==========================================

  const dot = findDotAt(x, y);

  if (dot) {

    bondingFromAtom = dot.atom;

    bondPreviewPos = {
      x: dot.x,
      y: dot.y
    };

    return;
  }


  // ==========================================
  // 3. CLICK ON ATOM → DRAG ATOM
  // ==========================================

  const atom = findAtomAt(x, y);

  if (atom) {

    draggingAtom = atom;

    dragOffsetX =
      atom.x - x;

    dragOffsetY =
      atom.y - y;

    return;
  }


  // ==========================================
  // 4. EMPTY SPACE → CREATE ATOM
  // ==========================================

  atoms.push({
    id: nextId++,
    x,
    y,
    element: selectedElement
  });

  redraw();
});


// ============================================================
// MOUSE MOVE
// ============================================================

canvas.addEventListener('mousemove', (event) => {

  const { x, y } = getMousePos(event);


  // ==========================================
  // DRAGGING ATOM
  // ==========================================

  if (draggingAtom) {

    draggingAtom.x =
      x + dragOffsetX;

    draggingAtom.y =
      y + dragOffsetY;

    redraw();

    return;
  }


  // ==========================================
  // DRAWING NEW BOND
  // ==========================================

  if (bondingFromAtom) {

    bondPreviewPos = {
      x,
      y
    };

    redraw();

    const start = getPreviewBondStart(
      bondingFromAtom,
      x,
      y
    );

    ctx.beginPath();

    ctx.moveTo(
      start.x,
      start.y
    );

    ctx.lineTo(
      x,
      y
    );

    ctx.strokeStyle =
      '#3399ff';

    ctx.lineWidth = 2;

    ctx.stroke();

    return;
  }


  // ==========================================
  // DRAGGING EXISTING BOND
  // ==========================================

  if (draggingBond) {

    redraw();

    const a1 = atoms.find(
      a => a.id === draggingBond.atom1Id
    );

    const a2 = atoms.find(
      a => a.id === draggingBond.atom2Id
    );

    if (!a1 || !a2) return;

    const start =
      getBondEndpoint(a1, a2);

    const dx =
      a2.x - a1.x;

    const dy =
      a2.y - a1.y;

    const length =
      Math.hypot(dx, dy);

    if (length === 0) return;

    ctx.beginPath();

    ctx.moveTo(
      start.x,
      start.y
    );

    ctx.lineTo(
      x,
      y
    );

    ctx.strokeStyle =
      '#ff4444';

    ctx.lineWidth = 2;

    ctx.stroke();
  }
});

function getPreviewBondStart(atom, x, y) {

  const fakeTarget = {
    x: x,
    y: y
  };

  return getBondEndpoint(
    atom,
    fakeTarget
  );
}

// ============================================================
// MOUSE UP
// ============================================================

canvas.addEventListener('mouseup', (event) => {

  const { x, y } = getMousePos(event);


  // ==========================================
  // BREAK EXISTING BOND
  // ==========================================

  if (draggingBond) {

    const targetAtom =
      findAtomAt(x, y);

    // If released on empty space,
    // break the bond.
    if (!targetAtom) {

      const index =
        bonds.indexOf(draggingBond);

      if (index !== -1) {
        bonds.splice(index, 1);
      }
    }

    // If released on an atom,
    // leave the bond intact for now.
    draggingBond = null;
    bondDragStart = null;

    redraw();

    return;
  }


  // ==========================================
  // CREATE NEW BOND
  // ==========================================

  if (bondingFromAtom) {

    const targetAtom =
      findAtomAt(x, y);

    if (
      targetAtom &&
      targetAtom.id !== bondingFromAtom.id
    ) {

      const atom1 =
        bondingFromAtom;

      const atom2 =
        targetAtom;

      const atom1Full =
        bondCount(atom1.id) >=
        maxBondsFor(atom1.element);

      const atom2Full =
        bondCount(atom2.id) >=
        maxBondsFor(atom2.element);


      const existingBond =
        bonds.find(b =>
          (
            b.atom1Id === atom1.id &&
            b.atom2Id === atom2.id
          ) ||
          (
            b.atom1Id === atom2.id &&
            b.atom2Id === atom1.id
          )
        );


      if (atom1Full || atom2Full) {

        alert(
          `Can't bond — ${
            atom1Full
              ? atom1.element
              : atom2.element
          } has no available bonding position.`
        );

      }

      else if (existingBond) {

        if (existingBond.order < 3) {

          existingBond.order++;

        } else {

          alert(
            "Already a triple bond."
          );
        }

      }

      else {

        bonds.push({
          atom1Id: atom1.id,
          atom2Id: atom2.id,
          order: 1
        });
      }
    }
  }


  draggingAtom = null;
  bondingFromAtom = null;
  bondPreviewPos = null;

  redraw();
});

// ============================================================
// CREATE / INCREASE BOND
// ============================================================

function createBond(atom1, atom2) {

  const existingBond =
    bonds.find(bond =>

      (
        bond.atom1Id === atom1.id &&
        bond.atom2Id === atom2.id
      )

      ||

      (
        bond.atom1Id === atom2.id &&
        bond.atom2Id === atom1.id
      )
    );


  // ----------------------------------------------------------
  // EXISTING BOND
  // ----------------------------------------------------------

  if (existingBond) {

    const newOrder =
      existingBond.order + 1;


    const newOrderAtom1 =
      bondOrderSum(atom1.id)
      + 1;

    const newOrderAtom2 =
      bondOrderSum(atom2.id)
      + 1;


    if (
      newOrderAtom1 >
      elementData[atom1.element].commonBondOrder
    ) {

      alert(
        `${atom1.element} cannot have this bond order in the current basic model.`
      );

      return;
    }


    if (
      newOrderAtom2 >
      elementData[atom2.element].commonBondOrder
    ) {

      alert(
        `${atom2.element} cannot have this bond order in the current basic model.`
      );

      return;
    }


    if (newOrder <= 3) {

      existingBond.order =
        newOrder;

    } else {

      alert(
        "Maximum displayed bond order is 3."
      );
    }


    return;
  }


  // ----------------------------------------------------------
  // NEW SINGLE BOND
  // ----------------------------------------------------------

  if (
    bondOrderSum(atom1.id) + 1 >
    elementData[atom1.element].commonBondOrder
  ) {

    alert(
      `${atom1.element} has reached its common bond-order capacity.`
    );

    return;
  }


  if (
    bondOrderSum(atom2.id) + 1 >
    elementData[atom2.element].commonBondOrder
  ) {

    alert(
      `${atom2.element} has reached its common bond-order capacity.`
    );

    return;
  }


  bonds.push({

    atom1Id:
      atom1.id,

    atom2Id:
      atom2.id,

    order: 1
  });
}


// ============================================================
// INITIAL DRAW
// ============================================================

redraw();