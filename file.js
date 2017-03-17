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
class FileCache {
    /**
     * @param {FileCacheConfig} config
     */
    constructor(config) {
        this._path = FileCache._mkDir(config && config.path || 'queues');
        this._queues = {};
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
     * @param {string} id           The id of the document to store
     * @param {object} payload      The data to cache
     * @param {Callback} [cb]       Callback to be notified on async store operations
     */
    store(type, id, payload, cb) {
        this._queues[type][id] = payload;
        let fullPath = path.join(this._path, type);
        fs.existsSync(fullPath) || fs.mkdirSync(fullPath);
        fs.writeFile(path.join(fullPath, id), JSON.stringify(payload), 'utf8', err => cb && cb(err));
    }

    /**
     * Returns all cached messages and listeners
     * @param {string} type    The id/name of the type for which to fetch data
     * @param {Callback} [cb]   Callback function for async fetching
     * @returns {Object<string, Object>}    A map with message id's mapping to payloads
     */
    get(type, cb) {
        if (this._queues[type]) {
            cb(null, this._queues[type]);
            return this._queues[type];
        }
        let fullPath = path.join(this._path, type);
        let files = fs.readdirSync(fullPath);
        let response = {};
        for (let file of files) {
            let payload = JSON.parse(fs.readFileSync(path.join(fullPath, file), 'utf8'));
            response[payload.id] = payload;
        }
        cb && cb(null, response);
        return response;
    }

    /**
     * Removes all cached data from a type
     * @param {string} type    The id/name of the type to clear
     * @param {Callback} [cb]   Callback to be notified on async clear operations
     */
    clear(type, cb) {
        let fullPath = path.join(this._path, type);
        fs.existsSync(fullPath) && fs.unlinkSync(fullPath);
        delete this._queues[type];
        cb && cb();
    }

    /**
     * Remove an entry from cache.
     * @param {string} type    The id/name of the type from which to remove the message
     * @param {string} id       The id of the message to remove
     * @param {Callback} [cb]   Callback to be notified on async remove operations
     */
    remove(type, id, cb) {
        let fullPath = path.join(this._path, type, id);
        fs.existsSync(fullPath) && fs.unlinkSync(fullPath);
        delete this._queues[type][id];
        cb && cb();
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
