/* global describe, it, after, before, afterEach, beforeEach */
const expect = require('chai').expect;
const fs = require('fs');
const Logging = require('@cheevr/logging');
const path = require('path');

const File = require('../file');


Logging.cache = {
    trace: () => {},
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {}
};

describe('File', () => {
    it('should create a file cache instance', () => {
        let file = new File({type: 'file', logger: 'cache'}, 'Test');
        expect(file.type).to.equal('file');
        expect(file.name).to.equal('Test');
        expect(file).to.respondTo('_store');
        expect(file).to.respondTo('_fetch');
        expect(file).to.respondTo('_list');
        expect(file).to.respondTo('_map');
        expect(file).to.respondTo('_clear');
        expect(file).to.respondTo('_remove');
    });

    it('should store and retrieve a cache value using callbacks', done => {
        let file = new File({type: 'file', logger: 'cache'}, 'Test');
        file.store('TestType', 1, {a: 'Test'}, () => {
            file.fetch('TestType', 1, (err, result) => {
                expect(result).to.deep.equal({a: 'Test'});
                done();
            });
        });
    });

    it('should store and retrieve a cache value using promises', async () => {
        let file = new File({type: 'file', logger: 'cache'}, 'Test');
        await file.store('TestType', 1, {a: 'Test'});
        let result = await file.fetch('TestType', 1);
        expect(result).to.deep.equal({a: 'Test'});
    });

    it('should support all standard operation for caching', async () => {
        let file = new File({type: 'file', logger: 'cache'}, 'Test');
        await file.store('TestType', 1, {a: 'Test1'});
        await file.store('TestType', 2, {a: 'Test2'});

        let list = await file.list('TestType');
        expect(list.length).to.equal(2);
        expect(list).to.include({a: 'Test1'});
        expect(list).to.include({a: 'Test2'});

        let removeResult = await file.remove('TestType', 1);
        expect(removeResult).to.deep.equal({a: 'Test1'});

        let map = await file.map('TestType');
        expect(map).to.have.any.key('2');
        expect(map['2']).to.deep.equal({a: 'Test2'});

        await file.clear('TestType');
        expect(await file.fetch('TestType', 1)).to.be.not.ok;
        expect(await file.fetch('TestType', 2)).to.be.not.ok;
        expect(fs.existsSync(path.join(file.path, 'TestType'))).to.be.not.ok;
    });
});
