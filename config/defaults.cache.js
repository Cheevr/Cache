module.exports = {
    defaultType: 'memory',
    memory: {
        logger: 'cache'
    },
    file: {
        logger: 'cache'
    },
    redis: {
        logger: 'cache',
        host: 'localhost',
        port: 6379,
        prefix: '',
        inMemTTL: false // whether to use redis ttl (if set) or the in-memory implementation
    }
};
