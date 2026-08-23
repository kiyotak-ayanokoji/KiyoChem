// ============================================================
// KIYOTAKA LABS — RANDOM MOLECULAR VISUALIZATION
// ============================================================

const moleculeContainer = document.querySelector(".molecule");


// ============================================================
// MOLECULE DATABASE
// ============================================================

const molecules = [

    // --------------------------------------------------------
    // 1. WATER
    // --------------------------------------------------------

    {
        name: "Water",
        formula: "H₂O",

        atoms: [
            { element: "O", x: 0, y: 0 },
            { element: "H", x: -65, y: -35 },
            { element: "H", x: 65, y: -35 }
        ],

        bonds: [
            [0, 1],
            [0, 2]
        ]
    },


    // --------------------------------------------------------
    // 2. CARBON DIOXIDE
    // --------------------------------------------------------

    {
        name: "Carbon dioxide",
        formula: "CO₂",

        atoms: [
            { element: "O", x: -100, y: 0 },
            { element: "C", x: 0, y: 0 },
            { element: "O", x: 100, y: 0 }
        ],

        bonds: [
            [0, 1],
            [1, 2]
        ]
    },


    // --------------------------------------------------------
    // 3. METHANE
    // --------------------------------------------------------

    {
        name: "Methane",
        formula: "CH₄",

        atoms: [
            { element: "C", x: 0, y: 0 },
            { element: "H", x: 0, y: -75 },
            { element: "H", x: 75, y: 0 },
            { element: "H", x: 0, y: 75 },
            { element: "H", x: -75, y: 0 }
        ],

        bonds: [
            [0, 1],
            [0, 2],
            [0, 3],
            [0, 4]
        ]
    },


    // --------------------------------------------------------
    // 4. AMMONIA
    // --------------------------------------------------------

    {
        name: "Ammonia",
        formula: "NH₃",

        atoms: [
            { element: "N", x: 0, y: 0 },
            { element: "H", x: -70, y: 45 },
            { element: "H", x: 70, y: 45 },
            { element: "H", x: 0, y: -75 }
        ],

        bonds: [
            [0, 1],
            [0, 2],
            [0, 3]
        ]
    },


    // --------------------------------------------------------
    // 5. HYDROGEN PEROXIDE
    // --------------------------------------------------------

    {
        name: "Hydrogen peroxide",
        formula: "H₂O₂",

        atoms: [
            { element: "H", x: -110, y: -35 },
            { element: "O", x: -45, y: 0 },
            { element: "O", x: 45, y: 0 },
            { element: "H", x: 110, y: 35 }
        ],

        bonds: [
            [0, 1],
            [1, 2],
            [2, 3]
        ]
    },


    // --------------------------------------------------------
    // 6. ETHANOL
    // --------------------------------------------------------

    {
        name: "Ethanol",
        formula: "C₂H₆O",

        atoms: [
            { element: "C", x: -55, y: 0 },
            { element: "C", x: 25, y: 0 },
            { element: "O", x: 105, y: 0 },
            { element: "H", x: 155, y: -35 }
        ],

        bonds: [
            [0, 1],
            [1, 2],
            [2, 3]
        ]
    },


    // --------------------------------------------------------
    // 7. METHANOL
    // --------------------------------------------------------

    {
        name: "Methanol",
        formula: "CH₄O",

        atoms: [
            { element: "C", x: 0, y: 0 },
            { element: "O", x: 80, y: 0 },
            { element: "H", x: 130, y: -35 }
        ],

        bonds: [
            [0, 1],
            [1, 2]
        ]
    },


    // --------------------------------------------------------
    // 8. ACETIC ACID
    // --------------------------------------------------------

    {
        name: "Acetic acid",
        formula: "CH₃COOH",

        atoms: [
            { element: "C", x: -60, y: 0 },
            { element: "C", x: 25, y: 0 },
            { element: "O", x: 25, y: -70 },
            { element: "O", x: 100, y: 30 },
            { element: "H", x: 150, y: 30 }
        ],

        bonds: [
            [0, 1],
            [1, 2],
            [1, 3],
            [3, 4]
        ]
    },


    // --------------------------------------------------------
    // 9. BENZENE
    // --------------------------------------------------------

    {
        name: "Benzene",
        formula: "C₆H₆",

        ring: true,

        atoms: [
            { element: "C", x: 0, y: -80 },
            { element: "C", x: 70, y: -40 },
            { element: "C", x: 70, y: 40 },
            { element: "C", x: 0, y: 80 },
            { element: "C", x: -70, y: 40 },
            { element: "C", x: -70, y: -40 }
        ],

        bonds: [
            [0, 1],
            [1, 2],
            [2, 3],
            [3, 4],
            [4, 5],
            [5, 0]
        ]
    },


    // --------------------------------------------------------
    // 10. ACETONE
    // --------------------------------------------------------

    {
        name: "Acetone",
        formula: "C₃H₆O",

        atoms: [
            { element: "C", x: -100, y: 0 },
            { element: "C", x: 0, y: 0 },
            { element: "C", x: 100, y: 0 },
            { element: "O", x: 0, y: -80 }
        ],

        bonds: [
            [0, 1],
            [1, 2],
            [1, 3]
        ]
    },


    // --------------------------------------------------------
    // 11. UREA
    // --------------------------------------------------------

    {
        name: "Urea",
        formula: "CH₄N₂O",

        atoms: [
            { element: "N", x: -80, y: 0 },
            { element: "C", x: 0, y: 0 },
            { element: "N", x: 80, y: 0 },
            { element: "O", x: 0, y: -80 }
        ],

        bonds: [
            [0, 1],
            [1, 2],
            [1, 3]
        ]
    },


    // --------------------------------------------------------
    // 12. OXYGEN
    // --------------------------------------------------------

    {
        name: "Oxygen",
        formula: "O₂",

        atoms: [
            { element: "O", x: -55, y: 0 },
            { element: "O", x: 55, y: 0 }
        ],

        bonds: [
            [0, 1]
        ]
    },


    // --------------------------------------------------------
    // 13. NITROGEN
    // --------------------------------------------------------

    {
        name: "Nitrogen",
        formula: "N₂",

        atoms: [
            { element: "N", x: -55, y: 0 },
            { element: "N", x: 55, y: 0 }
        ],

        bonds: [
            [0, 1]
        ]
    },


    // --------------------------------------------------------
    // 14. HYDROGEN
    // --------------------------------------------------------

    {
        name: "Hydrogen",
        formula: "H₂",

        atoms: [
            { element: "H", x: -55, y: 0 },
            { element: "H", x: 55, y: 0 }
        ],

        bonds: [
            [0, 1]
        ]
    },


    // --------------------------------------------------------
    // 15. CAFFEINE
    // --------------------------------------------------------

    {
        name: "Caffeine",
        formula: "C₈H₁₀N₄O₂",

        atoms: [
            { element: "N", x: -90, y: -40 },
            { element: "C", x: -25, y: -75 },
            { element: "N", x: 45, y: -40 },
            { element: "C", x: 70, y: 30 },
            { element: "N", x: 0, y: 70 },
            { element: "C", x: -70, y: 35 },

            { element: "O", x: -25, y: -135 },
            { element: "O", x: 120, y: 45 },

            { element: "C", x: -140, y: -75 },
            { element: "C", x: 90, y: -90 },
            { element: "C", x: 0, y: 140 }
        ],

        bonds: [
            [0, 1],
            [1, 2],
            [2, 3],
            [3, 4],
            [4, 5],
            [5, 0],

            [1, 6],
            [3, 7],

            [0, 8],
            [2, 9],
            [4, 10]
        ]
    },


    // --------------------------------------------------------
    // 16. LACTIC ACID
    // --------------------------------------------------------

    {
        name: "Lactic acid",
        formula: "C₃H₆O₃",

        atoms: [
            { element: "C", x: -100, y: 0 },
            { element: "C", x: 0, y: 0 },
            { element: "C", x: 100, y: 0 },

            { element: "O", x: 0, y: -75 },
            { element: "O", x: 100, y: -70 },
            { element: "O", x: 155, y: -100 }
        ],

        bonds: [
            [0, 1],
            [1, 2],
            [1, 3],
            [2, 4],
            [4, 5]
        ]
    }

];


