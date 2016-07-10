var AbstractPlugin = function() {
  
  /** @type {Cluster|null} */
  this.cluster = null;
};

/**
 * @param {Cluster} cluster
 */
AbstractPlugin.prototype.setCluster = function(cluster) {
  this.cluster = cluster;
};

/**
 * @param {Router} router
 */
AbstractPlugin.prototype.installHttpHandlers = function(router) {
  throw new Error('Not implemented');
};
