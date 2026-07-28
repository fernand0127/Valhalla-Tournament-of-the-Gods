"use strict";

/*==================================================
                VALHALLA
            bracket.js V1 — Parte 1
==================================================*/

/*==================================================
                CONFIGURATION
==================================================*/

const BRACKET = {

    high: {

        champion: "#highChampion",

        rounds: [

            ".high .round:nth-child(1)",

            ".high .round:nth-child(2)",

            ".high .round:nth-child(3)"

        ]

    },

    low: {

        champion: "#lowChampion",

        rounds: [

            ".low .round:nth-child(1)",

            ".low .round:nth-child(2)",

            ".low .round:nth-child(3)"

        ]

    }

};

/*==================================================
                HELPERS
==================================================*/

const bracket = {

    qs(selector, parent = document) {

        return parent.querySelector(selector);

    },

    qsa(selector, parent = document) {

        return [...parent.querySelectorAll(selector)];

    }

};

/*==================================================
                TEAM CARD
==================================================*/

function createTeamCard(name, classes = "") {

    const card = document.createElement("div");

    card.className = `team-card ${classes}`.trim();

    card.textContent = name;

    return card;

}

/*==================================================
                MATCH
==================================================*/

function createMatch(teamA, teamB) {

    const match = document.createElement("div");

    match.className = "match";

    match.appendChild(

        createTeamCard(teamA)

    );

    match.appendChild(

        createTeamCard(teamB)

    );

    return match;

}

/*==================================================
                ROUND
==================================================*/

function clearRound(round) {

    if (!round) return;

    round.querySelectorAll(".match")

        .forEach(match => match.remove());

}

function appendMatch(round, match) {

    if (!round) return;

    round.appendChild(match);

}

/*==================================================
                CHAMPION
==================================================*/

function setChampion(id, name) {

    const champion =

        document.querySelector(id);

    if (!champion) return;

    champion.textContent = name;

}

/*==================================================
                WINNER
==================================================*/

function markWinner(card) {

    if (!card) return;

    card.classList.add("winner");

}

function unmarkWinner(card) {

    if (!card) return;

    card.classList.remove("winner");

}

/*==================================================
                FINALIST
==================================================*/

function markFinalist(card) {

    if (!card) return;

    card.classList.add("finalist");

}

function clearFinalists(parent) {

    if (!parent) return;

    parent.querySelectorAll(".finalist")

        .forEach(card => {

            card.classList.remove("finalist");

        });

}

/*==================================================
                CLICK EVENTS
==================================================*/

function clearRoundWinners(round) {

    if (!round) return;

    round.querySelectorAll(".winner")

        .forEach(card => {

            card.classList.remove("winner");

        });

}

function enableWinnerSelection(round) {

    if (!round) return;

    const cards = round.querySelectorAll(".team-card");

    cards.forEach(card => {

        card.addEventListener("click", () => {

            clearRoundWinners(round);

            card.classList.add("winner");

        });

    });

}

/*==================================================
                ROUND INITIALIZATION
==================================================*/

function initializeBracketRounds() {

    const rounds =

        document.querySelectorAll(".round");

    rounds.forEach(round => {

        enableWinnerSelection(round);

    });

}

/*==================================================
                CHAMPION ANIMATION
==================================================*/

function animateChampion(id) {

    const champion =

        document.querySelector(id);

    if (!champion) return;

    champion.classList.remove("champion-show");

    void champion.offsetWidth;

    champion.classList.add("champion-show");

}

/*==================================================
                UPDATE CHAMPION
==================================================*/

function updateChampion(id, teamName) {

    setChampion(id, teamName);

    animateChampion(id);

}

/*==================================================
                RESET
==================================================*/

function resetBracket(root) {

    if (!root) return;

    root.querySelectorAll(".winner")

        .forEach(card => {

            card.classList.remove("winner");

        });

    root.querySelectorAll(".finalist")

        .forEach(card => {

            card.classList.remove("finalist");

        });

}

/*==================================================
                RANDOM WINNER
==================================================*/

function randomWinner(match) {

    if (!match) return null;

    const cards =

        [...match.querySelectorAll(".team-card")];

    if (!cards.length) return null;

    const winner =

        cards[Math.floor(Math.random() * cards.length)];

    cards.forEach(card => {

        card.classList.remove("winner");

    });

    winner.classList.add("winner");

    return winner.textContent.trim();

}

/*==================================================
                RANDOM ROUND
==================================================*/

function simulateRound(round) {

    if (!round) return [];

    const winners = [];

    const matches =

        round.querySelectorAll(".match");

    matches.forEach(match => {

        const winner = randomWinner(match);

        if (winner) {

            winners.push(winner);

        }

    });

    return winners;

}

/*==================================================
                AUTO ADVANCE
==================================================*/

