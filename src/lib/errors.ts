export function errorText(e: unknown): string {
  return String((e as Error)?.message ?? e);
}
