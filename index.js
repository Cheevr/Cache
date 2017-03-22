let _ = require('lodash');
let config = require('cheevr-config').addDefaultConfig(__dirname, 'config');


/**
 * @typedef {function} Callback
 * @param {Error|string|null} [err]
 * @param {...*} params
 */

/**
 * @typedef {Object} CacheConfig
 * @property {string} type  The cache type that should be used to store data. Maps directly to the file names of the caches
 * @property {number} ttl   A time to live in seconds, that will be enacted by the Cache class if enabled, or by the implementation itself.
 */

class Manager {
    constructor() {
        this.reset();
    }
    /**
     * Returns a cache implementation of the given type.
     * @param {string} [name=_default_]         The name of the cache instance (will be used to look up configs in files)
     * @param {CacheConfig} [instanceConfig]    The cache config that will be merged with the default options for this implementation
     * @returns Cache
     */
    instance(name = '_default_', instanceConfig) {
        if (typeof name !== 'string') {
            instanceConfig = name;
            name = '_default_';
        }
        instanceConfig = instanceConfig || this._config[name] || { type: this._defaults.defaultType };
        _.defaultsDeep(instanceConfig, this._defaults[instanceConfig.type]);
        instanceConfig.type = instanceConfig.type.toLowerCase().trim();
        return new (require('./' + instanceConfig.type))(instanceConfig, name);
    }

    /**
     * Allows to add configuration to the current configuration. Any new configs will be merged with existing ones.
     * @param {Object<string, CacheConfig>} config      A map of cache instance names to cache configurations
     * @param {Object<string, CacheConfig>} [defaults]  A map of cache types to cache configurations
     */
    configure(config, defaults) {
        this._config = _.merge(this._config, config);
        defaults && (this._defaults = _.merge(this._defaults, defaults));
    }

    /**
     * Will reset the cache manager to the configuration found on the file system.
     */
    reset() {
        this._config = {};
        this._defaults = {};
        this.configure(config.cache, config.defaults.cache);
    }
}

module.exports = new Manager();