// ============================================================
// RANDOM MOLECULE
// ============================================================

function getRandomMolecule() {

    const index =
        Math.floor(Math.random() * molecules.length);

    return molecules[index];

}


// ============================================================
// DRAW MOLECULE
// ============================================================

function drawMolecule(molecule) {

    if (!moleculeContainer) {
        return;
    }

    moleculeContainer.innerHTML = "";


    // --------------------------------------------------------
    // CREATE ATOMS
    // --------------------------------------------------------

    molecule.atoms.forEach((atom, index) => {

        const element =
            document.createElement("div");

        element.className =
            "atom atom-" + atom.element.toLowerCase();

        element.textContent =
            atom.element;

        element.style.left =
            `calc(50% + ${atom.x}px)`;

        element.style.top =
            `calc(50% + ${atom.y}px)`;

        moleculeContainer.appendChild(element);

    });


    // --------------------------------------------------------
    // CREATE BONDS
    // --------------------------------------------------------

    molecule.bonds.forEach(([a, b]) => {

        const atom1 =
            molecule.atoms[a];

        const atom2 =
            molecule.atoms[b];

        const bond =
            document.createElement("div");

        bond.className =
            "dynamic-bond";


        const x1 = atom1.x;
        const y1 = atom1.y;

        const x2 = atom2.x;
        const y2 = atom2.y;


        const dx = x2 - x1;
        const dy = y2 - y1;

        const length =
            Math.sqrt(dx * dx + dy * dy);

        const angle =
            Math.atan2(dy, dx) *
            180 / Math.PI;


        bond.style.width =
            `${length}px`;

        bond.style.left =
            `calc(50% + ${x1}px)`;

        bond.style.top =
            `calc(50% + ${y1}px)`;

        bond.style.transform =
            `rotate(${angle}deg)`;


        moleculeContainer.appendChild(bond);

    });


    // --------------------------------------------------------
    // MOLECULE LABEL
    // --------------------------------------------------------

    const label =
        document.createElement("div");

    label.className =
        "molecule-label";

    label.innerHTML = `
        <strong>${molecule.name}</strong>
        <span>${molecule.formula}</span>
    `;

    moleculeContainer.appendChild(label);

}


// ============================================================
// INITIALIZE
// ============================================================

function initializeMolecule() {

    const molecule =
        getRandomMolecule();

    drawMolecule(molecule);

}


// ============================================================
// START
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    initializeMolecule
);