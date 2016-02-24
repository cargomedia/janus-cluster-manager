var _ = require('underscore');

function Mountpoint(id, pluginId) {
  this.id = id;
  this.pluginId = pluginId;
}

module.exports = Mountpoint;
