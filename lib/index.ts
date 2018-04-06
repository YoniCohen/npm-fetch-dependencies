import { DependencyTreeFetcher } from './internal/dependencyTreeFetcher';
import { FetchOptions } from './fetchOptions';

export function getDependencyTreeFromNpm(packageName: string,
  packageVersion: string | null,
  options: FetchOptions,
  callback: Function) {

  const fetcher = new DependencyTreeFetcher(packageName, packageVersion, options, callback);
  
  fetcher.fetch();
};