"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const https = __importStar(require("https"));
const async_1 = require("async");
const querystring_1 = require("querystring");
const NPM_REGISTRY_HOST = "registry.npmjs.org";
class DependencyTreeFetcher {
    constructor(packageName, packageVersion, options, callback) {
        this._packageName = packageName;
        this._packageVersion = packageVersion;
        this._options = options;
        this._tree = {};
        this._packageJsonCache = {};
        this._tasksQueue = async_1.queue((task, done) => {
            this.fetchTreeForPackage(task, done);
        }, 5);
        this._tasksQueue.drain = () => {
            callback(this._tree);
        };
    }
    fetch() {
        this._tasksQueue.push({
            packageName: this._packageName,
            packageVersion: this._packageVersion,
            parent: this._tree
        });
    }
    fetchTreeForPackage(task, done) {
        const packageName = task.packageName;
        const packageVersion = task.packageVersion;
        let cachePackageId = "";
        if (packageVersion) {
            cachePackageId = this._getPackageId(packageName, packageVersion);
        }
        if (!packageVersion || !this._packageJsonCache[cachePackageId]) {
            this._getPackageJsonFromNpm(packageName, packageVersion, (error, packageJson) => {
                if (!error) {
                    this._packageJsonCache[this._getPackageId(packageName, packageJson.version)] = packageJson;
                    return this._handlePackageJson(task.parent, packageName, packageJson.version, packageJson, done);
                }
                else {
                    this._log(error.message);
                    return done();
                }
            });
        }
        else {
            const packageJson = this._packageJsonCache[cachePackageId];
            return this._handlePackageJson(task.parent, packageName, packageJson.version, packageJson, done);
        }
    }
    _handlePackageJson(parent, packageName, packageVersion, packageJson, done) {
        this._parseDepenenciesFromPackageJson(parent, packageName, packageVersion, packageJson, done);
    }
    _getPackageJsonFromNpm(packageName, packageVersion, callback) {
        const requestName = packageName;
        const requestVersion = packageVersion && packageVersion.length > 0 ? packageVersion : 'latest';
        this._log(`Fetching package.json for ${packageName}, ${requestVersion}`);
        const options = {
            hostname: NPM_REGISTRY_HOST,
            path: `/${querystring_1.escape(requestName)}/${querystring_1.escape(requestVersion)}`,
            method: 'GET'
        };
        const request = https.request(options, (res) => {
            if (res.statusCode !== 200) {
                return callback(new Error(`Failed loading package.json (http error: ${res.statusCode})`));
            }
            else {
                res.setEncoding('utf8');
                let body = "";
                res.on('data', (data) => {
                    body += data;
                });
                res.on('end', () => {
                    let packageJson = {};
                    try {
                        packageJson = JSON.parse(body);
                    }
                    catch (exception) {
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
    _parseDepenenciesFromPackageJson(parent, packageName, packageVersion, packageJson, done) {
        this._log(`Parsing package.json for: ${packageName}@${packageVersion}`);
        const packageId = this._getPackageId(packageName, packageVersion);
        parent[packageId] = {};
        const dependencies = Object.assign({}, packageJson.optionalDependencies, packageJson.peerDependencies, packageJson.dependencies, (parent === this._tree && this._options.includeDevelopmentPackages) ? packageJson.devDependencies : {});
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
    _getPackageId(packageName, packageVersion) {
        return `${packageName}@${packageVersion}`;
    }
    _log(message) {
        if (this._options.verbose) {
            console.log(`[${Date.now()}] ${message}`);
        }
    }
}
exports.DependencyTreeFetcher = DependencyTreeFetcher;
;
//# sourceMappingURL=dependencyTreeFetcher.js.map