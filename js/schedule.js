"use strict";

const scheduleElement = (tag, className, text) => {
    const element = document.createElement(tag);

    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;

    return element;
};

function teamView(team) {
    const element = scheduleElement("div", "team");
    const image = document.createElement("img");
    image.alt = `Logo de ${team.name}`;
    image.loading = "lazy";

    if (team.image) {
        image.src = team.image;
    } else {
        image.className = "team-image-empty";
        image.alt = "";
    }

    image.addEventListener("error", () => {
        image.removeAttribute("src");
        image.classList.add("team-image-empty");
    });

    element.append(image, scheduleElement("span", "", team.name));
    return element;
}

function matchView(match) {
    const card = scheduleElement("article", "match-card");
    card.dataset.channel = match.streamChannel;
    const date = scheduleElement("div", "match-date");
    date.appendChild(scheduleElement("span", "match-hour", match.date));

    const teams = scheduleElement("div", "match-teams");
    teams.append(teamView(match.teamA), scheduleElement("div", "vs", "VS"), teamView(match.teamB));

    const statusBox = scheduleElement("div", "match-status");
    const button = document.createElement("a");
    button.className = "match-status match-button";
    button.target = "_blank";
    button.rel = "noopener noreferrer";
    button.href = `https://www.twitch.tv/${encodeURIComponent(match.streamChannel)}`;
    button.setAttribute("aria-label", `Ver ${match.teamA.name} contra ${match.teamB.name} en Twitch`);
    button.append(scheduleElement("span", "status-dot"), scheduleElement("span", "status upcoming", "PRÓXIMAMENTE"));
    statusBox.appendChild(button);
    card.append(date, teams, statusBox);
    return card;
}

function renderSchedule(matches) {
    const schedule = document.querySelector("#schedule .container");

    if (!schedule) return;

    schedule.replaceChildren();
    const title = scheduleElement("div", "section-title");
    title.append(scheduleElement("h2", "", "CALENDARIO DE PARTIDOS"), scheduleElement("p", "", "Sigue cada batalla y no te pierdas ningún partido."));
    schedule.appendChild(title);

    [["high", "HIGH ELO", "fa-crown"], ["low", "LOW ELO", "fa-shield-halved"]].forEach(([tier, titleText, icon]) => {
        const group = scheduleElement("div", `schedule-group ${tier === "low" ? "schedule-low" : ""}`);
        const header = scheduleElement("div", `group-header ${tier === "low" ? "low" : ""}`);
        const iconElement = document.createElement("i");
        iconElement.className = `fa-solid ${icon}`;
        header.append(iconElement, scheduleElement("h2", "", titleText));
        const grid = scheduleElement("div", "matches");
        matches.filter(match => match.tier === tier).forEach(match => grid.appendChild(matchView(match)));
        group.append(header, grid);
        schedule.appendChild(group);
    });
}

async function loadSchedule() {
    try {
        const response = await fetch("/api/bracket", { cache: "no-store" });

        if (!response.ok) throw new Error("No se pudo cargar el calendario.");

        const data = await response.json();
        renderSchedule(data.schedule || []);

        if (typeof window.checkTwitchStatus === "function") {
            window.checkTwitchStatus();
        }
    } catch (error) {
        console.error("Schedule error:", error);
    }
}

document.addEventListener("DOMContentLoaded", loadSchedule);
setInterval(loadSchedule, 60000);
