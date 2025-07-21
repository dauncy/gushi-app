import { cn } from "@/lib/utils";
import * as React from "react";
import { TextInput, TextInputProps } from "react-native";

const Input = React.forwardRef<TextInput, TextInputProps & { className?: string /* <- from nativewind */ }>(
	function Input({ className, placeholderClassName, ...props }, ref) {
		return (
			<TextInput
				ref={ref}
				className={cn(
					"h-10 native:h-12 web:w-full rounded-md border border-input bg-background px-3 web:py-2 text-base lg:text-sm native:text-lg text-foreground placeholder:text-muted-foreground web:ring-offset-background web:focus-visible:outline-none web:focus-visible:ring-2 web:focus-visible:ring-ring web:focus-visible:ring-offset-2",
					props.editable === false && "opacity-50 web:cursor-not-allowed",
					className,
				)}
				placeholderTextColor="#6b7280" /* tailwind's neutral‑500 as an example */
				{...props}
			/>
		);
	},
);

export { Input };
