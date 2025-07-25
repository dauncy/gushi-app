import { cn } from "@/lib/utils";
import * as React from "react";
import { TextInput, TextInputProps } from "react-native";

const Input = React.forwardRef<TextInput, TextInputProps & { className?: string /* <- from nativewind */ }>(
	function Input({ className, placeholderClassName, ...props }, ref) {
		return (
			<TextInput
				ref={ref}
				className={cn(
					"h-12 web:w-full flex items-center rounded-md border border-slate-500 bg-slate-800 px-3 web:py-2 text-lg text-slate-200 placeholder:text-slate-400 web:ring-offset-background web:focus-visible:outline-none web:focus-visible:ring-2 web:focus-visible:ring-ring web:focus-visible:ring-offset-2",
					props.editable === false && "opacity-50 web:cursor-not-allowed",
					className,
				)}
				{...props}
			/>
		);
	},
);

export { Input };
