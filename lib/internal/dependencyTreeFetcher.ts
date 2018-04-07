import * as https from 'https';
import { PackageTask } from './packageTask';
import { FetchOptions } from './../fetchOptions';
import { queue, AsyncQueue } from 'async';
import { escape as qsEscape } from 'querystring';

const NPM_REGISTRY_HOST = "registry.npmjs.org";

/**
 * The class that contains the logic of fetching a depdenecncy tree for a package.
 */
export class DependencyTreeFetcher {
  private _packageName: string;
  private _packageVersion: string | null;
  private _options: FetchOptions;

  private _tasksQueue: AsyncQueue<PackageTask>;
  private _tree: any;
  private _packageJsonCache: any;

  /**
    * @constructor
    * @param {string} packageName - The name of the package to fetch the tree for
    * @param {string} packageVersion - The version of the package to fetch the tree for (optional)
    * @param {FetchOptions} optional - Fetch options
    * @param {Function} callback - Callback function when finished
    * 
  */
  constructor(packageName: string,
    packageVersion: string | null,
    options: FetchOptions,
    callback: Function) {

    this._packageName = packageName;
    this._packageVersion = packageVersion;
    this._options = options;
    this._tree = {};
    this._packageJsonCache = {};

    this._tasksQueue = queue((task, done) => {
      this.fetchTreeForPackage(task, done)
    }, 5);

    this._tasksQueue.drain = () => {
      callback(this._tree);
    }
  }

  /**
    * Starts the fetching operation from npm registry
  */
  public fetch() {
    this._tasksQueue.push({
      packageName: this._packageName,
      packageVersion: this._packageVersion,
      parent: this._tree
    });
  }

  private fetchTreeForPackage(task: PackageTask, done: any) {
    const packageName: string = task.packageName;
    const packageVersion: string | null = task.packageVersion;
    let cachePackageId = "";

    if (packageVersion) {
      cachePackageId = this._getPackageId(packageName, packageVersion);
    }

    if (!packageVersion || !this._packageJsonCache[cachePackageId]) {
      this._getPackageJsonFromNpm(packageName, packageVersion, (error: Error, packageJson: any) => {
        if (!error) {
          this._packageJsonCache[this._getPackageId(packageName, packageJson.version)] = packageJson;
          return this._handlePackageJson(task.parent, packageName, packageJson.version, packageJson, done);
        } else {
          this._log(error.message);
          return done();
        }
      });
    } else {
      const packageJson = this._packageJsonCache[cachePackageId];
      return this._handlePackageJson(task.parent, packageName, packageJson.version, packageJson, done);
    }
  }

  private _handlePackageJson(parent: {},
    packageName: string,
    packageVersion: string,
    packageJson: any,
    done: Function) {

    this._parseDepenenciesFromPackageJson(parent, packageName, packageVersion, packageJson, done);
  }

  private _getPackageJsonFromNpm(packageName: string, packageVersion: string | null, callback: Function) {
    const requestName: string = packageName;
    const requestVersion: string = packageVersion && packageVersion.length > 0 ? packageVersion : 'latest';
    this._log(`Fetching package.json for ${packageName}, ${requestVersion}`);

    const options = {
      hostname: NPM_REGISTRY_HOST,
      path: `/${qsEscape(requestName)}/${qsEscape(requestVersion)}`,
      method: 'GET'
    };

    const request = https.request(options, (res) => {
      if (res.statusCode !== 200) {
        return callback(new Error(`Failed loading package.json (http error: ${res.statusCode})`));
      } else {
        res.setEncoding('utf8');
        let body = "";
        res.on('data', (data) => {
          body += data;
        });

        res.on('end', () => {
          let packageJson = {};
          try {
            packageJson = JSON.parse(body);
          } catch (exception) {
            return callback(new Error(`Failed parsing package.json for ${packageName}`));
          }

          return callback(null, packageJson);
        });
      }
    });

    request.on('error', (e) => {
      return callback(new Error(`Failed loading package.json for ${packageName}`));
    });

    request.end();
  }

  private _parseDepenenciesFromPackageJson(parent: {},
    packageName: string,
    packageVersion: string,
    packageJson: any,
    done: Function) {

    this._log(`Parsing package.json for: ${packageName}@${packageVersion}`);
    const packageId = this._getPackageId(packageName, packageVersion);
    parent[packageId] = {}

    const dependencies: {} = Object.assign(
      {},
      packageJson.optionalDependencies,
      packageJson.peerDependencies,
      packageJson.dependencies,
      (parent === this._tree && this._options.includeDevelopmentPackages) ? packageJson.devDependencies : {}
    );

    const packages = Object.keys(dependencies);
    for (const idx in packages) {
      const currentPackageName = packages[idx];
      const currentPackageVersion = dependencies[packages[idx]];

      this._tasksQueue.push({
        packageName: currentPackageName,
        packageVersion: currentPackageVersion,
        parent: parent[packageId]
      });
    }

    done();
  }

  private _getPackageId(packageName: string, packageVersion: string) {
    return `${packageName}@${packageVersion}`;
  }

  private _log(message: string) {
    if (this._options.verbose) {
      console.log(`[${Date.now()}] ${message}`);
    }
  }
};