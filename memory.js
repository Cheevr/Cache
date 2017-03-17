class MemoryCache {
    constructor() {
        this._queues = {};
    }

    /**
     * Stores the payload in cache.
     * @param {string} type         The name of the type to cache for
     * @param {string} id           The id of the document to store
     * @param {object} payload      The data to cache
     * @param {string} payload.id   The id that is being used to reference the message later on
     * @param {Callback} [cb]       Callback to be notified on async store operations
     */
    store(type, id, payload, cb) {
        this._queues[type] = this._queues[type] || {};
        this._queues[type][id] = payload;
        cb && cb();
    }

    /**
     * Returns all cached messages and listeners
     * @param {string} type     The id/name of the type for which to fetch data
     * @param {Callback} [cb]   Callback function for async fetching
     * @returns {Object<string, Object>}    A map with message id's mapping to payloads
     */
    get(type, cb) {
        cb && cb(null, this._queues[type]);
        return this._queues[type];
    }

    /**
     * Removes all cached data from a type
     * @param {string} type    The id/name of the type to clear
     * @param {Callback} [cb]   Callback to be notified on async clear operations
     */
    clear(type, cb) {
        delete this._queues[type];
        cb && cb();
    }

    /**
     * Remove an entry from cache.
     * @param {string} type     The id/name of the type from which to remove the message
     * @param {string} id       The id of the message to remove
     * @param {Callback} [cb]   Callback to be notified on async remove operations
     */
    remove(type, id, cb) {
        delete this._queues[type][id];
        cb && cb();
    }
}

module.exports = MemoryCache;
