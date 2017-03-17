let config = require('cheevr-config');


/**
 * @typedef {function} Callback
 * @param {Error|string|null} [err]
 * @param {...*} params
 */

/**
 * @typedef {Object} CacheConfig
 * @property {string} type  The cache type that should be used to store data. Maps directly to the file names of the caches
 */

class Cache {
    /**
     * Returns a cache implementation of the given type.
     * @param {string} [name=_default_]
     */
    get(name = '_default_') {
        let instanceConfig = config.cache[name] || { type: config.defaults.cache.defaultType };
        return new (require('./' + instanceConfig.type))(instanceConfig);
    }
}

module.exports = new Cache();
