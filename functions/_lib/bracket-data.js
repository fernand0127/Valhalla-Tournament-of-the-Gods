const STORAGE_KEY = "current";

const team = (id, name, image = "") => ({ id, name, image });

function defaultScheduleMatch(id, tier, number) {
    const label = tier === "high" ? "High" : "Low";

    return {
        id,
        tier,
        date: "POR DEFINIR",
        teamAId: `${tier}-${(number * 2) - 1}`,
        teamBId: `${tier}-${number * 2}`,
        streamChannel: "AthenaKamelot"
    };
}

function createDefaultSchedule() {
    return [
        ...Array.from({ length: 7 }, (_, index) => defaultScheduleMatch(`high-schedule-${index + 1}`, "high", index + 1)),
        ...Array.from({ length: 4 }, (_, index) => defaultScheduleMatch(`low-schedule-${index + 1}`, "low", index + 1))
    ];
}

export function createDefaultState() {
    return {
        teams: {
            high: Array.from({ length: 14 }, (_, index) =>
                team(`high-${index + 1}`, `High Team ${index + 1}`)
            ),
            low: Array.from({ length: 8 }, (_, index) =>
                team(`low-${index + 1}`, `Low Team ${index + 1}`)
            ),
            highLoserWildcard: team("high-loser-wildcard", "Equipo de reposición")
        },
        results: {},
        passOpponents: {},
        schedule: createDefaultSchedule(),
        layout: {}
    };
}

function cleanTeams(input, tier, count) {
    const fallback = createDefaultState().teams[tier];

    return Array.from({ length: count }, (_, index) => {
        const rawName = input?.[index]?.name;
        const name = typeof rawName === "string"
            ? rawName.trim().slice(0, 40)
            : "";

        const image = typeof input?.[index]?.image === "string"
            ? input[index].image.trim().slice(0, 500)
            : "";

        return team(`${tier}-${index + 1}`, name || fallback[index].name, image);
    });
}

function getTeamMap(state) {
    return new Map(
        [...state.teams.high, ...state.teams.low, state.teams.highLoserWildcard]
            .map(item => [item.id, item])
    );
}

function createMatch(results, id, teamA, teamB) {
    const candidates = [teamA, teamB].filter(Boolean);
    const selected = candidates.some(item => item.id === results[id])
        ? results[id]
        : null;
    const winnerId = selected;
    const winner = candidates.find(item => item.id === winnerId) || null;
    const loser = winner
        ? candidates.find(item => item.id !== winner.id) || null
        : null;

    return {
        id,
        teamA: teamA || null,
        teamB: teamB || null,
        winner,
        loser,
        candidates
    };
}

function makeRound(id, title, matches) {
    return { id, title, matches };
}

function winner(match) {
    return match?.winner || null;
}

function loser(match) {
    return match?.loser || null;
}

