"use strict";
/*==================================================
                DOM READY
==================================================*/

document.addEventListener("DOMContentLoaded", () => {

    initNavbar();

    initSmoothScroll();

    initBackToTop();

    initRevealAnimations();

});

/*==================================================
                SELECTORS
==================================================*/

const $ = (selector, parent = document) =>
    parent.querySelector(selector);

const $$ = (selector, parent = document) =>
    [...parent.querySelectorAll(selector)];

/*==================================================
                NAVBAR
==================================================*/

function initNavbar() {

    const navbar = $(".navbar");

    if (!navbar) return;

    let lastScroll = 0;

    window.addEventListener("scroll", () => {

        const current = window.scrollY;

        if (current > 50) {

            navbar.classList.add("scrolled");

        } else {

            navbar.classList.remove("scrolled");

        }

        if (current > lastScroll && current > 120) {

            navbar.classList.add("navbar-hide");

        } else {

            navbar.classList.remove("navbar-hide");

        }

        lastScroll = current;

    });

    updateActiveLinks();

    window.addEventListener("scroll", updateActiveLinks);

}

/*==================================================
                ACTIVE LINKS
==================================================*/

function updateActiveLinks() {

    const sections = $$("section[id]");

    const links = $$(".nav-link");

    let currentSection = "";

    sections.forEach(section => {

        const top = section.offsetTop - 180;

        const height = section.offsetHeight;

        if (window.scrollY >= top &&
            window.scrollY < top + height) {

            currentSection = section.id;

        }

    });

    links.forEach(link => {

        link.classList.remove("active");

        const href = link.getAttribute("href");

        if (!href) return;

        if (href === `#${currentSection}`) {

            link.classList.add("active");

        }

    });

}

/*==================================================
                SMOOTH SCROLL
==================================================*/

function initSmoothScroll() {

    $$('a[href^="#"]').forEach(anchor => {

        anchor.addEventListener("click", e => {

            const target = anchor.getAttribute("href");

            if (!target || target === "#") return;

            const element = $(target);

            if (!element) return;

            e.preventDefault();

            const offset = 90;

            const position =
                element.getBoundingClientRect().top +
                window.scrollY -
                offset;

            window.scrollTo({

                top: position,

                behavior: "smooth"

            });

        });

    });

}

/*==================================================
                BACK TO TOP
==================================================*/

function initBackToTop() {

    const button = $("#backToTop");

    if (!button) return;

    window.addEventListener("scroll", () => {

        if (window.scrollY > 500) {

            button.classList.add("show");

        } else {

            button.classList.remove("show");

        }

    });

    button.addEventListener("click", () => {

        window.scrollTo({

            top: 0,

            behavior: "smooth"

        });

    });

}

/*==================================================
                REVEAL ANIMATIONS
==================================================*/

function initRevealAnimations() {

    const elements = $$(
        ".reveal, .card, .team-card, .champion-card, .tournament"
    );

    if (!elements.length) return;

    const observer = new IntersectionObserver(

        entries => {

            entries.forEach(entry => {

                if (!entry.isIntersecting) return;

                entry.target.classList.add("visible");

                observer.unobserve(entry.target);

            });

        },

        {
            threshold: 0.15,
            rootMargin: "0px 0px -60px 0px"
        }

    );

    elements.forEach(element => {

        observer.observe(element);

    });

}

/*==================================================
                STAGGER REVEAL
==================================================*/

function staggerReveal(selector, delay = 120) {

    const elements = $$(selector);

    if (!elements.length) return;

    elements.forEach((element, index) => {

        element.style.transitionDelay = `${index * delay}ms`;

    });

}

/*==================================================
                HOVER GLOW
==================================================*/

