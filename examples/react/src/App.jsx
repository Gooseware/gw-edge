import './App.css'
import React, { useState } from 'react'
import { Link, Route, Routes } from 'react-router-dom'
import logo from './logo.svg'

export default function App({ router }) {
  const [count, setCount] = useState(0)

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>Hello ViteSSR + React!</p>
        <p>
          <button onClick={() => setCount((count) => count + 1)}>
            count is: {count}
          </button>
        </p>

        <nav>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/about">About</Link>
            </li>
            <li>
              <Link to="/post/1">Post #1</Link>
            </li>
            <li>
              <Link to="/post/2">Post #2</Link>
            </li>
          </ul>
        </nav>
      </header>

      <Routes>
        {router.routes.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={<route.component />}
          />
        ))}
      </Routes>
    </div>
  )
}