export function buildBracket(state) {
    const teamMap = getTeamMap(state);
    const high = state.teams.high;
    const low = state.teams.low;
    const results = state.results || {};
    const selectedPassOpponent = (matchId, fallback) =>
        teamMap.get(state.passOpponents?.[matchId]) || fallback;

    const highFirst = Array.from({ length: 7 }, (_, index) =>
        createMatch(results, `high-r1-${index + 1}`, high[index * 2], high[index * 2 + 1])
    );

    // Los perdedores de la primera ronda disputan primero el pase al cuadro
    // de perdedores. Los ganadores de esta fase entran al cuadro principal.
    const highPass = [
        createMatch(results, "high-pass-1", loser(highFirst[0]), selectedPassOpponent("high-pass-1", loser(highFirst[1]))),
        createMatch(results, "high-pass-2", loser(highFirst[2]), selectedPassOpponent("high-pass-2", loser(highFirst[3]))),
        createMatch(results, "high-pass-3", loser(highFirst[4]), selectedPassOpponent("high-pass-3", loser(highFirst[5]))),
        createMatch(results, "high-pass-4", loser(highFirst[6]), selectedPassOpponent("high-pass-4", state.teams.highLoserWildcard))
    ];
    const highLoserSemi = [
        createMatch(results, "high-lb-sf-1", winner(highPass[0]), winner(highPass[1])),
        createMatch(results, "high-lb-sf-2", winner(highPass[2]), winner(highPass[3]))
    ];
    const highLoserFinal = createMatch(
        results,
        "high-lb-final",
        winner(highLoserSemi[0]),
        winner(highLoserSemi[1])
    );

    const highQuarter = [
        createMatch(results, "high-qf-1", winner(highFirst[0]), winner(highFirst[1])),
        createMatch(results, "high-qf-2", winner(highFirst[2]), winner(highFirst[3])),
        createMatch(results, "high-qf-3", winner(highFirst[4]), winner(highFirst[5])),
        createMatch(results, "high-qf-4", winner(highFirst[6]), winner(highLoserFinal))
    ];
    const highSemi = [
        createMatch(results, "high-sf-1", winner(highQuarter[0]), winner(highQuarter[1])),
        createMatch(results, "high-sf-2", winner(highQuarter[2]), winner(highQuarter[3]))
    ];
    const highFinal = createMatch(results, "high-final", winner(highSemi[0]), winner(highSemi[1]));

    const lowQuarter = Array.from({ length: 4 }, (_, index) =>
        createMatch(results, `low-qf-${index + 1}`, low[index * 2], low[index * 2 + 1])
    );
    const lowPass = [
        createMatch(results, "low-pass-1", loser(lowQuarter[0]), selectedPassOpponent("low-pass-1", loser(lowQuarter[1]))),
        createMatch(results, "low-pass-2", loser(lowQuarter[2]), selectedPassOpponent("low-pass-2", loser(lowQuarter[3])))
    ];
    const lowLoserFinal = createMatch(
        results,
        "low-lb-final",
        winner(lowPass[0]),
        winner(lowPass[1])
    );
    const lowSemi = [
        createMatch(results, "low-sf-1", winner(lowQuarter[0]), winner(lowQuarter[1])),
        createMatch(results, "low-sf-2", winner(lowQuarter[2]), winner(lowQuarter[3]))
    ];
    const lowFinal = createMatch(results, "low-final", winner(lowSemi[0]), winner(lowSemi[1]));

    const brackets = {
        high: {
            rounds: [
                makeRound("high-r1", "Primera ronda", highFirst),
                makeRound("high-qf", "Cuartos de final", highQuarter),
                makeRound("high-sf", "Semifinales", highSemi),
                makeRound("high-final", "Final", [highFinal])
            ],
            champion: winner(highFinal)
        },
        low: {
            rounds: [
                makeRound("low-qf", "Cuartos de final", lowQuarter),
                makeRound("low-sf", "Semifinales", lowSemi),
                makeRound("low-final", "Final", [lowFinal])
            ],
            champion: winner(lowFinal)
        },
        "high-pass": {
            rounds: [
                makeRound("high-pass", "Pase a perdedores", highPass)
            ],
            access: {
                id: "high-pass-access",
                title: "Acceso a perdedores",
                teams: highPass.map(winner)
            }
        },
        "low-pass": {
            rounds: [
                makeRound("low-pass", "Pase a perdedores", lowPass)
            ],
            access: {
                id: "low-pass-access",
                title: "Acceso a perdedores",
                teams: lowPass.map(winner)
            }
        },
        "high-loser": {
            rounds: [
                makeRound("high-lb-sf", "Semifinales", highLoserSemi),
                makeRound("high-lb-final", "Final", [highLoserFinal])
            ],
            champion: winner(highLoserFinal)
        },
        "low-loser": {
            rounds: [
                makeRound("low-lb-final", "Final", [lowLoserFinal])
            ],
            champion: winner(lowLoserFinal)
        }
    };

    const allMatches = Object.values(brackets).flatMap(bracket =>
        bracket.rounds.flatMap(round => round.matches)
    );

    const schedule = state.schedule.map(match => ({
        ...match,
        teamA: teamMap.get(match.teamAId) || team("", "Equipo por definir"),
        teamB: teamMap.get(match.teamBId) || team("", "Equipo por definir")
    }));

    return {
        teams: state.teams,
        results: state.results,
        passOpponents: state.passOpponents || {},
        schedule,
        layout: state.layout || {},
        brackets,
        matches: allMatches,
        teamMap
    };
}

