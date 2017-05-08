/* global describe, it, after, before, afterEach, beforeEach */
const expect = require('chai').expect;
const Logging = require('@cheevr/logging');

const Cache = require('..');


Logging.cache = {
    trace: () => {},
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {}
};

describe('Manager', () => {
    beforeEach(() => Cache.reset());

    it('should return a memory cache instance by default', () => {
        expect(Cache.instance().type).to.equal('memory');
    });

    it('should return the named cache instance', () => {
        Cache.configure({ myfiles: { type: 'file', logger: 'cache' }});
        expect(Cache.instance('myfiles').type).to.equal('file');
    });

    it('should by default call the instance _default_', () => {
        let instance = Cache.instance({type: 'file', logger: 'cache'});
        expect(instance.name).to.equal('_default_');
        expect(instance.type).to.equal('file');
    })
});
