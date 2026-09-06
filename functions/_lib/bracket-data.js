const STORAGE_KEY = "current";

const team = (id, name) => ({ id, name });

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
        results: {}
    };
}

function cleanTeams(input, tier, count) {
    const fallback = createDefaultState().teams[tier];

    return Array.from({ length: count }, (_, index) => {
        const rawName = input?.[index]?.name;
        const name = typeof rawName === "string"
            ? rawName.trim().slice(0, 40)
            : "";

        return team(`${tier}-${index + 1}`, name || fallback[index].name);
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

    const highFirst = Array.from({ length: 7 }, (_, index) =>
        createMatch(results, `high-r1-${index + 1}`, high[index * 2], high[index * 2 + 1])
    );

    const highLoserFirst = [
        createMatch(results, "high-lb-r1-1", loser(highFirst[0]), loser(highFirst[1])),
        createMatch(results, "high-lb-r1-2", loser(highFirst[2]), loser(highFirst[3])),
        createMatch(results, "high-lb-r1-3", loser(highFirst[4]), loser(highFirst[5])),
        createMatch(results, "high-lb-r1-4", loser(highFirst[6]), state.teams.highLoserWildcard)
    ];
    const highLoserSemi = [
        createMatch(results, "high-lb-sf-1", winner(highLoserFirst[0]), winner(highLoserFirst[1])),
        createMatch(results, "high-lb-sf-2", winner(highLoserFirst[2]), winner(highLoserFirst[3]))
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
    const lowLoserSemi = [
        createMatch(results, "low-lb-sf-1", loser(lowQuarter[0]), loser(lowQuarter[1])),
        createMatch(results, "low-lb-sf-2", loser(lowQuarter[2]), loser(lowQuarter[3]))
    ];
    const lowLoserFinal = createMatch(
        results,
        "low-lb-final",
        winner(lowLoserSemi[0]),
        winner(lowLoserSemi[1])
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
        "high-loser": {
            rounds: [
                makeRound("high-lb-r1", "Primera ronda", highLoserFirst),
                makeRound("high-lb-sf", "Semifinales", highLoserSemi),
                makeRound("high-lb-final", "Final", [highLoserFinal])
            ],
            champion: winner(highLoserFinal)
        },
        "low-loser": {
            rounds: [
                makeRound("low-lb-sf", "Semifinales", lowLoserSemi),
                makeRound("low-lb-final", "Final", [lowLoserFinal])
            ],
            champion: winner(lowLoserFinal)
        }
    };

    const allMatches = Object.values(brackets).flatMap(bracket =>
        bracket.rounds.flatMap(round => round.matches)
    );

    return {
        teams: state.teams,
        results: state.results,
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
                    : "Equipo de reposición"
            )
        },
        results: {}
    };
    const calculated = buildBracket({ ...state, results: rawResults });

    calculated.matches.forEach(match => {
        const submittedWinner = rawResults[match.id];

        if (match.candidates.some(item => item.id === submittedWinner)) {
            state.results[match.id] = submittedWinner;
        }
    });

    return state;
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
