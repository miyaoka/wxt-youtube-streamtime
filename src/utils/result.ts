/**
 * 成功または失敗の結果を表現するResult型
 * @template T 成功時の値の型
 * @template E エラーの型（デフォルトはError）
 */
export type Result<T, E = Error> =
	| { value: T; error?: undefined }
	| { value?: undefined; error: E };

/**
 * 例外が発生する可能性がある処理を安全に実行し、Result型で結果を返す
 * @template T 関数の戻り値の型
 * @param operation 実行する処理
 * @returns 成功時は値を、失敗時はエラーを含むResult
 */
export function tryCatch<T>(operation: () => T): Result<T, Error> {
	try {
		return { value: operation() };
	} catch (error) {
		return { error: error instanceof Error ? error : new Error(String(error)) };
	}
}
