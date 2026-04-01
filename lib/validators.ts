import { z } from "zod";
import { MAP_POOL } from "@/lib/map-pool";

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
      .regex(/^\d{1,2}\s*-\s*\d{1,2}$/, "Score must look like 13-11."),
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
  undo: z.boolean().optional(),
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
    .regex(/^\d{1,2}\s*-\s*\d{1,2}$/, "Score must look like 13-11."),
  note: z.string().trim().max(240, "Note is too long.").optional().or(z.literal("")),
});

export const bracketCreateSchema = z.object({
  title: z.string().trim().min(1, "Bracket title is required.").max(80, "Title is too long."),
  teamCount: z.coerce.number().int().min(1, "Minimum 1 team required.").max(32, "Maximum 32 teams allowed."),
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
});

export const bracketWinnerSchema = z.object({
  winnerSeed: z.number().int().positive().nullable(),
});

export function normalizeScore(score: string) {
  return score.replace(/\s+/g, "").trim();
}
