var AbstractPlugin = function() {
};

/**
 * @param {Router} router
 */
AbstractPlugin.prototype.installHttpHandlers = function(router) {
  throw new Error('Not implemented');
};

module.exports = AbstractPlugin;
