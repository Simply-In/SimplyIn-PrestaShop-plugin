import { defineConfig } from 'vite'
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import react from '@vitejs/plugin-react'
import { copy } from 'vite-plugin-copy'

export default defineConfig({
	plugins: [react(), cssInjectedByJsPlugin(), copy({
		targets: [
			{ src: './src/index.php', dest: 'dist' }
		]
	})],


	build: {
		assetsInlineLimit: 4096,
		outDir: 'dist',
		emptyOutDir: true,
		rollupOptions: {
			input: 'src/index.tsx',
			output: {
				entryFileNames: 'bundle.js',
			},
		},
		minify: false,
	},
	publicDir: 'src/public'
})
