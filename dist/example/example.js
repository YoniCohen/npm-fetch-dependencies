"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lib_1 = require("./../lib");
/* Fetch depenencies for the mocha package, include the development only packages for root, and verbose logs */
lib_1.getDependencyTreeFromNpm("mocha", null, { verbose: true, includeDevelopmentPackages: true }, (tree) => {
    console.log(JSON.stringify(tree));
});
/* Fetch depenencies for the node-usb@1.4.0  package, without the development packages */
lib_1.getDependencyTreeFromNpm("usb", "1.4.0", { verbose: true }, (tree) => {
    console.log(JSON.stringify(tree));
});
//# sourceMappingURL=example.js.map