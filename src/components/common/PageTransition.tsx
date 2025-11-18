import React, { useEffect, useState } from 'react'

const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(id)
  }, [])
  return (
    <div className={`transition-all duration-300 ${ready ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}`}>
      <div className={`stagger-fade ${ready ? 'ready' : ''}`}>
        {children}
      </div>
    </div>
  )
}

export default PageTransition