import React from 'react';
import { Home, Bookmark, ThumbsUp, History } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'sidebar-item active' : 'sidebar-item';
  };

  return (
    <div className="sidebar">
      <Link to="/" className={isActive('/')}>
        <Home size={20} />
        <span>Home</span>
      </Link>
      
      <div className="sidebar-divider"></div>
      
      <Link to="/history" className={isActive('/history')}>
        <History size={20} />
        <span>History</span>
      </Link>
      <Link to="/saved" className={isActive('/saved')}>
        <Bookmark size={20} />
        <span>Saved</span>
      </Link>
      <Link to="/liked" className={isActive('/liked')}>
        <ThumbsUp size={20} />
        <span>Liked Videos</span>
      </Link>
    </div>
  );
};

export default Sidebar;
