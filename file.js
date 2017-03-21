const Cache = require('./cache');
const fs = require('fs');
const path = require('path');


/**
 * @typedef {Object} FileCacheConfig
 * @extends CacheConfig
 * @property {string} [path=queues] The directory in which to store queue information
 */

const cwd = process.cwd();

/**
 * This cache implementation will store queues and messages on disk in a given directory. Queues are mapped to
 * directories and message are stored as files. All data is also cached in memory, so that file read access only
 * happens after a reboot through lazy initialization.
 */
class FileCache extends Cache {
    /**
     * @param {FileCacheConfig} config
     * @param {string} name
     */
    constructor(config, name) {
        super({ ttl: true }, config, name);
        this._path = FileCache._mkDir(config && config.path || 'cache');
    }

    /**
     * Recursively creates a path if doesn't exist yet.
     * @param {string} dir  An absolute path to be created
     * @private
     */
    static _mkDir(dir) {
        dir = path.isAbsolute(dir) ? dir : path.join(cwd, dir);
        let fullPath = '';
        for (let entry of dir.split(path.sep)) {
            fullPath += '/' + entry;
            fs.existsSync(fullPath) || fs.mkdirSync(fullPath);
        }
        return dir;
    }

    /**
     * Stores the payload in cache.
     * @param {string} type         The type/group to cache for
     * @param {string|number} id    The id of the document to store
     * @param {Payload} payload     The data to cache
     * @returns {Promise.<Payload>}
     * @private
     */
    async _store(type, id, payload) {
        let fullPath = path.join(this._path, type);
        fs.existsSync(fullPath) || fs.mkdirSync(fullPath);
        fs.writeFileSync(path.join(fullPath, id), JSON.stringify(payload), 'utf8');
        return payload;
    }

    async _fetch(type, id) {
        let file = path.join(this._path, type, id);
        return fs.existsSync(file) && JSON.parse(fs.readFileSync(file, 'utf8'))
    }

    /**
     * Returns all cached messages and listeners
     * @param {string} type    The id/name of the type for which to fetch data
     * @returns {Object<string, Object>}    A map with message id's mapping to payloads
     */
    async _map(type) {
        let fullPath = path.join(this._path, type);
        let files = fs.readdirSync(fullPath);
        let response = {};
        for (let file of files) {
            let payload = JSON.parse(fs.readFileSync(path.join(fullPath, file), 'utf8'));
            response[file] = payload;
        }
        return response;
    }

    async _list(type) {
        let fullPath = path.join(this._path, type);
        let files = fs.readdirSync(fullPath);
        let response = [];
        for (let file of files) {
            let payload = JSON.parse(fs.readFileSync(path.join(fullPath, file), 'utf8'));
            response.push(payload);
        }
        return response;
    }

    /**
     * Removes all cached data from a type
     * @param {string} type    The id/name of the type to clear
     */
    async _clear(type) {
        let fullPath = path.join(this._path, type);
        for (let file of fs.readdirSync(fullPath)) {
            await this._remove(type, file);
        }
        fs.existsSync(fullPath) && fs.rmdirSync(fullPath);
    }

    /**
     * Remove an entry from cache.
     * @param {string} type    The id/name of the type from which to remove the message
     * @param {string} id       The id of the message to remove
     */
    async _remove(type, id) {
        let fullPath = path.join(this._path, type, id);
        let result = await this._fetch(type, id);
        fs.existsSync(fullPath) && fs.unlinkSync(fullPath);
        return result;
    }

    /**
     * Returns the path under which all queues are being cached
     * @returns {string}
     */
    get path() {
        return this._path;
    }
}

module.exports = FileCache;
