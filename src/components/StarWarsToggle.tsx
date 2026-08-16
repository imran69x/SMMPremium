import React from 'react';
import './StarWarsToggle.css';

interface StarWarsToggleProps {
  checked: boolean;
  onChange: () => void;
  size?: number; // Size in pixels for the container font-size, default 2px
}

export default function StarWarsToggle({ checked, onChange, size = 1.5 }: StarWarsToggleProps) {
  return (
    <div 
      className={`star-wars-toggle-wrapper ${checked ? 'checked' : 'unchecked'}`} 
      style={{ fontSize: `${size}px`, display: 'inline-block' }}
      title={checked ? "Switch to Dark Mode" : "Switch to Light Mode"}
    >
      <div className="star-wars-toggle switch" onClick={onChange}>
        <div className="track">
          <div className="lightsaber">
            <div className="light"></div>
            <div className="grip"></div>
            <div className="dark"></div>
          </div>
          <div className="thumb">
            <div className="side dark-side">
              <div className="circle">
                <div className="sub-circle"></div>
              </div>
            </div>
            <div className="side light-side">
              <div className="circle">
                <div className="sub-circle"></div>
              </div>
              <div className="top">
                <div className="left"></div>
                <div className="right"></div>
              </div>
              <div className="center">
                <div className="item-1"></div>
                <div className="item-2"></div>
                <div className="item-3"></div>
                <div className="item-4"></div>
                <div className="item-5"></div>
              </div>
              <div className="bottom">
                <div className="line"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
