'use strict';

module.exports = function(modulePrefix, moduleConfig, modulePath, moduleExtension) {
    let path;
    let collectionPath;

    // TODO allow this setting in the resolver config
    const defaultTypesByExtension = {
      '.hbs': 'template',
      '.handlebars': 'template'
    };

    // console.log('path', modulePath, 'extension', moduleExtension);

    for (let i = 0, l = moduleConfig.collectionPaths.length; i < l; i++) {
      path = moduleConfig.collectionPaths[i];
      if (modulePath.indexOf(path) === 0) {
        collectionPath = path;
        break;
      }
    }

    if (collectionPath) {
      // trim group/collection from module path
      modulePath = modulePath.substr(collectionPath.length + 1);
    } else {
      collectionPath = 'main';
    }

    let name, type;
    let rootCollectionName = moduleConfig.collectionMap[collectionPath];
    let rootCollection = moduleConfig.collections[rootCollectionName];
    let parts = modulePath.split('/');

    let collection = rootCollection;
    let collectionName = rootCollectionName;

    // scan for private collections
    parts.forEach(part => {
      if (part.indexOf('-') === 0) {
        let privateCollectionName = part.substr(1);

        if (collection.privateCollections.indexOf(privateCollectionName) === -1) {
          throw new Error(`The collection '${collectionName}' is not configured to contain a collection '${privateCollectionName}'`);
        }

        collectionName = privateCollectionName;
        collection = moduleConfig.collections[collectionName];
      }
    });

    if (collection.unresolvable) {
      return null;
    }

    // normalize the path for the specifier
    // in the case `managerId` is present
    parts = parts.map(path => path.split('.')[0]);

    let part = parts[parts.length - 1];

    if (collection.types.indexOf(part) > -1) {
      type = parts.pop();
      if (parts.length > 0) {
        name = parts.pop();
      } else {
        throw new Error(`The name of module '${modulePath}' could not be identified`);
      }
    } else {
      name = parts.pop();
      if (defaultTypesByExtension[moduleExtension]) {
        type = defaultTypesByExtension[moduleExtension];
      } else if (collection.defaultType) {
        type = collection.defaultType;
      } else {
        throw new Error(`The type of module '${modulePath}' could not be identified`);
      }
    }

    let specifierPath = [modulePrefix, rootCollectionName];

    // Append any remaining parts as a namespace
    if (parts.length > 0) {
      Array.prototype.push.apply(specifierPath, parts);
    }

    specifierPath.push(name);

    let specifier = type + ':/' + specifierPath.join('/');

    return specifier;
};
