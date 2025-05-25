import { debug } from "@/utils/debug";
import type { VideoTimeElements } from "./types";

/**
 * YouTube動画プレーヤーの時間表示関連要素を取得する
 * @returns 時間表示要素のオブジェクト。要素が見つからない場合はnull
 */
export function getVideoTimeElements(): VideoTimeElements | null {
	const wrapper = document.querySelector<HTMLElement>(".ytp-time-wrapper");
	if (!wrapper) return null;
	
	const current = wrapper.querySelector<HTMLElement>(".ytp-time-current");
	if (!current) return null;
	
	return { wrapper, current };
}

/**
 * 配信時刻表示用のDOM要素をYouTubeプレーヤーに追加する
 * @param wrapper YouTubeの時間表示ラッパー要素
 * @param originalElement アーカイブ動画用の実配信時刻表示要素
 * @param streamElement ライブ配信用の配信開始時刻表示要素
 */
export function addDisplayElements(
	wrapper: HTMLElement,
	originalElement: HTMLElement,
	streamElement: HTMLElement
): void {
	if (!document.contains(originalElement)) {
		wrapper.appendChild(originalElement);
		debug("🕒 配信時日時表示要素を追加しました");
	}
	if (!document.contains(streamElement)) {
		wrapper.insertBefore(streamElement, wrapper.firstChild);
		debug("🕒 配信開始時刻表示要素を追加しました");
	}
}
