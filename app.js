/// drop

var dropAnywhere = require('drop-anywhere')
  , file = require('file')
  , throttle = require('throttle')
  , dom = require('dom')


var drop = dropAnywhere(function(err, drop){
  var img = file(drop.item.file);
  if (!img.is('image/*')) {
    console.error("Images Only, dogg");
    return
  }
  var reader = img.toDataURL(function(err, str){
    if (err) throw err;
    console.log(str);
    document.body.style.backgroundImage = 'url(' + str + ')';
    var img = new Image()
    img.src = str;
    img.onload = function() {
      console.log(img.height);
      console.log(img.width);
    }
  });
});


window.awesome = function() {
  dom('img').addClass('awesome')
}
