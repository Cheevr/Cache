/* global describe, it, after, before, afterEach, beforeEach */
const expect = require('chai').expect;

const Cache = require('..');


process.on('unhandledRejection', console.error)

describe('Manager', () => {
    beforeEach(() => Cache.reset());

    it('should return a memory cache instance by default', () => {
        expect(Cache.instance().type).to.equal('memory');
    });

    it('should return the named cache instance', () => {
        Cache.configure({ myfiles: { type: 'file' }});
        expect(Cache.instance('myfiles').type).to.equal('file');
    });

    it('should by default call the instance _default_', () => {
        let instance = Cache.instance({type: 'file'});
        expect(instance.name).to.equal('_default_');
        expect(instance.type).to.equal('file');
    })
});
