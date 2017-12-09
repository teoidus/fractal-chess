const OPACITY = { DIM: 0.5, LIT: 1, DEAD: 0.2 }
const HIGHLIGHT = { HOVER: '#77CC77', SELECT: '#33AA33', NONE: 'transparent' }
let shades = ['rgb(240, 217, 181)', 'rgb(181, 136, 99)']

class Board {
  constructor(height, width, depth = 0, stateRef = [undefined], flip = false, parent = undefined, top = 0, left = 0) {
    this.parent = parent
    this.div = document.createElement('div')
    this.div.style.height = height
    this.div.style.width = width
    this.div.style.position = 'absolute'
    this.div.style.left = left
    this.div.style.top  = top
    let self = this
    this.div.onmouseenter = function() {
      self.focus()
      if (parent !== undefined) // focus parent piece, if it exists
        parent.focus()
    }
    this.div.onmouseleave = function() {
      self.blur()
      if (parent !== undefined)
        parent.blur()
    }

    // populate root
    this.squares = []
    let l = depth === 0 ? 0 : width/3
    this.rootLeft = l
    let w = depth === 0 ? width : width/3
    for (let rank = 0; rank < 8; ++rank) {
      for (let file = 0; file < 8; ++file) {
        let d = document.createElement('div')
        d.style.width = w/8
        d.style.height = height/8
        d.style.position = 'absolute'
        d.style.left = l + file*w/8
        d.style.top  = (7-rank)*height/8
        d.style.backgroundColor = shades[(file*9+(7-rank))%2]
        d.board = this
        // handle clicks (if board.selecting, then move whatever was selected to clicked sq)
        d.onclick = function() {
          if (d.board.selected !== undefined) {
            d.board.selected.style.left = d.style.left
            d.board.selected.style.top  = d.style.top
            d.board.selected.selected = undefined
            d.board.selected = undefined
          }
        }
        this.squares.push(d)
        this.div.appendChild(d)
      }
    }

    // populate root pieces and associate with children
    this.pieces = []
    this.children = []
    if (stateRef[0] !== undefined) { // if loading from saved state,
      let types = [
        'wr', 'wn', 'wb', 'wq', 'wk', 'wb', 'wn', 'wr',
        'wp', 'wp', 'wp', 'wp', 'wp', 'wp', 'wp', 'wp',
        'bp', 'bp', 'bp', 'bp', 'bp', 'bp', 'bp', 'bp',
        'br', 'bn', 'bb', 'bq', 'bk', 'bb', 'bn', 'br'
      ]
      for (let i = 0; i < 32; ++i) {
        if (8 <= i && i < 24) { // if pawn, extract promotion status
          //console.log(i, 'got', stateRef[0])
          types[i] = types[i][0] + stateRef[0][0]
          stateRef[0] = stateRef[0].substring(1)
        }
        let sq = stateRef[0].charCodeAt(0) - 33
        stateRef[0] = stateRef[0].substring(1)
        //console.log('found', types[i], 'at square', sq, types)
        this.setupPiece(i, types[i], l, w, width, height, Math.floor(sq/8), sq%8, depth, stateRef, flip)
      }
    } else {
      let ranks = [
        ['wr', 'wn', 'wb', 'wq', 'wk', 'wb', 'wn', 'wr'],
        ['wp', 'wp', 'wp', 'wp', 'wp', 'wp', 'wp', 'wp'],
        ['ee', 'ee', 'ee', 'ee', 'ee', 'ee', 'ee', 'ee'],
        ['ee', 'ee', 'ee', 'ee', 'ee', 'ee', 'ee', 'ee'],
        ['ee', 'ee', 'ee', 'ee', 'ee', 'ee', 'ee', 'ee'],
        ['ee', 'ee', 'ee', 'ee', 'ee', 'ee', 'ee', 'ee'],
        ['bp', 'bp', 'bp', 'bp', 'bp', 'bp', 'bp', 'bp'],
        ['br', 'bn', 'bb', 'bq', 'bk', 'bb', 'bn', 'br']
      ]
      let i = 0
      for (let rank = 0; rank < 8; ++rank) {
        for (let file = 0; file < ranks[rank].length; ++file) {
          if (ranks[rank][file] !== 'ee') {
            this.setupPiece(i++, ranks[rank][file], l, w, width, height, rank, file, depth, stateRef, flip)
          }
        }
      }
    }
  }

