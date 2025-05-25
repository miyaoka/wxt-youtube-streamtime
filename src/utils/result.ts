export type Result<T, E = Error> =
	| { value: T; error?: undefined }
	| { value?: undefined; error: E };

// tryCatch utility
export function tryCatch<T>(fn: () => T): Result<T, Error> {
	try {
		return { value: fn() };
	} catch (error) {
		return { error: error instanceof Error ? error : new Error(String(error)) };
	}
}
