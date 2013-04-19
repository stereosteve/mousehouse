/// drop

var dropAnywhere = require('drop-anywhere')
  , file = require('file')
  , throttle = require('throttle')
  , dom = require('dom')

var centerVertically = function() {
  dom('img').forEach(function(img) {
    if (img.height < window.innerHeight) {
      img.style.marginTop = (window.innerHeight / 2) - (img.height / 2) + 'px';
    }
  });
};


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
    /*
    var img = document.createElement('img');
    img.src = str;
    document.body.appendChild(img)
    setTimeout(centerVertically, 50);
    */
  });
});

window.onresize = centerVertically;

window.awesome = function() {
  dom('img').addClass('awesome')
}
