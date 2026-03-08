import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ExplorerPage } from '@/pages/ExplorerPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ExplorerPage />} />
        <Route path="/explore" element={<ExplorerPage />} />
      </Routes>
    </BrowserRouter>
  )
}
