const Logging = require('@cheevr/logging');

/**
 * A payload object, that can be anything that can be stored by the cache implementation.
 * @typedef {*} Payload
 */

/**
 * A parent class that implements some of the common features available to all cache instances
 * @abstract
 */
class Cache {
    /**
     *
     * @param {Object} features
     * @param {boolean} features.ttl    Whether the cache implementation enable ttl support
     * @param {CacheConfig} config      The cache configuration
     * @param {string} name             The name of this cache instance
     */
    constructor(features, config, name) {
        this._features = features;
        this._config = config;
        this._name = name;
        this._type = config.type;
        this._ttl = features.ttl && config.ttl;
        this._log = Logging[config.logger];
        this._timeouts = {};
        this._log.info('Set up cache with name %s of type %s', this.name, this.type);
    }

    /**
     * Returns the name of this instance
     * @returns {string}
     */
    get name() {
        return this._name;
    }

    /**
     * Returns the type of cache this implementation is using.
     * @returns {string}
     */
    get type() {
        return this._type;
    }

    /**
     * Stores data in cache. Supports both callback or promise interface. Storing a value in cache
     * will reset the ttl (if enabled).
     * @param {string} type
     * @param {string|number} id
     * @param {Payload} payload
     * @param {Callback} [cb]
     * @returns {Promise.<Payload>}
     */
    store(type, id, payload, cb) {
        type = typeof type === 'string' ? type : String(type);
        id = typeof id === 'string' ? id : String(id);
        if (this._ttl) {
            this._timeouts[type] = this._timeouts[type] || {};
            this._timeouts[type][id] && clearTimeout(this._timeouts[type][id]);
            this._timeouts[type][id] = setTimeout(this.remove.bind(this), this._ttl, type, id);
        }
        this._log.trace('Storing payload under key [%s:%s] in %s cache (%s)', type, id, this.name, this.type);
        if (cb) {
            return this._store(type, id, payload).then(result => cb(null, result)).catch(err => {
                this._log.error('Unable to store payload for key [%s:%s] in cache of type %s:', type, id, this.type, err);
                cb(err);
            })
        } else {
            return this._store(type, id, payload);
        }
    }

    /**
     * Retrieve data from cache. Supports both callback or promise interface. Fetching from cache
     * will reset the ttl (if enabled).
     * @param {string} type
     * @param {string|number} id
     * @param {Callback} cb
     * @returns {Promise.<Payload>}
     */
    fetch(type, id, cb) {
        type = typeof type === 'string' ? type : String(type);
        id = typeof id === 'string' ? id : String(id);
        if (this._ttl && this._timeouts[type]) {
            this._timeouts[type][id] && clearTimeout(this._timeouts[type][id]);
            this._timeouts[type][id] = setTimeout(this.remove.bind(this, type, id), this._ttl);
        }
        this._log.trace('Fetching payload for key [%s:%s] from %s cache (%s)', type, id, this.name, this.type);
        if (cb) {
            return this._fetch(type, id).then(result => cb(null, result)).catch(err => {
                this._log.error('Unable to fetch payload for key [%s:%s] from cache of type %s:', type, id, this.type, err);
                cb(err);
            });
        } else {
            return this._fetch(type, id);
        }
    }

    /**
     * Returns a list of payloads for the given type. An order is not guaranteed. Supports both
     * callback or promise interface. Will not reset ttl if accessed (if enabled).
     * @param {string} type
     * @param {Callback} [cb]
     * @returns {Promise.<Payload[]>}
     */
    list(type, cb) {
        type = typeof type === 'string' ? type : String(type);
        if (cb) {
            this._list(type).then(result => cb(null, result)).catch(err => {
                this._log.error('Unable to list payloads for key [%s] from cache of type %s', type, this.type, err);
                cb(err);
            });
        } else {
            return this._list(type);
        }
    }

    /**
     * Returns a map of id -> payload. Supports both callback or promise interface. Will not reset
     * ttl if accessed (if enabled).
     * @param {string} type
     * @param {Callback} [cb]
     * @returns {Promise.<Object<string, Payload>>}
     */
    map(type, cb) {
        type = typeof type === 'string' ? type : String(type);
        if (cb) {
            this._map(type).then(result => cb(null, result)).catch(err => {
                this._log.error('Unable create map for key [%s] from cache of type %s', type, this.type, err);
                cb(err);
            });
        } else {
            return this._map(type);
        }
    }

    /**
     * Removes a payload from cache. Supports both callback or promise interface. Will remove the ttl
     * of the entry affected.
     * @param {string} type
     * @param {string|number} id
     * @param {Callback} [cb]
     * @returns {Promise.<Payload>}
     */
    remove(type, id, cb) {
        type = typeof type === 'string' ? type : String(type);
        id = typeof id === 'string' ? id : String(id);
        if (this._timeouts[type]) {
            this._timeouts[type][id] && clearTimeout(this._timeouts[type][id]);
            delete this._timeouts[type][id];
        }
        this._log.trace('Removing payload for key [%s:%s] from %s cache (%s)', type, id, this.name, this.type);
        if (cb) {
            this._remove(type, id).then(result => cb(null, result)).catch(err => {
                this._log.error('Unable to remove entry for key [%s:%s] form cache of type %s:', type, id, this.type, err);
                cb(err);
            });
        } else {
            return this._remove(type, id);
        }
    }

    /**
     * Removes all payload of a given type from cache. Supports both callback and promise interface. Will
     * remove the ttl of all entries affected.
     * @param {string} type
     * @param {Callback} cb
     * @returns {*}
     */
    clear(type, cb) {
        type = typeof type === 'string' ? type : String(type);
        if (this._timeouts[type]) {
            this._timeouts[type].forEach(clearTimeout);
            delete this._timeouts[type];
        }
        this._log.trace('Clearing cache for type [%s] from %s cache (%s)', type, this.name, this.type);
        if (cb) {
            this._clear(type).then(result => cb(null, result)).catch(err => {
                this._log.error('Unable to clear entries for key [%s] from cache of type %s:', type, this.type, err);
                cb(err);
            });
        } else {
            return this._clear(type);
        }
    }
}

module.exports = Cache;
