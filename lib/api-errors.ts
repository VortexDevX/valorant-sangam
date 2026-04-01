export function logApiError(context: string, error: unknown) {
  if (error instanceof Error) {
    console.error(`[${context}] ${error.message}`, error.stack);
    return;
  }

  console.error(`[${context}]`, error);
}
