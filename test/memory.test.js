/* global describe, it, after, before, afterEach, beforeEach */
const expect = require('chai').expect;

const Memory = require('../memory');


describe('Memory', () => {
    it('should create a memory cache instance', () => {
        let memory = new Memory({type: 'memory'}, 'Test');
        expect(memory.type).to.equal('memory');
        expect(memory.name).to.equal('Test');
        expect(memory).to.respondTo('_store');
        expect(memory).to.respondTo('_fetch');
        expect(memory).to.respondTo('_list');
        expect(memory).to.respondTo('_map');
        expect(memory).to.respondTo('_clear');
        expect(memory).to.respondTo('_remove');
    });

    it('should store and retrieve a cache value using callbacks', done => {
        let memory = new Memory({type: 'memory'}, 'Test');
        memory.store('TestType', 1, {a: 'Test'}, () => {
            memory.fetch('TestType', 1, (err, result) => {
                expect(result).to.deep.equal({a: 'Test'});
                done();
            });
        });
    });

    it('should store and retrieve a cache value using promises', async () => {
        let memory = new Memory({type: 'memory'}, 'Test');
        await memory.store('TestType', 1, {a: 'Test'});
        let result = await memory.fetch('TestType', 1);
        expect(result).to.deep.equal({a: 'Test'});
    });

    it('should support all standard operation for caching', async () => {
        let memory = new Memory({type: 'memory'}, 'Test');
        await memory.store('TestType', 1, {a: 'Test1'});
        await memory.store('TestType', 2, {a: 'Test2'});

        let list = await memory.list('TestType');
        expect(list.length).to.equal(2);
        expect(list).to.include({a: 'Test1'});
        expect(list).to.include({a: 'Test2'});

        let removeResult = await memory.remove('TestType', 1);
        expect(removeResult).to.deep.equal({a: 'Test1'});

        let map = await memory.map('TestType');
        expect(map).to.have.any.key('2');
        expect(map['2']).to.deep.equal({a: 'Test2'});

        await memory.clear('TestType');
        expect(await memory.fetch('TestType', 1)).to.be.not.ok;
        expect(await memory.fetch('TestType', 2)).to.be.not.ok;
    });
});
