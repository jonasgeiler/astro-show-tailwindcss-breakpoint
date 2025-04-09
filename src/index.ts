import { fileURLToPath } from "node:url";
import type { AstroIntegration } from "astro";

/** Re-usable error for invalid breakpoints. */
class InvalidBreakpointValueError extends TypeError {
	constructor(name: string, value: string | number) {
		super(
			`Breakpoint "${name}" has an invalid value: "${value}". Expected a number or a float-parsable string value.`,
		);
	}
}

/**
 * Sort breakpoints by their numeric value.
 *
 * @param name1 Name of breakpoint 1.
 * @param value1 Value of breakpoint 1.
 * @param name2 Name of breakpoint 2.
 * @param value2 Value of breakpoint 2.
 * @returns Negative number if value1 < value2, 0 if equal or positive number
 *  if value1 > value2.
 */
function sortBreakpoints(
	[name1, value1]: [string, string | number],
	[name2, value2]: [string, string | number],
): number {
	// parseFloat() can handle strings with units like "1rem" or "2px".
	const numValue1 =
		typeof value1 === "number" ? value1 : Number.parseFloat(value1);
	if (Number.isNaN(numValue1)) {
		throw new InvalidBreakpointValueError(name1, value1);
	}

	const numValue2 =
		typeof value2 === "number" ? value2 : Number.parseFloat(value2);
	if (Number.isNaN(numValue2)) {
		throw new InvalidBreakpointValueError(name2, value2);
	}

	return numValue1 - numValue2;
}

/**
 * Generate a unique CSS ID for a given number.
 *
 * @param index The number to generate the CSS ID for.
 * @returns The generated CSS ID.
 */
function generateCSSId(index: number) {
	// Basically a base-36 number system calculation, but with the first
	// character not being a number, and also using underscores and dashes.

	// biome-ignore lint/style/noNonNullAssertion: Can't be null, 26 is the length of the string.
	let id = "useandompxbfghjklqvwyzrict"[index % 26]!;
	let i = Math.floor(index / 26);
	while (i > 0) {
		// biome-ignore lint/style/noNonNullAssertion: Can't be null, 38 is the length of the string.
		id += "useandom-2619834075px_bfghjklqvwyzrict"[i % 38]!;
		i = Math.floor(i / 38);
	}
	return id;
}

/**
 * Generate an SVG icon which shows the active Tailwind CSS breakpoint.
 *
 * @param breakpoints The breakpoints to generate the icon for.
 * @returns The generated SVG icon.
 */
function generateIcon(breakpoints: Record<string, string | number>) {
	const sortedBreakpointsArray = Object.entries(breakpoints);
	if (sortedBreakpointsArray.length === 0) {
		throw new TypeError(
			"No breakpoints defined. At least one breakpoint must be specified.",
		);
	}
	if (sortedBreakpointsArray.length === 1) {
		// If there is only 1 breakpoint, .sort() does not run
		// sortBreakpoints(). So, if there is an invalid value,
		// it will not be caught. That's why we check here.

		// biome-ignore lint/style/noNonNullAssertion: Can't be null, we checked the length above.
		const [name, value] = sortedBreakpointsArray.pop()!;
		if (
			Number.isNaN(
				typeof value === "number" ? value : Number.parseFloat(value),
			)
		) {
			throw new InvalidBreakpointValueError(name, value);
		}
	} else {
		sortedBreakpointsArray.sort(sortBreakpoints);

		const foundValues: (string | number)[] = [];
		for (const [name, value] of sortedBreakpointsArray) {
			if (foundValues.includes(value)) {
				throw new TypeError(
					`Duplicate breakpoint value detected: "${value}" is already assigned to another breakpoint. Check "${name}".`,
				);
			}
			foundValues.push(value);
		}
	}

	return (
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
					`@media (width>=${typeof value === "number" ? `${value}px` : value}){#${generateCSSId(index)}{display:inline}#${index === 0 ? "_" : generateCSSId(index - 1)}{display:none}}`,
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
		"</svg>"
	);
}

/**
 * An Astro integration that adds a dev toolbar app to show the current
 * Tailwind CSS breakpoint.
 *
 * @param options The options for the integration.
 * @returns The integration.
 */
export default function showTailwindCSSBreakpoint(
	options: {
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
	} = {},
): AstroIntegration {
	// API Reference: https://docs.astro.build/en/reference/integrations-reference/
	return {
		name: "astro-show-tailwindcss-breakpoint",
		hooks: {
			"astro:config:setup": ({ addDevToolbarApp }) => {
				const {
					breakpoints = {
						// Default taken from https://tailwindcss.com/docs/responsive-design#overview
						sm: "40rem",
						md: "48rem",
						lg: "64rem",
						xl: "80rem",
						"2xl": "96rem",
					},
				} = options;

				addDevToolbarApp({
					id: "tailwindcss-breakpoint",
					name: "Tailwind CSS Breakpoint",
					icon: generateIcon(breakpoints),
					entrypoint: fileURLToPath(
						new URL("./app.js", import.meta.url),
					),
				});
			},
		},
	};
}
