const OPACITY = { DIM: 0.5, LIT: 1, DEAD: 0.2 }
const HIGHLIGHT = { HOVER: '#77CC77', SELECT: '#33AA33', NONE: 'transparent' }
let shades = ['rgb(240, 217, 181)', 'rgb(181, 136, 99)']

class Board {
  constructor(height, width, stateRef = [undefined], left = 0, top = 0) {
    this.parent = parent
    this.div = document.createElement('div')
    width = height = Math.min(width, height)
    this.div.style.height = height
    this.div.style.width = width
    this.div.style.position = 'absolute'
    this.div.style.left = left
    this.div.style.top  = top
    this.quadrants = [document.createElement('div'), document.createElement('div'), document.createElement('div'), document.createElement('div')]
    this.squares = []
    this.pieces = []
    for (let i = 0; i < 4; ++i) {
      this.quadrants[i].style.left = width/2 * (i%2)
      this.quadrants[i].style.top  = height/2 * Math.floor(i/2)
      this.quadrants[i].style.position = 'absolute'
      this.div.appendChild(this.quadrants[i])
      for (let rank = 0; rank < 8; ++rank) {
        for (let file = 0; file < 8; ++file) {
          let d = document.createElement('div')
          d.style.width = width/16
          d.style.height = height/16
          d.style.position = 'absolute'
          d.style.left = left + file*width/16
          d.style.top  = (7-rank)*height/16
          d.style.backgroundColor = shades[(file*9+(7-rank))%2]
          d.board = this
          // handle clicks on 0th quadrant only
          if (i === 0) {
            d.onclick = function() {
              if (d.board.selected !== undefined) {
                d.board.selected.style.left = d.style.left
                d.board.selected.style.top  = d.style.top
                for (let k = 1; k < 4; ++k) {
                  d.board.pieces[d.board.selected.i + 32*k].style.left = d.style.left
                  d.board.pieces[d.board.selected.i + 32*k].style.top  = d.style.top
                }
                d.board.selected.selected = undefined
                d.board.selected = undefined
              }
            }
          }
          this.squares.push(d)
          this.quadrants[i].appendChild(d)
        }
      }
     
      // populate pieces
      if (stateRef[0] !== undefined) { // if loading from saved state,
        let types = [
          'wr', 'wn', 'wb', 'wq', 'wk', 'wb', 'wn', 'wr',
          'wp', 'wp', 'wp', 'wp', 'wp', 'wp', 'wp', 'wp',
          'bp', 'bp', 'bp', 'bp', 'bp', 'bp', 'bp', 'bp',
          'br', 'bn', 'bb', 'bq', 'bk', 'bb', 'bn', 'br'
        ]
        for (let j = 0; j < 32; ++j) {
          if (8 <= j && j < 24) { // if pawn, extract promotion status
            types[j] = types[i][0] + stateRef[0][0]
            stateRef[0] = stateRef[0].substring(1)
          }
          let sq = stateRef[0].charCodeAt(0) - 33
          stateRef[0] = stateRef[0].substring(1)
          this.setupPiece(i, j, types[i], l, w, width, height, Math.floor(sq/8), sq%8, stateRef)
        }
      } else {
        let ranks = [
          ['wr', 'ee', 'wb', 'ee', 'ee', 'wb', 'ee', 'wr'],
          ['wp', 'wp', 'ee', 'ee', 'ee', 'ee', 'wp', 'wp'],
          ['wn', 'ee', 'wp', 'wq', 'wk', 'wp', 'ee', 'wn'],
          ['ee', 'ee', 'ee', 'wp', 'wp', 'ee', 'ee', 'ee'],
          ['ee', 'ee', 'ee', 'bp', 'bp', 'ee', 'ee', 'ee'],
          ['bn', 'ee', 'bp', 'bq', 'bk', 'bp', 'ee', 'bn'],
          ['bp', 'bp', 'ee', 'ee', 'ee', 'ee', 'bp', 'bp'],
          ['br', 'ee', 'bb', 'ee', 'ee', 'bb', 'ee', 'br']
        ]
        let j = 0
        for (let rank = 0; rank < 8; ++rank) {
          for (let file = 0; file < ranks[rank].length; ++file) {
            if (ranks[rank][file] !== 'ee') {
              this.setupPiece(i, j++, ranks[rank][file], left, width, width, height, rank, file, stateRef)
            }
          }
        }
      }
    }
  }

