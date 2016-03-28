import React from 'react'
import { render } from 'react-dom'

const SPLURGE = 'SPLURGE'
const NECESSITY = 'NECESSITY'
const WORK_IT = 'WORK_IT'

function rand (min = 0, max = 1) {
  return min + Math.random() * (max - min)
}

function weightedRand (weightsAndVals = [{weight: 1, value: 1}]) {
  let total = weightsAndVals.reduce((p, c) => ({weight: p.weight + c.weight}), {weight: 0}).weight
  let ran = rand(0, total)
  let r
  weightsAndVals.some((x) => {
    r = x.value
    if (ran < x.weight) return true
    ran -= x.weight
  })

  return r
}

function shuffle (arr) {
  let len = arr.length
  let idx
  let temp

  if (len === 0) return arr

  while (len) {
    idx = Math.floor(rand(0, len--))

    temp = arr[len]
    arr[len] = arr[idx]
    arr[idx] = temp
  }

  return arr
}

function flavorForVal (val) {
  let flavors

  if (val > 1) {
    flavors = [
      'Cake!',
      'Ice Cream!',
      'Baked Goods for Breakfast!'
    ]
  } else if (val < 0) {
    flavors = [
      'Jogging',
      'Hitting the Gym',
      'Biking to Work'
    ]
  } else {
    flavors = [
      'Grilled Chicken Dinner',
      'Salad for Lunch',
      'A Heaping Portion of Vegetables'
    ]
  }

  return flavors[Math.floor(rand(0, flavors.length))]
}

function addCardOfType (type) {
  let val

  switch (type) {
    case SPLURGE:
      val = weightedRand([
        {value: 2, weight: 0.6},
        {value: 3, weight: 0.25},
        {value: 4, weight: 0.1},
        {value: 5, weight: 0.05}
      ])
      return {
        type: type,
        value: val,
        flavor: flavorForVal(val)
      }
    case NECESSITY:
      val = weightedRand()
      return {
        type: type,
        value: val,
        flavor: flavorForVal(val)
      }
    case WORK_IT:
      val = weightedRand([
        {value: -1, weight: 0.75},
        {value: -2, weight: 0.17},
        {value: -3, weight: 0.08}
      ])
      return {
        type: type,
        value: val,
        flavor: flavorForVal(val)
      }
    default:
      return {
        type: 'UNKNOWN',
        value: 0,
        flavor: 'Get outta mah swamp!'
      }
  }
}

//  For 100 card deck do 50, 35, 15
//  For 40 card deck do 20, 14, 6
console.log(Array.from(new Array(6), (v, i) => i).map(() => weightedRand([
  {value: -1, weight: 0.75},
  {value: -2, weight: 0.17},
  {value: -3, weight: 0.08}
])))
const splurgeCards = Array.from(new Array(50), (v, i) => i).map(() => addCardOfType(SPLURGE))
const necessityCards = Array.from(new Array(35), (v, i) => i).map(() => addCardOfType(NECESSITY))
const workItCards = Array.from(new Array(15), (v, i) => i).map(() => addCardOfType(WORK_IT))
const shuffledCards = shuffle([...splurgeCards, ...necessityCards, ...workItCards])
const shuffledCardsCopy = shuffledCards.slice()
let cards = []

while (shuffledCards.length) {
  cards.push(shuffledCards.splice(0, Math.min(12, shuffledCards.length)))
}

class Player {
  constructor (id) {
    this.id = id
    this.hand = []
    this.score = 0
    this.playLog = []
    this.inPlay = []
  }

  addCard (card) {
    this.hand.push(card)
  }

  playCard () {
    const idx = Math.floor(rand(0, this.hand.length))
    const choice = this.hand[idx]
    this.hand.splice(idx, 1)

    this.score += choice.value
    this.playLog.push(choice)
    this.inPlay.push(choice)

    this.inPlay.sort((a, b) => {
      const fA = a.flavor.split().reduce((p, c) => p + c.charCodeAt(0), 0)
      const fB = b.flavor.split().reduce((p, c) => p + c.charCodeAt(0), 0)

      return fA - fB
    })

    const dupes = []
    this.inPlay.forEach((x, i, a) => {
      const prevIdx = Math.max(i - 1, 0)
      if (prevIdx === i) return

      const prev = this.inPlay[prevIdx]
      if (x.flavor === prev.flavor) {
        let dupeIdx
        dupes.some((y, yi) => {
          if (y.flavor === x.flavor) {
            dupeIdx = yi
            return true
          }
        })

        if (dupeIdx !== undefined) {
          dupes[dupeIdx].run++
          dupes[dupeIdx].cards.push(x)
        } else {
          dupes.push({
            flavor: x.flavor,
            start: prevIdx,
            run: 2,
            cards: [prev, x]
          })
        }
      }
    })

    dupes.forEach((dupe) => {
      if (dupe.run >= 3) {
        this.inPlay.splice(dupe.start, dupe.run)
        dupe.cards.forEach((card) => {
          this.score -= card.value
        })
      }
    })
  }
}

function playGame () {
  let cardArr = shuffledCardsCopy.slice()
  const players = [new Player('A'), new Player('B')]

  //  Initial hand
  Array.from(new Array(10), (v, i) => i).map(() => {
    players.forEach((player) => {
      player.addCard(...cardArr.splice(0, 1))
    })
  })

  while (cardArr.length) {
    players[0].addCard(...cardArr.splice(0, 1))
    players[0].playCard()

    if (cardArr.length) players[1].addCard(...cardArr.splice(0, 1))
    players[1].playCard()
  }

  while (players.some((x) => x.hand.length)) {
    if (players[0].hand.length) players[0].playCard()
    if (players[1].hand.length) players[1].playCard()
  }

  console.log(`${players[0].id}: score of ${players[0].score} and ${JSON.stringify(players[0].inPlay)}`)
  console.log(`${players[1].id}: score of ${players[1].score} and ${JSON.stringify(players[1].inPlay)}`)

  console.log('')
  if (players[0].score > 0 && (players[1].score > 0 && players[0].score < players[1].score || players[1].score <= 0)) {
    console.log(`Player ${players[0].id} wins!`)
  } else if (players[1].score > 0 && (players[0].score > 0 && players[1].score < players[0].score || players[0].score <= 0)) {
    console.log(`Player ${players[1].id} wins!`)
  } else {
    console.log('Chalk it up as a tie!')
  }
}

/*
# Rendering
*/
const Card = ({ type, value, flavor }) => (
  <div className={`card card--${type.toLowerCase().replace(/_/g, '-')} col-md-1 col-sm-3`}>
    <p><strong>Type</strong>: {type}</p>
    <p><strong>Value</strong>: {value}</p>
    <p><strong>Flavor</strong>: {flavor}</p>
  </div>
)

const CardRow = ({ subcards }) => (
  <div className='card-row row'>
    {subcards.map((card, idx) => (<Card key={idx} {...card} />))}
  </div>
)

const App = () => (
  <div className='card-holder container'>
    <div className='row'>
      <div className='col-md-1 col-sm-3'>
        <button onClick={playGame} className='btn btn-default'>Play Game</button>
      </div>
    </div>
    {cards.map((subcards, idx) => (<CardRow key={idx} subcards={subcards} />))}
  </div>
)

render(<App />, document.getElementById('main'))
