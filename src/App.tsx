import React, { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import { data, groups, GroupId } from './data'
import shuttle from 'lodash/shuffle'

const MAX_TERMS = 4
const MAX_LIVES = 4

function App() {
  const [connections, setConnections] = useState(shuttle(data))
  const [winner, setWinner] = useState(false)
  const [lives, setLives] = useState(MAX_LIVES)
  const refs = [
    useRef<HTMLTableRowElement>(null),
    useRef<HTMLTableRowElement>(null),
    useRef<HTMLTableRowElement>(null),
    useRef<HTMLTableRowElement>(null),
  ]

  useEffect(() => {
    if (connections.some((c) => !c.connected)) {
      return
    }
    setWinner(true)
  }, [connections])

  function handleCellClick(item: (typeof data)[0]) {
    const checkedItems = connections.filter((i) => i.checked)
    if (checkedItems.length === MAX_TERMS && !item.checked) {
      return
    }

    if (item.connected) {
      return
    }

    setConnections(
      connections.map((i) => {
        if (i.id === item.id) {
          return { ...i, checked: !i.checked }
        }
        return i
      })
    )
  }

  function handleConnect() {
    const checkedItems = connections
      .filter((i) => i.checked)
      .reduce((acc: number[], i: (typeof data)[0]) => {
        return [...acc, i.id]
      }, [])
    let isCorrect = false

    for (let i = 0; i < groups.length; i++) {
      const group = JSON.stringify(groups[i].connections.sort((a, b) => a - b))
      const checked = JSON.stringify(checkedItems.sort((a, b) => a - b))
      if (group === checked) {
        isCorrect = true
        break
      }
    }

    if (!isCorrect) {
      setLives(lives - 1)
      return
    }

    moveRowToTop(checkedItems)
  }

  function moveRowToTop(checkedItems: number[]) {
    const updatedConnections = connections.map((i) => {
      if (checkedItems.includes(i.id)) {
        return { ...i, connected: true, checked: false }
      }
      return i
    })

    const mapAllConnectedToGroups = updatedConnections
      .filter((i) => i.connected)
      .reduce((acc: Record<GroupId, number[]>, i: (typeof data)[0]) => {
        const group = groups.find((g) => g.connections.includes(i.id))
        if (group && acc[group.id]) {
          acc[group.id].push(i.id)
        } else if (group) {
          acc[group.id] = [i.id]
        }
        return acc
      }, {} as Record<GroupId, number[]>)

    const sortedGroupItems = Object.keys(mapAllConnectedToGroups).flatMap(
      (val) => mapAllConnectedToGroups[val as GroupId].sort((a, b) => a - b)
    )

    const connectedItems = sortedGroupItems.map((id) =>
      updatedConnections.find((i) => i.id === id)
    ) as (typeof data)[0][]

    setConnections([
      ...connectedItems,
      ...updatedConnections.filter((i) => i.connected === false),
    ])
  }

  function getColor(item: (typeof data)[0]) {
    if (item.checked) {
      return {
        background: '#333',
        color: 'white',
      }
    }
    if (item.connected) {
      return {
        background: groups.find((g) => g.connections.includes(item.id))?.color,
        borderColor: groups.find((g) => g.connections.includes(item.id))?.color,
        fontWeight: 'bold',
        color: '#333',
      }
    }
    return {
      background: 'transparent',
      color: '#333',
    }
  }

  function restart() {
    setConnections(shuttle(data))
    setWinner(false)
    setLives(MAX_LIVES)
  }

  const displayConnectedMessage = useCallback(() => {
    const connected = connections.filter((i) => i.connected)
    const nodes: React.ReactNode[] = []

    for (let i = 0; i < connected.length / MAX_TERMS; i++) {
      const group = groups.find((g) =>
        g.connections.includes(connected[i * MAX_TERMS].id)
      )
      const rect = refs[i].current?.getBoundingClientRect()
      const width = rect?.width ?? 0
      const top = rect?.bottom ?? 0
      const left = rect?.left ?? 0
      nodes.push(
        <div
          key={`pill-${i}`}
          className='pill-container'
          style={{ width, top: top - 20, left }}
        >
          <span key={connected[i * MAX_TERMS].id} className='pill'>
            {group?.message}
          </span>
        </div>
      )
    }

    return nodes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connections])

  if (lives === 0) {
    return (
      <main>
        <h1>Game Over 👎🏼</h1>
        <h2>Try again</h2>
        <button onClick={restart}>restart</button>
      </main>
    )
  }

  return (
    <main>
      <h1>Family connections {winner && ` - Congrats 🎉`}</h1>
      <div className='game-wrapper'>
        <div className='table-container'>
          <table>
            <tbody>
              {Array.from([0, 1, 2, 3]).map((item) => (
                <tr key={item} ref={refs[item]}>
                  {connections
                    .slice(item * MAX_TERMS, item * MAX_TERMS + MAX_TERMS)
                    .map((i) => (
                      <td
                        key={i.name}
                        style={{ ...getColor(i) }}
                        onClick={() => handleCellClick(i)}
                      >
                        {i.name}
                      </td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {winner ? (
          <button onClick={restart}>restart</button>
        ) : (
          <>
            <div className='lives'>
              {Array.from({ length: lives }).map((_, index) => (
                <span key={index}>❤️</span>
              ))}
            </div>
            <button
              disabled={
                connections.filter((i) => i.checked).length !== MAX_TERMS
              }
              onClick={handleConnect}
            >
              Connect
            </button>
          </>
        )}
      </div>
      {displayConnectedMessage()}
    </main>
  )
}

export default App
