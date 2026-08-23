/* =========================================================
   KIYOCHEM — HOME ANIMATIONS
========================================================= */


/* NAVBAR */

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


/* PARTICLES */

for (
    let i = 0;
    i < 45;
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
        5 + Math.random() * 8 + "s";

    document.body.appendChild(
        particle
    );

}


/* SCROLL REVEAL */

const revealElements =
    document.querySelectorAll(
        ".tool-card, .about, .cta, .section-heading"
    );


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


/* MOLECULE */

const molecule =
    document.querySelector(
        ".molecule"
    );


if (molecule) {

    document.addEventListener(
        "mousemove",
        event => {

            const x =
                event.clientX /
                window.innerWidth -
                0.5;

            const y =
                event.clientY /
                window.innerHeight -
                0.5;


            molecule.style.transform = `

                translate(
                    ${x * 15}px,
                    ${y * 15}px
                )

                rotateY(${x * 8}deg)

                rotateX(${y * -8}deg)

            `;

        }
    );

}