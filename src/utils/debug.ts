/**
 * デバッグモジュール
 * 開発時のログ出力を制御する機能を提供
 */

// デバッグモードの有効状態（開発環境では自動的に有効化）
let isDebugModeEnabled = import.meta.env.DEV;

/**
 * デバッグ情報をコンソールに出力する
 * デバッグモードが有効な場合のみ出力される
 * @param args 出力する値（複数指定可能）
 */
export function debug(...args: unknown[]): void {
	if (isDebugModeEnabled) {
		console.info(...args);
	}
}

/**
 * デバッグモードの有効/無効を設定する
 * @param enabled trueでデバッグモードを有効化、falseで無効化
 */
export function setDebugMode(enabled: boolean): void {
	isDebugModeEnabled = enabled;
}
