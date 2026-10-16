"use strict";

let bracketData = null;

const $ = selector => document.querySelector(selector);

function teamFields(team, tier) {
    const fields = document.createElement("div");
    fields.className = "admin-team-fields";

    [["Nombre", "name", team.name, "text", 40], ["Foto (URL)", "image", team.image, "url", 500]].forEach(([labelText, field, value, type, maxLength]) => {
        const label = document.createElement("label");
        label.textContent = labelText;
        const input = document.createElement("input");
        input.type = type;
        input.maxLength = maxLength;
        input.value = value || "";
        input.dataset.teamId = team.id;
        input.dataset.tier = tier;
        input.dataset.teamField = field;
        label.appendChild(input);
        fields.appendChild(label);
    });

    return fields;
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
        data.teams[tier].forEach(team => grid.appendChild(teamFields(team, tier)));
        group.append(heading, grid);
        editor.appendChild(group);
    });

    const wildcardGroup = document.createElement("section");
    wildcardGroup.className = "team-group";
    const wildcardHeading = document.createElement("h3");
    wildcardHeading.textContent = "Equipo de reposición";
    const wildcardText = document.createElement("p");
    wildcardText.textContent = "Este equipo completa el octavo lugar de Perdedores High Elo.";
    const wildcardFields = teamFields(data.teams.highLoserWildcard, "highLoserWildcard");
    wildcardGroup.append(wildcardHeading, wildcardText, wildcardFields);
    editor.appendChild(wildcardGroup);
}

function scheduleField(labelText, value, key, matchId, type = "text") {
    const label = document.createElement("label");
    label.className = "schedule-field";
    label.textContent = labelText;
    const input = document.createElement("input");
    input.type = type;
    input.value = value || "";
    input.dataset.scheduleId = matchId;
    input.dataset.scheduleKey = key;
    input.maxLength = key.includes("image") ? 500 : 50;
    label.appendChild(input);
    return label;
}

function teamSelect(labelText, selectedId, matchId, key, teams) {
    const label = document.createElement("label");
    label.className = "schedule-field";
    label.textContent = labelText;
    const select = document.createElement("select");
    select.dataset.scheduleId = matchId;
    select.dataset.scheduleKey = key;

    teams.forEach(team => {
        const category = team.id.startsWith("high-") ? "High" : "Low";
        select.add(new Option(`${category} · ${team.name}`, team.id, false, team.id === selectedId));
    });

    label.appendChild(select);
    return label;
}

function renderSchedule(data) {
    const editor = $("#scheduleEditor");
    editor.replaceChildren();

    ["high", "low"].forEach(tier => {
        const group = document.createElement("section");
        group.className = "schedule-admin-group";
        const heading = document.createElement("h3");
        heading.textContent = tier === "high" ? "High Elo · primera ronda" : "Low Elo · cuartos de final";
        group.appendChild(heading);

        data.schedule.filter(match => match.tier === tier).forEach((match, index) => {
            const card = document.createElement("div");
            card.className = "schedule-admin-card";
            const title = document.createElement("h4");
            title.textContent = `Partido ${index + 1}`;
            const fields = document.createElement("div");
            fields.className = "schedule-fields";
            fields.append(
                scheduleField("Fecha", match.date, "date", match.id),
                teamSelect("Equipo A", match.teamAId, match.id, "teamAId", [...data.teams.high, ...data.teams.low]),
                teamSelect("Equipo B", match.teamBId, match.id, "teamBId", [...data.teams.high, ...data.teams.low]),
                scheduleField("Canal Twitch", match.streamChannel, "streamChannel", match.id)
            );
            card.append(title, fields);
            group.appendChild(card);
        });
        editor.appendChild(group);
    });
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
        "high-pass": "Pase a Perdedores High Elo",
        "low-pass": "Pase a Perdedores Low Elo",
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

function layoutInputs(labelText, key, layout) {
    const row = document.createElement("div");
    row.className = "layout-row";
    const label = document.createElement("span");
    label.textContent = labelText;
    const x = document.createElement("input");
    x.type = "number";
    x.value = layout?.[key]?.x || 0;
    x.dataset.layoutKey = key;
    x.dataset.layoutAxis = "x";
    x.setAttribute("aria-label", `${labelText}, horizontal`);
    const y = document.createElement("input");
    y.type = "number";
    y.value = layout?.[key]?.y || 0;
    y.dataset.layoutKey = key;
    y.dataset.layoutAxis = "y";
    y.setAttribute("aria-label", `${labelText}, vertical`);
    const axis = document.createElement("small");
    axis.textContent = "X / Y";
    row.append(label, x, y, axis);
    return row;
}

function renderLayout(data) {
    const editor = $("#layoutEditor");
    editor.replaceChildren();
    const titles = {
        high: "High Elo",
        low: "Low Elo",
        "high-pass": "Pase a Perdedores High Elo",
        "low-pass": "Pase a Perdedores Low Elo",
        "high-loser": "Perdedores High Elo",
        "low-loser": "Perdedores Low Elo"
    };

    Object.entries(data.brackets).forEach(([bracketId, bracket]) => {
        const group = document.createElement("section");
        group.className = "layout-group";
        const heading = document.createElement("h3");
        heading.textContent = titles[bracketId];
        group.appendChild(heading);

        bracket.rounds.forEach(round => {
            group.appendChild(layoutInputs(`Título: ${round.title}`, `title:${round.id}`, data.layout));
            round.matches.forEach((match, index) => {
                group.appendChild(layoutInputs(`Partido ${index + 1}: ${match.teamA?.name || "TBD"} vs ${match.teamB?.name || "TBD"}`, `match:${match.id}`, data.layout));
            });
        });
        if ("champion" in bracket) {
            group.appendChild(layoutInputs("Título: Campeones", `title:${bracketId}-champion`, data.layout));
            group.appendChild(layoutInputs("Recuadro del campeón (corona y nombre)", `champion:${bracketId}`, data.layout));
        }
        editor.appendChild(group);
    });
}

function showDashboard(data) {
    bracketData = data;
    $("#loginPanel").hidden = true;
    $("#dashboard").hidden = false;
    renderTeams(data);
    renderSchedule(data);
    renderMatches(data);
    renderLayout(data);
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
        const bucket = teams[input.dataset.tier];
        const current = Array.isArray(bucket)
            ? bucket.find(item => item.id === input.dataset.teamId)
            : bucket?.id === input.dataset.teamId ? bucket : null;
        const item = current || { id: input.dataset.teamId, name: "", image: "" };
        item[input.dataset.teamField] = input.value;

        if (input.dataset.tier === "highLoserWildcard") {
            teams.highLoserWildcard = item;
        } else if (!current) {
            teams[input.dataset.tier].push(item);
        }
    });

    const results = {};
    document.querySelectorAll("[data-match-id]").forEach(select => {
        if (select.value) {
            results[select.dataset.matchId] = select.value;
        }
    });

    const schedule = (bracketData?.schedule || []).map(match => structuredClone(match));

    document.querySelectorAll("[data-schedule-id]").forEach(input => {
        const match = schedule.find(item => item.id === input.dataset.scheduleId);
        if (!match) return;

        match[input.dataset.scheduleKey] = input.value;
    });

    const layout = {};
    document.querySelectorAll("[data-layout-key]").forEach(input => {
        const key = input.dataset.layoutKey;
        layout[key] ||= { x: 0, y: 0 };
        layout[key][input.dataset.layoutAxis] = Number(input.value) || 0;
    });

    return { teams, results, schedule, layout };
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
