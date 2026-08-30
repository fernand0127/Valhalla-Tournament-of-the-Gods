"use strict";

/*==================================================
                CONFIGURATION
==================================================*/

const COUNTDOWN_CONFIG = {

    targetDate: "2026-11-20T17:00:00",

    timezone: "America/Mexico_City",

    expiredText: "¡EL TORNEO HA COMENZADO!",

    updateInterval: 1000

};

/*==================================================
                SELECTORS
==================================================*/

const countdownElements = {

    days: document.getElementById("days"),

    hours: document.getElementById("hours"),

    minutes: document.getElementById("minutes"),

    seconds: document.getElementById("seconds"),

    container: document.getElementById("countdown"),

    status: document.getElementById("countdownStatus")

};

/*==================================================
                HELPERS
==================================================*/

function formatNumber(number) {

    return number.toString().padStart(2, "0");

}

function getTimeRemaining() {

    const now = new Date().getTime();

    const target = new Date(

        COUNTDOWN_CONFIG.targetDate

    ).getTime();

    const difference = target - now;

    return difference;

}

function calculateTime(difference) {

    return {

        days: Math.floor(

            difference /

            (1000 * 60 * 60 * 24)

        ),

        hours: Math.floor(

            (

                difference %

                (1000 * 60 * 60 * 24)

            ) /

            (1000 * 60 * 60)

        ),

        minutes: Math.floor(

            (

                difference %

                (1000 * 60 * 60)

            ) /

            (1000 * 60)

        ),

        seconds: Math.floor(

            (

                difference %

                (1000 * 60)

            ) /

            1000

        )

    };

}

/*==================================================
                UPDATE VALUES
==================================================*/

function updateCountdownDisplay(time) {

    if (countdownElements.days) {

        countdownElements.days.textContent =

            formatNumber(time.days);

    }

    if (countdownElements.hours) {

        countdownElements.hours.textContent =

            formatNumber(time.hours);

    }

    if (countdownElements.minutes) {

        countdownElements.minutes.textContent =

            formatNumber(time.minutes);

    }

    if (countdownElements.seconds) {

        countdownElements.seconds.textContent =

            formatNumber(time.seconds);

    }

}

/*==================================================
                EXPIRED
==================================================*/

function finishCountdown(interval) {

    clearInterval(interval);

    updateCountdownDisplay({

        days: 0,

        hours: 0,

        minutes: 0,

        seconds: 0

    });

    if (countdownElements.status) {

        countdownElements.status.textContent =

            COUNTDOWN_CONFIG.expiredText;

    }

    if (countdownElements.container) {

        countdownElements.container.classList.add(

            "countdown-finished"

        );

    }

}

/*==================================================
                MAIN COUNTDOWN
==================================================*/

let countdownInterval = null;

function updateCountdown() {

    const difference = getTimeRemaining();

    if (difference <= 0) {

        finishCountdown(countdownInterval);

        return;

    }

    const time = calculateTime(difference);

    updateCountdownDisplay(time);

}

/*==================================================
                START
==================================================*/

function startCountdown() {

    updateCountdown();

    countdownInterval = setInterval(

        updateCountdown,

        COUNTDOWN_CONFIG.updateInterval

    );

}

/*==================================================
                CARD ANIMATION
==================================================*/

function animateCountdownCards() {

    const cards = document.querySelectorAll(

        ".countdown-card"

    );

    if (!cards.length) return;

    cards.forEach((card, index) => {

        card.style.animationDelay =

            `${index * 120}ms`;

        card.classList.add("countdown-show");

    });

}

/*==================================================
                VALUE ANIMATION
==================================================*/

function pulseValue(element) {

    if (!element) return;

    element.classList.remove("pulse");

    void element.offsetWidth;

    element.classList.add("pulse");

}

function observeChanges() {

    const values = [

        countdownElements.days,

        countdownElements.hours,

        countdownElements.minutes,

        countdownElements.seconds

    ];

    values.forEach(element => {

        if (!element) return;

        const observer = new MutationObserver(() => {

            pulseValue(element);

        });

        observer.observe(element, {

            childList: true,

            characterData: true,

            subtree: true

        });

    });

}

/*==================================================
                VISIBILITY
==================================================*/

function pauseOnHidden() {

    document.addEventListener(

        "visibilitychange",

        () => {

            if (document.hidden) {

                clearInterval(countdownInterval);

            } else {

                startCountdown();

            }

        }

    );

}

/*==================================================
                INITIALIZATION
==================================================*/

document.addEventListener(

    "DOMContentLoaded",

    () => {

        animateCountdownCards();

        observeChanges();

        pauseOnHidden();

        startCountdown();

    }

);

/*==================================================
                RESTART
==================================================*/

function restartCountdown(newDate) {

    if (countdownInterval) {

        clearInterval(countdownInterval);

    }

    COUNTDOWN_CONFIG.targetDate = newDate;

    startCountdown();

}

/*==================================================
                CHANGE STATUS
==================================================*/

function setCountdownStatus(text = "") {

    if (!countdownElements.status) return;

    countdownElements.status.textContent = text;

}

/*==================================================
                FORMAT DATE
==================================================*/

function getTargetDate() {

    return new Date(

        COUNTDOWN_CONFIG.targetDate

    );

}

function getRemainingObject() {

    const difference = getTimeRemaining();

    if (difference <= 0) {

        return null;

    }

    return calculateTime(difference);

}

/*==================================================
                CUSTOM EVENTS
==================================================*/

function dispatchCountdownTick(time) {

    document.dispatchEvent(

        new CustomEvent(

            "countdown:tick",

            {

                detail: time

            }

        )

    );

}

function dispatchCountdownFinished() {

    document.dispatchEvent(

        new CustomEvent(

            "countdown:finished"

        )

    );

}

/*==================================================
                OVERRIDE UPDATE
==================================================*/

const originalUpdateCountdown = updateCountdown;

updateCountdown = function () {

    const difference = getTimeRemaining();

    if (difference <= 0) {

        finishCountdown(countdownInterval);

        dispatchCountdownFinished();

        return;

    }

    const time = calculateTime(difference);

    updateCountdownDisplay(time);

    dispatchCountdownTick(time);

};

/*==================================================
                DEBUG
==================================================*/

function countdownDebug() {

    console.table({

        Target: COUNTDOWN_CONFIG.targetDate,

        Remaining: getRemainingObject()

    });

}

/*==================================================
                END OF FILE
==================================================*/