function initHoverGlow() {

    const cards = $$(
        ".card, .team-card, .champion-card"
    );

    if (!cards.length) return;

    cards.forEach(card => {

        card.addEventListener("mousemove", e => {

            const rect = card.getBoundingClientRect();

            const x = e.clientX - rect.left;

            const y = e.clientY - rect.top;

            card.style.setProperty("--mouse-x", `${x}px`);

            card.style.setProperty("--mouse-y", `${y}px`);

        });

    });

}

/*==================================================
                COUNTER
==================================================*/

function animateCounter(element) {

    const target = Number(
        element.dataset.target
    );

    if (Number.isNaN(target)) return;

    const duration = 1800;

    const start = performance.now();

    function update(now) {

        const progress = Math.min(
            (now - start) / duration,
            1
        );

        const value = Math.floor(
            progress * target
        );

        element.textContent = value.toLocaleString();

        if (progress < 1) {

            requestAnimationFrame(update);

        } else {

            element.textContent =
                target.toLocaleString();

        }

    }

    requestAnimationFrame(update);

}

/*==================================================
                COUNTERS OBSERVER
==================================================*/

function initCounters() {

    const counters = $$("[data-target]");

    if (!counters.length) return;

    const observer = new IntersectionObserver(

        entries => {

            entries.forEach(entry => {

                if (!entry.isIntersecting) return;

                animateCounter(entry.target);

                observer.unobserve(entry.target);

            });

        },

        {

            threshold: 0.5

        }

    );

    counters.forEach(counter => {

        observer.observe(counter);

    });

}

/*==================================================
                PARALLAX
==================================================*/

function initParallax() {

    const hero = $(".hero");

    if (!hero) return;

    window.addEventListener("scroll", () => {

        const offset = window.scrollY * 0.35;

        hero.style.backgroundPositionY =
            `${offset}px`;

    });

}

/*==================================================
                HEADER SHRINK
==================================================*/

function initHeaderShrink() {

    const navbar = $(".navbar");

    if (!navbar) return;

    window.addEventListener("scroll", () => {

        if (window.scrollY > 120) {

            navbar.classList.add("compact");

        } else {

            navbar.classList.remove("compact");

        }

    });

}

/*==================================================
                INIT COMPONENTS
==================================================*/

document.addEventListener("DOMContentLoaded", () => {

    staggerReveal(".card");

    staggerReveal(".team-card", 70);

    initHoverGlow();

    initCounters();

    initParallax();

    initHeaderShrink();

});

/*==================================================
                RIPPLE EFFECT
==================================================*/

function createRipple(event) {

    const button = event.currentTarget;

    const ripple = document.createElement("span");

    const rect = button.getBoundingClientRect();

    const size = Math.max(rect.width, rect.height);

    ripple.className = "ripple";

    ripple.style.width = `${size}px`;

    ripple.style.height = `${size}px`;

    ripple.style.left =
        `${event.clientX - rect.left - size / 2}px`;

    ripple.style.top =
        `${event.clientY - rect.top - size / 2}px`;

    button.appendChild(ripple);

    ripple.addEventListener("animationend", () => {

        ripple.remove();

    });

}

function initRippleButtons() {

    $$(
        ".btn, .button, button"
    ).forEach(button => {

        button.addEventListener(
            "click",
            createRipple
        );

    });

}

/*==================================================
                COPY TO CLIPBOARD
==================================================*/

function copyText(text) {

    if (!navigator.clipboard) return;

    navigator.clipboard.writeText(text);

}

function initCopyButtons() {

    $$("[data-copy]").forEach(button => {

        button.addEventListener("click", () => {

            copyText(button.dataset.copy);

            button.classList.add("copied");

            setTimeout(() => {

                button.classList.remove("copied");

            }, 1800);

        });

    });

}

/*==================================================
                SCROLL PROGRESS
==================================================*/

function initScrollProgress() {

    const bar = $("#scrollProgress");

    if (!bar) return;

    window.addEventListener("scroll", () => {

        const scroll =
            document.documentElement.scrollTop;

        const height =
            document.documentElement.scrollHeight -
            document.documentElement.clientHeight;

        const progress =
            (scroll / height) * 100;

        bar.style.width = `${progress}%`;

    });

}

