import { defineContentScript } from "wxt/utils/define-content-script";
import { main } from "./main";
import "./style.css";

export default defineContentScript({
	matches: ["*://*.youtube.com/*"],
	main,
});
