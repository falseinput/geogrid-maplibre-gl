import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript';

export default [
	{
		input: 'src/main.ts',
		external: ['maplibre-gl'],
		output: {
			file: 'dist/index.js',
			format: 'es'
		},
		plugins: [
			resolve(),
			typescript()
		]
	}
]
