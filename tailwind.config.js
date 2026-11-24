// Material 3 Expressive-style theme: tonal green palette, large rounded shapes, flat surfaces.
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx}', './public/index.html'],
  theme: {
    extend: {
      colors: {
        emerald: { 50:'#eaf6ef',100:'#d3ede0',200:'#a8dcc2',300:'#7cc9a4',400:'#54b387',500:'#2f9b6c',600:'#1f7a54',700:'#17613f',800:'#124d33',900:'#0c3a26',950:'#07281a' },
        slate: { 50:'#eef4ef',100:'#e3ebe5',200:'#d3ddd6',300:'#b9c6bd',400:'#8a9890',500:'#66736b',600:'#4d5a52',700:'#38443d',800:'#232d27',900:'#161d19',950:'#0e1310' },
      },
      borderRadius: { lg: '14px', xl: '20px', '2xl': '28px', '3xl': '36px' },
      boxShadow: { sm: 'none', DEFAULT: 'none', md: 'none', lg: 'none', xl: 'none' },
    },
  },
  plugins: [],
};
