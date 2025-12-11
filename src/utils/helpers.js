export const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const random = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

export const getElementCenter = (el) => {
    const rect = el.getBoundingClientRect();
    return {
        x: rect.left + (rect.width / 2),
        y: rect.top + (rect.height / 2)
    };
};