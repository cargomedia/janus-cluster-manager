var _ = require('underscore');
var util = require('util');

function RtpbroadcastReplicationMountpointList() {
}

util.inherits(RtpbroadcastReplicationMountpointList, Array);

/**
 * @param {RtpbroadcastReplicationMountpoint} mountpoint
 */
RtpbroadcastReplicationMountpointList.prototype.removeMember = function(mountpoint) {
  var index = this.indexOf(mountpoint);
  if (index === -1) {
    throw new Error('Mountpoint not found');
  }
  this.splice(index, 1);
};

/**
 * @param {String} mountpointId
 */
RtpbroadcastReplicationMountpointList.prototype.findById = function(mountpointId) {
  return _.find(this, function(mountpoint) {
    return mountpoint.id === mountpointId;
  })
};

/**
 * @param {RtpbroadcastReplicationMountpoint[]} mountpoints
 * @returns {RtpbroadcastReplicationMountpoint[]}
 */
RtpbroadcastReplicationMountpointList.prototype.reject = function(mountpoints) {
  return _.reject(this, function(existingMountpoint) {
    return _.find(mountpoints, function(mountpoint) {
      return existingMountpoint.id === mountpoint.id;
    });
  });
};

/**
 * @param {RtpbroadcastReplicationMountpoint[]} mountpoints
 * @returns {RtpbroadcastReplicationMountpoint[]}
 */
RtpbroadcastReplicationMountpointList.prototype.missing = function(mountpoints) {
  return _.reject(mountpoints, function(mountpoint) {
    return _.find(this, function(existingMountpoint) {
      return existingMountpoint.id === mountpoint.id;
    });
  });
};

RtpbroadcastReplicationMountpointList.prototype.toJSON = function() {
  return _.map(this, function(mountPoint) {
    return mountPoint.toJSON();
  });
};

module.exports = RtpbroadcastReplicationMountpointList;
