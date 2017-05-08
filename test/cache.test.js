/* global describe, it, after, before, afterEach, beforeEach */
const expect = require('chai').expect;
const Logging = require('@cheevr/logging');

const Memory = require('../memory');


Logging.cache = {
    trace: () => {},
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {}
};

describe('Cache', () => {
    async function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    it('should expire an entry after a given time', async () => {
        let memory = new Memory({type: 'memory', logger:'cache', ttl: 50}, 'Test');

        await memory.store('TestType', 1, {a: 'Test'});
        let result1 = await memory.fetch('TestType', 1);
        expect(result1).to.deep.equal({a: 'Test'});

        await delay(70);
        let result2 = await memory.fetch('TestType', 1);
        expect(result2).to.be.not.ok;
    });

    it('should reset the ttl if stored or fetched again', async () => {
        let memory = new Memory({type: 'memory', logger:'cache', ttl: 50}, 'Test');

        await memory.store('TestType', 1, {a: 'Test'});
        let result1 = await memory.fetch('TestType', 1);
        expect(result1).to.deep.equal({a: 'Test'});

        await delay(30);
        await memory.store('TestType', 1, {a: 'Test'});
        let result2 = await memory.fetch('TestType', 1);
        expect(result2).to.deep.equal({a: 'Test'});

        await delay(30);
        let result3 = await memory.fetch('TestType', 1);
        expect(result3).to.deep.equal({a: 'Test'});

        await delay(70);
        let result4 = await memory.fetch('TestType', 1);
        expect(result4).to.deep.not.ok
    });
});
