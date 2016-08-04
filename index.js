var changba = require('./lib/changba.js')
var ls = require('./lib/localstorage.js')
var jsdom = require("jsdom")
var fs = require("fs")
var ejs = require('ejs')
var jquery = fs.readFileSync("./node_modules/jquery/dist/jquery.js", "utf-8")

var uid = process.argv[2] || '242071630'
var localStorageFile = 'localStorage.json'
var localStorage = ls.loadStorage(localStorageFile)
var songs = []

jsdom.env({
    url: `http://changba.com/u/${uid}`,
    src: [jquery],
    done: function(err, window) {
        var $ = window.$
        $('.userPage-work-li a').each(function() {
            var $this = $(this)
            songs.push({
                songname: this.firstChild.nodeValue.replace(/[\n\t]/g, ''),
                enworkid: $this.attr('href')
            })
        })
        var body = $('body').html()
        var userid = /userid\s*=\s*'(\w+?)'/.exec(body)[1]

        changba.loadmore(userid, 1, function cb(pageNum, moreSongs) {
            songs = songs.concat(moreSongs)
            if (moreSongs.length == 0) {
                getSongsPath(songs)
            } else {
                changba.loadmore(userid, pageNum + 1, cb)
            }
        })
    }
})

function getSongsPath(songs) {
    var promises = []
    songs.forEach((song, index) => {
        var cache = ls.get(localStorage, 'enworkid', song.enworkid)
        song = cache || song
        promises.push(getSongPath(song, index))
    })
    Promise.all(promises).then((songs) => {
        renderFile(songs)
        ls.saveStorage(localStorageFile, songs)
        console.log(`\n共计${songs.length}首`)
    })
}

function getSongPath(song, index) {
    if (song.type) {
        return new Promise((resolve, reject) => {
            resolve(song)
            console.log(`${song.songname} done`)
        })
    } else {
        return new Promise((resolve, reject) => {
            setTimeout(function() {
                changba.fetch(song.enworkid, (err, data) => {
                    var src = /http:\/\/\w+\.changba\.com\/.*?\w+\.mp3/.exec(data)
                    if (src) {
                        song.src = src[0]
                        song.type = 'MP3'
                    } else {
                        song.src = `http://changba.com${song.enworkid}`
                        song.type = 'MV'
                    }
                    resolve(song)
                    console.log(`${song.songname} done`)
                })
            }, 2000 * index)

        })
    }
}

function renderFile(songs) {
    ejs.renderFile('views/index.html', {
        title: '聆听笛箫 - 寒江雪🎵',
        songs: songs,
        version: Math.random().toString(16).slice(-6)
    }, function(err, result) {
        fs.writeFile('s/index.html', result, 'utf-8')
    })
}
