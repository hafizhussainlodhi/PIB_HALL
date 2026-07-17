import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
 plugins: [
 tailwindcss(),
 ],
})

// npm install -D tailwindcss @tailwindcss/vite