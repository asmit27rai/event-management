import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Login, Signup } from './pages/Auth';
import { HomePage } from './pages/HomePage';
import Profile from './pages/Profile';
import Request from './pages/Request';
import Contact from './pages/Contact';

function App() {
  return (
    <Router>
      <div className="text-center">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/requests" element={<Request />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;