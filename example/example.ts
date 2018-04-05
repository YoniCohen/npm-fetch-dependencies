import getDependencyTreeFromNpm from './../lib';

/* Fetch depenencies for the mocha package, include the development only packages for root, and verbose logs */
getDependencyTreeFromNpm("mocha", null, { verbose: true, includeDevelopmentPackages: true }, (tree: any) => {
  console.log(JSON.stringify(tree));
});

/* Fetch depenencies for the node-usb@1.4.0  package, without the development packages */
getDependencyTreeFromNpm("usb", "1.4.0", { verbose: true }, (tree: any) => {
  console.log(JSON.stringify(tree));
});