var _ = require('underscore');
var deepExtend = require('deep-extend');

function Context(fields) {
  this.fields = _.clone(fields) || {};
}

/**
 * @param {Object} fields
 * @returns {Context}
 */
Context.prototype.extend = function(fields) {
  deepExtend(this.fields, fields);
  return this;
};

/**
 * @param {Context} context
 * @returns {Context}
 */
Context.prototype.merge = function(context) {
  return this.extend(context.fields);
};

/**
 * @returns {Object}
 */
Context.prototype.toHash = function() {
  return _.clone(this.fields);
};

/**
 * @returns {Context}
 */
Context.prototype.clone = function() {
  return new Context(this.fields);
};

module.exports = Context;
