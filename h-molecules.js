/* =========================================================
   KIYOCHEM — ACCURATE MOLECULAR STRUCTURE DATA & RENDERER
========================================================= */

const molecules = [
    {
        name: "Water",
        formula: "H2O",
        atoms: [
            { element: "O", x: 0, y: -10 },
            { element: "H", x: -62, y: 38 },
            { element: "H", x: 62, y: 38 }
        ],
        bonds: [
            [0, 1, 1],
            [0, 2, 1]
        ]
    },
    {
        name: "Carbon Dioxide",
        formula: "CO2",
        atoms: [
            { element: "C", x: 0, y: 0 },
            { element: "O", x: -90, y: 0 },
            { element: "O", x: 90, y: 0 }
        ],
        bonds: [
            [0, 1, 2],
            [0, 2, 2]
        ]
    },
    {
        name: "Methane",
        formula: "CH4",
        atoms: [
            { element: "C", x: 0, y: 0 },
            { element: "H", x: 0, y: -75 },
            { element: "H", x: 75, y: 0 },
            { element: "H", x: 0, y: 75 },
            { element: "H", x: -75, y: 0 }
        ],
        bonds: [
            [0, 1, 1],
            [0, 2, 1],
            [0, 3, 1],
            [0, 4, 1]
        ]
    },
    {
        name: "Ammonia",
        formula: "NH3",
        atoms: [
            { element: "N", x: 0, y: -25 },
            { element: "H", x: -65, y: 35 },
            { element: "H", x: 65, y: 35 },
            { element: "H", x: 0, y: -85 }
        ],
        bonds: [
            [0, 1, 1],
            [0, 2, 1],
            [0, 3, 1]
        ]
    },
    {
        name: "Dinitrogen",
        formula: "N2",
        atoms: [
            { element: "N", x: -55, y: 0 },
            { element: "N", x: 55, y: 0 }
        ],
        bonds: [
            [0, 1, 3]
        ]
    },
    {
        name: "Dioxygen",
        formula: "O2",
        atoms: [
            { element: "O", x: -50, y: 0 },
            { element: "O", x: 50, y: 0 }
        ],
        bonds: [
            [0, 1, 2]
        ]
    }
];

function drawMolecule(molecule) {
    const container = document.querySelector(".molecule");
    if (!container) return;

    container.innerHTML = "";

    const rect = container.getBoundingClientRect();
    const centerX = (rect.width && rect.width > 0) ? rect.width / 2 : 200;
    const centerY = (rect.height && rect.height > 0) ? rect.height / 2 : 200;

    /* 1. DRAW BONDS */
    molecule.bonds.forEach(([a, b, count = 1]) => {
        const atom1 = molecule.atoms[a];
        const atom2 = molecule.atoms[b];
        if (!atom1 || !atom2) return;

        const dx = atom2.x - atom1.x;
        const dy = atom2.y - atom1.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        const deg = angle * (180 / Math.PI);
        const spacing = 7;

        for (let i = 0; i < count; i++) {
            const bond = document.createElement("div");
            bond.className = "dynamic-bond";

            const offset = (i - (count - 1) / 2) * spacing;
            const offsetX = -offset * Math.sin(angle);
            const offsetY = offset * Math.cos(angle);

            bond.style.width = `${length}px`;
            bond.style.left = `${centerX + atom1.x + offsetX}px`;
            bond.style.top = `${centerY + atom1.y + offsetY}px`;
            bond.style.transform = `rotate(${deg}deg)`;

            container.appendChild(bond);
        }
    });

    /* 2. DRAW ATOMS */
    molecule.atoms.forEach(atom => {
        const element = document.createElement("div");
        element.className = `atom atom-${atom.element.toLowerCase()}`;
        element.textContent = atom.element;

        const size = atom.element === "H" ? 44 : 60;
        element.style.left = `${centerX + atom.x - size / 2}px`;
        element.style.top = `${centerY + atom.y - size / 2}px`;

        container.appendChild(element);
    });

    /* 3. DRAW FORMULA LABEL */
    const label = document.createElement("div");
    label.className = "molecule-label";
    const formattedFormula = molecule.formula.replace(/(\d+)/g, "<sub>$1</sub>");

    label.innerHTML = `
        <strong>${molecule.name}</strong>
        <span>${formattedFormula}</span>
    `;
    container.appendChild(label);
}

function init() {
    const randomMol = molecules[Math.floor(Math.random() * molecules.length)];
    drawMolecule(randomMol);
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
    init();
}