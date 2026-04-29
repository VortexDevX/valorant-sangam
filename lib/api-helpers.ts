import { ObjectId } from "mongodb";

export function parseObjectId(id: string): ObjectId | null {
  if (!ObjectId.isValid(id)) {
    return null;
  }

  return new ObjectId(id);
}

export async function resolveSeriesParams(context: {
  params: Promise<{ id: string }>;
}): Promise<ObjectId | null> {
  const { id } = await context.params;
  return parseObjectId(id);
}

export async function resolveResultParams(context: {
  params: Promise<{ id: string; order: string }>;
}): Promise<{ objectId: ObjectId; orderNumber: number } | null> {
  const { id, order } = await context.params;
  const objectId = parseObjectId(id);

  if (!objectId) {
    return null;
  }

  const orderNumber = Number(order);

  if (!Number.isInteger(orderNumber) || orderNumber < 1) {
    return null;
  }

  return { objectId, orderNumber };
}

export async function resolveBracketParams(context: {
  params: Promise<{ id: string }>;
}): Promise<ObjectId | null> {
  const { id } = await context.params;
  return parseObjectId(id);
}

export async function resolveBracketMatchParams(context: {
  params: Promise<{ id: string; round: string; match: string }>;
}): Promise<{
  objectId: ObjectId;
  roundNumber: number;
  matchNumber: number;
} | null> {
  const { id, round, match } = await context.params;
  const objectId = parseObjectId(id);

  if (!objectId) {
    return null;
  }

  const roundNumber = Number(round);
  const matchNumber = Number(match);

  if (!Number.isInteger(roundNumber) || roundNumber < 1) {
    return null;
  }

  if (!Number.isInteger(matchNumber) || matchNumber < 1) {
    return null;
  }

  return { objectId, roundNumber, matchNumber };
}
