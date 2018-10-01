var canvas, ctx, map;

window.onload = function () {
  canvas = document.getElementById("canvas");
  canvas.width = 300;
  canvas.height = 200;
  ctx = canvas.getContext("2d");

  canvas.addEventListener("mousemove", function (e) {
    map.selectTile(getMousePosition(e));
    refreshMap();
  });

  ImgManager.setMainDirectory("assets/");
  ImgManager.load([{'grass': 'grass.png'},{'water': 'water.png'}]).then(initMap);
}

function initMap() {
  map = new Isometric.Map(12,12);

  map.setTileDimensions(100, 50);
  canvas.width = map.getWidth();
  canvas.height = map.getHeight() + 40;
  map.setOffset(canvas.width*0.5, canvas.height*0.5-map.getHeight()*0.5);
  map.init(createTile);

  refreshMap();
}

function refreshMap() {
  ctx.clearRect(0,0,canvas.width, canvas.height);
  map.draw(ctx);
}

function createTile(column, row) {
  let config = {};
  if(Math.random() < 0.6) {
    config = {
      img: ImgManager.get('grass'),
      color: "#0f0",
      offset: 15
    }
  }
  else {
    config = {
      img: ImgManager.get('water'),
      color: "#00f",
      offset: 8
    }
  }
  return new Isometric.Tile(column, row, config);
}

function getMousePosition(e){
  let rect = e.target.getBoundingClientRect();
  return {
    x: Math.round((e.clientX - rect.left)/(rect.right - rect.left) * canvas.width),
    y: Math.round((e.clientY - rect.top)/(rect.bottom - rect.top) * canvas.height)
  };
}
