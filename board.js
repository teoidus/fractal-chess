const DIM_OPACITY = 0.5
const LIT_OPACITY = 1
let shades = ['rgb(240, 217, 181)', 'rgb(181, 136, 99)']

class Board {
  constructor(height, width, depth = 0, flip = false, parent = undefined, top = 0, left = 0) {
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
    let l = depth === 0 ? 0 : width/4
    let w = depth === 0 ? width : width/2
    for (let rank = 0; rank < 8; ++rank) {
      for (let file = 0; file < 8; ++file) {
        let d = document.createElement('div')
        d.style.width = w/8
        d.style.height = height/8
        d.style.position = 'absolute'
        d.style.left = l + file*w/8
        d.style.top  = (7-rank)*height/8
        d.style.backgroundColor = shades[(file*9+(7-rank))%2]
        this.squares.push(d)
        this.div.appendChild(d)
      }
    }

    // populate root pieces and associate with children
    this.pieces = []
    this.children = []
    let ranks = [
      ['wr', 'wn', 'wb', 'wq', 'wk', 'wb', 'wn', 'wr'],
      ['wp', 'wp', 'wp', 'wp', 'wp', 'wp', 'wp', 'wp'], [], [], [], [],
      ['bp', 'bp', 'bp', 'bp', 'bp', 'bp', 'bp', 'bp'],
      ['br', 'bn', 'bb', 'bq', 'bk', 'bb', 'bn', 'br']
    ]
    for (let rank = 0; rank < 8; ++rank) {
      for (let file = 0; file < ranks[rank].length; ++file) {
        let d = document.createElement('img')
        d.style.width    = w/8
        d.style.height   = height/8
        d.style.position = 'absolute'
        d.style.left     = l + file*w/8
        d.style.top      = (7-rank)*height/8
        d.src            = `img/${ranks[rank][file]}.png`
        d.board          = this
     
        // if not leaf, associate with child board
        if (depth !== 0) {
          let compressedRank = [0,1,0,0,0,0,2,3][rank]
          let b = (file < 4) ?
            new Board(height/4, width/16, depth-1, flip, d, (3-compressedRank)*height/4, file*width/16) :
            new Board(height/4, width/16, depth-1, flip, d, (3-compressedRank)*height/4, 3*width/4+(file-4)*width/16)
          b.blur()
          this.children.push(b)
          this.div.appendChild(b.div)
          d.child = b
        }
        this.pieces.push(d)

        // handle various events
        d.focus = function(event) {
          d.style.backgroundColor = '#77CC77'
          if (d.child !== undefined) // focus child board, if it exists
            d.child.focus()
        }
        d.blur = function(event) {
          d.style.backgroundColor = 'transparent'
          if (d.child !== undefined)
            d.child.blur()
        }
        d.onmouseenter = d.focus
        d.onmouseleave = d.blur

        this.div.appendChild(d)
      }
    }
  }

  focus() {
    for (let i = 0; i < this.squares.length; ++i)
      this.squares[i].style.opacity = LIT_OPACITY
    for (let i = 0; i < this.pieces.length; ++i)
      this.pieces[i].style.opacity = LIT_OPACITY
  }

  blur() {
    for (let i = 0; i < this.squares.length; ++i)
      this.squares[i].style.opacity = DIM_OPACITY
    for (let i = 0; i < this.pieces.length; ++i)
      this.pieces[i].style.opacity = DIM_OPACITY
  }
}