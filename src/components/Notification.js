import React from 'react';

const Notification = ({ message, show }) => {
  if (!show) return null;

  return (
    <div className="fixed top-20 right-5 bg-green-500 text-white py-3 px-5 rounded-lg shadow-lg z-[100] animate-slide-in-out">
      <p>{message}</p>
    </div>
  );
};

export default Notification;