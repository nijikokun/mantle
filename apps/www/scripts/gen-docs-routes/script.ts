import path from "node:path";
import { glob } from "tinyglobby";

type Path = `/${string}`;

/**
 * Process a target to generate a list of route paths and route patterns.
 */
export async function processRoutes(
	remixAppRoutesDirPath: string,
): Promise<readonly [routePaths: Array<Path>, routePatterns: Array<Path>]> {
	const globPath = path.join(remixAppRoutesDirPath, "**", "*.tsx");
	const filepaths = await glob([globPath]);

	const [uniqRoutePaths, uniqRoutePatterns] = getInitialRouteSets();

	filepaths.forEach((filepath) => {
		const filename = path.basename(filepath, ".tsx").trim();

		const segments = parseSegmentsFromFilename(filename);

		const routePath = formatRoutePathFromSegments(segments);
		const routePattern = formatRoutePatternFromSegments(segments);

		uniqRoutePaths.add(routePath);
		uniqRoutePatterns.add(routePattern);
	});

	const routePaths = Array.from(uniqRoutePaths).sort();
	const routePatterns = Array.from(uniqRoutePatterns).sort();

	return [routePaths, routePatterns] as const;
}

/**
 * Initialize a set of route paths and route patterns that includes the root route `"/"`.
 */
function getInitialRouteSets(): [uniqRoutePaths: Set<Path>, uniqRoutePatterns: Set<Path>] {
	const uniqRoutePaths = new Set<Path>();
	const uniqRoutePatterns = new Set<Path>();

	// add the root route path and root route pattern
	uniqRoutePaths.add("/");
	uniqRoutePatterns.add("/");

	return [uniqRoutePaths, uniqRoutePatterns];
}

/**
 * Parse a filename into route segments.
 */
export function parseSegmentsFromFilename(filename: string): string[] {
	return filename
		.split(".")
		.map((part) => part.trim()) // remove surrounding whitespace; this is likely unnecessary, but just in case
		.filter(Boolean) // remove empty segments; this is likely unnecessary, but just in case
		.filter((part) => {
			// ignore index routes (they will match the parent route)
			if (part === "_index") {
				return false;
			}
			// ignore pathless route segments, they do not contribute to the route by definition
			if (/^_/.test(part)) {
				return false;
			}
			return true;
		});
}

/**
 * Format a list of route segments into a route path string.
 * Should return a valid path string, e.g. "/foo/{bar}/baz".
 */
export function formatRoutePathFromSegments(pathSegments: string[]): Path {
	const pathname = pathSegments
		.map((segment) => segment.trim()) // remove whitespace around segments; this is likely unnecessary, but just in case
		.filter(Boolean) // remove empty segments; this is likely unnecessary, but just in case
		.map((segment) => {
			// for dynamic segments (start with "$"), replace `$<segment>` with `{<segment>}` to make it a valid path segment
			if (/^\$/.test(segment)) {
				return `${segment.replace(/^\$/, "{")}}`;
			}
			return segment;
		})
		.join("/"); // join segments with slashes

	// ensure leading slash and no trailing slash
	return `/${trimSlashes(pathname)}`;
}

/**
 * Format a list of route segments into a route pattern string.
 * Should return a valid route pattern string, e.g. "/foo/:bar/baz".
 */
export function formatRoutePatternFromSegments(pathSegments: string[]): Path {
	const pathname = pathSegments
		.map((segment) => segment.trim()) // remove whitespace around segments; this is likely unnecessary, but just in case
		.filter(Boolean) // remove empty segments; this is likely unnecessary, but just in case
		.map((segment) => {
			// for dynamic segments (start with "$"), replace `$<segment>` with `:<segment>` to make it a valid route pattern segment
			if (/^\$/.test(segment)) {
				return `${segment.replace(/^\$/, ":")}`;
			}
			return segment;
		})
		.join("/");

	// ensure leading slash and no trailing slash
	return `/${trimSlashes(pathname)}`;
}

/**
 * Generate a typescript file that exports a string union type for each route path and route pattern.
 */
export function generateTypeScriptTemplate(routePaths: Array<Path>, routePatterns: Array<Path>): string {
	const topLevelNavItems = gatherTopLevelNav(routePaths);

	return `
// This file was generated by \`gen-remix-routes\`. DO NOT EDIT.

export const routePatterns = [
${routePatterns.map((pattern) => `\t"${pattern}",`).join("\n")}
] as const;

export type RoutePattern = typeof routePatterns[number];

export const routePattern = <T extends RoutePattern>(value: T) => value;

export const isRoutePattern = (value: unknown): value is RoutePattern =>
	typeof value === "string" && routePatterns.includes(value as RoutePattern);

export const routes = [
${routePaths.map((routePath) => `\t"${routePath}",`).join("\n")}
] as const;

export type Route = typeof routes[number];

export const route = <T extends Route>(value: T) => value;

export const isRoute = (value: unknown): value is Route => typeof value === "string" && routes.includes(value as Route);

export const topLevelNavItems = [
${topLevelNavItems.map((navItem) => `\t"${navItem}",`).join("\n")}
] as const;

export type TopLevelNav = typeof topLevelNavItems[number];

export const topLevelNav = <T extends TopLevelNav>(value: T) => value;

export const isTopLevelNav = (value: unknown): value is TopLevelNav =>
	typeof value === "string" && topLevelNavItems.includes(value as TopLevelNav);
`.trimStart();
}

/**
 * Gather all top level nav items from a list of route paths.
 */
function gatherTopLevelNav(routePaths: string[]): string[] {
	const set = new Set<string>();

	routePaths.forEach((route) => {
		const routeParts = route.split("/").filter(Boolean);
		const topLevelNav = routeParts[0] ?? "";
		set.add(`/${topLevelNav}`);
	});

	return [...set].sort();
}

/**
 * Trim leading and trailing slashes from a string.
 */
function trimSlashes(value: string | undefined) {
	return trimLeadingSlashes(trimTrailingSlashes(value));
}

/**
 * Removes all leading slashes from a string.
 *
 * @example given "/foo/bar" returns "foo/bar"
 * @example given "/////foo/bar" returns "foo/bar"
 */
const trimLeadingSlashes = (value: string | undefined): string => (value || "").replace(/^\/+/, "");

/**
 * Removes all trailing slashes from a string.
 *
 * @example given "/foo/bar/" returns "/foo/bar"
 * @example given "/foo/bar/////" returns "/foo/bar"
 */
const trimTrailingSlashes = (value: string | undefined): string => (value || "").replace(/\/+$/, "");