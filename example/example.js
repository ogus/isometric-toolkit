
var canvas, ctx
var tilemap;
var imgGrass, imgWater;

window.onload = function () {
  canvas = document.getElementById("canvas");
  imgGrass = document.getElementById("img-grass");
  imgWater = document.getElementById("img-water");
  initCanvas();
  initMap();
}

function initCanvas() {
  canvas.width = 1200;
  canvas.height = 800;
  ctx = canvas.getContext("2d");
  ctx.lineWidth = 1;
  ctx.strokeStyle = "#222";
  ctx.fillStyle = "rgba(255,255,255,0.5)";

  canvas.addEventListener("mousemove", onMouseMove);
  canvas.addEventListener("click", onMouseClick);
}

function initMap() {
  tilemap = new IsometricToolkit.Tilemap({
    rows: 12,
    columns: 12,
    tileSize: 40
  });
  var w = tilemap.getWidth();
  console.log(w);
  tilemap.originX = 0.5 * tilemap.getWidth();
  // tilemap.originY = 0.5 * (canvas.height - tilemap.getHeight()) + 15;
  tilemap.originY = 15;

  tilemap.fill(function (column, row) {
    return {
      column: column,
      row: row,
      value: Math.random(),
      over: false,
      selected: false,
    };
  });

  drawMap();
}

function drawMap() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  tilemap.forEach(function (tile, column, row) {
    var image = getImage(tile);
    var offset = getOffset(tile);
    tilemap.drawTileImage(ctx, image, column, row, offset);

    if (tile.selected) {
      tilemap.drawTileShape(ctx, column, row, offset);
      ctx.fill();
    }
    if (tile.hover) {
      tilemap.drawTileShape(ctx, column, row, offset);
      ctx.stroke();
    }
  });
}

function onMouseMove(e) {
  let point = getMousePosition(e);
  let tile = tilemap.getTileWithOffset(point.x, point.y, getOffset);
  setHoverTile(tile);
  drawMap();
}

function onMouseClick(e) {
  let point = getMousePosition(e);
  let tile = tilemap.getTileWithOffset(point.x, point.y, getOffset);
  setSelectedTile(tile);
  drawMap();
}

function setHoverTile(t) {
  tilemap.forEach(function (tile, column, row) {
    tile.hover = (t && row == t.row && column == t.column);
  });
}

function setSelectedTile(t) {
  tilemap.forEach(function (tile, column, row) {
    tile.selected = (t && row == t.row && column == t.column);
  });
}

function getImage(tile) { return tile.value < 0.5 ? imgGrass : imgWater; }

function getOffset(tile) { return tile.value < 0.5 ? 15 : 8; }

function getMousePosition(e){
  let rect = e.target.getBoundingClientRect();
  return {
    x: Math.round((e.clientX - rect.left)/(rect.right - rect.left) * canvas.width),
    y: Math.round((e.clientY - rect.top)/(rect.bottom - rect.top) * canvas.height)
  };
}
