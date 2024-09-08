let isDebugMode = import.meta.env.DEV;

export function debug(...args: any[]): void {
  if (isDebugMode) {
    console.log(...args);
  }
}

export function setDebugMode(value: boolean): void {
  isDebugMode = value;
}
