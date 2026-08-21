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

// ============================================================
// MOUSE & TOUCH POSITION (PC AND MOBILE COMPATIBLE)
// ============================================================

function getMousePos(event) {
  const rect = canvas.getBoundingClientRect();
  
  // Checks if input is a touch event or standard mouse event
  const clientX = event.touches && event.touches.length > 0 ? event.touches[0].clientX : event.clientX;
  const clientY = event.touches && event.touches.length > 0 ? event.touches[0].clientY : event.clientY;

  return {
    x: clientX - rect.left,
    y: clientY - rect.top
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

  const data = elementData[atom.element];

  if (!data) {
    return 0;
  }

  const bondOrder = bondOrderSum(atom.id);

  const nonBondingElectrons =
    data.valenceElectrons - bondOrder;

  if (nonBondingElectrons < 0) {
    return 0;
  }

  return Math.floor(nonBondingElectrons / 2);
}


// ============================================================
// ELECTRON DOMAIN COUNT
// ============================================================

function calculateElectronDomains(atom) {

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

  const domains =
    calculateElectronDomains(atom);

  const lonePairs =
    calculateLonePairs(atom);

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


  // Connection dots
  const dotPositions = [
    { dx: 0, dy: -20 },
    { dx: 20, dy: 0 },
    { dx: 0, dy: 20 },
    { dx: -20, dy: 0 }
  ];


  dotPositions.forEach(pos => {

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
  });


  // Draw lone pairs
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
  bonds.forEach(drawBond);


  // Atoms second
  atoms.forEach(drawAtom);


  updateInspector();
}


// ============================================================
// FIND DOT
// ============================================================

function findDotAt(x, y) {

  for (const atom of atoms) {

    const dotPositions = [
      { dx: 0, dy: -20 },
      { dx: 20, dy: 0 },
      { dx: 0, dy: 20 },
      { dx: -20, dy: 0 }
    ];


    for (const pos of dotPositions) {

      const dotX =
        atom.x + pos.dx;

      const dotY =
        atom.y + pos.dy;


      const distance =
        Math.sqrt(
          (dotX - x) ** 2 +
          (dotY - y) ** 2
        );


      if (distance < 8) {

        return atom;
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

  const dotAtom = findDotAt(x, y);

  // Start bonding
  if (dotAtom) {

    bondingFromAtom = dotAtom;
    isBonding = true;

    return;
  }


  const atom = findAtomAt(x, y);

  if (atom) {

    selectedAtom = atom;

    draggingAtom = atom;

    dragOffsetX = atom.x - x;
    dragOffsetY = atom.y - y;

    isDragging = false;

    redraw();

    return;
  }


  // Empty canvas → create atom
  const newAtom = {
    id: nextId++,
    x,
    y,
    element: selectedElement
  };

  atoms.push(newAtom);

  selectedAtom = newAtom;

  redraw();
});


// ============================================================
// MOUSE MOVE
// ============================================================

canvas.addEventListener('mousemove', (event) => {

  const { x, y } = getMousePos(event);


  // -------------------------
  // DRAGGING ATOM
  // -------------------------

  if (draggingAtom) {

    const dx =
      Math.abs(
        x - (draggingAtom.x - dragOffsetX)
      );

    const dy =
      Math.abs(
        y - (draggingAtom.y - dragOffsetY)
      );


    if (dx > 3 || dy > 3) {
      isDragging = true;
    }


    if (isDragging) {

      draggingAtom.x =
        x + dragOffsetX;

      draggingAtom.y =
        y + dragOffsetY;

      redraw();
    }

    return;
  }


  // -------------------------
  // BOND PREVIEW
  // -------------------------

  if (bondingFromAtom) {

    bondPreviewPos = {
      x,
      y
    };

    redraw();


    ctx.beginPath();

    ctx.moveTo(
      bondingFromAtom.x,
      bondingFromAtom.y
    );

    ctx.lineTo(
      x,
      y
    );


    ctx.strokeStyle =
      '#3399ff';

    ctx.lineWidth = 2;

    ctx.setLineDash([6, 6]);

    ctx.stroke();

    ctx.setLineDash([]);

    ctx.strokeStyle = 'black';
  }
});


// ============================================================
// MOUSE UP
// ============================================================

canvas.addEventListener('mouseup', (event) => {

  // -------------------------
  // FINISH BOND
  // -------------------------

  if (bondingFromAtom) {

    const { x, y } =
      getMousePos(event);

    const targetAtom =
      findAtomAt(x, y);


    if (
      targetAtom &&
      targetAtom.id !==
      bondingFromAtom.id
    ) {

      createBond(
        bondingFromAtom,
        targetAtom
      );
    }
  }


  // -------------------------
  // STOP EVERYTHING
  // -------------------------

  draggingAtom = null;
  bondingFromAtom = null;

  bondPreviewPos = null;

  isDragging = false;
  isBonding = false;

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

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  bonds.forEach(drawBond);
  atoms.forEach(drawAtom);
  updateInspector();
}

// ============================================================
// NATIVE MOBILE TOUCH EVENT HANDLING
// ============================================================

canvas.addEventListener('touchstart', (event) => {
  // Prevents mobile browser page from scrolling or zooming while drawing
  event.preventDefault();
  
  const { x, y } = getMousePos(event);
  const dotAtom = findDotAt(x, y);

  if (dotAtom) {
    bondingFromAtom = dotAtom;
    isBonding = true;
    return;
  }

  const atom = findAtomAt(x, y);
  if (atom) {
    selectedAtom = atom;
    draggingAtom = atom;
    dragOffsetX = atom.x - x;
    dragOffsetY = atom.y - y;
    isDragging = false;
    redraw();
    return;
  }

  const newAtom = {
    id: nextId++,
    x,
    y,
    element: selectedElement
  };
  atoms.push(newAtom);
  selectedAtom = newAtom;
  redraw();
}, { passive: false });

canvas.addEventListener('touchmove', (event) => {
  event.preventDefault();
  const { x, y } = getMousePos(event);

  if (draggingAtom) {
    const dx = Math.abs(x - (draggingAtom.x - dragOffsetX));
    const dy = Math.abs(y - (draggingAtom.y - dragOffsetY));

    if (dx > 3 || dy > 3) {
      isDragging = true;
    }

    if (isDragging) {
      draggingAtom.x = x + dragOffsetX;
      draggingAtom.y = y + dragOffsetY;
      redraw();
    }
    return;
  }

  if (bondingFromAtom) {
    bondPreviewPos = { x, y };
    redraw();

    ctx.beginPath();
    ctx.moveTo(bondingFromAtom.x, bondingFromAtom.y);
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#3399ff';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = 'black';
  }
}, { passive: false });

canvas.addEventListener('touchend', (event) => {
  if (bondingFromAtom) {
    // If finger was lifted, find position from the changed touch tracker
    const rect = canvas.getBoundingClientRect();
    const clientX = event.changedTouches && event.changedTouches.length > 0 ? event.changedTouches[0].clientX : event.clientX;
    const clientY = event.changedTouches && event.changedTouches.length > 0 ? event.changedTouches[0].clientY : event.clientY;
    
    const endX = clientX - rect.left;
    const endY = clientY - rect.top;
    const targetAtom = findAtomAt(endX, endY);

    if (targetAtom && targetAtom.id !== bondingFromAtom.id) {
      createBond(bondingFromAtom, targetAtom);
    }
  }

  draggingAtom = null;
  bondingFromAtom = null;
  bondPreviewPos = null;
  isDragging = false;
  isBonding = false;
  redraw();
});
