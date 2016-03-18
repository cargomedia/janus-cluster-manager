janus-cluster
========

## About
janus-cluster purpose is to manage cluster of janus instances. It's enough to register janus instances and handlers will do all the necessary wiring. Currently we support only **Rtpbroadcast** handler.

## Installation
Install as npm package:
```
npm install janus-cluster [-g]
```

## Running
Run service using:
```
bin/janus-cluster --port <http-server-port>
```

## Running locally / development
Clone project, install npm dependencies and run binary
```
npm install
bin/janus-cluster
```


## Api

### Core

#### Register new instance
Use to register janus instances into the cluster. Each registered instance will also trigger events intercepted by handlers.
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