export function sanitizeState(input) {
    const rawResults = input?.results && typeof input.results === "object"
        ? input.results
        : {};
    const state = {
        teams: {
            high: cleanTeams(input?.teams?.high, "high", 14),
            low: cleanTeams(input?.teams?.low, "low", 8),
            highLoserWildcard: team(
                "high-loser-wildcard",
                typeof input?.teams?.highLoserWildcard?.name === "string"
                    ? input.teams.highLoserWildcard.name.trim().slice(0, 40) || "Equipo de reposición"
                    : "Equipo de reposición",
                typeof input?.teams?.highLoserWildcard?.image === "string"
                    ? input.teams.highLoserWildcard.image.trim().slice(0, 500)
                    : ""
            )
        },
        results: {},
        passOpponents: {},
        schedule: [],
        layout: sanitizeLayout(input?.layout)
    };
    const teamMap = getTeamMap(state);
    state.passOpponents = sanitizePassOpponents(input?.passOpponents, teamMap);
    state.schedule = sanitizeSchedule(input?.schedule, teamMap);
    const calculated = buildBracket({ ...state, results: rawResults });

    calculated.matches.forEach(match => {
        const submittedWinner = rawResults[match.id];

        if (match.candidates.some(item => item.id === submittedWinner)) {
            state.results[match.id] = submittedWinner;
        }
    });

    return state;
}

function sanitizePassOpponents(input, teamMap) {
    const allowedIds = [
        "high-pass-1", "high-pass-2", "high-pass-3", "high-pass-4",
        "low-pass-1", "low-pass-2"
    ];

    return Object.fromEntries(
        allowedIds
            .filter(id => teamMap.has(input?.[id]))
            .map(id => [id, input[id]])
    );
}

function sanitizeLayout(input) {
    if (!input || typeof input !== "object" || Array.isArray(input)) return {};

    return Object.fromEntries(
        Object.entries(input)
            .filter(([key]) => /^(match|title|champion|access):[a-z0-9-]+$/i.test(key))
            .map(([key, position]) => [key, {
                x: Number.isFinite(Number(position?.x)) ? Math.max(-800, Math.min(800, Number(position.x))) : 0,
                y: Number.isFinite(Number(position?.y)) ? Math.max(-800, Math.min(800, Number(position.y))) : 0
            }])
    );
}

function sanitizeSchedule(input, teamMap) {
    const fallback = createDefaultSchedule();

    return fallback.map(defaultMatch => {
        const raw = Array.isArray(input)
            ? input.find(item => item?.id === defaultMatch.id)
            : null;

        return {
            id: defaultMatch.id,
            tier: defaultMatch.tier,
            date: typeof raw?.date === "string"
                ? raw.date.trim().slice(0, 30) || defaultMatch.date
                : defaultMatch.date,
            teamAId: teamMap.has(raw?.teamAId)
                ? raw.teamAId
                : [...teamMap.values()].find(team => team.name === raw?.teamA?.name)?.id || defaultMatch.teamAId,
            teamBId: teamMap.has(raw?.teamBId)
                ? raw.teamBId
                : [...teamMap.values()].find(team => team.name === raw?.teamB?.name)?.id || defaultMatch.teamBId,
            streamChannel: typeof raw?.streamChannel === "string"
                ? raw.streamChannel.trim().replace(/^@/, "").slice(0, 50) || "AthenaKamelot"
                : "AthenaKamelot"
        };
    });
}

export async function loadBracket(env) {
    if (!env.BRACKET_DATA) {
        throw new Error("Falta configurar el enlace BRACKET_DATA de Cloudflare KV.");
    }

    const saved = await env.BRACKET_DATA.get(STORAGE_KEY, "json");
    return sanitizeState(saved || createDefaultState());
}

export async function saveBracket(env, input) {
    if (!env.BRACKET_DATA) {
        throw new Error("Falta configurar el enlace BRACKET_DATA de Cloudflare KV.");
    }

    const state = sanitizeState(input);
    await env.BRACKET_DATA.put(STORAGE_KEY, JSON.stringify(state));
    return state;
}
