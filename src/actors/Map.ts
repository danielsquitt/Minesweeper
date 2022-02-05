import _ from 'lodash';
import { Point, typeOfPoint } from '../types/Point';
import {Actor} from './Actor';
import Cell from './Cell';
import {
  array2dIterator,
  array2dNew,
  array2dSurroundIterator,
} from '../utils/ArrayIterators';
import { Manager } from '../state/GameManager';

export default class Map extends Actor {
  size: Point; // Size in number of tilles of map
  sizePx: Point; // Size in number of tilles of map
  sizePxCell: Point; // Size in pixels of cell
  nMines: number;
  map: Array<Array<Cell>>;

  mouse: {
    leftDown: boolean;
    rightDown: boolean;
  };

  constructor(
    position: Point = { x: 0, y: 0 },
    sizePx: Point = { x: 0, y: 0 },
    sizeN: Point = { x: 0, y: 0 },
    nMines: number = 0,
  ) {
    // Super
    super(position);
    this.size = sizeN;
    this.sizePx = sizePx;
    this.nMines = nMines;
    this.mouse = { leftDown: false, rightDown: false };

    // Map definition
    if ((sizeN.x * sizeN.y) !== 0) {
      if (nMines / (sizeN.x * sizeN.y) > 0.3) {
        throw new Error(
          `Error: Bomb density ${nMines / (sizeN.x * sizeN.y)} is bigger than ${0.3}`,
        );
      }
      const cellSize = Math.min(
        Math.floor(sizePx.x / sizeN.x),
        Math.floor(sizePx.y / sizeN.y),
        100,
      );
      this.sizePxCell = { x: cellSize, y: cellSize };

      this.map = this.generateMap();
    } else {
      this.sizePxCell = { x: 0, y: 0 };
      this.map = array2dNew<Cell>(0, 0);
    }
  }

  // Generates a map. -1 Mine, 0,...8 No mine
  generateMap(): Array<Array<Cell>> {
    // Calculate map positionx
    const py = (this.sizePx.y - this.size.y * this.sizePxCell.y) / 2 + this.position.y;
    const px = (this.sizePx.x - this.size.x * this.sizePxCell.x) / 2 + this.position.x;

    // Generate an empty map
    const map: Array<Array<Cell>> = array2dNew<Cell>(this.size.y, this.size.x);
    for (let i = 0; i < map.length; i++) {
      for (let j = 0; j < map[i].length; j++) {
        const pos: Point = { x: this.sizePxCell.x * j + px, y: this.sizePxCell.y * i + py };
        map[i][j] = new Cell(pos, this.sizePxCell, array2dSurroundIterator(map, i, j));
      }
    }

    // Set bombs
    for (let i = 0; i < this.nMines; i++) {
      while (true) {
        const y = _.random(0, this.size.y - 1);
        const x = _.random(0, this.size.x - 1);
        if (!map[y][x].bomb) {
          // setBomb(map, y_, x_)
          for (const cell of array2dSurroundIterator<Cell>(map, y, x)) {
            cell.increaseNumber();
          }
          map[y][x].setBomb();
          break;
        }
      }
    }
    console.log(map.map((e) => e.map((u) => (u.bomb ? '1' : '0'))));
    return map;
  }

  resetMap(sizeN: Point = this.size, nMines: number = this.nMines):void {
    if (nMines / (sizeN.x * sizeN.y) > 0.3) {
      throw new Error(
        `Error: Bomb density ${nMines / (sizeN.x * sizeN.y)} is bigger than ${0.3}`,
      );
    }
    this.size = sizeN;
    this.nMines = nMines;
    this.map = this.generateMap();
  }

  // Draw
  draw(delta: number, ctx: CanvasRenderingContext2D) {
    for (const cell of array2dIterator(this.map)) {
      ctx.save();
      cell.draw(delta, ctx);
      ctx.restore();
    }
  }

  checkMap():'win' | 'lose' | undefined {
    // Check win
    let win = true;
    for (const cell of array2dIterator(this.map)) {
      if (!cell.discovered && !cell.bomb) win = false;
    }
    if (win) return 'win';

    // Check lose
    for (const cell of array2dIterator(this.map)) {
      if (cell.discovered && cell.bomb) return 'lose';
    }
    return undefined;
  }

  // Mouse event
  mouseEvent(
    event: 'over' | 'Leftdown' | 'Rightdown' | 'Leftup' | 'Rightup' | 'Bothdown',
    position?: Point,
  ): void {
    // Event over
    if (Manager.end) return;

    if (event === 'over' && typeOfPoint(position)) {
      const pos = position as Point;
      for (const cell of array2dIterator(this.map)) {
        const over = pos.x >= cell.position.x
          && pos.x <= cell.position.x + cell.size.x
          && pos.y >= cell.position.y
          && pos.y <= cell.position.y + cell.size.y;
        cell.setOver(over, this.mouse.leftDown || this.mouse.rightDown);
      }
      // Event mouse left down
    } else if (event === 'Leftdown') {
      this.mouse.leftDown = true;
      for (const cell of array2dIterator(this.map)) {
        cell.setDownLeft(true);
      }
    } else if (event === 'Leftup') {
      this.mouse.leftDown = false;
      for (const cell of array2dIterator(this.map)) {
        cell.setDownLeft(false);
      }
    } else if (event === 'Rightdown') {
      this.mouse.rightDown = true;
      for (const cell of array2dIterator(this.map)) {
        cell.setDownRigth(true);
      }
    } else if (event === 'Rightup') {
      this.mouse.rightDown = false;
      for (const cell of array2dIterator(this.map)) {
        cell.setDownRigth(false);
      }
    }
  }
}
