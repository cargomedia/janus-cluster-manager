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

/**
 * @param {RtpbroadcastReplicationMountpointList} mountpoints
 * @returns {Mountpoint[]}
 */
RtpbroadcastReplicationMountpointList.prototype.reject = function(mountpoints) {
  return _.reject(this, function(existingMountpoint) {
    return mountpoints.findById(existingMountpoint.id);
  });
};

/**
 * @param {RtpbroadcastReplicationMountpointList} mountpoints
 * @returns {Mountpoint[]}
 */
RtpbroadcastReplicationMountpointList.prototype.missing = function(mountpoints) {
  return mountpoints.reject(this);
};

module.exports = RtpbroadcastReplicationMountpointList;
