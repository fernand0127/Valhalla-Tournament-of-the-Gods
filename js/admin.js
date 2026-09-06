"use strict";

let bracketData = null;

const $ = selector => document.querySelector(selector);

function teamInput(team, tier) {
    const input = document.createElement("input");
    input.type = "text";
    input.maxLength = 40;
    input.value = team.name;
    input.dataset.teamId = team.id;
    input.dataset.tier = tier;
    input.setAttribute("aria-label", `Nombre de ${team.name}`);
    return input;
}

function renderTeams(data) {
    const editor = $("#teamEditor");
    editor.replaceChildren();

    [["high", "High Elo"], ["low", "Low Elo"]].forEach(([tier, title]) => {
        const group = document.createElement("section");
        group.className = "team-group";
        const heading = document.createElement("h3");
        heading.textContent = title;
        const grid = document.createElement("div");
        grid.className = "team-grid";
        data.teams[tier].forEach(team => grid.appendChild(teamInput(team, tier)));
        group.append(heading, grid);
        editor.appendChild(group);
    });

    const wildcardGroup = document.createElement("section");
    wildcardGroup.className = "team-group";
    const wildcardHeading = document.createElement("h3");
    wildcardHeading.textContent = "Equipo de reposición";
    const wildcardText = document.createElement("p");
    wildcardText.textContent = "Este equipo completa el octavo lugar de Perdedores High Elo.";
    const wildcardInput = teamInput(data.teams.highLoserWildcard, "highLoserWildcard");
    wildcardGroup.append(wildcardHeading, wildcardText, wildcardInput);
    editor.appendChild(wildcardGroup);
}

function readableMatch(match) {
    return `${match.teamA?.name || "TBD"} vs ${match.teamB?.name || "TBD"}`;
}

function renderMatches(data) {
    const editor = $("#matchEditor");
    editor.replaceChildren();

    const titles = {
        high: "High Elo",
        low: "Low Elo",
        "high-loser": "Perdedores High Elo",
        "low-loser": "Perdedores Low Elo"
    };

    Object.entries(data.brackets).forEach(([bracketId, bracket]) => {
        const group = document.createElement("section");
        group.className = "match-group";
        const title = document.createElement("h3");
        title.textContent = titles[bracketId];
        group.appendChild(title);

        bracket.rounds.forEach(round => {
            const roundElement = document.createElement("div");
            roundElement.className = "round-editor";
            const heading = document.createElement("h4");
            heading.textContent = round.title;
            roundElement.appendChild(heading);

            round.matches.forEach(match => {
                const row = document.createElement("label");
                row.className = "match-row";
                const label = document.createElement("span");
                label.textContent = readableMatch(match);
                const select = document.createElement("select");
                select.dataset.matchId = match.id;
                const empty = new Option("Sin resultado", "");
                select.add(empty);

                match.candidates.forEach(team => {
                    select.add(new Option(`Ganador: ${team.name}`, team.id, false, match.winner?.id === team.id));
                });

                select.disabled = match.candidates.length !== 2;
                row.append(label, select);
                roundElement.appendChild(row);
            });

            group.appendChild(roundElement);
        });

        editor.appendChild(group);
    });
}

function showDashboard(data) {
    bracketData = data;
    $("#loginPanel").hidden = true;
    $("#dashboard").hidden = false;
    renderTeams(data);
    renderMatches(data);
}

async function fetchBracket() {
    const response = await fetch("/api/bracket", { cache: "no-store" });

    if (!response.ok) {
        throw new Error("No se pudo cargar el bracket.");
    }

    return response.json();
}

function getFormState() {
    const teams = { high: [], low: [], highLoserWildcard: null };
    document.querySelectorAll("[data-team-id]").forEach(input => {
        const item = { id: input.dataset.teamId, name: input.value };

        if (input.dataset.tier === "highLoserWildcard") {
            teams.highLoserWildcard = item;
        } else {
            teams[input.dataset.tier].push(item);
        }
    });

    const results = {};
    document.querySelectorAll("[data-match-id]").forEach(select => {
        if (select.value) {
            results[select.dataset.matchId] = select.value;
        }
    });

    return { teams, results };
}

$("#loginForm").addEventListener("submit", async event => {
    event.preventDefault();
    const message = $("#loginMessage");
    message.textContent = "";

    try {
        const response = await fetch("/api/admin-login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password: $("#password").value })
        });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "No se pudo iniciar sesión.");
        }

        showDashboard(await fetchBracket());
    } catch (error) {
        message.textContent = error.message;
    }
});

$("#saveButton").addEventListener("click", async () => {
    const message = $("#saveMessage");
    message.textContent = "Guardando…";

    try {
        const response = await fetch("/api/bracket", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(getFormState())
        });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "No se pudo guardar.");
        }

        showDashboard(data);
        message.textContent = "Cambios publicados correctamente.";
    } catch (error) {
        message.textContent = error.message;
    }
});

$("#logoutButton").addEventListener("click", async () => {
    await fetch("/api/admin-logout", { method: "POST" });
    $("#dashboard").hidden = true;
    $("#loginPanel").hidden = false;
    $("#password").value = "";
});
