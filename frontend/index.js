var shoe = require('shoe')
  , fetch = require('git-fetch-pack')
  , unpack = require('git-list-pack')
  , through = require('through')
  , Buffer = require('buffer').Buffer
  , walk = require('git-walk-refs')
  , objectify = require('git-objectify-pack')
  , levelidb = require('levelidb')
  , through = require('through')
  , render = require('./render')

// make a websocket connection to the
// server.
var conn = shoe('/git')
  , refs = []
  , client
  , db

// create a leveldb database.
db = levelidb('/tmp/git', {
  encoding: 'json'
})

// automatically clone plate.
client = fetch(
    'git://github.com/maks/testsite.git'
  , want
)

// we get a callback for each ref. say `true`
// if we want the ref, `false` if we don't.
function want(ref, ready) {
  var do_want = /(HEAD|heads|pull)/.test(ref.name)
  if(do_want) {
    refs.push(ref)    
  }
  ready(do_want)
}

client
  .pipe(conn)
  .pipe(parse())
  .pipe(client)

function find(oid, ready) {
  // for finding ref-delta objects that might
  // be outside of the current packfile
  return ready(null, null)
}

// `pack` is a separate stream that
// emits binary packfile data.
client.pack
  .pipe(unpack())
    .on('data', function(d) { console.log(d.num) })
  .pipe(objectify(find))
  .pipe(through(dbify))
    .on('end', end)
  .pipe(db.writeStream())

// parse turns our serialized objects
// back into js objects.
function parse() {
  return through(function(data) {
    // turn it back into a JS object + buffer data.
    data = JSON.parse(data)
    if(data.data !== null) {
      data.data = new Buffer(data.data, 'base64')
    }
    this.queue(data)
  })
}

function dbify(obj) {
  var base = obj.serialize()
    , buf = new Buffer(obj.looseType+' '+base.length+'\0')

  this.queue({key: 'hash:'+obj.hash, value: {type: obj.type, data: base.toString('base64')}})
}

function end() {
  render(db, refs)
}
