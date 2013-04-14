var $body = $('body')
var $menu = $('#menu')
var $object = $('.object')
var activeObject;

$object.draggable().resizable()
$menu.menu();

$object.on('contextmenu', function(ev) {
  if (ev.altKey || ev.ctrlKey || ev.metaKey) return true;
  activeObject = $(ev.currentTarget);
  $menu.show()
  $menu.css({
    top: ev.clientY + 'px',
    left: ev.clientX + 'px',
  });
  return false;
});

$body.click(function() {
  $menu.hide()
});

var ZMIN = 1;
var ZMAX = 100;
$('a').on('click', function(ev) {
  var tar = $(ev.target);
  var action = tar.data('action');
  var z = activeObject.css('z-index');
  activeObject.removeClass('atFront atBack');
  if (action === 'bringForward') {
    activeObject.css('z-index', z + 1);
  }
  if (action === 'bringToFront') {
    $('.atFront').css('z-index', ZMAX).removeClass('atFront');
    activeObject.css('z-index', ZMAX + 1).addClass('atFront');
  }
  if (action === 'sendBackward') {
    activeObject.css('z-index', Math.max(z - 1, ZMIN));
  }
  if (action === 'sendToBack') {
    $('.atBack').css('z-index', ZMIN).removeClass('atBack');
    activeObject.css('z-index', ZMIN - 1).addClass('atBack');
  }
});

$body.dblclick(function(ev) {
  var $obj = $("<div class='object'></div>");
  $obj.css({
    width: '100px',
    height: '100px',
    background: 'green',
    left: ev.clientX,
    top: ev.clientY,
  });
  $obj.draggable().resizable()
  $body.append($obj);
});
