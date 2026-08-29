/* =========================================================
   KIYOCHEM — HOMEPAGE ANIMATIONS
========================================================= */


/* =========================================================
   NAVBAR SCROLL EFFECT
========================================================= */

const navbar =
    document.querySelector(".navbar");


if (navbar) {

    window.addEventListener(
        "scroll",
        () => {

            if (window.scrollY > 40) {

                navbar.style.background =
                    "rgba(5, 7, 11, 0.92)";

                navbar.style.boxShadow =
                    "0 10px 40px rgba(0,0,0,0.35)";

            } else {

                navbar.style.background =
                    "rgba(5, 7, 11, 0.72)";

                navbar.style.boxShadow =
                    "none";

            }

        }
    );

}


/* =========================================================
   FLOATING PARTICLES
========================================================= */

const particleCount = 45;


for (
    let i = 0;
    i < particleCount;
    i++
) {

    const particle =
        document.createElement("div");


    particle.className =
        "particle";


    particle.style.left =
        Math.random() * 100 + "%";


    particle.style.top =
        Math.random() * 100 + "%";


    particle.style.animationDelay =
        Math.random() * 8 + "s";


    particle.style.animationDuration =
        (
            5 +
            Math.random() * 8
        ) + "s";


    document.body.appendChild(
        particle
    );

}


/* =========================================================
   SCROLL REVEAL
========================================================= */

const revealElements =
    document.querySelectorAll(
        ".tool-card, .about, .cta, .section-heading"
    );


if (
    "IntersectionObserver" in window
) {

    const observer =
        new IntersectionObserver(
            entries => {

                entries.forEach(
                    entry => {

                        if (
                            entry.isIntersecting
                        ) {

                            entry.target.classList.add(
                                "show"
                            );

                            observer.unobserve(
                                entry.target
                            );

                        }

                    }
                );

            },
            {
                threshold: 0.15
            }
        );


    revealElements.forEach(
        element => {

            element.classList.add(
                "reveal"
            );

            observer.observe(
                element
            );

        }
    );

}


/* =========================================================
   MOLECULE CONTAINER PARALLAX
========================================================= */

const moleculeContainer =
    document.querySelector(
        ".molecule-container"
    );


if (moleculeContainer) {

    document.addEventListener(
        "mousemove",
        event => {

            const x =
                (
                    event.clientX /
                    window.innerWidth
                ) - 0.5;


            const y =
                (
                    event.clientY /
                    window.innerHeight
                ) - 0.5;


            moleculeContainer.style.transform =
                `
                translateX(-60px)
                translate(
                    ${x * 12}px,
                    ${y * 12}px
                )
                rotateY(
                    ${x * 5}deg
                )
                rotateX(
                    ${y * -5}deg
                )
                `;

        }
    );


    document.addEventListener(
        "mouseleave",
        () => {

            moleculeContainer.style.transform =
                "translateX(-60px)";

        }
    );

}


/* =========================================================
   MOLECULE FADE-IN
========================================================= */

const molecule =
    document.querySelector(
        ".molecule"
    );


if (molecule) {

    window.addEventListener(
        "load",
        () => {

            molecule.classList.add(
                "visible"
            );

        }
    );

}