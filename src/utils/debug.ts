let isDebugMode = import.meta.env.DEV;

export function debug(...args: unknown[]): void {
	if (isDebugMode) {
		console.info(...args);
	}
}

export function setDebugMode(value: boolean): void {
	isDebugMode = value;
}