/*==================================================
                WINDOW RESIZE
==================================================*/

function initResizeHandler() {

    window.addEventListener("resize", () => {

        document.documentElement.style.setProperty(

            "--window-width",

            `${window.innerWidth}px`

        );

        document.documentElement.style.setProperty(

            "--window-height",

            `${window.innerHeight}px`

        );

    });

}

/*==================================================
                PAGE LOADER
==================================================*/

function initLoader() {

    const loader = $("#loader");

    if (!loader) return;

    window.addEventListener("load", () => {

        loader.classList.add("hide");

        setTimeout(() => {

            loader.remove();

        }, 700);

    });

}

/*==================================================
                INITIALIZATION
==================================================*/

document.addEventListener("DOMContentLoaded", () => {

    initRippleButtons();

    initTiltCards();

    initCopyButtons();

    initScrollProgress();

    initResizeHandler();

    initLoader();

});

/*==================================================
                THEME HELPERS
==================================================*/

function setCSSVariable(name, value) {

    document.documentElement
        .style
        .setProperty(name, value);

}

function getCSSVariable(name) {

    return getComputedStyle(

        document.documentElement

    ).getPropertyValue(name);

}

/*==================================================
                RANDOM UTILITIES
==================================================*/

function random(min, max) {

    return Math.floor(

        Math.random() * (max - min + 1)

    ) + min;

}

function clamp(value, min, max) {

    return Math.min(

        Math.max(value, min),

        max

    );

}

function debounce(callback, delay = 250) {

    let timeout;

    return (...args) => {

        clearTimeout(timeout);

        timeout = setTimeout(() => {

            callback(...args);

        }, delay);

    };

}

function throttle(callback, limit = 100) {

    let waiting = false;

    return (...args) => {

        if (waiting) return;

        callback(...args);

        waiting = true;

        setTimeout(() => {

            waiting = false;

        }, limit);

    };

}

/*==================================================
                WINDOW EVENTS
==================================================*/

window.addEventListener(

    "resize",

    debounce(() => {

        document.body.classList.add(

            "is-resizing"

        );

        clearTimeout(window.__resizeTimeout);

        window.__resizeTimeout = setTimeout(() => {

            document.body.classList.remove(

                "is-resizing"

            );

        }, 200);

    })

);

window.addEventListener(

    "scroll",

    throttle(() => {

        document.documentElement.style.setProperty(

            "--scroll-y",

            `${window.scrollY}px`

        );

    }, 20)

);

/*==================================================
                IMAGE LAZY EFFECT
==================================================*/

function initLazyImages() {

    const images = $$("img");

    if (!images.length) return;

    images.forEach(image => {

        image.addEventListener("load", () => {

            image.classList.add("loaded");

        });

    });

}

/*==================================================
                DISABLE DRAG
==================================================*/

function disableImageDrag() {

    $$("img").forEach(image => {

        image.draggable = false;

    });

}

/*==================================================
                DISABLE RIGHT CLICK
==================================================*/

function disableContextMenu() {

    document.addEventListener(

        "contextmenu",

        event => {

            if (

                event.target.matches("img")

            ) {

                event.preventDefault();

            }

        }

    );

}

/*==================================================
                KEYBOARD SHORTCUTS
==================================================*/

function initKeyboardShortcuts() {

    document.addEventListener(

        "keydown",

        event => {

            if (

                event.key === "Escape"

            ) {

                document.activeElement.blur();

            }

        }

    );

}

/*==================================================
                FINAL INITIALIZATION
==================================================*/

document.addEventListener(

    "DOMContentLoaded",

    () => {

        initLazyImages();

        disableImageDrag();

        disableContextMenu();

        initKeyboardShortcuts();

    }

);

/*==================================================
                END OF FILE
==================================================*/