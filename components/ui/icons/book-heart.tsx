import { BookHeart } from "lucide-react-native";
import { cssInterop } from "nativewind";
import React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";
import { iconWithClassName } from "./iconsWithClassName";

const StyledSvg = cssInterop(Svg, {
	className: {
		target: "style",
		nativeStyleToProp: {
			color: true,
			opacity: true,
		},
	},
});

iconWithClassName(BookHeart);
export { BookHeart };

export const BookHeartSelected = ({ width = 24, height = 24, size, ...props }: SvgProps & { size?: number }) => {
	let w = width || 24;
	let h = height || 24;
	if (size) {
		w = size;
		h = size;
	}
	return (
		<StyledSvg
			width={w}
			height={h}
			viewBox="0 0 24 24"
			fill="none"
			stroke="#fffbf3"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			{...props}
		>
			<Path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />
			<Path
				stroke="#fffbf3"
				fill="#fffbf3"
				d="M8.62 9.8A2.25 2.25 0 1 1 12 6.836a2.25 2.25 0 1 1 3.38 2.966l-2.626 2.856a.998.998 0 0 1-1.507 0z"
			/>
		</StyledSvg>
	);
};

export const BookHeartSelectedAlt = ({ width = 24, height = 24, size, ...props }: SvgProps & { size?: number }) => {
	let w = width || 24;
	let h = height || 24;
	if (size) {
		w = size;
		h = size;
	}
	return (
		<StyledSvg
			width={w}
			height={h}
			viewBox="0 0 24 24"
			fill="#fffbf3"
			stroke="#ff2d01"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			{...props}
		>
			<Path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />
			<Path
				stroke="#ff2d01"
				fill="#ff2d01"
				d="M8.62 9.8A2.25 2.25 0 1 1 12 6.836a2.25 2.25 0 1 1 3.38 2.966l-2.626 2.856a.998.998 0 0 1-1.507 0z"
			/>
		</StyledSvg>
	);
};
