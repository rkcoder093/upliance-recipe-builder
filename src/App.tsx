import { Routes, Route, Navigate } from 'react-router-dom'
import { Container } from '@mui/material'
import Layout from './components/Layout'
import RecipeList from './features/recipes/RecipeList'
import RecipeForm from './features/recipes/RecipeForm'
import CookingPage from './features/session/CookingPage'
import MiniPlayer from './features/session/MiniPlayer'

export default function App() {
  return (
    <Layout>
      <Container sx={{ mt: 3 }}>
        <Routes>
          {/* Redirect base path to recipes */}
          <Route path="/" element={<Navigate to="/recipes" replace />} />
          <Route path="/recipes" element={<RecipeList />} />
          <Route path="/create" element={<RecipeForm />} />
          <Route path="/cook/:id" element={<CookingPage />} />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/recipes" replace />} />
        </Routes>
      </Container>
      <MiniPlayer />
    </Layout>
  )
}