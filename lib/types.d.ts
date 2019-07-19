export interface ILogger {
  debug (message: string): void
  log (message: string): void
  exit (status: number, message: string): void
}
