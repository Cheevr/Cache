# Cheevr-Cache
[![npm version](https://badge.fury.io/js/%40cheevr%2Fcache.svg)](https://badge.fury.io/js/%40cheevr%2Fcache)
[![Build Status](https://travis-ci.org/Cheevr/Cache.svg?branch=master)](https://travis-ci.org/Cheevr/Cache)
[![Coverage Status](https://coveralls.io/repos/Cheevr/Cache/badge.svg?branch=master&service=github)](https://coveralls.io/github/Cheevr/Cache?branch=master)
[![Dependency Status](https://david-dm.org/Cheevr/Cache.svg)](https://david-dm.org/Cheevr/Cache)

# About

This module offers an abstraction over common caching implementations via a simple CRUD interface, assuming
that all cache implementations operated as a basic key value store with type segmentation.

# Installation

```Bash
npm i @cheevr/cache
```

# Example

Configuration for the caching system is done using the [@cheevr/config](https://github.com/cheevr/config)
module (check the documentation for that module to see how to create configurations for different tiers and
environments).

To get started create a file under **config/default.json** with the following content:

```JavaScript
{
    "cache": {
        "myCache": {
            "type": "memory"  // default type that could be omitted
        }
    }
}
```

Now you can access the cache anywhere like this:

```JavaScript
const Cache = require('@cheevr/cache');
const myCache = Cache.instance('myCache');

async function test() {
    await myCache.store('aType', 'aKey', 'aValue');
    await myCache.fetch('aType', 'aKey');              // returns 'aValue'
}
```

Since all cache operations are asynchronous each operation on the cache will return a promise object. Using
the new async/await syntax it's pretty easy to interact with the library.


# Configuration

There are multiple implementations available with their individual configurations, with some options being global:

### cache.<name>.ttl {number}

Each caching instance supports automatic expulsion after a given amount of time (in ms). Setting this value to
anything non-zero will enable this feature. Note that if you're using the file implementation that a service
that crashes might not evict all data.

### cache.<name>.logger {string = "cache"}

Sets the logger instance to be used by the caching system. Check the documentation for
[@cheevr/logging](https://github.com/cheevr/logging) for more details on how to configure the logging system.

### cache.<name>.type {string}

This is where you specify the type of cache implementation you want to use (**memory**, **file** or **redis**).

## Memory

This will create an in memory cache tree for all your storage needs. This should be the fastest implementation
possible, but doesn't allow for cross instance communication or persistence. This should probably only be used
during development.

## File

This will store all data on the file system in a directory structure. This implementation is probably the
slowest option and doesn't support cross instance communication (unless they share the file system where
the data is stored), but it does persist data. You can use this for as a simple file storage system.

### cache.<name>.path {string = "cache"}

This option let's you set the path under which your data will be stored. Relative paths will be relative to the
project root, but absolute paths are also supported. By default the data is stored in **cache** directory.

## Redis

This is probably the implementation you want to use in production. Redis allows multiple instance to share data
and can persist it if you wish. It also supports a built-in automatic data expulsion system with it's own ttl
system.

### cache.<name>.host {string = "localhost"}

The host on which your redis instance is running.

### cache.<name>.port {number = 6379}

The port on which your redis instance is running.

### cache.<name>.prefix {string}

An optional hardcoded prefix that will be prepended to all ids in the format **<prefix>:<id>**.

### cache.<name>.inMemTTL {boolean = false}

Whether to use the modules in memory ttl system (if set to true) or to rely on redis' own ttl system (default).


# API

The api for each caching instance is the same, which is why there's a limitation as to which operations
can be performed. Data is stored using keys nested under types to allow multiple systems to interact with
each other. These could map to individual service instances and therefor don't allow for listing of
types.

## Cache.instance({string} name = '\_default\_', {CacheConfig} \[config\])

Returns an instance of the given name. If no name is given the default instance is returned, which as in
memory cache. Optionally you can pass in a configuration that will override any previous configuration.

## Cache.configure({Object<string, CacheConfig>} config, {Object<string, CacheConfig>} defaults)

This method allows you to set a configuration programmatically. The first parameter is a map of named
instances to configurations. The second parameter is a map of types (**memory**, **file**, **redis**)
that will set defaults for these types.

## <instance>.name {string}

Getter that returns the name for this instance.

## <instance>.type {string}

Getter that returns the type for this instance (e.g. "memory", "redis" or "file")

## <instance>.store({string} type, {string|number} id, {*} payload, {function} \[callback\])

Allows you to store a value with a type/key combination. Preferred are string types for these values, but
the module will try to convert any input to string values. If no callback is passed in the method will
return a promise.

## <instance>.fetch({string} type, {string|number} id, {function} \[callback\])

Allows you to retrieve a value with a type/key combination. Preferred are string types for these values, but
the module will try to convert any input to string values. If no callback is passed in the method will
return a promise.

## <instance>.remove({string} type, {string|number} id, {function} \[callback\])

Allows you to remove a value with a type/key combination. Preferred are string types for these values, but
the module will try to convert any input to string values. If no callback is passed in the method will
return a promise.

## <instance>.clear({string} type, {function} \[callback\])

Allows you to clear all values of a given type. Preferred are string types for these values, but
the module will try to convert any input to string values. If no callback is passed in the method will
return a promise.

## <instance>.map({string} type, {function} \[callback\])

Returns a map of all keys and their mapped values for a given type. Preferred are string types for these
values, but the module will try to convert any input to string values. If no callback is passed in the
method will return a promise.

Take care that this operation could be very resource intensive if you have a lot of data stored under a
specific type.

## <instance>.list({string} type, {function} \[callback\])

Returns a list of all values for a given type. Preferred are string types for these values, but the module
will try to convert any input to string values. If no callback is passed in the method will return a promise.

Take care that this operation could be very resource intensive if you have a lot of data stored under a
specific type.


# Future features for consideration

* Add implementations for other caching systems such as Memcache or Tokyo Tyrant
