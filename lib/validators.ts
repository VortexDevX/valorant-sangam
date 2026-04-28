import { z } from "zod";
import { MAP_POOL } from "@/lib/map-pool";

export function normalizeScore(score: string) {
  return score.replace(/\s+/g, "").trim();
}

function parseScoreParts(score: string) {
  const [left, right] = normalizeScore(score).split("-");
  const teamA = Number(left);
  const teamB = Number(right);

  if (!Number.isInteger(teamA) || !Number.isInteger(teamB)) {
    return null;
  }

  return { teamA, teamB };
}

export function isValidValorantScore(score: string) {
  const parsed = parseScoreParts(score);

  if (!parsed) {
    return false;
  }

  const { teamA, teamB } = parsed;

  if (teamA < 0 || teamB < 0 || teamA === teamB) {
    return false;
  }

  const winner = Math.max(teamA, teamB);
  const loser = Math.min(teamA, teamB);

  if (winner === 13) {
    return loser <= 11;
  }

  return winner >= 14 && winner - loser === 2;
}

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Username is required."),
  password: z.string().min(1, "Password is required."),
});

export const matchSchema = z
  .object({
    teamA: z.string().trim().min(1, "Team A is required."),
    teamB: z.string().trim().min(1, "Team B is required."),
    map: z.enum(MAP_POOL),
    score: z
      .string()
      .trim()
      .regex(/^\d{1,2}\s*-\s*\d{1,2}$/, "Score must look like 13-11.")
      .refine(isValidValorantScore, {
        message: "Enter a valid Valorant final score.",
      }),
    note: z.string().trim().max(240, "Note is too long.").optional().or(z.literal("")),
  })
  .refine((value) => value.teamA.toLowerCase() !== value.teamB.toLowerCase(), {
    message: "Team names must be different.",
    path: ["teamB"],
  });

export const vetoSessionSchema = z
  .object({
    teamA: z.string().trim().min(1, "Team A is required."),
    teamB: z.string().trim().min(1, "Team B is required."),
    format: z.enum(["bo1", "bo3", "bo5"]),
    mapPool: z
      .array(z.enum(MAP_POOL))
      .length(7, "Select exactly 7 maps.")
      .refine((maps) => new Set(maps).size === 7, {
        message: "Selected maps must be unique.",
      }),
  })
  .refine((value) => value.teamA.toLowerCase() !== value.teamB.toLowerCase(), {
    message: "Team names must be different.",
    path: ["teamB"],
  });

export const vetoActionSchema = z.object({
  map: z.enum(MAP_POOL).optional(),
  side: z.enum(["atk", "def"]).optional(),
  undo: z.literal(true).optional(),
});

export const seriesCreateSchema = z
  .object({
    teamA: z.string().trim().min(1, "Team A is required."),
    teamB: z.string().trim().min(1, "Team B is required."),
    format: z.enum(["bo1", "bo3", "bo5"]),
  })
  .refine((value) => value.teamA.toLowerCase() !== value.teamB.toLowerCase(), {
    message: "Team names must be different.",
    path: ["teamB"],
  });

export const seriesVetoSetupSchema = z.object({
  mapPool: z
    .array(z.enum(MAP_POOL))
    .length(7, "Select exactly 7 maps.")
    .refine((maps) => new Set(maps).size === 7, {
      message: "Selected maps must be unique.",
    }),
});

export const seriesResultSchema = z.object({
  score: z
    .string()
    .trim()
    .regex(/^\d{1,2}\s*-\s*\d{1,2}$/, "Score must look like 13-11.")
    .refine(isValidValorantScore, {
      message: "Enter a valid Valorant final score.",
    }),
  note: z.string().trim().max(240, "Note is too long.").optional().or(z.literal("")),
});

export const seriesUpdateSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("swap_sides"),
  }),
  z.object({
    action: z.literal("update_setup"),
    format: z.enum(["bo1", "bo3", "bo5"]),
    vetoStarter: z.enum(["teamA", "teamB"]),
  }),
  z.object({
    action: z.literal("set_lock"),
    locked: z.boolean(),
  }),
]);

export const bracketCreateSchema = z.object({
  title: z.string().trim().min(1, "Bracket title is required.").max(80, "Title is too long."),
  teamCount: z.coerce.number().int().min(1, "Minimum 1 team required.").max(32, "Maximum 32 teams allowed."),
  format: z.enum(["bo1", "bo3", "bo5"]),
});

export const bracketTeamsSchema = z
  .array(z.string().trim().max(40, "Team name is too long."))
  .min(1, "Minimum 1 team required.")
  .max(32, "Maximum 32 teams allowed.")
  .refine(
    (teams) => {
      const namedTeams = teams
        .map((entry) => entry.trim().toLowerCase())
        .filter((entry) => entry.length > 0);

      return new Set(namedTeams).size === namedTeams.length;
    },
    {
      message: "Team names must be unique.",
    },
  );

export const bracketUpdateSchema = z.object({
  title: z.string().trim().min(1, "Bracket title is required.").max(80, "Title is too long.").optional(),
  teams: bracketTeamsSchema.optional(),
  format: z.enum(["bo1", "bo3", "bo5"]).optional(),
  locked: z.boolean().optional(),
});

export const bracketWinnerSchema = z.object({
  winnerSeed: z.number().int().positive().nullable(),
});

export const bracketContinuationSchema = z.object({
  continuationSeriesId: z.string().trim().min(1, "Continuation series is required.").nullable(),
  note: z.string().trim().max(240, "Note is too long.").optional().or(z.literal("")),
});
