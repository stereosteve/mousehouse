var VELOCITY = 20;
var xVelocity = 0;
var yVelocity = 0;

ScrollUp.addEventListener('mouseout', stopScroll);
ScrollDown.addEventListener('mouseout', stopScroll);
ScrollLeft.addEventListener('mouseout', stopScroll);
ScrollRight.addEventListener('mouseout', stopScroll);

ScrollRight.onmouseover = function(ev) {
  xVelocity = VELOCITY;
}
ScrollLeft.onmouseover = function() {
  xVelocity = -1 * VELOCITY;
}
ScrollUp.onmouseover = function() {
  yVelocity = -1 * VELOCITY;
}
ScrollDown.onmouseover = function() {
  yVelocity = VELOCITY;
}


function draw() {
  window.requestAnimationFrame(draw);
  window.scroll(window.scrollX + xVelocity, window.scrollY + yVelocity);
}
draw();

function stopScroll(ev) {
  xVelocity = 0;
  yVelocity = 0;
}



(function addMice() {
  for (var i = 0; i < 500; i++) {
    var img = new Image();
    img.src = 'mouse.png';
    img.style.position = 'absolute';
    img.style.left = (Math.random() * document.body.clientWidth) + 'px';
    img.style.top = (Math.random() * document.body.clientHeight) + 'px';
    img.width = (Math.random() * 400);
    document.body.appendChild(img);
  }
})()
