@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --primary: #1B3A5C;
  --accent: #E85D26;
  --accent2: #2E9E6B;
  --font-jakarta: 'Plus Jakarta Sans', sans-serif;
  --font-inter: 'Inter', sans-serif;
}

body {
  font-family: var(--font-inter);
}

h1, h2, h3, h4 {
  font-family: var(--font-jakarta);
}

/* Custom scrollbar */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: #F1F5F9; }
::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #94A3B8; }

/* Progress bar animation */
@keyframes progress-fill {
  from { width: 0%; }
}
.progress-fill { animation: progress-fill 0.6s ease-out forwards; }
