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

function renderMatch(match) {
    const element = bracketElement("div", "match");

    [match.teamA, match.teamB].forEach(team => {
        const card = bracketElement("div", "team-card", team?.name || "TBD");

        if (team?.id && team.id === match.winner?.id) {
            card.classList.add("winner");
        }

        element.appendChild(card);
    });

    return element;
}

function renderBracket(bracketId, data) {
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

        if (heading) {
            heading.textContent = round.title;
        }

        roundElement.querySelectorAll(".match").forEach(match => match.remove());
        round.matches.forEach(match => roundElement.appendChild(renderMatch(match)));
    });

    roundElements.slice(data.rounds.length).forEach(round => {
        round.style.display = "none";
    });

    const champion = tournament.querySelector(".champion-card h2");

    if (champion) {
        champion.textContent = data.champion?.name || "TBD";
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
            renderBracket(id, bracket);
        });
    } catch (error) {
        console.error("Bracket error:", error);
    }
}

document.addEventListener("DOMContentLoaded", loadPublicBracket);

// Refresca la vista pública sin obligar a los visitantes a recargar la página.
setInterval(loadPublicBracket, 60000);
