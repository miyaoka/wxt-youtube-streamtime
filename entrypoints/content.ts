type MicroFormat = {
  "@context": string;
  "@type": string;
  description: string;
  duration: string;
  embedUrl: string;
  interactionCount: string;
  name: string;
  thumbnailUrl: string[];
  uploadDate: string;
  genre: string;
  author: string;
  publication?: Publication[];
};

type Publication = {
  "@type": string;
  isLiveBroadcast: boolean;
  startDate: string;
  endDate?: string;
};

// parse microformat from script tag
function parseMicroformat(el: Element): MicroFormat | null {
  const script = el.querySelector("script");
  const textContent = script?.textContent;
  if (!textContent) return null;

  try {
    return JSON.parse(textContent);
  } catch (e) {
    console.error(e);
    return null;
  }
}

// Convert timeText to seconds
function timeToSec(time: string) {
  const [sec, min, hour] = time.split(":").reverse();
  return Number(hour ?? 0) * 3600 + Number(min ?? 0) * 60 + Number(sec ?? 0);
}

export default defineContentScript({
  matches: ["*://*.youtube.com/*"],
  main() {
    // add span for displaying original time
    const originalTimeEl = document.createElement("span");
    const startTimeEl = document.createElement("span");
    let currentTimeObserver: MutationObserver | null = null;

    function resetLiveTimer() {
      originalTimeEl.textContent = "";
      startTimeEl.textContent = "";
      if (currentTimeObserver) {
        currentTimeObserver.disconnect();
        console.log("🕒👀 /end watch currentTime");
      }
    }

    // setup live timer by using microformat data and current time
    async function setupLiveTimer(el: Element) {
      console.log("🕒💥 setup live timer.");
      resetLiveTimer();
      const microformat = parseMicroformat(el);
      console.log("🕒 parse microformat data:", microformat);
      if (!microformat) return;
      const timeWrapper =
        document.querySelector<HTMLElement>(".ytp-time-wrapper");
      if (!timeWrapper) return;
      const timeCurrent =
        timeWrapper.querySelector<HTMLElement>(".ytp-time-current");
      if (!timeCurrent) return;
      console.log("🕒 time elements found.");

      if (!document.contains(originalTimeEl)) {
        timeWrapper.appendChild(originalTimeEl);
        console.log("🕒 added originalTime el.");
      }
      if (!document.contains(startTimeEl)) {
        timeWrapper.insertBefore(startTimeEl, timeWrapper.firstChild);
        console.log("🕒 added startTime el.");
      }

      const publication = microformat.publication?.[0];
      // not live
      if (!publication) {
        console.log("🕒 [non-live video]");
        return;
      }
      console.log("🕒 has publication:", publication);

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
        console.log("🕒 [live now or scheduled]", startDate);
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
      console.log(
        "🕒 [archived live video] 👀start watch currentTime",
        timeCurrent
      );
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
      console.log("🕒👀 start watch microformat node:", microformatEl);

      // Initial execution
      setupLiveTimer(microformatEl);
    }

    function init() {
      console.log("🕒💥 init");
      // force display current time
      const style = document.createElement("style");
      style.textContent = ".ytp-time-current { display: inline !important; }";
      document.documentElement.appendChild(style);

      const microformatEl = document.getElementById("microformat");
      if (microformatEl) {
        console.log("🕒 found microformat node.");
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
          console.log("🕒👀 found microformat node. /end watch document");
          // start watching microformat node
          watchMicroformat(microformatNode as Element);
          return;
        }
      });
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
      console.log("🕒👀 start watch document");
    }

    init();
  },
});
