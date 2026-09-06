"use strict";

function participantCard(team) {
    const card = document.createElement("article");
    card.className = "team-item";
    const image = document.createElement("img");
    image.alt = team.image ? `Logo de ${team.name}` : "";
    image.loading = "lazy";

    if (team.image) image.src = team.image;
    else image.className = "team-image-empty";

    image.addEventListener("error", () => {
        image.removeAttribute("src");
        image.classList.add("team-image-empty");
    });

    const name = document.createElement("h3");
    name.textContent = team.name;
    card.append(image, name);
    return card;
}

async function loadParticipants() {
    try {
        const response = await fetch("/api/bracket", { cache: "no-store" });
        if (!response.ok) throw new Error("No se pudo cargar a los participantes.");

        const data = await response.json();
        const grid = document.querySelector("#teams .teams-grid");
        if (!grid) return;

        grid.replaceChildren(...[...data.teams.high, ...data.teams.low].map(participantCard));
    } catch (error) {
        console.error("Participants error:", error);
    }
}

document.addEventListener("DOMContentLoaded", loadParticipants);
setInterval(loadParticipants, 60000);
