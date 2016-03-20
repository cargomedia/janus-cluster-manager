janus-cluster
=============

Managing a cluster of janus instances. First Register janus instances through an HTTP endpoint, then let handlers do the necessary wiring.
Currently there's only one handler available for the [cargomedia/janus-gateway-rtpbroadcast](https://github.com/cargomedia/janus-gateway-rtpbroadcast) plugin.


Installation
------------
Install as npm package:
```
npm install janus-cluster [-g]
```

Run service using:
```
bin/janus-cluster --port <http-server-port>
```


Development
-----------
Clone project, install npm dependencies and run binary:
```
npm install
bin/janus-cluster
```


API
---

### Core

#### Register new instance
Used to register janus instances into the cluster. Each registered instance will also trigger events intercepted by handlers.
```
POST /register
```
##### Input
| Name | Type   | Description |
|------|--------|-------------|
| id   | string | instance identifier |
| data | string | json encoded string containing instance's extra data |


### Rtpbroadcast

#### Get edge server
Returns available edge server
```
GET /rtpbroadcast/edge-server
```
##### Response
```json
{
  "id": "<server-id>",
  "webSocketAddress": "<web-socket-address>",
  "httpAddress": "<http-address>"
}
```
