(function (root, factory) {
  if (typeof define === 'function' && define.amd) { define([], factory); }
  else if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.IsometricToolkit = factory(); }
}(this, function () {
  'use strict';

  // world -> screen
  function cartesianToIsometric(x, y) {
    return {
      x: x - y,
      y: (x + y) * 0.5
    };
  }

  // screen -> world
  function isometricToCartesian(x, y) {
    return {
      x: y + 0.5 * x,
      y: y - 0.5 * x
    };
  }

  function gridToIsometric(column, row, tileSize) {
    return {
      x: (column - row) * tileSize,
      y: (column + row) * tileSize * 0.5
    };
  }

  function isometricToGrid(x, y, tileSize) {
    return {
      column: Math.floor((y + 0.5 * x) / tileSize),
      row: Math.floor((y - 0.5 * x) / tileSize)
    };
  }

  function isometricPath(ctx, x, y, tileSize) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + tileSize, y + 0.5 * tileSize);
    ctx.lineTo(x, y + tileSize);
    ctx.lineTo(x - tileSize, y + 0.5 * tileSize);
    ctx.lineTo(x, y);
    ctx.closePath();
  }

  function setParameters(object, inputs, defaults) {
    inputs = inputs || {};
    var keys = Object.keys(defaults);
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      object[k] = inputs.hasOwnProperty(k) ? inputs[k] : defaults[k];
    }
  }


  function Renderer (params) {
    setParameters(this, params, {
      originX: 0,
      originY: 0,
      tileSize: 1
    });
  }

  Renderer.prototype = {
    screenToWorld: function (x, y) {
      return isometricToCartesian(x - this.originX, y - this.originY);
    },

    screenToTile: function (x, y) {
      return isometricToGrid(x - this.originX, y - this.originY, this.tileSize);
    },

    worldToScreen: function (x, y) {
      var p = cartesianToIsometric(x, y);
      return { x: p.x + this.originX, y: p.y + this.originY };
    },

    tileToScreen: function (column, row) {
      var p = gridToIsometric(column, row, this.tileSize);
      return { x: p.x + this.originX, y: p.y + this.originY };
    },

    isPointOnTile: function (x, y, column, row, offset) {
      offset = offset || 0;
      var isoX = x - this.originX;
      var isoY = y - this.originY;
      var tile = isometricToGrid(isoX, isoY + offset, this.tileSize);
      if (tile.column == column && tile.row == row) {
        return true;
      }
      if (tile.column >= column && tile.row >= row) {
        var tileCoords = gridToIsometric(column, row, this.tileSize);
        var dx = Math.abs(isoX - tileCoords.x);
        var dy = isoY - tileCoords.y;
        if ((dx / this.tileSize) < 1 && (dy / this.tileSize) < (1 + 0.5 * dx / this.tileSize)) {
          return true;
        }
      }
      return false;
    },

    drawTileImage: function (ctx, image, column, row, offset) {
      offset = offset || 0;
      var coords = this.tileToScreen(column, row);
      var imgX = coords.x - this.tileSize;
      var imgY = coords.y - offset;
      ctx.drawImage(image, imgX, imgY);
    },

    drawTileShape: function (ctx, column, row, offset) {
      offset = offset || 0;
      var coords = this.tileToScreen(column, row);
      isometricPath(ctx, coords.x, coords.y - offset, this.tileSize);
    }
  }


  function Tilemap (params) {
    setParameters(this, params, {
      originX: 0,
      originY: 0,
      tileSize: 1,
      rows: 0,
      columns: 0
    });

    this.tiles = new Array(this.rows);
    for (var i = 0; i < this.tiles.length; i++) {
      this.tiles[i] = new Array(this.columns);
    }
  }

  Tilemap.prototype = {
    getWidth: function() {
      return (this.rows + this.columns) * this.tileSize;
    },

    getHeight: function() {
      return (this.rows + this.columns) * this.tileSize * 0.5;
    },

    setTiles: function (tiles) {
      if (Array.isArray(tiles) && Array.isArray(tiles[0])) {
        this.tiles = tiles;
        this.rows = tiles.length;
        this.columns = tiles[0].length;
      }
    },

    fill: function (func) {
      for (var row = 0; row < this.rows; row++) {
        for (var column = 0; column < this.columns; column++) {
          this.tiles[row][column] = func(column, row);
        }
      }
    },

    forEach: function (func) {
      for (var row = 0; row < this.rows; row++) {
        for (var column = 0; column < this.columns; column++) {
          func(this.tiles[row][column], column, row);
        }
      }
    },

    tileToScreen: function (column, row) {
      var p = gridToIsometric(column, row, this.tileSize);
      return { x: p.x + this.originX, y: p.y + this.originY };
    },

    screenToTile: function (x, y) {
      return isometricToGrid(x - this.originX, y - this.originY, this.tileSize);
    },

    containsTile: function (column, row) {
      return (row >= 0 && row < this.rows && column >= 0 && column < this.columns);
    },

    getTile: function (x, y) {
      var t = this.screenToTile(x, y);
      if (this.containsTile(t.row, t.column)) {
        return this.tiles[t.row][t.column];
      }
      return undefined;
    },

    getTileWithOffset: function (x, y, getOffset) {
      var cursorTile = this.screenToTile(x, y);
      var tile = null;
      var iterations = Math.min(this.rows - cursorTile.row, this.columns - cursorTile.column);
      for (var i = 0; i < iterations; i++) {
        for (var j = -2; j <= 0; j++) {
          var row = cursorTile.row + i + (j == -2 ? -1 : 0);
          var column = cursorTile.column + i + (j == -1 ? -1 : 0);
          if (this.containsTile(column, row)) {
            var offset = getOffset(this.tiles[row][column]) || 0;
            if (this.isPointOnTile(x, y, column, row, offset)) {
              tile = { column: column, row: row };
            }
          }
        }
      }
      if (tile != null) {
        return this.tiles[tile.row][tile.column];
      }
      return undefined;
    },

    isPointOnTile: function (x, y, column, row, offset) {
      var isoX = x - this.originX;
      var isoY = y - this.originY;
      var tile = isometricToGrid(isoX, isoY + offset, this.tileSize);
      if (tile.row == row && tile.column == column) {
        return true;
      }
      if(tile.column >= column && tile.row >= row) {
        var tileCoords = gridToIsometric(column, row, this.tileSize);
        var dx = Math.abs(isoX - tileCoords.x);
        var dy = isoY - tileCoords.y;
        if ((dx / this.tileSize) < 1 && (dy / this.tileSize) < (1 + 0.5 * dx / this.tileSize)) {
          return true;
        }
      }
      return false;
    },

    drawAllTileImage: function (ctx, getImage, getOffset) {
      getOffset = getOffset || function () { return 0; }
      for (var row = 0; row < this.rows; row++) {
        for (var column = 0; column < this.columns; column++) {
          var image = getImage(this.tiles[row][column]);
          var offset = getOffset(this.tiles[row][column]);
          this.drawTileImage(ctx, image, column, row, offset);
        }
      }
    },

    drawAllTileShape: function (ctx, applyStyle, getOffset) {
      getOffset = getOffset || function () { return 0; }
      for (var row = 0; row < this.rows; row++) {
        for (var column = 0; column < this.columns; column++) {
          var offset = getOffset(this.tiles[row][column]);
          this.drawTileShape(ctx, column, row, offset);
          applyStyle();
        }
      }
    },

    drawTileImage: function (ctx, image, column, row, offset) {
      offset = offset || 0;
      var coords = gridToIsometric(column, row, this.tileSize);
      coords = { x: coords.x + this.originX, y: coords.y + this.originY };
      var imgX = coords.x - this.tileSize;
      var imgY = coords.y - offset;
      var imgWidth = this.tileSize * 2;
      var imgHeight = this.tileSize + offset;
      ctx.drawImage(image, imgX, imgY, imgWidth, imgHeight);
    },

    drawTileShape: function (ctx, column, row, offset) {
      offset = offset || 0;
      var coords = gridToIsometric(column, row, this.tileSize);
      coords = { x: coords.x + this.originX, y: coords.y + this.originY };
      isometricPath(ctx, coords.x, coords.y - offset, this.tileSize);
    }
  };


  var IsometricToolkit = {
    Renderer: Renderer,
    Tilemap: Tilemap,
    cartesianToIsometric: cartesianToIsometric,
    isometricToCartesian: isometricToCartesian,
    gridToIsometric: gridToIsometric,
    isometricToGrid: isometricToGrid
  };

  return IsometricToolkit;
}));
