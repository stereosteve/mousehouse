var dropAnywhere = require('drop-anywhere')
  , file = require('file')
  , throttle = require('throttle')
  , dom = require('dom')
  , request = require('superagent')


var drop = dropAnywhere(function(err, drop){
  var img = file(drop.item.file);
  if (!img.is('image/*')) {
    console.error("Images Only, dogg");
    return
  }
  var reader = img.toDataURL(function(err, str){
    if (err) throw err;
    showImg(str);
  });
});



function showImg(str) {
  document.body.style.backgroundImage = 'url(' + str + ')';
  images.push(str);

  // get dimensions
  var img = new Image()
  img.src = str;
  img.onload = function() {
    console.log(img.height);
    console.log(img.width);
  }
}


// DEMO
var images = [];
var index = 0;
request.get('demo.json', function(resp) {
  images = resp.body;
  showNext();
});
function showNext() {
  var img = images[index];
  showImg(img)
  index += 1;
  if (index === images.length) index = 0;
}
document.body.onclick = showNext;
