import React from 'react';
import { NavLink } from 'react-router-dom';

const Navigation = () => {
    return (
        <nav style={{
            position: 'fixed',
            top: '40px',
            right: '40px',
            zIndex: 100,
            display: 'flex',
            gap: '20px',
            mixBlendMode: 'difference' // Ensure visibility on light/dark backgrounds
        }}>
            <StyleLink to="/" label="WHEEL" />
            <StyleLink to="/grid" label="GRID" />
            <StyleLink to="/logogrid" label="ZOOM" />
            <StyleLink to="/bloc" label="BLOC" />
            <StyleLink to="/blind" label="BLIND" />
        </nav>
    );
};

const StyleLink = ({ to, label }) => (
    <NavLink
        to={to}
        style={({ isActive }) => ({
            color: 'white',
            textDecoration: 'none',
            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
            fontWeight: isActive ? 'bold' : 'normal',
            fontSize: '0.9rem',
            letterSpacing: '2px',
            opacity: isActive ? 1 : 0.6,
            borderBottom: isActive ? '2px solid white' : 'none',
            paddingBottom: '5px',
            transition: 'opacity 0.2s',
            cursor: 'pointer'
        })}
    >
        {label}
    </NavLink>
);

export default Navigation;
