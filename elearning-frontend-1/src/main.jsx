import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx';
import { UserContextProvider } from './context/UserContext.jsx';
import { CourseContextProvider } from './context/CourseContext.jsx';

// Changed server URL from remote to local backend
export const server = 'http://localhost:5001';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <UserContextProvider>
      <CourseContextProvider>
      <App />
      </CourseContextProvider>
    </UserContextProvider>
  </StrictMode>,
)

