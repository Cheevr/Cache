/* global describe, it, after, before, afterEach, beforeEach */
try{ require('redis'); } catch(e) { return; }
const expect = require('chai').expect;
const fs = require('fs');
const Logging = require('cheevr-logging');
const path = require('path');

const Redis = require('../redis');


Logging.cache = {
    trace: () => {},
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {}
};

describe('Redis', () => {
    it('should create a redis cache instance', () => {
        let redis = new Redis({type: 'redis', logger: 'cache'}, 'Test');
        expect(redis.type).to.equal('redis');
        expect(redis.name).to.equal('Test');
        expect(redis).to.respondTo('_store');
        expect(redis).to.respondTo('_fetch');
        expect(redis).to.respondTo('_list');
        expect(redis).to.respondTo('_map');
        expect(redis).to.respondTo('_clear');
        expect(redis).to.respondTo('_remove');
    });

    it('should store and retrieve a cache value using callbacks', done => {
        let redis = new Redis({type: 'redis', logger: 'cache'}, 'Test');
        redis.store('TestType', 1, {a: 'Test'}, () => {
            redis.fetch('TestType', 1, (err, result) => {
                expect(result).to.deep.equal({a: 'Test'});
                redis.clear('TestType');
                done();
            });
        });
    });

    it('should store and retrieve a cache value using promises', async () => {
        let redis = new Redis({type: 'redis', logger: 'cache'}, 'Test');
        await redis.store('TestType', 1, {a: 'Test'});
        let result = await redis.fetch('TestType', 1);
        expect(result).to.deep.equal({a: 'Test'});
        await redis.clear('TestType');
    });

    it('should support all standard operation for caching without ttl', async () => {
        let redis = new Redis({type: 'redis', logger: 'cache'}, 'Test');
        await redis.store('TestType', 1, {a: 'Test1'});
        await redis.store('TestType', 2, {a: 'Test2'});

        let list = await redis.list('TestType');
        expect(list.length).to.equal(2);
        expect(list).to.include({a: 'Test1'});
        expect(list).to.include({a: 'Test2'});

        let removeResult = await redis.remove('TestType', 1);
        expect(removeResult).to.deep.equal({a: 'Test1'});
        let map = await redis.map('TestType');
        expect(map).to.have.any.key('2');
        expect(map['2']).to.deep.equal({a: 'Test2'});

        await redis.clear('TestType');
        expect(await redis.fetch('TestType', 1)).to.be.not.ok;
        expect(await redis.fetch('TestType', 2)).to.be.not.ok;
    });

    it('should support all standard operation for caching with a ttl', async () => {
        let redis = new Redis({type: 'redis', logger: 'cache', ttl: 10000 }, 'Test');
        await redis.store('TestType', 1, {a: 'Test1'});
        await redis.store('TestType', 2, {a: 'Test2'});

        let list = await redis.list('TestType');
        expect(list.length).to.equal(2);
        expect(list).to.include({a: 'Test1'});
        expect(list).to.include({a: 'Test2'});

        let removeResult = await redis.remove('TestType', 1);
        expect(removeResult).to.deep.equal({a: 'Test1'});
        let map = await redis.map('TestType');
        expect(map).to.have.any.key('2');
        expect(map['2']).to.deep.equal({a: 'Test2'});

        await redis.clear('TestType');
        expect(await redis.fetch('TestType', 1)).to.be.not.ok;
        expect(await redis.fetch('TestType', 2)).to.be.not.ok;
    });
});
