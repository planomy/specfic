import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import SpecFictionBuilderApp from './SpecFictionBuilderApp.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SpecFictionBuilderApp />
  </StrictMode>,
)
