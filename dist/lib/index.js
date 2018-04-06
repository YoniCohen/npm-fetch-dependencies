"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dependencyTreeFetcher_1 = require("./internal/dependencyTreeFetcher");
function getDependencyTreeFromNpm(packageName, packageVersion, options, callback) {
    const fetcher = new dependencyTreeFetcher_1.DependencyTreeFetcher(packageName, packageVersion, options, callback);
    fetcher.fetch();
}
exports.getDependencyTreeFromNpm = getDependencyTreeFromNpm;
;
//# sourceMappingURL=index.js.map