node default {
  class { 'janus_cluster::node': }

  require 'nodejs'
  $port = 8080;
  
  user { 'janus-cluster-manager':
    ensure  => present,
    system  => true,
  }
  ->
  daemon { 'janus-cluster-manager':
    binary  => '/usr/bin/node',
    args    => "/vagrant/bin/janus-cluster-manager --port ${port}",
    user    => 'janus-cluster-manager',
  }
}
