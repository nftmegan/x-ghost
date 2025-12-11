// src/utils/helpers.js

export const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Uniform Random (Good for simple things)
export const random = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

// Gaussian Random (Bell Curve - PERFECT for Human behavior)
// Most results will be near the middle (mean), with rare fast/slow outliers.
export const randomGaussian = (min, max, skew = 1) => {
    let u = 0, v = 0;
    while(u === 0) u = Math.random(); 
    while(v === 0) v = Math.random();
    let num = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    
    num = num / 10.0 + 0.5; // Translate to 0 -> 1
    if (num > 1 || num < 0) num = randomGaussian(min, max, skew); // resample between 0 and 1 if out of range
    num = Math.pow(num, skew); // Skew
    num *= max - min; // Stretch to fill range
    num += min; // offset to min
    return Math.floor(num);
}

export const getElementCenter = (el) => {
    const rect = el.getBoundingClientRect();
    return {
        x: rect.left + (rect.width / 2),
        y: rect.top + (rect.height / 2)
    };
};