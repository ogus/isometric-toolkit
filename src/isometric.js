(function (root, factory) {
  if (typeof define === 'function' && define.amd) { define([], factory); }
  else if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.IsometricToolkit = factory(); }
}(this, function () {
  'use strict';

  /**
   * Base methods
   */

   function isometricToCartesian (x, y) {
     return {
       x: y + 0.5 * x,
       y: y - 0.5 * x
     };
   }

  function cartesianToIsometric (x, y) {
    return {
      x: x - y,
      y: (x + y) * 0.5
    };
  }

  function tileToCartesian (row, column, tileWidth, tileHeight) {
    return {
      x: (column - row) * (tileWidth * 0.5),
      y: (column + row) * (tileHeight * 0.5)
    };
  }

  function cartesianToTileFloat (x, y, tileWidth, tileHeight) {
    return {
      row: (y / tileHeight) - (x / tileWidth),
      column: (x / tileWidth) + (y / tileHeight)
    };
  }

  function cartesianToTile (x, y, tileWidth, tileHeight) {
    let tile = cartesianToTileFloat(x, y, tileWidth, tileHeight);
    return {
      column: Math.floor(tile.column),
      row: Math.floor(tile.row)
    };
  }

  function isometricPath (ctx, x, y, tileWidth, tileHeight) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + tileWidth*0.5, y + tileHeight*0.5);
    ctx.lineTo(x, y + tileHeight);
    ctx.lineTo(x - tileWidth*0.5, y + tileHeight*0.5);
    ctx.lineTo(x, y);
    ctx.closePath();
  }

  /**
   * Renderer class provides methods for isometric display and coordinates conversion
   */
  function Renderer (params) {
    params = params || {};
    this.tileWidth = params.tileWidth || 1;
    this.tileHeight = params.tileHeight || 1;
    this.offsetX = params.offsetX || 0;
    this.offsetY = params.offsetY || 0;
    this.params = params;
  }

  Renderer.prototype = {
    setTileSize: function (width, height) {
      this.tileWidth = parseInt(width) || this.tileWidth;
      this.tileHeight = parseInt(height) || this.tileHeight;
    },
    setOffset: function (offsetX, offsetY) {
      this.offsetX = parseInt(offsetX) || this.offsetX;
      this.offsetY = parseInt(offsetY) || this.offsetY;
    },

    screenToIsometric: function (x, y) {
      return cartesianToIsometric(x - this.offsetX, y - this.offsetY);
    },
    screenToTile: function (x, y) {
      return cartesianToTile(x - this.offsetX, y - this.offsetY, this.tileWidth, this.tileHeight);
    },

    isometricToScreen: function (x, y) {
      let point = isometricToCartesian(x, y);
      return {
        x: point.x + this.offsetX,
        y: point.y + this.offsetY
      };
    },
    isometricToTile: function (x, y) {
      let tileSize = (this.tileWidth + this.tileHeight) * 0.5;
      return {
        row: Math.floor(y / tileSize),
        column: Math.floor(x / tileSize)
      };
    },

    tileToScreen: function (row, column) {
      let point = tileToCartesian(row, column, this.tileWidth, this.tileHeight);
      return {
        x: point.x + this.offsetX,
        y: point.y + this.offsetY
      };
    },
    tileToIsometric: function (row, column) {
      let tileSize = (this.tileWidth + this.tileHeight) * 0.5;
      return {
        x: column * tileSize,
        y: row * tileSize
      };
    },

    isPointOnTile: function (x, y, row, column, offset) {
      offset = offset || 0;
      let trueX = x - this.offsetX;
      let trueY = y - this.offsetY;
      let offsetTile = cartesianToTile(trueX, trueY + offset, this.tileWidth, this.tileHeight);
      if (offsetTile.row == row && offsetTile.column == column) {
        return true;
      }
      else if(offsetTile.row >= row && offsetTile.column >= column) {
        let tileCoords = tileToCartesian(row, column, this.tileWidth, this.tileHeight);
        let dx = Math.abs(trueX - tileCoords.x);
        let dy = (trueY+offset) - tileCoords.y - offset;
        if (dx < this.tileWidth * 0.5 && dy < this.tileHeight * (1 + (dx / this.tileWidth))) {
          return true;
        }
      }
      return false;
    },

    drawTileImage: function (ctx, image, row, column, offsetHeight) {
      offsetHeight = offsetHeight || 0;
      let coords = this.tileToScreen(row, column);
      let imgX = coords.x - this.tileWidth*0.5;
      let imgY = coords.y - offsetHeight;
      let imgWidth = this.tileWidth;
      let imgHeight = this.tileHeight + offsetHeight;
      ctx.drawImage(image, imgX, imgY, imgWidth, imgHeight);
    },

    drawTileShape: function (ctx, row, column, offsetHeight) {
      offsetHeight = offsetHeight || 0;
      let coords = this.tileToScreen(row, column);
      isometricPath(ctx, coords.x, coords.y - offsetHeight, this.tileWidth, this.tileHeight);
    }
  }

  /**
  * TiledMap class contains tiles data in a 2D Array and
  * methods for isometric display and coordintes conversion
  */
  function TiledMap (params) {
    params = params || {};
    this.rows = params.rows || 0;
    this.columns = params.columns || 0;
    this.tileWidth = params.tileWidth || 64;
    this.tileHeight = params.tileHeight || 32;
    this.offsetX = params.offsetX || this.getWidth()*0.5;
    this.offsetY = params.offsetY || 0;
    this.tiles = null;
    this.params = params;
  }

  TiledMap.prototype = {
    setDimensions: function (rows, columns) {
      this.rows = parseInt(rows) || this.rows;
      this.columns = parseInt(columns) || this.columns;
    },
    setTileSize: function (width, height) {
      this.tileWidth = parseInt(width) || this.tileWidth;
      this.tileHeight = parseInt(height) || this.tileHeight;
    },
    setOffset: function (offsetX, offsetY) {
      this.offsetX = parseInt(offsetX) || this.offsetX;
      this.offsetY = parseInt(offsetY) || this.offsetY;
    },

    getWidth: function() {
      return (this.rows + this.columns) * this.tileWidth * 0.5;
    },

    getHeight: function() {
      return (this.rows + this.columns) * this.tileHeight * 0.5;
    },

    setTiles: function (tiles) {
      if (Array.isArray(tiles) && Array.isArray(tiles[0])) {
        this.setDimensions(tiles.length, tiles[0].length);
        this.tiles = tiles;
      }
    },

    fill: function (func) {
      this.tiles = new Array(this.rows);
      for (let row = 0; row < this.rows; row++) {
        this.tiles[row] = new Array(this.columns);
        for (let col = 0; col < this.columns; col++) {
          this.tiles[row][col] = func(row, col);
        }
      }
    },

    forEach: function (func) {
      for (let row = 0; row < this.rows; row++) {
        for (let col = 0; col < this.columns; col++) {
          func(row, col, this.tiles[row][col]);
        }
      }
    },

    tileToScreen: function (row, column) {
      let point = tileToCartesian(row, column, this.tileWidth, this.tileHeight);
      return {x: point.x + this.offsetX, y: point.y + this.offsetY};
    },

    screenToTile: function (x, y) {
      return cartesianToTile(x - this.offsetX, y - this.offsetY, this.tileWidth, this.tileHeight);
    },

    containsTile: function (row, column) {
      return (row >= 0 && row < this.rows && column >= 0 && column < this.columns);
    },

    getTile: function (x, y) {
      let tile = cartesianToTile(x - this.offsetX, y - this.offsetY, this.tileWidth, this.tileHeight);
      if (this.containsTile(tile.row, tile.column)) {
        return this.tiles[tile.row][tile.column];
      }
      return null;
    },

    getTileWithOffset: function (x, y, offsetFunc) {
      let clickedTile = cartesianToTile(x-this.offsetX, y-this.offsetY, this.tileWidth, this.tileHeight);
      let maxIter = Math.min(this.rows - clickedTile.row, this.columns - clickedTile.column);
      let row = 0, column = 0, result = null;
      for (let i = 0; i < maxIter; i++) {
        for (let j = -2; j <= 0; j++) {
          row = clickedTile.row + i + (j*0.5|0); // values -1, 0, 0
          column = clickedTile.column + i + (j%2); // values 0, -1, 0
          if (this.isPointOnTile(x, y, row, column, offsetFunc)) {
            result = {row: row, column: column};
          }
        }
      }
      if (result != null && this.containsTile(result.row, result.column)) {
        return this.tiles[result.row][result.column];
      }
      return null;
    },

    isPointOnTile: function (x, y, row, column, offsetFunc) {
      if (this.containsTile(row, column)) {
        let offset = offsetFunc(this.tiles[row][column]) || 0;
        let trueX = x - this.offsetX;
        let trueY = y - this.offsetY;
        let offsetTile = cartesianToTile(trueX, trueY + offset, this.tileWidth, this.tileHeight);
        if (offsetTile.row == row && offsetTile.column == column) {
          return true;
        }
        else if(offsetTile.row >= row && offsetTile.column >= column) {
          let tileCoords = tileToCartesian(row, column, this.tileWidth, this.tileHeight);
          let dx = Math.abs(trueX - tileCoords.x);
          let dy = (trueY+offset) - tileCoords.y - offset;
          if (dx < this.tileWidth * 0.5 && dy < this.tileHeight * (1 + (dx / this.tileWidth))) {
            return true;
          }
        }
      }
      return false;
    },

    drawImages: function (ctx, imageFunc, offsetFunc) {
      offsetFunc = offsetFunc || function () { return 0; }
      this.forEach(function (row, column) {
        let offsetHeight = offsetFunc(this.tiles[row][column]);
        let image = imageFunc(this.tiles[row][column]);
        this.drawTileImage(ctx, image, row, column, offsetHeight);
      }.bind(this));
    },

    drawShapes: function (ctx, styleFunc, offsetFunc) {
      offsetFunc = offsetFunc || function () { return 0; }
      this.forEach(function (row, column) {
        let offsetHeight = offsetFunc(this.tiles[row][column]);
        this.drawTileShape(ctx, row, column, offsetHeight);
        styleFunc();
      }.bind(this));
    },

    drawTileImage: function (ctx, image, row, column, offsetHeight) {
      offsetHeight = offsetHeight || 0;
      let coords = tileToCartesian(row, column, this.tileWidth, this.tileHeight);
      coords = {x: coords.x + this.offsetX, y: coords.y + this.offsetY};
      let imgX = coords.x - this.tileWidth*0.5;
      let imgY = coords.y - offsetHeight;
      let imgWidth = this.tileWidth;
      let imgHeight = this.tileHeight + offsetHeight;
      ctx.drawImage(image, imgX, imgY, imgWidth, imgHeight);
    },

    drawTileShape: function (ctx, row, column, offsetHeight) {
      offsetHeight = offsetHeight || 0;
      let coords = tileToCartesian(row, column, this.tileWidth, this.tileHeight);
      coords = {x: coords.x + this.offsetX, y: coords.y + this.offsetY - offsetHeight};
      isometricPath(ctx, coords.x, coords.y, this.tileWidth, this.tileHeight);
    }
  };


  /**
   * The Tile class is a data container with methods to display itself on a canvas
   */
  function Tile(params) {
    params = params || {};
    this.width = params.width || 0;
    this.height = params.height || 0;
    this.offsetHeight = params.offsetHeight || 0;
    this.params = params;
  }

  Tile.prototype = {
    drawImage: function (ctx, image, x, y) {
      let imgX = x - this.width*0.5;
      let imgY = y - this.offsetHeight;
      let imgWidth = this.width;
      let imgHeight = this.height  + this.offsetHeight;
      ctx.drawImage(image, imgX, imgY, imgWidth, imgHeight);
    },

    drawShape: function (ctx, x, y) {
      isometricPath(ctx, x, y-this.offsetHeight, this.width, this.height);
    }
  };

  var IsometricToolkit = {
    cartesianToIsometric: cartesianToIsometric,
    isometricToCartesian: isometricToCartesian,
    tileToCartesian: tileToCartesian,
    cartesianToTileFloat: cartesianToTileFloat,
    cartesianToTile: cartesianToTile,

    Renderer: Renderer,
    TiledMap: TiledMap,
    Tile: Tile
  };

  return IsometricToolkit;
}));
