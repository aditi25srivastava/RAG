import React from 'react';
import { Link } from 'react-router-dom';

const VideoCard = ({ video }) => {
  return (
    <Link to={`/watch/${video.id}`} className="video-card">
      <div className="video-thumbnail-wrapper">
        <img src={video.thumbnailUrl} alt={video.title} className="video-thumbnail" />
        <div className="video-duration">{video.duration}</div>
      </div>
      <div className="video-info">
        <img src={video.channelAvatar} alt={video.channelName} className="channel-avatar" />
        <div className="video-details">
          <h3 className="video-title">{video.title}</h3>
          <div className="channel-name">{video.channelName}</div>
          <div className="video-meta">
            {video.views} views • {video.timestamp}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default VideoCard;
