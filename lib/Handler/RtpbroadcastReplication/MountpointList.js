var _ = require('underscore');
var util = require('util');

function RtpbroadcastReplicationMountpointList() {
}

util.inherits(RtpbroadcastReplicationMountpointList, Array);

RtpbroadcastReplicationMountpointList.prototype.remove = function(mountpoint) {
  var index = this.indexOf(mountpoint);
  if (index === -1) {
    throw new Error('Mountpoint not found');
  }
  this.splice(index, 1);
};

RtpbroadcastReplicationMountpointList.prototype.findById = function(mountpointId) {
  return _.find(this, function(mountpoint) {
    return mountpoint.id === mountpointId;
  })
};

RtpbroadcastReplicationMountpointList.prototype.reject = function(mountpoints) {
  return _.reject(this, function(existingMountpoint) {
    return _.find(mountpoints, function(mountpoint) {
      return existingMountpoint.id === mountpoint.id;
    });
  });
};

RtpbroadcastReplicationMountpointList.prototype.missing = function(mountpoints) {
  return _.reject(mountpoints, function(mountpoint) {
    return _.find(this, function(existingMountpoint) {
      return existingMountpoint.id === mountpoint.id;
    });
  });
};

module.exports = RtpbroadcastReplicationMountpointList;
