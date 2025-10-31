import React from 'react'
import { AppBar, Toolbar, Typography, Container } from '@mui/material'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">Upliance — Recipe Builder</Typography>
        </Toolbar>
      </AppBar>
      <Container>
        {children}
      </Container>
    </div>
  )
}

