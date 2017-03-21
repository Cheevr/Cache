const Cache = require('./cache');
const redis = require('redis');


class Redis extends Cache {
    constructor(config, name) {
        super({ttl: config.inMemTTL}, config, name);
        this._client = redis.createClient({
            host: config.host,
            port: config.port
        });
        this._rttl = config.inMemTTL || config.ttl;
        this._prefix = config.prefix && config.prefix.trim().length && config.prefix.trim();
    }

    async _store(type, id, payload) {
        return new Promise((resolve, reject) => {
            let typeKey = this._getKey(type);
            if (this._rttl) {
                let itemKey = this._getKey(type, id);
                this._client.multi()
                    .set(itemKey, JSON.stringify(payload, 'utf8'), 'PX', this._rttl)
                    .sadd(typeKey, id)
                    .exec((err) => {
                        err && reject(err) || resolve(payload);
                    });
            } else {
                this._client.hset(typeKey, id, JSON.stringify(payload, 'utf8'), (err) => {
                    err && reject(err) || resolve(payload);
                });
            }
        });
    }

    async _fetch(type, id) {
        return new Promise((resolve, reject) => {
            if (this._rttl) {
                let itemKey = this._getKey(type, id);
                this._client.multi()
                    .pexpire(itemKey, this._rttl)
                    .get(itemKey)
                    .exec((err, result) => {
                        err && reject(err) || resolve(result[1] ? JSON.parse(result[1]) : undefined)
                    });
            } else {
                let typeKey = this._getKey(type);
                this._client.hget(typeKey, id, (err, result) => {
                    err && reject(err) || resolve(result ? JSON.parse(result) : undefined)
                });
            }
        });
    }

    async _map(type) {
        return new Promise((resolve, reject) => {
            let typeKey = this._getKey(type);
            if (this._rttl) {
                this._client.smembers(typeKey, (err, result1) => {
                    err && reject(err);
                    let list = result1.map(id => this._getKey(type, id));
                    this._client.mget(list, (err, result2) => {
                        if (err) {
                            return reject(err);
                        }
                        let map = {};
                        for (let x = 0; x < result1.length; x++) {
                            result2[x] && (map[result1[x]] = JSON.parse(result2[x]));
                        }
                        resolve(map);
                    });
                });
            } else {
                this._client.hgetall(typeKey, (err, result) => {
                    for (let key in result) {
                        result[key] = JSON.parse(result[key]);
                    }
                    err && reject(err) || resolve(result);
                });
            }
        });
    }

    async _list(type) {
        let map = await this._map(type);
        let list = [];
        for (let key in map) {
            list.push(map[key]);
        }
        return list;
    }

    async _clear(type) {
        return new Promise((resolve, reject) => {
            let typeKey = this._getKey(type);
            if (this._rttl) {
                this._client.smembers(typeKey, (err, result1) => {
                    err && reject(err);
                    let list = result1.map(id => this._getKey(type, id));
                    this._client.multi()
                        .del(list)
                        .del(typeKey)
                        .exec(err => {
                            err && reject(err) || resolve();
                        });
                });
            } else {
                this._client.del(typeKey, err => {
                    err && reject(err) || resolve();
                });
            }
        });
    }

    async _remove(type, id) {
        return new Promise((resolve, reject) => {
            let typeKey = this._getKey(type);
            if (this._rttl) {
                let itemKey = this._getKey(type, id);
                this._client.multi()
                    .get(itemKey)
                    .del(itemKey)
                    .srem(typeKey, id)
                    .exec((err, result) => {
                        err && reject(err)|| resolve(JSON.parse(result[0]));
                    });
            } else {
                this._client.multi()
                    .hget(typeKey, id)
                    .hdel(typeKey, id)
                    .exec((err, result) => {
                        err && reject(err) || resolve(JSON.parse(result[0]));
                    });
            }
        });
    }

    /**
     * Returns a properly formatted key when either type or type and id are given. The keys will
     * work for both ttl enabled or not.
     * @param {string} type
     * @param {string} [id]
     * @returns {string}
     * @private
     */
    _getKey(type, id) {
        let key = this._prefix ? this._prefix + ':' : '';
        key += type;
        return id ? key + ':' + id : key;
    }
}

module.exports = Redis;
