Vagrant.configure('2') do |config|
  config.ssh.forward_agent = true

  #config.librarian_puppet.puppetfile_dir = 'puppet'
  #config.librarian_puppet.placeholder_filename = '.gitkeep'
  #config.librarian_puppet.resolve_options = { :force => false }

  config.landrush.enable
  config.landrush.tld = 'dev.cargomedia.ch'

  config.vm.define 'cluster', autostart: true do |config|
    config.vm.box = 'cargomedia/debian-8-amd64-plain'
    config.vm.hostname = 'janus-cluster.dev.cargomedia.ch'

    config.vm.network :forwarded_port, guest: 22, host: 22120, id: 'ssh'
    config.vm.network :private_network, ip: '10.10.30.10'

    config.vm.provision :puppet do |puppet|
      puppet.environment_path = 'puppet/environments'
      puppet.environment = 'development'
      puppet.module_path = ['puppet/modules']
      puppet.manifests_path = 'puppet/environments/development/manifests'
      puppet.hiera_config_path = "puppet/environments/development/hiera/hiera.yaml"
      puppet.working_directory = "/tmp/vagrant-puppet"
      puppet.manifest_file = 'cluster.pp'
    end
  end
end