  setupPiece(i, j, type, l, w, width, height, rank, file, stateRef) { // attach event handlers for a piece
    let d = document.createElement('img')
    d.style.width    = w/16
    d.style.height   = height/16
    d.style.position = 'absolute'
    d.style.left     = l + file*w/16
    d.style.top      = (7-rank)*height/16
    d.src            = `img/${type}.png`
    d.board          = this
    d.i              = j
    if (rank >= 8)
      d.dead = true
    // if not captured, handle various events
    if (d.dead === undefined) {
      d.focus = function(event) {
        if (d.dead === undefined) {
          d.style.backgroundColor = HIGHLIGHT.HOVER
        }
        // hook up quadrant 0 events to all other quadrants
        if (i === 0) {
          for (let k = 1; k < 4; ++k) {
            d.board.pieces[j + 32*k].focus()
          }
        }
      }
      d.blur = function(event) {
        if (d.dead === undefined) {
          if (d.selected === undefined) {
            d.style.backgroundColor = HIGHLIGHT.NONE
          }
        }
        // hook up quadrant 0 events to all other quadrants
        if (i === 0) {
          for (let k = 1; k < 4; ++k) {
            //console.log(d.board, d.board.pieces)
            d.board.pieces[j + 32*k].blur()
          }
        }
      }
      d.suicide = function() {
        d.board.div.removeChild(d)
        d.dead = true
      }
      d.select = function(event) {
        if (i === 0) {// only allow select on main board
          if (d.selected !== undefined) {
            d.style.backgroundColor = HIGHLIGHT.HOVER
            d.selected = undefined
            d.board.selected = undefined
          } else if (d.board.selected !== undefined) { // piece is being captured
            d.board.selected.style.left = d.style.left
            d.board.selected.style.top  = d.style.top
            for (let k = 1; k < 4; ++k) {
              d.board.pieces[j + 32*k].style.left = d.style.left
              d.board.pieces[j + 32*k].style.top  = d.style.top
            }
            d.board.selected.selected = undefined
            d.board.selected = undefined
            d.suicide()
          } else {
            d.style.backgroundColor = HIGHLIGHT.SELECT
            d.selected = true
            d.board.selected = d
          }
          for (let k = 1; k < 4; ++k) {
            d.board.pieces[j + 32*k].select()
          }
        }
      }
      d.onmouseenter = d.focus
      d.onmouseleave = d.blur
      d.onclick = d.select
      
      this.quadrants[i].appendChild(d)
    }
    this.pieces.push(d)
  }

  focus() {
    if (this.dead)
      return
    for (let i = 0; i < this.squares.length; ++i)
      this.squares[i].style.opacity = OPACITY.LIT
    for (let i = 0; i < this.pieces.length; ++i)
      this.pieces[i].style.opacity = OPACITY.LIT
  }

  blur() {
    if (this.dead)
      return
    for (let i = 0; i < this.squares.length; ++i)
      this.squares[i].style.opacity = OPACITY.DIM
    for (let i = 0; i < this.pieces.length; ++i)
      this.pieces[i].style.opacity = OPACITY.DIM
  }

  suicide() {
    this.dead = true
    this.div.style.opacity = OPACITY.DEAD
  }

  toString() {
    let s = ''
    for (let i = 0; i < this.pieces.length; ++i) {
      // encode promotion status
      if (8 <= i && i < 24) 
        s += (x => x.substring(x.length-5, x.length-4))(this.pieces[i].src)
      // encode location
      if (this.pieces[i].dead !== undefined) { 
        s += String.fromCharCode(33 + 65)
      } else {
        let x = this.pieces[i].style.top.replace('px', '')
        let y = this.pieces[i].style.left.replace('px', '')
        let h = this.pieces[i].style.height.replace('px', '')
        let w = this.pieces[i].style.width.replace('px', '')
        let rank = 7 - Math.round(x / h)
        let file = Math.round(y / w)
        let sq = 8*rank + file
        //console.log(/*this.pieces[i], */sq, rank, file, x, h, w)
        s += String.fromCharCode(33 + sq)
        //console.log(33 + sq, sq, rank, file, x, y, h, w, this.pieces[i].style.width, String.fromCharCode(33 + sq))
      }
    }
    return s
  }
}