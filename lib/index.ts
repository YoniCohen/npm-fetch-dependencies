import { DependencyTreeFetcher } from './internal/dependencyTreeFetcher';
import { FetchOptions } from './fetchOptions';

/**
    * The main entry point for using the package   
    * @param {string} packageName - The name of the package to fetch the tree for
    * @param {string} packageVersion - The version of the package to fetch the tree for (optional)
    * @param {FetchOptions} optional - Fetch options
    * @param {Function} callback - Callback function when finished
    * 
  */
export function getDependencyTreeFromNpm(packageName: string,
  packageVersion: string | null,
  options: FetchOptions,
  callback: Function) {

  const fetcher = new DependencyTreeFetcher(packageName, packageVersion, options, callback);
  
  fetcher.fetch();
};

export { FetchOptions };