  setupPiece(i, type, l, w, width, height, rank, file, depth, stateRef, flip) { // attach event handlers for a piece
    let d = document.createElement('img')
    d.style.width    = w/8
    d.style.height   = height/8
    d.style.position = 'absolute'
    d.style.left     = l + file*w/8
    d.style.top      = (7-rank)*height/8
    d.src            = `img/${type}.png`
    d.board          = this
    if (rank >= 8)
      d.dead = true
    
    // if not leaf, associate with child board
    if (depth !== 0) {
      let row = 3 - Math.floor(i/8)
      let col = i % 8
      let b = (col < 4) ?
        new Board(height/4, width/12, depth-1, stateRef, flip, d, row*height/4, col*width/12) :
        new Board(height/4, width/12, depth-1, stateRef, flip, d, row*height/4, 2*width/3+(col-4)*width/12)
      b.blur()
      this.children.push(b)
      this.div.appendChild(b.div)
      d.child = b
      if (d.dead !== undefined)
        d.child.suicide()
    }
    this.pieces.push(d)
    
    // if not captured, handle various events
    if (d.dead === undefined) {
      d.focus = function(event) {
        d.style.backgroundColor = HIGHLIGHT.HOVER
        if (d.child !== undefined) // focus child board, if it exists
          d.child.focus()
      }
      d.blur = function(event) {
        if (d.selected === undefined) {
          d.style.backgroundColor = HIGHLIGHT.NONE
          if (d.child !== undefined)
            d.child.blur()
        }
      }
      d.select = function(event) {
        if (d.selected !== undefined) {
          d.style.backgroundColor = HIGHLIGHT.HOVER
          d.selected = undefined
          d.board.selected = undefined
        } else if (d.board.selected !== undefined) { // piece is being captured
          d.board.selected.style.left = d.style.left
          d.board.selected.style.top  = d.style.top
          d.board.selected.selected = undefined
          d.board.selected = undefined
          // kill off all children
          if (d.child !== undefined)
            d.child.suicide()
          d.board.div.removeChild(d)
          d.dead = true
        } else {
          d.style.backgroundColor = HIGHLIGHT.SELECT
          d.selected = true
          d.board.selected = d
        }
      }
      d.onmouseenter = d.focus
      d.onmouseleave = d.blur
      d.onclick = d.select
      
      this.div.appendChild(d)
    }
  }

  focus() {
    for (let i = 0; i < this.squares.length; ++i)
      this.squares[i].style.opacity = OPACITY.LIT
    for (let i = 0; i < this.pieces.length; ++i)
      this.pieces[i].style.opacity = OPACITY.LIT
  }

  blur() {
    for (let i = 0; i < this.squares.length; ++i)
      this.squares[i].style.opacity = OPACITY.DIM
    for (let i = 0; i < this.pieces.length; ++i)
      this.pieces[i].style.opacity = OPACITY.DIM
  }

  suicide() {
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
        let file = Math.round((y-this.rootLeft) / w)
        let sq = 8*rank + file
        //console.log(/*this.pieces[i], */sq, rank, file, x, h, w)
        s += String.fromCharCode(33 + sq)
        //console.log(33 + sq, sq, rank, file, x, y, h, w, this.pieces[i].style.width, String.fromCharCode(33 + sq))
      }
      // encode child board
      if (this.children[i] !== undefined)
        s += this.children[i].toString()
    }
    return s
  }
}