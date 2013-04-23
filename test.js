var net = require('net')
  , fs = require('fs')

var gitclient = require('git-fetch-pack')
  , transport = require('git-transport-protocol')
  , unpack = require('git-list-pack')
  , concat = require('concat-stream')
  , objectify = require('git-objectify-pack')

var tcp = net.connect({host: 'github.com', port: 9418})
  , client

function want(ref, ready) {
  return ready(/(heads)/.test(ref.name))
}

client = gitclient(
    'git://github.com/chrisdickinson/plate.git'
  , want
)

// pipe client to the transport and back to client.
client
  .pipe(transport(tcp))
  .pipe(client)

// when we get packfile data, it'll come out of this
// readable stream.
client.pack
  .pipe(unpack())
    .on('data', function(info) { console.log('-->', info.num) })

function find(hash, ready) {
  return ready()
}

