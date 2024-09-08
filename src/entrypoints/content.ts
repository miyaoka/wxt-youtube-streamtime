import { debug } from "@/utils/debug";
import { parseMicroformat, timeToSec } from "@/utils/microformat";

export default defineContentScript({
  matches: ["*://*.youtube.com/*"],
  main() {
    setDebugMode(true);
    // add span for displaying original time
    const originalTimeEl = document.createElement("span");
    const startTimeEl = document.createElement("span");
    let currentTimeObserver: MutationObserver | null = null;

    function resetLiveTimer() {
      originalTimeEl.textContent = "";
      startTimeEl.textContent = "";
      if (currentTimeObserver) {
        currentTimeObserver.disconnect();
        debug("🕒👀 /end watch currentTime");
      }
    }

    // setup live timer by using microformat data and current time
    async function setupLiveTimer(el: Element) {
      debug("🕒💥 setup live timer.");
      resetLiveTimer();
      const microformat = parseMicroformat(el);
      debug("🕒 parse microformat data:", microformat);
      if (!microformat) return;
      const timeWrapper =
        document.querySelector<HTMLElement>(".ytp-time-wrapper");
      if (!timeWrapper) return;
      const timeCurrent =
        timeWrapper.querySelector<HTMLElement>(".ytp-time-current");
      if (!timeCurrent) return;
      debug("🕒 time elements found.");

      if (!document.contains(originalTimeEl)) {
        timeWrapper.appendChild(originalTimeEl);
        debug("🕒 added originalTime el.");
      }
      if (!document.contains(startTimeEl)) {
        timeWrapper.insertBefore(startTimeEl, timeWrapper.firstChild);
        debug("🕒 added startTime el.");
      }

      const publication = microformat.publication?.[0];
      // not live
      if (!publication) {
        debug("🕒 [non-live video]");
        return;
      }
      debug("🕒 has publication:", publication);

      const startDate = new Date(publication.startDate);

      // on live, only add the start time
      if (!publication.endDate) {
        // HH:MM:SS
        const dateFormatter = new Intl.DateTimeFormat(undefined, {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
        const startTime = dateFormatter.format(startDate);
        startTimeEl.textContent = `${startTime} + `;
        debug("🕒 [live now or scheduled]", startDate);
        return;
      }

      // on ended, add the original time

      // ymd + weekday + time
      const dateFormatter = new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        weekday: "short",
      });

      // watch current time and update original time
      currentTimeObserver = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
          // When the time is updated, a node is added
          const addedNode = mutation.addedNodes[0];
          if (!addedNode) continue;

          // compute original time
          const currentSec = timeToSec(addedNode.textContent ?? "");
          const originalDate = new Date(
            startDate.getTime() + currentSec * 1000
          );
          const formattedDate = dateFormatter.format(originalDate);
          originalTimeEl.textContent = ` ( ${formattedDate} )`;
        }
      });
      currentTimeObserver.observe(timeCurrent, {
        childList: true,
      });
      debug("🕒 [archived live video] 👀start watch currentTime", timeCurrent);
    }

    async function watchMicroformat(microformatEl: Element) {
      // watch for script tag
      const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
          if ((mutation.target as Element).tagName !== "SCRIPT") continue;
          setupLiveTimer(microformatEl);
        }
      });
      observer.observe(microformatEl, {
        childList: true,
        subtree: true,
      });
      debug("🕒👀 start watch microformat node:", microformatEl);

      // Initial execution
      setupLiveTimer(microformatEl);
    }

    function init() {
      debug("🕒💥 init");
      // force display current time
      const style = document.createElement("style");
      style.textContent = ".ytp-time-current { display: inline !important; }";
      document.documentElement.appendChild(style);

      const microformatEl = document.getElementById("microformat");
      if (microformatEl) {
        debug("🕒 found microformat node.");
        watchMicroformat(microformatEl);
        return;
      }

      // watch body subtree for ytd-watch-flexy
      const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
          const target: Element = mutation.target as Element;
          if (target.tagName !== "YTD-WATCH-FLEXY") continue;

          // ytd-watch-flexy has microformat node
          const microformatNode = Array.from(mutation.addedNodes).find(
            (node) => {
              return (node as Element).id === "microformat";
            }
          );
          if (!microformatNode) continue;

          // finish watching
          observer.disconnect();
          debug("🕒👀 found microformat node. /end watch document");
          // start watching microformat node
          watchMicroformat(microformatNode as Element);
          return;
        }
      });
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
      debug("🕒👀 start watch document");
    }

    init();
  },
});
