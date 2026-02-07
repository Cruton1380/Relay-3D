import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-primary-blue text-white py-6">
      <div className="container">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-3 mb-4 md:mb-0">
            <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center">
              <span className="text-primary-blue text-sm font-bold">R</span>
            </div>
            <span className="text-lg font-semibold">Relay Platform</span>
          </div>
          
          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              <span className="text-white/90">System Active</span>
            </div>
            <span className="text-white/70">© 2025 Relay Platform</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
