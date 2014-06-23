var cellWidth = 10;

$(function() {
    var life = new GameOfLife(50, 50);
    life.speed = 400;
    life.ctx = document.getElementById('display').getContext('2d');
    console.log(life.ctx);
    life.render();
    $("#startstop").toggle(
        function() { 
            life.start();
            $(this).text("Stop");
            $("#display").css("border-color", "red");
        },
        function() {
            life.stop();
            $(this).text("Start");
            $("#display").css("border-color", "black");
        }
    );
    
    $("#stop").click(function() {
        life.stop();
    });
    $("#random").click(function() {
        life.mat.fillRandom(20);
        life.render();
    });
    $("#display").click(function(p) {
        console.log("click at x=", p.offsetX  , "y = ", p.offsetY );
        life.toggle(new Point(Math.floor(p.offsetY / cellWidth),
                              Math.floor(p.offsetX / cellWidth)));
        life.render();
    });
    $("#reset").click(function() {
        life.mat.reset();
        life.render();
    });
    $("#grid").toggle(function() {
        life.grid = true;
        life.render();
        $("#grid").html("Hide Grid");
    }, function() {
        life.grid = false;
        life.render();
        $("#grid").html("Show Grid");
    });
});

function bind(func, object) {
    return function() {
        return func.apply(object, arguments);
    };
}

/* Point Object */
function Point(x, y) {
    this.x = x;
    this.y = y;
}
Point.prototype.add = function(p) {
    return new Point(this.x + p.x,
    this.y + p.y);
};
Point.prototype.show = function() {
    console.log("(", this.x, ",", this.y, ")");
};

/* direction strings */
var neighbors = {
    "n": new Point(0, - 1),
    "s": new Point(0, 1),
    "w": new Point(-1, 0),
    "e": new Point(1, 0),
    "nw": new Point(-1, - 1),
    "ne": new Point(1, - 1),
    "sw": new Point(-1, 1),
    "se": new Point(1, 1)
};

function Matrix(width, height) {
    this.width = width;
    this.height = height;
    this.array = new Array(height);
    for (var i = 0; i < height; i++) {
        this.array[i] = new Array(this.width);
    }
}

Matrix.prototype.reset = function() {
    for (var i = 0; i < this.height; i++) {
        for (var j = 0; j < this.width; j++) {
            this.array[i][j] = undefined;
        }
    }
};

Matrix.prototype.fillRandom = function(perc) {
    var num = perc / 100;
    for (var i = 0; i < this.height; i++) {
        for (var j = 0; j < this.width; j++) {
            if (Math.random(1) < num) {
                this.array[i][j] = 1;
            }
            else {
                this.array[i][j] = undefined;
            }
        }
    }
};

Matrix.prototype.render = function(ctx) {
    ctx.clearRect(0, 0, cellWidth * this.width, cellWidth * this.height);
    ctx.fillStyle = "rgb(200,0,0)";
    for (var i = 0; i < this.height; i++) {
        for (var j = 0; j < this.width; j++) {
            if (this.array[i][j] !== undefined) {
                var x = j * cellWidth;
                var y = i * cellWidth;
                ctx.fillRect(x, y, cellWidth, cellWidth);
            }
        }
    }
};

Matrix.prototype.drawGrid = function(ctx) {
    ctx.beginPath();
    for (var i = 0; i < this.height; i++) {
        ctx.moveTo(0, i * cellWidth);
        ctx.lineTo(this.width * cellWidth, i * cellWidth);
    }
    for (i = 0; i < this.width; i++) {
        ctx.moveTo(i * cellWidth, 0);
        ctx.lineTo(i * cellWidth, this.height * cellWidth);
    }

    ctx.stroke();
};

Matrix.prototype.toString = function() {
    var str = "";
    for (var i = 0; i < this.height; i++) {
        for (var j = 0; j < this.width; j++) {
            if (this.array[i][j] !== undefined) {
                str += "*";
            }
            else {
                str += " ";
            }
        }
        str += "\n";
    }
    return str;
};

Matrix.prototype.isInside = function(p) {
    if (p.x < 0 || p.x >= this.width || p.y < 0 || p.y >= this.height) return false;
    return true;
};

Matrix.prototype.getAt = function(p) {
    if (this.isInside(p)) return this.array[p.x][p.y];
    else return undefined;
};

Matrix.prototype.setAt = function(p, value) {
    if (this.isInside(p)) this.array[p.x][p.y] = value;
};

Matrix.prototype.getSurroundings = function(p) {
    var s = {};
    for (var key in neighbors) {
        var point = p.add(neighbors[key]);
        if (this.isInside(point)) s[key] = this.getAt(point);
        else s[key] = undefined;
    }
    return s;
};

function GameOfLife(width, height) {
    this.width = width;
    this.height = height;

    // use two matrix, so that we don't have to create
    // matrix at every step.
    this.mat1 = new Matrix(width, height);
    this.mat2 = new Matrix(width, height);
    this.mat1.reset();
    this.mat2.reset();

    this.mat = this.mat1;
    this.mat.fillRandom(20);
    this.elm = "display";
}

GameOfLife.prototype.step = function() {

    var newmat = (this.mat != this.mat1) ? this.mat1 : this.mat2;
    newmat.reset();

    for (var i = 0; i < this.height; i++) {
        for (var j = 0; j < this.width; j++) {
            var p = new Point(i, j);
            /* calculate number of active cells in surroundings */
            var sur = this.mat.getSurroundings(p);
            var count = 0;
            for (var key in sur)
            if (sur[key] !== undefined) count++;

            /* If current cell is not dead */
            if (this.mat.getAt(p) !== undefined) {
                if (count < 2 || count > 3)
                /* over crowed or undercrowded cell dies */
                newmat.setAt(p, undefined);
                else
                /* if cell has 2 or 3 neighbor it remains as it is */
                newmat.setAt(p, this.mat.getAt(p));
            }
            else if (count == 3) {
                /* dead cell becomes live if it has exactly three neighbour */
                newmat.setAt(p, 1);
            }
        }
    }
    this.mat = newmat;
    this.render('display');
};

GameOfLife.prototype.start = function() {
    if (!this.running) this.running = setInterval(bind(this.step, this), this.speed);
};

GameOfLife.prototype.stop = function() {
    if (this.running) {
        clearInterval(this.running);
        this.running = undefined;
    }
};

GameOfLife.prototype.toggle = function(p) {
    console.log(this.mat, p);
    if (this.mat.isInside(p)) {
        if (this.mat.getAt(p) === undefined)
            this.mat.setAt(p, 1);
        else
            this.mat.setAt(p, undefined );
    }
};

GameOfLife.prototype.render = function() {
    this.mat.render(this.ctx);
    if (this.grid)
        this.mat.drawGrid(this.ctx);
};
