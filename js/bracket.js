"use strict";

const bracketElement = (tag, className, text) => {
    const element = document.createElement(tag);

    if (className) {
        element.className = className;
    }

    if (text !== undefined) {
        element.textContent = text;
    }

    return element;
};

function applyLayout(element, layout, key) {
    const position = layout?.[key] || {};
    element.style.setProperty("--layout-x", `${Number(position.x) || 0}px`);
    element.style.setProperty("--layout-y", `${Number(position.y) || 0}px`);
}

function renderMatch(match, layout) {
    const element = bracketElement("div", "match");
    element.dataset.matchId = match.id;
    applyLayout(element, layout, `match:${match.id}`);

    [match.teamA, match.teamB].forEach(team => {
        const card = bracketElement("div", "team-card", team?.name || "TBD");

        if (team?.id && team.id === match.winner?.id) {
            card.classList.add("winner");
        }

        element.appendChild(card);
    });

    return element;
}

function renderBracket(bracketId, data, layout) {
    const tournament = document.querySelector(`[data-bracket-id="${bracketId}"]`);

    if (!tournament || !data) {
        return;
    }

    tournament.classList.add("bracket-readonly");
    const roundElements = [...tournament.querySelectorAll(":scope > .bracket > .round")];

    data.rounds.forEach((round, index) => {
        const roundElement = roundElements[index];

        if (!roundElement) {
            return;
        }

        const heading = roundElement.querySelector("h3");
        roundElement.dataset.roundId = round.id;

        if (heading) {
            heading.textContent = round.title;
            applyLayout(heading, layout, `title:${round.id}`);
        }

        roundElement.querySelectorAll(".match").forEach(match => match.remove());
        round.matches.forEach(match => roundElement.appendChild(renderMatch(match, layout)));
    });

    roundElements.slice(data.rounds.length).forEach(round => {
        round.style.display = "none";
    });

    const championCard = tournament.querySelector(".champion-card");
    const champion = tournament.querySelector(".champion-card h2");
    const championTitle = tournament.querySelector(".champion > h3");

    if (champion) {
        champion.textContent = data.champion?.name || "TBD";
    }

    if (championTitle) {
        applyLayout(championTitle, layout, `title:${bracketId}-champion`);
    }

    if (championCard) {
        applyLayout(championCard, layout, `champion:${bracketId}`);
    }
}

async function loadPublicBracket() {
    try {
        const response = await fetch("/api/bracket", { cache: "no-store" });

        if (!response.ok) {
            throw new Error("No se pudo cargar el bracket.");
        }

        const data = await response.json();

        Object.entries(data.brackets).forEach(([id, bracket]) => {
            renderBracket(id, bracket, data.layout);
        });
    } catch (error) {
        console.error("Bracket error:", error);
    }
}

document.addEventListener("DOMContentLoaded", loadPublicBracket);

// Refresca la vista pública sin obligar a los visitantes a recargar la página.
setInterval(loadPublicBracket, 60000);
