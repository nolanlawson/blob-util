'use strict';

var Promise = typeof global.Promise === 'function' ? global.Promise : require('lie');

exports.Promise = Promise;
