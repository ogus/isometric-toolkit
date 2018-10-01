(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
      define([], factory);
  } else if (typeof module === 'object' && module.exports) {
      module.exports = factory();
  } else {
      root.Isometric = factory();
  }
}(this, function () {
  "use strict";


  var tile_width = 64,
      tile_height = 32,
      offset_x = 0,
      offset_y = 0,
      columns = 0,
      rows = 0,
      grid = null;

  /**
   * The Map object is a simple 2D Array container with additionnal methods
   * to display it in isometric view and handle isometric/cartesian conversion
   *
   * @constructor
   * @param columns Number of columns of the map
   * @param rows Number of rows of the map
   */
  function Map(columns, rows) {
    this.setDimensions(columns, rows);
    this.setOffset(this.getWidth()*0.5, 0);
  }

  Map.prototype = {
    /**
     * Initialize all value of the grid map
     * @param func Function used to initialize each value
     */
    init: function (func) {
      if(typeof(func) !== "function") {
        func = function (column, row) { return new Tile(column, row); }
      }

      grid = new Array(rows);
      for (let r = 0; r < rows; r++) {
        grid[r] = new Array(columns);
        for (let c = 0; c < columns; c++) {
          grid[r][c] = func(c, r);
        }
      }
    },

    /**
     * Set the number of rows and columns of the grid map
     * @param inColumns Number of columns
     * @param inRows Number of rows
     */
    setDimensions: function (inColumns, inRows) {
      columns = parseInt(inColumns) || columns;
      rows = parseInt(inRows) || rows;
    },

    /**
     * Set the tiles dimensions
     * @param width Wdth of each tile
     * @param height Height of each tile
     * @param {string} type Coordinate system of the dimensions, 'cartesion' or 'isometric'
     */
    setTileDimensions: function (width, height, type) {
      let w = parseInt(width), h = parseInt(height);
      if(!isNaN(w) && !isNaN(h)) {
        if(type === "cartesian") {
          tile_width = w*2;
          tile_height = h;
        }
        else {
          tile_width = w;
          tile_height = h;
        }
      }
    },

    /**
     * Set the offset used to draw the map
     * @param off_x X offset
     * @param off_y Y offset
     */
    setOffset(off_x, off_y) {
      let dx = parseInt(off_x);
      if(!isNaN(dx)) {
        offset_x = dx;
      }
      let dy = parseInt(off_y);
      if(!isNaN(dy)) {
        offset_y = dy;
      }
    },

    getWidth: function() {
      return columns * tile_width;
    },

    getHeight: function() {
      return rows * tile_height;
    },

    /**
     * Query the tile at sceen coordinates (x, y)
     * @param x
     * @param y
     * @return {Object} Element stored in the map at (x, y)
     */
    getTile: function(x, y) {
      let p = point(x, y);
      let tile = screenToGrid(p.x, p.y);
      tile = checkTilesBelow(tile, p, 3);

      if(tile.row >= 0 && tile.row < rows && tile.column >= 0 && tile.column < columns) {
        return grid[tile.row][tile.column];
      }
      return null;
    },

    /**
     * Set the tile at screen coordinates (x, y) as selected
     * @param x
     * @param y
     */
    selectTile: function(x, y) {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
          grid[r][c].selected = false;
        }
      }

      let tile = this.getTile(x, y);
      if(tile != null && tile.row >= 0 && tile.row < rows && tile.column >= 0 && tile.column < columns) {
        grid[tile.row][tile.column].selected = true;
      }
    },

    draw: function(ctx) {
      let coord = null;
      let x = 0, y = 0;
      for (let i = 0; i < columns; i++) {
        for (let j = 0; j < rows; j++) {
          coord = gridToScreen(i, j);
          grid[j][i].draw(ctx, coord.x, coord.y, tile_width, tile_height);
        }
      }
    }
  };

  /**
   * Tile class with isometric drawing methods
   * This is an example of a simple data container for the isometric map.
   *
   * @constructor
   * @param column Column of this tile
   * @param row Row of this tile
   * @param {Object} config Specific configuration input
   */
  function Tile(column, row, config) {
    this.column = Math.floor(parseInt(column)) || 0;
    this.row = Math.floor(parseInt(row)) || 0;

    let c = config || {};
    this.color = c.color || "#000";
    this.img = c.img || null;
    this.offset = c.offset || 0;
    this.selected = false;
  }

  Tile.prototype = {
    draw: function(ctx, x, y, width, height) {
      let y_off = y - this.offset;
      if(this.img != null) {
        ctx.drawImage(this.img, x-width*0.5, y_off, width, height+this.offset);
      }
      else{
        this.drawColor(ctx, x, y_off, width, height);
      }

      if(this.selected) {
        this.drawSelected(ctx, x, y_off , width, height);
      }
    },

    drawColor: function(ctx, x, y, width, height) {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.moveTo(x, y); // top
      ctx.lineTo(x + width*0.5, y + height*0.5);  // right
      ctx.lineTo(x, y + height);  // bottom
      ctx.lineTo(x - width*0.5, y + height*0.5);  // left
      ctx.lineTo(x, y);
      ctx.fill();
    },

    drawSelected: function(ctx, x, y, width, height) {
      ctx.strokeStyle = "#333";
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y); // top
      ctx.lineTo(x + width*0.5, y + height*0.5);  // right
      ctx.lineTo(x, y + height);  // bottom
      ctx.lineTo(x - width*0.5, y + height*0.5);  // left
      ctx.lineTo(x, y);
      ctx.fill();
      ctx.stroke();
    }
  }


  /**
   * Methods to simulate view depth
   * Check *n* tile below the current tile that there is no overlap with another tile
   * at the coodinates of the input point
   * @param tile Element of the map
   * @param point Object with (x, y) screen coordinates
   * @param n Number of tile to check
   */
  function checkTilesBelow(tile, point, n) {
    let newpoint = null, new_tile = null;
    let offset = 0;

    let col = tile.column, row = tile.row;
    for (let i = 1; i <= n; i++) {
      // bottom left tile
      if ((tile.column+i-1) >= 0 && (tile.column+i-1) < columns && (tile.row+i) >= 0 && (tile.row+i) < rows) {
        offset = grid[tile.row + i][tile.column + i-1].offset;
        new_tile = screenToGrid(point.x, point.y + offset);
        if(new_tile.column >= (tile.column + i-1) && new_tile.row >= (tile.row + i)) {
          col = tile.column + i-1;
          row = tile.row + i;
        }
      }
      // bottom right tile
      if ((tile.column+i) >= 0 && (tile.column+i) < columns && (tile.row+i-1) >= 0 && (tile.row+i-1) < rows) {
        offset = grid[tile.row + i-1][tile.column + i].offset;
        new_tile = screenToGrid(point.x, point.y + offset);
        if(new_tile.column >= (tile.column + i) && new_tile.row >= (tile.row + i-1)) {
          col = tile.column + i;
          row = tile.row + i-1;
        }
      }
      // bottom tile
      if ((tile.column+i) >= 0 && (tile.column+i) < columns && (tile.row+i)  >= 0 && (tile.row+i) < rows) {
        offset = grid[tile.row + i][tile.column + i].offset;
        new_tile = screenToGrid(point.x, point.y + offset);
        if(new_tile.column >= (tile.column + i) && new_tile.row >= (tile.row + i)) {
          col = tile.column + i;
          row = tile.row + i;
        }
      }
    }

    return {column: col, row: row};
  }


  /**
   * Helper methods
   */

  function gridToScreen(column, row) {
    let w = tile_width, h = tile_height;
    return {
      x: column*w*0.5 - row*w*0.5 + offset_x,
      y: column*h*0.5 + row*h*0.5 + offset_y
    };
  }

  function screenToGrid(x, y) {
    let w = tile_width*0.5, h = tile_height*0.5;
    let d = 1 / (2*w*h);
    return {
      column: Math.floor(d * (x*h + y*w - (offset_x*h + offset_y*w))),
      row: Math.floor(d * (y*w - x*h + (offset_x*h - offset_y*w)))
    };
  }

  function point(a, b) {
    if(!!b) return {x: a, y: b};
    return {x: a.x, y: a.y};
  }


    var Isometric = {
      Map: Map,
      Tile: Tile
    };


  return Isometric;
}));
