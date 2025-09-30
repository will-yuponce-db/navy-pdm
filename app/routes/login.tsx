import React from 'react';
import { Box, Container } from '@mui/material';
import { LoginForm } from '../components/Authentication';

export default function Login() {
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <LoginForm />
      </Box>
    </Container>
  );
}
