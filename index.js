var changba = require('./lib/changba.js')
var jsdom = require("jsdom")
var fs = require("fs")
var ejs = require('ejs')
var jquery = fs.readFileSync("./node_modules/jquery/dist/jquery.js", "utf-8")

var uid = process.argv[2] || '242071630'
var songs = [];

jsdom.env({
    url: `http://changba.com/u/${uid}`,
    src: [jquery],
    done: function(err, window) {
        var $ = window.$
        $('.userPage-work-li a').each(function(){
            var $this = $(this)
            songs.push({
                songname: this.firstChild.nodeValue.replace(/[\n\t]/g, ''),
                enworkid: $this.attr('href')
            })
        })
        var body = $('body').html()
        var userid = /userid\s*=\s*'(\w+?)'/.exec(body)[1]

        changba.loadmore(userid, 1, function cb(pageNum, moreSongs){
            songs = songs.concat(moreSongs)
            if(moreSongs.length == 0){
                getSongsPath(songs)
            }else{
                changba.loadmore(userid, pageNum + 1, cb)
            }
        })
    }
});

function getSongsPath(songs){
    var promises = []
    songs.forEach((song, index) => {
        promises.push(getSongPath(song, index))
    })
    Promise.all(promises).then((songs) => {
        renderFile(songs);
    })
}

function getSongPath(song, index){
    return new Promise((resolve, reject) => {
        setTimeout(function(){
            changba.fetch(song.enworkid, (err, data) => {
                var src = /http:\/\/\w+\.changba\.com\/\d+\.mp3/.exec(data)
                song.src = ( src && src[0] ) ||  `http://changba.com${song.enworkid}`
                resolve(song)
            })
        }, 2000 * index)

    })
}

function renderFile(songs){
    ejs.renderFile('views/index.html',{
        title: '寒江雪唱吧作品',
        songs: songs
    },function(err,result){
        fs.writeFile('dist/index.html',result,'utf-8');
    })
}
