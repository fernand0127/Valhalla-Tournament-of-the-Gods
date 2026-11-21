const STORAGE_KEY = "current";

const team = (id, name, image = "", imageSize = 100) => ({ id, name, image, imageSize });
const WITHDRAWN_HIGH_TEAM_IDS = new Set(["high-12", "high-14"]);

// Estos logos forman parte del sitio publicado. Así nunca dependen de una
// sesión de Google, un enlace temporal de Discord o el dispositivo del admin.
const LOCAL_TEAM_IMAGES = {
    "high-1": "/img/teams/el-rifle-de-america.png",
    "high-2": "/img/teams/patrulla-x.png",
    "high-3": "/img/teams/cucharas-de-jeff.png",
    "high-4": "/img/teams/sangheilis.png",
    "high-5": "/img/teams/small-potatoes.png",
    "high-6": "/img/teams/ositos-carinositos.png",
    "high-7": "/img/teams/lobos-de-bajo-presupuesto.png",
    "high-8": "/img/teams/papu-rivals.png",
    "high-9": "/img/teams/team-aura.png",
    "high-10": "/img/teams/berry-baddies.png",
    "high-11": "/img/teams/chaos-team.png",
    "high-12": "/img/teams/no-name.png",
    "high-13": "/img/teams/womp-womp.png",
    "low-1": "/img/teams/noctua-owls.png",
    "low-2": "/img/teams/los-4-fantasticos.png",
    "low-3": "/img/teams/fieles-deudores-de-coppel.png",
    "low-4": "/img/teams/omegamblers.png",
    "low-5": "/img/teams/isla-tortuga.png",
    "low-6": "/img/teams/wakanda-de-temu.png",
    "high-loser-wildcard": "/img/teams/furritos-de-leche.png"
};

function teamImage(id, value) {
    const image = typeof value === "string" ? value.trim().slice(0, 500) : "";
    const isPreviousExternalLogo = /^(?:https?:\/\/)?(?:lh3\.google\.com|drive\.google\.com|driveusercontent\.google\.com|media\.discordapp\.net)/i.test(image);

    // Conserva cualquier URL nueva que el administrador agregue en el futuro,
    // pero reemplaza los enlaces antiguos por los archivos locales estables.
    return LOCAL_TEAM_IMAGES[id] && (!image || isPreviousExternalLogo)
        ? LOCAL_TEAM_IMAGES[id]
        : image;
}

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
        ...Array.from({ length: 3 }, (_, index) => defaultScheduleMatch(`low-schedule-${index + 1}`, "low", index + 1))
    ];
}

export function createDefaultState() {
    return {
        teams: {
            high: Array.from({ length: 14 }, (_, index) =>
                team(`high-${index + 1}`, `High Team ${index + 1}`)
            ),
            low: Array.from({ length: 6 }, (_, index) =>
                team(`low-${index + 1}`, `Low Team ${index + 1}`)
            ),
            highLoserWildcard: team("high-loser-wildcard", "Equipo de reposición")
        },
        results: {},
        passOpponents: {},
        highLoserSlotId: "",
        lowLoserFinalistIds: [],
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

        const image = teamImage(`${tier}-${index + 1}`, input?.[index]?.image);

        const imageSize = Number.isFinite(Number(input?.[index]?.imageSize))
            ? Math.max(40, Math.min(180, Number(input[index].imageSize)))
            : 100;

        return team(`${tier}-${index + 1}`, name || fallback[index].name, image, imageSize);
    });
}

function getTeamMap(state) {
    return new Map(
        [...state.teams.high, ...state.teams.low, state.teams.highLoserWildcard]
            .map(item => [item.id, item])
    );
}

