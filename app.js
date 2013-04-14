
function dragstart(event) {
  var style = window.getComputedStyle(event.target, null);
  var data = (parseInt(style.getPropertyValue("left"),10) - event.clientX) + ',' + (parseInt(style.getPropertyValue("top"),10) - event.clientY);
  event.dataTransfer.setData("text/plain", data);
}

function dragend(event) {
  var el = event.target;
  var offset = event.dataTransfer.getData("text/plain").split(',');
  console.log(offset);
  el.style.left = event.x + 'px';
  el.style.top = event.y + 'px';
  event.preventDefault();
  return false;
}



function dragover(event) {
  event.preventDefault();
  return false;
}
function drop(event) {
  event.preventDefault();
  return false;
}

var mouseables = document.querySelectorAll('.mouseable')
Array.prototype.forEach.call(mouseables, makeMouseable);
function makeMouseable(mable) {
  mable.addEventListener('dragstart',dragstart);
  mable.addEventListener('dragend', dragend);
}

document.body.addEventListener('dragover',dragover,false);
document.body.addEventListener('drop',drop,false);

