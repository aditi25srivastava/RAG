import React from 'react';
import VideoCard from '../components/VideoCard';

const Home = ({ videos }) => {
  return (
    <div className="video-grid">
      {videos.map(video => (
        <VideoCard key={video.id} video={video} />
      ))}
      {videos.length === 0 && (
        <div style={{ color: 'var(--text-secondary)', padding: '20px' }}>
          No videos available yet. Be the first to upload!
        </div>
      )}
    </div>
  );
};

export default Home;
