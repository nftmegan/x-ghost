// src/utils/helpers.js

export const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const random = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

export const randomGaussian = (min, max, skew = 1) => {
    let u = 0, v = 0;
    while(u === 0) u = Math.random(); 
    while(v === 0) v = Math.random();
    let num = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    
    num = num / 10.0 + 0.5;
    if (num > 1 || num < 0) num = randomGaussian(min, max, skew); 
    num = Math.pow(num, skew); 
    num *= max - min; 
    num += min; 
    return Math.floor(num);
}

export const getElementCenter = (el) => {
    const rect = el.getBoundingClientRect();
    return {
        x: rect.left + (rect.width / 2),
        y: rect.top + (rect.height / 2)
    };
};