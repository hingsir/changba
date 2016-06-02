var http = require('http');

module.exports = {
    fetch: function(path, callback){
        var options = {
          hostname: 'changba.com',
          port: 80,
          path: path,
          method: 'GET'
        };

        var req = http.request(options, (res) => {
          console.log(`STATUS: ${res.statusCode}`);
          console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
          res.setEncoding('utf8');
          var content = '';
          res.on('data', (chunk) => {
            content += chunk;
          });
          res.on('end', () => {
            callback(null, content);
          })
        });

        req.on('error', (e) => {
          callback(e);
        });

        req.end();
    },
    loadmore: function(userid, pageNum, callback){
        this.fetch(`/member/personcenter/loadmore.php?ver=1&pageNum=${pageNum}&type=0&userid=${userid}`,
            (err, data) => {
                var songs = []
                JSON.parse(data).forEach((song) => {
                    songs.push({
                        songname: song.songname,
                        enworkid: '/s/' + song.enworkid
                    })
                })
                callback(pageNum, songs);
            }
        );
    }
}
