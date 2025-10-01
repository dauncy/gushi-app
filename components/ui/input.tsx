import { cn } from "@/lib/utils";
import * as React from "react";
import { TextInput, TextInputProps } from "react-native";

const Input = React.forwardRef<TextInput, TextInputProps & { className?: string /* <- from nativewind */ }>(
	function Input({ className, placeholderClassName, ...props }, ref) {
		return (
			<TextInput
				ref={ref}
				className={cn(
					"h-12 web:w-full flex items-center rounded border-[0.5px] border-primary focus:border-2 focus:border-border bg-black/10 px-3 text-lg text-foreground placeholder:text-foreground/60",
					props.editable === false && "opacity-50 web:cursor-not-allowed",
					className,
				)}
				style={{
					fontSize: 16,
					lineHeight: 20,
				}}
				{...props}
			/>
		);
	},
);

export { Input };
