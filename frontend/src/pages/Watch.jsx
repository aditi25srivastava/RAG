import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ThumbsUp, Share2, Save, MoreHorizontal } from 'lucide-react';
import { useAuth } from '../AuthContext';

const Watch = ({ videos, likedVideoIds = [], savedVideoIds = [], onToggleLike, onToggleSave, addToHistory }) => {
  const { id } = useParams();
  const [video, setVideo] = useState(null);
  const { currentUser } = useAuth();
  
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(1052300);
  const [comments, setComments] = useState([
    {
      id: 1,
      author: "Elena Rostova",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Elena",
      text: "This video has some seriously incredible production quality. The visual grading is perfect!",
      timestamp: "3 hours ago",
      likes: 42,
      hasLiked: false
    },
    {
      id: 2,
      author: "Devon Mckinney",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Devon",
      text: "Exactly what I was looking for. Straight to the point, no clickbait. Subscribed instantly!",
      timestamp: "1 day ago",
      likes: 18,
      hasLiked: false
    },
    {
      id: 3,
      author: "Marcus Aurelius",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus",
      text: "Wow, the animations are so fluid. Really sets a high bar for creative UI design tutorials.",
      timestamp: "3 days ago",
      likes: 7,
      hasLiked: false
    }
  ]);
  const [newCommentText, setNewCommentText] = useState('');

  useEffect(() => {
    const found = videos.find(v => v.id === id);
    setVideo(found);
    if (found && addToHistory) {
      addToHistory(found);
    }
  }, [id, videos, addToHistory]);

  useEffect(() => {
    if (video) {
      // Seed subscriber count dynamically based on channel seed
      const seed = (video.channelName.charCodeAt(0) || 1) * 7800 + 420000;
      setSubscriberCount(seed);
      setIsSubscribed(false);
    }
  }, [video]);

  if (!video) {
    return <div style={{ padding: '24px', color: 'var(--text-primary)' }}>Loading... or Video not found.</div>;
  }

  const isLiked = likedVideoIds.includes(video.id);
  const isSaved = savedVideoIds.includes(video.id);
  const recommendedVideos = videos.filter(v => v.id !== video.id);

  const formatSubscribers = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const handleSubscribeToggle = () => {
    if (isSubscribed) {
      setSubscriberCount(prev => prev - 1);
      setIsSubscribed(false);
    } else {
      setSubscriberCount(prev => prev + 1);
      setIsSubscribed(true);
    }
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const authorName = currentUser ? currentUser.displayName || currentUser.email.split('@')[0] : "Anonymous Visitor";
    const authorAvatar = currentUser ? currentUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authorName}` : `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`;

    const newComment = {
      id: Date.now(),
      author: authorName,
      avatar: authorAvatar,
      text: newCommentText,
      timestamp: "Just now",
      likes: 0,
      hasLiked: false
    };

    setComments([newComment, ...comments]);
    setNewCommentText('');
  };

  const handleCommentLike = (commentId) => {
    setComments(prev => prev.map(c => {
      if (c.id === commentId) {
        return {
          ...c,
          likes: c.hasLiked ? c.likes - 1 : c.likes + 1,
          hasLiked: !c.hasLiked
        };
      }
      return c;
    }));
  };

  const renderVideoPlayer = (url) => {
    let embedUrl = url;
    
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    } else if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }

    if (embedUrl.includes('youtube.com/embed') || embedUrl.includes('vimeo.com') || embedUrl.includes('iframe')) {
      return (
        <iframe 
          src={embedUrl} 
          title={video.title} 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowFullScreen
        ></iframe>
      );
    }

    return (
      <video controls autoPlay>
        <source src={url} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    );
  };

  return (
    <div className="watch-layout">
      {/* Main Video column */}
      <div className="watch-main-col">
        <div className="video-wrapper">
          {renderVideoPlayer(video.videoUrl)}
        </div>
        
        <h1 style={{ fontSize: '22px', fontWeight: '700', marginTop: '12px', color: 'var(--text-primary)' }}>{video.title}</h1>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap', gap: '16px' }}>
          <div className="user-profile">
            <img 
              src={video.channelAvatar} 
              alt={video.channelName} 
              style={{ border: '2px solid var(--accent-color)', boxShadow: '0 0 10px var(--accent-glow)' }}
            />
            <div>
              <div style={{ fontWeight: '600', fontSize: '15px', display: 'flex', alignItems: 'center', color: 'var(--text-primary)' }}>
                {video.channelName}
                <span className="badge">Creator</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {formatSubscribers(subscriberCount)} subscribers
              </div>
            </div>
            <button 
              className={`btn ${isSubscribed ? 'btn-secondary' : 'btn-primary'}`} 
              style={{ marginLeft: '16px', borderRadius: '20px', padding: '8px 18px' }}
              onClick={handleSubscribeToggle}
            >
              {isSubscribed ? 'Subscribed' : 'Subscribe'}
            </button>
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="btn btn-secondary" 
              style={{ 
                borderRadius: '20px', 
                backgroundColor: isLiked ? 'var(--bg-hover)' : '', 
                color: isLiked ? 'var(--accent-color)' : '',
                border: '1px solid var(--glass-border)'
              }}
              onClick={() => onToggleLike && onToggleLike(video.id)}
            >
              <ThumbsUp size={18} fill={isLiked ? 'currentColor' : 'none'} />
              {isLiked ? 'Liked' : 'Like'}
            </button>
            <button className="btn btn-secondary" style={{ borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
              <Share2 size={18} />
              Share
            </button>
            <button 
              className="btn btn-secondary" 
              style={{ 
                borderRadius: '20px', 
                backgroundColor: isSaved ? 'var(--bg-hover)' : '', 
                color: isSaved ? 'var(--accent-color)' : '',
                border: '1px solid var(--glass-border)'
              }}
              onClick={() => onToggleSave && onToggleSave(video.id)}
            >
              <Save size={18} fill={isSaved ? 'currentColor' : 'none'} />
              {isSaved ? 'Saved' : 'Save'}
            </button>
            <button className="btn-icon btn-secondary" style={{ border: '1px solid var(--glass-border)' }}>
              <MoreHorizontal size={18} />
            </button>
          </div>
        </div>
        
        <div className="glass" style={{ padding: '20px', borderRadius: '16px', marginTop: '20px' }}>
          <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '8px', color: 'var(--text-primary)' }}>
            {video.views} views • {video.timestamp}
          </div>
          <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
            Uploaded via StreamHub link. Experience this premium video player container equipped with high fidelity glassmorphic accents, customizable ambient background, dynamic comments feed, and automated watch history syncing.
          </p>
        </div>

        {/* Comments Section */}
        <div className="comments-section">
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>
            {comments.length} Comments
          </h3>
          
          <form onSubmit={handleCommentSubmit} className="comment-input-area">
            <img 
              src={currentUser?.photoURL || "https://api.dicebear.com/7.x/avataaars/svg?seed=guest"} 
              alt="User avatar" 
              className="comment-author-avatar"
            />
            <div className="comment-input-box">
              <input 
                type="text" 
                className="comment-input" 
                placeholder="Add a public comment..." 
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
              />
              <div className="comment-actions">
                {newCommentText.trim() && (
                  <>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={() => setNewCommentText('')}
                      style={{ borderRadius: '18px', padding: '6px 14px', fontSize: '13px' }}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary" 
                      style={{ borderRadius: '18px', padding: '6px 14px', fontSize: '13px' }}
                    >
                      Comment
                    </button>
                  </>
                )}
              </div>
            </div>
          </form>

          <div className="comment-list">
            {comments.map(c => (
              <div key={c.id} className="comment-item">
                <img src={c.avatar} alt={c.author} className="comment-author-avatar" />
                <div className="comment-body">
                  <div className="comment-header">
                    <span className="comment-author">{c.author}</span>
                    <span className="comment-time">{c.timestamp}</span>
                  </div>
                  <p className="comment-text">{c.text}</p>
                  <div className="comment-footer">
                    <button 
                      className="comment-like-btn" 
                      onClick={() => handleCommentLike(c.id)}
                      style={{ color: c.hasLiked ? 'var(--accent-color)' : '' }}
                    >
                      <ThumbsUp size={14} fill={c.hasLiked ? 'currentColor' : 'none'} />
                      <span>{c.likes}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommended Sidebar column */}
      <div className="recommended-sidebar">
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
          Recommended
        </h3>
        {recommendedVideos.map(rec => (
          <Link to={`/watch/${rec.id}`} key={rec.id} className="recommended-card">
            <div className="rec-thumb-wrapper">
              <img src={rec.thumbnailUrl} alt={rec.title} className="rec-thumb" />
              <div className="rec-duration">{rec.duration}</div>
            </div>
            <div className="rec-details">
              <h4 className="rec-title">{rec.title}</h4>
              <div className="rec-channel">{rec.channelName}</div>
              <div className="rec-meta">{rec.views} views • {rec.timestamp}</div>
            </div>
          </Link>
        ))}
        {recommendedVideos.length === 0 && (
          <div style={{ color: 'var(--text-secondary)', fontSize: '14px', padding: '10px' }}>
            No related videos found.
          </div>
        )}
      </div>
    </div>
  );
};

export default Watch;
