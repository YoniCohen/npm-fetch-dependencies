/**
 * Interface for all fetching options.
 * @param {boolean} verbose - Should verbose logs be printed
 * @param {boolean} includeDevelopmentPackages - Should development packages for the main root be listed
 */
export interface FetchOptions {
    verbose?: boolean | undefined,
    includeDevelopmentPackages?: boolean | undefined
};