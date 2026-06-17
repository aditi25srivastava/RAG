import React from 'react';
import { Search, Menu, Video, Bell, User, LogIn, LogOut, Upload, Palette } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { Link } from 'react-router-dom';

const Navbar = ({ onUploadClick, activeTheme, setActiveTheme, searchQuery, setSearchQuery }) => {
  const { currentUser, login, logout } = useAuth();

  const canUpload = currentUser?.email === 'aditya.123.22.111@gmail.com';

  const themes = ['aurora', 'cyber', 'solar', 'obsidian'];

  const cycleTheme = () => {
    const currentIndex = themes.indexOf(activeTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setActiveTheme(themes[nextIndex]);
  };

  return (
    <nav className="navbar glass">
      <div className="nav-left">
        <button className="btn-icon">
          <Menu size={24} />
        </button>
        <Link to="/" className="logo">
          <Video className="logo-icon" size={28} />
          <span>StreamHub</span>
        </Link>
      </div>

      <div className="search-bar">
        <Search size={20} color="var(--text-secondary)" />
        <input 
          type="text" 
          placeholder="Search videos..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="nav-right">
        <button 
          className="btn btn-secondary" 
          onClick={cycleTheme} 
          title="Switch background theme"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            textTransform: 'capitalize',
            cursor: 'pointer',
            padding: '8px 14px',
            border: '1px solid var(--glass-border)'
          }}
        >
          <Palette size={18} className="logo-icon" />
          <span>{activeTheme}</span>
        </button>

        {currentUser ? (
          <>
            {canUpload && (
              <button className="btn btn-secondary" onClick={onUploadClick}>
                <Upload size={18} />
                Upload
              </button>
            )}
            <button className="btn-icon">
              <Bell size={20} />
            </button>
            <div className="user-profile">
              <img src={currentUser.photoURL || "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback"} alt="User" />
            </div>
            <button className="btn btn-secondary" onClick={logout} title="Sign Out">
              <LogOut size={18} />
            </button>
          </>
        ) : (
          <button className="btn btn-primary" onClick={login}>
            <LogIn size={18} />
            Sign in
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