function advanceTeams(sourceRound, targetRound) {

    if (!sourceRound || !targetRound) return;

    const winners = [];

    sourceRound.querySelectorAll(".winner")

        .forEach(card => {

            winners.push(

                card.textContent.trim()

            );

        });

    clearRound(targetRound);

    for (let i = 0; i < winners.length; i += 2) {

        appendMatch(

            targetRound,

            createMatch(

                winners[i] ?? "TBD",

                winners[i + 1] ?? "TBD"

            )

        );

    }

    enableWinnerSelection(targetRound);

}

/*==================================================
                UPDATE BRACKET
==================================================*/

function updateBracket(type) {

    const config = BRACKET[type];

    if (!config) return;

    const quarter =

        bracket.qs(config.rounds[0]);

    const semifinal =

        bracket.qs(config.rounds[1]);

    const final =

        bracket.qs(config.rounds[2]);

    advanceTeams(

        quarter,

        semifinal

    );

    advanceTeams(

        semifinal,

        final

    );

}

/*==================================================
                DETERMINE CHAMPION
==================================================*/

function updateChampionFromFinal(type) {

    const config = BRACKET[type];

    if (!config) return;

    const finalRound =

        bracket.qs(config.rounds[2]);

    if (!finalRound) return;

    const winner =

        finalRound.querySelector(

            ".winner"

        );

    if (!winner) return;

    updateChampion(

        config.champion,

        winner.textContent.trim()

    );

}

/*==================================================
                BUTTONS
==================================================*/

function initializeButtons() {

    document

        .querySelectorAll("[data-bracket]")

        .forEach(button => {

            button.addEventListener(

                "click",

                () => {

                    const type =

                        button.dataset.bracket;

                    updateBracket(type);

                }

            );

        });

}

/*==================================================
                OBSERVER
==================================================*/

function observeFinals() {

    document

        .querySelectorAll(

            ".round:nth-child(3)"

        )

        .forEach(round => {

            const observer =

                new MutationObserver(() => {

                    const tournament =

                        round.closest(

                            ".tournament"

                        );

                    if (!tournament) return;

                    const type =

                        tournament.classList.contains(

                            "high"

                        )

                        ? "high"

                        : "low";

                    updateChampionFromFinal(

                        type

                    );

                });

            observer.observe(round, {

                subtree: true,

                childList: true,

                attributes: true,

                attributeFilter: [

                    "class"

                ]

            });

        });

}

/*==================================================
                INITIALIZATION
==================================================*/

document.addEventListener(

    "DOMContentLoaded",

    () => {

        initializeBracketRounds();

        initializeButtons();

        observeFinals();

    }

);

/*==================================================
                EXPORT
==================================================*/

function exportBracket(type) {

    const config = BRACKET[type];

    if (!config) return;

    const data = {

        champion:

            document.querySelector(

                config.champion

            )?.textContent ?? "TBD",

        rounds: []

    };

    config.rounds.forEach(selector => {

        const round = bracket.qs(selector);

        if (!round) return;

        const matches = [];

        round.querySelectorAll(".match")

            .forEach(match => {

                matches.push({

                    teams:

                        [...match.querySelectorAll(".team-card")]

                        .map(card => ({

                            name:

                                card.textContent.trim(),

                            winner:

                                card.classList.contains("winner"),

                            finalist:

                                card.classList.contains("finalist")

                        }))

                });

            });

        data.rounds.push(matches);

    });

    return data;

}

/*==================================================
                SAVE
==================================================*/

function saveBracket(type) {

    const data = exportBracket(type);

    if (!data) return;

    localStorage.setItem(

        `valhalla_${type}_bracket`,

        JSON.stringify(data)

    );

}

/*==================================================
                LOAD
==================================================*/

function loadBracket(type) {

    const saved = localStorage.getItem(

        `valhalla_${type}_bracket`

    );

    if (!saved) return null;

    return JSON.parse(saved);

}

/*==================================================
                CLEAR SAVE
==================================================*/

function clearBracketSave(type) {

    localStorage.removeItem(

        `valhalla_${type}_bracket`

    );

}

/*==================================================
                AUTO SAVE
==================================================*/

function initializeAutosave() {

    document.addEventListener(

        "click",

        event => {

            if (

                !event.target.classList.contains(

                    "team-card"

                )

            ) {

                return;

            }

            saveBracket("high");

            saveBracket("low");

        }

    );

}

/*==================================================
                RESET BUTTONS
==================================================*/

function initializeResetButtons() {

    document

        .querySelectorAll("[data-reset]")

        .forEach(button => {

            button.addEventListener(

                "click",

                () => {

                    const type =

                        button.dataset.reset;

                    const tournament =

                        document.querySelector(

                            `.${type}`

                        );

                    if (!tournament) return;

                    resetBracket(tournament);

                    clearBracketSave(type);

                    setChampion(

                        BRACKET[type].champion,

                        "TBD"

                    );

                }

            );

        });

}

/*==================================================
                STARTUP
==================================================*/

document.addEventListener(

    "DOMContentLoaded",

    () => {

        initializeAutosave();

        initializeResetButtons();

    }

);

/*==================================================
                END OF FILE
==================================================*/