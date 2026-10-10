import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';
import colors from 'tailwindcss/colors';

const gray = {
	50: 'hsl(216, 33%, 97%)',
	100: 'hsl(214, 15%, 91%)',
	200: 'hsl(210, 16%, 82%)',
	300: 'hsl(211, 13%, 65%)',
	400: 'hsl(211, 10%, 53%)',
	500: 'hsl(211, 12%, 43%)',
	600: 'hsl(209, 14%, 37%)',
	700: 'hsl(209, 18%, 30%)',
	800: 'hsl(209, 20%, 25%)',
	900: 'hsl(210, 24%, 16%)'
};

/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],

	darkMode: 'class',

	theme: {
		extend: {
			fontFamily: {
				sans: ['"IBM Plex Sans"', '"Roboto"', 'system-ui', 'sans-serif'],
				header: ['"IBM Plex Sans"', '"Roboto"', 'system-ui', 'sans-serif']
			},
			colors: {
				blurple: colors.blue[500],
				gray: gray,
				neutral: gray,
				primary: colors.blue,
				cyan: colors.cyan,
				dgrey: {
					950: 'hsl(210, 24%, 12%)',
					900: 'hsl(210, 24%, 16%)',
					800: 'hsl(209, 20%, 25%)',
					700: 'hsl(209, 18%, 30%)',
					600: 'hsl(209, 14%, 37%)',
					400: 'hsl(211, 10%, 53%)',
					300: 'hsl(211, 13%, 65%)',
					200: 'hsl(210, 16%, 82%)',
					100: 'hsl(214, 15%, 91%)'
				}
			},
			transitionDuration: {
				250: '250ms'
			}
		}
	},

	variants: {},

	plugins: [typography, forms]
};
