const Cache = require('./cache');


class MemoryCache extends Cache {
    constructor(config, name) {
        super({ ttl: true }, config, name);
        this._types = {};
    }

    /**
     * Stores the payload in cache.
     * @param {string} type         The name of the type to cache for
     * @param {string|number} id    The id of the document to store
     * @param {*} payload           The data to cache
     * @returns {Promise.<Payload>}
     * @private
     */
    async _store(type, id, payload) {
        this._types[type] = this._types[type] || {};
        this._types[type][id] = payload;
        return payload;
    }

    /**
     * Fetches payload from cache.
     * @param {string} type
     * @param {string|number} id
     * @returns {Promise.<Payload>}
     * @private
     */
    async _fetch(type, id) {
        return this._types[type] && this._types[type][id];
    }

    /**
     * Returns all cached messages and listeners
     * @param {string} type     The id/name of the type for which to fetch data
     * @returns {Promise.<Payload[]>}
     * @private
     */
    async _list(type) {
        let list = [];
        for (let id in this._types[type]) {
            list.push(this._types[type][id]);
        }
        return list;
    }

    /**
     * Returns a map of all stored entries for a type
     * @param {string} type
     * @returns {Promise.<Object<String, Payload>>}
     * @private
     */
    async _map(type) {
        return this._types[type];
    }

    /**
     * Removes all cached data from a type.
     * @param {string} type    The id/name of the type to clear
     * @returns {Promise.<Object<String, Payload>>}
     * @private
     */
    async _clear(type) {
        let entries = this._types[type];
        delete this._types[type];
        return entries;
    }

    /**
     * Remove an entry from cache.
     * @param {string} type     The id/name of the type from which to remove the message
     * @param {string} id       The id of the message to remove
     * @returns {Promise.<Payload>}
     * @private
     */
    async _remove(type, id) {
        let payload = this._types[type][id];
        delete this._types[type][id];
        return payload;
    }
}

module.exports = MemoryCache;
