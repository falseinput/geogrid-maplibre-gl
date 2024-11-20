import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript';
import copy from 'rollup-plugin-copy'

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
			typescript(),
			copy({
				targets: [
				  { src: 'assets/geogrid.css', dest: 'dist' }
				]
			  })
		]
	}
]
