import { fileURLToPath } from "node:url";
import type { AstroIntegration } from "astro";

/**
 * Generate a unique CSS ID for a given number.
 * @param index The number to generate the CSS ID for.
 * @returns The generated CSS ID.
 */
function generateCSSId(index: number) {
	// biome-ignore lint/style/noNonNullAssertion: Can't be null, 26 is the length of the string
	let id = "useandompxbfghjklqvwyzrict"[index % 26]!;
	let i = Math.floor(index / 26);
	while (i > 0) {
		// biome-ignore lint/style/noNonNullAssertion: Can't be null, 38 is the length of the string
		id += "useandom-2619834075px_bfghjklqvwyzrict"[i % 38]!;
		i = Math.floor(i / 38);
	}
	return id;
}

/**
 * Sort breakpoints by their numeric value.
 * @param name1 Name of breakpoint 1.
 * @param value1 Value of breakpoint 1.
 * @param name2 Name of breakpoint 2.
 * @param value2 Value of breakpoint 2.
 */
function sortBreakpoints(
	[name1, value1]: [string, string | number],
	[name2, value2]: [string, string | number],
): number {
	const numValue1 =
		typeof value1 === "number" ? value1 : Number.parseFloat(value1);
	if (Number.isNaN(numValue1)) {
		throw new TypeError(
			`Invalid value for breakpoint "${name1}": "${value1}"`,
		);
	}

	const numValue2 =
		typeof value2 === "number" ? value2 : Number.parseFloat(value2);
	if (Number.isNaN(numValue2)) {
		throw new TypeError(
			`Invalid value for breakpoint "${name2}": "${value2}"`,
		);
	}

	return numValue1 - numValue2;
}

/**
 * Options for the Tailwind CSS breakpoints Astro integration.
 */
export interface TailwindBreakpointsOptions {
	/**
	 * Define the Tailwind CSS breakpoints to use.
	 * Key is the name of the breakpoint, value is the size of the breakpoint.
	 * If the value is a number, it will be converted to a string with
	 * the suffix "px".
	 * Make sure that all values are in the same unit (px, rem, em, etc.).
	 *
	 * By default, the breakpoints are:
	 * - `sm`: `"40rem"` (640px with a root font size of 16px)
	 * - `md`: `"48rem"` (768px with a root font size of 16px)
	 * - `lg`: `"64rem"` (1024px with a root font size of 16px)
	 * - `xl`: `"80rem"` (1280px with a root font size of 16px)
	 * - `2xl`: `"96rem"` (1536px with a root font size of 16px)
	 */
	breakpoints?: Record<string, string | number>;
}

/**
 * An Astro integration that adds a dev toolbar app to show the current
 * Tailwind CSS breakpoint.
 *
 * @param options The options for the integration.
 */
export default function tailwindBreakpoints(
	options: TailwindBreakpointsOptions = {},
): AstroIntegration {
	// API Reference: https://docs.astro.build/en/reference/integrations-reference/
	return {
		name: "astro-tailwind-breakpoints",
		hooks: {
			"astro:config:setup": ({ addDevToolbarApp }) => {
				const {
					breakpoints = {
						sm: "40rem",
						md: "48rem",
						lg: "64rem",
						xl: "80rem",
						"2xl": "96rem",
					},
				} = options;

				const sortedBreakpointsArray =
					Object.entries(breakpoints).sort(sortBreakpoints);

				addDevToolbarApp({
					id: "astro-tailwind-breakpoints-dev-toolbar-app",
					name: "Tailwind CSS Breakpoint",
					entrypoint: fileURLToPath(
						new URL("./app.js", import.meta.url),
					),
					icon:
						// biome-ignore lint/style/useTemplate: Easier to read...
						'<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" aria-hidden="true" viewBox="-10 -10 20 20">' +
						"<style>" +
						"text{" +
						"-moz-osx-font-smoothing:grayscale;" +
						"-webkit-font-smoothing:antialiased;" +
						"-webkit-text-size-adjust:100%;" +
						"display:none;" +
						"dominant-baseline:middle;" +
						"font-family:var(--default-mono-font-family,var(--font-mono,ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,&quot;Liberation Mono&quot;,&quot;Courier New&quot;,monospace));" +
						"font-feature-settings:var(--default-mono-font-feature-settings,var(--font-mono--font-feature-settings,normal));" +
						"font-variation-settings:var(--default-mono-font-variation-settings,var(--font-mono--font-variation-settings,normal));" +
						"text-anchor:middle" +
						"}" +
						"#_{display:inline}" +
						sortedBreakpointsArray
							.map(
								([, value], index) =>
									`@media (width>=${value}){#${generateCSSId(index)}{display:inline}#${index === 0 ? "_" : generateCSSId(index - 1)}{display:none}}`,
							)
							.join("") +
						"</style>" +
						`<text id="_" lengthAdjust="spacingAndGlyphs" textLength="20">&lt;${sortedBreakpointsArray[0]?.[0] || "*"}</text>` +
						sortedBreakpointsArray
							.map(
								([name], index) =>
									`<text id="${generateCSSId(index)}" lengthAdjust="spacingAndGlyphs" textLength="20">${name}</text>`,
							)
							.join("") +
						"</svg>",
				});
			},
		},
	};
}
