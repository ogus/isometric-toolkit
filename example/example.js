var canvas, ctx, map;
var imgGrass, imgWater;
var Toolkit = IsometricToolkit;

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
  map = new Toolkit.TiledMap({
    rows: 12,
    columns: 12,
    tileWidth: 100,
    tileHeight: 50
  });
  map.offsetY = 15 + (canvas.height - map.getHeight()) * 0.5;

  map.fill(function (row, column) {
    return {row: row, column: column, value: Math.random()};
  });

  drawMap();
}

function onMouseMove(e) {
  let point = getMousePosition(e);
  let tile = map.getTileWithOffset(point.x, point.y, getOffset);
  setHoverTile(tile);
  drawMap();
}

function onMouseClick(e) {
  let point = getMousePosition(e);
  let tile = map.getTileWithOffset(point.x, point.y, getOffset);
  setSelectedTile(tile);
  drawMap();
}

function setHoverTile(inputTile) {
  map.forEach(function (row, column, tile) {
    tile.hover = (inputTile && row == inputTile.row && column == inputTile.column);
  });
}

function setSelectedTile(inputTile) {
  map.forEach(function (row, column, tile) {
    tile.selected = (inputTile && row == inputTile.row && column == inputTile.column);
  });
}

function drawMap() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  let image = null, offset = 0;
  map.forEach(function (row, column, tile) {
    image = getImage(tile);
    offset = getOffset(tile);
    map.drawTileImage(ctx, image, row, column, offset);

    if (tile.selected == true) {
      map.drawTileShape(ctx, row, column, offset);
      ctx.fill();
    }
    if (tile.hover == true) {
      map.drawTileShape(ctx, row, column, offset);
      ctx.stroke();
    }
  });
}

function getImage(tile) { return tile.value > 0.5 ? imgGrass : imgWater; }

function getOffset(tile) { return tile.value > 0.5 ? 15 : 8; }

function getMousePosition(e){
  let rect = e.target.getBoundingClientRect();
  return {
    x: Math.round((e.clientX - rect.left)/(rect.right - rect.left) * canvas.width),
    y: Math.round((e.clientY - rect.top)/(rect.bottom - rect.top) * canvas.height)
  };
}
