module.exports = {
  theme: {
    extend: {
      animation: {
        flash: 'flash 1s ease-in-out both',
      },
      keyframes: {
        flash: {
          '0%': { color: '#1a1b31' },
          '40%': { color: '#ffffff' },
          '100%': { color: '#1a1b31' },
        },
      },
    },
  },
};
