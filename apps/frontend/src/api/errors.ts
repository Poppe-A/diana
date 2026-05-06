import { isAxiosError } from 'axios';

export function getAxiosErrorMessage(err: unknown): string {
  if (isAxiosError(err)) {
    const msg = err.response?.data as { message?: string | string[] } | undefined;
    if (typeof msg?.message === 'string') return msg.message;
    if (Array.isArray(msg?.message)) return msg.message.join(', ');
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return 'Erreur inconnue';
}
