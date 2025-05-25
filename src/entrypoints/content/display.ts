import { debug } from "@/utils/debug";
import { timeToSec } from "@/utils/microformat";
import { streamStartTimeFormatter, originalBroadcastDateTimeFormatter } from "./formatters";

/**
 * ライブ配信用の開始時刻表示を設定する
 * 配信予定の場合はYouTube側で時間表示UIが非表示になるため、
 * 配信中と区別せず同じ処理を行っても問題ない
 * @param streamStartDate 配信開始日時
 * @param streamElement 配信開始時刻を表示するHTML要素
 */
export function setupLiveDisplay(streamStartDate: Date, streamElement: HTMLElement): void {
	const startTime = streamStartTimeFormatter.format(streamStartDate);
	streamElement.textContent = `${startTime} + `;
	debug("🕒 [ライブ配信中または配信予定]", streamStartDate);
}

/**
 * アーカイブ動画用の時刻変更監視Observerを生成する
 * 再生時間の変更を監視し、実際の配信時刻を計算・表示する
 * @param streamStartDate 配信開始日時
 * @param originalElement 実配信時刻を表示するHTML要素
 * @returns 設定済みのMutationObserver
 */
export function createArchiveTimeObserver(
	streamStartDate: Date,
	originalElement: HTMLElement
): MutationObserver {
	return new MutationObserver((mutationsList) => {
		debug("🕒 [アーカイブ動画] 再生時間が変更されました:", mutationsList);
		for (const mutation of mutationsList) {
			const addedNode = mutation.addedNodes[0];
			if (!addedNode) continue;

			const currentVideoTimeInSeconds = timeToSec(
				addedNode.textContent ?? "",
			);
			const originalBroadcastDate = new Date(
				streamStartDate.getTime() + currentVideoTimeInSeconds * 1000,
			);
			const formattedDate = originalBroadcastDateTimeFormatter.format(
				originalBroadcastDate,
			);
			originalElement.textContent = ` ( ${formattedDate} )`;
		}
	});
}
