import React from 'react';

const SplashView: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-[#dccdb9] text-[#1c1917]">
      <div className="animate-fade-in-up text-center space-y-4">
        <h1 className="text-6xl font-serif">Eternal</h1>
        <p className="text-xs tracking-widest uppercase opacity-60">Ancestry Preservation</p>
      </div>
    </div>
  );
};

export default SplashView;