function createMatch(results, id, teamA, teamB, placeholders = {}) {
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
        placeholderA: placeholders.teamA || "TBD",
        placeholderB: placeholders.teamB || "TBD",
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
        state.passOpponents?.[matchId] === "none"
            ? null
            : teamMap.get(state.passOpponents?.[matchId]) || fallback;
    const highLoserSlot = teamMap.get(state.highLoserSlotId) || null;

    const highFirst = Array.from({ length: 7 }, (_, index) =>
        createMatch(results, `high-r1-${index + 1}`, high[index * 2], high[index * 2 + 1])
    );

    // Los perdedores de la primera ronda disputan primero el pase al cuadro
    // de perdedores. Los ganadores de esta fase entran al cuadro principal.
    // Los equipos retirados permanecen visibles en el cuadro principal,
    // pero no entran al Pase a Perdedores.
    const highPass = highFirst
        .filter(match => !match.candidates.some(item => WITHDRAWN_HIGH_TEAM_IDS.has(item.id)))
        .map((match, index) =>
        createMatch(
            results,
            `high-pass-${index + 1}`,
            loser(match),
            selectedPassOpponent(`high-pass-${index + 1}`, state.teams.highLoserWildcard)
        )
        );
    const highLoserFirst = [
        createMatch(results, "high-lb-r1-1", winner(highPass[0]), winner(highPass[1])),
        createMatch(results, "high-lb-r1-2", winner(highPass[2]), winner(highPass[3]))
    ];
    const highLoserSemi = [
        createMatch(results, "high-lb-sf-1", winner(highLoserFirst[0]), winner(highPass[4])),
        createMatch(results, "high-lb-sf-2", winner(highLoserFirst[1]), highLoserSlot)
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
        createMatch(results, "high-qf-4", winner(highFirst[6]), winner(highLoserFinal), { teamB: "LBW" })
    ];
    const highSemi = [
        createMatch(results, "high-sf-1", winner(highQuarter[0]), winner(highQuarter[1])),
        createMatch(results, "high-sf-2", winner(highQuarter[2]), winner(highQuarter[3]))
    ];
    const highFinal = createMatch(results, "high-final", winner(highSemi[0]), winner(highSemi[1]));

    const lowQuarter = Array.from({ length: 3 }, (_, index) =>
        createMatch(results, `low-qf-${index + 1}`, low[index * 2], low[index * 2 + 1])
    );
    const lowPass = lowQuarter.map((match, index) =>
        createMatch(
            results,
            `low-pass-${index + 1}`,
            loser(match),
            selectedPassOpponent(`low-pass-${index + 1}`, state.teams.highLoserWildcard)
        )
    );
    // Furritos es el filtro del Pase Low. Sus victorias eliminan al rival,
    // pero el equipo solo puede clasificar una vez y únicamente si gana dos
    // o más retos. Así, normalmente quedan dos finalistas directos.
    const lowPassWinners = lowPass.map(winner).filter(Boolean);
    const furritosWins = lowPassWinners.filter(item => item.id === state.teams.highLoserWildcard.id).length;
    const nonFurritosWinners = lowPassWinners.filter(item => item.id !== state.teams.highLoserWildcard.id);
    const lowLoserCandidates = furritosWins >= 2
        ? [state.teams.highLoserWildcard, ...nonFurritosWinners]
        : nonFurritosWinners;
    const manualLowFinalists = lowLoserCandidates.length > 2
        ? (state.lowLoserFinalistIds || [])
            .filter(id => lowLoserCandidates.some(team => team.id === id))
            .slice(0, 2)
        : [];
    const lowLoserFinalists = manualLowFinalists.length === 2
        ? manualLowFinalists.map(id => lowLoserCandidates.find(team => team.id === id))
        : lowLoserCandidates.slice(0, 2);
    const lowLoserFinal = createMatch(
        results,
        "low-lb-final",
        lowLoserFinalists[0] || null,
        lowLoserFinalists[1] || null
    );
    const lowSemi = [
        createMatch(results, "low-sf-1", winner(lowQuarter[0]), winner(lowQuarter[1])),
        createMatch(results, "low-sf-2", winner(lowQuarter[2]), winner(lowLoserFinal), { teamB: "LBW" })
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
                // Se muestran tres plazas para reflejar los tres pases; la
                // lógica de clasificación conserva únicamente dos finalistas.
                teams: [...lowLoserFinalists, ...Array(Math.max(0, 3 - lowLoserFinalists.length)).fill(null)]
            }
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
                makeRound("low-lb-final", "Final", [lowLoserFinal])
            ],
            champion: winner(lowLoserFinal),
            finalistCandidates: lowLoserCandidates,
            finalistSelection: lowLoserFinalists
        }
    };

    const allMatches = Object.values(brackets).flatMap(bracket =>
        bracket.rounds.flatMap(round => round.matches)
    );

    const schedule = state.schedule.map(match => ({
        ...match,
        teamA: teamMap.get(match.teamAId) || null,
        teamB: teamMap.get(match.teamBId) || null
    }));

    return {
        teams: state.teams,
        results: state.results,
        passOpponents: state.passOpponents || {},
        highLoserSlotId: state.highLoserSlotId || "",
        lowLoserFinalistIds: state.lowLoserFinalistIds || [],
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
            low: cleanTeams(input?.teams?.low, "low", 6),
            highLoserWildcard: team(
                "high-loser-wildcard",
                typeof input?.teams?.highLoserWildcard?.name === "string"
                    ? input.teams.highLoserWildcard.name.trim().slice(0, 40) || "Equipo de reposición"
                    : "Equipo de reposición",
                teamImage("high-loser-wildcard", input?.teams?.highLoserWildcard?.image),
                Number.isFinite(Number(input?.teams?.highLoserWildcard?.imageSize))
                    ? Math.max(40, Math.min(180, Number(input.teams.highLoserWildcard.imageSize)))
                    : 100
            )
        },
        results: {},
        passOpponents: {},
        highLoserSlotId: "",
        lowLoserFinalistIds: [],
        schedule: [],
        layout: sanitizeLayout(input?.layout)
    };
    const teamMap = getTeamMap(state);
    state.passOpponents = sanitizePassOpponents(input?.passOpponents, teamMap);
    state.highLoserSlotId = teamMap.has(input?.highLoserSlotId) && !WITHDRAWN_HIGH_TEAM_IDS.has(input.highLoserSlotId)
        ? input.highLoserSlotId
        : "";
    state.lowLoserFinalistIds = Array.isArray(input?.lowLoserFinalistIds)
        ? [...new Set(input.lowLoserFinalistIds.filter(id => teamMap.has(id)))].slice(0, 2)
        : [];
    state.schedule = sanitizeSchedule(input?.schedule, teamMap);
    const calculated = buildBracket({ ...state, results: rawResults });

    calculated.matches.forEach(match => {
        const submittedWinner = rawResults[match.id];

        // Un solo equipo visible aún no es una victoria: se conserva vacío
        // hasta que el administrador tenga dos rivales y registre el resultado.
        if (match.candidates.length === 2 && match.candidates.some(item => item.id === submittedWinner)) {
            state.results[match.id] = submittedWinner;
        }
    });

    return state;
}

function sanitizePassOpponents(input, teamMap) {
    const allowedIds = [
        "high-pass-1", "high-pass-2", "high-pass-3", "high-pass-4",
        "high-pass-5", "high-pass-6",
        "low-pass-1", "low-pass-2", "low-pass-3"
    ];

    return Object.fromEntries(
        allowedIds
            .filter(id => input?.[id] === "none" || teamMap.has(input?.[id]))
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
            teamAId: raw?.teamAId === ""
                ? ""
                : teamMap.has(raw?.teamAId)
                    ? raw.teamAId
                    : [...teamMap.values()].find(team => team.name === raw?.teamA?.name)?.id || defaultMatch.teamAId,
            teamBId: raw?.teamBId === ""
                ? ""
                : teamMap.has(raw?.teamBId)
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
